// Envoi des newsletters (test ou campagne complète) via Resend.
import { validateAuth, createServiceClient, corsHeaders } from '../_shared/auth-helper.ts';
import { renderNewsletterHtml, renderNewsletterText } from '../_shared/newsletter-render.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEST = 10;
const BATCH = 100;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const b64url = (s: string) =>
  btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user, isAdmin, supabase, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;
    if (!isAdmin) return json({ error: 'Accès réservé aux administrateurs' }, 403);

    const payload = await req.json().catch(() => null);
    const campaignId = payload?.campaignId;
    const isTest = payload?.test === true;
    const testEmails: string[] = Array.isArray(payload?.testEmails) ? payload.testEmails : [];

    if (!UUID_RE.test(campaignId ?? '')) return json({ error: 'Campagne introuvable' }, 400);
    if (isTest) {
      if (!testEmails.length) return json({ error: 'Choisissez au moins une adresse de test' }, 400);
      if (testEmails.length > MAX_TEST) return json({ error: `${MAX_TEST} adresses de test maximum` }, 400);
      for (const e of testEmails) if (!EMAIL_RE.test(e)) return json({ error: `Adresse invalide : ${e}` }, 400);
    }

    const service = createServiceClient();
    const { data: campaign, error: campErr } = await service
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();
    if (campErr) console.error('[newsletter-send] lecture campagne:', campErr.message);
    if (!campaign) return json({ error: 'Campagne introuvable' }, 404);

    if (!campaign.objet?.trim()) return json({ error: "L'objet du message est requis" }, 400);
    if (!Array.isArray(campaign.blocks) || campaign.blocks.length === 0)
      return json({ error: 'La newsletter est vide : ajoutez au moins un bloc' }, 400);
    if (!isTest && campaign.statut === 'envoyee')
      return json({ error: 'Cette campagne a déjà été envoyée' }, 400);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromAddress =
      campaign.from_email ||
      Deno.env.get('NEWSLETTER_FROM_EMAIL') ||
      Deno.env.get('CARNET_FROM_EMAIL') ||
      Deno.env.get('FROM_EMAIL_ADDRESS');
    if (!resendApiKey || !fromAddress) return json({ error: "L'envoi d'emails n'est pas configuré" }, 500);

    const base = `${Deno.env.get('SUPABASE_URL')}/functions/v1/newsletter-track`;

    // --- Destinataires ---
    type Dest = { email: string; nom: string | null; profileId: string | null; token: string; recipientId?: string };
    let dests: Dest[] = [];

    if (isTest) {
      dests = testEmails.map((e) => ({
        email: e.trim().toLowerCase(),
        nom: null,
        profileId: null,
        token: 'test',
      }));
    } else {
      const aud = campaign.audience ?? {};
      const mode = aud.mode === 'selection' ? 'selection' : 'univers';
      const profileIds: string[] | null =
        mode === 'selection' && Array.isArray(aud.profileIds) && aud.profileIds.length ? aud.profileIds : null;
      if (mode === 'selection' && !profileIds) return json({ error: 'Aucun destinataire sélectionné' }, 400);

      // Même plafond de 1000 lignes côté RPC : on pagine l'audience.
      const audience: any[] = [];
      const AUD_PAGE = 1000;
      for (let from = 0; ; from += AUD_PAGE) {
        const { data: pageRows, error: audErr } = await supabase
          .rpc('get_newsletter_audience', {
            _univers: mode === 'selection' ? 'tous' : campaign.univers ?? 'tous',
            _profile_ids: profileIds,
          })
          .range(from, from + AUD_PAGE - 1);
        if (audErr) {
          console.error('[newsletter-send] audience:', audErr.message);
          return json({ error: "Impossible de constituer la liste des destinataires", details: audErr.message }, 500);
        }
        audience.push(...((pageRows as any[]) ?? []));
        if (!pageRows || (pageRows as any[]).length < AUD_PAGE) break;
      }
      const joignables = audience.filter((r: any) => r.email && !r.unsubscribed);
      if (!joignables.length) return json({ error: 'Aucun destinataire joignable pour ce ciblage' }, 400);

      const rows = joignables.map((r: any) => ({
        campaign_id: campaignId,
        profile_id: r.profile_id,
        email: r.email,
        nom: [r.prenom, r.nom].filter(Boolean).join(' ').trim() || null,
        statut: 'queued',
      }));
      const { error: upErr } = await service
        .from('newsletter_recipients')
        .upsert(rows, { onConflict: 'campaign_id,email', ignoreDuplicates: true });
      if (upErr) {
        console.error('[newsletter-send] upsert destinataires:', upErr.message);
        return json({ error: 'Impossible d’enregistrer la liste des destinataires', details: upErr.message }, 500);
      }

      // PostgREST plafonne à 1000 lignes : on pagine pour n'oublier personne.
      const recipients: any[] = [];
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data: pageRows, error: pageErr } = await service
          .from('newsletter_recipients')
          .select('id, email, nom, profile_id, token, sent_at')
          .eq('campaign_id', campaignId)
          .order('id')
          .range(from, from + PAGE - 1);
        if (pageErr) {
          console.error('[newsletter-send] lecture destinataires:', pageErr.message);
          return json({ error: 'Impossible de relire la liste des destinataires', details: pageErr.message }, 500);
        }
        recipients.push(...(pageRows ?? []));
        if (!pageRows || pageRows.length < PAGE) break;
      }

      dests = recipients
        .filter((r: any) => !r.sent_at)
        .map((r: any) => ({
          email: r.email,
          nom: r.nom,
          profileId: r.profile_id,
          token: r.token,
          recipientId: r.id,
        }));

      if (!dests.length) return json({ error: 'Tous les destinataires ont déjà reçu cette campagne' }, 400);

      await service
        .from('newsletter_campaigns')
        .update({ statut: 'envoi_en_cours', recipients_count: (recipients ?? []).length })
        .eq('id', campaignId);
    }

    // --- Rendu + envoi ---
    const subject = isTest ? `[TEST] ${campaign.objet}` : campaign.objet;
    const buildEmail = (d: Dest) => {
      const unsubscribeUrl = isTest ? `${base}/u/test` : `${base}/u/${d.token}`;
      const linkHref = (url: string) =>
        isTest ? url : `${base}/r/${d.token}?u=${b64url(url)}`;
      const html = renderNewsletterHtml({
        blocks: campaign.blocks,
        univers: campaign.univers ?? 'tous',
        preheader: campaign.preheader,
        unsubscribeUrl,
        linkHref,
      });
      const text = renderNewsletterText(campaign.blocks, unsubscribeUrl);
      return {
        from: `${campaign.from_name || 'La Fréquence du Vivant'} <${fromAddress}>`,
        to: [d.email],
        reply_to: campaign.reply_to || user?.email || undefined,
        subject,
        html,
        text,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        // Les étiquettes ne sont pas acceptées par l'envoi groupé de Resend :
        // on ne les met que sur l'envoi unitaire.
        ...(isTest ? {} : { tags: [{ name: 'campaign_id', value: String(campaignId).replace(/-/g, '') }] }),
      };
    };

    let sent = 0;
    const failures: Array<{ email: string; error: string }> = [];
    const messageIds: string[] = [];

    console.log(
      `[newsletter-send] campagne=${campaignId} test=${isTest} destinataires=${dests.length} expediteur=${fromAddress}`,
    );

    // Test : envoi unitaire (canal simple), qui accepte tous les champs.
    if (isTest) {
      for (const d of dests) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(buildEmail(d)),
        });
        const bodyText = await res.text();
        if (!res.ok) {
          console.error(`[newsletter-send] test ${d.email} — Resend ${res.status}: ${bodyText}`);
          failures.push({ email: d.email, error: `${res.status}: ${bodyText.slice(0, 250)}` });
          continue;
        }
        const id = (JSON.parse(bodyText || '{}') as any)?.id;
        console.log(`[newsletter-send] test ${d.email} accepté — id=${id}`);
        if (id) messageIds.push(id);
        sent += 1;
      }
      return json({
        ok: failures.length === 0,
        sent,
        failed: failures.length,
        from: fromAddress,
        messageIds,
        failures,
      });
    }

    for (let i = 0; i < dests.length; i += BATCH) {
      const chunk = dests.slice(i, i + BATCH);
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map(buildEmail)),
      });
      const bodyText = await res.text();
      if (!res.ok) {
        console.error(`[newsletter-send] Resend ${res.status}: ${bodyText}`);
        for (const d of chunk) failures.push({ email: d.email, error: `${res.status}: ${bodyText.slice(0, 200)}` });
        if (!isTest) {
          await service
            .from('newsletter_recipients')
            .update({ statut: 'failed', error: bodyText.slice(0, 300) })
            .in('id', chunk.map((d) => d.recipientId).filter(Boolean) as string[]);
        }
        continue;
      }
      const parsed = JSON.parse(bodyText || '{}');
      const ids: string[] = (parsed?.data ?? []).map((x: any) => x?.id);
      sent += chunk.length;
      if (!isTest) {
        const now = new Date().toISOString();
        await Promise.all(
          chunk.map((d, idx) =>
            service
              .from('newsletter_recipients')
              .update({ statut: 'sent', sent_at: now, resend_message_id: ids[idx] ?? null, error: null })
              .eq('id', d.recipientId),
          ),
        );
      }
      if (i + BATCH < dests.length) await new Promise((r) => setTimeout(r, 600));
    }

    if (!isTest) {
      const { count } = await service
        .from('newsletter_recipients')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .not('sent_at', 'is', null);
      await service
        .from('newsletter_campaigns')
        .update({
          statut: failures.length && sent === 0 ? 'arretee' : 'envoyee',
          sent_count: count ?? sent,
          sent_at: new Date().toISOString(),
        })
        .eq('id', campaignId);
    }

    console.log(`[newsletter-send] terminé — envoyés=${sent} échecs=${failures.length}`);
    return json({
      ok: failures.length === 0,
      sent,
      failed: failures.length,
      from: fromAddress,
      failures: failures.slice(0, 10),
    });
  } catch (e) {
    console.error('[newsletter-send] erreur:', (e as Error).message);
    return json({ error: "L'envoi a échoué", details: (e as Error).message }, 500);
  }
});

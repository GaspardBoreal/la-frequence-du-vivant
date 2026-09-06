// Envoi du Carnet de Terrain (PDF) par email via Resend, en style « Fréquence Jardin ».
import { validateAuth, createServiceClient, corsHeaders } from '../_shared/auth-helper.ts';
import {
  renderCarnetEmailHtml,
  renderCarnetEmailText,
  type CarnetEmailData,
} from '../_shared/frequence-jardin-email.ts';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_RECIPIENTS = 10;
const MAX_PDF_B64 = 11_000_000; // ~8 Mo binaires
const SITE_URL = 'https://la-frequence-du-vivant.com';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const maskEmail = (e: string) => {
  const [u, d] = e.split('@');
  if (!d) return '***';
  const head = u.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(1, u.length - 2))}@${d}`;
};

interface Payload {
  tourId: string;
  proprieteId: string;
  subject: string;
  body: string;
  profileIds: string[];
  emails: string[];
  pdfBase64: string;
  pdfFilename: string;
  proprieteNom: string;
  tourTitre: string;
  dateTour: string;
  dureeMin?: number | null;
  saison?: string | null;
  gestes: string[];
}

function validate(p: any): { ok: true; data: Payload } | { ok: false; error: string } {
  if (!p || typeof p !== 'object') return { ok: false, error: 'Requête invalide' };
  if (!UUID_RE.test(p.tourId ?? '')) return { ok: false, error: 'Tour introuvable' };
  if (!UUID_RE.test(p.proprieteId ?? '')) return { ok: false, error: 'Jardin introuvable' };
  if (typeof p.subject !== 'string' || !p.subject.trim() || p.subject.length > 200)
    return { ok: false, error: "L'objet est requis (200 caractères maximum)" };
  if (typeof p.body !== 'string' || p.body.length > 5000)
    return { ok: false, error: 'Le message est trop long (5000 caractères maximum)' };
  const profileIds: string[] = Array.isArray(p.profileIds) ? p.profileIds : [];
  const emails: string[] = Array.isArray(p.emails) ? p.emails : [];
  if (profileIds.some((id) => !UUID_RE.test(id))) return { ok: false, error: 'Destinataire invalide' };
  for (const e of emails) if (typeof e !== 'string' || !EMAIL_RE.test(e)) return { ok: false, error: `Adresse invalide : ${e}` };
  const total = profileIds.length + emails.length;
  if (total === 0) return { ok: false, error: 'Choisissez au moins un destinataire' };
  if (total > MAX_RECIPIENTS) return { ok: false, error: `10 destinataires maximum (${total} demandés)` };
  if (typeof p.pdfBase64 !== 'string' || p.pdfBase64.length < 100)
    return { ok: false, error: 'Le carnet PDF est manquant' };
  if (p.pdfBase64.length > MAX_PDF_B64) return { ok: false, error: 'Le carnet est trop volumineux pour un email' };
  if (typeof p.pdfFilename !== 'string' || !/^[\w.\-]{3,80}\.pdf$/.test(p.pdfFilename))
    return { ok: false, error: 'Nom de fichier invalide' };
  if (typeof p.proprieteNom !== 'string' || typeof p.tourTitre !== 'string' || typeof p.dateTour !== 'string')
    return { ok: false, error: 'Informations du tour incomplètes' };
  const gestes = Array.isArray(p.gestes) ? p.gestes.filter((g: unknown) => typeof g === 'string').slice(0, 40) : [];
  return {
    ok: true,
    data: {
      tourId: p.tourId,
      proprieteId: p.proprieteId,
      subject: p.subject.trim(),
      body: p.body,
      profileIds,
      emails: emails.map((e) => e.trim().toLowerCase()),
      pdfBase64: p.pdfBase64,
      pdfFilename: p.pdfFilename,
      proprieteNom: p.proprieteNom,
      tourTitre: p.tourTitre,
      dateTour: p.dateTour,
      dureeMin: typeof p.dureeMin === 'number' ? p.dureeMin : null,
      saison: typeof p.saison === 'string' ? p.saison : null,
      gestes,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user, supabase, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const parsed = validate(await req.json().catch(() => null));
    if (!parsed.ok) return json({ error: parsed.error }, 400);
    const d = parsed.data;

    // Accès au jardin (RLS côté client utilisateur)
    const { data: prop, error: propErr } = await supabase
      .from('proprietes')
      .select('id, nom')
      .eq('id', d.proprieteId)
      .maybeSingle();
    if (propErr) console.error('[send-carnet-terrain] propriete read error:', propErr.message);
    if (!prop) return json({ error: "Vous n'avez pas accès à ce jardin" }, 403);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    // Le carnet part du sous-domaine vérifié dans Resend (mail.la-frequence-du-vivant.com)
    const fromAddress =
      Deno.env.get('CARNET_FROM_EMAIL') || Deno.env.get('FROM_EMAIL_ADDRESS') || Deno.env.get('SMTP_FROM');
    if (!resendApiKey || !fromAddress) {
      return json({ error: "L'envoi d'emails n'est pas configuré sur le site" }, 500);
    }

    const service = createServiceClient();

    // Identité de l'expéditeur
    const { data: senderProfile } = await service
      .from('community_profiles')
      .select('nom, prenom')
      .eq('user_id', user.id)
      .maybeSingle();
    const senderName =
      [senderProfile?.prenom, senderProfile?.nom].filter(Boolean).join(' ').trim() || user.email || 'Un marcheur';

    // Résolution des adresses des marcheurs choisis (jamais exposées au navigateur)
    type Dest = { email: string; name: string; profileId?: string };
    const dests: Dest[] = [];
    const sansEmail: string[] = [];

    if (d.profileIds.length) {
      const { data: profiles } = await service
        .from('community_profiles')
        .select('id, user_id, nom, prenom')
        .in('id', d.profileIds);
      for (const p of profiles ?? []) {
        const name = [p.prenom, p.nom].filter(Boolean).join(' ').trim() || 'Marcheur';
        if (!p.user_id) {
          sansEmail.push(name);
          continue;
        }
        const { data: authUser } = await service.auth.admin.getUserById(p.user_id);
        const email = authUser?.user?.email;
        if (!email) {
          sansEmail.push(name);
          continue;
        }
        dests.push({ email: email.toLowerCase(), name, profileId: p.id });
      }
    }
    for (const e of d.emails) dests.push({ email: e, name: e });

    // Dédoublonnage
    const uniques = new Map<string, Dest>();
    for (const dest of dests) if (!uniques.has(dest.email)) uniques.set(dest.email, dest);
    const finalDests = [...uniques.values()].slice(0, MAX_RECIPIENTS);

    if (finalDests.length === 0) {
      return json(
        { error: "Aucun destinataire joignable : ces marcheurs n'ont pas d'adresse email connue." },
        400,
      );
    }

    const emailData: CarnetEmailData = {
      message: d.body,
      proprieteNom: d.proprieteNom || prop.nom || 'Le jardin',
      tourTitre: d.tourTitre,
      dateTour: d.dateTour,
      dureeMin: d.dureeMin,
      saison: d.saison,
      gestes: d.gestes,
      expediteur: senderName,
      siteUrl: SITE_URL,
      pieceJointe: d.pdfFilename,
    };
    const html = renderCarnetEmailHtml(emailData);
    const text = renderCarnetEmailText(emailData);

    const results: { email: string; name: string; ok: boolean; error?: string }[] = [];
    for (const dest of finalDests) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `Fréquence Jardin <${fromAddress}>`,
            to: [dest.email],
            reply_to: user.email ?? undefined,
            subject: d.subject,
            html,
            text,
            attachments: [{ filename: d.pdfFilename, content: d.pdfBase64 }],
          }),
        });
        if (!res.ok) {
          const detail = await res.text();
          console.error(`[send-carnet-terrain] Resend ${res.status}: ${detail}`);
          results.push({ email: dest.email, name: dest.name, ok: false, error: `${res.status}: ${detail.slice(0, 300)}` });
        } else {
          results.push({ email: dest.email, name: dest.name, ok: true });
        }
      } catch (e) {
        console.error('[send-carnet-terrain] envoi échoué:', (e as Error).message);
        results.push({ email: dest.email, name: dest.name, ok: false, error: (e as Error).message });
      }
      await new Promise((r) => setTimeout(r, 120));
    }

    const sent = results.filter((r) => r.ok);
    const status = sent.length === 0 ? 'failed' : sent.length === results.length ? 'sent' : 'partial';

    const { error: logErr } = await service.from('propriete_carnet_envois').insert({
      tour_id: d.tourId,
      propriete_id: d.proprieteId,
      sent_by: user.id,
      sent_by_name: senderName,
      subject: d.subject,
      body: d.body,
      recipients: results.map((r) => ({
        name: r.name === r.email ? maskEmail(r.email) : r.name,
        email_masked: maskEmail(r.email),
        ok: r.ok,
      })),
      recipient_count: sent.length,
      status,
      error: results.find((r) => !r.ok)?.error ?? null,
    });
    if (logErr) console.error('[send-carnet-terrain] historique non enregistré:', logErr.message);

    if (status === 'failed') {
      const detail = results[0]?.error ?? null;
      return json(
        {
          error: detail
            ? `L'envoi a échoué (motif du service d'emails : ${detail})`
            : "L'envoi a échoué",
          detail,
          status,
        },
        502,
      );
    }

    return json({
      status,
      sent: sent.length,
      failed: results.length - sent.length,
      sansEmail,
    });
  } catch (e) {
    console.error('[send-carnet-terrain] erreur inattendue:', (e as Error).message);
    return json({ error: "Une erreur inattendue est survenue pendant l'envoi" }, 500);
  }
});

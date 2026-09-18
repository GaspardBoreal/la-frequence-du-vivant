// Liens de suivi et désinscription des newsletters (accès public, sans session).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const service = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const SITE = 'https://la-frequence-du-vivant.com';

function page(title: string, message: string) {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#FAF8F3;font-family:Helvetica,Arial,sans-serif;color:#1B2420;">
<div style="max-width:520px;margin:12vh auto;padding:32px;background:#fff;border-radius:18px;">
<h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px;">${title}</h1>
<p style="font-size:16px;line-height:1.6;color:#4A555063;color:#4A5550;">${message}</p>
<p style="margin-top:24px;"><a href="${SITE}" style="color:#0D6B58;font-weight:600;">Retour à La Fréquence du Vivant</a></p>
</div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

function decodeUrl(v: string | null): string | null {
  if (!v) return null;
  try {
    const s = v.replace(/-/g, '+').replace(/_/g, '/');
    const url = decodeURIComponent(escape(atob(s + '='.repeat((4 - (s.length % 4)) % 4))));
    return /^https?:\/\//i.test(url) ? url : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean); // [newsletter-track, r|u, token]
  const kind = parts[1];
  const token = parts[2];

  if (!kind || !token) return page('Lien invalide', "Ce lien n'est plus valide.");

  const db = service();
  const { data: recipient } = await db
    .from('newsletter_recipients')
    .select('id, campaign_id, email, click_count')
    .eq('token', token)
    .maybeSingle();

  if (kind === 'r') {
    const target = decodeUrl(url.searchParams.get('u'));
    if (recipient) {
      const now = new Date().toISOString();
      await db
        .from('newsletter_recipients')
        .update({ statut: 'clicked', clicked_at: now, click_count: (recipient.click_count ?? 0) + 1 })
        .eq('id', recipient.id);
      await db.from('newsletter_events').insert({
        campaign_id: recipient.campaign_id,
        recipient_id: recipient.id,
        type: 'clicked',
        url: target,
        payload: { source: 'track' },
      });
    }
    return Response.redirect(target ?? SITE, 302);
  }

  if (kind === 'u') {
    if (!recipient) return page('Désinscription', 'Cette adresse ne figure plus dans nos envois.');
    const now = new Date().toISOString();
    await db.from('newsletter_unsubscribes').upsert(
      { email: recipient.email, campaign_id: recipient.campaign_id, motif: 'lien_email' },
      { onConflict: 'email' },
    );
    await db
      .from('newsletter_recipients')
      .update({ statut: 'unsubscribed', unsubscribed_at: now })
      .eq('id', recipient.id);
    await db.from('newsletter_events').insert({
      campaign_id: recipient.campaign_id,
      recipient_id: recipient.id,
      type: 'unsubscribed',
      payload: { source: 'track' },
    });
    return page(
      'Vous êtes désinscrit·e',
      "Vous ne recevrez plus nos lettres. Votre compte et vos observations restent intacts — vous pouvez nous réécrire à tout moment si c'était une erreur.",
    );
  }

  return page('Lien invalide', "Ce lien n'est plus valide.");
});

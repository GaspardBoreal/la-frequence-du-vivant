// Réception des évènements Resend (remis, ouvert, cliqué, erreur, plainte).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const service = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

/** Vérifie la signature Svix utilisée par Resend. */
async function verifySignature(req: Request, raw: string): Promise<boolean> {
  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET');
  if (!secret) {
    console.error('[newsletter-webhook] RESEND_WEBHOOK_SECRET absent');
    return false;
  }
  const id = req.headers.get('svix-id');
  const timestamp = req.headers.get('svix-timestamp');
  const signature = req.headers.get('svix-signature');
  if (!id || !timestamp || !signature) return false;

  // Rejette les rejeux de plus de 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${raw}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return signature
    .split(' ')
    .map((p) => p.split(',')[1])
    .some((s) => s === expected);
}

const TYPE_MAP: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'delayed',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const raw = await req.text();
  if (!(await verifySignature(req, raw))) {
    return new Response(JSON.stringify({ error: 'Signature invalide' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'Corps illisible' }), { status: 400 });
  }

  const type = TYPE_MAP[event?.type];
  const messageId = event?.data?.email_id ?? event?.data?.id;
  if (!type || !messageId) return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });

  const db = service();
  const { data: recipient } = await db
    .from('newsletter_recipients')
    .select('id, campaign_id, open_count, click_count')
    .eq('resend_message_id', messageId)
    .maybeSingle();

  if (!recipient) return new Response(JSON.stringify({ ok: true, unknown: true }), { status: 200 });

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {};
  switch (type) {
    case 'delivered':
      patch.delivered_at = now;
      patch.statut = 'delivered';
      break;
    case 'opened':
      patch.opened_at = now;
      patch.open_count = (recipient.open_count ?? 0) + 1;
      patch.statut = 'opened';
      break;
    case 'clicked':
      patch.clicked_at = now;
      patch.click_count = (recipient.click_count ?? 0) + 1;
      patch.statut = 'clicked';
      break;
    case 'bounced':
      patch.bounced_at = now;
      patch.statut = 'bounced';
      patch.error = event?.data?.reason ?? 'Adresse injoignable';
      break;
    case 'complained':
      patch.statut = 'complained';
      break;
    default:
      break;
  }
  if (Object.keys(patch).length) await db.from('newsletter_recipients').update(patch).eq('id', recipient.id);

  await db.from('newsletter_events').insert({
    campaign_id: recipient.campaign_id,
    recipient_id: recipient.id,
    type,
    url: event?.data?.click?.link ?? null,
    payload: event?.data ?? null,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

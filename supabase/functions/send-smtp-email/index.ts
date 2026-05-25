// Reusable SMTP email sender via denomailer
// Requires secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM (optional)
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Attachment {
  filename: string;
  content: string; // base64
  contentType?: string;
}

interface Payload {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
}

const toArr = (v?: string | string[]) =>
  v == null ? [] : Array.isArray(v) ? v : [v];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(p: any): { ok: true; data: Payload } | { ok: false; error: string } {
  if (!p || typeof p !== 'object') return { ok: false, error: 'Body invalide' };
  const recipients = toArr(p.to);
  if (recipients.length === 0) return { ok: false, error: '"to" requis' };
  for (const r of recipients) if (typeof r !== 'string' || !EMAIL_RE.test(r)) return { ok: false, error: `Email invalide: ${r}` };
  if (!p.subject || typeof p.subject !== 'string' || p.subject.length > 300) return { ok: false, error: '"subject" requis (≤300)' };
  if (!p.html && !p.text) return { ok: false, error: '"html" ou "text" requis' };
  for (const f of [p.from, p.replyTo]) {
    if (f && typeof f !== 'string') return { ok: false, error: 'from/replyTo invalide' };
  }
  for (const list of [p.cc, p.bcc]) {
    for (const e of toArr(list)) if (typeof e !== 'string' || !EMAIL_RE.test(e)) return { ok: false, error: `Email cc/bcc invalide: ${e}` };
  }
  if (p.attachments && !Array.isArray(p.attachments)) return { ok: false, error: 'attachments doit être un tableau' };
  return { ok: true, data: p as Payload };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Auth: require an authenticated user (anti-spam relay)
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authorization requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => null);
    const v = validate(body);
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const p = v.data;

    const host = Deno.env.get('SMTP_HOST');
    const portStr = Deno.env.get('SMTP_PORT');
    const username = Deno.env.get('SMTP_USER');
    const password = Deno.env.get('SMTP_PASSWORD');
    const defaultFrom = Deno.env.get('SMTP_FROM') ?? username;

    if (!host || !portStr || !username || !password) {
      console.error('[send-smtp-email] missing SMTP_* secrets');
      return new Response(JSON.stringify({ error: 'Configuration SMTP manquante' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const port = Number(portStr);
    const tls = port === 465; // implicit TLS for 465, STARTTLS otherwise

    const client = new SMTPClient({
      connection: { hostname: host, port, tls, auth: { username, password } },
    });

    const from = p.from ?? defaultFrom!;
    const recipients = toArr(p.to);

    try {
      await client.send({
        from,
        to: recipients,
        cc: toArr(p.cc),
        bcc: toArr(p.bcc),
        replyTo: p.replyTo,
        subject: p.subject,
        content: p.text ?? 'Voir version HTML',
        html: p.html,
        attachments: (p.attachments ?? []).map(a => ({
          filename: a.filename,
          content: a.content,
          encoding: 'base64' as const,
          contentType: a.contentType,
        })),
      });
    } finally {
      await client.close().catch(() => {});
    }

    console.log('[send-smtp-email] sent', { to: recipients, subject: p.subject, by: userData.user.id });
    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[send-smtp-email] error', e);
    return new Response(JSON.stringify({ error: (e as Error).message || 'Erreur SMTP' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

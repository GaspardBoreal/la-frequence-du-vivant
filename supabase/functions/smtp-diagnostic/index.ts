// Fonction de diagnostic SMTP (temporaire).
// Protégée par le secret SMTP_DIAG_TOKEN (header x-diag-token).
// Objectif : vérifier la connexion au serveur SMTP et l'envoi réel d'un email,
// et remonter l'erreur exacte le cas échéant.
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-diag-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const expected = Deno.env.get('SMTP_DIAG_TOKEN');
  if (!expected || req.headers.get('x-diag-token') !== expected) {
    return json({ error: 'Accès refusé' }, 401);
  }

  const host = Deno.env.get('SMTP_HOST');
  const portRaw = Deno.env.get('SMTP_PORT');
  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASSWORD');
  const from = Deno.env.get('SMTP_FROM') ?? user;

  const config = {
    host: host ?? null,
    port: portRaw ?? null,
    user: user ? `${user.slice(0, 3)}***@${user.split('@')[1] ?? '?'}` : null,
    passwordSet: !!pass,
    from: from ?? null,
  };

  if (!host || !portRaw || !user || !pass) {
    return json({ step: 'config', ok: false, error: 'Secrets SMTP incomplets', config }, 500);
  }

  const port = Number(portRaw);
  const body = await req.json().catch(() => ({}));
  const to = typeof body?.to === 'string' ? body.to : null;

  let client: SMTPClient | null = null;
  try {
    client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: port === 465,
        auth: { username: user, password: pass },
      },
    });

    if (!to) {
      // Test de connexion + authentification uniquement
      await client.close();
      return json({ step: 'connect', ok: true, message: 'Connexion et authentification SMTP réussies', config });
    }

    await client.send({
      from: from!,
      to,
      subject: 'Test diagnostic — La Fréquence du Vivant',
      content: "Test de diagnostic du circuit d'envoi d'emails. Si vous recevez ce message, le SMTP fonctionne.",
      html: "<p>Test de diagnostic du circuit d'envoi d'emails.</p><p>Si vous recevez ce message, le SMTP fonctionne.</p>",
    });
    await client.close();
    return json({ step: 'send', ok: true, message: `Email envoyé à ${to}`, config });
  } catch (e) {
    try { await client?.close(); } catch { /* ignore */ }
    const err = e as Error;
    return json({ step: 'smtp', ok: false, error: err?.message ?? String(e), name: err?.name, config }, 500);
  }
});

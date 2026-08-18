// Envoie l'email de bienvenue paramétrable lié à un QR code d'inscription
// à un événement. Le destinataire est toujours l'utilisateur authentifié.
import { validateAuth, createServiceClient, corsHeaders } from '../_shared/auth-helper.ts';

const stripDangerous = (html: string) =>
  html
    .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*iframe[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, isAdmin, errorResponse } = await validateAuth(req);
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const code = String(body?.code || '').trim();
    const kind = String(body?.kind || 'immediate');
    if (!code || !['immediate', 'reminder', 'test'].includes(kind)) {
      return new Response(JSON.stringify({ error: 'Paramètres invalides' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (kind === 'test' && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Réservé aux administrateurs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const admin = createServiceClient();

    const { data: link } = await admin
      .from('event_signup_links')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (!link) {
      return new Response(JSON.stringify({ error: 'Lien introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (kind !== 'test') {
      if (!link.is_active) {
        return new Response(JSON.stringify({ skipped: 'inactive' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return new Response(JSON.stringify({ skipped: 'expired' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      // Anti-doublon : une seule occurrence par (lien, marcheur, type d'envoi).
      const { error: dedupErr } = await admin
        .from('event_signup_emails')
        .insert({ link_id: link.id, user_id: user!.id, kind });
      if (dedupErr) {
        return new Response(JSON.stringify({ skipped: 'already_sent' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const { data: evt } = await admin
      .from('marche_events')
      .select('title, date_marche, lieu')
      .eq('id', link.event_id)
      .maybeSingle();

    const { data: profile } = await admin
      .from('community_profiles')
      .select('prenom')
      .eq('user_id', user!.id)
      .maybeSingle();

    const vars: Record<string, string> = {
      prenom: escapeHtml(profile?.prenom || ''),
      marche: escapeHtml(evt?.title || ''),
      date: evt?.date_marche
        ? new Date(evt.date_marche).toLocaleDateString('fr-FR', { dateStyle: 'long' })
        : '',
      lieu: escapeHtml(evt?.lieu || ''),
    };
    const fill = (s: string) =>
      s.replace(/\{\{\s*(prenom|marche|date|lieu)\s*\}\}/g, (_m, k) => vars[k] ?? '');

    const subject = fill(link.email_subject || `Votre inscription à « ${evt?.title ?? 'la marche'} »`);
    const inner = stripDangerous(fill(link.email_html || '<p>Votre inscription est enregistrée.</p>'));

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a2f28;">
        ${inner}
        <p style="font-size:15px;line-height:1.6;margin-top:24px;">
          <a href="https://la-frequence-du-vivant.com/marches-du-vivant/mon-espace" style="background:#0D6B58;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Accéder à mon espace</a>
        </p>
        <p style="font-size:13px;color:#6b7c75;margin-top:32px;">La Fréquence du Vivant</p>
      </div>`;

    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-smtp-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.get('authorization')!,
        apikey: Deno.env.get('SUPABASE_ANON_KEY')!,
      },
      body: JSON.stringify({
        to: user!.email,
        subject,
        html,
        text: subject,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('[event-signup-welcome] SMTP relay failed', res.status, detail);
      return new Response(JSON.stringify({ error: 'Envoi impossible', status: res.status, details: detail }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, kind }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[event-signup-welcome] unexpected', e);
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

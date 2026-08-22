import { renderToStaticMarkup } from 'npm:react-dom@18.3.1/server';
import { templates as fjTemplates } from '../_shared/email-templates/fj/index.tsx';
import { templates as lfdvTemplates } from '../_shared/email-templates/lfdv/index.tsx';
import { getSubject, ActionType } from '../_shared/email-templates/AuthEmail.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const validActions: ActionType[] = [
  'signup',
  'recovery',
  'magiclink',
  'invite',
  'email_change',
  'reauthentication',
];

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function getProjectRef(): string {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  return match ? match[1] : 'xzbunrtgbfbhinkzkzhf';
}

function generateConfirmationURL(emailData: Record<string, unknown>): string {
  const projectRef = getProjectRef();
  const baseUrl = `https://${projectRef}.supabase.co/auth/v1/verify`;
  const params = new URLSearchParams({
    token: String(emailData.token_hash || ''),
    type: String(emailData.email_action_type || ''),
    redirect_to: String(emailData.redirect_to || ''),
  });
  return `${baseUrl}?${params.toString()}`;
}

function getSiteUrl(redirectTo: string): string {
  try {
    return new URL(redirectTo).origin;
  } catch {
    return 'https://la-frequence-du-vivant.com';
  }
}

function parseSecret(secret: string): Uint8Array {
  let s = secret;
  if (s.startsWith('v1,')) s = s.slice(3);
  if (s.startsWith('whsec_')) s = s.slice(6);
  try {
    const binary = atob(s);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return new TextEncoder().encode(s);
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyWebhook(
  req: Request,
  secret: string
): Promise<Record<string, unknown>> {
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('Missing Svix headers');
  }

  const timestamp = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    throw new Error('Webhook timestamp too old');
  }

  const payload = await req.text();
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    parseSecret(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const sigBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedContent)
  );
  const expected = btoa(
    String.fromCharCode(...new Uint8Array(sigBuffer))
  );

  const provided = svixSignature
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('v1,'))
    .map((s) => s.slice(3));

  const valid = provided.some((sig) => timingSafeEqual(sig, expected));
  if (!valid) {
    throw new Error('Invalid webhook signature');
  }

  return JSON.parse(payload);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const hookSecret = Deno.env.get('AUTH_EMAIL_HOOK_SECRET');
    if (!hookSecret) {
      throw new Error('AUTH_EMAIL_HOOK_SECRET not configured');
    }
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    const fromAddress = Deno.env.get('FROM_EMAIL_ADDRESS');
    if (!fromAddress) {
      throw new Error('FROM_EMAIL_ADDRESS not configured');
    }

    const payload = await verifyWebhook(req, hookSecret);
    const { user, email_data: emailData } = payload as {
      user?: Record<string, unknown>;
      email_data?: Record<string, unknown>;
    };

    if (!user || !emailData) {
      throw new Error('Missing user or email_data');
    }

    const action = String(emailData.email_action_type || '') as ActionType;
    if (!validActions.includes(action)) {
      console.warn(`[auth-email-hook] Unsupported action: ${action}, skipping`);
      return jsonResponse({ sent: false, reason: 'unsupported_action' });
    }

    const userMetadata = (user.user_metadata || {}) as Record<string, unknown>;
    const brand = userMetadata.app === 'frequence-jardin' ? 'fj' : 'lfdv';
    const templates = brand === 'fj' ? fjTemplates : lfdvTemplates;
    const Template = templates[action];
    if (!Template) {
      throw new Error(`Template not found for ${brand}/${action}`);
    }

    const confirmationUrl = generateConfirmationURL(emailData);
    const redirectTo = String(emailData.redirect_to || '');
    const siteUrl = getSiteUrl(redirectTo);
    const siteName =
      brand === 'fj' ? 'Fréquence Jardin' : 'Les Marches du Vivant';
    const recipient = String(user.email || '');
    const newEmail = action === 'email_change' ? recipient : undefined;

    const element = Template({
      siteName,
      siteUrl,
      recipient,
      confirmationUrl,
      token: emailData.token ? String(emailData.token) : undefined,
      newEmail,
    });

    const html = renderToStaticMarkup(element);
    const subject = getSubject(brand, action);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: recipient,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend error ${res.status}: ${errText}`);
    }

    return jsonResponse({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[auth-email-hook] error:', message);
    return jsonResponse({ error: message }, 500);
  }
});

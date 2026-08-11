// Envoi d'une livraison de télémétrie factice, signée, vers iot-webhook-brad.
// Réservé aux administrateurs : sert à vérifier visuellement que la chaîne
// « passerelle → webhook → mesures » fonctionne, sans attendre le fournisseur.
import { validateAuth, createServiceClient, corsHeaders } from '../_shared/auth-helper.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function hmacHex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const { isAdmin, errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;
  if (!isAdmin) return json({ error: 'Réservé aux administrateurs' }, 403);

  let body: { capteur_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête illisible' }, 400);
  }
  if (!body.capteur_id || typeof body.capteur_id !== 'string') {
    return json({ error: 'capteur_id manquant' }, 400);
  }

  const service = createServiceClient();
  const { data: capteur, error: capteurError } = await service
    .from('iot_capteurs')
    .select('id, nom, serial_number, type:iot_types_capteurs(profondeurs_m)')
    .eq('id', body.capteur_id)
    .maybeSingle();

  if (capteurError) return json({ error: capteurError.message }, 500);
  if (!capteur) return json({ error: 'Capteur introuvable' }, 404);

  const secret = Deno.env.get('BRAD_WEBHOOK_SECRET') ?? '';
  if (!secret) return json({ error: 'BRAD_WEBHOOK_SECRET non configuré' }, 500);

  const at = new Date().toISOString();
  const depths: number[] = ((capteur as any).type?.profondeurs_m ?? [0.15]).map(Number);
  const measures: Record<string, { value: number; unit: string }> = {
    temperature: { value: Number((18 + Math.random() * 6).toFixed(2)), unit: '°C' },
    humidity: { value: Number((45 + Math.random() * 25).toFixed(2)), unit: '%' },
    luminosity: { value: Math.round(5000 + Math.random() * 20000), unit: 'lx' },
  };
  depths.forEach((d) => {
    measures[`soilMoisture${Math.round(d * 100)}`] = { value: Math.round(10 + Math.random() * 30), unit: '%' };
  });

  const payload = {
    event: 'probe.telemetry.updated',
    timestamp: at,
    probe: {
      serialNumber: capteur.serial_number,
      name: capteur.nom,
      batteryPercentage: 100,
      rssi: -70,
      snr: 9.5,
    },
    measures,
  };

  const raw = JSON.stringify(payload);
  const deliveryId = `test-${Date.now()}`;
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/iot-webhook-brad`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Brad-Delivery': deliveryId,
      'X-Brad-Event': 'probe.telemetry.updated',
      'X-Brad-Signature': `sha256=${await hmacHex(secret, raw)}`,
    },
    body: raw,
  });

  const result = await res.json().catch(() => ({}));

  // Les mesures de test sont marquées pour ne pas polluer les courbes réelles.
  if (res.ok) {
    await service.from('iot_mesures').update({ source: 'webhook_test' }).eq('capteur_id', capteur.id).eq('mesure_at', at);
  }

  return json({
    ok: res.ok,
    status: res.status,
    delivery_id: deliveryId,
    capteur: capteur.nom,
    serial_number: capteur.serial_number,
    result,
  }, res.ok ? 200 : 502);
});

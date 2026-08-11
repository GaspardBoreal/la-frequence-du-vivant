// Webhook de télémétrie Brad Technology.
// Public (Brad ne peut pas s'authentifier) mais protégé par signature HMAC-SHA256.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

/** Dictionnaire des grandeurs normalisées + conversion en unité SI/usage. */
type Norm = { grandeur: string; unite: string; convert: (v: number) => number; depth?: number };

const MAP: Record<string, Norm> = {
  temperature: { grandeur: 'air_temperature', unite: '°C', convert: (v) => v },
  airTemperature: { grandeur: 'air_temperature', unite: '°C', convert: (v) => v },
  humidity: { grandeur: 'air_humidity', unite: '%', convert: (v) => v },
  airHumidity: { grandeur: 'air_humidity', unite: '%', convert: (v) => v },
  soilTemperature: { grandeur: 'soil_temperature', unite: '°C', convert: (v) => v },
  soilMoisture: { grandeur: 'soil_moisture', unite: '%', convert: (v) => v },
  soilCapacitance: { grandeur: 'soil_capacitance', unite: 'V', convert: (v) => v / 1000 },
  dewPoint: { grandeur: 'dew_point', unite: '°C', convert: (v) => v },
  pressure: { grandeur: 'pressure', unite: 'Pa', convert: (v) => v * 100 },
  luminosity: { grandeur: 'luminosity', unite: 'lx', convert: (v) => v },
  infrared: { grandeur: 'infrared', unite: 'lx', convert: (v) => v },
  ultraviolet: { grandeur: 'uv_index', unite: 'index', convert: (v) => v },
  rainfall: { grandeur: 'rainfall', unite: 'mm', convert: (v) => v },
};

/** soilMoisture15 / temperature30 → profondeur en mètres. */
function parseKey(key: string): { base: string; depth?: number } {
  const m = key.match(/^([a-zA-Z]+?)(\d+)(cm)?$/);
  if (m && MAP[m[1]]) return { base: m[1], depth: Number(m[2]) / 100 };
  return { base: key };
}

async function hmacHex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const raw = await req.text();
  const deliveryId = req.headers.get('x-brad-delivery');
  const event = req.headers.get('x-brad-event');
  const signature = req.headers.get('x-brad-signature') ?? '';
  const secret = Deno.env.get('BRAD_WEBHOOK_SECRET') ?? '';

  const log = async (fields: Record<string, unknown>) => {
    await supabase.from('iot_webhook_deliveries').upsert(
      { fournisseur: 'brad', delivery_id: deliveryId, event, payload: safeParse(raw), ...fields },
      { onConflict: 'fournisseur,delivery_id', ignoreDuplicates: false },
    );
  };

  // 1. Signature
  let valid = false;
  if (secret) {
    const expected = 'sha256=' + (await hmacHex(secret, raw));
    valid = safeEqual(expected, signature.trim());
  }
  if (!valid) {
    await log({ signature_valid: false, error: 'Signature HMAC invalide' });
    return json({ error: 'Invalid signature' }, 401);
  }

  const payload = safeParse(raw);
  if (!payload || typeof payload !== 'object') {
    await log({ signature_valid: true, error: 'Payload illisible' });
    return json({ error: 'Invalid payload' }, 400);
  }

  const body = payload as any;
  const serial: string | undefined = body?.probe?.serialNumber;
  if (!serial) {
    await log({ signature_valid: true, error: 'serialNumber absent' });
    return json({ error: 'serialNumber missing' }, 400);
  }

  // 2. Déduplication
  if (deliveryId) {
    const { data: seen } = await supabase
      .from('iot_webhook_deliveries')
      .select('id')
      .eq('fournisseur', 'brad')
      .eq('delivery_id', deliveryId)
      .eq('signature_valid', true)
      .maybeSingle();
    if (seen) return json({ ok: true, duplicate: true });
  }

  // 3. Capteur
  const { data: capteur } = await supabase
    .from('iot_capteurs')
    .select('id, propriete_id')
    .eq('serial_number', serial)
    .maybeSingle();

  if (!capteur) {
    await log({ signature_valid: true, serial_number: serial, error: `Capteur inconnu : ${serial}` });
    return json({ error: 'Unknown probe', serial }, 404);
  }

  // 4. Mesures normalisées
  const at = body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString();
  const measures = (body.measures ?? {}) as Record<string, { value: number; unit?: string; depth?: number }>;
  const rows: Record<string, unknown>[] = [];
  for (const [key, m] of Object.entries(measures)) {
    if (m == null || typeof m.value !== 'number' || !Number.isFinite(m.value)) continue;
    const { base, depth } = parseKey(key);
    const norm = MAP[base];
    if (!norm) continue;
    rows.push({
      capteur_id: capteur.id,
      grandeur: norm.grandeur,
      valeur: norm.convert(m.value),
      unite: norm.unite,
      profondeur_m: m.depth ?? depth ?? null,
      mesure_at: at,
      source: 'webhook',
      raw: { key, ...m },
    });
  }

  if (rows.length) {
    const { error } = await supabase
      .from('iot_mesures')
      .upsert(rows, { onConflict: 'capteur_id,grandeur,profondeur_m,mesure_at', ignoreDuplicates: true });
    if (error) {
      await log({ signature_valid: true, serial_number: serial, capteur_id: capteur.id, error: error.message });
      return json({ error: error.message }, 500);
    }
  }

  // 5. État du capteur
  await supabase
    .from('iot_capteurs')
    .update({
      last_seen_at: at,
      battery_pct: typeof body.probe?.batteryPercentage === 'number' ? body.probe.batteryPercentage : undefined,
      rssi: typeof body.probe?.rssi === 'number' ? body.probe.rssi : undefined,
      snr: typeof body.probe?.snr === 'number' ? body.probe.snr : undefined,
    })
    .eq('id', capteur.id);

  await log({ signature_valid: true, serial_number: serial, capteur_id: capteur.id, mesures_count: rows.length, error: null });

  return json({ ok: true, inserted: rows.length });
});

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

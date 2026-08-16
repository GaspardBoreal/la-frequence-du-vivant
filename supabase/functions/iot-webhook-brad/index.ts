// Webhook de télémétrie Brad Technology.
// Public (Brad ne peut pas s'authentifier) mais protégé par signature HMAC-SHA256.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

/** Dictionnaire des grandeurs normalisées + conversion en unité SI/usage. */
type Norm = { grandeur: string; unite: string; convert: (v: number) => number };

const MAP: Record<string, Norm> = {
  temperature: { grandeur: 'air_temperature', unite: '°C', convert: (v) => v },
  airtemperature: { grandeur: 'air_temperature', unite: '°C', convert: (v) => v },
  humidity: { grandeur: 'air_humidity', unite: '%', convert: (v) => v },
  airhumidity: { grandeur: 'air_humidity', unite: '%', convert: (v) => v },
  relativehumidity: { grandeur: 'air_humidity', unite: '%', convert: (v) => v },
  soiltemperature: { grandeur: 'soil_temperature', unite: '°C', convert: (v) => v },
  soilmoisture: { grandeur: 'soil_moisture', unite: '%', convert: (v) => v },
  soilcapacitance: { grandeur: 'soil_capacitance', unite: 'V', convert: (v) => v / 1000 },
  dewpoint: { grandeur: 'dew_point', unite: '°C', convert: (v) => v },
  pressure: { grandeur: 'pressure', unite: 'Pa', convert: (v) => v * 100 },
  luminosity: { grandeur: 'luminosity', unite: 'lx', convert: (v) => v },
  infrared: { grandeur: 'infrared', unite: 'lx', convert: (v) => v },
  ultraviolet: { grandeur: 'uv_index', unite: 'index', convert: (v) => v },
  uvindex: { grandeur: 'uv_index', unite: 'index', convert: (v) => v },
  rainfall: { grandeur: 'rainfall', unite: 'mm', convert: (v) => v },
  precipitation: { grandeur: 'rainfall', unite: 'mm', convert: (v) => v },
  windspeed: { grandeur: 'wind_speed', unite: 'm/s', convert: (v) => v },
};

/** Bornes physiques de plausibilité : au-delà, la mesure est écartée. */
const BOUNDS: Record<string, [number, number]> = {
  soil_moisture: [0, 100],
  air_humidity: [0, 100],
  soil_temperature: [-40, 80],
  air_temperature: [-40, 80],
  dew_point: [-60, 60],
  pressure: [80_000, 115_000],
  luminosity: [0, 250_000],
  infrared: [0, 250_000],
  uv_index: [0, 20],
  rainfall: [0, 500],
  wind_speed: [0, 120],
  soil_capacitance: [0, 5],
};

/**
 * Table de normalisation des profondeurs annoncées par le fournisseur.
 * Brad a étiqueté un temps le capteur superficiel `_0cm` avant de basculer en
 * `_5cm` : les deux désignent le même capteur, à 5 cm. On les ramène donc à
 * 0,05 m pour que la courbe reste continue de part et d'autre du correctif.
 */
const DEPTH_ALIASES: { from: number; to: number }[] = [{ from: 0, to: 0.05 }];

function normalizeDepth(depth?: number): { depth?: number; alias?: { from: number; to: number } } {
  if (depth == null) return {};
  const alias = DEPTH_ALIASES.find((a) => Math.abs(a.from - depth) < 1e-9);
  return alias ? { depth: alias.to, alias } : { depth };
}

/**
 * `soilMoisture_15cm`, `soilMoisture15`, `soilTemperature_30cm`…
 * Le tiret bas est optionnel ; la profondeur est rendue en mètres.
 */
export function parseKey(key: string): { base: string; depth?: number } {
  const m = key.match(/^([a-zA-Z]+?)_?(\d+(?:\.\d+)?)(cm|mm|m)?$/);
  if (m) {
    const base = m[1].toLowerCase();
    if (MAP[base]) {
      const n = Number(m[2]);
      const unit = (m[3] ?? 'cm').toLowerCase();
      const depth = unit === 'm' ? n : unit === 'mm' ? n / 1000 : n / 100;
      return { base, depth };
    }
  }
  return { base: key.toLowerCase() };
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

/**
 * Normalise le bloc `measures` d'un payload Brad.
 * Règle anti-doublon : si une grandeur existe à la fois « à plat » et par
 * profondeur, seules les versions par profondeur sont conservées.
 */
export function normalizeMeasures(
  measures: Record<string, any>,
): {
  kept: any[];
  ignored: { key: string; reason: string; value?: unknown }[];
  normalized: { key: string; from: number; to: number }[];
} {
  const kept: any[] = [];
  const ignored: { key: string; reason: string; value?: unknown }[] = [];
  const normalized: { key: string; from: number; to: number }[] = [];

  const parsed = Object.entries(measures ?? {}).map(([key, m]) => ({ key, m, ...parseKey(key) }));
  const withDepth = new Set(parsed.filter((p) => p.depth != null && MAP[p.base]).map((p) => p.base));

  for (const p of parsed) {
    const { key, m, base, depth } = p as any;
    const value = typeof m === 'number' ? m : m?.value;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      ignored.push({ key, reason: 'valeur non numérique', value: m?.value ?? m });
      continue;
    }
    const norm = MAP[base];
    if (!norm) {
      ignored.push({ key, reason: 'grandeur inconnue', value });
      continue;
    }
    if (depth == null && withDepth.has(base)) {
      ignored.push({ key, reason: 'doublon sans profondeur', value });
      continue;
    }
    const converted = norm.convert(value);
    const b = BOUNDS[norm.grandeur];
    if (b && (converted < b[0] || converted > b[1])) {
      ignored.push({ key, reason: `valeur aberrante (hors ${b[0]}–${b[1]} ${norm.unite})`, value: converted });
      continue;
    }
    const rawDepth = (typeof m?.depth === 'number' ? m.depth : depth) ?? null;
    const { depth: finalDepth, alias } = normalizeDepth(rawDepth ?? undefined);
    if (alias) normalized.push({ key, from: alias.from, to: alias.to });
    kept.push({
      grandeur: norm.grandeur,
      valeur: converted,
      unite: norm.unite,
      profondeur_m: finalDepth ?? null,
      interpretation: typeof m?.interpretation === 'string' ? m.interpretation : null,
      raw: { key, ...(typeof m === 'object' && m ? m : { value }) },
    });
  }
  return { kept, ignored, normalized };

}

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
    // 422 : l'endpoint existe bien, c'est le contenu qui est inexploitable.
    return json({ error: 'Unprocessable payload' }, 422);
  }

  const body = payload as any;
  const serial: string | undefined = body?.probe?.serialNumber;
  if (!serial) {
    await log({ signature_valid: true, error: 'serialNumber absent' });
    return json({ error: 'serialNumber missing' }, 422);
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
    // 422 et non 404 : le endpoint est bon, c'est la sonde qui n'est pas enregistrée.
    return json({ error: 'Unknown probe (not registered)', serial }, 422);
  }

  // 4. Mesures normalisées
  const at = body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString();
  const { kept, ignored, normalized } = normalizeMeasures((body.measures ?? {}) as Record<string, any>);
  const rows = kept.map((m) => ({
    capteur_id: capteur.id,
    grandeur: m.grandeur,
    valeur: m.valeur,
    unite: m.unite,
    profondeur_m: m.profondeur_m,
    interpretation: m.interpretation,
    mesure_at: at,
    source: 'webhook',
    raw: m.raw,
  }));

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

  await log({
    signature_valid: true,
    serial_number: serial,
    capteur_id: capteur.id,
    mesures_count: rows.length,
    error: null,
    payload: { ...(payload as any), _lfdv: { kept: rows.length, ignored } },
  });

  return json({ ok: true, inserted: rows.length, ignored });
});

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

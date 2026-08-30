// Découverte du parc Weenat rattaché à une propriété : on interroge l'API avec
// la clé de l'intégration et on renvoie les appareils physiques et les parcelles
// (stations météo virtuelles) que l'administrateur pourra rattacher.
import { validateAuth, createServiceClient, corsHeaders } from '../_shared/auth-helper.ts';
import { listDevices, listPlots } from '../_shared/weenat.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const { isAdmin, errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;
  if (!isAdmin) return json({ error: 'Réservé aux administrateurs' }, 403);

  let body: { integration_id?: string; api_key?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corps de requête illisible' }, 400);
  }

  let apiKey = typeof body.api_key === 'string' ? body.api_key.trim() : '';

  if (!apiKey) {
    if (!body.integration_id) return json({ error: 'integration_id ou api_key requis' }, 400);
    const service = createServiceClient();
    const { data, error } = await service
      .from('iot_propriete_integrations')
      .select('api_key')
      .eq('id', body.integration_id)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data?.api_key) return json({ error: 'Intégration introuvable ou sans clé' }, 404);
    apiKey = data.api_key;
  }

  try {
    const [devices, plots] = await Promise.all([listDevices(apiKey), listPlots(apiKey)]);
    return json({
      devices: devices.map((d) => ({
        external_id: String(d.id),
        external_kind: 'device',
        serial_number: d.serial_number,
        model: d.model,
        model_label: d.model_label,
        metrics: d.available_metrics ?? [],
        lat: d.location?.[0] ?? null,
        lng: d.location?.[1] ?? null,
        location_text: d.location_text,
        last_seen_at: d.latest_measurement_broadcast,
      })),
      plots: plots.map((p) => ({
        external_id: String(p.id),
        external_kind: 'plot',
        nom: p.name,
        metrics: p.available_metrics ?? [],
        lat: p.location?.[0] ?? null,
        lng: p.location?.[1] ?? null,
        location_text: p.location_text,
        meteo_vision: !!p.meteo_vision,
        device_count: p.device_count ?? 0,
        organisation: p.organization?.name ?? null,
      })),
    });
  } catch (e) {
    console.error('[iot-weenat-discover]', e);
    return json({ error: e instanceof Error ? e.message : 'Échec de la découverte Weenat' }, 502);
  }
});

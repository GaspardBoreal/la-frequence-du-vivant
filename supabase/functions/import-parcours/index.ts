import { validateAuth, corsHeaders, forbiddenResponse, createServiceClient } from '../_shared/auth-helper.ts';

/**
 * Import d'un parcours complet (KML / KMZ / GPX parsé côté navigateur) :
 *   exploration → marches → exploration_marches → marche_events (+ waypoints).
 *
 * Écriture séquentielle avec rollback explicite : en cas d'échec, tout ce qui a
 * été créé est supprimé dans l'ordre inverse et l'erreur précise est renvoyée.
 */

const EVENT_TYPES = ['agroecologique', 'eco_poetique', 'eco_tourisme'];
const EXPLORATION_TYPES = ['agroecologique', 'eco_poetique', 'eco_tourisme'];

interface StepInput {
  name: string;
  ville?: string;
  description?: string;
  lat: number;
  lng: number;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const slugify = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

function validate(payload: any): { errors: string[]; value?: any } {
  const errors: string[] = [];
  const exploration = payload?.exploration ?? {};
  const event = payload?.event ?? {};
  const steps: StepInput[] = Array.isArray(payload?.steps) ? payload.steps : [];

  if (typeof exploration.name !== 'string' || exploration.name.trim().length < 2) {
    errors.push("Le nom de l'exploration est requis.");
  }
  if (exploration.exploration_type && !EXPLORATION_TYPES.includes(exploration.exploration_type)) {
    errors.push("Type d'exploration invalide.");
  }
  if (typeof event.title !== 'string' || event.title.trim().length < 2) {
    errors.push("Le titre de l'événement est requis.");
  }
  if (typeof event.date_marche !== 'string' || Number.isNaN(Date.parse(event.date_marche))) {
    errors.push("La date de l'événement est requise.");
  }
  if (event.event_type && !EVENT_TYPES.includes(event.event_type)) {
    errors.push("Type d'événement invalide.");
  }
  if (steps.length === 0) {
    errors.push('Aucune étape à importer.');
  }
  if (steps.length > 300) {
    errors.push('Trop d’étapes (maximum 300 par import).');
  }
  steps.forEach((s, i) => {
    if (!Number.isFinite(s?.lat) || Math.abs(s.lat) > 90 || !Number.isFinite(s?.lng) || Math.abs(s.lng) > 180) {
      errors.push(`Coordonnées invalides pour l'étape ${i + 1}.`);
    }
    if (typeof s?.name !== 'string' || !s.name.trim()) {
      errors.push(`Nom manquant pour l'étape ${i + 1}.`);
    }
  });

  if (errors.length) return { errors };
  return { errors: [], value: { exploration, event, steps, waypoints: Array.isArray(payload?.waypoints) ? payload.waypoints : [] } };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const { isAdmin, errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;
  if (!isAdmin) return forbiddenResponse("Accès administrateur requis pour l'import d'un parcours");

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Corps de requête illisible.' }, 400);
  }

  const { errors, value } = validate(payload);
  if (errors.length) return json({ error: errors.join(' ') }, 400);

  const { exploration, event, steps, waypoints } = value;
  const supabase = createServiceClient();

  // Rollback trail
  const createdMarcheIds: string[] = [];
  let explorationId: string | null = null;
  let eventId: string | null = null;

  const rollback = async () => {
    try {
      if (eventId) await supabase.from('marche_events').delete().eq('id', eventId);
      if (explorationId) await supabase.from('exploration_marches').delete().eq('exploration_id', explorationId);
      if (createdMarcheIds.length) await supabase.from('marches').delete().in('id', createdMarcheIds);
      if (explorationId) await supabase.from('explorations').delete().eq('id', explorationId);
    } catch (e) {
      console.error('[import-parcours] rollback failed:', e);
    }
  };

  try {
    // 1. Slug d'exploration unique
    const base = slugify(exploration.name) || `parcours-${Date.now()}`;
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const { data: existing } = await supabase.from('explorations').select('id').eq('slug', slug).maybeSingle();
      if (!existing) break;
      slug = `${base}-${i}`;
    }

    const { data: expRow, error: expErr } = await supabase
      .from('explorations')
      .insert({
        name: exploration.name.trim(),
        slug,
        description: exploration.description?.trim() || null,
        exploration_type: exploration.exploration_type || null,
        default_radius_m: Number.isFinite(exploration.default_radius_m) ? exploration.default_radius_m : null,
        is_loop: !!exploration.is_loop,
        published: !!exploration.published,
      })
      .select('id, slug')
      .single();
    if (expErr) throw new Error(`Création de l'exploration : ${expErr.message}`);
    explorationId = expRow.id;

    // 2. Marches + liaisons
    const eventDate = new Date(event.date_marche);
    const dateOnly = eventDate.toISOString().slice(0, 10);

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const { data: marcheRow, error: marcheErr } = await supabase
        .from('marches')
        .insert({
          nom_marche: s.name.trim(),
          ville: (s.ville || '').trim() || 'Inconnue',
          date: dateOnly,
          latitude: s.lat,
          longitude: s.lng,
          coordonnees: `(${s.lng},${s.lat})`,
          descriptif_court: s.description?.trim()?.slice(0, 2000) || null,
        })
        .select('id')
        .single();
      if (marcheErr) throw new Error(`Création de la marche « ${s.name} » : ${marcheErr.message}`);
      createdMarcheIds.push(marcheRow.id);

      const { error: linkErr } = await supabase.from('exploration_marches').insert({
        exploration_id: explorationId,
        marche_id: marcheRow.id,
        ordre: i + 1,
        publication_status: 'published_public',
      });
      if (linkErr) throw new Error(`Liaison de la marche « ${s.name} » : ${linkErr.message}`);
    }

    // 3. Événement
    const lat = steps.reduce((a: number, s: StepInput) => a + s.lat, 0) / steps.length;
    const lng = steps.reduce((a: number, s: StepInput) => a + s.lng, 0) / steps.length;

    let publicSlug: string | null = null;
    if (event.is_public) {
      const { data: slugData, error: slugErr } = await supabase.rpc('generate_event_public_slug', {
        _title: event.title,
        _date: dateOnly,
      });
      if (slugErr) throw new Error(`Génération du lien public : ${slugErr.message}`);
      publicSlug = slugData as string;
    }

    const { data: evtRow, error: evtErr } = await supabase
      .from('marche_events')
      .insert({
        title: event.title.trim(),
        description: event.description?.trim() || null,
        date_marche: eventDate.toISOString(),
        lieu: event.lieu?.trim() || null,
        latitude: lat,
        longitude: lng,
        event_type: event.event_type || 'agroecologique',
        category: event.category || 'autre',
        exploration_id: explorationId,
        is_public: !!event.is_public,
        public_slug: publicSlug,
      })
      .select('id, public_slug')
      .single();
    if (evtErr) throw new Error(`Création de l'événement : ${evtErr.message}`);
    eventId = evtRow.id;

    // 4. Waypoints optionnels (points du tracé non retenus comme étapes)
    let waypointsInserted = 0;
    if (waypoints.length > 0) {
      const rows = waypoints
        .filter((w: any) => Number.isFinite(w?.lat) && Number.isFinite(w?.lng))
        .slice(0, 1000)
        .map((w: any, i: number) => ({
          marche_event_id: eventId,
          after_marche_id: createdMarcheIds[Math.min(w.afterIndex ?? 0, createdMarcheIds.length - 1)],
          ordre: i + 1,
          latitude: w.lat,
          longitude: w.lng,
          label: w.label || null,
          include_in_biodiversity: false,
        }));
      if (rows.length > 0) {
        const { error: wpErr } = await supabase.from('exploration_waypoints').insert(rows);
        if (wpErr) throw new Error(`Création des waypoints : ${wpErr.message}`);
        waypointsInserted = rows.length;
      }
    }

    console.log(
      `[import-parcours] exploration=${explorationId} marches=${createdMarcheIds.length} event=${eventId} waypoints=${waypointsInserted}`,
    );

    return json({
      success: true,
      exploration: { id: explorationId, slug: expRow.slug, name: exploration.name.trim() },
      event: { id: eventId, public_slug: evtRow.public_slug },
      marcheIds: createdMarcheIds,
      counts: { marches: createdMarcheIds.length, waypoints: waypointsInserted },
    });
  } catch (e: any) {
    console.error('[import-parcours] échec:', e?.message || e);
    await rollback();
    return json({ error: e?.message || "Erreur lors de l'import du parcours.", rolledBack: true }, 500);
  }
});

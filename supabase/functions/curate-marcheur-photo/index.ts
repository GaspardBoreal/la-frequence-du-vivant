// Validation humaine d'une suggestion IA → crée marcheur_observations (source=manual_mdv)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await userClient.rpc("check_is_admin_user", { check_user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    const {
      mediaId, mediaIds, action,
      scientificName, commonNameFr, kingdom, iconicTaxon, aiConfidence,
      useTopSuggestion,
      marcheurUserId,   // user_id du marcheur à attribuer (OBLIGATOIRE pour validate)
      marcheId,         // override optionnel
    } = body;

    if (!action || (!mediaId && !Array.isArray(mediaIds))) {
      return new Response(JSON.stringify({ error: "mediaId|mediaIds + action requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids: string[] = mediaId ? [mediaId] : mediaIds;
    const results: Array<{ id: string; ok: boolean; reason?: string; warning?: string }> = [];

    for (const id of ids) {
      try {
        const { data: media, error: mErr } = await supabase
          .from("marcheur_medias")
          .select("id, url_fichier, external_url, metadata, marche_id, marche_event_id, attributed_marcheur_id")
          .eq("id", id)
          .single();
        if (mErr || !media) { results.push({ id, ok: false, reason: "not_found" }); continue; }

        if (action === "unidentifiable") {
          await supabase
            .from("marcheur_medias")
            .update({ ai_status: "unidentifiable", ai_processed_at: new Date().toISOString() })
            .eq("id", id);
          results.push({ id, ok: true });
          continue;
        }

        if (action !== "validate") { results.push({ id, ok: false, reason: "unknown_action" }); continue; }

        // ── VALIDATE ─────────────────────────────────────────────
        // 1. Récupère la suggestion top si demandée
        let sci = scientificName;
        let fr = commonNameFr;
        let king = kingdom;
        let iconic = iconicTaxon;
        let conf = typeof aiConfidence === "number" ? aiConfidence : null;
        if (useTopSuggestion || !sci) {
          const { data: top } = await supabase
            .from("marcheur_photo_ai_suggestions")
            .select("taxon_scientific_name, taxon_common_name_fr, kingdom, confidence")
            .eq("media_id", id).order("rank").limit(1).maybeSingle();
          if (top) {
            sci = sci || top.taxon_scientific_name;
            fr = fr || top.taxon_common_name_fr;
            king = king || top.kingdom;
            conf = conf ?? top.confidence;
          }
        }
        if (!sci) { results.push({ id, ok: false, reason: "no_species" }); continue; }

        const effectiveMarcheId = marcheId || media.marche_id;
        if (!effectiveMarcheId) { results.push({ id, ok: false, reason: "no_marche" }); continue; }

        // 2. Résout l'exploration_id depuis le marche_event
        const { data: ev } = await supabase
          .from("marche_events").select("exploration_id").eq("id", media.marche_event_id).maybeSingle();
        if (!ev?.exploration_id) { results.push({ id, ok: false, reason: "no_exploration" }); continue; }

        // 3. Détermine le marcheur attribué
        let crewId: string | null = null;
        if (marcheurUserId) {
          const { data: crewRpc, error: crewErr } = await supabase.rpc("ensure_exploration_marcheur", {
            p_user_id: marcheurUserId, p_exploration_id: ev.exploration_id,
          });
          if (crewErr) { results.push({ id, ok: false, reason: `crew: ${crewErr.message}` }); continue; }
          crewId = crewRpc as string;
        } else if (media.attributed_marcheur_id) {
          crewId = media.attributed_marcheur_id;
        } else {
          results.push({ id, ok: false, reason: "marcheur_required" });
          continue;
        }

        // 4. Distance photo↔marche (warning seul)
        const meta: any = media.metadata || {};
        const gps = meta.gps || {};
        const lat = typeof gps.latitude === "number" ? gps.latitude : null;
        const lng = typeof gps.longitude === "number" ? gps.longitude : null;
        let warning: string | undefined;
        if (lat != null && lng != null) {
          const { data: m } = await supabase
            .from("marches").select("latitude, longitude, radius_m").eq("id", effectiveMarcheId).maybeSingle();
          if (m?.latitude && m?.longitude) {
            const d = haversineM(lat, lng, Number(m.latitude), Number(m.longitude));
            const r = m.radius_m || 500;
            if (d > r) warning = `out_of_radius:${Math.round(d)}m>${r}m`;
          }
        }

        const url = media.url_fichier || media.external_url;
        const obsDate = (meta?.date_taken || new Date().toISOString()).slice(0, 10);

        // 5. Insert observation
        const { error: insErr } = await supabase.from("marcheur_observations").insert({
          marcheur_id: crewId,
          marche_id: effectiveMarcheId,
          species_scientific_name: sci,
          taxon_common_name_fr: fr,
          kingdom: king,
          iconic_taxon: iconic,
          observation_date: obsDate,
          photo_url: url,
          latitude: lat,
          longitude: lng,
          gps_source: gps.source || "exif",
          source: "manual_mdv",
          curated_by_user_id: user.id,
          curated_at: new Date().toISOString(),
          source_media_id: id,
          ai_confidence: conf,
          notes: `Identification manuelle Marches Du Vivant${fr ? ` — ${fr}` : ""}${warning ? ` [${warning}]` : ""}`,
        });
        if (insErr) { results.push({ id, ok: false, reason: insErr.message }); continue; }

        // 6. Update média
        await supabase
          .from("marcheur_medias")
          .update({
            ai_status: "validated_by_human",
            ai_processed_at: new Date().toISOString(),
            attributed_marcheur_id: crewId,
          })
          .eq("id", id);

        results.push({ id, ok: true, warning });
      } catch (e: any) {
        results.push({ id, ok: false, reason: e?.message || String(e) });
      }
    }

    return new Response(JSON.stringify({
      ok: true, results,
      count: results.filter(r => r.ok).length,
      warnings: results.filter(r => r.warning).length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("[curate] fatal", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

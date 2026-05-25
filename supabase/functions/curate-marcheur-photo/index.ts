// Validation humaine d'une suggestion IA → crée/met à jour marcheur_observations
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await userClient.rpc("check_is_admin_user", {
      check_user_id: user.id,
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json();
    const { mediaId, mediaIds, action, scientificName, commonNameFr, useTopSuggestion } = body;

    if (!action || (!mediaId && !Array.isArray(mediaIds))) {
      return new Response(JSON.stringify({ error: "mediaId|mediaIds + action requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids: string[] = mediaId ? [mediaId] : mediaIds;
    const results: Array<{ id: string; ok: boolean; reason?: string }> = [];

    for (const id of ids) {
      try {
        const { data: media, error: mErr } = await supabase
          .from("marcheur_medias")
          .select("id, url_fichier, external_url, metadata, marche_id, attributed_marcheur_id")
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

        if (action === "validate") {
          let sci = scientificName;
          let fr = commonNameFr;
          if (useTopSuggestion || (!sci && ids.length > 1)) {
            const { data: top } = await supabase
              .from("marcheur_photo_ai_suggestions")
              .select("taxon_scientific_name, taxon_common_name_fr")
              .eq("media_id", id)
              .order("rank")
              .limit(1)
              .maybeSingle();
            if (top) { sci = top.taxon_scientific_name; fr = top.taxon_common_name_fr; }
          }
          if (!sci) { results.push({ id, ok: false, reason: "no_species" }); continue; }

          const url = media.url_fichier || media.external_url;
          const meta: any = media.metadata || {};
          const gps = meta.gps || {};
          const lat = typeof gps.latitude === "number" ? gps.latitude : null;
          const lng = typeof gps.longitude === "number" ? gps.longitude : null;

          if (media.marche_id) {
            await supabase.from("marcheur_observations").insert({
              marcheur_id: media.attributed_marcheur_id || null,
              marche_id: media.marche_id,
              species_scientific_name: sci,
              observation_date: (meta?.date_taken || new Date().toISOString()).slice(0, 10),
              photo_url: url,
              latitude: lat,
              longitude: lng,
              gps_source: gps.source || "exif",
              notes: `Identification IA validée par curateur${fr ? ` — ${fr}` : ""}`,
            });
          }
          await supabase
            .from("marcheur_medias")
            .update({ ai_status: "validated_by_human", ai_processed_at: new Date().toISOString() })
            .eq("id", id);
          results.push({ id, ok: true });
          continue;
        }

        results.push({ id, ok: false, reason: "unknown_action" });
      } catch (e: any) {
        results.push({ id, ok: false, reason: e?.message || String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results, count: results.filter(r => r.ok).length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[curate] fatal", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

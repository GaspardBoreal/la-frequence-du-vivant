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
    const { mediaId, action, scientificName, commonNameFr } = body;

    if (!mediaId || !action) {
      return new Response(JSON.stringify({ error: "mediaId + action requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: media, error: mErr } = await supabase
      .from("marcheur_medias")
      .select("id, url_fichier, external_url, metadata, marche_id, attributed_marcheur_id")
      .eq("id", mediaId)
      .single();
    if (mErr || !media) {
      return new Response(JSON.stringify({ error: "Media introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unidentifiable") {
      await supabase
        .from("marcheur_medias")
        .update({ ai_status: "unidentifiable", ai_processed_at: new Date().toISOString() })
        .eq("id", mediaId);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "validate") {
      if (!scientificName) {
        return new Response(JSON.stringify({ error: "scientificName requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const url = media.url_fichier || media.external_url;
      const meta: any = media.metadata || {};
      const gps = meta.gps || {};
      const lat = typeof gps.latitude === "number" ? gps.latitude : null;
      const lng = typeof gps.longitude === "number" ? gps.longitude : null;

      if (media.marche_id) {
        await supabase.from("marcheur_observations").insert({
          marcheur_id: media.attributed_marcheur_id || null,
          marche_id: media.marche_id,
          species_scientific_name: scientificName,
          observation_date: (meta?.date_taken || new Date().toISOString()).slice(0, 10),
          photo_url: url,
          latitude: lat,
          longitude: lng,
          gps_source: gps.source || "exif",
          notes: `Identification IA validée par curateur${commonNameFr ? ` — ${commonNameFr}` : ""}`,
        });
      }

      await supabase
        .from("marcheur_medias")
        .update({ ai_status: "validated_by_human", ai_processed_at: new Date().toISOString() })
        .eq("id", mediaId);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue" }), {
      status: 400,
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

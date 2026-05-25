// Reconnaissance IA des photos marcheurs
// - Pré-tri Gemini (plante/animal/champignon/inconnu)
// - Plantes → Pl@ntNet v2
// - Faune / champignons → Lovable AI Gemini structured output
// - Routing par seuils configurables sur marche_events.ai_recognition_config
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLANTNET_KEY = Deno.env.get("PLANTNET_API_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Suggestion = {
  rank: number;
  taxon_scientific_name: string;
  taxon_common_name_fr: string | null;
  kingdom: string | null;
  confidence: number;
  ai_provider: "plantnet" | "gemini";
  raw_response?: unknown;
};

interface Config {
  auto_threshold: number;
  curation_threshold: number;
  plant_provider: "plantnet" | "gemini";
  fauna_provider: "plantnet" | "gemini";
  plantnet_project: string;
}

const DEFAULT_CONFIG: Config = {
  auto_threshold: 0.85,
  curation_threshold: 0.6,
  plant_provider: "plantnet",
  fauna_provider: "gemini",
  plantnet_project: "weurope",
};

// --- Gemini pré-tri : règne de la photo ---
async function geminiKingdomPretri(imageUrl: string): Promise<string> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Réponds par UN SEUL mot parmi : plante, animal, champignon, paysage, inconnu. Quel est le sujet principal de cette photo ?",
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });
    const data = await res.json();
    const text = (data?.choices?.[0]?.message?.content || "").toLowerCase().trim();
    if (text.includes("plante")) return "plante";
    if (text.includes("champignon")) return "champignon";
    if (text.includes("animal")) return "animal";
    if (text.includes("paysage")) return "paysage";
    return "inconnu";
  } catch (e) {
    console.error("[gemini-pretri]", e);
    return "inconnu";
  }
}

// --- Pl@ntNet identify ---
async function plantnetIdentify(
  imageUrl: string,
  project: string
): Promise<Suggestion[]> {
  // Télécharger l'image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`fetch image failed: ${imgRes.status}`);
  const blob = await imgRes.blob();

  const form = new FormData();
  form.append("images", blob, "photo.jpg");
  form.append("organs", "auto");

  // Note: /v2/identify/{project} n'accepte PAS lat/lon en query (réservé à l'endpoint survey).
  const url = `https://my-api.plantnet.org/v2/identify/${project}?api-key=${PLANTNET_KEY}&include-related-images=false&no-reject=false&lang=fr`;

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`plantnet ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const results = (data?.results || []).slice(0, 5);
  return results.map((r: any, i: number) => ({
    rank: i + 1,
    taxon_scientific_name: r?.species?.scientificNameWithoutAuthor || "",
    taxon_common_name_fr: r?.species?.commonNames?.[0] || null,
    kingdom: "Plantae",
    confidence: Number(r?.score) || 0,
    ai_provider: "plantnet" as const,
    raw_response: r,
  })).filter((s: Suggestion) => s.taxon_scientific_name);
}

// --- Gemini Vision structured (faune/champignons) ---
async function geminiIdentify(imageUrl: string, hint: string): Promise<Suggestion[]> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Tu es un naturaliste expert. Identifie l'espèce sur la photo. Renvoie jusqu'à 5 suggestions classées par confiance décroissante. Si tu n'es pas sûr, renvoie moins de suggestions ou une liste vide. Confidence entre 0 et 1.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Pré-tri : ${hint}. Identifie l'espèce (nom scientifique + nom français + règne).`,
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "identify_species",
            description: "Liste de suggestions d'espèces",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      scientific_name: { type: "string" },
                      common_name_fr: { type: "string" },
                      kingdom: {
                        type: "string",
                        enum: ["Animalia", "Plantae", "Fungi", "Other"],
                      },
                      confidence: { type: "number" },
                    },
                    required: ["scientific_name", "kingdom", "confidence"],
                  },
                },
              },
              required: ["suggestions"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "identify_species" } },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`gemini ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return [];
  const parsed = JSON.parse(args);
  const sugg = (parsed?.suggestions || []).slice(0, 5);
  return sugg.map((s: any, i: number) => ({
    rank: i + 1,
    taxon_scientific_name: s.scientific_name || "",
    taxon_common_name_fr: s.common_name_fr || null,
    kingdom: s.kingdom || null,
    confidence: Math.max(0, Math.min(1, Number(s.confidence) || 0)),
    ai_provider: "gemini" as const,
    raw_response: s,
  })).filter((s: Suggestion) => s.taxon_scientific_name);
}

// --- Process one media ---
async function processMedia(
  supabase: any,
  media: any,
  cfg: Config,
  eventDate: string | null
): Promise<{ status: string; topConfidence: number }> {
  const imageUrl = media.url_fichier || media.external_url;
  if (!imageUrl) {
    await supabase
      .from("marcheur_medias")
      .update({ ai_status: "unidentifiable", ai_processed_at: new Date().toISOString() })
      .eq("id", media.id);
    return { status: "unidentifiable", topConfidence: 0 };
  }

  const meta = media.metadata || {};
  const gps = meta.gps || {};
  const lat = typeof gps.latitude === "number" ? gps.latitude : null;
  const lng = typeof gps.longitude === "number" ? gps.longitude : null;

  await supabase
    .from("marcheur_medias")
    .update({ ai_status: "processing" })
    .eq("id", media.id);

  // 1. Pré-tri
  const hint = await geminiKingdomPretri(imageUrl);

  let suggestions: Suggestion[] = [];

  // 2. Routing
  if (hint === "paysage" || hint === "inconnu") {
    await supabase
      .from("marcheur_medias")
      .update({
        ai_status: "unidentifiable",
        ai_kingdom_hint: hint,
        ai_processed_at: new Date().toISOString(),
      })
      .eq("id", media.id);
    return { status: "unidentifiable", topConfidence: 0 };
  }

  try {
    if (hint === "plante" && cfg.plant_provider === "plantnet" && PLANTNET_KEY) {
      suggestions = await plantnetIdentify(imageUrl, cfg.plantnet_project);
    } else {
      suggestions = await geminiIdentify(imageUrl, hint);
    }
  } catch (e: any) {
    console.error(`[processMedia ${media.id}] provider error`, e?.message);
    // fallback Gemini si Pl@ntNet plante
    if (hint === "plante") {
      try {
        suggestions = await geminiIdentify(imageUrl, hint);
      } catch (e2) {
        console.error(`[processMedia ${media.id}] fallback gemini failed`, e2);
      }
    }
  }

  // 3. Stockage suggestions (replace)
  await supabase.from("marcheur_photo_ai_suggestions").delete().eq("media_id", media.id);
  if (suggestions.length > 0) {
    await supabase.from("marcheur_photo_ai_suggestions").insert(
      suggestions.map((s) => ({
        media_id: media.id,
        rank: s.rank,
        taxon_scientific_name: s.taxon_scientific_name,
        taxon_common_name_fr: s.taxon_common_name_fr,
        kingdom: s.kingdom,
        confidence: s.confidence,
        ai_provider: s.ai_provider,
        raw_response: s.raw_response ?? null,
      }))
    );
  }

  const top = suggestions[0]?.confidence ?? 0;
  let nextStatus: string;
  if (suggestions.length === 0) nextStatus = "low_confidence";
  else if (top >= cfg.auto_threshold) nextStatus = "auto_validated";
  else if (top >= cfg.curation_threshold) nextStatus = "pending_curation";
  else nextStatus = "low_confidence";

  await supabase
    .from("marcheur_medias")
    .update({
      ai_status: nextStatus,
      ai_kingdom_hint: hint,
      ai_processed_at: new Date().toISOString(),
    })
    .eq("id", media.id);

  // 4. Auto-création observation si auto-validé
  if (nextStatus === "auto_validated" && suggestions.length > 0 && media.marche_id) {
    const top1 = suggestions[0];
    try {
      await supabase.from("marcheur_observations").insert({
        marcheur_id: media.attributed_marcheur_id || null,
        marche_id: media.marche_id,
        species_scientific_name: top1.taxon_scientific_name,
        observation_date: (meta?.date_taken || eventDate || new Date().toISOString()).slice(0, 10),
        photo_url: imageUrl,
        latitude: lat,
        longitude: lng,
        gps_source: gps.source || "exif",
        notes: `Identification IA (${top1.ai_provider}, score ${top1.confidence.toFixed(2)})`,
      });
    } catch (e) {
      console.error(`[processMedia ${media.id}] insert observation failed`, e);
    }
  }

  return { status: nextStatus, topConfidence: top };
}

// --- Main handler ---
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
      return new Response(JSON.stringify({ error: "Forbidden - admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const { eventId, mediaId, mediaIds, limit = 100, forceReprocess = false } = body || {};

    if (!eventId && !mediaId && (!Array.isArray(mediaIds) || mediaIds.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Provide eventId, mediaId or mediaIds[]" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Charger config event
    let cfg: Config = DEFAULT_CONFIG;
    let eventDate: string | null = null;
    if (eventId) {
      const { data: ev } = await supabase
        .from("marche_events")
        .select("ai_recognition_config, date_marche")
        .eq("id", eventId)
        .maybeSingle();
      if (ev?.ai_recognition_config) cfg = { ...DEFAULT_CONFIG, ...ev.ai_recognition_config };
      eventDate = ev?.date_marche || null;
    }

    // Liste des medias à traiter
    let q = supabase
      .from("marcheur_medias")
      .select("id, url_fichier, external_url, metadata, marche_id, marche_event_id, attributed_marcheur_id, user_id, ai_status")
      .eq("type_media", "photo");

    if (mediaId) q = q.eq("id", mediaId);
    else if (Array.isArray(mediaIds) && mediaIds.length > 0) q = q.in("id", mediaIds);
    else if (eventId) {
      q = q.eq("marche_event_id", eventId);
      if (!forceReprocess) q = q.in("ai_status", ["pending", "low_confidence"]);
      q = q.limit(limit);
    }

    const { data: medias, error: mErr } = await q;
    if (mErr) throw mErr;

    const results = { total: medias?.length || 0, auto: 0, curation: 0, low: 0, unidentifiable: 0, errors: 0 };

    for (const m of medias || []) {
      try {
        const r = await processMedia(supabase, m, cfg, eventDate);
        if (r.status === "auto_validated") results.auto++;
        else if (r.status === "pending_curation") results.curation++;
        else if (r.status === "low_confidence") results.low++;
        else if (r.status === "unidentifiable") results.unidentifiable++;
        // Petit délai courtois pour Pl@ntNet
        await new Promise((r) => setTimeout(r, 600));
      } catch (e) {
        console.error(`[main] media ${m.id} failed`, e);
        results.errors++;
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[main] fatal", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

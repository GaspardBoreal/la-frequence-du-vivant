import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, corsHeaders } from "../_shared/auth-helper.ts";

/**
 * Tour de Jardin — proposition rédigée par l'IA de Jardin à partir des données
 * réelles de la propriété (biodiversité, sol, flore, objets, palette, chantiers,
 * consultations). Lecture stricte : rien n'est inventé.
 *
 * - sans `tourId` : crée un nouveau tour au statut « recommandé »
 * - avec `tourId` : ajoute des actions à un tour existant, sans écraser les vôtres
 */

const SCHEMA_KEYS = [
  "strates", "lisiere", "bois-mort", "point-eau", "ourlet", "sol-couvert",
  "hotel-insectes", "prairie-fleurie", "tas-feuilles", "compost", "haie",
  "refuge-non-tondu",
];

const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { supabase, errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const proprieteId = typeof body?.proprieteId === "string" ? body.proprieteId : null;
    const tourId = typeof body?.tourId === "string" ? body.tourId : null;
    const moisDemande = Number.isInteger(body?.mois) ? Number(body.mois) : null;

    if (!proprieteId) return json({ error: "Propriété manquante." }, 400);

    // RLS : si la personne n'a pas accès, la lecture ne renvoie rien.
    const { data: propriete, error: propErr } = await supabase
      .from("proprietes")
      .select("id, nom, ville, description")
      .eq("id", proprieteId)
      .maybeSingle();
    if (propErr) return json({ error: propErr.message }, 400);
    if (!propriete) return json({ error: "Propriété introuvable ou non accessible." }, 403);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "Clé IA non configurée." }, 500);

    /* ── Contexte lu en base ── */
    const [bioRes, solRes, floreRes, objetsRes, paletteRes, chantiersRes, consultRes] =
      await Promise.all([
        supabase.rpc("get_propriete_biodiversity", { p_propriete_id: proprieteId }),
        supabase.from("propriete_soil_diagnostics").select("*").eq("propriete_id", proprieteId).maybeSingle(),
        supabase.from("propriete_flora_diagnostics").select("*").eq("propriete_id", proprieteId).maybeSingle(),
        supabase.from("propriete_objets").select("nom, type").eq("propriete_id", proprieteId).limit(40),
        supabase.from("propriete_palette").select("*").eq("propriete_id", proprieteId).limit(10),
        supabase.from("propriete_chantiers").select("nom, statut, date_travaux").eq("propriete_id", proprieteId).limit(20),
        supabase.from("propriete_consultations").select("subject_label, status, severity").eq("propriete_id", proprieteId).limit(20),
      ]);

    // Ressources citables : l'IA ne peut lier que ce qui existe réellement.
    const [zonesRes, capteursRes] = await Promise.all([
      supabase.from("propriete_zones").select("id, nom").eq("propriete_id", proprieteId).limit(40),
      supabase.from("iot_capteurs").select("id, nom").eq("propriete_id", proprieteId).limit(40),
    ]);

    const bio = (bioRes.data as any) ?? {};
    const mois = moisDemande ?? new Date().getMonth() + 1;

    const contexte = {
      propriete: { nom: propriete.nom, ville: propriete.ville },
      mois: MOIS[Math.max(0, Math.min(11, mois - 1))],
      biodiversite: {
        especesTotal: bio.speciesTotal ?? 0,
        regnes: bio.kingdoms ?? {},
        derniereObservation: bio.lastObservationDate ?? null,
        dernierEvenement: bio.lastEventDate ?? null,
        topEspeces: (bio.topSpecies ?? []).slice(0, 25),
      },
      sol: solRes.data ?? null,
      flore: floreRes.data ?? null,
      objets: objetsRes.data ?? [],
      paletteRenseignee: (paletteRes.data ?? []).length > 0,
      chantiers: chantiersRes.data ?? [],
      consultations: consultRes.data ?? [],
      ressourcesCitables: {
        secteurs: (zonesRes.data ?? []).map((z: any) => z.nom).filter(Boolean),
        prelevements: Array.isArray((solRes.data as any)?.samples)
          ? (solRes.data as any).samples.map((s: any) => s.label).filter(Boolean)
          : [],
        ouvrages: (objetsRes.data ?? []).map((o: any) => o.nom).filter(Boolean),
        sondes: (capteursRes.data ?? []).map((c: any) => c.nom).filter(Boolean),
      },
    };

    const system = `Tu es l'**IA de Jardin** de La Fréquence du Vivant : conseillère en écologie du paysage, sobre, concrète, encourageante.

Tu prépares un **Tour de Jardin** : une sortie d'observation guidée, à faire à pied, qui doit
1. actualiser les données clés de biodiversité du lieu,
2. ouvrir des pistes pour développer la biodiversité,
3. ouvrir des pistes pour renforcer la résilience du jardin.

RÈGLES ABSOLUES
- Français, ton chaleureux et précis, jamais moralisateur.
- N'invente JAMAIS une espèce, une mesure, une surface ou un ouvrage absent du contexte fourni.
- Les « points forts » nomment ce qui va DÉJÀ bien, en citant les données réelles (groupes d'espèces observées, richesse, ouvrages existants).
- Les « potentiels » nomment ce qui manque encore, sans jugement, chaque manque relié à un geste concret.
- Chaque action est faisable en une sortie ou en une demi-journée, décrite en 2 à 4 phrases utiles (où regarder, comment faire, pourquoi ça compte).
- Répartis les actions entre les trois intentions : observer, biodiversite, resilience.
- Espèces : nom français d'abord, nom scientifique entre parenthèses en italique. Si le nom français est inconnu, écris seulement le nom scientifique.
- Choisis un schéma pédagogique (schema_key) uniquement quand il éclaire vraiment l'action, sinon laisse vide.
- Quand une action cite une espèce, un prélèvement de sol, un secteur, un ouvrage ou une sonde présents dans le contexte (voir `ressourcesCitables`), reporte-la dans le tableau `refs` de l'action : { kind, label } où `label` est le texte EXACT tel qu'il apparaît dans le titre ou le détail. Ne référence jamais un élément absent du contexte.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content:
              (tourId
                ? "Propose 4 à 6 NOUVELLES actions complémentaires pour ce tour de jardin.\n\n"
                : "Compose un tour de jardin complet (8 à 12 actions) pour le mois indiqué.\n\n") +
              "Données réelles de la propriété :\n" +
              JSON.stringify(contexte),
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_tour",
              description: "Le tour de jardin proposé",
              parameters: {
                type: "object",
                properties: {
                  titre: { type: "string" },
                  intention: { type: "string" },
                  duree_min: { type: "integer" },
                  saison: { type: "string" },
                  points_forts: { type: "array", items: { type: "string" } },
                  potentiels: { type: "array", items: { type: "string" } },
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titre: { type: "string" },
                        volet: { type: "string", enum: ["observer", "biodiversite", "resilience"] },
                        detail: { type: "string" },
                        moment: { type: "string" },
                        difficulte: { type: "integer", enum: [1, 2, 3] },
                        schema_key: { type: "string", enum: [...SCHEMA_KEYS, ""] },
                        refs: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              kind: { type: "string", enum: ["species", "sample", "zone", "objet", "capteur"] },
                              label: { type: "string" },
                              latin: { type: "string" },
                            },
                            required: ["kind", "label"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["titre", "volet", "detail", "moment", "difficulte", "schema_key"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["titre", "intention", "duree_min", "saison", "points_forts", "potentiels", "actions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_tour" } },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("AI gateway error:", response.status, details);
      if (response.status === 429)
        return json({ error: "L'IA de Jardin est très sollicitée. Réessayez dans un instant." }, 429);
      if (response.status === 402)
        return json({ error: "Crédits IA épuisés pour cet espace de travail." }, 402);
      if (response.status === 403)
        return json({ error: "L'IA de Jardin est désactivée pour cet espace de travail." }, 403);
      return json({ error: "Proposition indisponible pour le moment." }, 502);
    }

    const data = await response.json();
    let payload: any = null;
    try {
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (args) payload = JSON.parse(args);
    } catch (e) {
      console.error("Parse error:", e);
    }
    if (!payload?.actions?.length) return json({ error: "L'IA n'a rien proposé. Réessayez." }, 502);

    /* ── Écriture ── */
    let targetTourId = tourId;

    if (!targetTourId) {
      const dateTour = new Date();
      if (moisDemande) dateTour.setMonth(moisDemande - 1);
      const { data: created, error: insErr } = await supabase
        .from("propriete_tours")
        .insert({
          propriete_id: proprieteId,
          titre: payload.titre || `Tour de ${contexte.mois}`,
          intention: payload.intention || null,
          date_tour: dateTour.toISOString().slice(0, 10),
          statut: "recommande",
          duree_min: payload.duree_min ?? null,
          saison: payload.saison || null,
          points_forts: payload.points_forts ?? [],
          potentiels: payload.potentiels ?? [],
          source: "ia",
        })
        .select("id")
        .single();
      if (insErr) return json({ error: insErr.message }, 400);
      targetTourId = created.id;
    } else {
      // Enrichissement : on complète les lectures sans écraser le texte existant.
      const { data: existing } = await supabase
        .from("propriete_tours")
        .select("points_forts, potentiels")
        .eq("id", targetTourId)
        .maybeSingle();
      const merge = (a: unknown, b: unknown) =>
        Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])]));
      await supabase
        .from("propriete_tours")
        .update({
          points_forts: merge(existing?.points_forts, payload.points_forts),
          potentiels: merge(existing?.potentiels, payload.potentiels),
        })
        .eq("id", targetTourId);
    }

    const { data: last } = await supabase
      .from("propriete_tour_actions")
      .select("order_index")
      .eq("tour_id", targetTourId)
      .order("order_index", { ascending: false })
      .limit(1);
    let index = (last?.[0]?.order_index ?? -1) + 1;

    const rows = payload.actions.slice(0, 14).map((a: any) => ({
      tour_id: targetTourId,
      titre: String(a.titre ?? "").slice(0, 200) || "Action",
      volet: ["observer", "biodiversite", "resilience"].includes(a.volet) ? a.volet : "observer",
      detail: a.detail ? String(a.detail) : null,
      moment: a.moment ? String(a.moment) : null,
      difficulte: [1, 2, 3].includes(a.difficulte) ? a.difficulte : 1,
      schema_key: SCHEMA_KEYS.includes(a.schema_key) ? a.schema_key : null,
      refs: Array.isArray(a.refs)
        ? a.refs
            .filter((r: any) => r && typeof r.label === "string" && r.label.trim().length > 2)
            .slice(0, 8)
            .map((r: any) => ({
              kind: ["species", "sample", "zone", "objet", "capteur"].includes(r.kind) ? r.kind : "species",
              label: String(r.label).trim(),
              ...(r.latin ? { latin: String(r.latin) } : {}),
            }))
        : [],
      order_index: index++,
      source: "ia",
    }));

    const { error: actErr } = await supabase.from("propriete_tour_actions").insert(rows);
    if (actErr) return json({ error: actErr.message }, 400);

    return json({ tourId: targetTourId, actionsAdded: rows.length });
  } catch (e) {
    console.error("propriete-tour-suggest error:", e);
    return json({ error: (e as Error).message || "Erreur inattendue" }, 500);
  }
});

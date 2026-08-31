import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { validateAuth, corsHeaders } from "../_shared/auth-helper.ts";

/**
 * La Récolte : relit un entretien fondateur et propose des cartes classées en
 * cinq registres. Rien n'est appliqué à la propriété ici — les cartes sont
 * stockées en « proposé » et validées une par une par la propriétaire.
 *
 * Règle absolue : aucune carte sans verbatim tiré du texte. Le modèle ne doit
 * jamais inventer ; une carte sans citation est rejetée côté serveur.
 */

const REGISTRES = ["fait", "geste", "ligne_rouge", "portrait", "cap"] as const;
type Registre = (typeof REGISTRES)[number];

const CONSIGNES: Record<Registre, string> = {
  fait:
    "Faits du lieu : ouvrages, réserve d'eau, sol, arbres remarquables, âges, surfaces, coûts, matériaux. " +
    "Chiffres et dates conservés tels quels.",
  geste:
    "Gestes et pratiques déjà en place ou évoqués : paillage, BRF, chop and drop, semis, taille, récupération, arrosage.",
  ligne_rouge:
    "Lignes rouges : ce que la personne refuse explicitement de faire, aujourd'hui et demain. " +
    "Formulation à la première personne du refus, sans nuance ajoutée.",
  portrait:
    "Portrait de la personne pour savoir l'accompagner : moteurs, rapport au budget, temps disponible, " +
    "seule ou accompagnée, façon d'apprendre, ton de dialogue qui lui convient. " +
    "Langage respectueux et vérifiable, jamais de jargon psychologique, jamais de diagnostic.",
  cap:
    "Cap et intentions : ce qu'elle veut dans les prochains mois, ses échéances, ses inquiétudes.",
};

const MAX_CARTES = 8;

const chunk = (text: string, size = 18000): string[] => {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out.slice(0, 3);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { errorResponse } = await validateAuth(req);
  if (errorResponse) return errorResponse;

  try {
    const { entretienId, registres } = await req.json();
    if (typeof entretienId !== "string" || !entretienId) {
      return new Response(JSON.stringify({ error: "entretienId manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wanted: Registre[] = Array.isArray(registres) && registres.length
      ? REGISTRES.filter((r) => registres.includes(r))
      : [...REGISTRES];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Lecture avec les droits de l'appelant : la RLS reste la seule autorité.
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: entretien, error: readError } = await supabase
      .from("propriete_entretiens")
      .select("id, propriete_id, transcript")
      .eq("id", entretienId)
      .maybeSingle();

    if (readError) throw new Error(readError.message);
    if (!entretien) {
      return new Response(JSON.stringify({ error: "Entretien introuvable ou inaccessible" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcript = (entretien.transcript ?? "").trim();
    if (transcript.length < 200) {
      return new Response(JSON.stringify({ error: "Transcription trop courte pour être récoltée." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const morceaux = chunk(transcript);
    const cartes: Array<{
      registre: Registre;
      titre: string;
      detail: string;
      verbatim: string;
      minutage: string | null;
    }> = [];

    // Un appel par registre : sortie courte, contrainte, frugale.
    for (const registre of wanted) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.7-flash",
          messages: [
            {
              role: "system",
              content:
                "Tu relis l'entretien d'initialisation d'un jardin pour Fréquence Jardin. " +
                "Tu n'extrais QUE ce qui est réellement dit, en français, sans rien inventer ni interpréter. " +
                "Chaque carte porte obligatoirement un verbatim recopié mot pour mot depuis le texte. " +
                "Si le texte porte un minutage ou un horodatage près de la phrase, recopie-le. " +
                `Registre demandé — ${CONSIGNES[registre]} ` +
                `Au plus ${MAX_CARTES} cartes, les plus importantes d'abord. Aucune carte si le texte n'en contient pas. ` +
                "Titre de 3 à 7 mots, détail d'une à deux phrases.",
            },
            {
              role: "user",
              content: `Entretien :\n${morceaux.join("\n\n[…]\n\n")}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_cartes",
                description: "Cartes extraites pour le registre demandé",
                parameters: {
                  type: "object",
                  properties: {
                    cartes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          titre: { type: "string" },
                          detail: { type: "string" },
                          verbatim: { type: "string" },
                          minutage: { type: "string" },
                        },
                        required: ["titre", "detail", "verbatim"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["cartes"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_cartes" } },
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        console.error("AI gateway error:", registre, response.status, details);
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({
              error:
                response.status === 429
                  ? "L'IA de jardin est très sollicitée. Réessayez dans un instant."
                  : "Crédits IA épuisés pour cet espace de travail.",
            }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        continue;
      }

      const data = await response.json();
      let parsed: Array<Record<string, unknown>> = [];
      try {
        const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) parsed = JSON.parse(args).cartes ?? [];
      } catch (e) {
        console.error("Parse error:", registre, e);
      }

      for (const c of parsed.slice(0, MAX_CARTES)) {
        const titre = typeof c.titre === "string" ? c.titre.trim() : "";
        const verbatim = typeof c.verbatim === "string" ? c.verbatim.trim() : "";
        // Garde-fou anti-invention : la citation doit exister dans le texte.
        const cite = verbatim.replace(/\s+/g, " ").slice(0, 60).toLowerCase();
        const found = cite.length > 12 && transcript.replace(/\s+/g, " ").toLowerCase().includes(cite);
        if (!titre || !verbatim || !found) continue;
        cartes.push({
          registre,
          titre,
          detail: typeof c.detail === "string" ? c.detail.trim() : "",
          verbatim,
          minutage: typeof c.minutage === "string" && c.minutage.trim() ? c.minutage.trim() : null,
        });
      }
    }

    if (cartes.length === 0) {
      return new Response(JSON.stringify({ error: "Aucune carte fiable n'a pu être extraite.", cartes: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Remplacement des cartes encore « proposées » : les décisions déjà prises sont préservées.
    await supabase
      .from("propriete_entretien_extraits")
      .delete()
      .eq("entretien_id", entretienId)
      .eq("statut", "propose")
      .in("registre", wanted);

    const rows = cartes.map((c, i) => ({
      entretien_id: entretienId,
      registre: c.registre,
      titre: c.titre,
      detail: c.detail,
      verbatim: c.verbatim,
      minutage: c.minutage,
      statut: "propose",
      ordre: i,
    }));

    const { error: insertError } = await supabase.from("propriete_entretien_extraits").insert(rows);
    if (insertError) throw new Error(insertError.message);

    await supabase
      .from("propriete_entretiens")
      .update({ harvested_at: new Date().toISOString(), statut: "recolte" })
      .eq("id", entretienId);

    return new Response(JSON.stringify({ cartes: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("entretien-harvest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

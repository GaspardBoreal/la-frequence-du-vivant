## Diagnostic

Sur la carte Syrphe ceinturé, le clic sur **« Approfondir avec l'IA »** échoue systématiquement avec le message générique *« L'IA n'a pas pu répondre. Réessayez plus tard. »*.

Signaux croisés :
- **Aucun log** pour l'edge function `prospective-2100-species` (jamais atteinte, ou boot KO).
- **Aucune requête AI Gateway** correspondant au prompt « écologue narratif … horizon 2100 » dans les 7 derniers jours (les 32 appels récents sont tous pour la traduction FR d'espèces).
- La fonction importe `npm:@supabase/supabase-js@2` alors que **toutes** les autres edge functions du projet utilisent `https://esm.sh/@supabase/supabase-js@2.x` → incohérence qui peut empêcher le boot dans le runtime Deno de Supabase.
- Le front avale l'erreur réelle (`catch (e)` → message statique), donc l'utilisateur ne voit ni le code HTTP, ni la cause (402 crédits, 429 rate-limit, 500 boot, JSON invalide…).
- Le parsing JSON est fragile : Gemini renvoie parfois du texte enrobé (```json …```) ou une clé `narrative` vide → le front affiche « L'IA n'a pas pu répondre » alors que l'appel a réussi.

## Ce qu'on va corriger (inspirant + robuste)

### 1. Réparer l'edge function `prospective-2100-species`
- Aligner l'import Supabase sur le standard projet : `https://esm.sh/@supabase/supabase-js@2.52.1`.
- Ajouter des `console.log` structurés (`[prospective-2100] start / cache-hit / ai-call / ai-status / parse-ok`) pour tracer les échecs.
- Durcir le parsing : accepter les réponses enveloppées ```json …``` (regex de nettoyage) et retomber proprement sur `fallback_status` + narrative heuristique si la clé `narrative` est vide.
- Retourner des codes HTTP explicites (`402` si crédits épuisés, `429` si rate-limit) en propageant ceux du gateway.
- Mettre à jour le modèle vers `google/gemini-3-flash-preview` (dernière génération Flash — meilleur ratio qualité/latence, cohérent avec le reste du projet).

### 2. Front `Prospective2100.tsx` — UX de récupération premium
- **Message d'erreur contextuel** (au lieu du générique) : distinguer *hors ligne*, *crédits épuisés*, *trop de requêtes*, *IA indisponible*.
- **Bouton « Réessayer »** dans le bloc d'erreur (au lieu de fermer/rouvrir la fiche).
- **Fallback narratif enrichi** : si l'IA échoue 2 fois, afficher un encart « Récit heuristique » qui reformule la projection existante avec un ton plus littéraire (déjà en local, aucun appel).
- **Feedback visuel** pendant le chargement : shimmer sur le bloc IA + bouton avec `Loader2` (déjà présent), plus micro-copy *« L'IA écoute le paysage… »* pour transformer l'attente en promesse.

### 3. Cache & télémetrie
- Le cache `species_prospective_2100_cache` (unique par `scientific_name`) reste tel quel — pas de touche à la table ni à la RLS.
- On loggue côté edge le `duration_ms` et le `model` utilisé pour permettre un futur onglet admin « Qualité IA 2100 ».

## Fichiers touchés

- `supabase/functions/prospective-2100-species/index.ts` — import esm.sh, logs, parsing tolérant, codes HTTP propagés, modèle mis à jour.
- `src/components/biodiversity/discover/modes/Prospective2100.tsx` — messages d'erreur typés, bouton Réessayer, micro-copy, fallback littéraire local.

## Ce qu'on ne touche pas

- Le heuristique `classifyProspective2100` (déjà exposé comme « PROJECTION 2100 » avant l'appel IA).
- La table cache et sa migration.
- Le design général de l'écran (particules, chips, grille) — uniquement le bloc IA de la fiche détail.

## Vérification après implémentation

1. Cliquer « Approfondir avec l'IA » sur Syrphe ceinturé → réponse en ≤ 3 s avec narrative non vide.
2. Vérifier apparition d'une ligne dans les logs de la edge function.
3. Vérifier apparition d'un appel `chat_completions` dans AI Gateway avec le prompt écologue narratif.
4. Simuler échec (couper le réseau) → message clair + bouton Réessayer visible.

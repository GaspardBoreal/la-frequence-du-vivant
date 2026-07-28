import { defineMcp, auth } from "@lovable.dev/mcp-js";
import listProprietes from "./tools/list-proprietes";
import getProprieteOverview from "./tools/get-propriete-overview";
import getProprieteBiodiversity from "./tools/get-propriete-biodiversity";
import getProprieteSpeciesPool from "./tools/get-propriete-species-pool";
import getProprieteDiagnostic from "./tools/get-propriete-diagnostic";
import getProprieteObservationPoints from "./tools/get-propriete-observation-points";

// L'issuer OAuth doit être l'hôte Supabase direct, construit depuis le project
// ref (littéral inliné par Vite au build : reste import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "la-frequence-du-vivant",
  title: "La Fréquence du Vivant",
  version: "0.1.0",
  instructions:
    "Accès en lecture seule aux données des propriétés (jardins, domaines) de La Fréquence du Vivant : biodiversité observée, pool d'espèces dédupliqué, points d'observation géolocalisés et diagnostics (J'observe / J'analyse le sol / J'identifie la flore, score ICG). Chaque appel agit au nom de l'utilisateur connecté : seules les propriétés auxquelles il a accès sont visibles. Utilisez `list_proprietes` d'abord pour obtenir les identifiants ou slugs.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listProprietes,
    getProprieteOverview,
    getProprieteBiodiversity,
    getProprieteSpeciesPool,
    getProprieteDiagnostic,
    getProprieteObservationPoints,
  ],
});

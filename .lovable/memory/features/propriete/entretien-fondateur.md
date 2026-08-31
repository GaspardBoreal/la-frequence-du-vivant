---
name: L'Entretien fondateur
description: Portrait › Entretiens — dépôt de l'interview d'initialisation, récolte IA en 5 registres, validation carte par carte, lignes rouges en garde-fou système
type: feature
---

- Sous-onglet `Portrait › Entretiens` (`PortraitEntretiens.tsx`, hook `useProprieteEntretiens.ts`).
- Tables `propriete_entretiens` (transcript, source, tenu_le, consentement, harvested_at) et `propriete_entretien_extraits` (registre, titre, detail, verbatim, minutage, statut `propose|accepte|ecarte`). RLS : lecture `can_access_propriete`, écriture `can_edit_propriete_onboarding`.
- 5 registres : `fait`, `geste`, `ligne_rouge`, `portrait`, `cap`.
- Edge `entretien-harvest` : un appel Gemini par registre, tool-calling contraint. **Garde-fou anti-invention** : toute carte dont le verbatim (60 premiers caractères normalisés) n'est pas retrouvé dans la transcription est rejetée côté serveur. Relance = suppression des seules cartes encore « proposées ».
- Rien n'est appliqué sans clic : Accepter · Ajuster · Écarter.
- Les lignes rouges acceptées sont injectées **toujours** (hors console 📎) en contrainte système dans `propriete-chat`, et disponibles comme contexte attachable `site.entretien`.
- `useGardenGestures` ajoute les cartes acceptées au contexte → l'empreinte change → les trois premiers gestes se réécrivent automatiquement.
- Restent à faire : Rapport d'initialisation PDF (étape 2), Fil de l'entretien / relances et vue Avant-Après (étape 3).

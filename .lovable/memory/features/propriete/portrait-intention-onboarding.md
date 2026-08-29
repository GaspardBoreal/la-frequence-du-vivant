---
name: Portrait · Intention (onboarding relisible)
description: Troisième sous-onglet du Portrait affichant/éditant proprietes.onboarding_preferences, RPC save_propriete_onboarding, question objectif_6_mois
type: feature
---

- `Mon projet › Portrait › Intention` (`PortraitIntention.tsx` + `IntentionQuestionEditor.tsx`) relit et modifie les réponses du parcours d'accueil, question par question, dans le même esprit que l'onboarding.
- Source unique : `proprietes.onboarding_preferences` (jsonb) au format `{ answers: {...}, persona, version, completed_at, updated_at }`. Le hook `usePropertyIntention` tolère aussi un format à plat.
- Écriture impossible en direct (RLS `proprietes` = admin seulement) : passer par la RPC `save_propriete_onboarding(_propriete_id, _patch)` (fusion `||`), autorisation via `can_edit_propriete_onboarding` (propriétaire / main_walker / admin).
- `onboard_create_propriete` accepte désormais un 6e paramètre `_preferences jsonb` — c'est par là que le projet dérivé « Onboarding Fréquence Jardin » doit verser les réponses.
- Une propriété créée hors parcours affiche un bandeau d'invitation et se complète question par question.
- Question `objectif_6_mois` ajoutée en fin de `DEFAULT_QUESTIONS` (séquence v4), mise en avant en tête de l'onglet Intention.

## Payload OFJ complet (audit 29/08/2026)
- OFJ verse aussi `garden_example` (id, stableId, titre, sousTitre, intention, keywords, aiProfile, vignette, chosenAt), `gestures[]`, `portrait`, `persona_label`, `flow_source`, `flow_version`. Tout est stocké dans `onboarding_preferences` — ne jamais l'écraser.
- Portrait › Intention affiche désormais : phrase de portrait, carte « Le jardin qui vous ressemble » (`GardenExampleCard` + hook `useGardenExample` relisant `onboarding_garden_examples`, RLS publique si `publie`), et « Vos premiers gestes ».
- L'écriture conserve `storedPersona` (plus de recalcul qui écrasait la persona OFJ).
- Restes côté OFJ : passer en `flow_version: 4` pour poser `objectif_6_mois`, et tracer le refus de galerie via `garden_example: { refused: true }` au lieu de `null`.

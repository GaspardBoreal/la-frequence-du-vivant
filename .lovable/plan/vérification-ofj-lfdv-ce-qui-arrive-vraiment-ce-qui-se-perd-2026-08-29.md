# Vérification OFJ → LFDV : ce qui arrive vraiment, ce qui se perd

## Résultat de l'audit (données réelles en base)

Deux jardins seulement portent aujourd'hui un `onboarding_preferences` issu du parcours Fréquence Jardin (créés le 24/08). Ce qu'ils contiennent :

- `answers` — toutes les réponses du questionnaire : **bien stockées et déjà relisibles** dans Mon projet › Portrait › Intention.
- `persona`, `persona_label`, `flow_source`, `flow_version`, `completed_at` — stockés.
- `garden_example` — le jardin-exemple choisi à l'écran « Lequel vous ressemble le plus ? » (copie d'écran) : id, `stableId`, titre, sous-titre, intention, mots-clés, profil IA complet, et l'URL de la vignette. **Stocké, mais jamais affiché ni exploité côté LFDV.**
- `gestures` — les trois premiers gestes proposés en fin de parcours : stockés, jamais affichés.
- `portrait` — la phrase de portrait du lieu : stockée, jamais affichée.

Trois écarts confirmés :

1. **L'image retenue est invisible.** Le doute est fondé : la vignette et ses métadonnées existent en base, mais aucun écran LFDV ne les lit. Rien ne relie non plus visuellement le choix à sa fiche source (`onboarding_garden_examples`, ligne présente, publiée, image + miniature + alt + mots-clés + profil IA).
2. **Un des deux jardins a `garden_example: null`** (persona balcon). À vérifier côté OFJ : l'écran est-il proposé pour cette persona, ou l'utilisateur a-t-il répondu « Aucun ne me ressemble » sans que ce refus soit tracé ?
3. **`objectif_6_mois` absent partout** : les parcours enregistrés sont en `flow_version: 3`, la question a été ajoutée en v4 côté LFDV. OFJ doit passer en v4 pour la poser.

Risque secondaire : en modifiant une réponse depuis Intention, LFDV réécrit `persona` à partir des réponses et peut écraser la persona déclarée par OFJ.

## Ce qui va changer pour vous

- Un bloc **« Le jardin qui vous ressemble »** en tête de Portrait › Intention : la vignette choisie, son titre et son sous-titre, l'intention, les mots-clés, et un lien vers la fiche complète de cet exemple (métadonnées : alt, source, profil IA détaillé) dans un panneau dépliable.
- Si la fiche source a évolué depuis le choix (titre, image), l'écran affiche la version actuelle et signale la date du choix.
- Un bloc **« Vos trois premiers gestes »** reprenant les gestes issus du parcours, en lecture.
- La **phrase de portrait** du parcours affichée en exergue.
- Si aucun exemple n'a été retenu, une invitation discrète à en choisir un — sans réouvrir tout le parcours.
- Aucune régression : les réponses et leur édition question par question restent identiques.

## Détails techniques

- `usePropertyIntention` : étendre `PropertyIntention` avec `gardenExample`, `gestures`, `portrait`, `personaLabel`, `flowSource`, `flowVersion` (normalisation tolérante, tout reste optionnel).
- Ne plus recalculer `persona` à l'écriture quand `storedPersona` existe : le patch conserve la persona déclarée par OFJ.
- Nouveau hook `useGardenExample(id)` : lecture de `onboarding_garden_examples` (id, titre, sous_titre, image_url, thumbnail_url, image_alt, keywords, user_intent, ai_profile, source_url) pour rejouer les métadonnées à jour. Repli sur la copie figée dans `onboarding_preferences` si la ligne a disparu.
- Nouveau composant `GardenExampleCard.tsx` (dossier `portrait/`) + bloc gestes, insérés en tête de `PortraitIntention.tsx`. Pas de changement de schéma, pas de migration.
- Vérifier la lisibilité publique de `onboarding_garden_examples` sous RLS pour un propriétaire non-admin ; si l'accès est fermé, passer par une RPC de lecture ciblée plutôt que d'ouvrir la table.

## À faire côté projet OFJ (hors de ce chantier)

- Passer la séquence en `flow_version: 4` et poser `objectif_6_mois`.
- Tracer explicitement le refus « Aucun ne me ressemble vraiment » (`garden_example: { refused: true }`) au lieu de `null`.
- Continuer à verser le tout via le paramètre `_preferences` de `onboard_create_propriete`.

# Journal de rétablissement : visionneuse plein écran et lecture de l'évolution

Objectif : pouvoir cliquer sur une image du journal pour l'ouvrir en grand, naviguer Suivant / Précédent dans les médias de la consultation en cours, et transformer ce journal en outil d'inspiration pour rédiger les prescriptions.

## 1. Visionneuse plein écran (le geste attendu)

- Clic sur une vignette du journal (photo ou vidéo) → ouverture d'une visionneuse plein écran sombre.
- Navigation Précédent / Suivant sur tous les médias de la consultation en cours : flèches à l'écran, touches ←/→, Échap pour fermer, balayage tactile sur mobile.
- Bandeau bas : date et heure du média, étendue au moment de la prise (x/5), légende, compteur « 3 / 12 ».
- Bande de vignettes cliquables en pied de visionneuse pour sauter directement à une date.
- Les vidéos se lisent dans la visionneuse ; les vocaux restent en ligne dans le journal (pas d'image à agrandir).

## 2. Éléments « wahou » au service de la prescription

- **Rideau Avant / Après** : quand au moins deux photos existent, un curseur glissant superpose la plus ancienne et la plus récente, avec les deux dates et l'écart d'étendue affiché (« étendue 5/5 → 2/5 en 24 jours »). C'est la preuve visuelle qui nourrit la décision de traitement.
- **Frise d'évolution de l'étendue** : sous la visionneuse, une petite courbe à 5 crans reliant chaque prise datée ; les points sont cliquables et pilotent la visionneuse. On lit d'un coup d'œil si le foyer progresse, stagne ou régresse.
- **Repères de gestes sur la frise** : chaque geste réalisé (date de réalisation) apparaît comme une marque dorée sur la frise, pour voir si l'amélioration suit l'intervention.
- **Comparateur côte à côte** : bouton « Comparer » pour épingler deux médias et les afficher en vis-à-vis, plein écran, avec leurs dates.
- **Depuis la visionneuse, agir** : deux actions contextuelles — « Relancer le diagnostic sur cette photo » (renvoie l'image à l'IA de jardin) et « Ajouter comme repère de prescription », qui insère la date et l'étendue observée dans la note de la consultation.
- **Loupe** : molette / pincement pour zoomer sur la lésion, utile pour trancher entre deux hypothèses proches.

## 3. Détails d'exécution

- Nouveau composant `src/components/propriete/clinique/JournalViewer.tsx` (plein écran, `AnimatePresence`, index contrôlé, clavier + swipe), sur le modèle des lightbox existantes du projet.
- Nouveau composant `src/components/propriete/clinique/JournalTimeline.tsx` pour la frise d'étendue et les marques de gestes.
- `ConsultationDrawer.tsx` : vignettes rendues cliquables, état `viewerIndex`, montage de la visionneuse et de la frise, rideau Avant / Après au-dessus du journal.
- Aucune modification de schéma : tout s'appuie sur `propriete_consultation_medias` (`taken_at`, `severity_at_capture`, `caption`) et sur les dates de réalisation de `propriete_consultation_actions`.
- Tokens sémantiques uniquement (`--ds-forest`, `--ds-gold`, `--ds-cream`), animations Motion sobres, textes lisibles en vert profond sur fond clair.

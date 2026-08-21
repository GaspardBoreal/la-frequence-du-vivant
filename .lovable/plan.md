# Alertes : même pagination que le Journal

Aujourd'hui l'onglet Alertes affiche toute la liste d'un bloc, alors que le Journal a une barre de pagination (« 1–20 sur N », première / précédente / suivante / dernière, taille de page 10 · 20 · 50 · 100).

## Ce que je propose

- Ajouter sous la liste des alertes exactement le même composant de pagination que dans le Journal, avec le même comportement et la même apparence.
- Taille de page par défaut : 20, modifiable (10 · 20 · 50 · 100).
- L'état de pagination est mémorisé dans l'URL (paramètres propres aux alertes, `ap` / `aps`), pour ne pas entrer en conflit avec la pagination du Journal et rester partageable.
- Retour automatique à la page 1 dès qu'on change de règle dans la constellation, de période ou de filtre.
- Le compteur de la bande de contrôle et la constellation continuent de porter sur l'ensemble de la période, pas seulement sur la page affichée ; le titre de la liste précise « x–y sur N alertes ».
- Si la page courante devient vide (moins d'alertes après filtrage), on revient à la dernière page existante plutôt que d'afficher un vide.

## Détail technique

- `src/components/iot/alerts/AlertsPanel.tsx` : découpe locale de `visibles` avec `slice((page-1)*pageSize, page*pageSize)` et réutilisation de `PaginationControls` (`@/components/admin/marche-events/PaginationControls`), même props que dans `DeliveryJournal`.
- Lecture/écriture des paramètres `ap` / `aps` via `useSearchParams`, `replace: true`, suppression du paramètre quand il vaut la valeur par défaut.
- Aucun changement du moteur d'analyse (`src/lib/iot/anomalies.ts`), du hook `useIotAnomalies`, ni de la base de données : la pagination est purement d'affichage.

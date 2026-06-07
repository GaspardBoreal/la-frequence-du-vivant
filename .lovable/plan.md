## Diagnostic
La fiche espèce ne s'ouvre pas malgré le bon onglet et le halo car le déclenchement de l'ouverture du drawer dépend du **bus de focus** (`focusBus.subscribeFocus`) consommé dans `SpeciesExplorer.tsx` — fragile pour 3 raisons :

1. **Fenêtre de replay courte (4 s).** Si `species[]` (BiodiversitySpecies transformés) arrive après cette fenêtre (RPC lent, première synchro snapshots), la subscribe ne replay plus rien → pas d'ouverture.
2. **Souscription asynchrone (`import('@/lib/focusBus')`).** Le `dispatchFocus` (T0+120ms) peut tomber avant que la subscription `SpeciesExplorer` soit en place ; on dépend alors uniquement du replay, lui-même borné par le point 1.
3. **Comparaison stricte.** `s.scientificName.toLowerCase() === d.id.toLowerCase()` rate dès qu'il y a un accent, un espace insécable, un caractère de casse atypique ou un suffixe d'autorité (« Catalpa bignonioides Walter »). Aucun fallback NFD ni match par préfixe.

Conséquence : halo (DOM trouvé) ✅, drawer (state React) ❌.

## Correctif proposé
Découpler totalement l'ouverture du drawer du timing du bus, en faisant **descendre la cible focus comme prop persistante** depuis le parent qui orchestre l'onglet (déjà abonné au bus) jusqu'à `SpeciesExplorer`, qui consomme dès que ses données sont prêtes.

### 1) `EventBiodiversityTab.tsx` — gardien du focus
- Étendre l'effet d'abonnement existant : en plus de basculer `activeSubTab = 'taxons'`, capturer `d.id` dans un state `pendingSpeciesFocus`.
- Ce state n'a **pas de TTL** : il vit jusqu'à ce que `SpeciesExplorer` confirme l'ouverture.
- Passer `pendingSpeciesFocus` + `onSpeciesFocusConsumed` en props à `<SpeciesExplorer …/>`.

### 2) `SpeciesExplorer.tsx` — consommation déterministe
- Accepter les nouvelles props `focusSpeciesId?: string | null` et `onFocusConsumed?: () => void`.
- Remplacer la subscription bus actuelle par un `useEffect([focusSpeciesId, species])` qui :
  - sort si `!focusSpeciesId` ou `!species?.length`,
  - normalise la cible et chaque `scientificName` via `NFD + lower + trim`,
  - match exact NFD, sinon **fallback** par `startsWith` (gère les suffixes d'autorité), sinon par `commonName`/`commonNameFr`,
  - si match → `setSelectedSpecies(match)` puis `onFocusConsumed?.()`,
  - si pas de match alors que `species` est chargé non vide → tentative retardée de 600 ms (laisse arriver les traductions ou un délai de rerender), sinon `onFocusConsumed?.()` pour éviter un état figé.
- Garder une `ref` d'idempotence pour ne pas réouvrir si l'utilisateur a déjà fermé le drawer.

### 3) `OeilCuration.tsx` — revert ciblé
- Mon ajout précédent (subscription `focusBus` côté OeilCuration) n'était pas utile : OeilCuration n'est pas le rendu de **Biodiversité > Taxons observés** (c'est SpeciesExplorer). Le retirer pour ne pas dupliquer l'ouverture sur l'onglet « L'œil » de la curation et éviter des effets de bord.

### 4) `focusBus.ts` — durcissement secondaire
- Pousser `RECENT_MS` de 4 000 → 15 000 ms : utile pour les autres consommateurs (témoignages, textes) avec données lentes. Aucun risque, c'est juste une fenêtre de rejeu.

## Pourquoi c'est robuste
- **Aucune dépendance au timing** : le focus est mémorisé comme état React, pas un signal volatile.
- **Aucune dépendance à la fenêtre du bus** : le parent (déjà monté avant SpeciesExplorer) capture, l'enfant consomme à son rythme.
- **Match tolérant** : NFD + fallbacks couvrent variations d'écriture du nom scientifique et noms communs (FR / latin tronqué / autorité).
- **Idempotent** : `onFocusConsumed` empêche la réouverture intempestive, l'utilisateur peut fermer le drawer sans qu'il se rouvre.
- **Unique source de vérité** : `EventBiodiversityTab` orchestre `sub` + `species focus`, `SpeciesExplorer` se contente d'exécuter.

## UX/UI
- Séquence perçue inchangée et fluide : T0 navigation → T+~200 ms halo émeraude → T+~400-500 ms drawer slide-in droite (animation native du modal). Sentiment de révélation guidée.
- Si l'espèce n'est pas dans le pool (cas limite), le halo s'éteint normalement, aucun drawer fantôme.

## Fichiers concernés
- `src/components/community/EventBiodiversityTab.tsx` (capture + prop drilling)
- `src/components/biodiversity/SpeciesExplorer.tsx` (consommation déterministe, match tolérant)
- `src/components/community/insights/curation/OeilCuration.tsx` (retirer la souscription espèce ajoutée précédemment)
- `src/lib/focusBus.ts` (RECENT_MS → 15 s)

## Validation
1. Recherche `catalpa` → « Catalpa du sud » → contexte « ROQUE GAGEAC / Jardin » : onglet Biodiversité / Taxons, halo + **drawer ouvert**.
2. Refaire avec « Buddleja de David ».
3. Fermer le drawer, relancer une autre recherche d'espèce : drawer s'ouvre à nouveau sans clic.
4. Recharger directement une URL avec `?focus=species:…&tab=biodiversite&sub=taxons` (sans passer par la recherche) : drawer s'ouvre.
5. Cas où `species[]` arrive lentement (throttling réseau) : drawer s'ouvre dès que les données arrivent.

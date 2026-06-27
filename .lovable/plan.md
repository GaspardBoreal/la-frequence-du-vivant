
# Ajout d'étapes par clic-carte en vue Cadastre

## Confirmation du schéma de données
Confirmé. Le rattachement passe **uniquement** par l'exploration :
- `marches` (nouvelle ligne avec lat/lng/nom)
- `exploration_marches` (lien `exploration_id ↔ marche_id` + `ordre`)
- L'événement (`marche_events`) est déjà lié à l'exploration via `exploration_id`.

Pour POITIERS Maison Sous Blossac → les 4 nouveaux points seront insérés dans **l'exploration `POITIERS Maison Sous Blossac`** (ID exploré depuis `marcheEventId → exploration_id` déjà disponible dans `ExplorationCarteTab`).

Bonne nouvelle : **toute la plomberie existe déjà** dans `ExplorationCarteTab.tsx` :
- `useState`s `isCreatingMarche`, `createPosition`, `drawerOpen`
- Garde de rôle `userCanCreate` (admin / ambassadeur / sentinelle)
- `CreateMarcheDrawer` câblé avec `explorationId`, qui insère dans `marches` puis dans `exploration_marches` avec le bon `ordre`

Aujourd'hui le déclencheur (`handleStartCreate` via `MapOptionsMenu`) **pré-positionne le marqueur au centre des étapes existantes** et oblige l'utilisateur à le **glisser**. Pour poser 4 points sur une parcelle de 1750 m², c'est lent et imprécis. La vue Cadastre appelle un geste plus naturel : **cliquer = poser**.

## Ce qu'on ajoute (UX minimaliste)

### 1. Bouton « + Ajouter un point » dédié Cadastre
- Visible **uniquement quand la couche `cadastre` est active** et que `userCanCreate` est vrai.
- Position : haut-gauche de la carte, sous la pill « Géo / Sat / Relief / **Cadastre** ».
- Style : pill vert forêt avec icône `Plus + MapPin`, label « Ajouter un point ».
- État actif (mode cadastre-tap) : pill ambre pulsante, label « Cliquez sur la parcelle… (Échap pour annuler) ».

### 2. Mode « cadastre-tap »
- Nouveau flag `isCadastreTapMode` (local au composant).
- Pendant ce mode :
  - Curseur `cursor-crosshair` sur le conteneur carte.
  - Un composant `<CadastreTapCapture />` (React-Leaflet `useMapEvents({ click })`) intercepte le prochain clic.
  - Au clic : `setCreatePosition({ lat, lng })` + `setIsCreatingMarche(true)` + `setDrawerOpen(true)` → ouverture immédiate du `CreateMarcheDrawer` déjà existant, pré-rempli avec la position cliquée.
  - Le marqueur fantôme draggable existant (`isCreatingMarche && createPosition` → bloc l. 1042) reste actif pour micro-ajustement avant validation.
- Après validation OU annulation → sortie du mode tap (un point à la fois, comme convenu).
- Échap → sortie du mode tap sans rien créer.

### 3. Drawer (déjà existant — léger enrichissement)
`CreateMarcheDrawer.tsx` : ajout de **2 ajustements** :
- Champ **Description courte** (optionnel, max 200 car) → écrit dans `marches.descriptif_court`.
- Toggle **« Collecter la biodiversité maintenant »** (coché par défaut) → après l'insert réussi, déclenche `supabase.functions.invoke('collect-biodiversity-step', { body: { marcheId: newMarche.id } })`. Échec silencieux (toast secondaire) — la marche est créée quoi qu'il arrive.

Le nommage du toast et l'invalidation des queries (`exploration-marcheur-steps`, `exploration-marches`) sont déjà corrects.

### 4. Préservation des fonctionnalités existantes
- **« Explorer cette étape »** et **« Repositionner (aperçu) »** du popup riche : zéro changement. Ils s'appliqueront automatiquement aux nouveaux points dès qu'ils sont créés.
- Le bouton **« + »** du `MapOptionsMenu` (vue Géo/Sat/Relief) reste inchangé — c'est le flux historique « centre + drag ».

## Détails techniques

### Fichiers modifiés
- `src/components/community/exploration/ExplorationCarteTab.tsx`
  - Ajout state `isCadastreTapMode`.
  - Ajout du composant local `<CadastreTapCapture onPick={…} />` rendu uniquement si `isCadastreTapMode && mapLayers.cadastre`.
  - Ajout du pill « + Ajouter un point » conditionnel (montré quand cadastre actif + curator + pas déjà en train de créer).
  - Listener Échap pour sortir du mode.
  - Au pick : ouvre drawer comme aujourd'hui via `setCreatePosition` + `setIsCreatingMarche(true)` + `setDrawerOpen(true)`.

- `src/components/community/exploration/CreateMarcheDrawer.tsx`
  - Ajout champ description (textarea optionnel).
  - Ajout toggle « collecter biodiversité » + appel `collect-biodiversity-step` post-insert.
  - Insert élargi : `descriptif_court: description.trim() || null`.

### Aucun changement
- Pas de migration DB (toutes les colonnes existent : `marches.descriptif_court` est déjà présent).
- Pas de nouvelle RPC ni edge function.
- Pas de modification de `CadastreMapStandalone.tsx` (usage open-data, hors périmètre).
- Pas de modification du popup riche (preserve « Explorer » / « Repositionner »).

## Résultat attendu
Sur la parcelle de Maison Sous Blossac, un ambassadeur :
1. Active la couche Cadastre.
2. Clique sur le pill vert « + Ajouter un point » → mode tap.
3. Tape sur la parcelle → drawer s'ouvre, position pré-remplie.
4. Saisit le nom (ex. « Massif Est ») → *Créer*.
5. La nouvelle étape numérotée apparaît, popup riche ouvert dessus, prêt pour *Repositionner (aperçu)* si micro-ajustement nécessaire.
6. Répète × 4 — environ 60 secondes total.

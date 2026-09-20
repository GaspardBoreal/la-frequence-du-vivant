# Chantier : rendre visible et modifiable ce qui a été créé

## Ce que disent les deux écrans

Vérification faite dans les données de « Maison sous Blossac » :

- la propriété compte **1 ouvrage** (un potager, tracé aujourd'hui à 16h26, sans nom) et **0 chantier enregistré** ;
- l'écran 2 n'affiche pas un chantier mais un **prélèvement de sol** (« Prélèvement C · Terrain potager ») posé à l'intérieur du potager.

La liste « Chantiers enregistrés » est donc exacte, mais l'écran ment par omission : après avoir tracé un ouvrage depuis la fenêtre du chantier, on croit que le chantier est créé alors qu'il faut encore cliquer sur « Ouvrir le chantier » en bas de la colonne de droite — bouton hors écran sans défilement. Et une fois un chantier créé, on ne peut ni le renommer ni changer son lot d'ouvrages : seule la date est modifiable.

## Ce qui va changer

1. **Retour de tracé explicite.** Au retour du plan, un bandeau annonce « Potager ajouté au lot — nommez puis ouvrez le chantier », l'ouvrage revient coché et mis en évidence, le nom du chantier est pré-rempli, et la colonne défile automatiquement jusqu'au bouton de validation.
2. **Bouton de validation toujours visible.** Le bouton « Ouvrir le chantier » passe en pied de colonne fixe, avec un rappel du périmètre choisi (nombre d'ouvrages ou « tout le jardin »).
3. **Renommer un ouvrage depuis la fenêtre.** Un crayon sur chaque ligne d'ouvrage permet de lui donner un nom (« Terrain potager ») au lieu du libellé générique.
4. **Modifier un chantier existant.** Sur chaque chantier enregistré : crayon pour éditer nom, date et composition du lot (ouvrages cochés / tout le jardin). Même accès depuis l'en-tête d'un chantier ouvert.
5. **Garde-fou à la fermeture.** Si un lot est composé mais non validé, la fermeture demande confirmation plutôt que de tout perdre en silence.

## Détails techniques

- `ChantierLotPicker.tsx` : section droite en `flex` colonne avec zone défilante + pied collant ; bandeau de retour piloté par `preselect` ; `scrollIntoView` sur le pied au retour de tracé ; pré-remplissage de `nom` avec le libellé de l'ouvrage préselectionné ; mode édition inline par chantier (`editingId`, champs nom/date/lot) ; nouvelles props `onRenameObjet(id, nom)` et `onPatch(id, values)`.
- `ChantierOverlay.tsx` : passe `patch` (déjà disponible via `useProprieteChantiers`) et un `onRenameObjet` au picker ; bouton « Modifier le lot » dans l'en-tête quand `active` existe, qui repasse en mode picker sur ce chantier.
- `PaletteStudio.tsx` : le renommage d'ouvrage réutilise `upsertObjet` en conservant `geometry`, `style`, `meta`, `zone_id`, `calque_id` ; `chantierPreselect` reste vidé uniquement à la fermeture réelle.
- Aucune migration : `propriete_chantiers` (nom, objet_ids, date_travaux) et les politiques d'écriture existent déjà.
- Vérification : `npx tsgo --noEmit -p tsconfig.app.json`, puis parcours réel sur `/propriete/maison-sous-blossac` (tracer/créer un chantier, le renommer, changer son lot) et contrôle en base que la ligne existe.

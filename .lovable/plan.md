# Carnet de terrain du Tour de Jardin (étape 1)

Objectif : choisir parmi les actions du jour celles à emporter sur le terrain, et éditer un PDF très synthétique, pensé pour être imprimé, glissé dans une poche, annoté au crayon — et qui donne envie de revenir cocher les dates dans l'application.

## Ce que l'utilisateur pourra faire

1. **Sélectionner les actions prioritaires**
   - Sur chaque action de la fiche Tour, une case « À emporter » (étoile) distincte de la case « Fait ».
   - Le choix est enregistré : il reste d'un appareil à l'autre et servira ensuite à l'envoi par email.
   - Deux raccourcis : « Tout sélectionner » et « Aucune ». Un compteur « 5 actions retenues » s'affiche en haut.
   - La suppression d'une action reste possible comme aujourd'hui.

2. **Éditer le carnet de terrain (PDF)**
   - Bouton « Carnet de terrain » dans l'en-tête du tour, actif dès qu'une action est retenue.
   - Une petite fenêtre de réglage avant génération : format (A5 poche ou A4), inclure ou non « Ce qui va bien / Le potentiel », inclure ou non les lignes de notes.

3. **Contenu du carnet** (une page si possible, deux au maximum)
   - Bandeau : nom du jardin, titre du tour, date, durée estimée, saison, place pour le prénom du marcheur.
   - Optionnel : « Ce qui va bien » et « Le potentiel » en deux colonnes très courtes.
   - Le cœur : les actions retenues, groupées par volet (Observer / Biodiversité / Résilience), chacune avec :
     - une case à cocher imprimée,
     - le titre en gras et le détail en une ou deux lignes,
     - les repères du lieu cités (espèce, secteur, prélèvement) en petites étiquettes,
     - le petit schéma du geste quand il existe,
     - une pastille de difficulté (1 à 3 points),
     - **une ligne « Fait le ___ / ___ » et deux lignes pointillées pour la note de terrain.**
   - Pied de page : « De retour : reportez vos dates dans l'espace Tour de Jardin » + adresse de la page du jardin, plus la date d'édition et la pagination.

4. **Retour dans l'application**
   - Après génération, un rappel discret sous la liste : « Carnet édité le … — pensez à reporter vos dates. »
   - Sur chaque action cochée « Fait », la date reste modifiable en un clic (sélecteur de date), pour saisir la date réelle du terrain plutôt que celle du jour.

## Ce qui n'est pas dans cette étape

L'envoi par email du carnet aux marcheurs (recherche dans la liste des marcheurs, pièce jointe) sera traité une fois ce carnet validé. La sélection « À emporter » servira de base à cet envoi.

## Détails techniques

- Migration : `ALTER TABLE public.propriete_tour_actions ADD COLUMN IF NOT EXISTS retenue boolean NOT NULL DEFAULT false;` (RLS existante inchangée) et `ALTER TABLE public.propriete_tours ADD COLUMN IF NOT EXISTS carnet_edite_at timestamptz;`.
- `useProprieteTours.ts` : ajout de `retenue` au type `TourAction` et à `updateAction`, helper `setAllRetenues(tourId, value)`, `carnet_edite_at` sur `ProprieteTour`.
- `TourActionRow.tsx` : bouton étoile `aria-pressed`, cible ≥ 40 px, tokens sémantiques ; sélecteur de date sur `done_at` quand `done`.
- Nouveau `src/components/propriete/tour/carnet/CarnetTerrainPdf.tsx` avec `@react-pdf/renderer` (déjà installé, cf. `GuideDeMarchePdf.tsx`) : `Document`/`Page` A5 ou A4, styles sobres monochromes + une teinte verte, cases à cocher dessinées en `View` bordé, lignes pointillées via bordure basse.
  - Les schémas de geste (`GardenSchema`) sont recréés en primitives `@react-pdf` (`Svg`/`Path`) ou omis si le tracé n'est pas transposable ; pas d'emoji ni de caractère hors Latin-1 (police Helvetica).
- Nouveau `CarnetTerrainDialog.tsx` : options + `exportCarnetPdf(...)` qui télécharge `carnet-tour-<date>.pdf`, puis met à jour `carnet_edite_at`.
- `TourDetail.tsx` : compteur, raccourcis de sélection, bouton « Carnet de terrain », rappel post-édition.
- Contrôle qualité : génération d'un PDF d'exemple, conversion en images et relecture page par page (débordements, coupes, colonnes) avant livraison.

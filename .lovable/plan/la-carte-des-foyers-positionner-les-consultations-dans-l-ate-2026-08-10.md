# La carte des foyers — positionner les consultations dans l'Atelier du jardin

## Ce qui existe déjà (vérifié)

- Chaque consultation de la Clinique porte déjà `lat` / `lng` (colonnes `propriete_consultations`), aujourd'hui jamais renseignées depuis une carte.
- L'Atelier (`PaletteStudio`) possède un panneau « Vues de fond » avec Parcelles, Emplacements, Observations du vivant et Prélèvements de sol.
- Les prélèvements de sol montrent le bon modèle : marqueur dédié, glisser-déposer sur la carte, écriture chirurgicale d'un seul point.
- La curation GPS en place (marqueur doré, aimantation cadastre, Échap/Entrée) est déjà mutualisée et réutilisable.

Aucune migration n'est nécessaire : les colonnes existent.

## La proposition : l'Atelier devient une salle de garde

Une nouvelle vue de fond **« État sanitaire »** superpose la clinique au plan du jardin. On ne se contente pas d'épingler des points : on rend visible **où le mal se propage, ce qui reste à faire, et dans quel ordre marcher**.

### 1. Les foyers, vus d'en haut

Chaque consultation devient une **pastille vivante** :

- couleur par statut — surveillance, traitement, rétabli, perdu ;
- diamètre proportionnel à la gravité (étendue /5) ;
- **pouls** animé uniquement sur les foyers actifs non traités : ce qui bat, c'est ce qui attend un geste ;
- couronne de progression indiquant la part des gestes réalisés ;
- pastille grisée et immobile pour les sujets rétablis (mémoire du lieu, pas du bruit).

### 2. Le halo de contagion

Autour de chaque foyer actif, un **halo de vigilance** dessine la distance de propagation plausible du pathogène retenu (contact, éclaboussure, vent). Quand deux halos se touchent, une **ligne de contagion** relie les foyers et un bandeau annonce « 3 foyers d'oïdium en chaîne — traiter d'un seul tenant ». C'est la lecture qui manque aujourd'hui : le jardinier voit une épidémie, pas une liste.

Le halo signale aussi les **espèces sensibles de la palette et les ouvrages** situés dans son rayon : « le groseillier 2 est à 4 m du foyer ». Agir vite, c'est agir avant que le voisin tombe.

### 3. Poser et corriger, exactement comme les prélèvements

- Un **dock « À localiser »** liste les consultations sans position ; on clique une fiche puis un point de la carte — le curseur devient une croix et le sujet se pose.
- Les pastilles déjà posées sont **déplaçables au doigt/à la souris**, avec aimantation douce sur la parcelle et retour immédiat, comme les carottes de sol.
- Si la consultation possède des photos géolocalisées, une **position suggérée** clignote : un clic l'accepte.
- Chaque déplacement écrit uniquement `lat`/`lng` de la consultation visée, avec annulation possible par le toast.

### 4. La tournée de soin

Un bouton **« Ma tournée »** trace un itinéraire numéroté entre les gestes à faire aujourd'hui, ordonné par urgence puis par proximité : « 6 gestes · 240 m · commencez par le pommier ». Cocher un geste depuis la carte éteint le pouls du foyer et met à jour l'état sanitaire en direct.

### 5. Cliquer, comprendre, agir

Au clic sur une pastille : mini-fiche flottante — sujet, hypothèse retenue, étendue, dernière photo, prochain geste avec sa fenêtre d'intervention, et deux boutons : **« Geste fait »** et **« Ouvrir la consultation »**. Aucun aller-retour d'écran pour soigner.

### 6. Le temps qui passe

Un **curseur de mémoire** rejoue les 90 derniers jours : on voit les foyers apparaître, gonfler, s'éteindre. La preuve visuelle que le soin a fonctionné — et l'endroit du jardin qui rechute chaque année.

## Détails techniques

- `src/hooks/propriete/useGardenClinique.ts` : ajout d'un hook de lecture cartographique (consultations + hypothèse retenue + gestes) et d'une mutation `moveConsultation` (mise à jour optimiste `lat`/`lng`, invalidation du bandeau sanitaire).
- `src/lib/gardenSpread.ts` (nouveau) : rayons de contagion par type de pathogène issus de `garden_pathogens_kb`, détection des chaînes de foyers, voisins sensibles (Haversine, réutilise `geoDistance`).
- `src/components/propriete/clinique/map/CliniqueLayer.tsx` (nouveau) : pastilles, halos, lignes de contagion, popup d'action.
- `src/components/propriete/clinique/map/CliniquePlacementDock.tsx` (nouveau) : dock « À localiser » + mode pose.
- `src/components/propriete/clinique/map/CareRoundLayer.tsx` (nouveau) : itinéraire de la tournée.
- `LayersPanel.tsx` : nouvelle entrée « État sanitaire » dans Vues de fond, avec compteur de foyers actifs et sous-options (halos, rétablis, tournée, curseur de mémoire).
- `PaletteStudio.tsx` : montage de la couche et du dock, filtre de session.
- Réutilisation de la barre de confirmation et de l'aimantation cadastre existantes ; tokens sémantiques, animations Motion, vocabulaire « Observations » et « Fréquences ».
- Aucune migration, aucune donnée existante réécrite, aucune URL publique modifiée.

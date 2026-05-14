# Simulateur enrichi : top 10 + drawer "Empreinte GPS" par espèce

## Objectif
Dans **Synthèse → Indicateurs → Simulateur** :
1. Afficher **10 espèces** au lieu de 5
2. Rendre chaque ligne **cliquable** → ouverture d'un drawer immersif montrant carte GPS + photos + dates de toutes les attributions iNaturalist de l'espèce

## 1. Passage à 10 espèces

`BiodiversitySimulator.tsx` :
- `seed` : `initialAbundance.slice(0, 10)` (au lieu de 5)
- Scénarios `monoculture` / `foretMature` / `equilibre` recalibrés pour 10 espèces (la dominante reste à 180, les 9 autres à 1, etc.)
- `SLIDER_MAX` inchangé
- Liste verticale scrollable (max-height + overflow-y) si l'écran est court

## 2. Données à transmettre

Le simulateur ne reçoit aujourd'hui que `SpeciesAbundance[]` (scientificName/commonName/kingdom/n) — **pas les attributions**. Il faut élargir le contrat pour avoir accès aux points GPS, photos et dates.

- `TaxonsIndicesPanel` passera désormais `species` (les `RawSpecies` complètes, avec `attributions`) en plus de `initialAbundance`
- `BiodiversitySimulator` enrichit chaque `SimSpecies` avec ses `attributions` (filtrées sur GPS valide pour la carte, mais conservées intégralement pour la liste photos/dates)

Champs utilisés depuis `BiodiversityObservation` :
- `exactLatitude` / `exactLongitude` → marqueurs carte
- `date` → tri chrono + affichage
- `originalUrl` → lien vers la fiche iNat
- `observerName`, `observerInstitution`, `source`, `locationName`

Photos : la structure `attributions` ne porte pas l'image. On utilisera **les photos déjà présentes dans la fiche espèce** (`species.photos[]` / `species.photoData`) en carrousel d'illustration, en complément des marqueurs cartographiques. Pas d'appel API supplémentaire.

## 3. Drawer "Empreinte GPS" — UX wahouhh

Composant nouveau `SpeciesGpsDrawer.tsx` (Sheet shadcn, side="right", taille `lg`, full-screen sur mobile).

Structure :

```text
┌─────────────────────────────────────────────┐
│ [photo cover floutée]  Nom commun           │
│                        Nom scientifique     │
│                        N obs · X individus  │
├─────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────────────────┐│
│ │             │  │ Carte Leaflet           ││
│ │  Carrousel  │  │ - marqueurs pulsants    ││
│ │   photos    │  │ - clusters proches (8m) ││
│ │  + dates    │  │ - tile dark/light theme ││
│ │             │  │ - hover marker = card   ││
│ └─────────────┘  └─────────────────────────┘│
├─────────────────────────────────────────────┤
│ Timeline horizontale des observations       │
│ ●───●──●─────●──●  (date + lien iNat)       │
└─────────────────────────────────────────────┘
```

Détails wahouhh :
- **Marqueurs cartographiques** : `divIcon` custom — petit cercle émeraude avec halo `animate-ping`, taille proportionnelle au nombre d'observations dans le cluster (réutilise `countIndividuals` pour clusteriser visuellement à 8 m comme ailleurs)
- **Hover marqueur** → mini-card flottante (date, observateur, source, lien iNat)
- **Carrousel photos** (Embla déjà présent) avec date overlay et fondu Ken-Burns lent (zoom subtil)
- **Timeline** : barre horizontale scrollable, points avec tooltip date + observateur, ordre chronologique
- **Header** : photo cover floutée en backdrop + dégradé `from-emerald-500/20 to-transparent`
- **KPI strip** : nb observations totales · nb individus GPS · période couverte (première → dernière date) · nb d'observateurs distincts
- **Empty states** : si aucune attribution GPS → message "Aucune coordonnée GPS pour cette espèce" + carrousel photos seul
- **Animations** : `motion.div` stagger sur l'apparition des marqueurs, fade+scale sur le drawer

Carte :
- Réutilise `react-leaflet` (déjà dépendance) avec tile OSM standard ou Carto pour cohérence avec `InteractiveMap.tsx`
- `fitBounds` automatique sur l'ensemble des points
- Si 1 seul point : zoom 16

## 4. Trigger d'ouverture

Sur chaque ligne du simulateur :
- Le bloc nom devient un bouton (`<button>` accessible) avec hover état (`hover:bg-muted/40`, ring émeraude au focus)
- Petite icône `MapPin` à droite du nom indiquant la possibilité d'ouvrir
- Le slider et l'input restent indépendants (clic propagation stopée)

## 5. Légende explicative

Sous le simulateur, ajouter une note courte :
> "Cliquez sur une espèce pour explorer sa **carte GPS iNaturalist**, ses photos et la chronologie de ses observations."

## Fichiers

- **modifié** `src/components/community/synthese/TaxonsIndicesPanel.tsx` — passe `species` complet au simulateur
- **modifié** `src/components/community/synthese/indices/BiodiversitySimulator.tsx` — top 10, lignes cliquables, état drawer, scénarios recalibrés
- **nouveau** `src/components/community/synthese/indices/SpeciesGpsDrawer.tsx` — Sheet + carte Leaflet + carrousel photos + timeline
- (aucun changement schéma DB, aucune nouvelle requête réseau)

## Hors périmètre
- Pas de refonte des onglets Richesse/Simpson/Shannon/Piélou
- Pas de modification des données iNaturalist (on consomme les `attributions` déjà chargées)
- Pas de nouvelle Edge Function
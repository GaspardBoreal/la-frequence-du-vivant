# Le Scénographe d'ouvrage

Aujourd'hui l'IA rend un tableau. Il faut passer du **tableau** au **plan vivant** : voir les espèces, les manipuler, composer plusieurs scénarios d'aménagement d'un ouvrage (Massif, Mare, Potager…), et pouvoir les comparer, sceller, imprimer.

## 1. Le geste d'entrée

Dans la réponse IA, sous chaque « Synthèse à exporter », un bouton pleine largeur apparaît quand un ouvrage est cadré :
**« 🎬 Ouvrir dans le Scénographe »**. Un bouton jumeau est ajouté dans l'`ObjectInspector` de l'Atelier (à côté de « Interroger l'IA »), pour entrer sans passer par le chat.

Il ouvre un plein écran immersif (fond nuit, feuille de calque, typo éditoriale existante) découpé en trois zones.

## 2. Les trois zones

```text
┌───────────────────────────────────────────────────────────┐
│  Massif couvert · 42 m² · pH 8 · limon sec   [Scénario A B C +]│
├──────────────┬──────────────────────────┬──────────────────┤
│  HERBIER     │      PLAN DE L'OUVRAGE   │   FICHE ESPÈCE   │
│  (gauche)    │       (centre)           │   (droite)       │
│              │                          │                  │
│ ▸ En place   │   contour réel de        │  grande photo    │
│   (photos)   │   l'ouvrage + strates    │  strate/hauteur  │
│ ▸ Proposées  │   drag & drop des        │  exposition      │
│   (iNat)     │   pastilles végétales    │  fonctions éco   │
│ ▸ Recherche  │   halo = envergure       │  justification   │
│              │   adulte à l'échelle     │  [retirer]       │
├──────────────┴──────────────────────────┴──────────────────┤
│  Balance : couvert 68% · mellifères 5 · nourricier 3 · ...  │
└───────────────────────────────────────────────────────────┘
```

**Herbier (gauche)** — trois onglets :
- *En place* : espèces réellement observées dans le polygone (déjà calculé par `ouvrageScope.ts`), avec leur photo marcheur si elle existe, sinon la photo iNaturalist (cascade `SpeciesThumb` existante).
- *Proposées* : les espèces de la synthèse IA, chacune avec sa vignette iNaturalist résolue automatiquement.
- *Recherche* : champ libre → taxons iNaturalist, pour ajouter une espèce hors liste.
Chaque carte est une vignette « planche d'herbier » (photo, nom français, *nom scientifique* en italique, pastille de strate) et se saisit à la souris ou au doigt.

**Plan (centre)** — le contour réel de l'ouvrage (géométrie déjà en base), fond ortho ou papier selon un switch. On dépose une espèce : elle devient une **pastille végétale** — photo ronde détourée + halo translucide dont le diamètre est l'envergure adulte réelle **à l'échelle métrique du plan**. On la déplace, on la duplique (touche/bouton « ×3 » pour poser une touffe), on la supprime. Les halos qui se chevauchent trop virent à l'ambre : concurrence signalée. Une réglette **saison** (printemps/été/automne/hiver) fait varier la couleur des halos selon floraison/feuillage.

**Fiche espèce (droite)** — s'ouvre au clic sur une pastille : grande photo, données du tableau IA (strate, hauteur, exposition, fonctions écologiques, justification), plus la mention de sa présence réelle sur le site le cas échéant.

**Balance (bas)** — indicateurs vivants recalculés à chaque geste : taux de couverture du sol, nombre d'espèces mellifères / nourricières / fixatrices d'azote, hauteur maximale, compatibilité avec le pH et la texture de la carotte de sol liée à l'ouvrage. Chaque indicateur en rouge/vert : le jardinier voit immédiatement l'effet de son geste.

## 3. Les scénarios

Onglets en haut : **Scénario A / B / C / +**. Chaque scénario est une composition indépendante sur le même ouvrage, nommable (« Version sobre », « Version nourricière »). Un mode **Comparer** affiche deux scénarios côte à côte avec leurs balances en vis-à-vis. Un scénario peut être marqué **« retenu »** — il devient la palette officielle de l'ouvrage, visible dans le registre des ouvrages et dans l'impression de l'Étape 5.

## 4. Sortie

- **Imprimer** : une planche A4 par scénario dans la langue graphique déjà en place (plan schématique + table des espèces + balance), branchée sur `OuvragePrintSheet`.
- **Renvoyer à l'IA** : bouton « Faire critiquer ce scénario » qui injecte la composition (espèces + positions + balance) comme contexte, pour un avis agronomique ciblé.

---

## Détails techniques

- **Données** : nouvelle table `propriete_ouvrage_scenarios` (id, propriete_id, objet_id, nom, retenu, plantings jsonb, created_by, timestamps) avec GRANTs + RLS alignés sur les tables propriété existantes. `plantings` = `[{ id, scientificName, commonNameFr, lat, lng, spreadM, strate, source: 'observed'|'ai'|'inat' }]`.
- **Photos** : réutilisation stricte de `SpeciesThumb` / `useSpeciesThumb` (cascade marcheur → iNaturalist → règne) ; aucune nouvelle logique d'image. La recherche taxon passe par la fonction edge `gbif-taxon-search` déjà déployée, complétée par l'autocomplete iNaturalist.
- **Espèces en place** : `ouvrageScope.ts` (ray-casting) + `usePropertySpeciesPool` — pas de nouveau filtrage géométrique.
- **Plan** : `RichMap`/Leaflet en mode plein écran (`uiOverlayLevel`), zoom jusqu'à 24 déjà autorisé ; les pastilles sont des `Marker` en `divIcon`, les halos des `Circle` en mètres réels. Drag natif Leaflet, `dnd-kit` pour le passage herbier → plan.
- **Envergure adulte** : champ ajouté au `plantIndicatorKb` / `ouvrageRecoKb` quand connu, sinon valeur par défaut par strate (couvre-sol 0,4 m, herbacée 0,6 m, sous-arbrisseau 1 m, arbuste 2 m, arbre 6 m), éditable dans la fiche espèce.
- **Entrée depuis le chat** : le parseur de tableau existant (`chatMarkdownRepair` + `ChatTableBlock`) fournit déjà les lignes ; on ajoute une action « Scénographe » qui les convertit en liste de propositions.
- **Fichiers principaux** : `src/components/propriete/scenographe/` (ScenographeFullscreen, HerbierPanel, PlantingPlanLayer, PlantingPastille, SpeciesSheet, BalanceBar, ScenarioTabs, CompareView), `src/hooks/propriete/useOuvrageScenarios.ts`, `src/lib/plantSpread.ts`, print : `ScenarioPrintSheet.tsx`.

## Ordre de livraison

1. Table + hook scénarios, coquille plein écran, onglets scénarios.
2. Herbier (en place / proposées) avec photos, drag & drop vers le plan, pastilles + halos à l'échelle.
3. Fiche espèce, duplication, saisons, détection de concurrence.
4. Balance vivante branchée sur la carotte de sol liée.
5. Recherche iNaturalist, comparaison de scénarios, scénario retenu.
6. Impression A4 et retour vers l'IA.

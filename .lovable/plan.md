## Diagnostic (vérifié dans le code)

Les deux cartes n'affichent pas la même chose :

- **Portrait → Cadastre** (`PortraitCadastre.tsx`) dessine les **parcelles enregistrées de la propriété** (`useProprieteParcelles` → table `propriete_parcelles`), en vert : vos 3 parcelles.
- **J'identifie → Carte des révélations** (`RevealMapBlock.tsx`) ne dessine **aucune** parcelle enregistrée. Le polygone orange/rouge visible sur la copie 1 provient de `RichMap` → `CadastreLayer`, qui interroge le cadastre pour **un seul point pivot** (le centre de la carte, cf. `cadastrePoints` dans `RichMap.tsx`). D'où : une seule parcelle, et seulement quand le style « Cadastre » est actif.

Les géométries des 3 parcelles sont pourtant déjà chargées dans `RevealMapBlock` (`useProprieteParcelles`) — elles ne servent aujourd'hui qu'au géofence (calcul dedans/limite/dehors), jamais au rendu.

## Correction proposée

1. **Dessiner le périmètre réel dans la Carte des révélations**
   - Dans `RevealMapBlock.tsx`, rendre un `<GeoJSON>` par parcelle enregistrée (géométrie non nulle) en enfant de `RichMap`, sous les marqueurs.
   - Style aligné sur Portrait → Cadastre : trait vert `#2f5d3a`/`#10b981`, remplissage très léger (~8 %), pour que les points restent lisibles.
   - Popup/tooltip minimal au survol : section + numéro + contenance (mêmes champs que Portrait).

2. **Rendre l'affichage indépendant du fond de carte**
   - Le périmètre s'affiche quel que soit le style (Géo/Sat/Relief/Cadastre), contrairement à la couche cadastre dynamique.
   - Petit toggle « Périmètre » dans la barre de filtres de la carte pour le masquer si besoin.

3. **Cohérence du cadrage**
   - Inclure les sommets des parcelles dans le calcul de `bounds` (en plus des observations), pour que les 3 parcelles soient toujours dans le cadre initial et après « Recadrer ».

4. **Même traitement en plein écran** (le `mapNode` est partagé, donc automatique).

## Détails techniques

- Fichier principal : `src/components/propriete/identify/blocks/RevealMapBlock.tsx` (aucun changement de données ni de RPC).
- Réutilisation de `parcelles` déjà retourné par `useProprieteParcelles`; le géofence reste inchangé.
- Rendu via `GeoJSON` de `react-leaflet` avec `key` stable sur `parcelle.id` pour éviter les remontages.
- Aucune modification de `RichMap.tsx` nécessaire (les enfants sont rendus dans la carte) ; option `pane` par défaut, sous les marqueurs.

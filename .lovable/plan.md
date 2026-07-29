## Le problème

La barre d'onglets (« Portrait / J'observe / J'analyse / J'identifie / Je synthétise / Palette végétale ») est `sticky top-0 z-[60]` (`src/pages/ProprieteEspace.tsx`, ligne 370).

Le conteneur de la « Carte des révélations » (`RevealMapBlock.tsx`, ligne 487) est `relative` **sans z-index**, donc il ne crée aucun contexte d'empilement. Résultat : les panneaux internes de Leaflet, qui portent des z-index élevés définis en dur (`.leaflet-pane` 400 à 1000, plus les overrides de `src/index.css` lignes 1007-1009), sont comparés directement à la barre `z-[60]` — et gagnent. La carte, ses marqueurs et ses popups s'affichent donc par-dessus le menu au défilement.

## La correction

Confiner Leaflet dans son propre contexte d'empilement, de sorte que tout son contenu interne reste plafonné à la couche du bloc carte (bien en dessous de `z-[60]`).

1. `src/components/propriete/identify/blocks/RevealMapBlock.tsx` — ajouter `isolate z-0` au conteneur de carte (ligne 487). En plein écran (portail `z-[2000]`) rien ne change, le portail garde sa propre couche.

2. Appliquer la même correction aux autres cartes de l'espace Propriété, qui présentent exactement le même défaut et donc le même bug au scroll :
   - `src/components/propriete/analyze/blocks/SamplesMapBlock.tsx` (ligne 183)
   - `src/components/propriete/palette/ZonesMapBlock.tsx` (ligne 200)
   - `src/components/propriete/palette/ExcludedSpeciesMap.tsx` (ligne 110)
   - `src/components/propriete/portrait/PortraitCadastre.tsx` (ligne 277)

3. Vérifier que les boutons flottants internes aux cartes (plein écran `z-[400]`, recentrage, bandeau GPS) restent visibles : comme ils sont enfants du même conteneur isolé, leur ordre relatif est préservé.

## Détails techniques

`isolation: isolate` (classe Tailwind `isolate`) crée un contexte d'empilement sans modifier la mise en page ni les événements souris. Combiné à `z-0`, il garantit que le sous-arbre Leaflet ne peut plus se hisser au-dessus des éléments sticky de la page. C'est la solution recommandée pour Leaflet dans les mises en page avec en-têtes collants, préférable à l'alternative consistant à relever le z-index du menu, qui ne ferait que déplacer le conflit vers les autres overlays (drawers, lightbox, console GPS).

## Vérification

Contrôle visuel sur `/propriete/maison-sous-blossac`, onglet « J'identifie » : faire défiler jusqu'à ce que la carte atteigne la barre d'onglets, puis confirmer que la carte disparaît **sous** le menu. Répéter sur « J'analyse » (plan de prélèvements), « Palette végétale » (emplacements) et « Portrait » (cadastre).

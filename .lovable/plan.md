## Ce que j'ai compris

La portée « cadastre » ne doit pas être un réglage local à l'Atelier : c'est un **réglage global de la propriété**. Partout où l'application affiche ou compte des observations du vivant d'une propriété (cartes, listes, compteurs, synthèses, impressions), on ne considère par défaut **que les observations strictement comprises dans le plan cadastral**. L'utilisateur peut basculer sur « tous » depuis n'importe quelle surface qui expose le sélecteur, et ce choix s'applique immédiatement partout.

## Le réglage

Deux valeurs exclusives, une seule source de vérité :

- **Observations du vivant (cadastre)** — uniquement les points `inside` (ray casting strict sur les parcelles, **sans** tampon de 25 m). **Défaut.**
- **Observations du vivant (tous)** — comportement actuel.

Persistance du choix par propriété (localStorage, clé `propriete:<id>:vivant-scope`), pour qu'un retour sur la fiche retrouve le même cadrage.

Repli de sécurité : si la propriété n'a aucune parcelle cadastrale (géofence vide), l'option cadastre est désactivée, signalée « aucune parcelle cadastrale », et la portée effective est « tous » — jamais d'écran vide silencieux.

## Surfaces impactées

Toutes les vues qui consomment le pool d'observations de la propriété :

| Surface | Effet |
|---|---|
| Atelier du jardin nourricier (panneau Calques) | Sélecteur segmenté Cadastre / Tous sous « Observations du vivant » + compteurs ; couche carte, filtres Vivant, lightbox, bilan alignés |
| J'identifie · Carte des révélations | Portée globale appliquée en amont ; le filtre « périmètre » local devient cohérent (et masqué quand la portée est « cadastre ») |
| J'identifie · Cortège révélé, Delta, Sentinelles | Comptages et concordances calculés sur la portée active |
| Étape 5 · Palette (emplacements, espèces exclues, moteur de recommandation) | Recommandations et indicateurs calculés sur la portée active |
| Bloc « Preuves de biodiversité » de la fiche propriété | Compteurs espèces / observations alignés |
| Contrôle GPS (console + curation en place) | Reste sur **tous** par construction : c'est l'outil qui sert justement à rapatrier les points hors cadastre ; il affiche le statut géofence et le nombre de points hors emprise |
| Impressions (Portrait, J'observe, J'analyse, J'identifie, Je synthétise) | Reprennent la portée active et mentionnent explicitement le cadrage en pied de page (« Périmètre : plan cadastral » ou « toutes observations ») |

## Cohérence des chiffres

Le point sensible est l'écart de compteurs entre vues. On centralise donc le calcul : un seul filtrage, en amont, produit à la fois la liste affichée et tous les compteurs dérivés. Chaque en-tête de bloc concerné affiche `n espèces · m obs.` issus de la même source, et un badge discret rappelle la portée en cours quand elle est « cadastre ».

## Détails techniques

- Nouveau contexte `ProprieteVivantScopeContext` (`src/contexts/ProprieteVivantScopeContext.tsx`) : `{ scope, setScope, cadastreAvailable }`, monté dans le layout de la fiche propriété (`ProprieteEspace`), initialisé à `cadastre`, persisté par propriété.
- Nouveau hook `usePropertyWaypointsScoped(proprieteId, parcelles)` (`src/hooks/propriete/`) : construit le géofence via `buildGeofence`, annote chaque waypoint avec `evaluateGeofence`, expose `all`, `scoped`, `insideCount`, `outsideCount`. Il devient le point d'entrée unique en remplacement des appels directs à `usePropertySpeciesPool` dans les vues d'affichage.
- Le filtrage strict utilise `geofenceStatus === 'inside'` (buffer 0), distinct du tampon 25 m conservé pour l'étiquetage « en limite » dans le Contrôle GPS.
- `LayersPanel.tsx` : `SystemLayerState` inchangé pour l'affichage on/off ; ajout d'un sélecteur segmenté branché sur le contexte, avec compteurs et état désactivé si `!cadastreAvailable`.
- Migration des consommateurs : `PaletteStudio`, `RevealMapBlock`, `DeltaBlock`, `SentinellesBlock`, `TabPalette`, `ExcludedSpeciesMap`, `BiodiversityEvidenceBlock`, `usePropertyFloraMatched`, `useExcludedOnSite`, `FloraAtlasPrintPlates` — tous lisent la portée via le contexte au lieu de recalculer ou d'ignorer le géofence.
- `GpsControlConsole` et `useExplorationGpsCandidates` restent explicitement hors portée (toujours « tous »).
- Aucun changement de schéma, de RPC ni de requête réseau : le filtrage est purement côté lecture, à partir des parcelles déjà chargées.

## Vérification

Sur `jardin-monde-deviat` : contrôler que le compteur cadastre est identique dans l'Atelier, la Carte des révélations et le bloc Preuves de biodiversité, que le basculement « tous » les fait tous varier ensemble, et que l'écart cadastre/tous correspond bien au nombre de points `outside` annoncé par le Contrôle GPS.

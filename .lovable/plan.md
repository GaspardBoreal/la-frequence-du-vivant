## Diagnostic

Le 76 affiché **n'est pas un bug** : c'est bien l'union exacte de notre base.

Vérifié sur `carte_sol_vivant_points` :

- Jardiniers → **51** (gogocarto sidebar : 50)
- Jardins d'insertions ou pédagogiques → **25** (identique)
- Chevauchement entre les deux tags → **0**
- Union = **51 + 25 = 76** ✅

Aucun doublon détecté (ni par nom, ni par coordonnées). Nous avons **1 point Jardinier de plus que la sidebar gogocarto**. Causes probables :

1. Sidebar gogocarto en cache/retard sur ses propres données.
2. Notre dernière synchro plus récente que ce que gogocarto affiche.
3. Un delete côté gogocarto non encore propagé chez nous.

Mon chiffre « 75 » du message précédent venait des captures d'écran gogocarto, pas de notre base. **La légende 76 est donc factuellement correcte** — le vrai souci est la *promesse implicite* d'égalité stricte avec gogocarto qui inquiète le visiteur.

## Correction

### 1. Reformuler la légende (`src/components/carte-mdv/views/MapView.tsx`)

Remplacer :
> Source : Carte Sol Vivant — multi-catégories

Par :
> Source : [Carte Sol Vivant](https://cartesolvivant.gogocarto.fr) — mise à jour le JJ/MM/AAAA

Tooltip enrichi :
> « Un partenaire peut appartenir à plusieurs catégories : il est compté dans chaque filtre correspondant. Les totaux peuvent différer de 1 ou 2 points par rapport à la sidebar gogocarto, selon la fraîcheur de chaque source. »

### 2. Exposer la date de dernière synchro (`src/hooks/useCarteMdV.ts`)

Ajouter `updated_at` au `SELECT` de `useSolVivantPoints` (déjà présent en base). Puis côté `MapView`, calculer `Math.max(...points.map(p => new Date(p.updated_at).getTime()))` pour afficher la date la plus récente.

### 3. Fiabiliser la synchro (post-implémentation)

Déclencher manuellement `sync-carte-sol-vivant` après le déploiement. Si gogocarto est effectivement passé à 50 Jardiniers, notre point excédentaire disparaîtra ; sinon on saura que la sidebar gogocarto est en retard, et l'écart de 1 restera légitime et documenté.

## Fichiers touchés

- `src/hooks/useCarteMdV.ts` — ajouter `updated_at` dans `SolVivantPoint` + SELECT
- `src/components/carte-mdv/views/MapView.tsx` — reformulation légende + date + tooltip

Aucune migration DB, aucun changement d'edge function côté code (juste une exécution manuelle après coup).

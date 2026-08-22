# Indicateur discret de sondes actives sur les vignettes propriété

Quand une propriété dispose de capteurs IoT (ex. Jardin Monde DEVIAT), la vignette dans l'écran de démarrage affichera un signal vivant discret indiquant le nombre de sondes actives.

## Ce que verra l'utilisateur

Dans le dialogue « Bienvenue Gaspard », les vignettes des propriétés avec au moins une sonde active porteront un petit badge doré/vert en haut à droite :

- Un point pulsant vert (comme un battement) suivi du nombre de sondes actives.
- Si des sondes sont en maintenance, un compteur secondaire discret « +1 en maintenance » apparaît au survol/desktop ou dans la ligne sous le nom de la propriété.
- L'indicateur est absent quand il n'y a aucune sonde (pas de badge vide, pas de zéro).

```text
[Jardin Monde DEVIAT]        ● 3 actives
    DEVIAT · propriétaire    +1 en maintenance
```

## Données

1. **Étendre la RPC `get_user_apps_access()`** pour qu'elle renvoie, pour chaque propriété, le même triptyque de compteurs que pour les partenaires :
   - `capteurs_count` : total de sondes liées à la propriété
   - `capteurs_actifs` : sondes en service et actives (`etat <> 'maintenance' AND actif = true`)
   - `capteurs_maintenance` : sondes déclarées en maintenance (`etat = 'maintenance'`)
2. **Mettre à jour le type `ProprieteAccess`** dans `src/hooks/useUserAppsAccess.ts` avec les trois nouveaux champs optionnels.
3. **Adapter le mapping** dans `useUserAppsAccess` pour propager ces valeurs.

## Composants

1. **Vignette `ProprieteTile`**
   - Accepter un nouvel objet `sondes?: { actives: number; maintenance: number }`.
   - Si `actives > 0`, afficher un badge circulaire en haut à droite :
     - halo pulsant subtil (animation CSS, respecte `prefers-reduced-motion`)
     - icône `Radio` ou `Activity` de Lucide, mini, blanche/or
     - nombre en chiffre blanc, texte-xs, gras
     - fond : dégradé vert émeraude vers or, bordure blanc/20, ombre douce
   - Le badge ne recouvre pas l'image de plus de 8 px ; il est placé au-dessus du coin supérieur droit avec `translate(25%, -25%)` pour rester contenu dans la vignette.

2. **Ligne `AppChoiceDialog`**
   - Dans la section « Vos jardins & propriétés », calculer les compteurs et les passer à `ProprieteTile`.
   - Enrichir le sous-titre de la propriété pour y glisser le compteur de maintenance quand il existe, en gardant la ligne courte et lisible :
     - `DEVIAT · propriétaire · 3 sondes actives`
     - `+1 en maintenance` en teinte plus douce si besoin.

3. **Sélecteur d'espaces `AppSwitcher`** (si le même composant/les mêmes données sont utilisés)
   - Vérifier que les compteurs sont aussi disponibles là-bas, ou au moins que le badge de sondes actives se répercète.

## Design et accessibilité

- **Discret** : pas de badge quand aucune sonde, pas de zéro, pas de texte long.
- **Inspirant** : le halo pulsant évoque le « vivant » du jardin, pas une alerte.
- **Mobile-first** : badge de 20 px, texte lisible à 40 px, pas d'info au survol uniquement.
- **Reduced motion** : l'animation est désactivée si l'utilisateur a demandé de réduire les animations.

## Sécurité

- La RPC est déjà `SECURITY DEFINER` et limitée à `authenticated` ; les compteurs sont calculés sur les données déjà accessibles via `can_access_propriete`.
- Aucune exposition de données nouvelles : on agrège uniquement les sondes des propriétés que l'utilisateur voit déjà.

## Fichiers concernés

- `supabase/migrations/` : nouvelle migration éditant `public.get_user_apps_access()` (ajout des 3 champs dans le `jsonb_build_object` des propriétés).
- `src/hooks/useUserAppsAccess.ts` : extension du type et du mapping.
- `src/components/community/ProprieteTile.tsx` : badge de sondes actives.
- `src/components/community/AppChoiceDialog.tsx` : passer les compteurs et enrichir le sous-titre.
- `src/components/community/AppSwitcher.tsx` : vérifier / synchroniser l'affichage si nécessaire.

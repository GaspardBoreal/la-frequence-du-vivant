Diagnostic clair

1. Boutinet `/m/chateau-boutinet-le-vignoble-vivant-2026-09-26`
- Ce qui s'affiche n'est plus la scéno iframe, c'est le template dédié `VignobleImmersion`.
- Le Brand Kit est bien détecté en base (`brand_kit_enabled=true`, `brand_kit_slug=chateau_boutinet`), mais `VignobleImmersion` utilise ses propres variables `--vignoble-*` + un fond hero hardcodé bordeaux/noir.
- Résultat : seul le badge Boutinet en haut change, mais toute la scène reste “Grand Cru” sombre.

2. Jardin `/jardin/dbaf6db0-3a0a-4823-9a50-ec0c324ccaea`
- L'événement Jardin a `cover_image_url = null` et `is_public = false`.
- Il y a pourtant 36 photos dans `marcheur_medias`, toutes `is_public=true`.
- Mais la règle RLS actuelle autorise les visiteurs anonymes à lire ces photos seulement si l'événement parent est `is_public=true`.
- Donc la fiche Jardin charge l'événement par ID, mais les images sont bloquées côté lecture publique : hero + strate 1 restent sur fond vide.

Plan de correction efficace

1. Corriger Boutinet sans réécrire toute la scène
- Dans `brand-kit.css`, ajouter un override spécifique : `[data-brand-kit='chateau_boutinet']`.
- Mapper les variables `--vignoble-*` vers la palette Boutinet : sauge, crème, ambre/orange.
- Surcharger `.vignoble-hero-bg` sous Brand Kit pour remplacer le fond bordeaux/noir par un fond diurne sauge/ambre.
- Surcharger les overlays très sombres du hero Vignoble pour que la scène devienne réellement claire.
- Garder la structure premium existante, mais repeinte en “Boutinet diurne”.

2. Corriger Jardin à la source, sans rendre l'événement entièrement public
- Ajouter une RPC Supabase `get_garden_hero_photos(_event_id uuid)` en `SECURITY DEFINER`.
- Cette RPC retournera uniquement des images déjà publiques :
  - `marcheur_medias` où `type_media='photo'` et `is_public=true`, via `url_fichier` ou `external_url` ;
  - `marche_photos` officielles si présentes ;
  - éventuellement `exploration_convivialite_photos` non masquées si l'exploration est liée.
- Elle ne rendra pas les données privées publiques : seulement les URLs de photos marquées publiques.

3. Adapter `useGardenFiche`
- Remplacer le fallback fragile par l'appel à cette RPC pour le hero.
- Conserver `cover_image_url` en premier si un jour il existe.
- Inclure `external_url` en fallback, pas seulement `url_fichier`.
- Dédupliquer les URLs.

4. Durcir l'affichage image
- Dans `KenBurnsCarousel`, si une image échoue au chargement, passer automatiquement à la suivante au lieu d'afficher une scène vide.
- Pour la Strate 1, ne jamais passer un tableau vide issu de `slice(0, 3)` : utiliser la liste complète si nécessaire.

Validation après implémentation

- Vérifier `/m/chateau-boutinet-le-vignoble-vivant-2026-09-26` : le hero doit passer en palette sauge/ambre Boutinet, plus de grand fond bordeaux dominant.
- Vérifier `/jardin/dbaf6db0-3a0a-4823-9a50-ec0c324ccaea?tab=carte&cat=jardin` : le hero haut et la strate 1 doivent afficher les photos marcheurs.
- Vérifier qu'aucune photo non publique n'est exposée.
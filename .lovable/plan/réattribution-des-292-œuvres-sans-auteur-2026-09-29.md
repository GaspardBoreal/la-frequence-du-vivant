# Réattribution des 292 œuvres sans auteur

## Constat
Les 241 photos et 51 sons de marches (contenus éditoriaux) n'ont aucun champ « auteur » : impossible aujourd'hui de les rattacher à un compte. Il faut d'abord leur créer cette case, puis une interface pour la remplir.

## Ce que vous verrez
Nouvelle page **Admin → Outils → « Attribuer les œuvres »** (lien aussi depuis la carte « 292 Auteur non enregistré » de la note).

Mobile first, en trois temps :

1. **Compteur de progression** en haut : « 292 à attribuer · 0 fait », barre qui avance.
2. **Filtres simples** : Photos / Sons, par marche ou événement, par date. Groupement par marche (les œuvres d'une même marche ont souvent le même auteur).
3. **Grille de vignettes** (sons : lecteur compact + titre). Toucher = sélectionner ; « Tout sélectionner dans cette marche ».
   Barre d'action collée en bas d'écran : **« Attribuer à… »** ouvre une feuille avec :
   - suggestions en tête : participants inscrits à cette marche, compte association « Les marches du Vivant », G. Boréal ;
   - recherche par nom parmi tous les marcheurs.
   Confirmation, puis les vignettes disparaissent de la file.

Onglet **« Déjà attribuées »** pour corriger ou annuler une attribution (avec qui/quand).

## Effet sur la note de valorisation
Chaque attribution fait basculer l'œuvre de « Auteur non enregistré » vers G. Boréal, l'association ou « autres marcheurs », et alimente le classement des principaux contributeurs. Objectif : 0 %.

## Garde-fous
- Réservé à l'administrateur.
- Journal de chaque attribution (ancien/nouvel auteur, date, qui) : traçabilité pour les statuts.
- Aucune attribution automatique : on suggère, vous décidez.

## Détails techniques
- Migration : `author_user_id uuid` (nullable), `attributed_at`, `attributed_by` sur `marche_photos` et `marche_audio` ; table `media_author_attribution_log` (GRANT + RLS admin).
- RPC SECURITY DEFINER `assign_marche_media_author(kind, ids uuid[], user_id)` et `list_unattributed_marche_media(filters)` + suggestions via participations de la marche, contrôle `check_is_admin_user`.
- `get_data_asset_stats()` : `works` lit `author_user_id` pour photos/audios de marches (gaspard / association / others / unattributed) et les inclut dans `top_marcheurs`.
- Page `src/pages/AdminAttributionOeuvres.tsx`, route `/admin/attribution-oeuvres`, carte dans Outils, lien depuis AdminNoteDonnees.

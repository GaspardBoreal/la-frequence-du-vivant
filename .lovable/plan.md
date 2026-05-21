## Objectif
Rétablir l’accès à la page publique `/m/:slug` pour les marches déjà publiées, sans casser les URLs existantes.

## Problème identifié
La marche est bien publiée en base (`is_public = true` et `public_slug` présent), mais la RPC `public.get_public_event(_slug)` plante avant de renvoyer les données.

Erreur exacte isolée :
- `column e.organisateur_id does not exist`

Cause :
- la fonction SQL `get_public_event(...)` fait une jointure sur `public.marche_events.organisateur_id`
- or cette colonne n’existe pas sur la table `marche_events` dans le schéma actuel
- du coup la page React reçoit une erreur, puis affiche l’état de repli “Page introuvable”

## Plan
1. Corriger la fonction SQL `public.get_public_event(_slug)` pour qu’elle ne référence plus de colonne inexistante.
2. Garder la compatibilité des liens publics existants en conservant la recherche par `public_slug` + `is_public = true`.
3. Retourner un payload valide même sans organisateur lié, afin que la page publique rende correctement le contenu principal.
4. Vérifier ensuite que l’appel RPC renvoie bien l’événement pour le slug concerné.
5. Revalider l’URL publique de la marche pour confirmer la disparition du faux “Page introuvable”.

## Détails techniques
- Changement attendu : migration SQL ciblée sur `public.get_public_event(text)`.
- Approche la plus sûre : supprimer la jointure cassée vers `marche_organisateurs` tant qu’aucun lien organisateur n’existe réellement sur `marche_events`.
- Le champ `organisateur` renverra `null` au lieu de faire échouer toute la page.
- Aucun changement d’URL, de slug, ni de logique de publication.

## Validation
- Test SQL : `select public.get_public_event('<slug>')`
- Test fonctionnel : ouvrir l’URL publique de la marche publiée et vérifier que la page s’affiche
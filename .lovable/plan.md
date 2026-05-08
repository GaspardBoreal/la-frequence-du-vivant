# Nommer chaque marcheur dans la section "Des marcheurs"

## Diagnostic
La section "Des marcheurs" affiche les médias uploadés par d'autres comptes en bloc anonyme. Le nom de l'uploader est déjà résolu (`uploaderNameById` dans `VoirTab`) mais n'est utilisé que dans la lightbox.

## Correction
Dans `MarcheDetailModal.tsx > VoirTab` :

1. **Ajouter `avatar_url`** au select des `uploaderProfiles` (déjà fait pour prenom/nom).
2. **Construire `othersGroups`** (memo) regroupant `othersMedias` par `user_id`.
3. **Remplacer le rendu plat** de `othersMedias` par une boucle sur `othersGroups`, avec en-tête par marcheur :
   - Avatar (`community_profiles.avatar_url`) ou icône `Users` en fallback
   - Nom complet + compteur, ex. « Victor X (1) »
   - Style cohérent avec la section « Crédité à … » mais en bleu
4. **Conserver l'ordre lightbox** : les médias sont linéarisés dans le même ordre que le rendu (offset cumulé par groupe).

## Fichiers impactés
- `src/components/community/MarcheDetailModal.tsx` (composant `VoirTab` uniquement)

## Hors périmètre
- Pas de changement back-end / RLS
- Pas de modification des autres onglets

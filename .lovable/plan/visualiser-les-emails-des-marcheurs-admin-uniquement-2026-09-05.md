# Visualiser les emails des marcheurs — admin uniquement

## État actuel (vérifié)

- La recherche par email fonctionne déjà (onglet Communauté + mosaïque Profils) via la RPC `admin_get_profile_emails`, protégée par `check_is_admin_user(auth.uid())` — non-admin → aucun résultat.
- L'onglet Communauté (tableau) affiche déjà une colonne **Email**.
- En revanche, la vue **mosaïque (onglet Profils)** n'affiche pas l'email sur les cartes : on peut chercher par email mais pas le lire.

## Ce qui sera fait

1. **Affichage de l'email sur les cartes de la mosaïque Profils**
   - Dans `ProfilsMosaique.tsx`, sous le nom/ville : ligne email en petit, tronquée si longue, avec icône copie (presse-papiers) au survol/clic.
   - Affichage conditionnel : uniquement si l'email est résolu (sinon rien, pas de « — » bruyant).

2. **Copie rapide dans le tableau Communauté**
   - Sur la colonne Email existante de `CommunityProfilesAdmin.tsx` : clic → copie dans le presse-papiers + toast de confirmation.

3. **Garantie « admin uniquement » (déjà en place, à conserver)**
   - La seule source d'emails reste la RPC `SECURITY DEFINER` qui refuse tout non-admin ; aucun email n'est stocké dans `community_profiles` ni exposé dans une vue publique.
   - Vérification finale : un utilisateur non-admin connecté reçoit une liste vide.

## Hors périmètre

- Aucune nouvelle colonne en base, aucune modification de RLS, aucune edge function.
- Pas d'affichage d'email hors des écrans `/admin/*`.

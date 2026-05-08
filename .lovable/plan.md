# Attribution réelle dans l'onglet Voir

## Diagnostic

Dans `MarcheDetailModal.tsx > VoirTab`, le tri se fait sur l'**uploader** :

```ts
const myMedias = userMedias?.filter(m => m.user_id === userId) || [];
const othersMedias = userMedias?.filter(m => m.user_id !== userId && m.is_public) || [];
```

`m.user_id` reste toujours Gaspard (uploader), même après réattribution. L'auteur réel est porté par `attributed_marcheur_id` (FK vers `exploration_marcheurs`), table qui possède une colonne `user_id` reliant le marcheur éditorial à un compte (Sophie D.).

→ Toutes les photos uploadées par Gaspard remontent sous "Mes contributions", même celles créditées à Sophie.

## Correction (UI uniquement, robuste)

### 1. Calcul d'un `effectiveAuthorUserId` par média
- Si `attributed_marcheur_id` défini → résoudre le `user_id` du marcheur via la liste `explorationMarcheurs` déjà chargée.
- Sinon → fallback sur l'uploader `m.user_id`.
- Si le marcheur attribué n'a pas de `user_id` (cas "shadow") → traiter comme auteur tiers identifié par son nom.

### 2. Trois buckets d'affichage
- **Mes contributions** : `effectiveAuthorUserId === userId` (Gaspard ne voit ici que ce qui lui revient vraiment).
- **Crédités à d'autres marcheurs** : groupés par marcheur attribué avec en-tête (avatar + nom + compteur), même si je suis l'uploader (sinon je perds la trace de mes uploads recrédités).
- **Des marcheurs** : photos uploadées par d'autres et non attribuées à moi, filtrées par `is_public` comme aujourd'hui.

### 3. Cas miroir
Photo attribuée à moi mais uploadée par un autre → remonte automatiquement dans "Mes contributions". Comportement symétrique et cohérent.

### 4. Lightbox & permissions
- `isOwner` devient `effectiveAuthorUserId === userId`.
- Les actions édition/suppression restent contrôlées par RLS côté serveur (pas de changement back).

### 5. En-têtes par groupe
Réutiliser le style amber/blue existant. Sous-titre par marcheur attribué : avatar `exploration_marcheurs.avatar_url`, nom complet, badge "crédité".

## Fichiers impactés

- `src/components/community/MarcheDetailModal.tsx` — refactor du composant `VoirTab` uniquement (calcul des groupes + rendu en sections par auteur).

## Hors périmètre

- Pas de migration SQL (données et RLS déjà correctes, pur affichage).
- Pas de modification du hook `useReattributeMedia` ni du RPC `reattribute_media`.
- Onglet **Lire** non modifié (même logique applicable si confirmé ensuite).

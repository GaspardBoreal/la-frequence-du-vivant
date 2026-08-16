# Navigation de retour dans l'espace partenaire IoT

## Constat

L'en-tête de `/partenaire-iot/:slug` n'affiche que le logo, le nom du fabricant et les trois onglets. Aucune flèche de retour, aucun sélecteur d'espaces — alors que l'espace propriété (`ProprieteEspace`) propose déjà, dans son bandeau : une flèche « Retour » vers Mon Espace, l'identité du lieu, et le composant `AppSwitcher` qui liste tous les espaces accessibles à l'utilisateur (Mon Espace, propriétés, partenaires IoT).

## Ce que je mets en place

Reprendre exactement la même logique dans l'en-tête partenaire :

1. **Flèche de retour** à gauche du logo, vers `/marches-du-vivant/mon-espace`, avec `aria-label="Retour"` — même geste et même position que dans l'espace propriété.
2. **Sélecteur d'espaces** (`AppSwitcher`) à droite, avec `currentContext={slug}` : l'utilisateur voit d'un coup d'œil Mon Espace, ses propriétés et ses autres espaces partenaires, et bascule sans repasser par l'accueil. Il ne s'affiche que s'il existe au moins un autre espace, comme ailleurs.
3. **Retour interne aux onglets** : depuis « Poste de contrôle » ou « Carte des sondes », la flèche ramène d'abord à l'onglet « Accueil » de l'espace partenaire ; c'est seulement depuis l'accueil qu'elle sort vers Mon Espace. Le bouton retour du navigateur reste cohérent.

## Détails techniques

- Fichier : `src/pages/PartenaireIot.tsx` (en-tête uniquement).
- Récupérer l'`userId` via la session Supabase (`supabase.auth.getUser`, ou le hook d'auth déjà utilisé dans l'app) pour alimenter `AppSwitcher`.
- Le retour inter-onglets réutilise `setTab('accueil')` ; le retour sortant utilise un `Link` vers `/marches-du-vivant/mon-espace`.
- Aucun changement de données, de RPC ou de droits : purement présentation et navigation.

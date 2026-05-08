# Traduction FR des espèces — onglet Marcheurs › carte Marcheur › Contributions

## Diagnostic

Dans `src/components/community/exploration/MarcheursTab.tsx`, le `ContributionsSubTab` (lignes ~404-601) liste les espèces observées par chaque marcheur. Aujourd'hui :

```ts
const frenchName = translation?.commonName || obs.commonName;
```

`obs.commonName` provient des snapshots de biodiversité (souvent en anglais : « Common Buzzard », « House Sparrow »…). Quand la traduction FR n'est pas encore chargée — ou quand le hook `useSpeciesTranslationBatch` retombe sur le `fallback` —, c'est l'anglais qui s'affiche. Résultat visible : les noms communs sortent en EN au lieu du FR.

Cela viole la règle mémoire « tout affichage de nom d'espèce passe par `<SpeciesName />` ou un hook utilisant `useFrenchSpeciesNamesAuto`. Jamais de `commonName` brut affiché. »

## Correctif (frontend uniquement)

Dans `ContributionsSubTab` :

1. Remplacer `useSpeciesTranslationBatch` par `useFrenchSpeciesNamesAuto` (qui expose explicitement `commonNameFr`, distinct de l'éventuel fallback EN).
2. Pour chaque ligne :
   - Garder le nom scientifique en italique comme titre (inchangé).
   - N'afficher la légende sous-titre **que si** une vraie traduction FR existe (`resolution.commonNameFr`). Sinon, ne rien afficher (plutôt que de montrer l'anglais).
3. Bénéfice secondaire : l'auto-remplissage en arrière-plan (edge function `translate-species`) peuplera la base, et les visites suivantes afficheront le FR avec un fade-in.

Aucun changement métier, aucune migration, aucune édition d'edge function.

## Fichier touché

- `src/components/community/exploration/MarcheursTab.tsx` (uniquement le rendu du `ContributionsSubTab`, ~lignes 466-468 et 537-584).

## Vérification

- Recharger `/marches-du-vivant/mon-espace/exploration/{id}` › onglet Marcheurs › déplier un marcheur › sous-onglet « Contributions ».
- Vérifier qu'aucun nom commun anglais ne reste affiché ; soit une légende FR apparaît, soit seul le nom scientifique reste visible (puis bascule en FR au prochain rafraîchissement après auto-fill).

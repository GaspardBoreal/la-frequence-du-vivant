

# Fix: Onglet "Marches" vide — garde `userId` trop restrictive

## Diagnostic

Ligne 252 de `ExplorationMarcheurPage.tsx` :
```typescript
{activeGlobalTab === 'marches' && userId && (
```

Le contenu entier de l'onglet Marches (step selector + sous-onglets sensoriels) est conditionne par `userId`. Si la session n'est pas encore chargee ou si l'utilisateur consulte sans etre connecte, **tout disparait** — y compris les contenus publics (photos admin, contributions publiques des marcheurs).

Les 11 marches de l'exploration sont bien en base et la requete `explorationMarches` fonctionne. Le probleme est purement un garde UI trop stricte.

## Correctif

### Fichier : `src/components/community/ExplorationMarcheurPage.tsx`

1. **Retirer `&& userId` de la condition ligne 252** — afficher le step selector et les sous-onglets meme sans session
2. **Passer `userId` en optionnel** aux composants enfants (`VoirTab`, `EcouterTab`, `LireTab`, `VivantTab`) avec `userId || ''`
3. **Rendre le hook `useMarcheurStats` tolerant** a un `userId` vide — il retourne deja 0 quand `enabled` est false, donc les badges afficheront simplement 0 pour un visiteur non connecte

Changement minimal : remplacer `&& userId &&` par `&&` sur une seule ligne.

## Fichier impacte

| Fichier | Action |
|---|---|
| `src/components/community/ExplorationMarcheurPage.tsx` | Retirer la garde `userId` sur le rendu de l'onglet Marches (ligne 252) |


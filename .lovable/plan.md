
# Plan : Replier les parties par défaut à l'arrivée

## Objectif
Lorsque l'utilisateur clique sur l'onglet "Parties", toutes les sections (mouvements) doivent être **repliées par défaut** pour une vue compacte affichant uniquement les titres et sous-titres.

---

## Modification technique

**Fichier** : `src/components/admin/ExplorationPartiesManager.tsx`

### Changements à effectuer

| Ligne | Avant | Après |
|-------|-------|-------|
| 65 | `expandedParties[p.id] !== false` | `expandedParties[p.id] === true` |
| 80 | `prev[partieId] === undefined ? false : !prev[partieId]` | `!prev[partieId]` |
| 252 | `isExpanded={expandedParties[partie.id] !== false}` | `isExpanded={expandedParties[partie.id] === true}` |

### Logique

- **Avant** : `undefined` était traité comme `true` (ouvert)
- **Après** : `undefined` sera traité comme `false` (fermé)

Ainsi, à l'arrivée sur l'écran, le state `expandedParties` est vide (`{}`), et toutes les parties apparaîtront repliées. L'utilisateur pourra ensuite les déplier individuellement ou utiliser le bouton "Tout déplier".

---

## Résultat attendu

```text
┌─────────────────────────────────────────────────┐
│ I. LE CONTRE-COURANT         ▶ [fermé]          │
│    L'Observation • 8 marches                    │
├─────────────────────────────────────────────────┤
│ II. L'HÉSITATION DU MODÈLE   ▶ [fermé]          │
│    La Friction • 6 marches                      │
├─────────────────────────────────────────────────┤
│ III. LE DROIT AU SILENCE     ▶ [fermé]          │
│    Le Nouveau Pacte • 2 marches                 │
└─────────────────────────────────────────────────┘
```

Le bouton "Tout déplier" permettra d'ouvrir toutes les parties d'un clic.

---

## Impact
- Pas de modification de la base de données
- Pas de nouvelle dépendance
- Changement purement cosmétique (UX)

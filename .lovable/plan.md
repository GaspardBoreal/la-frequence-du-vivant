# Fix : tunnel de conversion CRM (PipelineFunnelTile)

## Diagnostic

`src/components/crm/home/PipelineFunnelTile.tsx` ligne 19 :

```ts
const conversion = suspects > 0 ? Math.round((clients / suspects) * 100) : 0;
```

→ avec 2 suspects et 4 clients : 4/2 = **200 %** (faux).

L'utilisateur veut le ratio Clients / Total des fiches :

```
Clients / (Suspects + Prospects + Clients) = 4 / (2+2+4) = 50 %
```

## Correctif

### `src/components/crm/home/PipelineFunnelTile.tsx`

1. **Formule** :
```ts
const total = suspects + prospects + clients;
const conversion = total > 0 ? Math.round((clients / total) * 100) : 0;
```

2. **Présentation pédagogique** — pour que le calcul soit immédiatement compris :
   - Garder le grand chiffre `50 %` à droite.
   - Remplacer la sous-ligne « conversion » par la formule visible : `4 / 8 fiches` (chiffres réels), avec libellé « clients / total ».
   - Sous le titre « Suspects → Clients », ajouter une mini-mention « Part des fiches devenues clientes ».
   - Ajouter une ligne « Total » discrète sous les 3 barres pour matérialiser le dénominateur.

Maquette texte :
```
TUNNEL DE CONVERSION                              50 %
Suspects → Clients                             4 / 8 fiches
Part des fiches devenues clientes              clients / total

  Suspects                                          2
  ▓░░░░░░░░░░░░░░░░░
  Prospects                                         2
  ▓░░░░░░░░░░░░░░░░░
  Clients                                           4
  ▓▓▓▓░░░░░░░░░░░░░
  ─────────────────────────────────────────────────
  Total fiches                                      8
```

Aucun changement DB ni autre composant (le `DashboardKPIs.tsx` calcule `won/total` sur les opportunités — sémantique différente, à ne pas toucher).

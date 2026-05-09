## Ajustement du seuil "Engagé"

Actuellement dans `src/lib/sentinelleIndex.ts` :
- Éclaireur : 30–49
- Engagé : ≥ 50

Souhait utilisateur : Éclaireur plafonné à 39, Engagé dès 40.

### Changement
Dans `src/lib/sentinelleIndex.ts` (lignes 150-156), nouvelle échelle :
- Engagé : ≥ 40 (au lieu de 50)
- Éclaireur : 30–39
- Écoute : 16–29
- Curieux : 6–15
- Éveil : 1–5

```ts
if      (total >= 40) tier = 'engage';
else if (total >= 30) tier = 'eclaireur';
else if (total >= 16) tier = 'ecoute';
else if (total >= 6)  tier = 'curieux';
else if (total >= 1)  tier = 'eveil';
```

### Vérification
Recherche dans le code des éventuels seuils dupliqués (badges, légendes, tooltips) faisant référence à 50 pour le palier Engagé, et alignement si nécessaire.

Aucun autre fichier impacté côté UI : le label et la couleur sont dérivés de `tier` via `TIER_FULL_LABEL` / `TIER_COLOR`, donc le HoverCard et la fiche se mettront à jour automatiquement.
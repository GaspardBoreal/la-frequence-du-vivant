## Réorganiser les onglets de l'exploration Marcheur

Dans `src/components/community/ExplorationMarcheurPage.tsx`, modifier le tableau `globalTabs` (ligne 32-36) :

1. **Renommer** l'onglet `biodiversite` : libellé `Empreinte` → `Synthèse`
2. **Repositionner** cet onglet en dernière position (après `Apprendre`)

### Avant
```ts
{ key: 'carte',        label: 'Carte',     icon: Map },
{ key: 'marcheurs',    label: 'Marcheurs', icon: Users },
{ key: 'marches',      label: 'Marches',   icon: Footprints },
{ key: 'biodiversite', label: 'Empreinte', icon: TreePine },
{ key: 'apprendre',    label: 'Apprendre', icon: GraduationCap },
```

### Après
```ts
{ key: 'carte',        label: 'Carte',     icon: Map },
{ key: 'marcheurs',    label: 'Marcheurs', icon: Users },
{ key: 'marches',      label: 'Marches',   icon: Footprints },
{ key: 'apprendre',    label: 'Apprendre', icon: GraduationCap },
{ key: 'biodiversite', label: 'Synthèse',  icon: TreePine },
```

### Notes
- La `key` reste `biodiversite` pour préserver la logique de rendu, le `pageState`, le `tabPath` du ChatBot et les conditions existantes (aucun autre fichier à toucher).
- Le snapshot de contexte ChatBot (`activeTab`) reflètera automatiquement le nouveau libellé "Synthèse".
- Aucun impact sur les routes ou la persistance.
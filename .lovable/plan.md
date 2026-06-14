# Fix : drawer "Filtres entreprises" derrière la carte Leaflet

## Diagnostic

Sur `/admin/crm/annuaire?tab=carte`, le drawer de filtres (`ImportedCompanyFiltersDrawer`) est rendu via le composant `Sheet` shadcn, qui utilise `z-50` pour son overlay et son contenu.

Or Leaflet applique en interne des z-index élevés :
- map panes : 200–700
- controls (zoom, attribution) : 800–1000
- popups : 700

Conséquence : la carte et ses contrôles passent visuellement au-dessus du panneau de filtres et de l'overlay sombre, comme on le voit sur la capture.

## Correctif (minimal, frontend uniquement)

Surclasser le z-index du `SheetContent` (et de l'overlay implicite) **uniquement pour ce drawer**, sans toucher au composant `sheet.tsx` global pour ne pas impacter les autres Sheets du projet.

### Fichier modifié

`src/components/crm/filters/ImportedCompanyFiltersDrawer.tsx` (ligne 141)

Ajouter une classe `z-[1200]` sur le `SheetContent` et forcer l'overlay au-dessus de Leaflet via une classe ciblée (le composant `Sheet` shadcn rend `SheetOverlay` en sibling avec `z-50` ; on l'override via un sélecteur global ou en ajoutant un wrapper).

Option retenue (la plus propre) : surcharger les deux via le portail en utilisant les props className déjà disponibles, et compléter avec une règle dans `index.css` ciblée sur le data-attribute du drawer si nécessaire.

Approche pragmatique en une ligne :
```tsx
<SheetContent
  side="right"
  className="w-full sm:max-w-md overflow-y-auto z-[1200]"
>
```
Et dans `src/components/ui/sheet.tsx`, garder l'overlay tel quel mais y ajouter une classe utilitaire conditionnelle n'est pas idéal. Préférable : modifier juste les valeurs `z-50` → `z-[100]` dans `sheet.tsx` (overlay + content) — ce qui reste sous les modals (`z-[1000]` Dialog déjà) mais au-dessus de Leaflet (max ~1000 pour les contrôles).

**Décision finale** : passer overlay + content du composant `Sheet` partagé à `z-[1100]`. Cohérent avec shadcn Dialog (`z-50` par défaut aussi, mais aucun Dialog n'est ouvert au-dessus d'un Sheet dans ce projet), et résout tous les futurs cas Sheet+Leaflet (CRM Annuaire, Marches admin…).

### Fichier modifié final

`src/components/ui/sheet.tsx` : remplacer les deux occurrences `z-50` (sur `SheetOverlay` et `SheetContent`) par `z-[1100]`.

## Vérification

1. Ouvrir `/admin/crm/annuaire?tab=carte`
2. Cliquer sur "Filtres" → le panneau doit recouvrir intégralement la carte et ses contrôles (+/−), avec backdrop sombre par-dessus la carte
3. Vérifier qu'aucun autre Sheet du projet (drawer espèce, drawer marcheur, etc.) ne régresse

Aucun changement métier, DB ou edge function.

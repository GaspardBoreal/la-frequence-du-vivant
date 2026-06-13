## Objectif

Rendre l'annuaire CRM aussi lisible et puissant que `annuaire-entreprises.data.gouv.fr` sur la dimension **activité (NAF/APE)** : afficher le libellé en clair partout, et permettre de filtrer par **code** OU par **libellé** (recherche intelligente "vigne", "boulangerie", "restauration"…).

---

## Analyse du problème

Sur la fiche officielle on lit `Culture de la vigne (01.21Z)` — code + libellé fusionnés. Dans notre app :

- La carte résultat affiche `SIREN 439904319 · 01.21Z` → le **libellé manque** alors que l'edge function le mappe déjà (`libelle_naf = r.libelle_activite_principale`). Le champ peut être vide selon la réponse API, et il n'a pas de fallback.
- Le filtre NAF est un input texte libre avec 5 quick-picks → l'utilisateur **doit connaître le code par cœur** (frein majeur). Pas de recherche par libellé, pas d'autocomplétion.
- Aucun affichage du libellé NAF dans l'onglet **Entreprises importées** (déjà stocké en BDD mais tronqué).
- Le carrousel `NAF_QUICK_PICKS` (10 entrées) est cosmétique — pas une vraie nomenclature.

---

## Solution (4 chantiers, frontend uniquement)

### 1. Référentiel NAF complet et local

Créer `src/lib/nafCatalog.ts` :
- ~730 codes NAF rév. 2 (niveau sous-classe `XX.XXZ`) avec libellé officiel INSEE.
- Helpers :
  - `getNafLabel(code)` → libellé
  - `searchNaf(query)` → recherche fuzzy sur code + libellé (normalisation NFD pour accents), retourne top 20
  - `formatNaf(code, label?)` → `"Culture de la vigne (01.21Z)"`

Source : nomenclature publique INSEE NAF rév. 2 (intégrée en dur, ~60 Ko gzip — pas d'appel réseau).

### 2. Affichage enrichi des résultats

- **`CompanySearchResultCard.tsx`** : remplacer `· 01.21Z · Culture de la vigne` par un **badge cliquable** `Culture de la vigne (01.21Z)` (style `Badge` outline). Clic = applique le filtre NAF correspondant. Fallback sur `getNafLabel(code_naf)` si l'API ne renvoie pas le libellé.
- **Onglet Entreprises importées** : afficher `formatNaf(code_naf, libelle_naf)` au lieu du libellé tronqué seul.
- **`CompanyDetailSheet`** : même format dans la fiche détaillée.

### 3. Combobox NAF intelligente dans les filtres

Dans `CompanySearchFiltersDrawer.tsx`, remplacer l'`Input` texte + chips quick-picks par un `Combobox` (composant `Command` shadcn déjà installé) :

```text
[ Activité (NAF/APE) ]
[🔍 Tapez un code ou un mot-clé : "vigne", "boulangerie", "01.21Z"…]
  ┌─────────────────────────────────────────┐
  │ 01.21Z  Culture de la vigne           ✓│
  │ 01.22Z  Culture de fruits tropicaux    │
  │ 11.02A  Vinification                   │
  └─────────────────────────────────────────┘
```

- Recherche en temps réel sur code + libellé.
- Sélection → `set('activite_principale', code)`.
- Affiche `code — libellé` une fois sélectionné, avec bouton ×.
- Conserve la possibilité de saisir un code arbitraire (au cas où nomenclature évolue).

### 4. Chip de filtre enrichi (dans `CrmAnnuaire.tsx`)

`formatFilterValue('activite_principale', '01.21Z')` → retourne `"01.21Z — Culture de la vigne"` au lieu du code seul. L'utilisateur voit immédiatement ce qu'il filtre.

---

## Hors-périmètre (volontaire)

- **NAF 2025** (la nouvelle nomenclature qui montre `01.21Y` sur la fiche officielle) : l'API gouv ne l'expose pas encore en filtre stable → on reste sur NAF rév. 2. À ré-évaluer quand l'API basculera.
- Pas de modification edge function ni BDD : tout est purement frontend (référentiel statique + affichage).
- Pas de filtre multi-NAF (1 seul code à la fois, comme l'API).

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/lib/nafCatalog.ts` | **créé** — 730 codes + helpers |
| `src/components/crm/CompanySearchFiltersDrawer.tsx` | Combobox NAF |
| `src/components/crm/CompanySearchResultCard.tsx` | Badge NAF cliquable |
| `src/components/crm/CompanyDetailSheet.tsx` | Affichage `formatNaf` |
| `src/pages/CrmAnnuaire.tsx` | Chip filtre enrichi + onglet Entreprises |
| `src/lib/crmAnnuaireOptions.ts` | `NAF_QUICK_PICKS` supprimé (remplacé par combobox) |

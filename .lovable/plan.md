## Problème

La fiche `CompanyManualCreateDialog` utilise des `<Input>` libres pour des champs qui sont en réalité **issus de référentiels normés INSEE** côté API (recherche / import / filtres). Conséquences :

- Saisie libre `Code NAF` → risque `0.21Z` vs `01.21Z`, casse, etc. → les filtres NAF (qui matchent sur `01.21Z` exact) ne retrouvent pas l'entreprise.
- `Département` / `Région` en texte libre → ne correspondront pas à `FRENCH_DEPARTMENTS` / `FRENCH_REGIONS` (utilisés en MAJUSCULES sans accents) → filtres géo cassés.
- `Forme juridique` et `Tranche d'effectif` placeholder type "ex. 10-19" alors que l'API renvoie un **code** (`12` = "20 à 49 salariés"), incohérent avec `TRANCHE_EFFECTIF_OPTIONS` déjà défini.
- `Catégorie d'entreprise` saisie libre alors que `CATEGORIE_ENTREPRISE_OPTIONS` existe.
- `État administratif` déjà OK (Select).

Bonne nouvelle : tous les référentiels existent déjà (`nafCatalog.ts`, `frenchDepartments.ts`, `frenchRegions.ts`, `crmAnnuaireOptions.ts`) et un composant `NafCombobox` est déjà utilisé dans 2 drawers — on peut le mutualiser.

## Plan

### 1. Mutualiser `NafCombobox`
Extraire le composant dupliqué dans `src/components/crm/filters/NafCombobox.tsx` (Popover + Command + `searchNaf`, affichage code + libellé, clear button) et le réutiliser dans :
- `CompanySearchFiltersDrawer.tsx`
- `filters/ImportedCompanyFiltersDrawer.tsx`
- `CompanyManualCreateDialog.tsx` (nouveau)

### 2. Créer `src/lib/formesJuridiques.ts`
Liste des formes juridiques courantes (libellés API INSEE) : EI, EIRL, SAS, SASU, SARL, EURL, SA, SCI, SCOP, SCIC, SNC, Association loi 1901, Fondation, Collectivité territoriale, Établissement public, Auto-entrepreneur, GIE, GAEC, EARL, Coopérative agricole, etc. Format `{ value, label }` — `value` = libellé exact tel que renvoyé par l'API (pour cohérence avec l'import).

### 3. Refonte de `CompanyManualCreateDialog`
Remplacements :

| Champ | Avant | Après |
|---|---|---|
| Code NAF + Libellé NAF | 2 `<Input>` libres | `<NafCombobox>` unique → remplit auto `code_naf` (`01.21Z`) et `libelle_naf` (via `getNafLabel`) |
| Forme juridique | `<Input>` "SAS, SARL…" | `<Select>` depuis `FORMES_JURIDIQUES` + option "Autre" (text) |
| Tranche d'effectif | `<Input>` "ex. 10-19" | `<Select>` depuis `TRANCHE_EFFECTIF_OPTIONS` (stocke le code `12`, affiche "20 à 49 salariés") |
| Catégorie d'entreprise | `<Input>` "PME / ETI / GE" | `<Select>` depuis `CATEGORIE_ENTREPRISE_OPTIONS` |
| Département | `<Input>` libre | `<Select>` (Command pour recherche) depuis `FRENCH_DEPARTMENTS` |
| Région | `<Input>` libre | `<Select>` depuis `FRENCH_REGIONS` |
| Code postal → Département | — | Auto-déduction du département via les 2 premiers chiffres du CP quand l'utilisateur sort du champ (mapping CP→dept) |

Le payload `INSERT crm_companies` reste identique (les codes/libellés stockés sont ceux des référentiels normalisés, donc compatibles avec les filtres existants et avec les données importées par API).

### 4. Aucune migration DB
Les colonnes sont déjà `text` libres — on n'ajoute pas de contrainte (pour ne pas casser l'historique d'imports), on normalise uniquement la **saisie manuelle** côté UI.

### 5. Vérification
- Créer une entreprise manuelle "Culture de la vigne (01.21Z)" en Gironde → vérifier qu'elle apparaît dans les filtres NAF `01.21Z` et région `NOUVELLE-AQUITAINE`.
- Ouvrir une entreprise importée API + cliquer Modifier (si flow d'édition réutilise le dialog) → vérifier que les valeurs existantes (codes API) s'affichent bien dans les Select (pré-sélection).

## Détails techniques

- Composant `<DeptSelect>` et `<RegionSelect>` : utiliser le pattern `Popover + Command` (comme `NafCombobox`) pour permettre la recherche, vu la taille des listes (101 départements, 18 régions).
- Mapping CP→Département : utiliser `src/utils/frenchDepartments.ts` si une fonction `departementFromCodePostal` existe, sinon créer un helper minimal (2 premiers chiffres → nom département via table de correspondance ; déjà partiellement géré ailleurs dans le projet si présent).
- Formes juridiques : pas de référentiel exhaustif INSEE des ~3000 codes, mais une liste de ~25 libellés couvre 99 % des cas du CRM ; conserver une option "Autre…" qui ouvre un input libre pour ne pas bloquer.

## Fichiers touchés

- **Créés** : `src/components/crm/filters/NafCombobox.tsx`, `src/lib/formesJuridiques.ts`, éventuellement `src/components/crm/filters/DeptRegionSelect.tsx`
- **Édités** : `src/components/crm/CompanyManualCreateDialog.tsx`, `src/components/crm/CompanySearchFiltersDrawer.tsx`, `src/components/crm/filters/ImportedCompanyFiltersDrawer.tsx` (pour utiliser le NafCombobox mutualisé)

## Objectif

Permettre au commercial de **voir, contrôler et ré-ouvrir** ses entreprises sélectionnées avant import, même si elles ne sont plus visibles dans la liste courante (changement de filtre, de page, de recherche).

## Constat

- `selected` ne stocke que des SIREN (`Set<string>`). Dès qu'on change la recherche, on n'a plus accès au nom / ville / NAF des entreprises mises de côté.
- La barre verte « 2 entreprise(s) sélectionnée(s) » n'offre que **Annuler** et **Importer**. Pas de moyen de revoir la liste ni de retirer une seule entreprise.

## Solution UX — « Panier de qualification »

### 1. Mémoriser un snapshot par sélection
- Remplacer `selected: Set<string>` par `selectedMap: Map<siren, CompanySearchResultLite>` (nom_complet, siren, ville, code_postal, code_naf, libelle_naf, etat_administratif, date_cessation, existingStage à la sélection).
- `toggleSelect(result)` reçoit l'objet complet ; la map persiste indépendamment de la liste affichée.
- `selectedCount` = `selectedMap.size`. Toute la logique aval (`Array.from(selectedMap.keys())` pour l'import) reste identique.

### 2. Bouton « Voir la sélection » dans la barre verte
Nouvelle barre :

```text
[✓] 2 entreprise(s) sélectionnée(s)   [Voir la sélection ▸]  [Annuler]  [Importer comme Suspect]
```

- `Voir la sélection` ouvre un **Sheet latéral droit** (`sm:max-w-md`), réutilisant le pattern de `CompanyPreviewSheet`.
- Pastille numérique animée sur le bouton quand la sélection change.

### 3. Sheet « Ma sélection »
Header sticky :
- Titre « Ma sélection · {n} entreprise(s) »
- Sous-titre discret : « Vérifiez chaque fiche avant import »
- Bouton « Tout désélectionner » (ghost destructive)

Corps : liste verticale de mini-cartes (`CompanySelectionCard`), une par entreprise :
- Nom (strikethrough rouge si cessée) + badge `Cessée` si applicable
- Ligne meta : SIREN · ville · NAF court
- Badge `Déjà importée` si `existingStage`
- Actions à droite :
  - **Œil** → ouvre `CompanyPreviewSheet` sur ce SIREN (le sheet sélection reste monté en arrière-plan, z-index inférieur)
  - **X** → retire de la sélection (sans confirmation, undo via re-clic dans la liste principale)

Footer sticky :
- `Importer comme Suspect ({n})` — primary, full width
- État disabled si toutes déjà importées (avec libellé contextuel)

### 4. État vide & cohérence
- Si `selectedMap.size === 0`, fermer automatiquement le sheet.
- Persister la sélection dans `sessionStorage` (`crm.annuaire.selection`) pour ne rien perdre au refresh accidentel pendant la qualification.

## Hors-scope
- Pas de changement BDD, RLS, edge functions.
- Pas de modification de `CompanyPreviewSheet` ni de la recherche.
- Pas de drag-and-drop ni de groupes (à voir plus tard si besoin).

## Fichiers touchés
- `src/pages/CrmAnnuaire.tsx` — refactor `selected` → `selectedMap`, ajout bouton + state `selectionOpen`, persistance sessionStorage.
- `src/components/crm/CompanySearchResultCard.tsx` — `onToggleSelect` reçoit le `result` complet (déjà dispo via prop).
- **Nouveau** `src/components/crm/CompanySelectionSheet.tsx` — sheet liste + mini-cartes + actions.

## Détails techniques

```ts
type SelectionEntry = Pick<CompanySearchResult,
  'siren' | 'nom_complet' | 'denomination' | 'ville' | 'code_postal'
  | 'code_naf' | 'libelle_naf' | 'etat_administratif' | 'date_cessation'>;

const [selectedMap, setSelectedMap] =
  React.useState<Map<string, SelectionEntry>>(() => loadFromSession());

const toggleSelect = (r: SelectionEntry) =>
  setSelectedMap(prev => {
    const next = new Map(prev);
    next.has(r.siren) ? next.delete(r.siren) : next.set(r.siren, r);
    sessionStorage.setItem('crm.annuaire.selection', JSON.stringify([...next]));
    return next;
  });
```

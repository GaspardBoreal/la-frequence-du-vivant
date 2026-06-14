# Bouton « Filtres » universel sur les 4 onglets de l'Annuaire CRM

## Objectif UX

Aujourd'hui, seul l'onglet **Annuaire** dispose du bouton `Filtres` (drawer riche INSEE + chips dismissibles + lien « Tout effacer »). Les 3 autres onglets (**Entreprises**, **Contacts**, **Carte**) exposent leurs filtres « à plat » dans le bandeau (Select stage, toggle Dirigeants…), ce qui crée une **dissonance visuelle** et limite la richesse des filtres possibles.

Cible : **un même langage UX** dans les 4 bandeaux — *barre de recherche + bouton `Filtres` (avec pastille compteur) + actions à droite*, sur une seule ligne, avec chips dismissibles sous la barre.

## Principe de design

Un même composant visuel `Filtres` (icône `SlidersHorizontal` + label + pastille compteur), mais **drawer contextuel** par onglet (filtres pertinents au domaine de données affiché).

```text
┌──────────────────────────────────────────────────────────────────┐
│ [🔍 Rechercher…             ] [⚙ Filtres (2)] [Actions ▸]         │ ← bandeau 1 ligne
├──────────────────────────────────────────────────────────────────┤
│ • Stage : Prospect ✕   • Ville : Bordeaux ✕   Tout effacer        │ ← chips
└──────────────────────────────────────────────────────────────────┘
```

## Filtres par onglet

| Onglet | Filtres dans le drawer |
|---|---|
| **Annuaire** (existant) | INSEE : NAF, région, département, dirigeant, effectif, CA, labels (ESS/RGE/Qualiopi/Bio/FINESS/UAI/Spectacle/Collectivité/Société à mission), état admin |
| **Entreprises** (nouveau) | Stage (suspect/prospect/client/inactif), Ville, Département, Région, NAF, Labels présents, A des contacts ?, Géolocalisée ?, Date d'import (range) |
| **Contacts** (nouveau) | Rôle (dirigeant/décideur/opérationnel/prescripteur/autre), Dirigeant API Sirene (oui/non), A un email / téléphone, Entreprise (autocomplete sur companies importées), Fonction (texte) |
| **Carte** (nouveau) | Stage, Ville, Département, Région, NAF, Géolocalisée uniquement (par défaut ON), Labels |

## Plan d'implémentation

### 1. Composant générique `FiltersBandeau`
Nouveau `src/components/crm/filters/FiltersBandeau.tsx` — wrapper unifié :
- Props : `searchValue`, `onSearchChange`, `searchPlaceholder`, `filtersButton: ReactNode`, `actions?: ReactNode`, `chips: Chip[]`, `onClearAll: () => void`.
- Rend : `<Card class="p-3 mb-3">` avec ligne flex (search expand + slot filtres + slot actions) + chips dessous (réutilise le pattern exact de Annuaire l.234-300).

### 2. Drawers contextuels (3 nouveaux)
Tous calqués sur `CompanySearchFiltersDrawer` (même `Sheet` + bouton trigger + pastille compteur de filtres actifs) :

- `src/components/crm/filters/ImportedCompanyFiltersDrawer.tsx` (Entreprises + Carte partagent ce drawer, props pour masquer/forcer certains champs)
- `src/components/crm/filters/ContactFiltersDrawer.tsx`

Type d'état : étendre `CompanyFilters` (entreprises) et créer `ContactFilters` côté `useCrmContacts` (ajouter `ville`, `departement`, `naf`, `has_email`, `has_phone`, `entreprise_id`, etc. + filtrage côté hook).

### 3. Refactor des 4 onglets dans `src/pages/CrmAnnuaire.tsx`
- **Annuaire** : remplacer la Card actuelle par `<FiltersBandeau>` + injecter `<CompanySearchFiltersDrawer>` dans `filtersButton`. Chips inchangés.
- **Entreprises** : déplacer le Select stage + futurs filtres dans `<ImportedCompanyFiltersDrawer>`. Le bouton « Nouvelle entreprise » va dans le slot `actions`. Construire les chips depuis `companyFilters`.
- **Contacts** : `CrmContactsTab.tsx` — sortir le Select rôle + toggle Dirigeants du bandeau, les placer dans `<ContactFiltersDrawer>`. Le bouton « Nouveau » reste dans `actions`. Chips dismissibles. (Le composant `CrmContactsTab` reçoit déjà tout en interne — refactor local.)
- **Carte** : déplacer le Select stage dans `<ImportedCompanyFiltersDrawer>` (variante carte). La légende couleurs reste à droite dans `actions`.

### 4. Synchronisation
- Le filtre `stage` reste **partagé** entre Entreprises et Carte (même état `companyFilters.stage`) — pratique pour switcher d'onglet sans perdre le contexte.
- Les filtres avancés (ville, naf…) sont locaux à `companyFilters` et persistés en URL via `searchParams` si pertinent (cohérence avec `?stage=` déjà géré l.95-100).

## Détails techniques

- Pastille compteur sur le bouton : `Object.entries(filters).filter(([k,v]) => !['q','page','per_page'].includes(k) && v != null && v !== '' && v !== false).length`.
- Chips : mêmes classes Tailwind que l.270 (`bg-muted hover:bg-accent border rounded-full`).
- Filtrage Contacts ajouté dans `useCrmContacts` (passer les nouveaux paramètres au query Supabase via `.ilike` / `.eq`).
- Pas de changement backend (RLS, RPC) — tout reste côté requêtes existantes.
- Responsive : `flex-wrap` conservé (sur écran étroit le bouton Filtres passe en dessous, comme aujourd'hui sur Annuaire).

## Hors scope

- Pas de modification du drawer INSEE existant (`CompanySearchFiltersDrawer`).
- Pas de migration SQL.
- Pas de changement des KPI ou des routes.

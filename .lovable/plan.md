## Problème

Dans `/admin/crm`, la "cellule Rechercher" de la barre du haut (`src/components/crm/shell/CrmTopBar.tsx`) n'est **pas un input** : c'est un simple `<div>` décoratif avec le texte "Rechercher…" et un raccourci `⌘K`. Impossible donc d'y saisir quoi que ce soit.

## Objectif

Transformer cette zone en une **vraie recherche globale CRM** qui :
1. Permet la saisie au clavier (input réel, focus auto, raccourci `⌘K` / `Ctrl+K`).
2. Cherche en parallèle dans 4 entités : **Entreprises**, **Contacts**, **Opportunités**, **Marches**.
3. Affiche les résultats groupés avec un **picto distinctif par type** pour identifier immédiatement la nature de chaque résultat.
4. Navigue directement vers la fiche correspondante au clic / touche Entrée.

## Pictos & destinations

| Type | Picto (lucide) | Couleur | Route de la fiche |
|---|---|---|---|
| Entreprise | `Building2` | bleu | `/admin/crm/annuaire?company=<id>` (ouvre le drawer) |
| Contact | `User` | violet | `/admin/crm/annuaire?tab=contacts&contact=<id>` |
| Opportunité | `Target` | ambre | `/admin/crm/pipeline?opportunity=<id>` |
| Marche | `Footprints` | émeraude | `/admin/crm/marches?marche=<id>` |

Chaque résultat affiche : picto coloré + titre principal (nom entreprise / nom contact / titre opportunité / nom marche) + sous-titre contextuel (ville, fonction, statut/montant, date).

## Composant à créer

`src/components/crm/search/CrmGlobalSearch.tsx`

- Bouton/zone dans `CrmTopBar` qui ouvre un `CommandDialog` (cmdk via `@/components/ui/command`).
- Champ `CommandInput` avec autofocus.
- 4 `CommandGroup` : Entreprises / Contacts / Opportunités / Marches, chacun avec son picto en tête de groupe et sur chaque `CommandItem`.
- Debounce 250ms, requêtes parallèles via `useQueries` (React Query) avec `ilike` côté Supabase :
  - `crm_companies` : `denomination`, `nom_complet`, `siren`, `ville` (limit 8)
  - `crm_contacts` : `nom`, `prenom`, `email`, `entreprise` (limit 8)
  - `crm_opportunities` : `titre`, `entreprise` (limit 8)
  - `crm_marches` (ou table équivalente déjà utilisée dans `CrmMarches`) : `nom`, `lieu` (limit 8)
- État vide : "Tapez pour rechercher…" puis "Aucun résultat" quand applicable.
- Sur sélection : `navigate(route)` + fermeture du dialog.
- Raccourci global `⌘K` / `Ctrl+K` (listener `keydown` monté dans le composant).

## Modifications

1. **Nouveau fichier** `src/components/crm/search/CrmGlobalSearch.tsx` — bouton-déclencheur + dialog cmdk + logique de recherche et navigation.
2. **`src/components/crm/shell/CrmTopBar.tsx`** — remplacer le faux input (la `<div>` avec "Rechercher…") par `<CrmGlobalSearch />`. Garder l'apparence visuelle (badge `⌘K`, largeur 260px sur md+).
3. Vérifier la structure réelle de la table des marches CRM (`useCrmCompanyEvents` / page `CrmMarches`) pour brancher la 4ᵉ requête sur la bonne table/colonnes ; ajuster si nécessaire.

## Hors scope

- Pas de RPC SQL dédié (les `ilike` parallèles suffisent largement pour les volumes CRM actuels).
- Pas de fuzzy matching avancé ni de mise en évidence des termes.
- Pas de modification des fiches cibles : on suppose que les routes ci-dessus ouvrent déjà la bonne vue (à confirmer rapidement lors de l'implémentation, sinon on adapte la route).


# CRM commercial B2B — V1 complète (Étapes 1+2+3)

Objectif : équiper téléprospecteurs / ambassadeurs / commerciaux d'un CRM rapide pour identifier des cibles via l'annuaire officiel des entreprises françaises, les qualifier en Suspect → Prospect → Client, suivre les opportunités/devis, et visualiser tout ça sur carte.

L'IA (brief d'appel, mails, devis) est explicitement reportée en V2 — la V1 pose des fondations propres pour la brancher facilement ensuite.

## 1. Nouvelle architecture de données

### Table `crm_companies` (cœur du CRM B2B)
Une entreprise = un SIREN. Les données API gouv sont mises en cache pour éviter de re-fetcher et permettre la recherche offline / filtrée.

Champs métier :
- `siren` (text, unique), `siret_siege`, `denomination`, `nom_complet`
- `lifecycle_stage` : `suspect` | `prospect` | `client` | `inactif` (défaut `suspect`)
- `assigned_to` (uuid → team_members) — commercial attitré
- `tags` (text[]) — étiquettes libres ("priorité haute", "Salon Pollutec"…)
- `notes` (text), `source` (text, ex: `api_gouv`, `manuel`, `import_csv`)
- `last_contacted_at`, `next_action_at`, `next_action_label`

Champs cache API gouv (snapshot JSONB + colonnes indexées pour filtres rapides) :
- `code_naf`, `libelle_naf`, `forme_juridique`, `tranche_effectif`, `categorie_entreprise`
- `etat_administratif` (A/F)
- `ville`, `code_postal`, `departement`, `region`
- `latitude`, `longitude` (depuis le siège API gouv, via `geo_adresse`)
- `dirigeants` (jsonb), `qualites_labels` (jsonb : ESS, RGE, EPV, BIO, etc.)
- `finances` (jsonb : CA, résultat net par millésime)
- `raw_payload` (jsonb complet API)
- `api_synced_at`

RLS : lecture/écriture réservée aux membres CRM (`has_role(auth.uid(), 'admin')` OU appartient à `team_members`). Pas d'accès anon.

### Table `crm_company_activities`
Journal d'actions sur une entreprise : appel, mail, RDV, note, changement de stage. Champs : `company_id`, `member_id`, `type`, `summary`, `outcome`, `next_action_at`, `created_at`.

### Évolution de `crm_opportunities`
Ajout de :
- `company_id` (uuid → crm_companies, nullable pour ne pas casser l'existant)
- `devis_statut` : `aucun` | `en_cours` | `en_negociation` | `signe` | `perdu` (champ sur l'opportunité, pas de table séparée)
- `devis_montant_ht`, `devis_envoye_le`, `devis_signe_le`

Migration : non destructive. Les opportunités existantes restent valides avec `company_id IS NULL`.

### Évolution de `crm_contacts`
Ajout de `company_id` (lien vers `crm_companies`) pour rattacher personnes physiques ↔ entreprises sans dupliquer.

## 2. Intégration API recherche-entreprises.api.gouv.fr

API publique, gratuite, sans clé. Limite : 7 req/s par IP → on l'appelle depuis une **edge function** `search-french-companies` qui :
- Reçoit `{ query, filters, page, per_page }`
- Construit l'URL `https://recherche-entreprises.api.gouv.fr/search?...`
- Mappe nos filtres UI vers les query params officiels :

| Filtre UI | Param API |
|---|---|
| Texte libre (nom, SIREN, dirigeant) | `q` |
| Ville / code postal | `code_postal`, `commune` |
| Département / Région | `departement`, `region` |
| Code NAF/APE | `activite_principale` |
| Forme juridique | `categorie_juridique` |
| Tranche d'effectif | `tranche_effectif_salarie` |
| Catégorie entreprise (PME/ETI/GE) | `categorie_entreprise` |
| État administratif | `etat_administratif` |
| Labels (ESS, RGE, BIO, EPV…) | `est_ess`, `est_rge`, `est_bio`, `est_entrepreneur_spectacle`, `est_qualiopi`, `est_finess`, `est_uai`, etc. |
| Dirigeant | `nom_personne`, `prenoms_personne` |
| CA / Résultat net | `ca_min`, `ca_max`, `resultat_net_min`, `resultat_net_max` |
| Recherche géo (carte) | `lat`, `long`, `radius` via endpoint `/near_point` |

Retour : normalisé en `CompanySearchResult[]` côté front (siren, nom, adresse, lat/long, naf, effectif, dirigeants, finances, labels).

Pas de stockage tant que pas taggé : la recherche est volatile, seules les entreprises **importées** atterrissent dans `crm_companies`.

## 3. UI — réorganisation `/admin/crm`

Nouvelle barre d'onglets dans `CrmDashboard` :

```text
[ Tableau de bord ] [ Annuaire ] [ Entreprises ] [ Pipeline ] [ Carte ] [ Équipe ]
```

### 3.1 Onglet Annuaire (nouveau) — la pièce wahouh
Layout split desktop / empilé mobile :

```text
+--------------------------------------------------+
| 🔍 Recherche multi-critères (drawer filtres)      |
+--------------------+-----------------------------+
| Liste résultats     | Mini-carte synchronisée    |
| (cards avec badge   | (markers cliquables,        |
|  Suspect/Prospect/  |  bbox auto-fit)            |
|  Client si déjà     |                             |
|  importé)           |                             |
| ☑ sélection multi   |                             |
+--------------------+-----------------------------+
| Barre actions : [Tagger comme Suspect] [Assigner à…] [Exporter CSV] |
+--------------------------------------------------+
```

- Drawer "Filtres avancés" : sections repliables (Localisation / Activité / Taille / Labels & qualités / Financier / Dirigeant / État admin), compteur de filtres actifs, bouton "Réinitialiser".
- Recherche debouncée 300ms, pagination infinie, état URL-synchronisé (partageable).
- Chips au-dessus des résultats pour visualiser les filtres actifs.
- Sur chaque card : badge coloré si déjà en base (Suspect bleu, Prospect orange, Client vert), bouton "+ Importer" sinon.
- Sélection multi-lignes (checkbox) → action en masse "Tagger comme Suspect" (upsert par SIREN, idempotent).

### 3.2 Onglet Entreprises (nouveau)
Vue tableau + cards des `crm_companies` importées. Filtres locaux : stage, commercial assigné, tags, NAF, région. Recherche plein texte. Actions ligne : ouvrir drawer détail, changer stage, supprimer.

**Drawer détail entreprise** (Sheet plein écran mobile) :
- Header : logo généré (initiales), nom, SIREN, badges stage + labels (RGE, ESS…)
- Tabs internes : `Identité` (toutes données API), `Dirigeants`, `Finances` (mini-graph CA/RN par millésime), `Activités` (timeline journal), `Opportunités` (liées via company_id), `Notes`
- CTA flottants : `→ Prospect`, `→ Client`, `Créer opportunité`, `Logger une activité`
- Bouton "Rafraîchir données API gouv" (re-fetch + maj cache).

### 3.3 Onglet Pipeline (existant — enrichi)
- Le Kanban existant reste intact.
- L'`OpportunityForm` gagne un sélecteur entreprise (autocomplete sur `crm_companies`, sinon "créer nouvelle" qui ouvre l'annuaire en modale).
- Nouvelle section "Devis" dans le form : statut (`aucun` → `signe`/`perdu`), montant HT, dates.
- Sur les cards Kanban : pastille couleur statut devis + montant si défini.

### 3.4 Onglet Carte (nouveau)
- `RichMap` (Leaflet OSM, déjà mutualisé dans le projet) plein écran.
- Markers colorés par `lifecycle_stage` (suspect/prospect/client) + clustering (`react-leaflet-cluster`).
- Panneau latéral filtres (mêmes filtres que l'onglet Entreprises + filtre géo : rayon autour d'un point cliqué).
- Clic marker → mini-popup avec nom, stage, commercial → "Ouvrir fiche" (réutilise drawer détail).
- Bouton "Dessiner zone" (polygone) en V1.1 — pas bloquant.

## 4. Edge functions

1. **`search-french-companies`** : proxy + normalisation API gouv. Cache mémoire 60s pour requêtes identiques.
2. **`import-companies-batch`** : reçoit liste de SIREN à importer comme `suspect`, fetch détails (`/search?q=<siren>`), upsert dans `crm_companies` (`ON CONFLICT (siren)`), log dans `crm_company_activities` (type `import`).
3. **`refresh-company-data`** : refresh d'une entreprise (clic utilisateur), met à jour `raw_payload`, finances, dirigeants, `api_synced_at`.

Toutes en `verify_jwt=false` avec validation en code : `supabase.auth.getUser()` + check `has_role(user, 'admin')` ou présence dans `team_members`.

## 5. Hooks & composants front

Nouveaux hooks :
- `useCompanySearch(filters)` — query React Query branchée sur edge function annuaire.
- `useCrmCompanies(filters)` — liste paginée des entreprises importées (Supabase direct).
- `useCrmCompany(id)` — détail + activités + opportunités.
- `useImportCompanies()` — mutation batch tag Suspect.
- `useUpdateCompanyStage()` — mutation stage transition (avec log auto activité).

Nouveaux composants (`src/components/crm/`) :
- `CompanySearchFiltersDrawer.tsx`, `CompanySearchResultCard.tsx`, `CompanySearchResultsMap.tsx`
- `CompaniesTable.tsx`, `CompanyDetailSheet.tsx`, `CompanyStageBadge.tsx`, `CompanyLabelsChips.tsx`
- `CrmMapView.tsx` (carte plein écran)
- Ajout d'un `CompanyPicker.tsx` (autocomplete) dans `OpportunityForm`

## 6. Découpage de livraison

```text
Phase A — Fondations (1 PR)
  • Migration crm_companies + crm_company_activities + colonnes opportunités/contacts
  • Edge function search-french-companies + import-companies-batch
  • Hooks de base

Phase B — Annuaire (1 PR)
  • Onglet Annuaire complet (filtres, liste, mini-carte, import batch)

Phase C — Entreprises & Pipeline enrichi (1 PR)
  • Onglet Entreprises + drawer détail
  • Évolution OpportunityForm (company picker + bloc devis)
  • Affichage devis sur Kanban

Phase D — Carte CRM (1 PR)
  • Onglet Carte plein écran + clustering + filtres + popup → drawer détail

Phase E (V2, hors scope actuel) — IA
  • Edge function generate-call-brief, generate-email, generate-quote
  • Boutons IA dans le drawer entreprise et opportunité
```

## Section technique (détails)

- Géocodage : on utilise `geo_adresse` du payload API gouv qui contient lat/long du siège — pas besoin d'appel géocoder tiers. Fallback : si manquant et adresse présente → file d'attente d'enrichissement Nominatim (1 req/s) en background dans `import-companies-batch`.
- Index DB clés : `crm_companies(lifecycle_stage)`, `crm_companies(assigned_to)`, `crm_companies USING gin(tags)`, `crm_companies(latitude, longitude)`, `crm_companies(code_naf)`.
- Idempotence import : upsert sur `siren`. Si déjà `prospect`/`client`, le stage **n'est pas rétrogradé** à `suspect`.
- État URL annuaire : sérialisation filtres dans query string (`?naf=01.11Z&region=NOUVELLE-AQUITAINE&label=bio`) → permet partage de recherches entre commerciaux.
- Mobile-first : annuaire en single column + bottom-sheet pour filtres ; carte avec FAB "Filtres" ; drawers en plein écran sur mobile (Sheet).
- Sécurité RLS : aucune table CRM accessible à `anon`. Lecture/écriture conditionnée à `has_role(uid,'admin')` OR `EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND is_active)`.
- Pas de secrets requis (API gouv ouverte). Lovable AI Gateway sera utilisé en Phase E.

## Hors scope V1 (explicitement)
- Génération IA (briefs, mails, devis) → Phase E.
- Export PDF devis.
- Synchronisation calendrier / mailbox externe.
- Dessin polygone sur carte (V1.1).
- Notifications push commerciaux.

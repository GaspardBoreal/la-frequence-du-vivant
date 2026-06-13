## Diagnostic

- `crm_contacts` est vide (0 lignes).
- Les dirigeants récupérés via l'API Sirene/INPI sont stockés en `crm_companies.dirigeants` (jsonb) — 31 dirigeants déjà présents, jamais matérialisés en contacts → d'où le « 0 contacts » sur l'accueil.
- `crm_opportunities` est mono-entreprise / mono-contact (champs plats `prenom`, `nom`, `email`, `entreprise`, `company_id` unique). Impossible aujourd'hui de lier une oppo à plusieurs prospects/clients ni à plusieurs interlocuteurs.

## Objectifs

1. Une vraie gestion de contacts dans le CRM, sourcée à la fois manuellement et automatiquement depuis les dirigeants API.
2. Un onglet **Contacts** dans l'annuaire, entre Entreprises et Carte.
3. Une opportunité multi-entreprises + multi-contacts, avec sélection fluide dans le formulaire.

## 1. Modèle de données

### 1.1 Enrichir `crm_contacts`

Ajouter colonnes :

- `company_id uuid` (déjà présent — garder ; reste l'entreprise « principale »)
- `role_type text` — `dirigeant` | `operationnel` | `decideur` | `prescripteur` | `autre` (défaut `autre`)
- `qualite text` — qualité juridique brute issue de l'API (« Président », « DG »…), null sinon
- `is_dirigeant boolean` (défaut false) — flag rapide, vrai pour tout contact issu de l'API
- `dirigeant_source text` — `api_sirene` | `api_inpi` | `manual` (défaut `manual`)
- `dirigeant_external_key text` — clé de dédoublonnage (`siren|nom|prenom|qualite` slugifié)
- `date_naissance_partielle text` — « 1962-12 » conservée telle quelle
- `nationalite text`
- `linkedin_url text`, `notes text`
- Index unique partiel `(company_id, dirigeant_external_key) WHERE dirigeant_external_key IS NOT NULL` pour idempotence des resync API.

### 1.2 Backfill + sync auto

- Migration : fonction `public.sync_company_dirigeants_to_contacts(_company_id uuid)` qui lit `crm_companies.dirigeants` et upsert dans `crm_contacts` (mapping `nom`, `prenoms` → `prenom`, `qualite`, `type_dirigeant`, `date_de_naissance`, `nationalite`). `is_dirigeant=true`, `dirigeant_source='api_sirene'`, `role_type='dirigeant'`.
- Trigger `AFTER INSERT OR UPDATE OF dirigeants ON crm_companies` qui rejoue la fonction.
- Backfill one-shot dans la migration : `SELECT sync_company_dirigeants_to_contacts(id) FROM crm_companies WHERE dirigeants IS NOT NULL;` → matérialise les 31 dirigeants existants.

### 1.3 Liens N-N opportunités

Nouvelles tables :

- `crm_opportunity_companies(opportunity_id, company_id, role text default 'primary', created_at)` — `role` ∈ `primary` | `partenaire` | `prescripteur`. PK composite.
- `crm_opportunity_contacts(opportunity_id, contact_id, role text default 'interlocuteur', created_at)` — PK composite.
- Grants `authenticated`/`service_role` + RLS via `can_access_crm()`.
- Migration de compatibilité : pour chaque oppo existante avec `company_id`, créer une ligne `primary` dans `crm_opportunity_companies` ; idem si un contact match `email`.
- Les champs plats (`prenom`, `nom`, `email`, `entreprise`, `company_id`) restent en lecture seule pour rétro-compat / affichage rapide, mais le formulaire écrira via les tables de liaison.

## 2. UI — Annuaire Contacts

Route : `/admin/crm/annuaire` reçoit un onglet **Contacts** (segmented control déjà en place pour Entreprises / Carte) :

```text
[ Entreprises ] [ Contacts ] [ Carte ]
```

Nouveau composant `CrmContactsTab.tsx` :

- DataTable dense Linear/Vercel (token `--crm-surface`) : Avatar initiales, Nom, Fonction/Qualité, Entreprise (lien), Rôle (badge), Email, Téléphone, Dernière activité.
- Badge « Dirigeant » discret (icône `Crown`) quand `is_dirigeant=true`, tooltip avec source API.
- Filtres : recherche (nom/email/entreprise), rôle, dirigeant only, entreprise (combobox), ville.
- Actions : `Nouveau contact`, export CSV, bulk-assign à une opportunité.
- Drawer détail contact : infos, entreprise rattachée, opportunités liées (via `crm_opportunity_contacts`), historique activités. Édition inline ; pour un contact `dirigeant_source != 'manual'`, les champs API sont en lecture seule (toggle « éditer manuellement » qui passe `dirigeant_source` à `manual`).

Hooks : `useCrmContacts.ts` (list + filtres + invalidations realtime), `useCrmContactMutations.ts`.

## 3. UI — Opportunités multi-liens

Formulaire `OpportunityForm.tsx` enrichi :

- Section **Entreprises liées** : `CompaniesMultiPicker` (combobox async sur `crm_companies`, chips avec rôle `primary`/`partenaire`/`prescripteur`, une seule `primary`).
- Section **Contacts liés** : `ContactsMultiPicker` filtré par défaut sur les entreprises sélectionnées + recherche globale, chips avec rôle (`interlocuteur`/`décideur`/`signataire`). Quick-create « + Nouveau contact » qui ouvre une mini-modale et rattache directement.
- Les champs legacy `prenom/nom/email` deviennent dérivés du contact `primary` mais éditables (override manuel).

Vue Kanban / liste : affichage `1ère entreprise + n` et `1er contact + n` (badge compteur).

## 4. Accueil CRM

`useCrmHomeStats` : `contacts = count(crm_contacts)` — sera ≥ 31 dès le backfill. Ajouter sous-compteur « dont dirigeants » (compte `is_dirigeant=true`) affiché en sous-titre de la tuile Contacts.

## 5. Détail entreprise

Onglet **Dirigeants & contacts** dans `CompanyDetailContent` : liste consolidée depuis `crm_contacts` (filtre `company_id`), bouton « Promouvoir en interlocuteur d'opportunité ». Le bloc actuel qui lit le jsonb `dirigeants` brut est supprimé au profit de cette vue unifiée.

## Hors scope

- Édition rétroactive en masse du champ `dirigeants` jsonb dans `crm_companies` (on garde la source brute API intacte).
- IA scoring de contacts (module IA séparé).
- Import contacts CSV — peut venir dans une itération suivante.

## Questions

1. Pour les dirigeants type **« Commissaire aux comptes »** : on les exclut du sync (probablement bruit commercial)
2. Sur une opportunité, **forcer** au moins 1 entreprise `primary` + 1 contact
3. Un contact peut-il être rattaché à **plusieurs entreprises** (cas freelance / multi-mandats) ? OUI
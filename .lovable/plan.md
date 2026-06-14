## Objectif
Enrichir le drawer "Détail entreprise" (`CompanyDetailContent`) accessible depuis `/admin/crm/annuaire?tab=entreprises` afin de pouvoir éditer en profondeur les fiches importées via API, et y greffer la vie commerciale (opportunités) + la vie terrain (marches).

---

## 1. Onglet "Identité" — ajout champ Site web

**Migration DB** (table `crm_companies`) :
- Ajouter colonne `site_web text` (nullable).
- Ajouter colonne `primary_contact_id uuid references public.crm_contacts(id) on delete set null` (utilisée par l'onglet Contact ci-dessous).

**UI** : entre la ligne "Région / dépt" et la zone "Notes internes" :
- Champ éditable inline `Site web` (input + bouton Enregistrer ou auto-save sur blur).
- Validation via `zod` : `z.string().trim().url().max(500)` — accepte vide. Toast d'erreur si URL invalide.
- Normalisation : si l'utilisateur tape `monsite.fr` sans schéma, préfixer `https://` avant validation/sauvegarde.
- Si valeur présente : affichage en lien `<a target="_blank" rel="noopener noreferrer">` avec icône `ExternalLink` + favicon via `https://www.google.com/s2/favicons?domain=...`. Icône crayon pour basculer en mode édition.

---

## 2. Onglet "Contacts" — édition + contact principal

- Sur chaque carte contact : bouton crayon ouvrant `ContactFormDialog` (déjà existant) en mode édition (passer `contact` en prop ; étendre le dialog si nécessaire pour gérer update via `useUpdateContact`).
- Bouton étoile / `Crown` à côté du crayon : marque le contact comme principal → `updateCompany.mutate({ id, patch: { primary_contact_id: c.id } })`.
- Le contact principal est trié en premier, badge "Principal" doré, légère lueur ; clic sur l'étoile active à nouveau pour désactiver.
- Header de l'entreprise (hero) : sous le SIREN, afficher si défini "Contact principal · Prénom Nom" cliquable (ancre vers l'onglet Contacts).

---

## 3. Onglet "Activités" → "Activités CRM"

- Renommer le `TabsTrigger` (`Activités CRM`). Aucune autre modif.

---

## 4. Nouvel onglet "Opportunités" (design soigné)

Source de données : `crm_opportunity_companies` joint à `crm_opportunities` (filtrer par `company_id`). Hook nouveau `useCompanyOpportunities(companyId)`.

**Design** :
- Grille de cartes (1 col mobile, 2 cols desktop) avec :
  - Bandeau supérieur coloré selon `statut` (réutiliser `KANBAN_COLUMNS.color`).
  - Titre = `experience_souhaitee` ou nom du contact.
  - Métriques inline : budget (€), participants, date souhaitée (icônes `Euro`, `Users`, `Calendar`).
  - Pastille `assigned_member` (avatar) en haut à droite.
  - Animation `framer-motion` `whileHover={{ y: -2 }}` + glow doux.
- En haut : bouton "Nouvelle opportunité" pleine largeur en glassmorphism → ouvre `OpportunityForm` pré-rempli avec la `company_id` (création + lien automatique via `syncOpportunityLinks`).
- Clic sur une carte : ouvre `OpportunityForm` en édition.
- Menu kebab : Modifier / Délier de l'entreprise / Supprimer.
- État vide : illustration vectorielle légère + CTA "Créer la première opportunité".

**Composants nouveaux** : `src/components/crm/company-tabs/CompanyOpportunitiesTab.tsx`, `OpportunityMiniCard.tsx`.

---

## 5. Nouvel onglet "Marches" (design soigné)

Source : `crm_company_events` joint à `marche_events` (filtrer par `company_id`). Hook existant `useCrmCompanyEvents` à étendre avec `useCompanyMarches(companyId)`.

**Design** :
- Timeline verticale chronologique (passé / à venir) :
  - Ligne centrale dégradée (vert émeraude → ambre).
  - Marqueurs pulsants pour événements à venir, pleins pour passés.
  - Chaque entrée = carte avec image héro (si `marche.cover_url`), titre, date formatée FR, lieu, badge `relation_type` (Sponsor/Participant/Organisateur/Invité).
  - Hover : zoom léger + bouton "Voir la fiche marche" → navigate `/admin/marche-events/:id`.
- Header de l'onglet : bouton "Lier une marche existante" (picker réutilisant `CompanyLinkPicker` pattern inversé) + bouton "Créer un nouvel événement" → ouvre dialog rapide (titre + date + lieu) qui crée dans `marche_events` puis lie via `useLinkCompanyEvent`.
- Édition d'un lien : sélecteur `relation_type` inline + champ notes.
- Suppression du lien via `useUnlinkCompanyEvent` (avec confirm).
- État vide : "Aucune marche associée. Lier ou créer la première."

**Composants nouveaux** : `src/components/crm/company-tabs/CompanyMarchesTab.tsx`, `CompanyMarcheTimeline.tsx`, `LinkMarcheDialog.tsx`, `QuickCreateMarcheDialog.tsx`.

---

## 6. Layout des onglets

Le `TabsList` passe de `grid-cols-4` à `grid-cols-6` (Identité · Contacts · Finances · Activités CRM · Opportunités · Marches). Sur mobile (drawer étroit), passer en scroll horizontal `overflow-x-auto` avec `flex` au lieu de `grid` pour préserver la lisibilité.

---

## Détails techniques

**Migration SQL** :
```sql
ALTER TABLE public.crm_companies
  ADD COLUMN site_web text,
  ADD COLUMN primary_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS crm_companies_primary_contact_idx ON public.crm_companies(primary_contact_id);
```
Aucun changement RLS (politiques existantes couvrent tous les `UPDATE` admin).

**Fichiers modifiés** :
- `src/types/crmCompany.ts` (ajout `site_web`, `primary_contact_id`).
- `src/components/crm/CompanyDetailContent.tsx` (refactor en sous-composants par onglet).
- `src/components/crm/contacts/ContactFormDialog.tsx` (support édition).
- `src/hooks/useCrmCompanies.ts` (rien à changer, `useUpdateCompany` suffit).

**Fichiers créés** :
- `src/components/crm/company-tabs/CompanyIdentityTab.tsx`
- `src/components/crm/company-tabs/CompanyContactsTab.tsx`
- `src/components/crm/company-tabs/CompanyOpportunitiesTab.tsx`
- `src/components/crm/company-tabs/CompanyMarchesTab.tsx`
- `src/components/crm/company-tabs/OpportunityMiniCard.tsx`
- `src/components/crm/company-tabs/CompanyMarcheTimeline.tsx`
- `src/components/crm/company-tabs/LinkMarcheDialog.tsx`
- `src/components/crm/company-tabs/QuickCreateMarcheDialog.tsx`
- `src/hooks/useCompanyOpportunities.ts`
- `src/hooks/useCompanyMarches.ts`

**Validation site web** : composant `WebsiteField.tsx` réutilisable encapsulant zod + normalisation + lien.

Aucun secret, aucun edge function à modifier.

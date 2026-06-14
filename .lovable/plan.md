# Refonte `/admin/crm/marches` — Hub de valorisation commercial

Transformer la page actuelle (simple liste tableau) en **tableau de bord narratif** au service des commerciaux des Marches du Vivant.

---

## Architecture cible

`CrmMarches.tsx` devient un shell avec 5 sous-onglets (Tabs shadcn, URL `?tab=…` persistée, scroll top via `CrmScrollToTop` déjà en place) :

```text
/admin/crm/marches
├── ?tab=liste       → Liste (sous-onglets À venir / Passées / Carte)
├── ?tab=pratiques   → Pratiques remarquables (mur de vignettes)
├── ?tab=especes     → Top 25 Espèces + recherche
├── ?tab=maronnier   → Calendrier 2026-2027 des grands rendez-vous
└── ?tab=galerie     → Galerie des scénographies publiées
```

Un bandeau commun en tête (chiffres clés à valeur commerciale) : nb marches passées, nb participants cumulés, nb espèces uniques observées, nb pratiques documentées, nb entreprises liées CRM.

---

## Onglet 1 — Liste des marches

Réutilise l'existant `CrmMarches.tsx` actuel (table + `MarcheDetailDrawer`) et ajoute :

- **3 sous-onglets** : *À venir* | *Passées* | *Carte*
- **Vue Carte** : Mapbox/MapLibre (réutiliser le `<RichMap>` mutualisé memorisé) avec markers cliquables → ouvre `MarcheDetailDrawer`. Couleur marker = type d'event (agroécologique / éco-poétique / éco-tourisme).
- Recherche + filtres déjà présents conservés (titre / lieu / type).
- Compteur d'entreprises liées CRM par marche (existant via `useEventCompanyCounts`).

---

## Onglet 2 — Pratiques remarquables

Mur de vignettes (grille responsive) alimenté par `exploration_curations` (kind='main', existant — cf. memory `pratiques-emblematiques-marcheurs-logic`).

- Carte vignette : photo principale + titre + lieu + date événement + marcheurs liés (jointure `curation_marcheurs` → `community_profiles`).
- Tri : **Date de création (défaut)** | Nom ↑ | Nom ↓.
- Filtre rapide : type d'event, lieu (combobox), marcheur.
- Clic → drawer détail (réutilise le composant `PratiquesEmblematiquesDialog` existant).

---

## Onglet 3 — Top Espèces

Vue en deux temps :

1. **Top 25** : RPC SQL agrégeant `marcheur_observations` + `biodiversity_snapshots` (déduplication par nom scientifique, cf. memory `unified-species-count-rpc`) groupé par espèce, classé par nb d'observations décroissant.
2. **Carte espèce** : photo réelle (cascade marcheur → iNat via `<SpeciesThumb />`), nom FR/latin (`<SpeciesName />`), compteur, mini-liste des dernières observations (lieu + date + marcheur).
3. **Combobox de recherche** sur toutes espèces hors top 25 → ouvre un drawer plein écran avec toutes les marches associées (réutilise le drawer espèce mutualisé Carnet/Carte).

---

## Onglet 4 — Maronnier 2026-2027

Calendrier curé de **grands rendez-vous français** où Les Marches du Vivant devraient être présentes.

**Sources proposées** (à charger en seed via une migration de données initiale, table `crm_maronnier_events`) :

- **Salons B2B agri/environnement** : SIA (Salon International de l'Agriculture, Paris, fév-mars), SITEVI (Montpellier, nov 2027), Tech&Bio (Valence), Pollutec (Lyon, oct 2026), Salon des Maires (Paris, nov), Produrable (Paris, sept), ChangeNOW (Paris, avr), Vivatech (Paris, juin).
- **Sommets territoires & biodiv** : Congrès Mondial UICN, Assises de la Biodiversité, Universités d'été du MEDEF/CJD, Forum Zéro Carbone, COP régionales.
- **Festivals nature/éco-culture** : Festival du Film Ornithologique de Ménigoute, Festival International du Film Nature et Environnement, Rencontres Nationales Trame Verte & Bleue, Fête de la Nature, Jour de la Nuit.
- **B2C / éducation** : Salon de l'Agriculture Bio Marjolaine, Salon Primevère, Naturissima, Vivre Autrement.

**Sourcing dates exactes** : edge function `seed-maronnier-2026-2027` qui appelle Firecrawl (`search` + `scrape`) sur les sites officiels, puis insertion BDD. Curation manuelle ensuite via UI admin.

**UI** : vue Liste (cards date/lieu/type/site) + vue Carte France + filtres (date range, type [Salon B2B / Sommet / Festival / B2C], nom contient, région). Bouton "Ajouter au CRM" par event → crée une opportunité.

---

## Onglet 5 — Galerie média (Scénographies)

Mur de vignettes de toutes les marches avec `scenography_enabled = true` ET `is_public = true` (table `marche_events`).

- Vignette = `cover_image_url` + titre scénographique + lieu + date + lien direct `/m/:public_slug`.
- Tri : récentes d'abord, ou date événement.
- Bouton "Copier lien" + "Ouvrir scénographie" par carte.
- Filtre : type d'event, lieu, période.

---

## 3 idées pour aider les commerciaux à closer

### Idée 1 — "Dossier Preuve par la Data" (export 1-clic)

Bouton **"Générer dossier prospect"** depuis n'importe quelle marche passée → PDF/PPTX premium combinant :

- Hero scénographie (vignette + QR vers `/m/:slug`)
- KPI : nb participants, nb espèces, top 5 pratiques, empreinte biodiv
- Témoignages (`event_testimonies` existant) en citations
- Carte des observations
- Page "Et si c'était chez vous ?" pré-remplie avec le nom du prospect

Implémentation : edge function `generate-prospect-pitch-deck` (réutilise pipeline `generate-pack-vivant` mémorisé).

### Idée 2 — "Match Maronnier × Prospect"

Sur la fiche entreprise CRM (`/admin/crm/entreprises/:id`) : widget proposant automatiquement les 3 prochains événements du Maronnier les plus pertinents selon :

- Secteur NAF de l'entreprise → mapping vers type de salon
- Région de l'entreprise → proximité géographique
- Stage CRM (suspect/prospect/client) → priorité

→ "Croisons votre route au SIA 2027 sur le stand X" devient un argument d'ouverture concret.

### Idée 3 — "Storytelling Espèce Signature"

Pour chaque entreprise CRM, proposer une **"espèce signature"** présente sur ses territoires (croisement géoloc entreprise × `biodiversity_snapshots`).

Widget commercial : "12 espèces patrimoniales ont été observées dans un rayon de 10 km autour de votre siège lors de marches précédentes — dont la Salamandre tachetée. Voulez-vous une marche qui révèle votre patrimoine vivant local à vos équipes ?"

Implémentation : RPC géospatial `get_signature_species_for_company(company_id, radius_km)`.

---

## Détails techniques

**Nouveaux fichiers** :

- `src/pages/CrmMarches.tsx` (refactor en shell Tabs)
- `src/components/crm/marches/tabs/MarchesListTab.tsx` (sous-onglets À venir/Passées/Carte — extrait de l'existant)
- `src/components/crm/marches/tabs/PratiquesRemarquablesTab.tsx`
- `src/components/crm/marches/tabs/TopEspecesTab.tsx`
- `src/components/crm/marches/tabs/MaronnierTab.tsx`
- `src/components/crm/marches/tabs/GalerieScenographiesTab.tsx`
- `src/components/crm/marches/CrmMarchesHeaderKpi.tsx`

**Backend** :

- Nouvelle table `crm_maronnier_events` (titre, date_debut, date_fin, lieu, latitude, longitude, type, site_url, description, region, secteurs_naf[], statut_curation, created_at). GRANTs + RLS admin-only.
- RPC `get_top_species_observed(limit_n int)` — agrège snapshots + observations marcheurs.
- Edge function `seed-maronnier-2026-2027` (Firecrawl) — exécution manuelle initiale via bouton admin.
- (Idées 1-3 listées comme suite, pas dans cette première itération sauf si validé).

**Périmètre de cette première itération** : les 5 sous-onglets + table maronnier + seed initial. Les 3 idées commerciales sont présentées pour décision — à prioriser ensuite.

---

## Questions ouvertes

1. Sur le **maronnier** : on seed via Firecrawl (besoin connector Firecrawl) 
2. Les **3 idées commerciales** : on les construit dans la foulée (Idée 1 = plus rapide, Idée 3 = plus différenciante) 
3. **Galerie scénographies** : on filtre uniquement `is_public = true` 
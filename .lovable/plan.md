# Sprint « 3 Leviers Commerciaux » pour /admin/crm

Objectif : transformer le patrimoine data des marches en armes de vente concrètes pour closer des entreprises. Les 3 leviers s'enchainent dans un même funnel commercial :

```
Prospect identifié
    │
    ├─► Levier 3 : ESPÈCE SIGNATURE  ────► accroche
    │   (« 12 espèces patrimoniales chez vous, dont la Salamandre tachetée »)
    │
    ├─► Levier 2 : MATCH MARONNIER  ─────► rendez-vous physique
    │   (« Croisons-nous au SIA 2027, stand X »)
    │
    └─► Levier 1 : DOSSIER PREUVE  ──────► closing
        (PDF/PPTX premium personnalisé au prospect)
```

## Ordre de livraison recommandé

1. **Levier 1 — Dossier Preuve** (rapide, démontre la valeur immédiatement)
2. **Levier 3 — Espèce Signature** (différenciation poétique, peu de code)
3. **Levier 2 — Match Maronnier** (suppose mapping NAF × type salon, plus de curation)

---

## Levier 1 — Dossier Preuve par la Data

Bouton **« Générer dossier prospect »** sur chaque marche passée + sur fiche entreprise CRM.

**UI**
- `src/components/crm/marches/DossierPreuveDialog.tsx` : sélection entreprise prospect + marche source + checkboxes sections.
- Bouton dans `MarcheDetailDrawer` et dans `CrmCompanyDetail`.
- Aperçu live des sections cochées.

**Edge function `generate-prospect-pitch-deck`** (réutilise pipeline `generate-pack-vivant`)
- Input : `{ marche_id, company_id, sections[] }`
- Génère un PDF (pdf-lib côté Deno ou ReportLab via worker) avec :
  - Page 1 : hero scénographie + QR `/m/:slug`
  - Page 2 : KPIs (participants, espèces, top pratiques, empreinte)
  - Page 3 : 3-5 témoignages depuis `event_testimonies`
  - Page 4 : carte des observations (export PNG via Mapbox static / Leaflet print)
  - Page 5 : « Et si c'était chez vous, [Nom Entreprise] ? » + CTA
- Stockage dans bucket `prospect-decks/` + log dans nouvelle table `crm_prospect_decks`.

**Backend**
- Table `crm_prospect_decks` (company_id, marche_id, generated_by, file_url, sections jsonb, sent_at).
- Réutilise `get_exploration_export_data` existant.

---

## Levier 2 — Match Maronnier × Prospect

Widget « Salons stratégiques pour ce prospect » sur fiche entreprise CRM.

**Curation préalable (one-shot SQL)**
- Enrichir `crm_maronnier_events.secteurs_naf[]` avec mapping :
  - SIA → A01 (agriculture)
  - VivaTech → J62/J63 (tech)
  - Pollutec → E37/E38 (déchets/eau)
  - Salon des Maires → O84 (administration publique)
  - etc.
- Colonne supplémentaire `audience_cibles text[]` (DG, RSE, Achats, Marketing…).

**RPC `get_maronnier_matches_for_company(company_id, limit)`**
- Match sur `crm_companies.naf_code` ↔ `crm_maronnier_events.secteurs_naf`
- Bonus région : même `region` = +50 pts
- Bonus statut prospect (suspect=1, prospect=3, client_actif=5)
- Filtre `date_debut >= now()`
- Retourne top N avec score + raison du match.

**UI**
- `src/components/crm/companies/MaronnierMatchWidget.tsx` dans `CrmCompanyDetail`.
- Carte par event : logo salon + date + lieu + score + bouton « Copier accroche » qui génère :
  > « Bonjour [prénom], nous serons au [Salon] le [date] à [lieu]. Profitons-en pour parler de comment une Marche du Vivant pourrait révéler le patrimoine vivant de [Entreprise]. »

---

## Levier 3 — Storytelling Espèce Signature

Widget poétique sur fiche entreprise CRM : transforme la géoloc en récit vivant.

**RPC `get_signature_species_for_company(company_id, radius_km default 10)`**
- Récupère `latitude/longitude` de l'entreprise (siège ou établissements).
- Cherche dans `biodiversity_snapshots` + `marcheur_observations` les espèces observées dans rayon (Haversine).
- Filtre les espèces **patrimoniales** (présence dans `species_biogeography_kb` flag patrimoine, ou iconic_taxon emblématique : Amphibia, Aves rare, etc.).
- Retourne top 12 avec : `scientific_name`, `common_name_fr`, `photo_url`, `last_observation_date`, `marche_origine_slug`, `distance_km`.

**UI**
- `src/components/crm/companies/EspeceSignatureWidget.tsx`
- Hero card : « 12 espèces patrimoniales observées à moins de 10 km du siège de [Entreprise] »
- Carrousel des 12 photos (réutilise `<SpeciesThumb />`).
- Une **espèce mise en avant** (la plus rare ou emblématique) :
  > « Dont la **Salamandre tachetée**, observée le 12 mars 2026 lors de la Marche de Déviat à 7,2 km de vos bureaux. »
- CTA « Voulez-vous une marche qui révèle ce patrimoine à vos équipes ? » → ouvre dialog création opportunité CRM préremplie.

**Bonus** : bouton « Exporter visuel LinkedIn » génère une image carrée 1080×1080 avec l'espèce + nom entreprise (Edge function `generate-signature-card`).

---

## Détails techniques

**Nouveaux fichiers**
- `src/components/crm/marches/DossierPreuveDialog.tsx`
- `src/components/crm/companies/MaronnierMatchWidget.tsx`
- `src/components/crm/companies/EspeceSignatureWidget.tsx`
- `src/components/crm/companies/CommercialLeversSection.tsx` (regroupe widgets 2 & 3 dans la fiche entreprise)
- `supabase/functions/generate-prospect-pitch-deck/index.ts`
- `supabase/functions/generate-signature-card/index.ts`

**Backend**
- Migration : table `crm_prospect_decks` (+ GRANTs + RLS admin-only).
- Migration : ajout `crm_maronnier_events.audience_cibles text[]` + curation NAF.
- Migration : RPC `get_maronnier_matches_for_company` + `get_signature_species_for_company` (SECURITY DEFINER).

**Secrets requis** : aucun nouveau (réutilise Supabase + Lovable AI Gateway si on veut un sous-titre IA généré pour le dossier preuve).

**Buckets storage** : `prospect-decks` (privé, admin only).

---

## Questions avant lancement

1. Quel **levier démarrer en premier** ? (recommandation : Levier 1 Dossier Preuve)
2. Format de sortie **Dossier Preuve** : PDF only, ou PDF + PPTX éditable ?
3. **Rayon par défaut** Espèce Signature : 10 km, ou ajustable par l'utilisateur (5/10/25/50 km) ?
4. **Critère « patrimonial »** : on se base sur un flag manuel dans `species_biogeography_kb`, ou on utilise une liste figée (Amphibiens, Reptiles, Oiseaux Liste Rouge UICN) ?

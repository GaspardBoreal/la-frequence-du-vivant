## Livrables

Deux fichiers dans `/mnt/documents/` pour transmission à l'auditeur :

1. **`audit-deviat-jardin-monde.pdf`** — Note d'audit méthodologique contextualisée à cet événement
2. **`especes-deviat-jardin-monde.csv`** — Liste complète des espèces avec décisions de classification d'origine

## Périmètre

- Exploration : `20dd3be8-e594-492c-998a-5c4d009a5094`
- Événement : `f6095e8d-44a8-4156-951f-dd604b821603` — DEVIAT / Jardin Monde (date_marche 30/06/2026, lieu DEVIAT, type éco-poétique)
- Source espèces : `biodiversity_snapshots.species_data` (JSON) pour les `marche_id` rattachés à l'exploration, dédoublonnés par `scientificName`, fusionnés avec `marcheur_observations`
- Source classification origine : table `species_biogeography_kb` (colonnes `type_locality_source`, `type_locality_confidence`, `type_locality_country`, `native_countries_verified`, `describer_*`, `sources jsonb[]`)

## Contenu du PDF (≈8-10 pages, paysage A4)

1. **En-tête événement** — titre, lieu, date, exploration, nombre d'espèces, % enrichies
2. **Rappel méthode** (1 page) — cascade de décision identique à la note générique précédente : POWO → GBIF Type Locality → GBIF strict (NATIVE/ENDEMIC) → Inféré (descripteur, confiance faible)
3. **Synthèse chiffrée** — répartition par règle appliquée, par niveau de confiance, par continent d'origine
4. **Tableau exhaustif des espèces** — colonnes : nom scientifique, nom commun, règle, source, confiance, ISO origine, pays origine, descripteur, année, URLs sources (mêmes colonnes que `exportClassificationReport.ts` pour cohérence avec le rapport public)
5. **Cas sensibles à auditer** — sous-table des espèces en confiance `low` ou `inferred` (ex. *Syrphus ribesii* type) où le quiproquo « natif / originaire » peut survenir
6. **Notes de méthode** spécifiques à l'événement : rayon de collecte, sources actives (iNat / GBIF / marcheur), date du dernier snapshot

## Contenu du CSV

Mêmes colonnes que le PDF, encodé UTF-8 BOM, séparateur `,`, prêt pour Excel/LibreOffice. Une ligne par espèce, triée par nom scientifique.

## Implémentation (script Python one-shot, pas de changement applicatif)

- `psql` pour extraire :
  - liste marche_id de l'exploration
  - agrégat `species_data` (jsonb_array_elements) dédoublonné par `scientificName`
  - jointure gauche sur `species_biogeography_kb` via `scientific_name`
- Script Python (`/tmp/gen_audit_deviat.py`) :
  - reproduit la fonction `decideRule()` de `exportClassificationReport.ts` (POWO > gbif_type_locality > gbif_strict > inferred)
  - écrit le CSV
  - génère le PDF via `reportlab` (Platypus, tables paginées paysage)
- QA visuel obligatoire : `pdftoppm` puis inspection page par page avant livraison

## Points hors-scope

- Pas de modification du code applicatif (PackVivantButton, exportClassificationReport reste inchangé)
- Pas de re-enrichissement live des espèces non encore dans `species_biogeography_kb` : on les marque « Non enrichi » dans le CSV, l'auditeur voit le taux de couverture réel

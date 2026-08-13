# Fiche application « FRÉQUENCE JARDIN »

Une fiche de référencement (annuaires IA / open source) présentant l'espace Jardin,
publiée sous trois formes issues d'une source unique de contenu.

## Ce que voit le visiteur

Page publique `/roadmap/frequence-jardin`, dans la charte de la roadmap (fond sombre,
typo existante, nav et footer Marches du Vivant), structurée en sections :

1. En-tête : nom, baseline, nature du produit (application web de diagnostic vivant),
   langue, licence d'usage, statut, URL, contact.
2. En bref : 6 à 8 puces « ce que fait l'application », lisibles par un humain
   comme par un modèle.
3. Le parcours en 5 temps : J'observe, J'analyse (sol), J'identifie (méthode D.S.,
   ICG), Je synthétise, Palette végétale — une carte par étape avec entrées/sorties.
4. Les modules complémentaires : Atelier du jardin (Scénographe, Chantier avant/après,
   Mètre du jardinier), Clinique du vivant (foyers, halos, tournée de soin),
   Capteurs et sondes (IoT, webhook signé, mesures SI), Herbier du moment,
   IA de Jardin (contextes attachables, bordereau du vivant).
5. Données et méthode : sources (observations terrain, iNaturalist, cadastre,
   télémétrie), indicateurs (ICG, quatre curseurs sol/flore), principes
   (déduplication par nom scientifique, noms français centralisés, RLS).
6. Interopérabilité : exports (PDF, Markdown, CSV, GeoJossON/KML via Pack Vivant),
   RPC et Edge Functions, webhook IoT, MCP.
7. Cas d'usage : jardin nourricier, suivi de chantier écologique, propriété
   agroécologique, partenaire territorial.
8. Lien avec **Les Marches du Vivant** : comment l'app marcheurs alimente et
   prolonge Fréquence Jardin (observations citoyennes, marcheurs, Fréquences,
   carnets). Le lien hypertexte sera posé manuellement plus tard — la section
   décrit la relation et laisse un emplacement explicite.
9. Bloc téléchargements : bouton Markdown, bouton PDF, bouton « copier la fiche »
   (utile pour coller dans un modèle).
10. Métadonnées SEO/IA : titre, description, JSON-LD `SoftwareApplication`,
    canonical auto-référencé, entrée ajoutée dans `public/llms.txt`.

## Détail technique

- `src/content/frequenceJardinFiche.ts` : source unique — objet structuré
  (sections, puces, tableaux) + fonction `ficheToMarkdown()`. La page, le
  téléchargement Markdown et le PDF lisent tous cet objet, donc aucun risque de
  divergence entre les trois formes.
- `src/pages/FrequenceJardinFiche.tsx` : page publique, réutilise `RoadmapNav`
  et le footer de `RoadmapPublic`, `SEOHead` pour titre/description/canonical,
  JSON-LD `SoftwareApplication`.
- `src/App.tsx` : route `/roadmap/frequence-jardin` déclarée **avant**
  `/roadmap/:audience`, sinon elle est captée par la route audience.
- Markdown : génération côté client, `Blob` → `frequence-jardin.md`.
- PDF : `@react-pdf/renderer` (déjà présent), composant
  `src/components/roadmap/FrequenceJardinPdf.tsx` — A4, police Unicode pour les
  accents, page de garde sobre, sections numérotées, pied de page paginé.
- `public/llms.txt` : ajout d'une entrée pointant vers la fiche.

## Vérification

- Page ouverte en navigateur : rendu clair et sombre, 375 px et 1280 px.
- Téléchargement Markdown relu (structure de titres correcte).
- PDF converti en images et inspecté page par page (accents, débordements,
  ordre des sections) avant livraison.

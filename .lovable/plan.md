## Objectif

Produire un PDF A4 de 2 pages présentant LES MARCHES DU VIVANT, conçu comme document de contexte à fournir à une IA tierce (ou partenaire technique) pour qu'elle comprenne le positionnement, les services, l'architecture et les points d'intégration possibles.

## Livrable

Un fichier `/mnt/documents/marches-du-vivant-synthese-ia.pdf` téléchargeable, au format A4 portrait, charté aux couleurs du projet (Papier Crème #FAF8F3 / Vert Forêt #0D6B58), typographie sobre, dense mais lisible.

## Structure des 2 pages

**Page 1 — Positionnement, Vision & Services**
- En-tête : titre, baseline « La Fréquence du Vivant », date, mention "Document de contexte pour intégration IA"
- Bloc Manifeste : géopoétique, sobriété informationnelle, droit au silence, biodiversité vécue
- Bloc Publics : B2B (Entreprises/Collectivités), B2C (Marcheurs/Citoyens), Associations — codes couleur Emerald/Cyan/Amber
- Bloc Services & Modules : Marches du Vivant (events terrain), Carnets de Terrain, CRM communauté, Livre Vivant (eBook interactif), Dordonia (IA poétique), Zones Blanches, Quiz, Pack Vivant (export .zip)
- Bloc Rôles communautaires & Fréquences : Marcheur → Éclaireur → Ambassadeur → Sentinelle

**Page 2 — Architecture technique & Cas d'usage IA**
- Stack : React 18 + Vite + TS + Tailwind, Supabase (Postgres + RLS + Edge Functions Deno), Lovable AI Gateway, n8n hybride
- Sources de données intégrées : GBIF, iNaturalist, Xeno-Canto, eBird, INPN, Open-Meteo, IGN, INSEE…
- Schéma data clé : marches, events, marcheur_observations, snapshots biodiversité, user_roles, exploration_curations, species_eco_tags_kb
- Points d'intégration IA (cas d'usage concrets) :
  1. Chatbot screen-aware (DOM observer + slices métier + contexte géo)
  2. Classification éco-fonctionnelle d'espèces (edge `classify-species-eco-tags`)
  3. Résumés éditoriaux de marches (edge `marche-editorial-summary`)
  4. Dordonia dual-persona (Laurent business / Gaspard poétique)
  5. Diagnostic biodiversité 5 km temps réel
  6. Génération visuels Story (`generate-story-visuals`)
- Modes d'intégration possibles pour une IA tierce : Edge Function dédiée, MCP, webhook n8n, RPC Supabase, AI Gateway proxy
- Pied de page : URLs publiques, contact

## Implémentation technique

- Script Python avec **ReportLab** (Platypus, SimpleDocTemplate A4, marges 1.5 cm)
- Palette : Papier Crème #FAF8F3 (fond), Vert Forêt #0D6B58 (titres/accents), gris anthracite #2A2A2A (corps), Or doux #C9A961 (filets)
- Typographie : Helvetica-Bold pour titres, Helvetica pour corps (polices natives ReportLab, pas de glyphes Unicode exotiques)
- Mise en page : 2 colonnes sur la page 2 pour densifier, cartouches colorés pour les blocs publics/cas d'usage
- QA : conversion `pdftoppm -jpeg -r 150`, inspection visuelle des 2 pages, correction si overflow / chevauchement
- Affichage final via `<presentation-artifact>`

## Hors périmètre

- Pas de modification du code de l'application
- Pas de nouvelle route ni page web (livrable = PDF seul)
- Pas de logo personnalisé généré (utilisation typographique uniquement, sauf si vous fournissez un asset)

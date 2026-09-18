---
name: Base de connaissance Fréquence Jardin
description: Écran /admin/outils/connaissance (Cartographie, Fiches, Questions, Couverture), tables kb_*, import idempotent des savoirs déjà écrits dans le code
type: feature
---

- Écran `/admin/outils/connaissance` : 4 onglets — Cartographie (RPC `get_kb_coverage`, état des sources + savoirs à écrire), Fiches (CRUD + sources + statut), Questions (registre + suggestions `suggest_kb_questions_from_assistant`, jamais d'insertion automatique), Couverture (KPI).
- Tables : `kb_articles` (stable_id unique, status brouillon|relecture|publiee, origin code|manuel|externe|entretien), `kb_article_sources`, `kb_questions`, `kb_question_articles`, `kb_article_versions`.
- Règle de rigueur : aucune fiche publiée sans source citée + réponse courte (trigger DB et garde-fou dans l'UI).
- Import de départ : `src/lib/knowledge/seed.ts` reconstitue les fiches depuis FJ_FAQ, FJ_GUIDES, FJ_PLANTS, PUBLIC_METHODS, PLANT_INDICATORS, PALETTE_BLACKLIST, OUVRAGE_RECO_KB, INSPIRATIONS, HARMONIES ; idempotent par `stable_id`, fiches créées en statut « à relire ». Rien n'est réécrit ni inventé.
- Étapes suivantes non faites : branchement de l'Assistant (propriete-chat) sur les fiches publiées, et page publique FAQ.

---
name: Moteur de recherche des pages publiques
description: Recherche site-wide des pages publiques, 5 univers ordonnés, catalogue et règles éditables dans /admin/outils/recherche
type: feature
---
- Portée : pages publiques uniquement (jamais espèces, textes, admin, connexion).
- Accès : bandeau public (`PublicTopBar` → `SiteSearchTrigger`) + ⌘K/Ctrl+K global, sauf `/marches-du-vivant/mon-espace` et `/admin` où la recherche de contenus existante garde le raccourci.
- Ordre des groupes imposé : Fréquence Jardin, Fréquence du Vignoble, Les Marches du Vivant, Éco tourisme, La Fréquence du Vivant.
- Données : tables `site_pages` et `site_search_rules` ; écran d'administration `/admin/outils/recherche` (pages, règles, aperçu). Les règles de classement évoluent par cet écran, pas en dur dans le code.
- Règles Vignoble initiales : viti, vini, château, vignoble, vin.
- Univers illustrés par des icônes lucide (pas d'émojis : rendu incohérent selon les appareils).

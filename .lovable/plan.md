# Volet « Contributeurs » sur la fiche /agent-ia

Ajouter à la fiche de l'agent IA un bloc court et lisible qui nomme les deux personnes
à l'origine de l'agent, et le refléter dans le balisage structuré pour que Google et les
LLM associent ces personnes à l'agent et à l'éditeur.

## 1. Le bloc affiché

Placement : juste après la section « Engagement éthique », avant « Pour qui ? ».
Titre : « À l'origine de l'agent ». Deux cartes côte à côte (une colonne sur mobile),
sobres, sans photo, dans les tokens de design existants.

- **Laurent Tripied** — CEO bziiit · PiloTerra. Direction technologique et cadre d'IA
  responsable (charte bziiit - PiloTerra, IA frugale). Lien LinkedIn.
- **Gaspard Boréal** — Auteur du recueil « La Fréquence du Vivant », créateur des Marches
  du Vivant. Conception du protocole de marche, de l'écoute du vivant et du récit de
  territoire. Lien gaspardboreal.com.

Une ligne de contexte sous le titre rappelle que l'agent est édité par l'association
La Fréquence du Vivant, avec un lien vers `/marches-du-vivant/association` (l'équipe
complète y figure déjà) — cohérence d'entité, pas de duplication de contenu.

## 2. SEO / GEO

- JSON-LD : ajouter deux nœuds `Person` au `@graph` existant, référencés depuis le
  `SoftwareApplication` via `author` (liste : Organization + les deux Person) et
  `contributor`. `sameAs` : LinkedIn pour Laurent Tripied, gaspardboreal.com pour
  Gaspard Boréal ; `affiliation` → l'Organization La Fréquence du Vivant pour Gaspard,
  mention bziiit - PiloTerra pour Laurent.
- Bloc « En bref » : une entrée supplémentaire nommant les deux contributeurs en une
  phrase autonome et citable.
- `public/llms.txt` : compléter l'entrée `/agent-ia` avec les deux noms et leurs rôles.
- Meta description inchangée (déjà à la bonne longueur).

## Détails techniques

- `src/pages/AgentIA.tsx` : tableau local `contributeurs` (nom, rôle, apport, lien),
  section rendue avec `Card` + icônes lucide déjà importées ; ajout des nœuds `Person`
  dans `AGENT_JSONLD` et de la ligne dans `enBref`.
- `public/llms.txt` : une phrase ajoutée à la ligne existante de l'agent IA.
- Aucun changement de route, aucune couleur en dur, réutilisation des tokens.

## Vérification

Rendu 375 px et 1280 px, thèmes clair et sombre ; JSON-LD parsé sans erreur ;
liens externes en `target="_blank" rel="noopener noreferrer"`.

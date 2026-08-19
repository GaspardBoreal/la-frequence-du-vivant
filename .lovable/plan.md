# Finaliser le référencement de l'agent sur PiloTerra

État vérifié aujourd'hui : `/agent-ia` porte déjà le JSON-LD complet (`Organization`, `SoftwareApplication`, les deux `Person`), le bloc « En bref », l'image sociale `public/agent-ia-marches-du-vivant.png`, l'entrée sitemap avec `image:image` et la ligne `llms.txt`. La fiche PiloTerra est rendue côté client depuis Supabase : son contenu n'est pas lisible par un crawler HTML, ce qui change ce qui reste utile de faire.

## Ce qui reste à faire

### 1. Rendre le lien bidirectionnel (le point le plus important)
Aujourd'hui le `sameAs` du `SoftwareApplication` ne cite pas la fiche PiloTerra. Ajouter
`https://piloterra.fr/agents/les-marches-du-vivant` dans :
- `sameAs` du `SoftwareApplication` ;
- `sameAs` de l'`Organization` (page éditrice) ;
- la ligne `/agent-ia` de `public/llms.txt` (« Également référencé sur PiloTerra : … »).

C'est ce qui permet à Google et aux LLM de fusionner les deux mentions en une seule entité au lieu de deux fiches concurrentes.

### 2. Réciprocité visible côté site
Ajouter sur `/agent-ia` une ligne discrète « Référencé sur le portail PiloTerra » avec lien sortant (`target="_blank" rel="noopener"`), dans le bloc pied de page de la fiche. Un lien annuaire non réciproque compte beaucoup moins.

### 3. Corriger ce qui est incohérent entre les deux fiches
- `datePublished` du JSON-LD est `2026-08-19` alors que l'origine terrain annoncée est août 2025. Passer `datePublished` à la date réelle de première publication de l'agent et ajouter `dateModified` à aujourd'hui : une date de publication postérieure aux faits décrits affaiblit la confiance.
- Vérifier que le nom, l'éditeur, la description et l'image envoyés à PiloTerra sont **mot pour mot** ceux de `/agent-ia` (`name`, `publisher`, description longue, image). Toute divergence crée deux entités.

### 4. Image de la fiche PiloTerra
Renseigner sur PiloTerra l'URL absolue `https://la-frequence-du-vivant.com/agent-ia-marches-du-vivant.png` (1200×630, déjà en place) plutôt que l'URL CDN du logo : le format social passe mieux dans les listings.

### 5. Ce qui ne servira pas
La fiche PiloTerra étant rendue en JavaScript depuis Supabase, elle n'apporte pas de « jus » de lien classique tant que PiloTerra ne pré-rend pas ses pages agents. Le bénéfice réel est la **citation d'entité** (LLM, Perplexity, Gemini qui exécutent le JS) et le trafic direct. Si vous avez la main côté PiloTerra, la seule amélioration structurante là-bas serait d'ajouter un JSON-LD `SoftwareApplication` statique par fiche agent — à signaler à l'équipe, hors périmètre de ce projet.

## Détails techniques

- `src/pages/AgentIA.tsx` : `sameAs` (2 nœuds), `dateModified`, bloc lien réciproque.
- `public/llms.txt` : ligne `/agent-ia` complétée.
- `public/sitemap.xml` : `lastmod` de `/agent-ia` mis à jour.
- Aucune nouvelle route, aucune couleur en dur.

## Vérification

JSON-LD parsé sans erreur, rendu 375 px et 1280 px en clair et sombre, lien sortant fonctionnel.

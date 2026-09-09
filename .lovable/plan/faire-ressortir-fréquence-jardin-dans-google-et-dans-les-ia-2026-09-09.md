# Faire ressortir « Fréquence Jardin » dans Google et dans les IA

## Le constat (vérifié)

- Aucune page du site ne s'appelle vraiment « Fréquence Jardin » : le seul contenu dédié est `/roadmap/frequence-jardin`, une fiche technique rangée sous « roadmap ». Une adresse enfouie, sans page vitrine, ne peut pas gagner un nom de marque.
- Le titre et la description du site (`index.html`) ne mentionnent jamais Fréquence Jardin.
- Le `sitemap.xml` contient surtout les dix pages de logos de Fréquence Jardin — le nom est associé à des images, pas à un service.
- Semrush ne mesure aucun volume de recherche sur « fréquence jardin » en France : c'est un nom de marque neuf. La bonne nouvelle : sur un nom propre, le top 10 est atteignable vite dès qu'une page claire existe. La contrepartie : personne ne le tape encore — il faut aussi exister sur ce que les gens cherchent réellement (diagnostiquer son sol, savoir quoi planter, plantes bio-indicatrices).
- `llms.txt` existe déjà et décrit bien le projet : c'est un atout pour les IA, il est sous-exploité pour Fréquence Jardin.

## Ce qu'on met en place

### 1. Une page vitrine à l'adresse `/frequence-jardin`

La page de référence du produit, pour les trois publics :

- Ce que c'est, en une phrase compréhensible dès la première ligne (c'est cette phrase que les IA recopient).
- Le parcours en cinq temps : j'observe, j'analyse mon sol, j'identifie, je synthétise, je choisis mes plantes.
- Trois entrées publics : particuliers (jardin, balcon, terrasse) ; domaines, collectivités et entreprises ; paysagistes et professionnels.
- Les modules (atelier du jardin, clinique du vivant, capteurs, IA de jardin, herbier).
- Un cas concret chiffré (Jardin Monde de Deviat) et le lien avec Les Marches du Vivant.
- Un bloc de questions/réponses factuelles rédigé pour être cité mot pour mot par une IA.
- Appels à l'action vers `/jardin/demarrer` et vers le contact.

`/roadmap/frequence-jardin` reste en ligne (aucune adresse ne casse) et devient l'annexe technique, avec un lien bien visible vers la nouvelle page.

### 2. Quatre pages satellites (le contenu que les IA citent)

1. `/frequence-jardin/diagnostiquer-son-jardin` — guide complet, du premier tour au diagnostic.
2. `/frequence-jardin/plantes-bio-indicatrices` — ce que les plantes spontanées disent du sol, table de lecture.
3. `/frequence-jardin/palette-vegetale` — comment choisir des plantes adaptées au lieu.
4. `/frequence-jardin/cas-jardin-monde-deviat` — le cas concret, avec relevés réels et photos.

Chacune renvoie à la page vitrine et aux autres : c'est ce maillage qui fait comprendre à Google et aux IA que « Fréquence Jardin » est une entité, pas un mot isolé.

### 3. Les signaux de marque

- `index.html` : titre et description du site mentionnent Fréquence Jardin, et le bloc « organisation » déclare Fréquence Jardin comme produit de l'association.
- Sur `/frequence-jardin` : données structurées `SoftwareApplication` (nom, éditeur, langue, public, adresse) + fil d'Ariane, et titre/description/canonique propres à la page.
- `llms.txt` : une section « Fréquence Jardin » en tête, avec définition en une phrase, publics, modules et liste des pages — c'est le fichier que lisent les IA.
- `sitemap.xml` : ajout des cinq nouvelles pages en priorité haute ; les pages de logos redescendent.
- Liens internes depuis les pages déjà bien référencées (accueil, `/marches-du-vivant`, `/etude-de-sol`, `/agent-ia`, les entretiens de Laurent Tripied) avec le libellé exact « Fréquence Jardin ».
- Ajout au catalogue du moteur de recherche interne (`site_pages`, univers Jardin).

### 4. Ce qui se joue en dehors du site (indispensable pour les IA)

Les IA citent surtout ce qui est repris ailleurs. À faire après la mise en ligne, de votre côté (je fournis les textes prêts à coller) :

- Demande d'indexation des cinq nouvelles pages dans Search Console, et sitemap soumis à Bing (Bing alimente ChatGPT et Copilot).
- Fiche Wikidata de l'association mentionnant Fréquence Jardin, page LinkedIn, dépôt open source, annuaires de solutions écologiques et numériques responsables.
- Un ou deux articles hébergés ailleurs (PiloTerra, partenaires, presse locale) qui nomment « Fréquence Jardin » et pointent vers `/frequence-jardin`.

## Délais réalistes

Sur le nom « Fréquence Jardin » : quelques jours à trois semaines pour le top 10 Google une fois la page indexée. Sur les requêtes de fond (sol, plantes bio-indicatrices) : deux à quatre mois. Côté IA : elles reprennent la marque quand plusieurs sources indépendantes la nomment — comptez un à trois mois après les mentions externes.

## Détails techniques

- Nouvelles pages `src/pages/FrequenceJardin*.tsx`, routes publiques déclarées avant `/jardin/:slug` pour éviter toute capture ; contenu factorisé dans `src/content/frequenceJardin/` afin de rester la source unique (la fiche existante `frequenceJardinFiche.ts` est réutilisée, pas dupliquée).
- Métadonnées par page via `SEOHead` (Helmet), JSON-LD `SoftwareApplication` + `BreadcrumbList`, canonique auto-référencée.
- Fichiers touchés : `index.html`, `public/sitemap.xml`, `public/llms.txt`, `src/App.tsx`, page vitrine + 4 pages, liens internes dans les pages existantes, insertion dans `site_pages`.
- Aucune donnée inventée : chiffres, relevés et citations proviennent du contenu déjà présent dans le projet. Si un chiffre manque (nombre de jardins suivis, d'espèces recensées), je vous le demanderai plutôt que de l'écrire.
- Limite connue de la version actuelle du site : les aperçus de lien sur les réseaux sociaux restent ceux du site entier, car les métadonnées par page sont posées côté navigateur. Google et les IA, eux, les voient bien. Une version rendue côté serveur lèverait cette limite — [ce que l'upgrade apporte](https://lovable.dev/blog/building-apps-using-tanstack-start).

## Vérification

Pages ouvertes en clair et sombre, mobile et bureau ; données structurées validées ; sitemap XML valide ; liens internes cliqués ; puis publication (les changements de titre n'atteignent l'adresse publique qu'après publication).

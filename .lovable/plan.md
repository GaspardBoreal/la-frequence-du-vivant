# Rendre les pages lisibles par les IA et les robots (réponse à l'analyse de Claude)

## Ce que dit Claude, vérifié point par point

- **Exact** : le site est une application React rendue côté navigateur. Les robots qui n'exécutent pas le JavaScript (aperçus LinkedIn/Slack, beaucoup de crawlers d'IA) ne voient que la coquille `index.html`, avec le titre et la description du site entier.
- **Déjà en place** : les métadonnées par page existent (`SEOHead` / react-helmet-async) — titre, description, canonique et og:url propres à chaque page. Google, qui exécute le JavaScript, les voit. Claude, LinkedIn et les aperçus sociaux, non.
- **Déjà en place** : `sitemap.xml` et `llms.txt` existent et sont fournis. Mais les pages partenaires y sont quasi absentes (1 seule entrée « partenaires » dans le sitemap, aucune dans `llms.txt`).

## Ce qu'on fait (décisions actées)

### 1. Rendre la page Chambre d'agriculture référençable
Retirer le `noindex` de `/partenaires/chambre-agriculture-pays-de-la-loire` : elle devient visible de Google et des IA, avec son titre, sa description et sa canonique propres (déjà posés par `SEOHead`).

### 2. Compléter `sitemap.xml`
Ajouter la page Chambre d'agriculture et vérifier que toutes les pages partenaires publiques y figurent.

### 3. Enrichir `llms.txt` — le fichier que lisent les IA
Ajouter une section « Partenariats territoriaux » listant les pages partenaires publiques (Chambre d'agriculture Pays de la Loire, VDTP, etc.) avec un résumé texte de chacune : c'est le levier le plus direct pour que les IA connaissent ces contenus, même sans exécuter le JavaScript.

## La limite qui reste (réponse honnête à Claude)

Le point 1 de sa liste — le pré-rendu statique — n'est pas disponible sur l'architecture actuelle. La solution durable est le rendu côté serveur via la migration TanStack Start (« / » → « Migrate to TanStack Start ») : **décision reportée**, à redécider plus tard. Les aperçus sociaux par page resteront ceux du site entier d'ici là ; Google et les IA lisant `llms.txt` verront bien les contenus.

## Détails techniques

- Fichiers touchés : `src/pages/PartenaireChambreAgriPdl.tsx` (retrait du `noIndex`), `public/sitemap.xml`, `public/llms.txt`.
- Aucune donnée inventée : les résumés de `llms.txt` reprennent le contenu réel des pages.
- Les changements n'atteignent l'adresse publique qu'après publication.

## Vérification

Page CAPDL ouverte et balises vérifiées (plus de noindex, canonique auto-référencée), sitemap XML valide, `llms.txt` relu, puis publication.

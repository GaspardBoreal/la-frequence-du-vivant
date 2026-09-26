# Rendre les pages lisibles par les IA et les robots (réponse à l'analyse de Claude)

## Ce que dit Claude, vérifié point par point

- **Exact** : le site est une application React rendue côté navigateur. Les robots qui n'exécutent pas le JavaScript (aperçus LinkedIn/Slack, beaucoup de crawlers d'IA) ne voient que la coquille `index.html`, avec le titre et la description du site entier.
- **Déjà en place** : les métadonnées par page existent (`SEOHead` / react-helmet-async) — titre, description, canonique et og:url propres à chaque page. Google, qui exécute le JavaScript, les voit. Claude, LinkedIn et les aperçus sociaux, non.
- **Déjà en place** : `sitemap.xml` et `llms.txt` existent et sont fournis. Mais les pages partenaires y sont quasi absentes (1 seule entrée « partenaires » dans le sitemap, aucune dans `llms.txt`).
- **Point d'attention** : la page Chambre d'agriculture est volontairement en `noindex` (page de prospection, pas de référencement). Même avec un rendu serveur, elle resterait invisible de Google tant que ce choix est maintenu. C'est cohérent si elle ne doit servir qu'aux destinataires du lien.

## Ce qu'on fait maintenant (sans changer d'architecture)

### 1. Enrichir `llms.txt` — le fichier que lisent les IA
Ajouter une section « Partenariats territoriaux » listant les pages partenaires publiques (Chambre d'agriculture Pays de la Loire, VDTP, etc.) avec un résumé texte de chacune : c'est le levier le plus direct pour que les IA connaissent ces contenus, même sans exécuter le JavaScript.

### 2. Compléter `sitemap.xml`
Vérifier que toutes les pages partenaires **indexables** y figurent (les pages en `noindex` n'ont pas à y être — ce serait contradictoire).

### 3. Clarifier la stratégie noindex des pages partenaires
Pour chaque page partenaire, trancher : vitrine publique référençable (on retire le noindex) ou document de prospection privé (on garde le noindex, et on accepte qu'elle soit invisible des moteurs et IA). Question posée ci-dessous pour la page Chambre d'agriculture.

## La limite qui reste (réponse honnête à Claude)

Le point 1 de sa liste — le pré-rendu statique — n'est pas disponible sur l'architecture actuelle du site (application React côté navigateur). La solution durable est le rendu côté serveur : l'application peut l'obtenir en migrant vers le dernier modèle Lovable — tapez « / » dans le chat et choisissez « Migrate to TanStack Start », ou demandez-moi de le faire. [Ce que l'upgrade apporte](https://lovable.dev/blog/building-apps-using-tanstack-start). C'est une migration à part entière, à décider séparément ; les actions 1 à 3 ci-dessus sont utiles dans les deux cas.

## Détails techniques

- Fichiers touchés : `public/llms.txt` (section partenaires), `public/sitemap.xml` (entrées manquantes), éventuellement le `noIndex` de `PartenaireChambreAgriPdl.tsx` selon votre choix.
- Aucune donnée inventée : les résumés de `llms.txt` reprennent le contenu réel des pages.
- Les changements n'atteignent l'adresse publique qu'après publication.

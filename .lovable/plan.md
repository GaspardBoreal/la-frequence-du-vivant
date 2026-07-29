## Objectif

Sortir la galerie `/marches-du-vivant/carnets-de-terrain` des résultats Google et des réponses des IA génératives, sans casser les URL existantes.

## Ce qui a été vérifié

Points d'entrée actuels vers la galerie :
- `public/sitemap.xml:11` — l'URL est déclarée (weekly, priorité 0.7)
- `public/llms.txt:27` — déclarée pour les IA génératives
- `src/pages/MarchesDuVivantExplorer.tsx:633` — lien « Découvrir tous les carnets de terrain » depuis `/marches-du-vivant/explorer`
- `src/pages/CarnetDeTerrain.tsx:198` et `:166` — fil d'Ariane et lien de retour depuis les carnets individuels
- Ni le header public ni le footer ne pointent vers elle

Les carnets individuels `/carnets-de-terrain/:slug` sont eux aussi publics et indexables : les désindexer avec la galerie est cohérent, sinon Google continue de les remonter isolément.

## Étapes

1. **Retirer l'URL du `public/sitemap.xml`** (l'entrée de la galerie). Aucune entrée par carnet n'y figure aujourd'hui, rien d'autre à retirer.
2. **Retirer la ligne « Carnets de terrain » de `public/llms.txt`** pour que les IA génératives ne la présentent plus comme une ressource du site.
3. **Ajouter `<meta name="robots" content="noindex, follow">`** via Helmet sur :
   - la galerie `CarnetsDeTerrainGalerie.tsx`
   - la page carnet individuel `CarnetDeTerrain.tsx`
   
   C'est le signal qui fait effectivement sortir les pages de l'index Google (contrairement à un simple `Disallow`, qui empêche le crawl mais laisse l'URL indexée). `follow` conserve la circulation du jus de lien vers le reste du site.
4. **Retirer le lien d'entrée** « Découvrir tous les carnets de terrain » depuis `/marches-du-vivant/explorer`. La section de vignettes de carnets juste au-dessus est également concernée : soit on la retire, soit on la conserve — voir point d'attention.
5. **Conserver la route active** : `/marches-du-vivant/carnets-de-terrain` et les URL de carnets continuent de répondre normalement (pas de 404), conformément à la règle « ne jamais casser les URL publiques ». Les liens de retour internes depuis un carnet restent en place.

## Point d'attention

La section « Ils ont marché. Voici leurs traces. » de `/explorer` affiche 3 vignettes de carnets en plus du lien texte. Par défaut je **conserve les vignettes** (elles restent utiles à la navigation, et les pages cibles seront en `noindex`) et je retire uniquement le lien « Découvrir tous les carnets de terrain ». Dis-le moi si tu préfères supprimer toute la section.

## Détails techniques

- Les balises `robots` passent par `react-helmet-async`, déjà utilisé sur ces pages pour le title/description.
- Modification de fichiers uniquement, aucune migration base de données : les marches restent publiées côté données et les carnets restent consultables par lien direct.
- Délai Google : la désindexation prend généralement quelques jours à quelques semaines après recrawl. Une demande de suppression via Google Search Console accélère le processus si le compte est connecté.
- Les findings SEO liés seront marqués comme corrigés après application.

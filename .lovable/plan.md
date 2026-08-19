# Référencer l'agent IA « Les Marches du Vivant » sur piloterra.fr

Objectif double : remplir le formulaire Piloterra avec un contenu prêt à copier-coller, et
préparer la page d'atterrissage pour que ce backlink profite réellement au SEO classique et au
GEO (citations par ChatGPT, Claude, Gemini, Perplexity).

La page cible existe déjà : `/agent-ia` (fiche Agent IA complète, avec titre et description SEO,
capacités, cas d'usage, déploiement). C'est elle qui servira de « lien externe ».

## 1. Contenu prêt à coller dans le formulaire Piloterra

**Type de ressource** : Agent IA — **Titre** : Les Marches du Vivant — **Statut** : publié

**Description** (≈ 700 signes, formulation GEO : sujet nommé, éditeur nommé, faits vérifiables)

> Les Marches du Vivant est un agent IA de mesure collaborative de la biodiversité, édité par
> l'association La Fréquence du Vivant. Il accompagne collectivités, domaines agricoles,
> entreprises et associations lors de marches de terrain : collecte multimodale (photos géolocalisées,
> enregistrements sonores, témoignages, traces GPX), identification des espèces par vision et
> bioacoustique, résolution des noms français et classification écologique (mellifère, fixateur
> d'azote, bio-indicateur…). L'agent calcule un indice composite, la « Fréquence du Vivant »,
> détecte les zones blanches non documentées et produit un Pack Vivant exportable
> (PDF, Excel, CSV, GeoJSON, KML). Données souveraines, RGPD, hébergement européen, exports ouverts.

**Lien externe** : `https://la-frequence-du-vivant.com/agent-ia`

**Image URL** : `https://la-frequence-du-vivant.com/agent-ia-marches-du-vivant.png`
(fichier 1200×630 à déposer dans `public/`, dérivé du logo « Sentier en fréquence » +
mention « Les Marches du Vivant — par La Fréquence du Vivant » : le logo seul ne dit pas l'éditeur.)

**Date de publication** : 19/08/2026

### Métadonnées Agent IA

- **Éditeur** : `La Fréquence du Vivant`
- **Tags métiers / catégories** :
  `Biodiversité, Agriculture, Agroécologie, Science participative, Collectivités, Environnement,
  Sol vivant, RSE & CSRD, Observation de terrain, Données géospatiales, Éducation, Territoires`
- **Frameworks** :
  `React, TypeScript, Supabase, PostgreSQL/PostGIS, Edge Functions (Deno), Google Gemini,
  MCP (Model Context Protocol), Leaflet, iNaturalist API, GBIF API`
- **Capacités** :
  `Identification d'espèces (vision), Bioacoustique, Recherche web, Analyse de données,
  Géolocalisation et cartographie, Génération de rapports (PDF/Excel/CSV/GeoJSON/KML),
  Chatbot contextuel, Analyse de sol assistée, Recommandation de palette végétale,
  Multimodal (photo, audio, texte), API & MCP, Multilingue (FR)`

### Éditeur JSON brut (avancé)

Bloc `SoftwareApplication` complet (nom, `applicationCategory`, `publisher` = La Fréquence du
Vivant avec son URL, `url`, `image`, `datePublished`, `featureList`, `inLanguage`, `areaServed`,
`offers` gratuit, `isAccessibleForFree`, `sameAs` vers /marches-du-vivant, /roadmap/frequence-jardin
et le site de l'association). Rédigé intégralement dans le livrable, prêt à coller.

## 2. Analyse SEO / GEO et ce qu'on ajuste côté site

Un backlink d'annuaire ne vaut que si la page d'arrivée confirme et enrichit ce que l'annuaire
affirme. Trois chantiers, tous sur `/agent-ia` :

1. **Cohérence entité** : le nom « Les Marches du Vivant » et l'éditeur « La Fréquence du Vivant »
   doivent apparaître littéralement, dans le même ordre, sur Piloterra, dans le `<title>`, la
   meta description et le JSON-LD. C'est ce qui permet aux moteurs et aux LLM de fusionner les
   deux mentions en une seule entité.
2. **JSON-LD `SoftwareApplication` sur `/agent-ia`** (la page n'en a pas aujourd'hui) avec
   `publisher` → Organization « La Fréquence du Vivant », `sameAs` incluant la fiche Piloterra
   une fois publiée : le lien devient bidirectionnel et vérifiable.
3. **Lisibilité GEO** : ajout, en haut de `/agent-ia`, d'un encadré « En bref » de 5 à 7 faits
   courts et citables (qui édite, ce que fait l'agent, formats d'export, licence, zone couverte).
   Les LLM citent des phrases autonomes, pas des paragraphes narratifs.

En complément :
- `public/llms.txt` : entrée dédiée « Agent IA Les Marches du Vivant » avec l'éditeur et le lien.
- `public/sitemap.xml` : vérifier la présence de `/agent-ia` avec `lastmod` à jour.
- Réciprocité : une mention « Référencé sur Piloterra » sur `/marches-du-vivant/partenaires`
  (lien sortant `rel` normal) renforce l'association d'entités des deux côtés.

## 3. Livrable

Un document à copier-coller champ par champ (`/roadmap/agent-ia-piloterra`, ou simplement un
fichier Markdown téléchargeable — à trancher), plus les trois ajustements ci-dessus sur `/agent-ia`.

## Détails techniques

- `src/pages/AgentIA.tsx` : ajout du JSON-LD `SoftwareApplication` + `Organization` via Helmet,
  et du bloc « En bref » (composant local, tokens de design existants, pas de couleur en dur).
- `public/agent-ia-marches-du-vivant.png` : image 1200×630 générée à partir du logo
  « Sentier en fréquence » existant, servie en absolu depuis le domaine.
- `public/llms.txt`, `public/sitemap.xml` : une entrée chacun.
- Aucun changement de route publique existante ; `/agent-ia` reste l'URL canonique.

## Vérification

Rendu de `/agent-ia` en clair et sombre, 375 px et 1280 px ; JSON-LD validé ; image accessible
en URL absolue ; relecture du texte de description (aucune affirmation invérifiable, pas de
chiffre inventé).

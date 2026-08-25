# Entretiens : un pôle éditorial SEO + GEO pour tout l'univers

Analyse et mise en œuvre de la série des 6 entretiens. Le programme éditorial est solide : 6 entités bien séparées, cocons distincts, pas de cannibalisation. Ce qui manque aujourd'hui côté technique : ce site n'a **aucune section éditoriale** (pas de `/entretiens`, pas de blog, rien dans `sitemap.xml` ni `llms.txt`). Sans ce socle, les interviews resteront des pages orphelines.

## 1. Validation du plan éditorial (analyse)

Ce qui fonctionne :
- Une entité = un article = un H1 en question. Format idéal pour les moteurs de réponse (Perplexity, ChatGPT, Gemini) qui citent volontiers des Q/R attribuées à une personne nommée.
- La séparation Gaspard (auteur, origine, géopoétique) / Laurent (dispositif, offres) évite la confusion d'entité, qui est aujourd'hui le vrai risque : les deux noms cohabitent partout sans désambiguïsation.
- Le point de vigilance « mécénat » et la distinction code / données / œuvres sont justes et à conserver mot pour mot.

Trois corrections à apporter :
- **L'article Laurent porte deux offres** (Marches du Vivant + Fréquence Jardin). Sur le plan des intentions de recherche, ce sont deux requêtes disjointes. Recommandation : garder **un seul entretien** (le contenu est déjà écrit et cohérent), mais le publier avec **deux ancres profondes** (`#marches-du-vivant`, `#frequence-jardin`), deux blocs `FAQPage` non fusionnés, et deux liens entrants distincts depuis `/marches-du-vivant` et `/roadmap/frequence-jardin`. Une scission en deux articles est possible en v2 si les volumes le justifient.
- **Incohérence de partenaire tranchée** : le partenaire de Fréquence Jardin cité dans l'entretien Laurent est désormais **Ver de terre production**. Il faut harmoniser ce nom dans le chapô, les liens entrants et tout le balisage.
- **Numéro 4 (Victor) et 5 (bziiit)** : ce sont les deux plus faibles en volume mais les plus utiles en conversion et en maillage d'entités. À publier en dernier.

## 2. Ce qu'on publie ici (la-frequence-du-vivant.com)

Le site devient le **hub canonique** de la série. C'est ici que vivent les 6 textes intégraux.

**Nouvelle section `/entretiens`**
- `/entretiens` : page index, présentation de la série, les 6 cartes (photo, nom, rôle, question d'accroche), JSON-LD `CollectionPage` + `ItemList`.
- `/entretiens/:slug` : page article. Slugs :
  - `gaspard-boreal-naissance-la-frequence-du-vivant`
  - `laurent-tripied-marches-du-vivant-frequence-jardin`
  - `laurence-karki-animer-communaute-vivant`
  - `victor-boixeda-huit-mois-marches-du-vivant`
  - `bziiit-intelligence-artificielle-responsable-biodiversite`
  - `piloterra-open-source-biodiversite`

**Structure de chaque page article**
1. Fil d'Ariane Accueil > Entretiens > titre.
2. H1 = le titre en question, chapô, ligne d'identité (nom, rôle, date, temps de lecture).
3. Sommaire des questions cliquable (chaque question devient un H2 avec ancre) : c'est ce qui fait citer les passages par les LLM.
4. Corps Q/R rendu en Markdown, typographie éditoriale existante.
5. Encart « À retenir » : 4 à 5 puces factuelles reprises du texte, en haut de page. C'est le bloc que les moteurs de réponse extraient.
6. Bloc « Entités citées » : liens internes vers `/marches-du-vivant`, `/roadmap/frequence-jardin`, `/etude-de-sol`, `/agent-ia`, `/marches-du-vivant/association`, et liens sortants `rel="noopener"` vers gaspardboreal.com, bziiit.com, piloterra.fr selon l'entretien.
7. Bloc « Poursuivre » : les 2 entretiens les plus proches (maillage en anneau, jamais tous les 6).
8. CTA contextuel (adhésion, contact, Marches du Vivant).

**Balisage** (le levier GEO principal)
- `SEOHead` par page : title < 60 car., description < 160 car., canonical auto-référencé, og:* propres.
- JSON-LD par article, empilé :
  - `Article` (`headline`, `datePublished`, `dateModified`, `author` = `Person` avec `sameAs`, `publisher` = `Organization` La Fréquence du Vivant, `image`).
  - `Person` complet pour l'interviewé, avec `jobTitle`, `affiliation`, `sameAs` (LinkedIn, site personnel, page PiloTerra). **C'est ce nœud qui règle définitivement la confusion Gaspard / Laurent.**
  - `FAQPage` reprenant les questions et un extrait de réponse, ou `QAPage` selon l'article.
  - `BreadcrumbList`.
- `Organization` enrichi côté site : ajouter `founder` (Gaspard Boréal), `employee`/`member` (Laurent Tripied, Laurence Karki), `sameAs` vers les profils. Aujourd'hui l'`Organization` n'attache aucune personne.

**Distribution technique**
- `public/sitemap.xml` : 7 URL ajoutées (index + 6), avec `lastmod` et `image:image` (portrait de l'interviewé).
- `public/llms.txt` : nouvelle section `## Entretiens (sources primaires)` avec une ligne par entretien décrivant qui parle, de quoi, et quelles entités sont couvertes. C'est ce fichier que lisent les crawlers IA.
- Liens entrants depuis les pages piliers : `/marches-du-vivant` (Laurent, Laurence, Victor), `/marches-du-vivant/association` (les 4 personnes), `/roadmap/frequence-jardin` (Laurent), `/agent-ia` (bziiit, PiloTerra). Sans ces liens, les articles n'ont pas de jus.

**Limite honnête** : ce site est rendu côté client. Google exécute le JS et indexera correctement, mais les aperçus sociaux (LinkedIn, Slack) ne verront que le head statique de `index.html`. Pour des aperçus par article il faudrait du rendu serveur ; à évaluer plus tard, ce n'est pas bloquant pour le SEO ni pour le GEO.

## 3. Ce qu'on publie sur le projet Gaspard Boréal

Rôle : **site d'autorité de la personne**, pas duplicata.

- Une page `/entretiens` (ou `/presse`) listant l'entretien Gaspard avec un **extrait de 300 à 400 mots** et un lien « Lire l'entretien intégral » vers l'URL La Fréquence du Vivant. Jamais le texte complet : deux versions intégrales du même entretien créent une duplication et diluent le signal.
- Une page `/a-propos` (ou équivalent) portant un JSON-LD `Person` **identique mot pour mot** au nœud `Person` publié ici : même `name`, même `description`, même `sameAs`. C'est la condition pour que les deux sites soient fusionnés en une seule entité.
- `sameAs` réciproque : gaspardboreal.com cite la page auteur LFdV, et LFdV cite gaspardboreal.com. Le lien doit être bidirectionnel, sinon il ne compte quasiment pas.
- Cocon propre au site auteur, sans empiéter : *Fréquences de la rivière Dordogne*, *La Confession muette*, *La Comédie des Mondes Hybrides*, géopoétique, haïku, kigo. Le vocabulaire dispositif (ambassadeurs, GBIF, sciences participatives) reste sur LFdV.

## 4. Ce qu'on publie sur le projet PiloTerra

Rôle : **plateforme et preuve d'ouverture**.

- Publier l'entretien PiloTerra **là-bas en intégral** (c'est son sujet), et ici une **synthèse + lien canonique croisé** : chaque version pointe l'autre en `sameAs`, une seule des deux porte le `canonical` (recommandation : PiloTerra, puisque c'est son entretien).
- Ajouter côté PiloTerra un JSON-LD `SoftwareApplication` **statique** par fiche agent. Constat déjà fait lors du référencement de l'agent IA : les fiches PiloTerra sont rendues en JavaScript depuis Supabase, donc invisibles pour les crawlers classiques. Tant que ce n'est pas corrigé, la fiche « Les Marches du Vivant » n'apporte qu'une citation d'entité, pas de jus de lien. C'est le point à plus fort effet de levier du dispositif.
- Réciprocité : la fiche PiloTerra lie vers `/agent-ia` et vers l'entretien ici ; ici, `sameAs` cite déjà PiloTerra (déjà en place dans `llms.txt` et `AgentIA.tsx`).
- Cocon PiloTerra : open data, IA frugale agricole, Lexicone / Westfarm, briques réutilisables. Pas de vocabulaire poétique.

## 5. Autres leviers pour méga-booster

Classés par rapport effet / effort.

1. **Page « Qui est qui »** sur `/marches-du-vivant/association` : un bloc par personne avec photo, rôle, une phrase, et `Person` JSON-LD. Résout la confusion d'entité pour tous les moteurs en une seule page.
2. **Version Markdown de chaque entretien** (`/entretiens/:slug.md`), déjà le pattern du projet pour l'étude de sol et la fiche Fréquence Jardin. Les crawlers IA adorent le Markdown propre, et c'est du copier-coller direct dans un modèle.
3. **Version audio ou vidéo** si les interviews sont enregistrées : ajouter `VideoObject` / `AudioObject` + transcription. Un entretien avec média balisé est nettement mieux repris.
4. **Glossaire `/glossaire`** : kigo, bioacoustique, ICG, zone blanche, gradient de biodiversité, ambassadeur, sentinelle. Chaque entrée capte de la longue traîne et devient la cible des liens internes depuis les entretiens.
5. **Une page pilier `Fréquence Jardin` orientée offre**, distincte de la fiche technique actuelle `/roadmap/frequence-jardin` (qui est une fiche produit pour annuaires IA, pas une page de conversion).
6. **Rythme de publication** : un entretien toutes les deux semaines plutôt que six d'un coup. Six pages publiées le même jour envoient un signal de contenu de masse ; échelonner produit une fraîcheur récurrente.
7. **Un mois après publication** : lancer une revue SEO du site et vérifier dans Search Console quelles questions remontent réellement, puis enrichir les articles concernés.

## 6. Détails techniques

- `src/content/entretiens/` : un fichier par entretien (`gaspardBoreal.ts`, etc.) exportant `{ slug, title, h1, chapo, person, questions[], keywords, entities[], related[], publishedAt }`. Source unique pour la page, le Markdown et le JSON-LD.
- `src/content/entretiens/index.ts` : registre typé, alimente l'index et le sitemap.
- `src/pages/EntretiensIndex.tsx` et `src/pages/EntretienDetail.tsx`, rendu Markdown via `PartnerAuditContent` (déjà en place, GFM + typographie soignée).
- `src/components/entretiens/` : `EntretienHero`, `EntretienToc`, `EntretienKeyPoints`, `EntretienEntities`, `EntretienRelated`.
- `src/App.tsx` : `/entretiens` et `/entretiens/:slug` déclarées **avant** toute route générique.
- `src/components/SEOHead.tsx` : ajout d'une prop `jsonLd` optionnelle pour empiler les schémas par page sans dupliquer le composant.
- `public/sitemap.xml`, `public/llms.txt` mis à jour.
- Portraits : `lovable-assets` si des photos sont fournies, sinon un visuel typographique par entretien.
- Aucune couleur en dur, thèmes clair et sombre respectés, mobile first.

## 7. Ce qu'il me faut de vous

- Les 3 entretiens restants (Laurence, Victor, bziiit) quand ils seront prêts. Je pose la structure et publie les 3 entretiens déjà disponibles dès l'approbation du plan.
- Portraits photo des 4 personnes et URL des profils (LinkedIn, sites personnels, PiloTerra) pour les `sameAs`.
- Une décision sur la fréquence de publication : une page tous les 15 jours est recommandée pour éviter le signal "contenu de masse".

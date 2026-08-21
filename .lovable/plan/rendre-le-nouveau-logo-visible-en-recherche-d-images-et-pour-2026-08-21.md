# Rendre le nouveau logo visible en recherche d'images et pour les IA

## Diagnostic (vérifié)

Le nouveau lock-up (horizontal blanc et vertical) n'est aujourd'hui affiché que sur `/saunier`, page qui porte `noindex, nofollow` : aucun moteur ne verra jamais ce fichier. Par ailleurs :

- `src/content/brandLogo.ts` connaît bien les trois nouveaux fichiers, mais `BRAND_LOGO_VARIANTS` (les déclinaisons publiées, décrites en JSON-LD sur la page logo) n'en contient aucun.
- `public/sitemap.xml` ne référence que l'ancien fichier `logo-empreinte-vivante.png`.
- `index.html` déclare `Organization.logo` = `favicon.png` — signal de marque faible pour Google Images et pour les IA génératives qui lisent le JSON-LD.
- L'ancien lock-up historique reste la variante canonique.

Autrement dit : le nouveau logo est en ligne mais invisible pour l'indexation.

## Le fichier retenu — confirmation

Le logo qui sera indexé est le **lock-up vertical** (empreinte au-dessus du nom en toutes lettres), asset `ac3bea79-9e96-4d1f-9987-376d70361096` :

```text
https://la-frequence-du-vivant.com/__l5e/assets-v1/ac3bea79-9e96-4d1f-9987-376d70361096/logo-lockup-vertical.png
```

Deux précisions qui conditionnent le résultat :

- **L'URL indexée est celle du domaine public**, pas celle en `…lovableproject.com` (celle-là ne doit jamais apparaître dans le JSON-LD ni le sitemap : elle créerait un doublon d'image sur un domaine de préview).
- Le fichier est **transparent avec le nom en blanc** : sur le fond blanc des résultats Google Images, le nom disparaît. On produit donc, à partir du même dessin et sans le modifier, une **variante d'indexation à fond vert profond aplati** (carré 1200 × 1200, marges régulières) : c'est elle qui est déclarée comme logo canonique dans le JSON-LD et le sitemap. La version transparente reste servie dans l'application et téléchargeable sur la page logo.

## Ce qu'on fait — par ordre d'efficacité

### 1. Publier le logo sur une page indexable (impact n°1)
La page publique `/roadmap/frequence-jardin/logo/empreinte-vivante` est déjà indexée, canonique et déclarée au sitemap. Le lock-up vertical y est affiché en grand et en premier, avec légende visible, usage recommandé et téléchargement — accompagné des déclinaisons (marque seule, lock-up horizontal). C'est le texte autour de l'image qui fait ranker une image.

### 2. Faire du lock-up vertical la variante canonique de la marque
Dans `brandLogo.ts`, `BRAND_LOGO_CANONICAL` et `BRAND_LOGO_VARIANTS` passent au lock-up vertical (variante d'indexation pour les nœuds structurés, variante transparente pour l'affichage). Conséquence automatique : le nœud `ImageObject` `#logo`, le `logo` de l'`Organization` et toutes les pages qui consomment ces constantes décrivent ce fichier. Les anciennes constantes restent exportées (aucune URL publiée ne casse).

### 3. Rattacher le logo à l'entité de marque
- `index.html` : `Organization.logo` passe de `favicon.png` à l'URL absolue du lock-up vertical (avec `width`/`height`), et gagne un `image`. C'est ce que lisent Google Knowledge Graph, Bing et les IA génératives.
- `/agent-ia` : le nœud `ImageObject` du logo et `Organization.logo` pointent la même URL — une seule entité image pour toute la marque.


### 4. Sitemap images
Ajouter les entrées `image:image` des trois nouveaux fichiers sur les pages qui les affichent (`/roadmap/frequence-jardin/logo/empreinte-vivante`, `/agent-ia`, `/marches-du-vivant`, `/`), avec `image:title`, `image:caption` et `image:license` cohérents, puis rafraîchir les `lastmod` concernés. La licence déclarée active le badge « Licensable » dans Google Images.

### 5. Métadonnées embarquées dans les PNG (IPTC/XMP)
Google lit `Creator`, `Copyright Notice`, `Credit Line`, `Web Statement of Rights` directement dans le binaire. On réencode les trois fichiers avec ces champs (et une description), puis on réuploade et on met à jour les pointeurs d'asset. Au passage, compression PNG : le lock-up fait ~1 Mo pour un affichage à quelques centaines de pixels — poids et Core Web Vitals comptent dans l'indexation image.

### 6. Cohérence des `alt` partout
Même couple image + libellé sur toutes les occurrences (`/agent-ia`, page logo, `/saunier`, footers) : « Logo Les Marches du Vivant — … ». La répétition cohérente est ce qui fait émerger un logo dans les résultats image.

### 7. Lisibilité par les IA génératives
- `public/llms.txt` : une ligne « Logo officiel » avec l'URL absolue du fichier, la licence et une description en une phrase.
- La page logo reçoit un court paragraphe factuel (nom, éditeur, signification du dessin, conditions d'usage) — c'est ce bloc que les IA citeront.

### 8. Accélérer le premier passage
Après mise en ligne : demander l'indexation des URL touchées dans Search Console et soumettre le sitemap à Bing Webmaster Tools. Délai réaliste d'apparition en recherche d'images : 2 à 6 semaines.

## Détails techniques

- Fichiers touchés : `src/content/brandLogo.ts`, `src/pages/FrequenceJardinLogo.tsx`, `src/pages/AgentIA.tsx`, `index.html`, `public/sitemap.xml`, `public/llms.txt`, pointeurs `.asset.json` des trois nouveaux logos.
- Réencodage IPTC/XMP via `exiftool` dans le sandbox, réupload via le CLI d'assets.
- Aucun changement de logique métier, aucune migration, aucune couleur en dur.
- `/saunier` reste `noindex` — c'est une page de négociation, ce n'est pas elle qui doit porter le référencement du logo.

## Vérification

JSON-LD parsé sans erreur (validateur schema.org), sitemap XML valide, rendu de la page logo en clair et sombre, `alt` présents, poids des fichiers contrôlé.

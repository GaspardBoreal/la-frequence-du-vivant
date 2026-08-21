# Rendre le nouveau logo visible en recherche d'images et pour les IA

## Diagnostic (vérifié)

Le nouveau lock-up (horizontal blanc et vertical) n'est aujourd'hui affiché que sur `/saunier`, page qui porte `noindex, nofollow` : aucun moteur ne verra jamais ce fichier. Par ailleurs :

- `src/content/brandLogo.ts` connaît bien les trois nouveaux fichiers, mais `BRAND_LOGO_VARIANTS` (les déclinaisons publiées, décrites en JSON-LD sur la page logo) n'en contient aucun.
- `public/sitemap.xml` ne référence que l'ancien fichier `logo-empreinte-vivante.png`.
- `index.html` déclare `Organization.logo` = `favicon.png` — signal de marque faible pour Google Images et pour les IA génératives qui lisent le JSON-LD.
- L'ancien lock-up historique reste la variante canonique.

Autrement dit : le nouveau logo est en ligne mais invisible pour l'indexation.

## Ce qu'on fait — par ordre d'efficacité

### 1. Publier le nouveau logo sur une page indexable (impact n°1)
La page publique `/roadmap/frequence-jardin/logo/empreinte-vivante` est déjà indexée, canonique et déclarée au sitemap. On y ajoute les trois nouvelles déclinaisons (marque seule, lock-up horizontal blanc, lock-up vertical) : image affichée en grand, légende visible sous chaque image, usage recommandé, bouton de téléchargement. C'est le texte autour de l'image qui fait ranker une image.

### 2. Faire du nouveau lock-up la variante canonique de la marque
Dans `brandLogo.ts`, `BRAND_LOGO_CANONICAL` et `BRAND_LOGO_VARIANTS` passent aux nouveaux fichiers. Conséquence automatique : le nœud `ImageObject` `#logo`, le `sameAs`/`logo` de l'`Organization` et toutes les pages qui consomment ces constantes décrivent le bon fichier. Les anciennes constantes restent exportées (aucune URL publiée ne casse).

### 3. Rattacher le logo à l'entité de marque
- `index.html` : `Organization.logo` passe de `favicon.png` à l'URL absolue du nouveau lock-up (avec `width`/`height`), et gagne un `image`. C'est ce que lisent Google Knowledge Graph, Bing et les IA génératives.
- `/agent-ia` : le nœud `ImageObject` du logo pointe la nouvelle variante, `Organization.logo` idem.

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

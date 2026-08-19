# Rendre lisible le titre « LES MARCHES DU VIVANT » du logo

## Ce que montre le diagnostic

Le fichier `logo-empreinte-vivante.png` (1024 × 1024, fond entièrement transparent) porte le wordmark
« LES MARCHES DU VIVANT » gravé **dans l'image**, en serif très fin, fortement espacé, dans un vert
foncé proche de `#2f4a33`.

Trois causes de faible lisibilité, cumulées :

1. **Fond transparent + encre foncée** : sur le hero vert profond de `/agent-ia`, le texte foncé se
   confond avec le fond. Il n'a de contraste que sur fond clair.
2. **Graisse trop fine** : les fûts du serif font 2–3 px à 1024 px. En dessous de ~400 px d'affichage,
   ils disparaissent au rééchantillonnage.
3. **Tracking excessif** : l'interlettrage très large casse la lecture du bloc en petite taille.

Conséquence pratique : le logo n'est réellement lisible qu'imprimé grand sur fond blanc, alors qu'il
est utilisé en 32 px dans la nav, 176 px dans le hero, 48 px dans le footer, et comme image de fiche
annuaire (PiloTerra).

## Ce que je propose

### 1. Un système à trois fichiers plutôt qu'un fichier unique

| Variante | Usage | Traitement |
| --- | --- | --- |
| **Marque seule** (empreinte, sans texte) | Nav 32 px, footer 48 px, favicon, avatar | Aucun texte, donc rien à rendre illisible |
| **Lock-up fond clair** | Documents, PDF, impressions, fiches annuaire sur fond blanc | Wordmark réencré en vert profond, graisse renforcée, tracking resserré |
| **Lock-up fond sombre** | Hero `/agent-ia`, og:image, tout écran sombre | Wordmark en crème `#F5F2E8`, empreinte en vert clair |

Le fichier actuel reste en ligne et n'est pas supprimé : son URL est déjà publiée, et supprimer un
asset casse les usages externes déjà référencés. Les nouvelles variantes s'ajoutent à côté.

### 2. Reprendre le wordmark lui-même

Sur les deux lock-ups : graisse passée d'un serif « hairline » à un serif medium, interlettrage réduit
d'environ un tiers, et taille du texte augmentée par rapport à l'empreinte pour qu'il tienne à
partir de 200 px de large. Le filet décoratif sous le texte est conservé mais épaissi.

### 3. Dans l'application : titre en HTML, pas dans l'image

Partout où le logo apparaît à l'écran avec son nom, afficher la **marque seule** et composer
« Les Marches du Vivant » en texte HTML juste en dessous. Le texte reste net à toute taille, suit le
thème clair/sombre, est sélectionnable, traduisible et lu par les moteurs. Le lock-up en image reste
réservé aux exports et aux fiches externes, où le HTML n'existe pas.

## Détail technique

- Génération des trois variantes en PNG transparent 1024 × 1024, upload via `lovable-assets`,
  pointeurs `.asset.json` dans `src/assets/brand/marches-du-vivant/`.
- `src/content/brandLogo.ts` : passer d'une constante unique à un petit registre
  (`BRAND_LOGO_MARK`, `BRAND_LOGO_LIGHT`, `BRAND_LOGO_DARK`) avec, pour chacun, chemin, URL absolue,
  dimensions et alt dédié. `BRAND_LOGO_URL` conservé en alias du lock-up clair pour ne casser aucun
  appelant existant.
- `brandLogoImageObject()` étendu pour accepter la variante à décrire ; le `@id` `#logo` reste porté
  par un seul fichier canonique (le lock-up clair) afin de ne pas dupliquer l'entité dans le JSON-LD.
- `src/pages/AgentIA.tsx` : hero et footer passent à la marque seule + titre HTML ; la nav conserve
  la marque seule. `og:image` / `image_src` pointent vers le lock-up sombre.
- `src/pages/FrequenceJardinLogo.tsx` : afficher les trois variantes avec leur usage et un bouton de
  téléchargement par variante.
- `public/sitemap.xml` : ajouter les entrées `image:image` des nouvelles variantes.

## Périmètre exclu

Aucun changement de dessin de l'empreinte, de palette de marque, ni de contenu textuel des pages.
Aucune suppression de l'asset actuellement publié.

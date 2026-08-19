# Métadonnées du logo pour Google Images / Bing Images

Objectif : que le logo « Empreinte vivante » remonte dans les résultats de recherche image sur les requêtes « logo Les Marches du Vivant », « Les Marches du Vivant », « La Fréquence du Vivant ».

Ce qui existe déjà (vérifié) : le logo est déclaré dans `sitemap.xml` sur la page `/roadmap/frequence-jardin/logo/empreinte-vivante` avec titre et légende, et la page `/agent-ia` a une entrée image (l'image sociale, pas le logo). Le logo n'a pour l'instant ni balisage `ImageObject`, ni licence déclarée, ni entrée sitemap sur `/agent-ia`.

## Ce que je propose d'ajouter

1. **Texte alternatif et contexte éditorial (le signal n°1 pour Google Images)**
   - `alt` descriptif et unique sur chaque occurrence du logo : « Logo Les Marches du Vivant — Empreinte vivante, agent IA de mesure de la biodiversité ».
   - `title` sur l'image du hero, légende visible courte sous le logo de la page logo dédiée : Google lit le texte qui entoure l'image.
   - Le nom de fichier `logo-empreinte-vivante.png` est déjà bon (mots-clés lisibles).

2. **Balisage structuré `ImageObject` (JSON-LD)**
   - Sur `/agent-ia` et sur la page logo dédiée, ajouter un nœud `ImageObject` : `contentUrl`, `name`, `caption`, `description`, `width`, `height`, `representativeOfPage`, `creditText`, `creator` (association La Fréquence du Vivant), `copyrightNotice`, `license` et `acquireLicensePage`.
   - Rattacher ce nœud à l'`Organization` déjà présente via `logo` et `image`, pour que Google associe formellement l'image à la marque.
   - Les champs licence activent le badge « Licensable » dans Google Images — un différenciateur visuel fort.

3. **Sitemap images enrichi**
   - Ajouter l'entrée `image:image` du logo sur `/agent-ia` (aujourd'hui absente) et sur les autres pages qui l'affichent (`/marches-du-vivant`, `/`), avec titre et légende adaptés à chaque page.
   - Mettre à jour les `lastmod` des URL touchées.

4. **Métadonnées embarquées dans le fichier PNG (IPTC / XMP)**
   - Google lit les champs IPTC `Creator`, `Copyright Notice`, `Credit Line`, `Web Statement of Rights` directement dans le binaire.
   - Le logo actuel est réencodé et réuploadé via le CDN avec ces champs renseignés, l'ancien pointeur d'asset restant intact si nécessaire.
   - Bonus : le fichier fait 842 Ko pour un usage d'affichage à 176 px — une version optimisée (PNG compressé + variante WebP) améliore l'indexation et le Core Web Vitals.

5. **Conditions techniques d'indexation**
   - Vérifier que `robots.txt` n'exclut pas `/__l5e/` (chemin CDN des assets) — sinon Google ne peut pas explorer le logo.
   - Ne pas mettre le logo du hero en `lazy` (déjà en `eager`), garder `width`/`height` explicites.
   - Ajouter `og:image` alternatif ? Non : l'image sociale actuelle reste plus adaptée au partage.

6. **Cohérence de marque**
   - Même `alt`, même légende, même `ImageObject` sur toutes les pages qui affichent le logo : la répétition cohérente d'un couple image + libellé est ce qui fait émerger un logo dans les résultats image.

## Détails techniques

- Fichiers touchés : `src/pages/AgentIA.tsx` (JSON-LD `ImageObject` + `alt`/`title`), `src/pages/FrequenceJardinLogo.tsx` (JSON-LD + légende visible), `public/sitemap.xml`, éventuellement `public/robots.txt`.
- Un helper partagé `src/content/brandLogo.ts` exposera l'URL, les dimensions, l'`alt` canonique, la légende et le nœud `ImageObject`, pour éviter toute divergence entre pages.
- Réencodage IPTC/XMP via `exiftool` dans le sandbox, puis réupload par le CLI d'assets et mise à jour du pointeur `.asset.json`.
- Aucune modification de logique métier ni de base de données.

## Délai d'effet

L'indexation image est lente : compter 2 à 6 semaines après exploration. Une demande d'indexation manuelle des URL concernées dans Search Console accélère le premier passage.

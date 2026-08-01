## Constat

Le composant de tableau enrichi existe déjà et fonctionne : `src/components/chatbot/ChatTableBlock.tsx` (rendu éditorial + boutons Markdown / Tableur / CSV / téléchargement), branché dans `src/components/chatbot/ChatMessage.tsx` via `components={{ table: ... }}` et `remark-gfm`.

Sur la copie d'écran, tout le reste du markdown est bien rendu (gras, titres, listes) — seul le tableau retombe en texte brut avec des `|` qui coulent dans un paragraphe. C'est la signature d'un tableau GFM non parsable : ligne de séparation `|---|---|` absente, ou lignes du tableau non séparées par des retours à la ligne. Le prompt de `supabase/functions/propriete-chat/index.ts` décrit bien le tableau attendu mais n'impose pas explicitement la ligne de séparation ni une ligne par enregistrement.

## Correctif proposé

### 1. Normalisation markdown côté client (le vrai filet de sécurité)

Nouveau module `src/lib/chatMarkdownRepair.ts` :
- Détecte les segments contenant des `|` et reconstruit un tableau GFM valide :
  - re-découpe un tableau écrit sur une seule ligne en s'appuyant sur le motif `| … |` et le nombre de colonnes de l'en-tête ;
  - insère la ligne de séparation `| --- | --- |` si elle manque ;
  - complète / tronque les cellules manquantes pour que chaque ligne ait le bon nombre de colonnes.
- Sûr par construction : si le texte est déjà un tableau GFM valide, il est renvoyé tel quel. Aucun autre contenu n'est touché.
- Tolérant au streaming : une dernière ligne incomplète est laissée telle quelle tant que la réponse n'est pas terminée.

### 2. Branchement dans le chat

Dans `ChatMessage.tsx`, passer `content` par ce normaliseur (mémoïsé) avant `ReactMarkdown`. Le mapping `table → ChatTableBlock` existant reprend alors la main : le tableau s'affiche en bloc éditorial avec les actions d'export déjà en place — aucun nouveau composant d'export à créer.

### 3. Affinage du prompt (pour que le cas soit rare)

Dans `supabase/functions/propriete-chat/index.ts`, préciser dans la section « SYNTHÈSE EXPORTABLE » :
- la ligne d'en-tête DOIT être suivie de la ligne de séparation `| --- | --- | --- | --- | --- | --- | --- |` ;
- une ligne de tableau par espèce, chacune sur sa propre ligne, ligne vide avant le tableau.

### 4. Petite touche de finition

Ajouter au bandeau de `ChatTableBlock` un titre repris du contexte (« Synthèse à exporter ») et le compteur de lignes, pour que le bloc soit immédiatement identifiable dans le fil.

## Vérification

Contrôle visuel dans l'aperçu : poser une question palette à l'IA de Jardin et vérifier que la synthèse s'affiche en tableau avec les boutons d'export, plus un test unitaire rapide du normaliseur sur trois formes dégradées (une ligne, séparateur absent, tableau déjà valide).

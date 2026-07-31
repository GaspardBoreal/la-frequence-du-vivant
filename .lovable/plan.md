# IA de Jardin — nommage botanique normalisé & synthèse exportable

## Constats vérifiés

1. **Noms d'espèces** — les contextes envoyés à l'IA (`useProprieteChatProviders.ts`, lignes 97-247) ne transportent que `n` (nom scientifique) et `c` (nom commun brut de l'observation, souvent absent ou en anglais). Le résolveur central `useFrenchSpeciesNamesAuto` (règle Core du projet) n'est pas branché sur le chat. Résultat : l'IA écrit « *Aloysia citrodora* », « *Hyssopus officinalis* » sans nom français.
2. **Tableau de synthèse illisible** — `ChatMessage.tsx` (ligne 63) utilise `<ReactMarkdown>` **sans `remark-gfm`**. Les tableaux markdown ne sont donc pas rendus : ils s'affichent en pipes bruts (visible sur la copie d'écran). Aucune action de copie/export au niveau d'un tableau, seulement « copier le message » entier.

## 1. Nommage : « Nom français (*Nom scientifique*) » partout

**Côté données** (`src/hooks/propriete/useProprieteChatProviders.ts`)
- Brancher `useFrenchSpeciesNamesAuto` sur la liste d'espèces du pool (pool complet, dédupliqué par nom scientifique) et l'utiliser pour remplir le champ `c` de toutes les lignes (dedans / lisière / voisinage / vivant.resume / vivant.especes).
- Champ `c` = nom vernaculaire français résolu ; `null` seulement si vraiment introuvable (l'IA saura alors n'afficher que le scientifique).
- Coût token maîtrisé : on remplace une valeur existante, on n'ajoute pas de champ.

**Côté prompt** (`supabase/functions/propriete-chat/index.ts`, bloc RÈGLES STRICTES)
- Nouvelle règle impérative de notation : toute mention d'espèce s'écrit `Nom français (*Nom scientifique*)` à la première occurrence, puis nom français seul ; si `c` est vide, écrire `*Nom scientifique*` seul et ne jamais inventer de nom français.
- Rappel explicite : le nom scientifique est toujours en italique, jamais en gras seul.

## 2. Synthèse professionnelle et copiable

**Rendu markdown** (`src/components/chatbot/ChatMessage.tsx`)
- Ajouter `remark-gfm` à `ReactMarkdown` (tableaux, listes à cocher, barré).
- Style éditorial des tableaux via composants personnalisés : en-tête en petites capitales or/émeraude sur `--ds-forest-deep`, lignes zébrées, bordures fines, `scrollbar` horizontale douce, cellules `whitespace-nowrap` sur les colonnes courtes — dans les tokens sémantiques existants (aucune couleur en dur).

**Barre d'action de tableau** (nouveau `src/components/chatbot/ChatTableBlock.tsx`)
Chaque tableau rendu est encapsulé dans un bloc avec, au survol, une barre discrète :
- **Copier Markdown** — le tableau tel quel (recollable dans un module markdown).
- **Copier pour tableur** — conversion en TSV (collage direct Excel / Google Sheets / Numbers).
- **Copier CSV** — séparateur `;`, guillemets échappés, BOM UTF-8 (Excel FR).
- **Télécharger .csv** — nom de fichier `palette-<ouvrage>-<date>.csv`.
Feedback « Copié ✓ » 1,5 s, identique à l'ergonomie du bouton de copie de message existant.

**Cadrage du format de synthèse** (prompt)
- Imposer une dernière section standardisée `## Synthèse à exporter` contenant **un seul tableau markdown** aux colonnes fixes :
  `Espèce | Nom scientifique | Strate | Hauteur | Exposition | Fonctions écologiques | Justification (sol / contexte)`.
- Une ligne par espèce, pas de cellule vide (« — » sinon), pas de retour à la ligne dans une cellule → garantit un collage propre dans un tableur.

## Détails techniques

- Dépendance : `remark-gfm` (à installer, ~10 ko), compatible `react-markdown@10`.
- `ChatMessage` passe `components={{ table, thead, th, td, tr }}` ; le wrapper `ChatTableBlock` reconstruit le TSV/CSV depuis les enfants React du tableau (pas de re-parsing du markdown brut) — robuste vis-à-vis du streaming partiel.
- Le rendu enrichi s'applique à tous les chatbots factorisés (Mon Espace, Admin, Jardin) puisque `ChatMessage` est partagé ; les styles restent neutres et pilotés par les tokens du thème.
- Aucun changement de schéma base de données ni de RLS.

## Fichiers touchés

- `src/hooks/propriete/useProprieteChatProviders.ts` — résolution FR des noms d'espèces.
- `supabase/functions/propriete-chat/index.ts` — règle de notation + format de synthèse imposé.
- `src/components/chatbot/ChatMessage.tsx` — `remark-gfm` + composants de tableau.
- `src/components/chatbot/ChatTableBlock.tsx` — nouveau, actions de copie/export.
- `package.json` — `remark-gfm`.

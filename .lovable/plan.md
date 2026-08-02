## Intention

Rendre visible et emportable ce que l'IA reçoit. Chaque contexte devient un objet manipulable : on peut le lire, le copier, le télécharger. La sélection complète devient un **Bordereau du vivant** — un document de transparence signé (date, propriété, poids, tokens estimés), à l'image d'un bordereau de livraison : « voici exactement ce qui a été transmis ».

## Ce qu'on ajoute

### 1. Actions par contexte (dans chaque carte de la console)
Au survol / à l'ouverture d'une carte, une petite rangée d'actions discrètes apparaît :
- **Œil** — ouvre l'aperçu du contenu réel (voir §3)
- **Copier** — copie le contexte dans le presse-papier (format choisi globalement)
- **Télécharger** — un fichier par contexte (`resume-du-vivant.md` / `.json` / `.csv`)

Le clic sur la carte garde son rôle actuel (activer/désactiver) ; les actions sont sur des boutons dédiés pour éviter toute ambiguïté.

### 2. Actions sur la sélection complète (bandeau « Transmis »)
À côté du compteur `3/7 actifs` : **Copier le bordereau** et **Exporter**, plus un bouton **Aperçu** qui ouvre le bordereau complet.

Le bordereau assemble, dans l'ordre des groupes (Vivant / Sol / Ouvrages / Site / Flore) :
- un en-tête : nom de la propriété, date/heure, nombre de contextes, poids total, tokens estimés, verdict d'éco-score
- une table des matières avec le poids de chaque bloc
- chaque contexte, titré, avec son contenu

### 3. Le « Bordereau du vivant » (nouvelle vue plein panneau)
Overlay sobre au-dessus de la console, esthétique papier-atelier sur fond sombre :
- filet doré en marge, en-tête à sceau (réutilise le vocabulaire visuel des « carnets scellés » du diagnostic)
- barre de format : **Lisible (Markdown)** · **Données (JSON)** · **Tableur (CSV)** · **Brut (texte IA)** — « Brut » montre exactement la chaîne envoyée au modèle, sans reformulation : c'est l'engagement de transparence
- pagination par contexte, contenu en police mono avec numéros de ligne
- pied de page : **Copier**, **Télécharger**, **Imprimer / PDF**
- micro-animation : les contextes actifs « tombent » dans le bordereau à l'ouverture (stagger léger)

### 4. Jauge de frugalité contextualisée
Dans le bordereau, chaque bloc affiche sa part du total sous forme de fine barre proportionnelle — on voit d'un coup d'œil qui pèse (ex. « Liste complète des espèces : 17 Ko = 94 % du contexte »). Cela transforme l'export en outil pédagogique de frugalité.

## Détails techniques

- Nouveau `src/lib/contextExport.ts` : `serializeProvider(p, format)` et `buildBordereau(providers, meta, format)` → `{ filename, mime, content }`. Sérialisation robuste des `payload: unknown` (objet → JSON indenté ; tableau d'objets homogènes → tableau Markdown / CSV ; chaîne → verbatim).
- Nouveau composant `src/components/chatbot/ContextBordereau.tsx` (overlay + formats + actions), monté depuis `ContextConsole.tsx`.
- `ContextConsole.tsx` : ajout des boutons par carte et des actions de sélection ; aucune modification de la logique d'activation (`chatPageContext.setVisibleSlice`) ni des providers.
- Copie via `navigator.clipboard.writeText` avec repli `document.execCommand`, retour visuel « Copié » sur le bouton ; téléchargement par `Blob` + `URL.createObjectURL`.
- Impression PDF via une feuille `@media print` dédiée au bordereau (même approche que les impressions existantes du diagnostic).
- Générique : la console étant partagée, la fonctionnalité profite aussi aux autres chatbots (Mon Espace, Admin), sans code spécifique.

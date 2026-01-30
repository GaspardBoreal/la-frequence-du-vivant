
Objectif
- Rendre réellement cliquables (et utiles) les éléments affichés comme “liens” dans :
  1) la page “Sommaire” (Table des matières)
  2) les pages “Lieux” et “Genres” (Index)
  3) le sous-menu de l’“Index Vivant” (mots-clés/occurrences) dans “Traversées”

Diagnostic (pourquoi ce n’est pas cliquable aujourd’hui)
- Sommaire (TocRenderer)
  - Seul l’en-tête de “Partie” a un onClick (et encore : il utilise un calcul fragile `groupIdx + 2`).
  - Les lignes “marches” sont rendues en <div>/<span> sans handler => visuellement “liste”, mais pas un lien.
- Index (IndexRenderer)
  - Les entrées sont rendues en <div>/<span> sans onClick => jamais cliquables.
  - Les extracteurs d’index (src/registries/indexTypes.ts) calculent des `texteIds`… mais les jettent à la fin (ils ne les renvoient pas). Donc même si on ajoutait un onClick, on ne saurait pas “où aller”.
- Index Vivant (LivingIndex)
  - Les lignes de mots-clés dans la vue détail (`motion.div`) n’ont pas de onClick.
  - De plus, LivingIndex/TraverseesHub ne reçoivent aucune “fonction de navigation du livre”, donc même si on clique, il n’y a rien à déclencher vers le lecteur.
  - Important : LivingIndex est aussi utilisé ailleurs (page lecteurs + aperçu admin), donc la solution doit rester compatible (props optionnelles).

Approche retenue (efficace + robuste)
- Standardiser une navigation “par id de page” utilisable partout, plutôt que des index numériques fragiles :
  - Les pages du livre ont déjà des ids stables : `cover`, `toc`, `index-lieu`, `index-genre`, `partie-<id>`, `texte-<id>`.
  - Le hook `useBookNavigation` expose déjà `goToPageById(pageId)` (retourne boolean).
- Injecter cette capacité de navigation dans les renderers (Sommaire/Index) et dans Traversées (Index Vivant) via des props optionnelles, pour ne rien casser ailleurs.

Modifications prévues (fichiers)
1) Ajouter une API de navigation par id pour les renderers du Livre Vivant
- Fichier : src/registries/types.ts
  - Étendre `PageRendererProps` avec :
    - `onNavigateToPageId?: (pageId: string) => boolean;`
  - (Optionnel) garder `onNavigate?: (pageIndex: number) => void` tel quel pour compatibilité.

- Fichier : src/components/admin/livre-vivant/LivreVivantViewer.tsx
  - Dans `commonProps`, ajouter :
    - `onNavigateToPageId: goToPageById`
  - Ainsi, TocRenderer et IndexRenderer pourront faire : `onNavigateToPageId?.("texte-...")`.

2) Rendre le Sommaire réellement navigable
- Fichier : src/components/admin/livre-vivant/renderers/TocRenderer.tsx
  - Remplacer le calcul fragile `onNavigate?.(groupIdx + 2)` par :
    - `onNavigateToPageId?.(partieId)` avec `partieId = 'partie-' + group.partie.id`
    - Si la page partie n’existe pas (ex: option includePartiePages=false), fallback :
      - naviguer vers le premier texte du groupe (premier texte de la première marche).
  - Rendre chaque ligne “marche” cliquable :
    - transformer le bloc marche en `<button type="button">` (full width, text-left)
    - au click : aller au premier texte de cette marche (`texte-${marcheData.textes[0].id}`)
  - Ajouter feedback UX :
    - `cursor-pointer`, hover/active styles (ex: fond léger `secondary+10`, underline, etc.)
    - Accessibilité : `aria-label` “Aller à …”

3) Rendre “Lieux” et “Genres” cliquables (avec choix du texte)
- Fichier : src/registries/indexTypes.ts
  - Modifier `extractIndexByLieu` et `extractIndexByGenre` pour renvoyer aussi les `texteIds` par entrée.
  - Ex : chaque `IndexEntry` inclura :
    - `label`, `count`, `texteIds: string[]`
- Fichier : src/registries/types.ts
  - Étendre `IndexEntry` avec :
    - `texteIds?: string[]`
  - (Optionnel) laisser `pageRef` inchangé (on ne s’en sert pas ici).

- Fichier : src/components/admin/livre-vivant/renderers/IndexRenderer.tsx
  - Rendre chaque entrée “Lieu/Genre” cliquable sous forme de bouton :
    - Au clic : déplier/plier un sous-menu listant les textes correspondants (à partir de `texteIds`)
  - Pour chaque texte listé :
    - bouton “titre du texte” (+ petit contexte marche/ville si dispo)
    - `onClick => onNavigateToPageId?.('texte-' + texteId)`
  - UX mobile :
    - liste en 1 colonne, items larges (tappable)
    - éventuellement icône “chevron” + `aria-expanded`

4) Rendre le sous-menu de l’Index Vivant cliquable (mots-clés => textes)
- Objectif UX : depuis Traversées > Index Vivant > (monde) > (mot-clé), on doit pouvoir ouvrir la liste des textes, puis cliquer un texte et “sauter” dans le livre.
- Contraintes : LivingIndex utilisé aussi hors lecteur => navigation doit être optionnelle.

- Fichier : src/registries/types.ts
  - Étendre `TraverseeProps` avec (optionnel) :
    - `onNavigateToTexteId?: (texteId: string) => void;`
  - (Ne rien rendre obligatoire, pour ne pas casser les usages existants.)

- Fichier : src/components/admin/TraverseesHub.tsx
  - Accepter `onNavigateToTexteId?` dans les props de TraverseesHub
  - Le passer à `ActiveComponent` :
    - `<ActiveComponent textes={textes} colorScheme={colorScheme} onNavigateToTexteId={...} />`

- Fichier : src/components/admin/livre-vivant/LivreVivantViewer.tsx
  - Créer une fonction dédiée :
    - `handleNavigateToTexteFromTraversees(texteId)` :
      - ferme la modale Traversées (`setIsTraverseesOpen(false)`)
      - navigue dans le livre : `goToPageById('texte-' + texteId)`
  - Passer ce handler à `<TraverseesHub ... onNavigateToTexteId={handleNavigateToTexteFromTraversees} />`

- Fichier : src/components/admin/LivingIndex.tsx
  - Dans la vue détail (liste de mots-clés) :
    - Transformer chaque ligne mot-clé en `<button>` cliquable
    - Au clic : ouvrir une sous-vue “Textes contenant <mot-clé>” (nouvel état `selectedKeyword`), listant les textes via `data.texteIds`.
  - Dans la liste de textes :
    - sur clic d’un texte :
      - si `onNavigateToTexteId` existe : l’appeler (dans le lecteur, ça fermera Traversées + sautera au texte)
      - sinon : soit ne rien faire, soit afficher une petite info (“Navigation disponible dans ‘Lire le Livre Complet’”) — optionnel.
  - Ajouter un bouton “Retour” de cette sous-vue vers la liste des mots-clés.

Checklist de tests (end-to-end)
- Dans /admin/exportations > Lire le Livre Complet :
  - Cliquer “Sommaire” (barre du bas) => page ToC
  - Cliquer une Partie => va à la page “partie-…”, ou au premier texte si pages partie désactivées
  - Cliquer une Marche => va au premier texte de la marche
  - Cliquer “Lieux” => index lieu, cliquer un lieu => déplie la liste, cliquer un texte => navigation OK
  - Cliquer “Genres” => idem
  - Cliquer “Traversées” => modale, Index Vivant => sélectionner un monde => cliquer un mot-clé => liste textes => cliquer un texte => modale se ferme + navigation au texte
- Vérifier sur mobile (preview mobile dans le viewer) :
  - zones tactiles suffisantes
  - pas de scroll bloqué (overlay + listes)

Points de vigilance / robustesse
- Éviter toute navigation “au numéro de page” calculé à la main (le `groupIdx + 2`) : on passe par les ids pour rester stable malgré les options (cover/toc/parties/indexes activés/désactivés).
- Props optionnelles partout pour ne pas casser :
  - TraverseesLecteurs.tsx (public) et EpubPreview.tsx (admin preview) continueront de fonctionner même sans navigation vers le livre.

Livrable
- Après ces changements, tout ce qui est présenté comme “lien” dans Sommaire/Lieux/Genres et dans l’Index Vivant deviendra réellement cliquable, avec une navigation cohérente vers les textes du “Livre Vivant”.

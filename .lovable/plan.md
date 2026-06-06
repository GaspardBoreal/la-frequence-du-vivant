# Recherche accessible sur tablette — barre dans le header

## Intention
Rendre la recherche globale immédiatement visible et cliquable sur tablette/desktop, sans alourdir le mobile (qui garde le FAB existant).

## Comportement
- À partir de `md` (≥ 768px), afficher dans `MonEspaceHeader` un champ discret « Rechercher une espèce, marche, marcheur… » avec icône loupe à gauche et badge `⌘K` à droite.
- Le champ n'est **pas un vrai input** : un clic (ou focus clavier) ouvre l'overlay `GlobalSearchOverlay` existant. Cela évite tout double système de saisie et garantit une seule source d'UX.
- Sur mobile (< 768px) : la barre est masquée, le `GlobalSearchFab` reste seul (inchangé).
- Sur tablette/desktop : le `GlobalSearchFab` est masqué pour éviter la redondance visuelle (le bouton resterait utile uniquement en repli si on souhaite garder le raccourci flottant — voir option ci-dessous).

## Design (cohérent avec la charte glassmorphism émeraude)
- Hauteur 36px, fond `bg-background/60 backdrop-blur-md`, bordure `border border-primary/15`, focus ring `ring-primary/30`.
- Largeur : `w-64` sur `md`, `w-80` sur `lg`.
- Placeholder en `text-muted-foreground`, ton sobre.
- Badge raccourci : pastille `kbd` discrète `text-[10px] bg-muted/60 border border-border rounded px-1.5`.
- Animation d'apparition : fade + translate-y léger au mount (cohérent avec le reste du header).

## Intégration
- Lieu : `src/components/community/MonEspaceHeader.tsx`, inséré entre le bloc identité et les actions (cloche/profil), aligné à droite via `ml-auto md:mr-3`.
- Composant nouveau : `src/components/search/HeaderSearchTrigger.tsx`
  - Props : `onOpen: () => void`
  - Rendu : bouton `<button>` stylé en faux input, accessible (`aria-label="Ouvrir la recherche"`, `role="search"`).
- État `open` du `GlobalSearchOverlay` remonté dans `MonEspaceHeader` (ou un petit context local) pour piloter à la fois ce trigger et, si conservé, le FAB.
- `GlobalSearchFab` : ajouter `className="md:hidden"` à son usage dans `MarchesDuVivantMonEspace.tsx` pour ne le garder qu'en mobile.

## À ne pas toucher
- Logique de recherche (`useGlobalSearch`, RPC `search_global`) : inchangée.
- Raccourci `⌘/Ctrl + K` : déjà géré dans `GlobalSearchFab`, à déplacer dans le nouveau composant header pour rester actif même quand le FAB est masqué.
- Overlay lui-même : inchangé.

## Détails techniques
- Détection responsive via classes Tailwind uniquement (pas de `useIsMobile`) pour éviter un flash au mount.
- Le listener clavier `⌘K` est attaché une seule fois (dans `HeaderSearchTrigger`) ; on retire celui de `GlobalSearchFab` pour éviter le double toggle.
- Aucune migration, aucun changement de données.

## Fichiers impactés
1. `src/components/search/HeaderSearchTrigger.tsx` *(création)*
2. `src/components/community/MonEspaceHeader.tsx` *(insertion du trigger + state overlay)*
3. `src/components/search/GlobalSearchFab.tsx` *(retrait du listener ⌘K — déplacé dans le trigger)*
4. `src/pages/MarchesDuVivantMonEspace.tsx` *(ajout `className="md:hidden"` au FAB)*

À étendre ensuite aux pages exploration/event si tu valides l'approche ici.

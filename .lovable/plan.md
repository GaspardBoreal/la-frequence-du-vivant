# Recherche dans la page Événement — réutiliser le même trigger

## Constat
La page `ExplorationMarcheurPage` (consultation d'un événement) possède son propre header sticky et utilise `GlobalSearchFab` (qui reste un cercle flottant). Sur tablette, on retombe sur le même problème : pas de barre visible.

## Objectif
Réutiliser exactement le même composant `HeaderSearchTrigger` que dans `MonEspaceHeader`, pour garantir une UX/UI strictement identique sur tous les écrans. Toute évolution future (placeholder, style, raccourcis, badge IA…) se fera dans ce composant unique.

## Changements

### 1. `src/components/community/ExplorationMarcheurPage.tsx`
- Importer `HeaderSearchTrigger`.
- L'insérer dans la ligne du header sticky (ligne ~386, juste après le bloc `flex-1 min-w-0`), aligné à droite.
- Lui passer le **scope événement** : `scope="event"`, `eventId={marcheEventId}`, `marcheId={activeMarcheId}` — exactement les mêmes props que le FAB actuel reçoit, pour que la recherche reste pré-filtrée sur l'événement courant.
- Sur le `GlobalSearchFab` (ligne 660), ajouter `className="md:hidden"` pour ne le garder qu'en mobile, comme dans `MarchesDuVivantMonEspace`.

### 2. `src/components/search/HeaderSearchTrigger.tsx`
- Ajuster le placeholder selon le scope :
  - `scope="event"` → « Rechercher dans cet événement… »
  - autre → texte global actuel.
- Aucune autre logique modifiée — toujours un seul composant, source unique de vérité.

## Hors scope (à généraliser ensuite si tu valides)
Autres pages possédant un FAB ou un header (ex. admin, exploration historique publique) : on étendra le même pattern dans une passe ultérieure. Ici on reste sur le parcours marcheur évoqué.

## Fichiers impactés
1. `src/components/community/ExplorationMarcheurPage.tsx` (insertion trigger + `md:hidden` sur FAB)
2. `src/components/search/HeaderSearchTrigger.tsx` (placeholder contextuel)

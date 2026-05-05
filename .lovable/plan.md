## Problème observé

Dans `src/components/chatbot/ChatBot.tsx`, le header (lignes 282-379) empile **jusqu'à 7 éléments** côté droit (Badge contexte + TTS + Download + Reset + Maximize + Close, parfois suivi du bouton "Écouter" dans le message). En largeur 380px (mode dock) ou ~456px (mobile), la rangée déborde dès qu'une réponse est rendue, masquant Fermer (X) et Agrandir (⤢) — exactement ce que montre la copie 2.

Causes :
1. `flex items-center gap-1` sans `shrink-0` sur les boutons → la rangée d'actions est compressée par le bloc titre.
2. Le bloc titre n'a pas `min-w-0` → il refuse de céder de la place.
3. Le sous-titre `max-w-[220px]` reste large même quand des actions apparaissent.
4. Aucune action critique (Fermer / Agrandir) n'est sanctuarisée.

## Solution — Header mobile-first à 2 zones intangibles

### Architecture cible

```text
┌──────────────────────────────────────────────────────────┐
│ [emoji] Titre + badge          [⋯ menu] [⤢] [×]         │
│         Sous-titre tronqué…                              │
└──────────────────────────────────────────────────────────┘
   ↑ flex-1 min-w-0 truncate       ↑ shrink-0, toujours visibles
```

**Règle d'or** : 3 boutons toujours affichés côté droit, quel que soit l'état :
- **Menu "⋯" (More)** — regroupe TTS, Download, Reset, et toute action future
- **Agrandir / Réduire (⤢ / ⤡)** — desktop uniquement
- **Fermer (×)** — toujours

### Détails UI

1. **Bloc titre** (gauche) : ajouter `min-w-0 flex-1` au container, `truncate` au `<h3>` et au `<p>`. Le sous-titre perd `max-w-[220px]` (devient fluide).
2. **Bloc actions** (droite) : `shrink-0 flex items-center gap-0.5`.
3. **Menu "⋯"** : composant `DropdownMenu` (shadcn, déjà dispo) avec items :
   - 🔊 Lecture vocale auto (toggle, état coché si actif)
   - ⬇ Exporter la conversation (désactivé si `messages.length === 0`)
   - 🔄 Nouvelle conversation (désactivé si vide)
   - Séparateur, puis info contexte (lecture seule)
4. **Badge contexte expanded** (ligne 311-318) : déplacé sous le titre comme petite pastille, plus dans la barre d'actions.
5. **Mobile (`isMobile`)** : Agrandir masqué (déjà le cas), menu "⋯" reste, Fermer reste. Boutons `h-9 w-9` (zone tactile ≥ 36px), espacement `gap-1`.
6. **Desktop dock (380px)** : 3 icônes + menu = ~144px réservés à droite, le titre prend le reste avec ellipsis.

### Pourquoi un menu "⋯" plutôt que tout aplatir ?

- Évite le débordement définitivement (3 boutons fixes, peu importe combien d'actions on ajoute plus tard).
- Suit les conventions iOS/Android (overflow menu).
- Garde Fermer/Agrandir comme actions primaires visuellement isolées.
- Permet d'ajouter sans peur : copier conversation, partager, langue, modèle, etc.

### Accessibilité

- Chaque bouton garde son `title` + `aria-label`.
- Le menu "⋯" a `aria-label="Plus d'actions"`.
- Échappement (Esc) ferme le menu (géré par Radix DropdownMenu).
- L'état actif de "Lecture vocale auto" est indiqué par une coche dans le menu.

## Fichiers à modifier

- **`src/components/chatbot/ChatBot.tsx`** — refonte du header (lignes 282-379) :
  - Bloc titre : `min-w-0 flex-1`, retirer `max-w-[220px]`, ajouter `truncate`.
  - Bloc actions : remplacer la liste de boutons conditionnels par : `[DropdownMenu ⋯] [Maximize si !mobile] [Close]`.
  - Badge contexte expanded : repositionné sous le titre en pastille discrète.
  - Importer `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuSeparator` de `@/components/ui/dropdown-menu`.
  - Importer `MoreVertical` de `lucide-react`.

Aucun autre fichier touché. Aucune logique métier ni hook modifié — uniquement la présentation du header.

## Hors-scope

- Pas de refonte du body, des suggestions, ni de la barre input.
- Pas de changement du comportement TTS/STT.
- Pas de nouvelles actions (juste réorganisation des existantes).

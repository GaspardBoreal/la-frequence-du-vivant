

## Renommer "Lire" en "Écrire" et créer un nouvel onglet "Lire" (descriptions)

### Compris

- Onglet **"Lire"** (📖 BookOpen) actuel → renommé en **"Écrire"** (icône `PenLine`). Contenu inchangé : `LireTab` (textes des marcheurs).
- Nouveau **"Lire"** (📖 BookOpen) → affiche les **2 descriptions** de la marche en cours (`marches.descriptif_court` + `marches.descriptif_long`), avec navigation interne 1 ↔ 2 (chevrons + dots de pagination), **mobile first**, rendu enrichi (HTML).
- Source : champs déjà présents dans la table `marches`. Filtré par `activeMarcheId` (sélecteur d'étape déjà en place tout en haut du bloc sensoriel).

### Architecture (1 nouveau composant + 2 retouches)

| Fichier | Action |
|---|---|
| `src/components/community/exploration/LireDescriptionsTab.tsx` | **Nouveau**. Charge la marche par `activeMarcheId`, expose un carousel interne 1/2 ↔ 2/2 |
| `src/components/community/ExplorationMarcheurPage.tsx` | Réordonne `sensoryTabs` : ajoute `lire` (BookOpen) et renomme l'ancien en `ecrire` (PenLine). Branche `LireDescriptionsTab` sur `lire` et `LireTab` sur `ecrire`. Met à jour le compteur de badge. |
| `src/components/community/MarcheDetailModal.tsx` | Même mise à jour du `tabs[]` pour cohérence dans la modale (réutilise `LireDescriptionsTab`) |

### UI mobile first du nouvel onglet "Lire"

```text
┌──────────────────────────────────────────┐
│  Description courte                      │  ← titre de la page courante
│  ──────────────────────────────────      │
│                                          │
│  <contenu HTML enrichi, prose>           │
│  Le sentier serpente entre…              │
│                                          │
│         ◀  ●○  ▶                         │  ← pagination centrée
└──────────────────────────────────────────┘
```

- Conteneur : `prose prose-invert max-w-none text-base leading-relaxed`
- Navigation : 2 chevrons (boutons ronds 44px = cible tactile), 2 dots cliquables au centre
- Swipe gauche/droite via `framer-motion` `drag="x"` (geste mobile naturel)
- Animation : `AnimatePresence` fade + slide horizontal entre 1 et 2
- Si une seule description renseignée → masque la navigation et affiche directement l'unique description
- Si les deux vides → état vide doux : « Aucune description disponible pour cette étape. »

### Rendu du contenu enrichi

- On rend en **HTML** via `dangerouslySetInnerHTML` enveloppé dans une div `prose` (le projet utilise déjà Tailwind Typography ailleurs).
- Si le texte ne contient pas de balises HTML, on bascule automatiquement sur un rendu `whitespace-pre-wrap` pour préserver les sauts de ligne.

### Détail technique

- Nouveau hook léger inline (ou `useQuery` dans le composant) :
  ```ts
  supabase.from('marches').select('descriptif_court, descriptif_long').eq('id', activeMarcheId).maybeSingle()
  ```
  avec `staleTime: 5 * 60 * 1000`, `enabled: !!activeMarcheId`.
- Reset de `currentPage` à 0 à chaque changement de `activeMarcheId` (`useEffect`).
- Compteur badge "Lire" = nombre de descriptions non vides (0, 1 ou 2).
- Compteur badge "Écrire" = ancien compteur `lire` (textes des marcheurs).

### Points laissés au jugement par défaut (modifiables après)

- **Ordre** : `Voir · Écouter · Lire · Écrire · Vivant` (lecture avant création).
- **Libellés des 2 pages** : « Description courte » / « Description longue ».
- **Cas vide partiel** : on affiche seulement la description renseignée, sans pagination.
- **Format de stockage** : détection automatique HTML vs texte brut.

Dis-moi si tu veux changer l'un de ces 4 points avant que je passe à l'implémentation.


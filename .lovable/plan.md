
## Analyse rapide (cause du problème)

Dans l’état actuel, les modes **Immersion/Fiche** existent uniquement dans `VivantTab` (`MarcheDetailModal.tsx`, autour des lignes 546+).  
La vue **Voir** n’a **ni state `viewMode`**, ni toggle, ni rendu conditionnel : elle affiche seulement `Ajouter` + `Ancien`.

Résultat: en étant sur l’onglet **Voir** (capture COPIE 1), c’est normal de ne rien voir.

## Solution design (élégante et lisible)

Ajouter un sélecteur de mode **directement dans la barre d’actions de Voir**, visible et explicite (pas seulement des icônes).

```text
[ + Ajouter ]                [ Immersion | Fiche ] [ Ancien ]
```

- **Immersion**: priorité photo (vignettes plus grandes, infos masquées par défaut, overlay discret au survol/tap)
- **Fiche**: rendu actuel (titre + date + statut), pour gérer/éditer facilement ses contributions

Le mode est mémorisé (`localStorage`) pour que l’expérience reste cohérente.

## Plan d’implémentation

### 1) `src/components/community/MarcheDetailModal.tsx` (VoirTab)
- Ajouter `const [viewMode, setViewMode] = useState<'immersion' | 'fiche'>(...)` avec clé `voir-tab-view`.
- Remplacer la zone d’actions du haut par:
  - bouton `Ajouter`
  - **segmented control** `Immersion / Fiche` (icône + label)
  - `SortToggle` à droite
- Appliquer `viewMode` aux sections photos de Voir:
  - photos d’exploration (admin)
  - mes contributions visuelles
  - contributions des marcheurs visuelles

### 2) `src/components/community/contributions/ContributionItem.tsx`
- Ajouter prop optionnelle `viewMode?: 'immersion' | 'fiche'` (défaut `fiche`).
- Pour `type === 'photo'` ou `type === 'video'`:
  - **Immersion**: média plus grand (`aspect-[3/4]`), méta minimisée, overlay doux
  - **Fiche**: rendu actuel conservé
- Garder intact le comportement d’édition/suppression/visibilité (surtout en mode fiche).

### 3) Ajustements visuels (sans toucher le mode sombre global)
- Contraste du toggle renforcé (fond légèrement plus clair + état actif net).
- Grilles adaptées:
  - Immersion: plus dense et inspirante (2–3 colonnes selon largeur)
  - Fiche: grille actuelle, confortable pour lecture/actions
- Transitions Framer Motion légères au changement de mode.

## Détails techniques (ciblés)
- Aucun impact backend/Supabase.
- Aucun changement des onglets Écouter/Lire.
- Le mode sombre existant reste intact; on ne modifie que la hiérarchie visuelle de **Voir**.
- Fallback robuste: si `localStorage` absent/invalide → `fiche`.

## Résultat attendu

Dans l’onglet **Voir**, l’utilisateur voit immédiatement les 2 modes, peut basculer à tout moment, et obtient:
- un mode **Immersion** plus émotionnel et photographique,
- un mode **Fiche** plus pratique pour gérer ses contributions.

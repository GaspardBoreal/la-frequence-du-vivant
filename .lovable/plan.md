# Recherche → Navigation directe vers chaque fiche

## Problème

Aujourd'hui, "Ouvrir la fiche" envoie tout le monde vers `/exploration/:id` (page racine, onglet Carte). Le marcheur arrive « quelque part » mais doit re-chercher l'espèce / le texte / la pratique / le témoignage. L'effet wahouh de la recherche s'effondre à la dernière marche.

## Vision

La recherche devient un **téléporteur contextuel** : un clic = on atterrit sur le bon onglet, à la bonne marche, avec la **fiche déjà ouverte** (drawer ou modal), un léger halo « focus » sur l'élément ciblé, et l'historique navigateur permet de revenir à la liste de résultats.

## Mécanique unifiée : un seul paramètre `?focus=`

Toutes les routes sortent vers la page exploration (ou la page profil/public selon le cas), avec un query param normalisé :

```
?focus=<kind>:<encodedId>[&marcheId=<id>][&tab=<tab>]
```

Exemples :

| Résultat | Route générée |
|---|---|
| Espèce *Clematis* | `/exploration/{exp}?focus=species:Clematis` |
| Pratique remarquable | `/exploration/{exp}?focus=practice:{curationId}&tab=apprendre` |
| Texte « Le chant du patio » | `/exploration/{exp}?focus=text:{textId}&marcheId={m}&tab=marches&sensory=lire` |
| Témoignage | `/exploration/{exp}?focus=testimony:{testimonyId}&tab=marcheurs` |
| Marche / Event | `/exploration/{exp}?focus=event:{eventId}` |
| Marcheur | `/marcheur/{slug}` (déjà direct) |

## Architecture

### 1. RPC `search_global` — enrichir les routes

Régénérer la fonction pour qu'elle retourne directement la route ciblée :
- **species** : `?focus=species:<scientific_name>` (+ `marcheId` du `recent_contexts[0]` pour pré-positionner l'étape)
- **practice** : `?focus=practice:<curation_id>&tab=apprendre`
- **text** : `?focus=text:<text_id>&marcheId=<marche_id>&tab=marches&sensory=lire`
- **testimony** : `?focus=testimony:<testimony_id>&tab=marcheurs` (ou onglet Synthèse selon mémoire `event-testimonies-logic`)
- **event** : `?focus=event:<event_id>`

### 2. Hook côté page exploration : `useFocusFromUrl()`

Petit hook lu une fois au montage de `ExplorationMarcheurPage` :
- parse `?focus=…&marcheId=…&tab=…&sensory=…`
- positionne `activeGlobalTab`, `activeSensoryTab`, `activeStepIndex` (via `marcheId → index`)
- expose `{ focus: { kind, id }, consume() }` pour les composants enfants
- `consume()` nettoie l'URL avec `navigate(pathname, { replace: true })` une fois la fiche affichée → l'utilisateur peut « partager le lien » avant, mais l'historique reste propre.

### 3. Auto-ouverture par kind

| Kind | Composant qui réagit | Comportement |
|---|---|---|
| `species` | `SpeciesExplorer` / drawer espèce existant | Ouvre `SpeciesGalleryDetailModal` sur le `scientific_name` ciblé |
| `practice` | onglet *Apprendre* (ou *Vivant*) | Scroll + halo sur la carte pratique + ouvre son drawer si dispo |
| `text` | `LireDescriptionsTab` / `TextesEcritsSubTab` | Scroll sur le texte, mode lecture immersive ouvert |
| `testimony` | onglet témoignages | Modal témoignage avec citation entière |
| `event` | rien (la page = l'event) | léger halo sur le bandeau titre |

Pour chaque kind, un seul `useEffect` qui surveille `focus` et déclenche le `setOpen(...)` du drawer/modal correspondant, puis appelle `consume()`.

### 4. Ergonomie « wahouh »

- **Transition** : quand on clique « Ouvrir la fiche », overlay search se ferme avec un *zoom-out* vers la vignette ; la fiche s'ouvre 250 ms plus tard avec un *zoom-in*. Sensation de continuité spatiale (shared element-like via `framer-motion layoutId`).
- **Halo de bienvenue** : à l'arrivée, un ring émeraude pulse 1.5 s autour de la fiche (`animate-pulse-once`).
- **Toast retour** : un mini-toast en bas « Retour aux résultats » qui ré-ouvre l'overlay avec la requête mémorisée (state via `sessionStorage: lastSearchQuery`).
- **Skeleton fiche** pendant le chargement (drawer ouvert vide → contenu progressif) — pas d'écran blanc.

### 5. Robustesse

- Si la marche cible n'est pas dans `explorationMarches` (l'utilisateur n'y a pas participé) → fallback : ouvrir la fiche espèce/texte en mode lecture seule, sans changer d'onglet, avec une bannière « Observée sur une marche que vous n'avez pas suivie ».
- Si `focus.id` n'existe plus → toast « Cette fiche n'est plus disponible » + `consume()`.
- `?focus=` est ignoré sur les pages publiques `/marche/:id` (texte) sauf si on décide de l'y supporter aussi.

## Détails techniques (section technique)

- `useGlobalSearch` : aucune modif côté types (`route` reste un string déjà enrichi par le RPC).
- `GlobalSearchOverlay.handleResultClick` : stocke `sessionStorage.setItem('last-search', query)` avant `navigate(r.route)`.
- Nouveau fichier `src/hooks/useFocusFromUrl.ts` (~40 lignes).
- Nouveau composant `src/components/search/FocusHalo.tsx` (motion ring réutilisable).
- Migration SQL : `CREATE OR REPLACE FUNCTION search_global` avec les nouvelles routes (concat directe des query params, encode via `replace`).
- Aucun changement de schéma DB.

## Questions avant de coder

1. **Pratiques remarquables** : existe-t-il déjà un drawer dédié, ou seulement une carte dans `ApprendreTab` ? (J'ai vu `exploration_curations` mais pas de modal pratique unique — confirme-tu qu'un *PracticeDetailModal* doit être créé, ou réutilise-t-on `SpeciesGalleryDetailModal` ?)
2. **Témoignages** : faut-il les ouvrir dans la vue *Mur*, *Carrousel*, *Nuage* ou *Constellation* (mémoire `event-testimonies-logic`), ou un modal dédié indépendant du mode courant ?
3. **Hors périmètre du marcheur** (espèce vue dans une marche non suivie) : on bloque ? on affiche en lecture seule avec bannière ? on redirige vers la page publique `/m/:slug` si publiée ?
4. **Transition shared-element** (zoom vignette → fiche) : OK pour ce niveau de polish, ou on reste sur un fade simple pour livrer plus vite ?

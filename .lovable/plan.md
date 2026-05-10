# ChatBot screen-awareness pour le détail de marche (Voir / Écouter / Lire / Vivant)

## Diagnostic

Réponse décevante du chatbot dans la marche DEVIAT 11.03.26 → onglet Marches → Voir :
> *« visibleCards est vide dans cet onglet. »*

Cause racine, vérifiée dans le code :

1. `MarcheDetailModal.tsx` (l. 1223-1226) déclare bien le contexte :
   ```tsx
   data-chat-context="marche-detail"
   data-chat-title={eventTitle}
   data-chat-subtitle={...}
   data-chat-active-tab={activeTab}
   ```
2. `ChatViewportObserver.tsx` (l. 158-164) inclut les `[role="dialog"][data-state="open"]` dans ses roots → le modal est bien scanné.
3. **MAIS** aucune des cartes affichées (photos admin, `DraggableContributionGrid`, `ContributionItem`, audios, descriptions, kigos) ne porte les attributs `data-chat-card` / `data-chat-title` / `data-chat-subtitle` / `data-chat-badges`.

Conséquence : le snapshot envoyé à l'IA contient le titre de l'événement et l'onglet actif, mais pas une seule carte → l'IA répond en mode "connaissances générales" au lieu de s'appuyer sur ce que voit réellement le marcheur (la photo "Arbre entrée 1 - 09 05 2026" d'un arbre couvert de lierre).

## Correctif — baliser les cartes de chaque onglet

Aucune logique métier touchée. Uniquement des attributs DOM.

### 1. Onglet Voir — `MarcheDetailModal.tsx`

**a) Photos "De l'exploration" (admin)** — l. 515-530 :
Sur la `<div>` racine de chaque vignette, ajouter :
```tsx
data-chat-card
data-chat-title={photo.titre || 'Photo de l\'exploration'}
data-chat-subtitle="De l'exploration"
data-chat-badges="photo, exploration, public"
```

**b) Mes contributions** — `DraggableContributionGrid` (composant enfant) :
Dans le composant (à localiser dans `contributions/`), baliser chaque tuile avec :
```tsx
data-chat-card
data-chat-title={item.titre || 'Contribution sans titre'}
data-chat-subtitle={`${item.type} • ${item.isPublic ? 'public' : 'privé'} • ${formatDate(item.createdAt)}`}
data-chat-badges={[item.type, 'mine'].join(',')}
```

**c) `ContributionItem`** (utilisé pour crédités + others) — pareil, avec `data-chat-subtitle` indiquant l'auteur (`group.fullName`) :
```tsx
data-chat-card
data-chat-title={titre || 'Photo'}
data-chat-subtitle={`${type} • par ${authorName} • ${formatDate(createdAt)}`}
data-chat-badges={`${type},${isPublic ? 'public' : 'privé'}`}
```

**d) Section headings** — ajouter `data-chat-heading` sur les libellés "De l'exploration", "Mes contributions (N)", "Crédité à X", "Communauté (N)" pour structurer le snapshot.

### 2. Onglet Écouter — `MarcheurAudioPanel`

Sur chaque carte audio, baliser :
```tsx
data-chat-card
data-chat-title={audio.titre || 'Audio'}
data-chat-subtitle={`audio • ${duree} • par ${author}`}
data-chat-badges="audio"
```

### 3. Onglet Lire (descriptions) — `LireDescriptionsTab`

Pour chaque description (texte riche d'audio + descriptions de marcheurs), baliser :
```tsx
data-chat-card
data-chat-title={desc.titre || 'Description'}
data-chat-subtitle={extractPreview(desc.contenu, 120)}  // 120 premiers caractères du texte HTML/markdown
data-chat-badges="description"
```
Utiliser un helper `stripHtmlAndTruncate(html, maxLen)` (ou réutiliser `htmlSanitizer.ts` existant + slice).

### 4. Onglet Écrire (textes du marcheur) — `LireTab` + Kigos

Pour chaque kigo / texte affiché, baliser :
```tsx
data-chat-card
data-chat-title={kigo.titre || texte.titre || 'Note'}
data-chat-subtitle={extractPreview(kigo.contenu || texte.contenu, 120)}
data-chat-badges={kigo ? 'kigo' : texte.type_litteraire}
```

### 5. Onglet Vivant — `VivantTab`

Pour chaque espèce listée (curations / pratiques emblématiques) :
```tsx
data-chat-card
data-chat-title={species.frenchName || species.scientificName}
data-chat-subtitle={species.scientificName}
data-chat-badges={species.kingdom}
```

### 6. (bonus) Étendre l'observer pour capter le contexte "marche-detail"

Dans `ChatViewportObserver.tsx`, lire les attributs `data-chat-context`, `data-chat-active-tab` et `data-chat-title` sur chaque root et les ajouter au snapshot (champ `meta.context = { type, activeTab, title, subtitle }`). Le slice `community-chat` les utilisera pour formuler des prompts comme :
> *« Tu vois actuellement la marche "DEVIAT 11.03.26", onglet "Voir". 8 cartes visibles : Arbre entrée 1 - 09 05 2026 (photo), … »*

## Validation

1. Marche DEVIAT 11.03.26 → Marches → Voir → ouvrir chat → "que vois-tu ?" → l'IA doit énumérer "Arbre entrée 1 - 09 05 2026" et autres titres.
2. Demander "parle-moi du lierre dans cette marche" → l'IA doit citer la photo "Arbre entrée 1" comme sujet d'observation.
3. Vérifier sur 3 onglets différents (Voir / Lire / Vivant) que `visibleCards` est non vide.
4. Console : ajouter un `console.debug('[ChatSnapshot]', snap)` temporairement dans `ChatViewportObserver` pour confirmer les cartes capturées.

## Hors scope

- Pas de modification de l'edge function `community-chat` (les nouveaux titres arrivent automatiquement dans le snapshot).
- Pas de migration DB.
- Pas de changement visuel.
- Pas de balisage des cartes en dehors du modal (déjà fait pour les autres écrans).

## Diagnostic

Sur `/exploration/:id`, la fiche espèce s'ouvre dans un `Sheet` (Radix) qui occupe tout l'écran sur mobile et **vit dans un Portal avec focus-trap à `z-50`**. Au clic sur "Discuter de cette espèce avec l'IA", l'event `community-chat:open` est bien dispatché et le `ChatBot` passe à `isOpen=true`. **Mais** :

- Le panneau ChatBot par défaut s'affiche en bas-droite (`fixed bottom-6 right-6 z-50`) → il est visuellement **caché derrière la SheetContent plein écran**.
- Le focus-trap de la Sheet capture les interactions → impression que "rien ne se passe".

Résultat : le chat s'ouvre mais l'utilisateur ne le voit pas et ne peut pas l'utiliser.

## Solution retenue

**Chat en overlay au-dessus de la fiche** (la fiche reste montée derrière), avec un prefill enrichi transmis via le texte du message (aucun changement backend).

### 1. Forcer le mode plein écran à l'ouverture par event

Dans `src/components/chatbot/ChatBot.tsx`, listener `community-chat:open` :
- `setIsOpen(true)` + **`setIsExpanded(true)` quand `isMobile`** (et même desktop pour cohérence) → le ChatBot rend déjà `fixed inset-0 z-[60]` quand expanded, ce qui passe au-dessus de la SheetContent (z-50).
- Étendre le payload accepté : `{ prefill, species, autoSend? }` (autoSend pas activé pour l'instant — l'utilisateur valide).

### 2. Élever le z-index du ChatBot expanded

Passer le conteneur expanded de `z-[60]` à `z-[80]` (la Sheet et son overlay sont à 50, le Lightbox à 9999 reste au-dessus, ce qui est OK). Le backdrop chat passe à `z-[75]`.

### 3. Bouton "Revenir à la fiche" dans le header du chat

Quand le chat a été ouvert via `community-chat:open` avec un `species`, afficher dans le header du ChatBot un petit chip discret « ← Revenir à *Nom espèce* » qui ferme le chat (la Sheet espèce est toujours montée derrière → elle réapparaît instantanément, contexte préservé : onglet, scroll, photo).

Mémoriser dans un ref local du ChatBot le dernier `species` reçu via event ; reset à la fermeture.

### 4. Prefill enrichi (recommandé, choix utilisateur)

Dans `SpeciesGalleryDetailModal.tsx`, remplacer le prefill actuel (court) par un prefill structuré et lisible, construit à partir des données déjà calculées dans le composant :

```
Parle-moi de {frenchName} ({scientificName}).

Contexte observé sur cette exploration :
- Règne : {kingdomLabel} · Famille : {family ?? "—"}
- {count} observation(s) sur {totalMarchesCount} marche(s)
- {uniqueObserversCount} marcheur(s) contributeur(s)
- Marches concernées : {top 3 marche names, …}
- Catégorie écologique : {category ou "non classée"}

Pourquoi cette espèce est-elle intéressante ici, que nous apprend sa présence (rôle écologique, indicateur, saisonnalité, interactions), et quelles précautions ou attentions porter ?
```

Appliqué aux **deux** boutons (desktop inline + mobile sticky) pour cohérence.

### 5. Audit rapide UX

- Le bouton ✕ existant du ChatBot ferme uniquement le chat, la Sheet espèce reste visible derrière → comportement attendu.
- Vérifier qu'aucun `pointer-events:none` parasite ne bloque les clics dans le chat overlay (z-[80] sur conteneur + bouton X).
- Vérifier sur 390×754 (iPhone 12/13) que le textarea reste accessible (safe-area déjà géré).

## Hors-scope

- Pas de slice `visibleData` supplémentaire pour cette fiche (l'utilisateur a choisi prefill enrichi seul).
- Pas de refonte du ChatBot global, ni du `chatPageContext`.
- Pas de modification de `community-chat` edge function.
- Pas de changement sur le bouton desktop tant qu'il fonctionne (mais on uniformise le prefill).

## Détails techniques

Fichiers touchés :
- `src/components/chatbot/ChatBot.tsx` — listener event : forcer `isExpanded` à l'ouverture par event ; mémoriser `lastSpeciesContext` ; afficher chip « Revenir à … » dans le header ; remonter z-index du mode expanded à `z-[80]` (backdrop `z-[75]`).
- `src/components/biodiversity/SpeciesGalleryDetailModal.tsx` — extraire le prefill dans un helper `buildSpeciesChatPrefill()` et l'utiliser pour les deux CTA (desktop + mobile sticky).

QA :
1. Mobile 390px : ouvrir une fiche espèce, taper le CTA → le chat couvre l'écran, le prefill est dans l'input, focus posé.
2. Cliquer ✕ ou « Revenir à *Espèce* » → la fiche espèce réapparaît, scroll/onglet préservés.
3. Desktop : CTA inline ouvre toujours le ChatBot ; vérifier qu'il n'y a pas de régression.
4. Vérifier qu'aucune autre source d'event `community-chat:open` ne casse (recherche dans le repo : seulement `SpeciesGalleryDetailModal.tsx`).

# Brancher le ChatBot global sur la modale trophique

## Diagnostic

Le bouton « Ouvrir le chat » dispatche aujourd'hui l'événement `open-species-chatbot`, mais le `ChatBot` global n'écoute **que** `community-chat:open`. Résultat : rien ne se passe. De plus, aucun contexte (chaîne trophique, pool d'espèces) n'est transmis, donc même branché, le chat répondrait dans le vide.

## Objectifs

1. Cliquer sur « Ouvrir le chat » ouvre **le ChatBot global** (avec ses fonctions Imprimer, Rafraîchir, Voix, Pièce jointe, etc.) par-dessus la modale trophique.
2. Le ChatBot reçoit en contexte : l'espèce focus + sa chaîne trophique + le pool complet des espèces de l'événement.
3. La sidebar « Chat » propose **3 suggestions cliquables** au lieu d'un seul bouton, chacune lançant le ChatBot avec un prefill différent.
4. Comportement cohérent : l'overlay du ChatBot expanded (`z-[80]`) passe au-dessus de la modale trophique (`z-50`).

## Changements

### 1. `src/components/chatbot/ChatBot.tsx`

Étendre le listener `community-chat:open` pour accepter un payload contexte trophique et auto-attacher le pool d'espèces :

- Nouveau champ optionnel `detail.trophic` : `{ scientificName, commonName, group, prey: [...], predators: [...] }`.
- Nouveau champ optionnel `detail.autoAttachSpeciesPool: boolean` — si `true`, appeler `attachSpeciesPool()` après ouverture (réutilise le slice `SPECIES_POOL_SLICE_KEY` existant).
- Le contexte trophique est poussé via `chatPageContext.setVisibleSlice('trophic-focus', {...})` pour que l'edge function l'inclue dans le system prompt (convention identique au slice species pool existant).

### 2. `src/components/biodiversity/species-modal/trophic-fullscreen/TrophicFullscreenModal.tsx`

Remplacer `handleOpenChat` qui dispatche `open-species-chatbot` par un helper qui dispatche `community-chat:open` avec le bon payload :

```ts
const openChatWith = (prefill: string) => {
  window.dispatchEvent(new CustomEvent('community-chat:open', {
    detail: {
      prefill,
      species: star.scientificName,
      speciesLabel: star.commonName || star.scientificName,
      trophic: {
        scientificName: star.scientificName,
        commonName: star.commonName,
        group: star.group,
        prey: preyPredators.prey.map(s => ({ sn: s.scientificName, cn: s.commonName, g: s.group })),
        predators: preyPredators.pred.map(s => ({ sn: s.scientificName, cn: s.commonName, g: s.group })),
      },
      autoAttachSpeciesPool: true,
    },
  }));
};
```

Remplacer le contenu de l'onglet « Chat » de la sidebar par **3 cartes suggestions** générées dynamiquement à partir de `star` + `meta` + `preyPredators` :

1. **Rôle écologique** — « Quel est le rôle de [espèce] dans cet écosystème et que nous apprend sa présence ? »
2. **Qui la mange / qu'elle mange** — « Avec quelles espèces de cet événement [espèce] interagit-elle trophiquement, et comment ? »
3. **Comparaison dans le pool** — « Compare [espèce] aux autres [niveau trophique] observés sur cet événement : indicateurs, fragilités, dynamiques. »

Chaque carte cliquable appelle `openChatWith(prefill)`. Bouton secondaire « Discuter librement » sans prefill.

Le ChatBot global s'ouvrant en mode expanded (`z-[80]`) recouvre naturellement la modale trophique (`z-50`) — la sidebar reste accessible en arrière-plan quand le marcheur ferme le chat.

### 3. Edge function chatbot (suivi)

L'edge function qui consomme `visibleData` doit reconnaître le slice `trophic-focus` et l'injecter dans le system prompt (1 phrase descriptive + liste compacte proies/prédateurs). À identifier dans `supabase/functions/community-chat/` (ou équivalent) — petit ajout, pas de refonte.

## Hors-scope

- Pas de modification de l'edge function au-delà de la prise en compte du nouveau slice.
- Pas de refonte visuelle du ChatBot lui-même.
- Pas de persistance spécifique de cette conversation.

## Vérification

1. Ouvrir la modale trophique, cliquer chaque suggestion → ChatBot s'ouvre en plein écran avec prefill, badge « Pièce jointe : Liste des espèces » visible.
2. Envoyer la question → la réponse mentionne des espèces du pool (preuve que le contexte est passé).
3. Fermer le chat → on retombe sur la modale trophique avec la sidebar Chat intacte.

# Restaurer le menu « 🌿 Liste des espèces » dans le composer

## Cause racine

`useChatPageContextProvider` (utilisé par chaque page) appelle :
- `setContext(entity, pageState)` qui **remplace** entièrement `pageState`
- `store.clear()` au cleanup (changement d'onglet, refresh, démontage…)

Or `CommunityChatBotMount` publie `availableAttachments.speciesPool` via `setAvailableAttachments`, dans un effet séparé. Toute mise à jour de la page (tab, filtre) écrase cet attachement → le dropdown 📎 perd l'option « Liste des espèces » et retombe sur un bouton simple.

## Correctif (frugal, 1 fichier)

**`src/hooks/useChatPageContext.ts`** — rendre `availableAttachments` résistant aux remplacements de contexte page :

1. `setContext(entity, pageState)` : **préserver** `availableAttachments` existant si la nouvelle `pageState` n'en fournit pas explicitement.
   ```ts
   setContext: (entity, pageState = {}) => {
     setState({
       entity,
       pageState: {
         ...pageState,
         availableAttachments:
           pageState.availableAttachments ?? state.pageState.availableAttachments,
       },
     });
   },
   ```

2. `clear()` : ne plus wiper `availableAttachments` (il est lié au mount du chatbot, pas à la page).
   ```ts
   clear: () => setState({
     entity: null,
     pageState: { availableAttachments: state.pageState.availableAttachments },
   }),
   ```

## Robustesse complémentaire (même fichier, optionnel)

Dans `setPageState`, déjà en mode merge — RAS.

## Pourquoi pas toucher `CommunityChatBotMount` ?

L'effet y est correct (dépend de `explorationIdForPool` + `speciesPool`). Le ré-exécuter à chaque changement de page créerait un flicker et masquerait la vraie cause. Le fix doit vivre au niveau du store.

## Vérification

- Ouvrir `/marches-du-vivant/mon-espace/exploration/:id` → cliquer 📎 → dropdown avec « 🌿 Liste des espèces (92) » visible.
- Changer d'onglet dans la fiche → le menu reste disponible.
- Reset conversation → l'attachement éventuellement coché se détache (déjà géré par `handleReset` → `detachSpeciesPool`), mais le **disponible** reste.
- Le décompte (92) reflète bien la fusion snapshots ∪ marcheur_observations introduite précédemment.

## Fichiers touchés
- `src/hooks/useChatPageContext.ts` (2 méthodes ajustées)

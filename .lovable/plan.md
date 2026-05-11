## Diagnostic

Quand on ouvre le chat depuis la fiche espèce, la fenêtre apparaît bien (z-index correct, prefill bien rempli) mais **aucun clic ne fonctionne** : ni le textarea, ni le bouton Envoyer, ni la croix, ni la chip "Revenir à…".

**Cause racine** : la fiche espèce s'affiche dans un `Sheet` Radix (modal). Radix utilise `react-remove-scroll` qui pose `pointer-events: none` sur `<body>` pendant qu'un Sheet/Dialog modal est ouvert. Tout ce qui est rendu **hors** du SheetContent hérite donc de `pointer-events: none` — y compris notre `ChatBot` (rendu au niveau racine de l'app).

Le z-index n'est pas le problème (le panel est bien à `z-[80]`, au-dessus du Sheet). C'est uniquement les **events pointeur** qui sont bloqués.

## Solution

Ajouter explicitement `pointer-events-auto` sur les conteneurs flottants du ChatBot pour qu'ils ré-activent les clics dans leur sous-arbre, indépendamment du verrou posé par Radix sur `<body>`.

## Modifications (1 seul fichier)

`src/components/chatbot/ChatBot.tsx`

1. **Backdrop expanded** (ligne ~294) : ajouter `pointer-events-auto`
   ```text
   className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-sm pointer-events-auto"
   ```

2. **Conteneur panneau** (`panelClasses`, ligne ~253-255) : ajouter `pointer-events-auto` dans les deux variants (expanded ET réduit), pour couvrir aussi le cas où le bouton flottant serait survolé par un autre Sheet.
   ```text
   isExpanded
     ? 'fixed inset-0 z-[80] flex items-center justify-center sm:p-4 pointer-events-auto'
     : 'fixed bottom-6 right-6 z-50 pointer-events-auto'
   ```

3. **Bouton flottant** (ligne ~270) : ajouter `pointer-events-auto` sur le wrapper `motion.div` pour qu'il reste cliquable si un Sheet modal est ouvert ailleurs.

## QA à faire après implémentation

- Mobile 390px : ouvrir une fiche espèce → "Discuter de cette espèce avec l'IA" → vérifier :
  - le textarea est focusable et éditable
  - le bouton Envoyer cliquable
  - la chip "Revenir à *Cistus*" cliquable (referme le chat, garde la fiche)
  - le backdrop cliquable (réduit le chat)
  - la croix X ferme le chat et le chip
- Desktop : même parcours, vérifier le bouton Maximize/Minimize.
- Cas chat ouvert seul (sans fiche derrière) : aucun comportement régressé.

## Hors-scope

- Pas de refonte du système d'overlay.
- Pas de changement de la logique prefill / `community-chat:open`.
- Pas de touche au Sheet de la fiche espèce.

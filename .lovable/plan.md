

## Rendre le nom de la marche cliquable dans la modale de texte

### Contexte

Dans la modale de lecture d'un texte (onglet Empreinte > Textes ecrits), le nom de la marche (ex: "DEVIAT Point 06 Feverolles") est affiche en texte simple. L'utilisateur souhaite pouvoir cliquer dessus pour naviguer vers cette marche dans l'onglet "Marches" de l'exploration.

### Plan

**Fichier : `src/components/community/exploration/TextesEcritsSubTab.tsx`**

1. Ajouter une prop `onNavigateToMarche` au composant `TextesEcritsSubTab`, qui recevra un `marcheId` et permettra au parent de basculer vers l'onglet "Marches" avec le bon step selectionne.

2. Dans la modale (lignes 273-278), transformer le `<span>` du nom de marche en un `<button>` cliquable avec un style de lien (underline, curseur pointer, couleur interactive). Au clic :
   - Appeler `onNavigateToMarche(selectedTexte.marche_id)`
   - Fermer la modale

**Fichier : `src/components/community/ExplorationMarcheurPage.tsx`**

3. La ou `TextesEcritsSubTab` est instancie (dans l'onglet Empreinte/biodiversite), passer une callback `onNavigateToMarche` qui :
   - Trouve l'index du step correspondant au `marcheId` dans `explorationMarches`
   - Met a jour `activeStepIndex` via `setActiveStepIndex`
   - Bascule sur l'onglet global "marches" via `setActiveGlobalTab('marches')`

### Resultat

Cliquer sur le nom de la marche dans la modale fermera la modale et amenera l'utilisateur directement sur le bon point de marche dans l'onglet Marches.


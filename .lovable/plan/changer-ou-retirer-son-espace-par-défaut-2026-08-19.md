# Changer (ou retirer) son espace par défaut

## Ce qui se passe aujourd'hui

Le choix « Toujours ouvrir cet espace » (l'étoile du dialogue de bienvenue) est mémorisé dans le navigateur. À la connexion suivante, ce choix court-circuite complètement le dialogue : l'utilisateur est envoyé directement sur Jardin Monde DEVIAT et **le dialogue ne s'affiche plus jamais**. Il n'existe donc aucun moyen, dans l'interface, de changer d'espace par défaut ou de revenir au choix manuel. (À noter : « jardin principal » côté fiche propriété et « espace par défaut » sont deux réglages différents ; ici c'est le second qui déclenche la redirection.)

## Ce que je propose

### 1. Une entrée « Changer d'espace par défaut » dans le sélecteur d'espaces
Dans le menu déroulant en haut de page (présent dans Mon Espace, les jardins et les espaces partenaires) :
- une ligne en pied de menu : **« Choisir mon espace de démarrage… »** qui rouvre le dialogue de bienvenue, avec les étoiles cliquables pour désigner un autre espace ou décocher l'actuel ;
- quand un espace par défaut est actif, une petite étoile ambre s'affiche à côté de son nom dans la liste, avec le rappel **« Ouverture automatique »**.

### 2. Un rappel discret juste après la redirection automatique
Quand la connexion a redirigé automatiquement vers l'espace par défaut, un toast court apparaît :
« Ouvert automatiquement sur Jardin Monde DEVIAT — **Changer** », le lien rouvrant le sélecteur. Non bloquant, disparaît seul.

### 3. Une porte de sortie par l'URL
`/marches-du-vivant/connexion?choix=1` ignore la préférence et réaffiche toujours le dialogue — utile en support et pour un utilisateur bloqué.

## Détail technique

- `src/components/community/AppChoiceDialog.tsx` : exporter `setDefaultAppTarget` en plus de `getDefaultAppTarget`/`clearDefaultAppTarget`, et permettre l'ouverture du dialogue en mode « réglages » (pas de navigation forcée, focus sur les étoiles).
- `src/components/community/AppSwitcher.tsx` : ajouter le pied de menu « Choisir mon espace de démarrage… » qui monte `AppChoiceDialog` avec les données déjà fournies par `useUserAppsAccess` (propriétés + partenaires), et l'étoile ambre sur l'entrée par défaut.
- `src/pages/MarchesDuVivantConnexion.tsx` : lire `?choix=1` pour sauter le court-circuit de préférence ; après une redirection automatique, poser un flag de session lu par la page de destination pour afficher le toast « Changer ».
- Aucun changement de base de données, de route ni de RLS. La préférence reste locale au navigateur (clé `mdv:default-app`), le comportement de `is_main` côté propriété n'est pas touché.

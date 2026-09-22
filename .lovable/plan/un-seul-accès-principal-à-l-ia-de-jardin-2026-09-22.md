# Un seul accès principal à l’IA de Jardin

## Objectif

Dans tout l’espace Fréquence Jardin, conserver comme accès principal uniquement le bouton **IA de Jardin** placé dans le menu supérieur droit, sans retirer les outils contextuels ni modifier le fonctionnement de l’assistant.

## Constat vérifié

- La page commune `/propriete/:slug` affiche déjà le bouton **IA de Jardin** dans son menu supérieur droit.
- Cette même page monte aussi un second bouton flottant via l’assistant de la propriété. Comme cette page porte tous ses onglets — Portrait, J’observe, J’analyse, J’identifie, Je synthétise, Palette végétale, Atelier/Chantier, Capteurs, Clinique et Tour de Jardin — le doublon peut apparaître dans de nombreux écrans.
- Les boutons comme **Interroger l’IA sur cet ouvrage**, **Demander à l’IA de Jardin** depuis une sonde ou l’action de l’Herbier transmettent un contexte précis. Ils ne sont pas des doublons du bouton général et doivent rester.
- La console IoT autonome possède son propre assistant mais pas le bouton supérieur de la propriété : son accès principal doit donc être conservé.

## Modification

1. Masquer uniquement le bouton flottant de l’assistant monté dans `/propriete/:slug`, sur ordinateur comme sur mobile.
2. Garder l’assistant monté afin que le bouton supérieur droit continue de l’ouvrir, avec tous ses contextes, son historique et ses cadrages.
3. Ne pas toucher aux boutons contextuels des ouvrages, de l’Herbier, des sondes et des analyses.
4. Ne pas modifier les pages publiques Fréquence Jardin ni les consoles autonomes lorsqu’elles ne présentent pas le bouton supérieur droit.

## Vérification

- Parcourir chaque onglet de l’espace propriété et confirmer qu’un seul accès principal est visible en haut à droite.
- Ouvrir l’assistant depuis ce bouton et vérifier que le panneau fonctionne toujours.
- Ouvrir les actions contextuelles d’un ouvrage, de l’Herbier et d’une sonde pour confirmer qu’elles cadrent toujours l’assistant.
- Contrôler les vues ordinateur et mobile, ainsi que l’Atelier/Chantier en plein écran.
- Vérifier qu’aucun autre bouton, contenu ou comportement n’a changé.

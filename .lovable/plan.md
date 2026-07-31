## Constat (vérifié dans le code)

- L'IA de Jardin est bien montée : `ProprieteEspace.tsx` (ligne 463) rend `<ProprieteChatBotMount />`.
- Son seul point d'entrée est le bouton flottant générique de `ChatBot.tsx` : une bulle verte `MessageCircle` de 56px, sans libellé, en bas à droite.
- Ce bouton passe par `DraggableFab` avec l'identifiant **`chatbot-global`**, le même que celui du chatbot Communauté (`CommunityChatBotMount`). La position est persistée dans `localStorage` sous `fab-pos:chatbot-global` : une position mémorisée ailleurs dans l'app se réapplique ici, et rien n'indique visuellement de quoi il s'agit.
- Le bas-droite de l'écran Propriété est déjà occupé par d'autres cartes flottantes (barre GPS `InlineGpsBar` en `z-[1200]`, inspecteur d'objet), donc la bulle peut se retrouver masquée ou confondue.

Je n'ai pas pu reproduire visuellement (la session de prévisualisation redirige vers la page de connexion), donc la première étape du chantier est une vérification en navigateur connecté.

## Ce qu'on fait

1. **Vérifier d'abord** — inspection navigateur sur `/propriete/jardin-monde-deviat` avec session : le bouton est-il rendu, à quelles coordonnées, masqué par quoi ? On adapte si le constat diffère.

2. **Identité propre au FAB « IA de Jardin »**
   - Identifiant `DraggableFab` dédié (`ia-jardin-<proprieteId>`) pour ne plus hériter d'une position venue d'un autre écran.
   - Bouton en pilule plutôt qu'en bulle nue : icône feuille/sparkle botanique + libellé « IA de Jardin », palette forêt profonde + liseré or (tokens `--ds-forest-deep` / `--ds-gold`), halo respirant discret.
   - Position par défaut décalée (au-dessus de la barre GPS) pour éviter le chevauchement avec les cartes flottantes existantes.

3. **Un second point d'entrée non flottant**
   - Bouton « IA de Jardin » ancré dans l'en-tête de l'espace Propriété (près des onglets), qui ouvre le même chatbot via un petit bus d'ouverture. Ainsi, même si le FAB est déplacé ou masqué, l'accès reste évident.

4. **Première ouverture pédagogique**
   - Au premier affichage sur une propriété, une bulle d'amorce (une seule fois, mémorisée localement) : « Je connais ce jardin — activez les contextes qui vous intéressent. »

5. **Contrôle final** — vérification en navigateur : FAB visible, non superposé, ouverture par les deux entrées, console de contextes fonctionnelle.

## Détails techniques

- Fichiers concernés : `src/components/chatbot/ChatBot.tsx` (props `fabId`, `fabLabel`, `fabVariant`), `src/components/propriete/chatbot/ProprieteChatBotMount.tsx`, `src/pages/ProprieteEspace.tsx` (bouton d'en-tête), petit module d'ouverture type `proprieteChatOpen.ts`.
- Aucun changement côté edge function `propriete-chat` ni côté logique de contextes : le travail reste présentation et accès.
- Le comportement du chatbot Communauté reste inchangé (les nouvelles props sont optionnelles).

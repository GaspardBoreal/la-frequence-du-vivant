## Le problème (confirmé dans le code)

Dans `src/pages/ProprieteEspace.tsx` :

- `handleTabChange` (l. 295-298) fait `setTab(value)` puis **un seul** `requestAnimationFrame(scrollToDiagnostic)`. Le scroll est donc calculé alors que le nouvel onglet vient à peine d'être monté, avant que ses données (biodiversité, cartes, photos, blocs lazy) n'aient fixé la hauteur réelle.
- Deux conséquences visibles :
  1. **Contenu court** (ex. « Je synthétise » avant chargement) → le document n'est pas assez haut, le navigateur *clampe* le scroll : on n'atteint jamais la position de la copie 2.
  2. **Contenu qui grandit après coup** → la page se décale sous le viewport une fois les données arrivées.
- L'onglet « J'observe » marche parce que son contenu est immédiatement long : la position cible est atteignable dès la première frame.

## Correction proposée

1. **Scroll persistant au lieu d'une frame unique**
   Remplacer le `requestAnimationFrame` unique par un helper qui rejoue le repositionnement pendant une courte fenêtre (≈ 600 ms : frames + relances à 60/150/300/600 ms), en s'arrêtant dès que la position cible est atteinte à quelques pixels près, ou si l'utilisateur scrolle lui-même entre-temps (annulation propre, pas de « scroll qui se bat » avec l'usager).

2. **Hauteur minimale des panneaux d'onglets**
   Donner à chaque `TabsContent` une hauteur minimale (`min-h-[calc(100vh-8rem)]`) pour que la position d'ancrage soit **toujours** atteignable, quel que soit le contenu (onglet vide, en chargement, ou court). C'est ce qui garantit un cadrage identique à la copie 2 sur les 6 onglets.

3. **Ancre normalisée**
   Utiliser `scroll-margin-top` sur `#diagnostic` (valeur = hauteur top-bar, 64 px) et centraliser le calcul, pour que hero, onglets et événement `propriete:goto-tab` partagent exactement la même cible.

4. **Robustesse au chargement asynchrone**
   Observer la hauteur du conteneur de diagnostic (`ResizeObserver`) pendant la fenêtre de repositionnement : si la hauteur change (données arrivées), on rejoue une dernière fois le scroll — puis on se désabonne.

## Détails techniques

- Fichier unique modifié : `src/pages/ProprieteEspace.tsx`.
- Aucun changement de données, de requêtes ou de logique métier : uniquement navigation/présentation.
- Respect de `prefers-reduced-motion` conservé (`behavior: 'auto'`).
- Annulation du repositionnement sur interaction utilisateur (`wheel`, `touchstart`, `keydown`) pour ne pas gêner la lecture.

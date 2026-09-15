# iPhone : le défilement bloqué dans la Console de contextes

## Ce qui se passe

La Console de contextes s'ouvre depuis le menu du trombone (📎) de l'Assistant. Dans le code actuel, choisir « Console de contextes » ouvre bien la fenêtre **mais empêche explicitement le menu de se refermer** (`onSelect` avec `preventDefault`). Le menu reste donc « ouvert » de façon invisible, et tant qu'il l'est, la bibliothèque du menu **verrouille le défilement de la page entière** (mécanisme anti-scroll intégré). Sur ordinateur, la molette dans une zone défilante passe quand même ; sur iPhone, le verrou capte le geste tactile et la liste des contextes reste figée.

Deux facteurs aggravants dans la fenêtre elle-même :
- la hauteur est limitée à `88%` de la fenêtre, une mesure qui sur Safari iOS inclut la zone masquée par la barre d'adresse : le bas de la liste peut se retrouver hors écran ;
- la zone défilante n'a ni confinement du défilement ni gestion tactile explicite, donc le geste « fuit » vers la page en dessous.

Le même défaut touche les autres entrées du menu qui ouvrent une surface (pièce jointe, liste d'espèces) : elles laissent aussi le menu ouvert.

## Correction proposée

1. **Refermer le menu du trombone quand on ouvre la Console** : le menu devient piloté par un état, et chaque choix le ferme avant d'ouvrir la fenêtre demandée. Le verrou de défilement est alors relâché et le doigt reprend la main. Même traitement pour les autres entrées qui ouvrent un sélecteur de fichier ou de photo.
2. **Hauteur fiable sur iPhone** : la fenêtre se cale sur la hauteur réellement visible de l'écran (unité dynamique), avec un repli pour les navigateurs anciens, et respecte la zone sûre du bas de l'iPhone.
3. **Défilement propre dans la liste** : confinement du défilement à la zone de la liste, défilement tactile fluide, et en-tête qui ne mange pas toute la hauteur (le récapitulatif « Transmis » devient lui-même défilable si trop long).

## Détails techniques

- `src/components/chatbot/ChatBot.tsx` : `DropdownMenu` passé en contrôlé (`open` / `onOpenChange`) ; les `onSelect` cessent d'appeler `preventDefault` pour l'entrée Console, ou ferment explicitement le menu avant `setConsoleOpen(true)` / `attachSpeciesPool()` / ouverture du sélecteur de fichiers (ouverture différée d'un tick pour laisser Radix restaurer `pointer-events` et le scroll du body).
- `src/components/chatbot/ContextConsole.tsx` : panneau en `max-h-[88dvh]` avec repli `max-h-[88%]`, `pb-[env(safe-area-inset-bottom)]` ; zone liste en `overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y` ; en-tête `max-h-[45dvh] overflow-y-auto` pour garantir de la place à la liste.
- Aucune modification de logique métier, de base de données ni de contextes envoyés au modèle.

## Vérification

Sur iPhone (Safari et Chrome) : ouvrir l'Assistant, 📎 → Console de contextes, faire défiler la liste jusqu'au dernier groupe, activer/désactiver un contexte, fermer, puis vérifier que la page derrière défile toujours normalement. Contrôle identique sur ordinateur pour absence de régression.

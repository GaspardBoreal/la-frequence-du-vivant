# Correctif : lecture des sons lente et coupée sur « Attribuer les œuvres »

## Constat
- Chaque vignette de son a son propre petit lecteur, plus large que la vignette et chargé « à froid ». Au clic, le navigateur doit alors découvrir le fichier avant de jouer.
- Plusieurs lecteurs peuvent tourner en même temps, et la page se redessine à chaque sélection ou rechargement de la liste : la lecture en cours peut être interrompue.
- 4 sons sont de gros fichiers WAV (jusqu'à 30 Mo, 18 Mo en moyenne), donc forcément plus lents à démarrer. Les 47 autres (MP3, M4A, WebM) sont légers, sous 7 Mo.

## Correctif
1. **Un seul lecteur pour toute la page**, placé au-dessus de la barre du bas et jamais redessiné : la lecture continue quand vous sélectionnez des vignettes ou attribuez des œuvres.
2. **Bouton Lecture/Pause sur la vignette** du son, séparé de la sélection : toucher le bouton joue le son, toucher ailleurs le sélectionne. Un indicateur « chargement… » s'affiche tant que le son n'a pas démarré.
3. **Mini-lecteur collé en bas** : titre, marche, barre d'avancement déplaçable, durée, bouton fermer. Lancer un autre son arrête le précédent.
4. **Préchargement léger** des informations du son au survol ou au premier toucher, pour un démarrage plus rapide. Les WAV affichent leur taille (par exemple « WAV · 30 Mo ») pour prévenir que le démarrage sera plus long.
5. Pas de rechargement automatique de la liste quand vous revenez sur l'onglet : il pouvait redessiner la page pendant l'écoute.

## Détails techniques
- `src/pages/AdminAttributionOeuvres.tsx` : suppression des `<audio controls>` par vignette ; un `<audio>` unique géré par un `useRef` au niveau de la page, avec un état `{ playingId, loading, currentTime, duration }` alimenté par les événements `waiting`, `canplay`, `timeupdate` et `ended`.
- Bouton de lecture avec `stopPropagation` pour ne pas sélectionner la vignette ; `preload="metadata"` au lancement.
- La fonction de liste renvoie aussi `format_audio` et `taille_octets`, pour afficher le badge du format et de la taille.
- `refetchOnWindowFocus: false` sur la liste des œuvres.

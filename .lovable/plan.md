# Analyse critique de la proposition "Jardin Punk" — et plan d'adaptation

## Ce que la proposition a juste

- **Approche itérative en 4 couches** (données → motion → 3D → son) : c'est la bonne méthode pour ne pas faire diverger l'IA, et elle colle à notre architecture modulaire.
- **Framer Motion avant GSAP** : exact, c'est déjà ce que notre runtime charge en UMD (`framer-motion@11.11.17`).
- **Isoler la 3D en arrière-plan z-négatif** : bon réflexe d'archi.
- **Sonification liée au viewport** : pertinent pour la dimension bioacoustique du projet.

## Ce qui ne marchera pas tel quel dans notre contexte

La proposition est écrite pour un projet React vierge créé par Lovable. Or notre scénographie tourne dans un **iframe sandboxé** (`ScenographyRuntime.tsx` + `scenographyRuntimeHtml.ts`) avec un runtime déjà figé. Trois problèmes durs :

1. **React Three Fiber ne se charge pas en UMD/CDN.** R3F est conçu pour un bundler (réconciliateur custom, hooks, JSX `<mesh>`). Dans notre iframe, on ne peut pas faire `import` ni `npm add`. La seule voie réaliste pour la 3D : **Three.js pur en UMD** (`three.min.js`), monté dans un `useEffect` sur un `<canvas>` classique. On garde l'esprit "réseau mycélien", on perd la syntaxe déclarative R3F.
2. **Le JSON de 120 espèces n'a pas à être "chargé"** : nos données sont déjà injectées via `postMessage` dans `window.__SCENO_DATA__` (espèces dédoublonnées + photos + waypoints + testimonies). L'étape 1 du prompt original est donc à réécrire en "consomme `data.species` et `data.photos`".
3. **Web Audio + autoplay** : un iframe `sandbox="allow-scripts"` peut faire de l'audio, mais le navigateur bloque tant qu'il n'y a pas eu d'interaction utilisateur. Il faut un overlay "Entrer dans le jardin" qui débloque l'`AudioContext`, sinon silence garanti sur Chrome/Safari.

## Autres angles morts à corriger

- **Pas d'`AnimatePresence` mentionné** alors que c'est ce qui rend l'apparition/disparition fluide au scroll — à ajouter étape 2.
- **"Rareté" dans le JSON** : notre modèle n'a pas de champ `rarete`. On peut le **dériver** : espèce vue par 1 seul marcheur OU `observations_count = 1` OU absente de `marcheur_observations` (uniquement iNat) = rare. À documenter dans le template.
- **Performance** : 120 espèces × particules 3D + photos animées + audio = risque de jank mobile. Il faut **plafonner** (ex. 60 particules max, lazy-load photos via `IntersectionObserver`, `prefers-reduced-motion` respecté).
- **Fallback données vides** : DEVIAT a actuellement 0 espèce remontée (bug RPC en cours de fix). Le template doit gérer gracieusement `species.length === 0` avec un état poétique au lieu d'un écran noir.
- **Accessibilité** : bouton mute, respect `prefers-reduced-motion`, alt-text sur les photos. Aucun mot là-dessus dans la proposition.

## Plan d'implémentation adapté (4 itérations, dans le template DEVIAT)

Tout se passe dans `src/lib/scenography/deviatJardinMondeTemplate.ts` (code TSX stocké en BDD, transpilé Babel, exécuté dans l'iframe). On ne touche **pas** au runtime sauf pour charger Three.js UMD à l'étape 3.

### Itération 1 — Socle données (template uniquement)
- Consommer `data.species` et `data.photos` déjà injectés.
- Dériver `isRare` : `(sp.observations_count ?? 0) <= 1 || !sp.has_marcheur_obs`.
- Rendu de fallback poétique si `species.length === 0`.
- Grille brute provisoire pour valider le binding.

### Itération 2 — Jardin Punk (Framer Motion)
- Remplacer la grille par layout asymétrique : positions `x/y` dérivées d'un hash du `scientificName` (déterministe → stable entre renders).
- Tailles variables (3 buckets : S/M/L selon `observations_count`).
- `motion.div` + `whileInView` + `AnimatePresence` pour apparition au scroll.
- Nom de l'espèce en surimpression au survol via `whileHover`.
- Respect `useReducedMotion()`.

### Itération 3 — Mycélium 3D (Three.js pur, pas R3F)
- Ajouter `<script src="https://unpkg.com/three@0.160/build/three.min.js">` dans `scenographyRuntimeHtml.ts` (seule modification du runtime).
- Dans le template : `<canvas>` en `fixed inset-0 -z-10`, monté via `useEffect`.
- Une particule `Points` par espèce (max 60), positions sphériques aléatoires.
- Lignes `LineSegments` entre particules à distance < seuil → effet réseau.
- Rotation très lente (`requestAnimationFrame` + `prefers-reduced-motion` kill switch).
- Couleur de particule via `hashColor(scientificName)` déjà exposé par notre runtime.

### Itération 4 — Souffle bioacoustique (Web Audio API)
- Overlay d'entrée "Pénétrer dans le jardin" qui `resume()` l'`AudioContext`.
- `IntersectionObserver` sur chaque carte espèce → `OscillatorNode` court (200ms, sinus, fréquence dérivée du hash du nom).
- Espèces rares → harmonique mineure + reverb léger (`ConvolverNode` ou simple delay).
- Bouton mute persistant en haut à droite.

## Sections techniques

### Fichiers touchés
- `src/lib/scenography/deviatJardinMondeTemplate.ts` — réécriture complète du TSX template (4 passes).
- `src/components/scenography/scenographyRuntimeHtml.ts` — **uniquement** ajout du `<script>` Three.js UMD à l'étape 3.
- `src/components/scenography/ScenographyRuntime.tsx` — **aucune** modification (le bandeau "données vides" est déjà en place).
- Aucune migration SQL : le RPC corrigé précédemment suffira dès qu'il sera approuvé.

### Garde-fous
- Plafond 60 particules 3D, lazy photos, `prefers-reduced-motion` à chaque étape.
- Fallback texte si Three.js échoue à charger (try/catch autour du `new THREE.Scene()`).
- Bouton mute + overlay audio obligatoires pour respect autoplay policies iOS/Safari.

### Ce qu'on ne fait PAS
- Pas de R3F (incompatible iframe sandbox sans bundler).
- Pas de GSAP (Framer Motion suffit et est déjà chargé).
- Pas de chargement de JSON externe (données déjà piped via postMessage).
- Pas de refonte du système de scénographie : seul le template DEVIAT change.

## Question avant de coder

Souhaites-tu que je **fasse les 4 itérations d'un coup** dans un seul commit (rapide mais boîte noire si bug), ou **une itération à la fois** avec validation visuelle entre chaque (plus long mais conforme à l'esprit de la proposition originale) ?

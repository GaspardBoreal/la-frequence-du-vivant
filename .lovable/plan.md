
# Inciter le marcheur à découvrir ses 3 fréquences du jour

## Problème
Aujourd'hui, les 3 catégories (Géopoétique · Biodiversité · Bioacoustique) sont reléguées en bas à droite sous forme de 3 petites icônes ternes. Un nouveau marcheur ne sait pas qu'il y a 3 contenus à découvrir, ni comment naviguer entre eux. Le geste « suivant/précédent » n'est ni suggéré ni récompensé.

## Intention design
Transformer la carte « Ma Fréquence du jour » en un **triptyque révélé progressivement** : le marcheur sent qu'il y a 3 facettes, il est tenté de les feuilleter, et chaque transition est belle.

## Proposition (uniquement frontend, fichier `FrequenceWave.tsx`)

### 1. Eyebrow enrichi — signaler qu'il y a 3 facettes
Au lieu de `● MA FRÉQUENCE DU JOUR`, afficher :
```
●  MA FRÉQUENCE DU JOUR     ·     1 / 3  Géopoétique
```
Le compteur `1/3` est la promesse implicite : « il y en a deux autres ».

### 2. Flèches `←  →` élégantes encadrant la citation
Deux chevrons fins (Lucide `ChevronLeft` / `ChevronRight`) positionnés verticalement centrés, en dehors du bloc citation sur desktop, en bas sur mobile. Au repos : opacité 40 %, fines (stroke 1.5). Au hover : opacité 100 %, halo doux émeraude, micro-translation de 2px dans le sens de la navigation.

Sur mobile : swipe gauche/droite (drag framer-motion) en plus des flèches.

### 3. Indicateur de progression — 3 traits horizontaux
Sous la citation, remplacer les 3 icônes empilées à droite par **3 traits fins centrés** (pattern Apple / Stories Instagram) :
```
━━━━  ────  ────
```
- trait actif : plein, gradient émeraude→cyan, label catégorie visible dessous
- traits inactifs : 30 % opacité, label estompé
- clic sur un trait = saut direct (accessibilité préservée)

### 4. Pulse d'invitation au premier affichage (onboarding silencieux)
Si `localStorage` n'a pas la clé `freq_discovered_all` :
- Pulse doux toutes les 4s sur la flèche `→` (scale 1 → 1.08 → 1, halo émeraude)
- Petite légende fugace **« Faites défiler vos 3 fréquences »** sous les indicateurs, opacité 60 %, qui disparaît dès le premier clic/swipe
- Une fois les 3 facettes vues, on stocke `freq_discovered_all = true` → la pulsation et la légende disparaissent à jamais

### 5. Auto-rotation très lente (optionnelle, désactivée si interaction)
Toutes les 12 s, rotation automatique vers la facette suivante avec la même `AnimatePresence` (fade + petit y). S'arrête définitivement dès que le marcheur clique/swipe (respect de l'attention).

### 6. Transitions
- Crossfade + glissement horizontal léger (entrée +20px, sortie −20px) selon le sens de navigation
- Le gradient conique en arrière-plan change subtilement de teinte selon la catégorie active (vert forêt, vert eau, ambre acoustique) — ancrage sensoriel de chaque fréquence

## Détails techniques
Modifications confinées à `src/components/community/FrequenceWave.tsx` :
- Remplacer `setActiveTab(key)` direct par `goTo(index)` / `next()` / `prev()` avec mémorisation du sens (`direction: 1 | -1`) pour orienter l'animation
- Ajouter `motion.div` wrapper avec `drag="x"` + `dragConstraints` pour le swipe mobile
- Ajouter `useEffect` d'auto-rotation avec `clearInterval` au premier user-event
- Ajouter `localStorage` flag `freq_discovered_all` mis à `true` quand `Set<Categorie>` visités atteint 3
- Aucune modification DB, aucun nouveau hook, aucun impact sur les autres tabs

## Hors-scope
- Pas de changement du contenu des citations
- Pas de changement de la logique de sélection « du jour »
- Pas de modification de `ProgressionCard` ni des quick actions

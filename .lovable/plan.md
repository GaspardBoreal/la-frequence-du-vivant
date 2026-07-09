# Refonte du mode Immersif — 3 directions radicales

Le mode Immersif actuel est un simple diaporama Ken-Burns (photo + nom, 4,5s/espèce). C'est joli mais générique : rien ne révèle **la spécificité du vivant collecté sur les points de marche** (géographie, densité, familles, rareté, moment de collecte, marcheur observateur).

Voici **3 partis pris radicalement différents**, ciblant chacun une audience distincte. Une seule sera implémentée après ton choix.

---

## Direction A — « CATHÉDRALE DU VIVANT » (contemplatif · muséal · grand public premium)

**Cible :** grand public, financeurs, élus, visiteurs d'exposition. Public qui doit ressentir la **puissance émotionnelle** du corpus.

**Principe :** transformer l'écran en installation muséale immersive. Une seule espèce à la fois, mais théâtralisée comme dans un planétarium ou une expo Van Gogh immersive.

**Mécaniques clés :**
- Photo plein écran avec **parallaxe multi-couches** (fond flouté zoomé lent + sujet net qui respire).
- **Halo lumineux réactif** derrière le sujet, teinté par la famille taxonomique (émeraude pour flore, or pour insectes, cyan pour oiseaux, argent pour champignons).
- **Typographie XXL animée lettre par lettre** (nom vernaculaire) façon générique de film, avec le nom scientifique qui apparaît en filigrane.
- **Voix off générée** (option, via edge existante `eleven-tts`) qui murmure le nom + la famille (désactivable).
- **Constellations de points GPS** en overlay minimaliste bas-droit : la carte de la marche s'allume à l'endroit précis où l'espèce a été observée, avec une pulsation.
- **Chapitrage par « mouvements »** : le carrousel n'est pas plat, il est découpé en actes (« Les Racines », « Les Ailés », « Les Discrets »…) avec des cartons de transition noirs typographiés.
- **Ambient soundscape** subtil (nappe sonore continue qui module selon le règne).

**Ce que ça démontre :** la **densité poétique** et la valeur patrimoniale du corpus. Chaque espèce = un tableau.

**Complexité :** ★★★☆☆ (surtout travail de composition et sound design léger).

---

## Direction B — « SCAN VIVANT — DATA IMMERSION » (data-driven · scientifique · disruptif)

**Cible :** scientifiques, journalistes, partenaires institutionnels, sentinelles engagées. Public qui veut **comprendre** ce que le corpus révèle du territoire.

**Principe :** ne plus montrer *une* espèce mais **la structure entière du vivant collecté**, en flux continu type « bloomberg de la biodiversité ». L'immersion vient de la **densité informationnelle chorégraphiée**, pas de l'esthétisme photo.

**Mécaniques clés :**
- **Grille dynamique 5×N** de vignettes photo qui défilent en flux vertical (façon mur de contrôle NASA), 30-50 espèces visibles simultanément.
- Une vignette est **« happée » toutes les 3s** : elle explose en plein écran avec **fiche data live** :
  - Chips famille / règne / fonction éco.
  - **Mini-carte de la marche** avec les waypoints où l'espèce a été vue (pulsation GPS).
  - **Barre de fréquence** : nombre d'observations vs moyenne du corpus.
  - **Badge « pionnière »** si observée par ≤2 marcheurs, ou **badge « emblématique »** si dans le top 10 %.
  - Nom du/des **marcheur(s) contributeur(s)** (initiales anonymisées si besoin).
- **Compteur global temps réel** en haut : `55 espèces · 12 familles · 8 fonctions écologiques · 3 km parcourus`.
- **Transitions cinétiques** type Framer Motion `layoutId` (la vignette qui vole depuis la grille vers le plein écran).
- **Bande sonore data** : clics discrets, pulsations synchronisées aux apparitions.
- **Timeline horizontale** en bas qui égrène les observations dans l'ordre chronologique de collecte.

**Ce que ça démontre :** la **rigueur scientifique**, la **couverture territoriale**, le **collectif de marcheurs**. On voit que ce n'est pas une jolie liste, c'est un **inventaire vivant**.

**Complexité :** ★★★★☆ (chorégraphie layout + data fetch enrichis).

---

## Direction C — « TRAVERSÉE SENSORIELLE » (narratif · immersif profond · gen Z / éducatif)

**Cible :** jeunes adultes, réseaux sociaux, publics scolaires/lycéens, expériences événementielles (festival, projection). Public qui veut **vivre** la marche, pas la regarder.

**Principe :** on **rejoue la marche** en temps compressé. L'utilisateur devient marcheur : il traverse le parcours GPS, et les espèces **surgissent** au moment et à l'endroit où elles ont été rencontrées.

**Mécaniques clés :**
- **Fond plein écran = vue carte satellite/relief animée** (Mapbox/MapLibre) qui suit un **travelling GPS** le long du tracé de la marche (2-3 min pour toute la marche).
- Chaque waypoint = **apparition théâtrale d'une ou plusieurs espèces** :
  - La photo émerge en 3D depuis le point GPS (effet « pop-up polaroid » avec rotation légère).
  - Le nom s'écrit à la main (SVG stroke animation).
  - Halo coloré selon règne, particules ambiantes (feuilles / eau / lucioles selon habitat).
- **Boussole + horloge** en overlay coin haut : on voit *quand* et *où* dans la marche on est.
- **Bande verticale gauche** : mini-frise des espèces déjà « rencontrées » qui s'empile.
- **Vitesse contrôlable** (pause / ×1 / ×2 / rembobinage).
- **Fin de traversée = mandala final** : toutes les espèces s'organisent en constellation circulaire autour du tracé complet, avec compteur `Vous avez traversé 55 formes de vivant`.
- **Compatibilité social** : screenshots automatiques exportables du mandala final.

**Ce que ça démontre :** la **spatialité** et le **récit incarné** — la biodiversité **vit à un endroit précis**, pas dans une base abstraite. La marche est une aventure sensible.

**Complexité :** ★★★★★ (nécessite carte animée + timeline GPS synchronisée + intégration waypoints).

---

## Tableau récap

| Direction | Émotion dominante | Cible | Force démonstrative | Complexité |
|---|---|---|---|---|
| **A · Cathédrale** | contemplation | grand public / mécènes | poésie & valeur patrimoniale | ★★★ |
| **B · Scan Vivant** | vertige data | scientifiques / presse | rigueur & couverture territoriale | ★★★★ |
| **C · Traversée** | immersion incarnée | jeunes / événementiel | spatialité & récit de marche | ★★★★★ |

---

## Question

**Quelle direction veux-tu que je prototype d'abord ?**

Tu peux aussi en choisir **deux** (elles peuvent coexister comme sous-modes du mode Immersif, avec un mini-sélecteur en entrée).

Une fois ton choix confirmé, je te ferai un plan d'implémentation détaillé (fichiers touchés, hooks nécessaires, ordre de build) avant de coder.

# Refonte "Votre Impact" — Empreinte du Marcheur

Remplacer le panneau plat actuel (territoires pionniers + familles + indice) par une **expérience Stories verticales swipables**, mobile-first, type Spotify Wrapped / Strava Year-in-Review, déclenchée depuis l'onglet "Votre impact".

---

## 1. Le déclencheur (ce qui reste visible inline)

Dans la carte du marcheur, l'onglet **"Votre impact"** affiche désormais une **carte-vignette teaser** ultra-condensée :

```
┌─────────────────────────────────────────┐
│  ◉ Empreinte vibrante (anim. pulse)     │
│                                         │
│   Indice Sentinelle  ▸  72/100          │
│   ▰▰▰▰▰▰▰▱▱▱  Voix du Vivant           │
│                                         │
│   [3 badges miniatures côte à côte]     │
│                                         │
│   ▶ Découvrir mon empreinte             │
└─────────────────────────────────────────┘
```

Tap sur la carte → ouvre les **Stories plein écran** (drawer mobile, modal centré desktop).

---

## 2. L'Empreinte écologique pulsante (métaphore visuelle centrale)

Une **forme SVG vivante** au cœur de chaque story, composée de 4 anneaux concentriques pulsants qui réagissent aux données du marcheur :

```text
        ╭─── Anneau 4 : Sensibilité ─────╮
       │   (bio-ind / aux / EEE)         │
       │  ╭─── Anneau 3 : Témoignage ──╮ │
       │  │  (textes + voix + récits)  │ │
       │  │ ╭── Anneau 2 : Écoute ──╮ │ │
       │  │ │  (audios)              │ │ │
       │  │ │ ╭─ Anneau 1 : Voir ─╮ │ │ │
       │  │ │ │   (photos)        │ │ │ │
       │  │ │ ╰────  ◉  ─────────╯ │ │ │
       │  │ ╰──────────────────────╯ │ │
       │  ╰─────────────────────────╯  │
        ╰───────────────────────────────╯
```

- Chaque anneau **épaissit** selon le volume contribué dans cette dimension.
- Chaque anneau **pulse** (animation `pulse` lente) à un rythme proportionnel à la fréquence de contribution.
- Les **bio-indicateurs** ajoutent des **points lumineux verts** sur l'anneau 4.
- Les **auxiliaires** ajoutent des **points dorés**.
- Les **EEE détectées** ajoutent des **points rouges clignotants** (signal d'alerte précieux).
- Couleurs en HSL via tokens : `--primary`, `--accent`, `amber`, `rose` (déjà dans le DS Forêt Émeraude).

C'est **la signature visuelle unique** de chaque marcheur — son empreinte n'a la même forme que celle d'aucun autre.

---

## 3. Les 6 Stories swipables (verticales, plein écran)

Format Instagram Stories : barre de progression en haut, swipe horizontal, tap pour avancer, durée auto-play 5s par story (pause au tap-hold).

### Story 1 — "Votre Empreinte"
Plein écran : l'Empreinte pulsante au centre, animée d'entrée (build progressif des anneaux). Sous-titre poétique : *"Voici la trace que vous laissez dans le vivant."*

### Story 2 — "Indice de Sentinelle"
Grosse jauge circulaire 0-100 + libellé évolutif :
- 0-25 : *Marcheur en éveil*
- 26-50 : *Explorateur attentif*
- 51-75 : *Voix du Vivant*
- 76-100 : *Sentinelle de la biodiversité*

Calcul : pondère **diversité** (5 piliers : photo / audio / texte / témoignage / espèces sensibles) plutôt que volume. Privilégie celui qui couvre tous les piliers à celui qui en spamme un seul.

### Story 3 — "Vos Familles du Vivant"
Anneau central + cartes-espèces empilées qui défilent (oiseaux, plantes, champignons, etc.) avec compteur animé. Mise en avant des **3 espèces les plus rares observées**.

### Story 4 — "Vos Détections Précieuses" ⭐
Le cœur du panel, dédié aux espèces sensibles :
- 🟢 **N bio-indicateurs** détectés → *"Vous lisez la santé du milieu"*
- 🟡 **N auxiliaires** détectés → *"Vous reconnaissez les alliés"*
- 🔴 **N EEE signalées** → *"Vous protégez l'écosystème"*

Chaque catégorie pulse avec sa couleur. Tap sur une catégorie → liste des espèces détectées.

### Story 5 — "Vos Badges" (collection rare)
Grille 3×N des badges débloqués, avec ceux **non débloqués grisés** pour donner envie. Catégories proposées :

| Badge | Condition |
|---|---|
| Œil du Vivant | 1ère photo |
| Voix du Vivant | 1er audio |
| Plume du Vivant | 1er texte |
| Témoin du Vivant | 1er témoignage |
| Quintessence | 1 contribution dans chacun des 5 piliers |
| Lecteur de milieu | 3 bio-indicateurs détectés |
| Allié du vivant | 5 auxiliaires détectés |
| Sentinelle vigilante | 1 EEE signalée |
| Garde-frontière | 5 EEE signalées |
| Pionnier | 1 territoire pionnier |
| Cartographe | 5 territoires pionniers |
| Polyglotte du vivant | 5 familles taxonomiques différentes |
| Constance | 3 marches consécutives avec contribution |

Chaque badge a une icône Lucide + animation `scale-in` au déblocage.

### Story 6 — "Votre Prochain Palier"
Toujours afficher l'objectif suivant pour la dopamine :
- *"Plus que 2 audios pour devenir Voix du Vivant"*
- *"1 EEE détectée vous fait gagner le badge Sentinelle vigilante"*

CTA en bas : **[Partager mon empreinte]** → génère un PNG de l'Empreinte + score, partageable WhatsApp/Instagram (déjà mémo "WhatsApp strategy" existante).

---

## 4. Architecture technique

### Calcul des stats sensibles (front-only au début)
- Croiser `marcheur.speciesObserved` avec `src/data/species-knowledge-base.json` (déjà existant, contient `primary: bio-indicateur | auxiliaire | eee`).
- Hook `useMarcheurSensibleSpecies(speciesObserved)` → retourne `{ bioIndicateurs[], auxiliaires[], eee[] }`.
- Calcul des badges : pure fonction `computeMarcheurBadges(marcheur, sensibleSpecies, snapshots)` → liste `{ id, unlocked, label, condition }`.

### Composants à créer (`src/components/community/exploration/impact/`)
- `ImpactTeaserCard.tsx` — vignette inline (remplace `ImpactSubTab` actuel)
- `ImpactStoriesViewer.tsx` — orchestrateur Stories (barre progression, swipe, autoplay, framer-motion)
- `EmpreinteVivante.tsx` — SVG anneaux pulsants
- `stories/StoryEmpreinte.tsx`
- `stories/StorySentinelle.tsx`
- `stories/StoryFamilles.tsx`
- `stories/StoryDetections.tsx`
- `stories/StoryBadges.tsx`
- `stories/StoryPalier.tsx`

### Hooks
- `useMarcheurSensibleSpecies.ts` — classification bio/aux/EEE
- `useMarcheurBadges.ts` — computation + memo
- `useImpactStories.ts` — state machine (currentIndex, autoplay, pause)

### Partage (Story 6 CTA)
- `html-to-image` (déjà dispo dans le projet ?) ou `dom-to-image` pour snapshot l'Empreinte → blob → Web Share API.

### Pas de migration DB nécessaire pour la V1
La classification s'appuie sur le JSON existant + données déjà chargées (`marcheur.stats`, `speciesObserved`, `snapshots`). Une V2 pourrait persister `marcheur_badges_unlocked` dans Supabase pour l'historique.

---

## 5. Mobile-first & Desktop

- **Mobile** : drawer plein écran (vh:100), swipe horizontal natif, gestures Framer Motion.
- **Desktop** : modal centré 420×740 (ratio téléphone), navigation flèches clavier + clic sur les côtés.
- Toutes animations respectent `prefers-reduced-motion`.
- Couleurs via tokens HSL du DS (Papier Crème / Forêt Émeraude) — **aucun** hex direct dans les composants.

---

## 6. Mémoire à enregistrer après implémentation

- `mem://features/community/marcheur-impact-stories-logic` — Stories swipables (Empreinte, Sentinelle, Détections, Badges, Palier) basées sur diversité × sensibilité.
- `mem://features/community/marcheur-badges-catalog` — Liste canonique des 13 badges et leurs conditions.

---

## Livrable de cette itération

V1 fonctionnelle complète : teaser inline + 6 stories swipables + Empreinte SVG animée + 13 badges + classification bio/aux/EEE. Aucun changement DB. Partage social en bonus si temps.

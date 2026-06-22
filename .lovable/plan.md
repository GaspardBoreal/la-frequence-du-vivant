
# 🦋 Apprendre cette marche — Duolingo du Vivant local

URL publique : **`/apprendre/:slug`** (ex : `/apprendre/deviat-jardin-monde`)

Un parcours pédagogique gamifié, hyper-local, alimenté **uniquement par les espèces réellement observées sur la marche**, regroupées par tags (papillons, oiseaux, arbres mellifères, fixateurs d'azote…). Pas de blabla générique : chaque carte montre **la photo prise par un marcheur**, **le jour**, **l'endroit exact**.

---

## L'expérience en 5 écrans

```text
┌─────────────────────────────────────────────────────────┐
│ 1. PORTAIL               2. CHOIX DU TAG                │
│ "Découvre les 47        🦋 Papillons (12)              │
│  espèces vivantes de    🐦 Oiseaux (18)                │
│  Jardin Monde"          🌳 Arbres mellifères (8)       │
│  [Commencer →]          🐝 Pollinisateurs (9)          │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. CARTE-MÉMOIRE (swipe)                                │
│ ┌───────────────┐  Recto :                              │
│ │ photo plein   │  • Photo marcheur plein cadre         │
│ │ écran (Marie  │  • "Qui suis-je ?" → 3 choix          │
│ │ 14 juin)      │                                       │
│ └───────────────┘  Verso (flip) :                       │
│ Papillon Citron    • Nom FR + scientifique              │
│ Gonepteryx rhamni  • 1 fait WAOUH (ex : "vit 1 an !")  │
│ [Suivante →]       • Indice de reconnaissance (1 critère)│
│                    • "Vu ici par Marie le 14 juin"      │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. QUIZ ÉCLAIR (3 questions)                            │
│  • Reconnais : 4 photos, 1 nom                          │
│  • Habitat : où me trouves-tu ?                         │
│  • Geste : lequel me protège ?                          │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. BADGE & PARTAGE                                      │
│ "Tu connais les 12 papillons de Jardin Monde 🦋"       │
│ [Partager] [Découvrir une autre marche] [M'inscrire]    │
└─────────────────────────────────────────────────────────┘
```

---

## Ce qui en fait une révolution pédagogique

1. **Incarné** — Chaque espèce est introduite par "Marie, 14 juin, Jardin Monde" et la photo qu'elle a prise. On n'apprend pas une espèce abstraite, on rencontre **celle d'ici**.
2. **Court & addictif** — 1 tag = 5 min. Swipe, flip, quiz, badge. Format mobile-first inspiré de Duolingo / Tinder.
3. **Zéro friction** — URL publique, pas de compte requis. Score local (localStorage). Inscription seulement à la fin, optionnelle.
4. **Auto-alimenté** — Dès qu'une espèce est observée + taguée sur la marche, elle apparaît dans l'outil. Pas de contenu à écrire manuellement.
5. **Boucle vertueuse** — Le bouton "Tu veux voir cette espèce en vrai ?" renvoie vers la prochaine marche programmée du tag.

---

## Périmètre v1 (ce qu'on construit)

- Route publique `/apprendre/:slug` (SEO optimisé par marche + par tag)
- Sélecteur de tag (lit `exploration_curations.functions` + iconic_taxon des snapshots)
- Composant `<MemoryCard>` swipable (Framer Motion) avec flip recto/verso
- Mini-quiz 3 questions auto-généré depuis le pool d'espèces du tag
- Écran badge + boutons partage (Web Share API) et CTA marche suivante
- Tracking anonyme dans `engagement_analytics` (vues, complétions, partages)
- Metadata Open Graph dynamique par marche+tag pour bon rendu réseaux sociaux

## Hors périmètre v1 (pour itérations futures)

- IA conversationnelle (proposable en v2 si succès)
- Gestes de protection détaillés par espèce (nécessite curation experte)
- Mode multi-marches / classements inter-territoires
- Création de compte / progression persistante

---

## Détails techniques

**Données**
- Source unique : `get_exploration_species_count` RPC + `species_thumb_cache` (déjà en place suite à la session précédente)
- Tags : fusion `exploration_curations.functions` (12 tags écologiques) + `iconic_taxon_name` (papillons = Insecta+Lepidoptera, oiseaux = Aves…)
- Photos : cascade `marcheur_observations.photo_url` → `species_thumb_cache` → icône kingdom (composant `<SpeciesThumb />` existant)
- Attribution marcheur : jointure `marcheur_observations` → `community_profiles` (prénom + date d'observation)

**Composants nouveaux** (`src/components/apprendre/`)
- `ApprendreMarchePage.tsx` — route + layout immersif fond crème/forêt
- `TagSelector.tsx` — grille tags avec compteur d'espèces
- `MemoryCardDeck.tsx` — pile swipable Framer Motion (drag x, exit animations)
- `MemoryCard.tsx` — recto photo + 3 choix, verso fiche flip 3D
- `FlashQuiz.tsx` — 3 questions générées dynamiquement
- `BadgeReveal.tsx` — animation badge + partage

**Routing** : ajouter dans `src/App.tsx` la route `/apprendre/:slug` (publique, sous `ExplorationLayout` sans auth).

**SEO**
- `<title>` : "Apprendre les papillons de Jardin Monde — La Fréquence du Vivant"
- Meta description dynamique
- JSON-LD `LearningResource` par tag
- Sitemap auto-généré par marche publiée

**Hook nouveau** : `useApprendreSpecies(slug, tag)` — agrège espèces + photos + attribution, mémoïsé.

**Accessibilité**
- Navigation clavier (← → pour swipe, espace pour flip)
- Alt text sur chaque photo (nom espèce + attribution)
- Quiz utilisable au clavier
- Contrastes WCAG AA en thèmes clair + sombre

**Tracking** (table `engagement_analytics` existante)
- `event_type` = `apprendre_tag_started` / `apprendre_card_flipped` / `apprendre_quiz_completed` / `apprendre_shared`
- Permet ensuite un dashboard admin "Quels tags fonctionnent le mieux ?"

**Performance**
- Préchargement des 3 prochaines photos du deck
- Lazy load au-delà
- Cache React Query 10 min sur les espèces (déjà stable une fois la marche terminée)

---

## Critères de réussite

- Un visiteur non-initié comprend et retient 5 espèces en moins de 5 minutes
- Taux de complétion d'un tag > 60%
- Au moins 1 partage social par 10 sessions
- Conversion CTA "marche suivante" > 5%

Une fois la v1 validée sur DEVIAT/Jardin Monde, on étend tags + on envisage v2 (IA + gestes de protection).

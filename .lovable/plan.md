# Refonte "Le Cœur" — Galerie immersive des écrits

## Vision

Faire de l'onglet "Le Cœur" un **livre vivant collectif** où chaque texte de marcheur est mis en valeur comme une œuvre. Mobile-first, avec une esthétique éditoriale (typographie serif, citations en exergue, papier crème / forêt émeraude selon le thème).

## Ce qui change

L'onglet actuel (`TextesEcritsSubTab.tsx`) affiche les textes dans des accordéons fonctionnels mais sans souffle. On garde la donnée et la logique RPC, mais on refait toute la couche présentation.

## 1. Hero d'ouverture (mobile-first)

En haut de l'onglet, un bandeau poétique :
- Compteur animé : "**X voix · Y écrits · Z points de marche**"
- Sous-titre cursif : "*Ce que les marcheurs ont confié au papier*"
- Petit défilement horizontal d'avatars des auteurs (comme les "stories")
- Filtres pills discrets : Tous · par type (poème, fragment, lettre, haïku…) · par marcheur · par point

## 2. Vue principale — "Le Mur des écrits" (par défaut, mobile)

Une **mosaïque masonry** plein écran de cartes-citations :
- Chaque carte = un extrait du texte (3-4 lignes en serif italique)
- Hauteur variable selon longueur → effet Pinterest poétique
- Fond papier (light) ou parchemin sombre (dark) avec léger grain
- Coin replié subtil (skeuomorphisme délicat)
- Badge type texte (poème, haïku…) en filigrane
- Avatar + prénom de l'auteur en pied de carte
- Pastille de couleur selon le **point de marche** (gradient lié à l'ordre de la marche)
- Animation `fade-in` + `scale-in` séquentielle au scroll
- Tap → ouvre la **vue fiche immersive**

Sur desktop : 2-3 colonnes masonry. Sur mobile : 1 colonne pleine largeur avec espacement généreux.

## 3. Vues alternatives (toggle segmenté en haut)

Trois modes au lieu de deux :

- **Mur** (défaut) — masonry décrit ci-dessus
- **Marcheurs** — chaque marcheur = une "page d'auteur" avec son avatar large, bio courte, et ses textes en stack vertical
- **Itinéraire** — les écrits suivent l'ordre des points de marche, avec une ligne verticale pointillée façon journal de bord

Le toggle remplace l'actuel pill discret par un segmented control plus design.

## 4. Vue fiche immersive (sheet plein écran sur mobile)

Au tap sur un texte, on ouvre une **lecture plein écran** plutôt qu'un dialog classique :
- Sur mobile : `Sheet` qui monte du bas, plein écran, scroll vertical
- Header collant : avatar auteur + prénom + type de texte + bouton fermer
- Titre du texte en très grande typographie serif (style livre)
- Contenu en serif 18px, interligne généreuse, marges respirantes
- Lettrine sur la première lettre du texte
- Footer : point de marche cliquable (→ navigue vers la marche), date, bouton partager (lien copiable + Web Share API mobile)
- Navigation **swipe gauche/droite** pour passer au texte suivant/précédent du même mode de tri
- Indicateur "Texte 3 / 18" discret en haut

## 5. Polish

- Typographie : utiliser une serif éditoriale (Cormorant, Lora ou existante du projet)
- Tokens sémantiques uniquement (pas de couleurs en dur) — respect des thèmes Papier Crème / Forêt Émeraude
- États vides : déjà beau, conserver
- Skeleton loaders au lieu d'attente vide
- Préserver `?texte=…` pour partage direct
- Respect du principe "Sobriété Informationnelle" : un seul élément focal par écran

## Détails techniques

**Fichier modifié :**
- `src/components/community/exploration/TextesEcritsSubTab.tsx` — refonte complète de la couche UI, logique de fetch et RPC inchangée

**Nouveaux sous-composants** (dans le même fichier ou extraits) :
- `EcritHero` — bandeau d'ouverture avec compteurs et avatars
- `MurMasonry` — grille masonry des cartes citations
- `CitationCard` — carte individuelle avec effet papier
- `MarcheurPage` — vue page-auteur
- `ItineraireTimeline` — timeline verticale par point
- `LectureImmersive` — Sheet plein écran avec swipe (Framer Motion drag)
- `SegmentedToggle` — toggle 3-positions amélioré

**Dépendances :** déjà disponibles (`framer-motion`, `@/components/ui/sheet`, dnd non requis, Web Share API native).

**Aucun changement** : RPC `get_event_public_textes`, schéma DB, RLS, hooks de fetch.

## Question pour toi

Une seule question avant de coder.

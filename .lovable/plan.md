

## Nouvel onglet "Textes écrits" dans l'Empreinte — Marches éco poétiques

### Contexte
- L'exploration `70fcd8d1...` est de type `eco_poetique` (via `marche_events.event_type`)
- La table `marcheur_textes` contient des textes (haiku, senryu...) avec `user_id`, `marche_id`, `marche_event_id`
- Les profils marcheurs sont dans `community_profiles` (prenom, nom, avatar_url)
- Les marches (points) sont dans `marches` (nom_marche, ville) liées via `exploration_marches.ordre`
- Données existantes : 2 textes de "Gaspard Boreal" sur 2 points différents

### Architecture

**1. Détection du type eco_poetique**
- Ajouter `event_type` au select de la query `marcheEvent` dans `ExplorationMarcheurPage.tsx`
- Passer `eventType` en prop à `EventBiodiversityTab`

**2. Onglet conditionnel "Textes écrits"**
- Dans `EventBiodiversityTab.tsx`, ajouter le sub-tab `textes` entre `taxons` et `analyse` uniquement quand `eventType === 'eco_poetique'`
- Type `SubTab` étendu : `'synthese' | 'taxons' | 'textes' | 'analyse'`

**3. Nouveau composant `TextesEcritsSubTab.tsx`**
- Hook dédié qui charge les textes publics + profils + marches en une requête
- Deux sous-vues via toggle pills : **"Marcheurs"** et **"Points de marche"**

**Vue Marcheurs :**
- Textes regroupés par auteur (ordre alphabétique prenom+nom)
- Chaque groupe est un accordion (ouvert/fermé) avec avatar, nom, nombre de textes
- Chaque texte : carte glassmorphism avec titre en Crimson Text, extrait du contenu (3 lignes), type (badge haiku/senryu), nom du point de marche
- Clic → ouvre un Dialog/popup plein écran du texte avec bouton "Partager" (copie l'URL avec `?texte=ID` dans le presse-papier)

**Vue Points de marche :**
- Textes regroupés par marche (ordre de progression via `exploration_marches.ordre`), puis par auteur alphabétique dans chaque groupe
- Chaque groupe : accordion avec nom du point, nombre de textes
- Même carte de texte que la vue Marcheurs mais avec mention de l'auteur (avatar + nom)
- Même popup partageable

**4. Popup partageable**
- Dialog modal avec le texte complet, titre, auteur, point de marche, type
- Design poétique : fond sombre, typographie Crimson Text, bordure latérale violette (couleur eco_poetique `#8b5cf6`)
- Bouton "Copier le lien" qui génère une URL avec query param `?texte={id}`
- Au chargement de la page, si `?texte=ID` est présent, auto-ouvrir le bon onglet + popup

### Fichiers

| Fichier | Action |
|---------|--------|
| `src/components/community/exploration/TextesEcritsSubTab.tsx` | **Nouveau** — composant principal avec les 2 vues + popup |
| `src/components/community/EventBiodiversityTab.tsx` | Ajouter prop `eventType`, sub-tab conditionnel `textes` |
| `src/components/community/ExplorationMarcheurPage.tsx` | Ajouter `event_type` au select de la query marcheEvent, passer en prop |

### Design
- Cartes de texte : `bg-card/60 backdrop-blur border border-border/50`, titre en serif (font-crimson ou font-serif), extrait en italique
- Badge type texte : pilule violette translucide
- Accordion headers : `bg-muted/30` avec chevron animé
- Popup : plein écran mobile, centré desktop, bande latérale `#8b5cf6`, bouton partage avec toast de confirmation


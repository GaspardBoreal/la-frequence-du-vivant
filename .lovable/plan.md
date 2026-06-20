## Nouvelle page : Vitrine Formation ISEGCOM Bordeaux × IA Générative

Route publique dédiée présentant la formation IA Générative & Prompt Engineering animée par **Laurent Tripied** auprès des MBA ISEGCOM Bordeaux, avec les 13 projets livrés par la promotion.

### Route & accès
- Nouvelle route publique : `/formations/isegcom-bordeaux`
- Lien discret depuis `PublicTopBar` (menu Formations) — sans casser les URLs publiques existantes.
- SEO : title « Formation IA Générative × Impact — ISEGCOM Bordeaux × Laurent Tripied », meta description, OG image, JSON-LD `Course`.

### Architecture de la page (single page, hero + onglets ancrés)

```text
┌─────────────────────────────────────────────┐
│  HERO — La promo qui a prompté le Vivant    │
├─────────────────────────────────────────────┤
│  [Tabs : Formation · Expérience Biodiv ·    │
│          Galerie 13 projets · Pourquoi nous]│
└─────────────────────────────────────────────┘
```

#### 1. HERO « wahouh » — `IsegcomHero.tsx`
- Plein écran, fond mosaïque animée des 4 photos formation (Ken Burns lent + parallax + voile vert émeraude `from-primary/70 via-primary/40 to-background`).
- Titre `font-crimson` 7xl/9xl : « **Quand une promo** *prompt-e* **le Vivant** ».
- Sous-titre : « MBA Communication Globale & Stratégies d'Influence · MBA Communication & Événementiel — ISEGCOM Bordeaux ».
- Bandeau prof : avatar + « Animé par **Laurent Tripied** · Formation IA Générative & Prompt Engineering · Thème à impact : *Les Marches du Vivant* ».
- 3 chips statistiques pulsées : `13 projets livrés` · `2 MBA` · `1 thème à impact réel`.
- CTA scroll-down vers la galerie.

#### 2. Onglet « Formation » — `IsegcomFormationSection.tsx`
- Carrousel des 4 photos `Formation_à_l_IA_*` + `Elèves_et_professeur_*` (lightbox).
- Bloc « Pédagogie » : 4 cartes (Prompt Engineering · IA Générative multimodale · Pensée systémique · Livrable réel client) avec icônes Lucide.
- Quote Laurent Tripied (placeholder éditable).

#### 3. Onglet « Expérience Mesure Biodiversité » — `IsegcomBiodivExperience.tsx`
- Storytelling : « Sortir du prompt, mesurer le vivant — Patio végétalisé ISEGCOM Bordeaux ».
- Galerie masonry des **6 photos** (Patio_01→05 + Mesure_Biodiv_01), lightbox plein écran.
- 3 étapes : Observer · Identifier (iNaturalist) · Restituer (data + récit).
- Lien sortant vers la page « Mon Espace » biodiversité existante de l'app (réutilisation).

#### 4. Onglet « Galerie des 13 projets » — `IsegcomProjectsGallery.tsx`
Grille bento responsive (3 cols desktop / 2 tablet / 1 mobile), chaque carte affiche **uniquement** :
- **Screenshot live** via `https://image.thum.io/get/width/800/crop/600/<url>` (fallback gradient + initiales du projet).
- Titre du projet + badge MBA concerné (Communication Globale / Événementiel).
- Description courte (2 lignes, ellipsis).
- 3 chips « points forts ».
- Bouton « Ouvrir en grand » → URL Lovable publique, nouvel onglet.
- Hover : élévation + gradient overlay + scale 1.02.

> **Aucun nom d'étudiant·e** n'apparaît sur les cartes ni dans les données.

Données statiques dans `src/data/isegcomProjects.ts` :

| # | Projet | URL publique |
|---|---|---|
| 1 | Catalogue Marketing Automation | marketing-automation-lmdv |
| 2 | Offre Mécénat & Expérience Collaborateurs | offre-mecenat-lmdv |
| 3 | Réalité Virtuelle & Biodiversité locale | realite-vituelle-biodiv-locale |
| 4 | Notification SMS | notification-sms-lmdv |
| 5 | Op. France Travail & Missions Locales | op-france-travail-missionlocale |
| 6 | Recrutement Ambassadeurs | ambassadeurs-marches-du-vivants |
| 7 | App Famille / App Simple | versionjoueur |
| 8 | Offre Agence Tourisme | agence-tourisme-bordeaux |
| 9 | Onboarding Ambassadeurs | onboarding-ambassadeur |
| 10 | Générateur de Newsletter | newsletter-lmdv-generator |
| 11 | Offre Université Bordeaux | offre-universite-bordeaux |
| 12 | Configurateur de Marche | generateur-de-marche |
| 13 | Offre Coopératives & Caves Coop | team-building-lesmarchesduvivant |

> Descriptions courtes + 3 points forts rédigés à partir des prompts/descriptions remontés par `cross_project--list_projects`.

#### 5. Onglet « Pourquoi confier cette formation à votre école »
Argumentaire conversion vers d'autres établissements :
- 4 cartes : *Cas réel client* · *Livrables publiés* · *IA + thème à impact* · *Mesure terrain (biodiv patio)*.
- CTA final : « Organiser cette formation chez vous » → mailto Laurent Tripied.

### Design tokens
- Palette : Forêt Émeraude (déjà en place) + accent or `#C9A961` pour le hero.
- Typo : `font-crimson` (titres) + Inter (body) — cohérent app.
- Composants shadcn existants : `Tabs`, `Card`, `Dialog` (lightbox), `Badge`.
- Aucune couleur hardcodée — passage par les tokens HSL.

### Fichiers (création uniquement)
```
src/pages/IsegcomBordeaux.tsx                    (page + Tabs + SEO)
src/components/isegcom/IsegcomHero.tsx
src/components/isegcom/IsegcomFormationSection.tsx
src/components/isegcom/IsegcomBiodivExperience.tsx
src/components/isegcom/IsegcomProjectsGallery.tsx
src/components/isegcom/IsegcomProjectCard.tsx
src/components/isegcom/IsegcomPourquoiNous.tsx
src/components/isegcom/ImageLightbox.tsx          (réutilisable Dialog)
src/data/isegcomProjects.ts                       (13 projets typés, sans noms)
```
- Ajout route dans `src/App.tsx`.
- 10 photos uploadées copiées via `lovable-assets create --file /mnt/user-uploads/...` → pointeurs JSON sous `src/assets/isegcom/`.
- Screenshots projets : service `thum.io` (gratuit, sans clé) avec fallback gradient.

### Hors périmètre
- **Aucun nom d'étudiant·e** affiché ni stocké.
- Pas de backend / table Supabase (données statiques côté front).
- Pas de modification du CRM ni des modules existants.
- Pas de logo généré.
- Pas de touche aux URLs publiques actuelles.

### Validation
- `browser--view_preview` sur `/formations/isegcom-bordeaux` desktop + mobile après build.
- Vérification visuelle hero, grille 13 cartes, lightbox patio, onglets.



# Plan d'Implémentation : Section "Les Marches du Vivant"

## Vision Globale

Creation d'une nouvelle section complete avec 4 pages interconnectees pour positionner "Les Marches du Vivant" comme une offre B2B differenciante, integrant des donnees biodiversite en temps reel et une identite visuelle "Science-Nature".

---

## Architecture des URLs

```text
/marches-du-vivant                    → Landing Page (Aiguillage)
/marches-du-vivant/entreprises        → Page Conversion B2B (Qualiopi)
/marches-du-vivant/partenaires        → Page Maillage Territorial
/marches-du-vivant/association        → Page Communaute & Adhesion
```

---

## Donnees Cles Disponibles (depuis la BDD)

| Indicateur | Valeur |
|------------|--------|
| Especes uniques recensees | 1 709 |
| Photos collectees | 241 |
| Marches documentees | 33 |
| Observations Gaspard Boreal | 36 |

Ces chiffres seront affiches dynamiquement via les hooks existants (`useBiodiversityStats`).

---

## 1. Composants Partages a Creer

### A. Widget "Pouls du Vivant" (Header Sticky)

**Fichier** : `src/components/marches-vivant/PoulsDuVivantWidget.tsx`

**Fonctionnalites** :
- Affichage meteo locale via Open-Meteo (deja integre)
- "Derniere espece detectee" via les donnees biodiversite
- Animation subtile de pulsation
- Responsive (compact sur mobile)

**Design** :
```text
┌─────────────────────────────────────────────────────────┐
│ 🌡️ 18°C  💨 12 km/h  │  🐦 Derniere: Loriot d'Europe   │
└─────────────────────────────────────────────────────────┘
```

### B. Barre de Confiance (Trust Bar)

**Fichier** : `src/components/marches-vivant/TrustBar.tsx`

**Contenu** :
- Logos partenaires en niveaux de gris : bziiit, Piloterra, Osfarm
- Badge Qualiopi
- Hover pour couleur

### C. Compteurs Science Participative (Footer Section)

**Fichier** : `src/components/marches-vivant/ScienceCounters.tsx`

**Affichage dynamique** :
- "1 709 Especes recensees sur nos parcours"
- "241 Photos de terrain collectees"
- "33 Marches documentees"
- Mention : "Donnees certifiees connectees au GBIF"

---

## 2. Page Landing `/marches-du-vivant`

**Fichier** : `src/pages/MarchesDuVivant.tsx`

### Structure

```text
┌───────────────────────────────────────────────────────────┐
│                    HERO SECTION                           │
│  H1: "Les Marches du Vivant"                             │
│  Sous-titre: Team Building Scientifique & Bioacoustique  │
│  [Widget Pouls du Vivant]                                │
├───────────────────────────────────────────────────────────┤
│                    SPLIT SCREEN                          │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  ENTREPRISES     │  │  GRAND PUBLIC    │             │
│  │  RSE, Innovation │  │  Science         │             │
│  │  Qualiopi        │  │  Emerveillement  │             │
│  │  [Decouvrir →]   │  │  [Rejoindre →]   │             │
│  └──────────────────┘  └──────────────────┘             │
├───────────────────────────────────────────────────────────┤
│                    TRUST BAR                             │
│  [bziiit] [Piloterra] [Osfarm] [Qualiopi]               │
├───────────────────────────────────────────────────────────┤
│               DIFFERENCIATEURS                           │
│  • Data opposable CSRD  • Bioacoustique  • Science Part. │
├───────────────────────────────────────────────────────────┤
│              COMPTEURS SCIENCE PARTICIPATIVE             │
│  1 709 especes │ 241 photos │ 33 marches                │
│  "Donnees certifiees GBIF"                              │
├───────────────────────────────────────────────────────────┤
│                    FOOTER                                │
└───────────────────────────────────────────────────────────┘
```

### Elements Techniques
- SEO : meta title/description optimises
- Animation Framer Motion
- Responsive mobile-first
- Lazy loading images

---

## 3. Page B2B `/marches-du-vivant/entreprises`

**Fichier** : `src/pages/MarchesDuVivantEntreprises.tsx`

### Catalogue des 5 Formations

| Formation | Duree | Cible | Tarif indicatif |
|-----------|-------|-------|-----------------|
| DATA & Biodiversite : Piloter la Transition | 1 jour | DRH, RSE | Sur mesure |
| Bioacoustique & Leadership | 1/2 journee | Equipes | Sur mesure |
| Nouveaux Recits : L'IA au Service du Vivant | 2 jours | Innovation | Sur mesure |
| Sentinelles du Vivant | 1 jour | Tout public | Sur mesure |
| Design de l'Instant Present | 1/2 journee | QVT | Sur mesure |

### Structure Page

```text
┌───────────────────────────────────────────────────────────┐
│  HERO : "Formations & Team Building pour Entreprises"    │
│  Badge Qualiopi prominent                                │
├───────────────────────────────────────────────────────────┤
│  ARGUMENT MASSUE                                         │
│  "Produisez de la donnee RSE opposable (CSRD)"          │
├───────────────────────────────────────────────────────────┤
│  CATALOGUE FORMATIONS (Cards empilables mobile)          │
│  [Formation 1] [Formation 2] [Formation 3]...            │
├───────────────────────────────────────────────────────────┤
│  FORMULAIRE CONTACT/DEVIS (Sticky mobile)               │
│  Nom | Entreprise | Tel | [Demander un devis]           │
├───────────────────────────────────────────────────────────┤
│  CTA SECONDAIRE                                          │
│  [Telecharger le programme Qualiopi]                    │
│  [Demander un Eductour]                                  │
└───────────────────────────────────────────────────────────┘
```

### Composant FormationCard

**Fichier** : `src/components/marches-vivant/FormationCard.tsx`

Props : titre, duree, objectif, cible, icone, couleur

---

## 4. Page Territoire `/marches-du-vivant/partenaires`

**Fichier** : `src/pages/MarchesDuVivantPartenaires.tsx`

### Les 7 Hebergeurs Partenaires

| Nom | Localisation | Lien |
|-----|--------------|------|
| Le Chez Nous | Gauriac (33) | booking.com |
| La Closerie de Fronsac | Saint-Michel-de-Fronsac (33) | lacloseriedefronsac.com |
| La Rebiere d'Or | Mouleydier (24) | larebieredor.com |
| Hotel du Pont | Grolejac (24) | sarlathoteldupont.com |
| Le Relais de Castelnau | Loubressac (46) | relaisdecastelnau.com |
| Hostellerie La Bruyere | Chalvignac (15) | hostellerie-la-bruyere.fr |
| Hebergement Artense | Le Mont Dore (63) | artense.eu |

### Structure Page

```text
┌───────────────────────────────────────────────────────────┐
│  HERO : "Nos Lieux Partenaires"                          │
│  Sous-titre : Le long de la Dordogne                    │
├───────────────────────────────────────────────────────────┤
│  CARTE INTERACTIVE (Leaflet - deja integre)             │
│  Marqueurs cliquables pour chaque hebergeur             │
├───────────────────────────────────────────────────────────┤
│  FICHES HEBERGEURS                                       │
│  Pour chaque lieu :                                      │
│  - Nom + Photo (depuis galerie existante)               │
│  - Adresse complete                                      │
│  - "Especes frequentes a [Ville]" (injection iNaturalist)│
│  - Lien externe vers le site partenaire                 │
├───────────────────────────────────────────────────────────┤
│  CTA : "Organiser une marche dans ce lieu"              │
└───────────────────────────────────────────────────────────┘
```

### Composant HebergeurCard

**Fichier** : `src/components/marches-vivant/HebergeurCard.tsx`

Integration avec `useBiodiversityData` pour afficher les especes locales.

---

## 5. Page Association `/marches-du-vivant/association`

**Fichier** : `src/pages/MarchesDuVivantAssociation.tsx`

### Structure

```text
┌───────────────────────────────────────────────────────────┐
│  HERO : "Rejoindre la Communaute"                        │
│  Les Marches du Vivant - Association                    │
├───────────────────────────────────────────────────────────┤
│  LE CERCLE D'OR                                          │
│  WHY → HOW → WHAT (sections deroulantes)                │
├───────────────────────────────────────────────────────────┤
│  L'EQUIPE FONDATRICE                                     │
│  [Laurence Karki - Presidente]                          │
│  [Victor Boixeda - Relations Publiques]                 │
│  [Laurent Tripied - CEO bziiit]                         │
│  [Gaspard Boreal - Auteur & Explorateur]                │
├───────────────────────────────────────────────────────────┤
│  DEVENIR AMBASSADEUR                                     │
│  Parcours : Marcheur → Ambassadeur → Animateur          │
│  (Reutilisation composant FormationSection existant)    │
├───────────────────────────────────────────────────────────┤
│  AGENDA DES MARCHES (si disponible)                     │
│  Integration avec gaspard_events                        │
└───────────────────────────────────────────────────────────┘
```

### Composant ContributeurCard

**Fichier** : `src/components/marches-vivant/ContributeurCard.tsx`

Props : nom, role, linkedin, photo, bio

---

## 6. Modifications Fichiers Existants

### A. Routeur Principal

**Fichier** : `src/App.tsx`

Ajout des 4 nouvelles routes :
```typescript
<Route path="/marches-du-vivant" element={<MarchesDuVivant />} />
<Route path="/marches-du-vivant/entreprises" element={<MarchesDuVivantEntreprises />} />
<Route path="/marches-du-vivant/partenaires" element={<MarchesDuVivantPartenaires />} />
<Route path="/marches-du-vivant/association" element={<MarchesDuVivantAssociation />} />
```

### B. Footer

**Fichier** : `src/components/Footer.tsx`

Ajout d'un lien vers `/marches-du-vivant` dans la section "Explorer les frequences".

### C. Navigation (optionnel)

Ajout potentiel dans le header des pages principales.

---

## 7. Fichiers a Creer (Resume)

| Chemin | Type | Description |
|--------|------|-------------|
| `src/pages/MarchesDuVivant.tsx` | Page | Landing principale |
| `src/pages/MarchesDuVivantEntreprises.tsx` | Page | Offre B2B |
| `src/pages/MarchesDuVivantPartenaires.tsx` | Page | Hebergeurs |
| `src/pages/MarchesDuVivantAssociation.tsx` | Page | Communaute |
| `src/components/marches-vivant/PoulsDuVivantWidget.tsx` | Composant | Widget meteo/espece |
| `src/components/marches-vivant/TrustBar.tsx` | Composant | Logos partenaires |
| `src/components/marches-vivant/ScienceCounters.tsx` | Composant | Compteurs dynamiques |
| `src/components/marches-vivant/FormationCard.tsx` | Composant | Card formation B2B |
| `src/components/marches-vivant/HebergeurCard.tsx` | Composant | Card hebergeur |
| `src/components/marches-vivant/ContributeurCard.tsx` | Composant | Card equipe |

---

## 8. SEO & Mots-Cles

### Meta Tags par Page

| Page | Title | Description |
|------|-------|-------------|
| Landing | "Les Marches du Vivant - Team Building Scientifique Dordogne" | "Formations Qualiopi et team building bioacoustique en Nouvelle-Aquitaine. Science participative, biodiversite et leadership." |
| Entreprises | "Formations Qualiopi RSE Biodiversite - Les Marches du Vivant" | "5 formations certifiees Qualiopi pour entreprises. Data RSE opposable CSRD, bioacoustique, IA et vivant." |
| Partenaires | "Seminaires Nature Dordogne Gironde - Lieux Partenaires" | "7 hebergeurs partenaires le long de la Dordogne pour vos seminaires deconnexion et team building nature." |
| Association | "Rejoindre Les Marches du Vivant - Devenir Ambassadeur" | "Devenez ambassadeur des Marches du Vivant. Science participative, bioacoustique et nouveaux recits territoriaux." |

---

## 9. Identite Visuelle

### Palette Recommandee

| Couleur | Usage | Code |
|---------|-------|------|
| Vert Profond | Ancrage, biodiversite | `#064E3B` (emerald-900) |
| Orange bziiit | Innovation, CTA | `#F97316` (orange-500) |
| Bleu Tech | Data, science | `#3B82F6` (blue-500) |
| Blanc Casse | Fond, sobriete | `#FAFAF9` (stone-50) |

### Typographie

- Titres : Font Crimson (deja utilisee)
- Corps : Font Libre (existante)
- Badges : Font Mono (existante)

---

## 10. Prochaines Etapes Apres Implementation

1. **Creer les templates email** pour Victor (prospection)
2. **Configurer un CRM leger** (Notion ou Google Sheets)
3. **Preparer la plaquette PDF** avec les visuels
4. **Obtenir les backlinks** des hebergeurs partenaires
5. **Tester le formulaire de contact** et les redirections

---

## Estimation Effort

| Element | Complexite | Temps estime |
|---------|------------|--------------|
| Landing page | Moyenne | 1-2h |
| Page Entreprises | Moyenne | 1-2h |
| Page Partenaires | Elevee (carte) | 2-3h |
| Page Association | Moyenne | 1-2h |
| Composants partages | Faible | 1h |
| SEO & meta | Faible | 30min |

**Total estime** : 6-10 heures de developpement


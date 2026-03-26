

# Refonte UX/UI de "Mon Espace" — Architecture app-like avec navigation par onglets

## Vision

Transformer la page monolithique scrollable actuelle en une **mini-application immersive** avec un header de profil persistant et une navigation par onglets. L'objectif : une UX digne d'une app native, mobile-first, qui pourra accueillir les dizaines de fonctionnalites prevues pour les 5 niveaux.

## Architecture proposee

```text
┌─────────────────────────────────────┐
│  HEADER PROFIL (persistant)         │
│  Avatar · Prenom · RoleBadge        │
│  Frequences: ★ 42  · ⚙ Settings    │
├─────────────────────────────────────┤
│  TABS (sticky, scrollable mobile)   │
│  🏠 Accueil │ 🗺 Marches │ 🧠 Quiz  │
│  📖 Carnet  │ 🎵 Sons   │ 🌸 Kigo  │
├─────────────────────────────────────┤
│                                     │
│  CONTENU DE L'ONGLET ACTIF          │
│  (zone scrollable independante)     │
│                                     │
└─────────────────────────────────────┘
```

### Header profil

- **Bande superieure glassmorphism** (fixe) avec :
  - Avatar genere (initiales sur fond gradient du role)
  - Prenom + role badge anime
  - Compteur de Frequences (score total, anime au gain)
  - Bouton engrenage → slide-over profil (nom, email, ville, deconnexion)
- Design : fond `bg-emerald-950/80 backdrop-blur-xl`, bordure basse lumineuse selon le role

### Navigation par onglets

- **Mobile** : barre horizontale scrollable en bas de l'ecran (bottom tab bar style iOS)
- **Desktop** : tabs horizontaux sous le header
- Onglets visibles conditionnes par le role :
  - **Marcheur** : Accueil, Marches, Quiz
  - **Eclaireur** : + Carnet, Sons
  - **Ambassadeur** : + Kigo, Creer
  - **Sentinelle** : + Territoire
  - **Admin** : + Admin
- Icones + labels courts, badge de notification (ex: marche demain)

### Onglets et contenu

| Onglet | Contenu | Existe deja |
|--------|---------|-------------|
| **Accueil** | ProgressionCard + message contextuel + "Ma Frequence du jour" (onde animee) + raccourcis rapides | Oui (a reorganiser) |
| **Marches** | Prochaines marches (inscription) + historique participations + QR scanner | Oui (a deplacer) |
| **Quiz** | QuizInteractif + historique scores + badges debloques | Oui (a deplacer) |
| **Carnet** | Carnets de terrain (futur) — placeholder elegant | Non |
| **Sons** | Bibliotheque sonore (futur) — placeholder | Non |
| **Kigo** | Kigo du jour + galerie haikus (futur) — placeholder | Non |

### "Ma Frequence du jour" (widget hero sur Accueil)

Widget visuel en haut de l'onglet Accueil : une **onde sonore animee** (barres SVG pulsantes) representant le score du marcheur. Couleur selon le role. Cliquable pour voir le detail.

## Details techniques

### Structure des fichiers

| Fichier | Action |
|---------|--------|
| `src/pages/MarchesDuVivantMonEspace.tsx` | Refactoriser : extraire header + tabs + contenu par onglet |
| `src/components/community/MonEspaceHeader.tsx` | **Nouveau** — Header profil persistant |
| `src/components/community/MonEspaceTabBar.tsx` | **Nouveau** — Navigation onglets (responsive) |
| `src/components/community/tabs/AccueilTab.tsx` | **Nouveau** — Contenu onglet Accueil |
| `src/components/community/tabs/MarchesTab.tsx` | **Nouveau** — Contenu onglet Marches |
| `src/components/community/tabs/QuizTab.tsx` | **Nouveau** — Contenu onglet Quiz |
| `src/components/community/tabs/PlaceholderTab.tsx` | **Nouveau** — Onglets futurs (Carnet, Sons, Kigo) |
| `src/components/community/FrequenceWave.tsx` | **Nouveau** — Widget onde animee SVG |

### Logique de tabs conditionnels par role

```typescript
const TABS_BY_ROLE = {
  marcheur_en_devenir: ['accueil', 'marches', 'quiz'],
  marcheur: ['accueil', 'marches', 'quiz'],
  eclaireur: ['accueil', 'marches', 'quiz', 'carnet', 'sons'],
  ambassadeur: ['accueil', 'marches', 'quiz', 'carnet', 'sons', 'kigo'],
  sentinelle: ['accueil', 'marches', 'quiz', 'carnet', 'sons', 'kigo', 'territoire'],
};
```

### Mobile-first bottom bar

- Position `fixed bottom-0` sur mobile, `sticky top` sur desktop
- Safe area padding pour iOS (`pb-safe`)
- Active tab : icone + label en couleur du role, indicateur dot anime
- Inactive : icone grisee

### Compteur de Frequences

Query `frequences_log` pour calculer le total :
```sql
SELECT COALESCE(SUM(points), 0) FROM frequences_log WHERE user_id = ?
```

### Slide-over profil (Settings)

Panel lateral qui glisse depuis la droite (mobile) avec :
- Photo/avatar editable
- Prenom, nom, ville
- Email (lecture seule)
- Kigo d'accueil
- Bouton deconnexion
- Bouton "Supprimer mon compte" (futur)

### Animations

- Transition entre onglets : `AnimatePresence` avec fade + slide lateral subtil
- Header : parallax leger au scroll
- FrequenceWave : barres SVG avec `motion.rect` et delays decales

## Phase d'implementation

Cette refonte se fait en **une seule passe** :
1. Creer les composants header, tab bar, wave
2. Creer les 3 tabs de contenu (Accueil, Marches, Quiz) en deplacant le code existant
3. Creer les placeholders elegants pour les onglets futurs
4. Refactoriser `MarchesDuVivantMonEspace.tsx` comme orchestrateur

Le code existant (ProgressionCard, QuizInteractif, RoleBadge, logique d'inscription) est preserve intact — seul le layout change.


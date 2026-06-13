## Objectif

Rendre les 4 actions (Mode clair/sombre, Connexion / Mon espace, Partager, Suivre sur LinkedIn) accessibles en haut de toutes les pages publiques de La Fréquence du Vivant, de manière harmonieuse avec les designs très différents (Forêt Émeraude sombre vs Papier Crème clair vs hybrides), tout en préparant l'évolution du bouton Partager vers un drawer riche (reels data hebdo/mensuels/départemental).

## Principe directeur

Un **seul composant** `PublicTopBar` réutilisable, sticky en haut, pleine largeur, qui :
- Auto-détecte le ton du fond (`light` / `dark` / `glass`) via un prop `tone` ou auto-détection `ThemeContext`.
- Remplace les nav existantes en intégrant leur **slot gauche** (logo / breadcrumb / ArrowLeft retour) pour ne **rien casser visuellement**.
- Expose les 4 actions à droite, toujours à la même place (mémoire musculaire utilisateurs).

## Architecture

### 1. Nouveau composant `src/components/layout/PublicTopBar.tsx`

Props :
```ts
{
  tone?: 'light' | 'dark' | 'glass' | 'auto'; // défaut 'auto'
  leftSlot?: React.ReactNode;     // logo, retour, breadcrumb spécifique à la page
  sticky?: boolean;               // défaut true
  transparent?: boolean;          // pour hero immersifs (Index, Interreg)
  className?: string;
}
```

Comportement visuel par `tone` :
- **light** (Papier Crème) : `bg-[rgba(254,253,251,0.92)] backdrop-blur-md border-b border-stone-200/50`, icônes `text-stone-600`, hover emerald — reprend exactement le style actuel de `/marches-du-vivant/explorer`.
- **dark** (Forêt Émeraude) : `bg-[rgba(10,31,26,0.6)] backdrop-blur-xl border-b border-emerald-500/15`, icônes `text-emerald-200/80`, hover gold `#c9a84c`.
- **glass** (hero immersif, Index, Interreg) : `bg-white/5 backdrop-blur-xl border-b border-white/10`, icônes `text-white/80`.
- **auto** : utilise `useTheme().resolvedTheme` → `dark` ou `light`.

Bouton LinkedIn : même esprit que celui posé sur Explorer (rounded-full, ring subtil, hover bleu LinkedIn `#0A66C2`), couleurs du ring adaptées au `tone`.

### 2. Bouton « Partager » — préparé pour les reels

Nouveau composant `src/components/share/ShareButton.tsx` + `ShareDrawer.tsx` :
- **Aujourd'hui (livré tout de suite)** : clic → si `navigator.share` dispo, partage natif Web Share API avec `title`/`url` de la page courante ; sinon copie le lien (toast).
- **Architecture prête pour demain** : le bouton lit une prop `mode: 'native' | 'drawer'` (défaut `native`). Quand `drawer`, ouvre un `Sheet` shadcn avec onglets prévus :
  - 🔗 Lien (actif)
  - 🎬 Reel — Cette semaine (placeholder « Bientôt »)
  - 🎬 Reel — Ce mois-ci (placeholder)
  - 🎬 Reel — Par département (placeholder + sélecteur)
- L'enrichissement futur n'aura qu'à brancher les générateurs de reels dans les onglets existants, **zéro refacto du composant ni des pages**.

### 3. Intégration page par page (sans casser le design)

Pour chaque page publique, je remplace son `<nav>` actuel (ou je l'ajoute si absent) par `<PublicTopBar>` avec le bon `tone` et `leftSlot` :

| Page | tone | leftSlot |
|------|------|----------|
| `/` Index | `glass` (transparent over hero) | logo « La Fréquence du Vivant » blanc |
| `/marches-du-vivant` | `light` | ArrowLeft → `/` + « Accueil » |
| `/marches-du-vivant/explorer` | `light` | actuel (ArrowLeft + « Les Marches du Vivant ») |
| `/marches-du-vivant/entreprises`, `/agriculture`, `/partenaires`, `/association` | `light` | ArrowLeft → `/marches-du-vivant` |
| `/marches-du-vivant/carnets-de-terrain` | `light` | idem |
| `/bioacoustique-poetique` | `dark` | logo + retour |
| `/interreg-sudoe-mdv` | `glass` (sur hero animé) puis bascule `dark` au scroll | logo Interreg textuel |
| `/marches-techno-sensibles`, `/explorations-sensibles`, `/dordonia`, `/api-mcp`, `/audit-frugal/:slug` | auto-détecté | retour contextuel |

Pour les pages déjà munies d'une nav très typée (Index header dramatique, BioacoustiquePoetique), le bandeau est ajouté **par-dessus en mode transparent/glass** afin de ne pas écraser l'art-direction du hero (option `transparent` + position absolute sur les 2-3 hero pages concernées).

### 4. Pages explicitement EXCLUES

Le bandeau **ne s'affiche pas** sur :
- `/marches-du-vivant/mon-espace` et sous-routes (ont déjà `MonEspaceHeader` avec mêmes fonctions)
- `/admin/*` (back-office)
- `/m/:slug` (event public immersif — scénographie custom)
- viewers eBook / ExperienceLecture / ExplorationPodcast (lecture immersive)

### 5. Wiring des 4 actions

- **Mode clair/sombre** : réutilise `<ThemeToggle />` existant (`src/components/community/ThemeToggle.tsx`).
- **Connexion / Mon espace** : `<Link>` intelligent → si `useAuth().user`, pointe vers `/marches-du-vivant/mon-espace` avec icône `UserCircle` + petit dot vert ; sinon vers `/marches-du-vivant/connexion`.
- **Partager** : `ShareButton` (cf. §2).
- **LinkedIn** : `<a>` vers `https://www.linkedin.com/company/la-fr%C3%A9quence-du-vivant/`, hover `#0A66C2`.

### 6. Responsive

- Desktop ≥ md : 4 icônes alignées + leftSlot complet.
- Mobile : 4 icônes restent visibles (compactes 36×36 px), leftSlot tronqué (juste ArrowLeft sans label si manque de place).

## Détails techniques

- Tous les composants en `src/components/layout/` (nouveau dossier) + `src/components/share/`.
- Aucune modification de `App.tsx` (pas de layout wrapper global — chaque page intègre `PublicTopBar` en tête, pour préserver les hero immersifs et l'art-direction page par page).
- Le composant existant `MonEspaceHeader` reste inchangé.
- Le bandeau actuel de `/marches-du-vivant/explorer` (lignes 218-244) devient le **template visuel canonique** du tone `light` — donc visuellement aucune régression sur cette page.

## QA visuelle

Après implémentation, je vérifie visuellement (screenshots ou preview) :
1. `/` — bandeau glass invisible sur hero, lisible.
2. `/marches-du-vivant/explorer` — strictement identique à aujourd'hui.
3. `/marches-du-vivant` + `/entreprises` + `/association` — bandeau Papier Crème harmonieux.
4. `/bioacoustique-poetique` — bandeau sombre émeraude.
5. `/interreg-sudoe-mdv` — bandeau glass sur spectrogramme animé.
6. Mobile 375px sur chaque page : 4 icônes visibles, pas de débordement.

## Hors scope

- L'implémentation effective des **générateurs de reels** (juste la coquille drawer + onglets placeholders).
- Toute modif des pages `/mon-espace`, `/admin`, `/m/:slug`, viewers immersifs.
- Refonte du `MonEspaceHeader` existant.

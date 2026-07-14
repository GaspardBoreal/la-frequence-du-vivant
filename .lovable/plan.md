
# Habillage de marque par événement — Château Boutinet

## Contexte

`marche_events` dispose déjà d'une **scénographie custom** (TSX en base, runtime iframe + Babel via `scenography_code`) et d'un composant one-off `VignobleImmersion` déclenché en dur pour les événements viticoles. C'est puissant pour du sur-mesure total, mais :

- Trop lourd pour une simple charte visuelle (couleurs, typo, logo, chrome hero).
- Non réutilisable : un partenaire = un composant custom.
- Pas de "source de vérité" pour les codes de marque (palette, logotype, CTA).

Objectif : introduire un **Brand Kit** léger, activable par événement, réutilisable, qui **repeint** la page publique existante aux couleurs du partenaire — sans dupliquer la logique métier — tout en gardant l'échappatoire "scénographie code" pour du full custom.

## Codes de marque Château Boutinet (relevés sur chateauboutinet.fr)

- **Palette** : vert sauge tendre `#D4E5C4` (fond principal), crème `#F5EFD9`, ambre chaud `#E8863C` (CTA/accent), noir doux `#1F1F1F` (texte).
- **Dégradé signature** : bandeau ambre→or en transition de section (`#E8863C → #F4B04A`).
- **Typographie** : logotype scripté élégant "Boutinet" (type *Allura* / *Great Vibes*), titres sans-serif fin (Montserrat), corps sans-serif.
- **Signes** : rondelle orange flottante (bouton "Boutique en ligne"), pictos feuille de vigne, cartouches de certifications bio, ton chaleureux, mise en avant du couple, du terroir, de l'AOC.
- **Ambiance** : Gironde, biodynamie, brebis Southdown, dégustation immersive.

## Architecture proposée

### 1. Stockage — `brand_kit` en JSONB sur `marche_events`

Ajout de **3 colonnes** (migration SQL, pas de nouvelle table) :

- `brand_kit_slug TEXT` — identifiant d'un preset codé (`'chateau_boutinet'`, `null` par défaut).
- `brand_kit_overrides JSONB` — surcharges libres (couleurs, logo custom, etc.).
- `brand_kit_enabled BOOLEAN DEFAULT false` — toggle ON/OFF simple, même logique que `scenography_enabled`.

Résolution runtime : preset registre + overrides JSONB fusionnés. Le kit ne s'active que si `brand_kit_enabled = true`. Zéro impact si vide.

### 2. Registre — `src/lib/brandKits/`

```
src/lib/brandKits/
  types.ts                 # type BrandKit { palette, fonts, logo, heroTreatment, ctaShape, dividers, footer, meta }
  registry.ts              # { chateau_boutinet, default }
  presets/
    chateauBoutinet.ts     # palette sauge/ambre, logo script, chrome complet
```

Chaque preset décrit **des tokens** (pas du TSX) : couleurs HSL, familles de fontes Google, URL logo, forme de CTA (`'blob' | 'pill' | 'rounded'`), style de divider (`'wave' | 'vine' | 'straight'`), overlay hero, watermark de section.

### 3. Application runtime — `BrandKitProvider`

- Nouveau `<BrandKitProvider kit={resolved}>` monté par `PublicEventPage` juste avant le rendu (au-dessus de la short-circuit scénographie code).
- Injecte les tokens comme **variables CSS scopées** sur un wrapper (`--bk-bg`, `--bk-accent`, `--bk-font-display`, etc.) → aucune refonte des composants, seul un fichier `brand-kit.css` définit les classes utilitaires optionnelles (`bk-hero`, `bk-cta`, `bk-divider`).
- Charge dynamiquement les Google Fonts via `<link>` injecté (Allura + Montserrat pour Boutinet).
- Le composant `PublicEventPage` utilise des classes `bk-*` **en plus** des classes actuelles ; sans kit actif, elles retombent sur les tokens globaux du site.

### 4. Chrome spécifique Boutinet (dans le preset, pas de code par événement)

Le preset `chateau_boutinet` fournit 4 slots optionnels rendus par des sous-composants **génériques** paramétrés :

- **Hero** : bandeau vert sauge, logotype scripté `Château Boutinet` en SVG texte animé (tracé main), photo terroir avec **rondelle orange flottante** (CTA "Réserver la marche" au lieu de "Boutique").
- **Section divider** : dégradé ambre→or en vague SVG animée au scroll (repris des codes Boutinet).
- **Cartouche certifications** : bandeau bas de hero avec picto AB / Bienvenue à la ferme (data driven via `brand_kit_overrides.badges[]`).
- **Footer signature** : "Un événement co-conçu avec Château Boutinet — Villegouge, Gironde" + liens réseaux du partenaire.

### 5. Admin — Onglet "Marque" dans MarcheEventsAdmin

- Sélecteur de preset (dropdown : *Aucun*, *Château Boutinet*, *… futurs partenaires*).
- Toggle ON/OFF.
- Éditeur JSON simple des `brand_kit_overrides` (pour ajuster logo, badges, CTA label sans re-déployer).
- Aperçu live (iframe `/m/:slug?preview_brand=1`).

### 6. Disruption — Ce qui rend ça "wahouh"

- **Zero-code onboarding** d'un partenaire : ajout d'un preset TypeScript (~150 lignes) → tout événement de ce partenaire hérite instantanément de la charte.
- **Cohabitation** avec la scénographie code : si les deux sont actifs, la scénographie code gagne (échappatoire artistique intacte).
- **Progressive enhancement** : sans kit, la page publique est identique. Avec kit, elle devient un mini-site de marque **sans dupliquer une ligne de logique métier** (bio, marcheurs, témoignages, carte restent branchés).
- **Signature animée** : tracé SVG main du logotype scripté Boutinet au chargement du hero (motion `pathLength`), rondelle orange en pulse organique reprenant `OrganicButton`.
- **Extension future** : un preset = une identité, versionnable, A/B testable, et exportable en "media kit" JSON pour les partenaires.

## Plan d'implémentation

1. **Migration SQL** : ajout des 3 colonnes `brand_kit_*` sur `marche_events` + policy `authenticated` maintenue, `anon` lit déjà via les policies publiques existantes.
2. **Registre & preset** : `src/lib/brandKits/{types,registry}.ts` + `presets/chateauBoutinet.ts`.
3. **Provider & CSS** : `src/components/brand-kit/BrandKitProvider.tsx` + `src/styles/brand-kit.css` (variables CSS scopées + utilitaires).
4. **Sous-composants slottables** : `BrandHero`, `BrandDivider`, `BrandBadges`, `BrandFooter` dans `src/components/brand-kit/`.
5. **Intégration `PublicEventPage`** : lecture des colonnes via nouveau hook `useEventBrandKit(slug)`, wrap du contenu par le provider, remplacement conditionnel du hero/divider/footer par les variantes brandées.
6. **Admin** : onglet "Marque" dans `MarcheEventsAdmin` (sélecteur, toggle, JSON overrides, bouton preview).
7. **Activation Boutinet** : `UPDATE marche_events SET brand_kit_slug='chateau_boutinet', brand_kit_enabled=true WHERE public_slug='chateau-boutinet-le-vignoble-vivant-2026-09-26';` (via l'admin, une fois l'UI livrée).

## Détails techniques

- **Fusion des tokens** : `resolved = deepMerge(registry[slug], overrides)` — les overrides gagnent, permettant de personnaliser un événement Boutinet sans forker le preset.
- **Chargement fontes** : `document.head.appendChild(<link rel="stylesheet">)` guardé par ref pour éviter les doublons, cleanup au démontage.
- **Scope CSS** : toutes les variables sont préfixées `--bk-*` et déclarées sur `[data-brand-kit="<slug>"]` — impossible de fuiter sur le reste de l'app.
- **SSR/SEO** : `<Helmet>` peut lire `kit.meta` pour surcharger `og:image` et theme-color aux couleurs du partenaire.
- **Fallback** : si `brand_kit_slug` pointe vers un preset inexistant, log console + rendu par défaut (pas d'erreur bloquante).
- **Compat scénographie code** : `if (sceno?.scenography_code && sceno.scenography_enabled) return <ScenographyRuntime />` reste en amont ; le brand kit ne s'applique que dans le rendu "standard".

## Ce qui n'est PAS fait (garde-fous)

- Aucune modification de la logique biodiversité, marcheurs, RLS, ou export.
- Aucun changement du composant `VignobleImmersion` existant (peut être migré plus tard vers un preset).
- Pas de nouvelle table, pas de bucket storage — les assets partenaires (logo) sont référencés par URL dans le preset ou l'override.



# Navigation Précédent / Suivant — Carnets de Terrain

## Concept Design

Un composant de navigation **"swipe-inspired"** mobile-first, elegant et coherent avec l'esthetique geopoetique :

### Mobile (prioritaire)
- **Barre fixe en bas de l'ecran** (sticky bottom), semi-transparente avec backdrop-blur (glassmorphisme)
- Deux zones tactiles larges : fleche gauche (precedent) + fleche droite (suivant)
- Au centre : nom abrege de la marche courante + indicateur de position ("3 / 15")
- Quand on maintient/survole une fleche : le nom de la marche precedente/suivante apparait en slide-up subtil
- Hauteur : 60px, suffisamment large pour les pouces
- Disparait au scroll vers le bas (lecture), reapparait au scroll vers le haut (navigation)

### Desktop
- Meme barre mais plus raffinee : le nom complet des marches prev/next est toujours visible
- Layout : `← Nom precedent | 3/15 | Nom suivant →`
- Max-width 4xl, centree, coins arrondis, legere elevation

### Interaction
- Le tri suit l'ordre par "score de completude" (identique a la galerie) pour coherence
- Si premiere marche : fleche gauche desactivee (opacite reduite)
- Si derniere marche : fleche droite desactivee
- Transition de page en fade (deja geree par le router)

## Modifications techniques

### Fichier `src/pages/CarnetDeTerrain.tsx`

1. **Calculer prev/next** a partir de `allMarches` (deja charge) :
   - Trier par `completeness_score` descendant (meme ordre que la galerie)
   - Trouver l'index de la marche courante
   - Extraire `prevMarche` et `nextMarche`

2. **Ajouter le composant de navigation** juste avant le `<Footer />` :
   - Barre sticky `fixed bottom-0` avec `bg-background/80 backdrop-blur-lg border-t border-emerald-500/10`
   - Deux `<Link>` (prev/next) avec les slugs calcules
   - Indicateur central : position / total
   - Classes responsive : sur mobile, noms tronques ; sur desktop, noms complets
   - Z-index eleve pour rester au-dessus du contenu
   - Padding-bottom sur le contenu principal pour compenser la barre fixe

3. **Auto-hide au scroll** :
   - Un petit hook `useScrollDirection` qui detecte scroll up vs down
   - La barre se translate vers le bas (cachee) au scroll down, remonte au scroll up
   - Transition CSS `transform 0.3s ease`

### Aucun nouveau fichier necessaire

Tout le code sera integre directement dans `CarnetDeTerrain.tsx` pour rester simple : le hook scroll direction (quelques lignes) + le JSX de la barre de navigation.

### Style visuel

- Fond : `bg-background/80 backdrop-blur-xl`
- Bordure superieure : `border-t border-emerald-500/15`
- Fleches : icones `ChevronLeft` / `ChevronRight` en emeraude
- Noms des marches : `font-crimson` en `text-foreground/80`, tronques avec `truncate` sur mobile
- Indicateur : `text-xs text-muted-foreground font-mono`
- Desactivee : `opacity-30 pointer-events-none`


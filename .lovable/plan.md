
# Refonte complete du PDF imprimable -- Plaquette marketing "La Frequence du Vivant"

## Objectif

Transformer le rendu PDF/impression de la page `/marches-du-vivant/explorer` : passer d'un fond blanc generique a une veritable plaquette marketing professionnelle sur fond vert degrade, fidele a l'identite visuelle de La Frequence du Vivant.

## Concept visuel

Le PDF imprime utilisera un degrade de verts profonds (foret sombre vers emeraude) comme fond principal, avec du texte clair (blanc casse, creme) et des accents dores/ambre. L'esprit : un document que l'on poserait sur la table d'un conseil municipal ou d'une direction RSE, et qui inspire immediatement confiance et emerveillement.

## Modifications techniques

### 1. Fichier `src/index.css` -- Refonte complete du bloc `@media print`

**Fond et couleurs globales :**
- Fond principal : degrade vertical du vert foret profond (`#0c2a1a`) vers emeraude sombre (`#134e3a`) puis vers teal nuit (`#0f3d3e`)
- Texte principal : blanc casse (`#f0f7f4`) au lieu du noir
- Activation de `-webkit-print-color-adjust: exact` et `print-color-adjust: exact` pour forcer les navigateurs a imprimer les couleurs de fond

**Titres et hierarchie :**
- `h1`, `h2` : blanc pur ou creme clair avec un leger text-shadow pour la lisibilite
- Sous-titres et labels : teinte menthe/emeraude claire (`#86efac`)
- Texte courant : gris tres clair (`#d1d5db`) pour le contraste sur fond sombre

**Cards et encadres (`.print-card`) :**
- Fond semi-transparent vert clair (`rgba(255,255,255,0.08)`) avec bordure fine emeraude (`rgba(134,239,172,0.2)`)
- Pas de fond blanc force

**Badges et accents :**
- Les badges conservent des teintes emeraude/ambre claires adaptees au fond sombre

**CTA "Rejoindre l'aventure" :**
- Version print : fond blanc, texte vert fonce, bordure blanche -- pour ressortir sur le fond sombre

**Ligne verticale de timeline :**
- Blanc/creme semi-transparent au lieu du gris

**Elements caches :**
- Nav, footer, popup, boutons d'action : toujours masques a l'impression
- Les ornements botaniques SVG : rendus visibles en print avec une opacite augmentee en blanc/creme pour enrichir le fond vert

### 2. Fichier `src/pages/MarchesDuVivantExplorer.tsx` -- Ajustements print

**Classes print ajoutees sur les elements cles :**
- Sections : ajout de classes `print:` pour adapter les couleurs de texte (blanc sur fond sombre)
- Cards des piliers : classes `print:` pour basculer texte et icones en clair
- Timeline (etapes de l'experience) : bordures et textes adaptes au fond sombre
- Bars de zones blanches : visibles sur fond sombre
- Calendrier : texte clair
- CTA final : inversion des couleurs pour impression

**Ornements botaniques :**
- Retrait du `print:hidden` sur les SVG botaniques pour qu'ils apparaissent en filigrane creme/vert clair sur le PDF

**Ajout d'un en-tete print-only :**
- Un bandeau discret en haut de la premiere page avec le nom "Les Marches du Vivant" et le site web, visible uniquement a l'impression (`hidden print:block`)

**Ajout d'un pied de page print-only :**
- Coordonnees, site web, mention "Association loi 1901" -- visible uniquement a l'impression

### 3. Resume des sections du PDF

Le document imprime contiendra dans l'ordre :
1. **Couverture** : Titre "Devenez Marcheur du Vivant", baseline poetique, mention "Gratuit -- Ouvert a tous"
2. **Les fondations** : 3 piliers (Geopoetique, Science Participative, Technologie Frugale)
3. **Comment ca marche** : 3 etapes numerotees
4. **Votre progression** : 4 roles (Marcheur > Eclaireur > Ambassadeur > Sentinelle)
5. **Les zones blanches** : Explication + barres de multiplicateurs
6. **Vivez l'experience** : Recit immersif en 4 temps (09h-12h)
7. **Calendrier de lancement** : 3 dates
8. **CTA de cloture** : "Rejoignez les premiers Marcheurs du Vivant"

### 4. Contraintes techniques

- `print-color-adjust: exact` est necessaire sur Chrome/Edge pour forcer l'impression du fond colore
- Les degrades CSS fonctionnent a l'impression sur les navigateurs modernes
- Les textes en `bg-clip-text text-transparent` (gradient text) seront remplaces par une couleur solide claire en print via des classes utilitaires Tailwind

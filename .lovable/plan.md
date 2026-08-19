# « Vos espaces partenaires » : une carte de marque, pas une ligne de liste

Sur la copie d'écran, la section partenaire est le point faible : la carte BRAD est coupée par le fondu bas et recouverte par le texte de pied de fenêtre, le nom est tronqué (« BRAD TECHNOL… ») parce que le badge « Partenaire IoT » lui vole la ligne, et le logo est écrasé dans une pastille carrée pensée pour une icône.

## Ce que je propose

### 1. La carte partenaire devient une carte de marque
- Format pleine largeur (elle ne se bat plus pour une demi-colonne) : le logo respire dans une plaque claire de 56 px, `object-contain` avec un fond blanc léger — un logo d'entreprise ne se recadre pas comme une photo de jardin.
- Le nom passe sur sa propre ligne, en une graisse plus affirmée, sans troncature prématurée ; s'il est vraiment long, il se coupe proprement sur deux lignes.
- Le badge « Partenaire IoT » descend sur la ligne d'informations, à côté d'une puce d'état.

### 2. Une ligne d'information utile plutôt qu'un libellé générique
- « 4 sondes » devient un compteur lisible avec pastille (point vert discret), suivi de « poste de contrôle · carte ».
- Accent chromatique cohérent : la section partenaire adopte un liseré sky/cyan côté gauche, ce qui la distingue visuellement des jardins émeraude sans casser le thème.

### 3. Plus rien de coupé en bas
- Le fondu bas et le pied de fenêtre ne mordent plus sur la dernière carte : padding bas de la zone scrollable augmenté et séparateur net au-dessus du pied.
- Le pied de fenêtre passe sur une seule ligne compacte, avec les raccourcis clavier en petites touches (`↑` `↓` `Entrée`) plutôt qu'en phrase.

### 4. Détails de finition
- Étoile « espace par défaut » repositionnée pour ne jamais chevaucher le badge.
- Survol : léger halo sky sur la carte partenaire, flèche d'entrée qui glisse.

## Détail technique
- Modifications limitées à `src/components/community/AppChoiceDialog.tsx`.
- Extraction d'un sous-composant local `PartenaireCard` (grille `sm:grid-cols-1` pour cette section uniquement), en réutilisant `cardBase`, `cardTone`, `StarToggle` et `Chip`.
- Aucune modification de données, de requête, de route ni de navigation : `go(target)` reste le point d'entrée unique.
- Couleurs prises dans les teintes déjà présentes du dialogue (émeraude / sky), pas de nouveau token.

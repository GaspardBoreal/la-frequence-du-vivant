# Plan — Indices progressifs enrichis « Qui suis-je ? »

## Constat
Aujourd'hui le bouton 💡 propose 2 niveaux d'aide (flou 28 → 14 → puis révélation). Sur des espèces complexes (insectes, champignons, plantes proches), 14 px de flou reste trop opaque et le joueur abandonne. Il faut **plus de paliers**, un **dé-floutage plus généreux**, et des **indices narratifs** complémentaires — sans casser l'équilibre du score.

## Échelle d'indices — 4 paliers (au lieu de 2)

| Clic | Mode Flou | Mode Œil de serrure | Mode Silhouette | Indice texte manuscrit ajouté | Malus |
|---|---|---|---|---|---|
| 0 (départ) | blur 32 px | trou 28 % | contraste max | — | 0 |
| 1 💡 | blur 18 px | trou 42 % | contraste -1 cran | 🐦 **Règne** révélé (« C'est un oiseau… ») | −0,25 ⭐ |
| 2 💡💡 | blur 9 px | trou 60 % | contraste -2 crans | 🅿 **Initiale** + nombre de lettres (« P • • • • • • ») | −0,5 ⭐ |
| 3 💡💡💡 | blur 4 px | trou 78 % | quasi-net | 🌿 **Famille** + 1 trait d'écologie (« Famille des Columbidés, granivore ») | −0,75 ⭐ |
| 4 💡💡💡💡 | blur 1 px (quasi-net, juste un voile) | trou 92 % | net | 🎯 **2 lettres masquées remplies** (« P I G E • N ») | −1 ⭐ (≈ aveu d'aide max) |

Score final par espèce = max(0, 1 − malus cumulé). Une réussite avec 4 indices vaut donc 0 ⭐ mais reste comptée comme « trouvée » (badge `CheckCircle2` gris au lieu de doré).

## UX du bouton indice

- Bouton 💡 transformé en **jauge segmentée 4 crans** (style barre de vie manuscrite, traits Caveat).
- Chaque clic remplit un cran, affiche brièvement un **toast manuscrit** (« Petit coup de pouce 🌱 ») et déclenche une **micro-animation** : le voile de flou se rétracte avec un effet « buvard qui sèche ».
- À l'épuisement (4 indices utilisés), le bouton devient **« 🏳 Je donne ma langue au chat »** → révèle la réponse en mode pédagogique, 0 ⭐, mais affiche une fiche découverte mini (nom + 1 phrase écologique).
- Tooltip permanent : « 4 indices possibles — chaque indice te coûte un peu d'étoile ».

## Indices texte — d'où viennent-ils

Tous dérivés des champs déjà disponibles dans `BiodiversitySpecies` (kingdom, family, commonName, scientificName) + le mapping règne→emoji déjà présent dans `MysteryFrame`. Aucun appel réseau, aucune nouvelle dépendance.

Pour le palier 3 (« trait d'écologie »), heuristique locale courte basée sur `family`/`kingdom` (granivore, pollinisateur, saproxylique, héliophile…) avec dictionnaire 20 entrées dans `whoAmIHints.ts`. Fallback générique sinon (« Vit ici, autour de la marche »).

## Fichiers touchés

- `src/components/biodiversity/discover/modes/games/MysteryFrame.tsx` : étendre `revealLevel` de `0|1|2|3` → `0|1|2|3|4|5` (5 = réponse révélée), recalibrer `blurPx` et `keyholeRadius` selon le tableau.
- `src/components/biodiversity/discover/modes/games/WhoAmIGame.tsx` : 
  - state `hintLevel` 0..4 + `gaveUp`;
  - barre segmentée à la place du bouton simple;
  - calcul du malus dégressif et badge score adapté;
  - panneau « Indices » affichant la liste cumulée des indices texte déjà débloqués (cartes papier kraft empilées);
  - état « langue au chat » avec fiche pédagogique.
- `src/components/biodiversity/discover/modes/games/whoAmIHints.ts` *(nouveau)* : helpers `getKingdomHint`, `getInitialHint`, `getFamilyEcologyHint`, `getRevealedLettersHint` + petit dictionnaire écologie.
- `src/components/biodiversity/discover/modes/games/WhoAmIOnboarding.tsx` : ajouter une 4ᵉ règle « 4 indices possibles pour les espèces difficiles ».

Aucune modification de données, edge function, ni schéma. 100 % présentation, cohérent avec la DA manuscrite (Caveat / Patrick Hand, papier kraft, badges Lucide).

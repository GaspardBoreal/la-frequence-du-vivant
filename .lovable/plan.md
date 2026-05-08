
# Refonte de l'Indice de Sentinelle V2 — avec pédagogie intégrée

## Objectif
1. Creuser les écarts entre marcheurs (volume √, sensibles dominantes).
2. **Rendre la notation transparente et ludique** : chaque marcheur comprend d'un coup d'œil comment son score est calculé et ce qu'il peut faire pour le faire grimper.

## Nouvelle formule (total /100)

| Composante | Poids | Formule | Plafond |
|---|---:|---|---|
| **Piliers actifs** | **20 pts** | `(nb_piliers / 5) × 20` | 5 piliers (photo, son, texte, témoignage, espèce sensible) |
| **Volume des contributions** | **20 pts** | `min(√total / √64, 1) × 20` | sature à 64 contributions |
| **Diversité d'espèces** | **20 pts** | `min(species / 20, 1) × 20` | sature à 20 espèces |
| **Espèces sensibles** | **40 pts** | `min((bio×1.5 + aux×1.0 + EEE×2.0) / 15, 1) × 40` | sature ~10 sensibles pondérées |

**Plancher** : 15 dès la 1ʳᵉ contribution. **Plage cible** : 15 → 85.

## Tiers
| Score | Tier | Couleur |
|---|---|---|
| 0–25 | Marcheur curieux | sauge |
| 26–50 | Éclaireur attentif | vert d'eau |
| 51–75 | Ambassadeur confirmé | émeraude |
| 76–100 | Sentinelle vigilante | or pulsant |

## Pédagogie intégrée — la grande nouveauté

Chaque story affiche **deux niveaux de lecture** :

### A. Bandeau "Comment ça marche ?" (méthode générale)
Petit encart pliable (ouvert par défaut au 1er passage, mémorisé via `localStorage`), formulé simplement et imagé :

> **Votre Indice de Sentinelle (sur 100)**
> Il mesure 4 choses, par ordre d'importance :
>
> - 🌿 **Vos détections précieuses** *(jusqu'à 40 pts)* — bio-indicateurs, auxiliaires, espèces invasives. **Le cœur du score.**
> - 🪶 **La variété de vos gestes** *(20 pts)* — photo, son, texte, témoignage, espèce sensible. 1 geste par catégorie = bonus.
> - 📸 **Votre volume de contributions** *(20 pts)* — plus vous documentez, plus ça monte (mais en racine carrée : pas besoin d'en faire 1000).
> - 🦋 **La diversité d'espèces** *(20 pts)* — chaque nouvelle espèce compte jusqu'à 20.

### B. Encart "Votre score, expliqué" (calcul personnel)
Sous la jauge, **4 mini-barres horizontales** + libellé en clair :

```
🌿 Détections précieuses    ●●○○○○○○○○   0 / 40   → "Détectez 1 bio-indicateur : +6 pts"
🪶 Variété des gestes       ●●●○○        12 / 20  → "Ajoutez 1 témoignage : +4 pts"
📸 Volume                   ████████     18 / 20  → "Quasi au max"
🦋 Diversité d'espèces      ●●○○○○○○○○   2 / 20   → "+1 espèce = +1 pt"
                                        ─────
                                        TOTAL    32 / 100
```

Chaque ligne contient :
- Une icône + libellé court
- Une barre visuelle (10 segments ou continue)
- Le score obtenu / max
- **Une astuce contextuelle** ("+X pts si vous faites Y") calculée dynamiquement selon ce qui manque le plus

### C. Tooltip "Pourquoi 40% pour les sensibles ?"
Mini-popover (i) à côté du titre du score :
> "Repérer une espèce bio-indicatrice, c'est lire la santé du milieu. C'est le geste qui apporte le plus à la science citoyenne — donc le plus valorisé."

## Application aux 3 marcheurs (avec décomposition affichée)

| Marcheur | Piliers | Volume | Espèces | Sensibles | **Total** | Conseil affiché |
|---|---:|---:|---:|---:|---:|---|
| **Gaspard** (52 contribs, 2 esp, 0 sensible) | 12 | 18 | 2 | **0** | **32** | "1 bio-indicateur = +6 pts" |
| **Sophie** (17 contribs, 2 esp, 0 sensible) | 12 | 10 | 2 | **0** | **24** | "Ajoutez 1 son : +4 pts" |
| **Jean-paul** (1 témoignage) | 4 | 2.5 | 2 | 0 | **15** (plancher) | "1 photo : +4 pts" |

## Détails techniques

**Fichiers à modifier**
- `src/components/community/exploration/impact/MarcheurImpactPanel.tsx` — nouveau calcul `computeSentinelleIndex()` retournant `{ total, breakdown, tier, nextTip }`.
- `src/components/community/exploration/impact/stories/StoryIndice.tsx` — affichage refondu (jauge + 4 mini-barres + bandeau pédagogique pliable + tooltip).

**Fichiers à créer**
- `src/components/community/exploration/impact/ScoreBreakdown.tsx` — composant réutilisable des 4 mini-barres.
- `src/components/community/exploration/impact/HowItWorksBanner.tsx` — bandeau pliable avec mémorisation `localStorage('impact-how-it-works-collapsed')`.
- `src/lib/sentinelleIndex.ts` — pure fonction de calcul (testable).

**Logique du `nextTip`** (conseil dynamique)
Calcule le geste qui rapporte le plus de points pour l'effort le plus faible :
1. Si aucune sensible → "1 bio-indicateur = +6 pts" (priorité absolue)
2. Sinon si pilier manquant → "Ajoutez 1 [pilier] : +4 pts"
3. Sinon si volume < 64 → "+5 contribs = +X pts"
4. Sinon si espèces < 20 → "+1 espèce = +1 pt"

**Design tokens** : utiliser les variables HSL existantes (`--primary`, `--accent`, `--muted-foreground`). Émeraude/or pour le tier sentinelle, sauge pour les barres au repos.

**Mémoire à mettre à jour**
- `mem://features/community/marcheur-impact-stories-logic` : ajouter section "V2 scoring" + "pédagogie intégrée (bandeau + breakdown + nextTip)".

## Hors scope
- 12 badges (collection inchangée)
- Autres stories (Empreinte, Familles, Détections, Palier, Badges) — pas modifiées
- Aucune modification DB

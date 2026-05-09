
# Évolution de l'Indice de Sentinelle — Pilier "Voix singulière"

## Constat

Aujourd'hui, écrire un haïku rapporte **+4 pts** (1 pilier sur 5) — exactement comme cocher la case « j'ai mis 1 photo ». Karine Log, qui a pris la peine d'écrire, finit avec le même score que des marcheurs qui n'ont fait aucun geste sensible. L'écriture, l'enregistrement sonore et le témoignage — gestes plus rares et plus engageants — méritent d'être visiblement mieux récompensés.

## Nouvelle répartition (toujours sur 100 pts)

| Bloc | Avant | Après | Variation |
|---|---|---|---|
| 🌿 Détections précieuses (bio/aux/EEE) | 40 | **35** | −5 |
| 🪶 Variété des gestes (5 piliers) | 20 | **15** | −5 |
| 🎙 **Voix singulière** (textes + sons + témoignages) | — | **20** | **NOUVEAU** |
| 📸 Volume de contributions | 20 | **15** | −5 |
| 🦋 Diversité d'espèces | 20 | **15** | −5 |
| **Total** | 100 | **100** | = |

## Le nouveau pilier "Voix singulière" en détail

Calcul d'un score d'expression sensible, plafonné à 20 pts :

```
voix = textes × 2.5  +  sons × 2.5  +  temoignage × 2.5
voixValue = min(voix / 10, 1) × 20
```

- 1 texte (haïku, récit, légende — tous égaux) = **+5 pts** environ
- 1 son = **+5 pts**
- 1 témoignage post-événement = **+5 pts** (même traitement que les textes)
- Saturation à 4 gestes cumulés (au-delà, on bascule sur le bloc volume)
- Plancher : si au moins 1 contribution textuelle/sonore/témoignage → minimum 5 pts dans ce bloc

## Impact concret pour Karine Log (ex. 1 haïku, 0 photo, 0 son)

| | Avant | Après |
|---|---|---|
| Piliers (1/5) | 4 | 3 |
| Volume (1 contrib) | 2 | 2 |
| Espèces | 0 | 0 |
| Sensibles | 0 | 0 |
| **Voix singulière** | — | **+5** |
| Plancher | 15 | 15 |
| **Total** | **15** | **20** |

Une marcheuse avec **2 photos seulement** restera autour de 15 pts (plancher). L'écart se creuse en faveur de l'expression sensible.

## Aperçu UI

Dans `ScoreBreakdown` (Stories), une nouvelle ligne apparaît :

```
🎙 Voix singulière           5 / 20
   ─────────────────░░░░░
   1 texte · 0 son · 0 témoignage
```

Le conseil dynamique (`nextTip`) priorisera : « Ajoutez 1 texte ou 1 son : +5 pts » si `voix < 20`, juste après la priorité bio-indicateur.

Aucun changement dans les chips de la vue Marcheurs (le total sur 100 reste comparable). Aucun marcheur ne perd de points en valeur absolue significative — seuls les rangs se rééquilibrent en faveur des plus expressifs.

## Détails techniques

**Fichiers modifiés :**

1. **`src/lib/sentinelleIndex.ts`** — refonte des coefficients :
   - `SentinelleInputs` reste inchangé (déjà `photos`, `sons`, `textes`, `hasTemoignage`)
   - `SentinelleBreakdown` gagne une 5ᵉ entrée `voix: { value, max, textes, sons, temoignage }`
   - Nouvelles constantes : `VOIX_CAP = 10` (en unités pondérées), poids `pillars=15 / volume=15 / species=15 / sensible=35 / voix=20`
   - Plancher de 15 pts conservé
   - `computeNextTip` : nouvelle branche prioritaire #2 (juste après sensibles) si `voix < 20`

2. **`src/components/community/exploration/impact/ScoreBreakdown.tsx`** — ajout d'une 5ᵉ row 🎙 « Voix singulière », couleur `hsl(280 60% 65%)` (violet doux pour le poétique). Mettre à jour les `max` des autres rows (35/15/15/15).

3. **Mémoire** — mettre à jour [Impact Stories](mem://features/community/marcheur-impact-stories-logic) avec la nouvelle ventilation 35/20/15/15/15 et le pilier "Voix singulière".

**Aucun changement** :
- Pas de migration SQL
- Pas de modification de `useMarcheurSensibleSpecies`, `useMarcheurBadges`, `MarcheurImpactPanel`, `MarcheursTab` (signatures inchangées)
- Les seuils de tier (26/51/76) restent — un Sentinelle reste un Sentinelle

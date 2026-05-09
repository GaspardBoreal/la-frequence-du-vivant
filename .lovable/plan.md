# Paliers de Fréquence — plus de nuance, vocabulaire aligné

## Objectif

Remplacer les 4 paliers actuels (Curieux / Éclaireur / Ambassadeur / Sentinelle) par **6 paliers** plus inspirants, et renommer le **score** en **Fréquence** dans toute l'UI.

## Nouveaux paliers

| Score | Palier | Tonalité |
|---|---|---|
| `0` | *(rien affiché)* | Le marcheur n'apparaît pas avec un palier — invitation implicite à entrer dans la fréquence. |
| `1 – 5` | **Éveil** | Premier souffle, premier geste. |
| `6 – 15` | **Curieux** | L'attention s'aiguise. |
| `16 – 29` | **Écoute active** | La perception s'affine, le marcheur revient et observe. |
| `30 – 49` | **Éclaireur** | Contribue régulièrement, ouvre la voie. |
| `50 – 100` | **Engagé** | Voix singulière, présence assumée au service du Vivant. |

Chaque palier reçoit :
- un **libellé court** (ex. `Engagé`) et un **libellé enrichi** (ex. `Marcheur engagé`)
- une **couleur sémantique** (token HSL existant) du plus pâle au plus dense
- une **micro-phrase poétique** affichée en tooltip / story (ex. Éveil : *« Un premier pas, déjà une présence. »*)

## Renommage UI : SCORE → Fréquence

Partout où le score 0-100 est affiché, on parle désormais de **Fréquence** :
- Carte marcheur : `67 / 100` → **`Fréquence 67`**
- Bloc impact : « Indice de Sentinelle » conservé comme nom du système, mais la valeur s'appelle **« Fréquence »**
- Tooltip / breakdown : « Score total » → **« Fréquence du marcheur »**
- Stories : « Ton score » → **« Ta Fréquence »**

Le palier reste un *qualificatif* de la Fréquence : « Fréquence 32 — Éclaireur ».

## Périmètre — UI uniquement

- Aucune migration BDD.
- Les **rôles communauté** (`community_profiles.role` = `curieux/eclaireur/ambassadeur/sentinelle`) restent inchangés : ils gouvernent la sécurité, RLS, droits de curation, badges. Ce sont **deux concepts distincts** des paliers de Fréquence (qui sont per-exploration).
- Les types TS internes (`SentinelleTier`) gardent leurs noms techniques pour ne rien casser ; seuls les **libellés affichés** changent.

## Détails techniques

### `src/lib/sentinelleIndex.ts`
- Étendre `SentinelleTier` : `'eveil' | 'curieux' | 'ecoute' | 'eclaireur' | 'engage' | 'aucun'`.
- Réécrire la fonction de calcul du palier avec les nouveaux seuils (1-5, 6-15, 16-29, 30-49, 50+).
- Ajouter un champ `tierPhrase` (micro-phrase poétique) et `tierColorToken` (token sémantique).
- Retourner `tier: 'aucun'` quand `total === 0` pour que l'UI sache ne rien afficher.

### Composants UI à mettre à jour
- `MarcheursTab.tsx` — masquer le palier si `tier === 'aucun'`, afficher `Fréquence {n}` + libellé palier.
- `ScoreBreakdown.tsx`, `MarcheurImpactPanel.tsx`, `ImpactStoriesViewer.tsx`, `ValorizationBlock.tsx`, `ProgressionCard.tsx` — remplacer « score » / « Indice » (au sens valeur) par « Fréquence ».
- `useMarcheurBadges.ts` — vérifier que les seuils de badges restent cohérents avec les nouveaux paliers ; ajuster si un badge se déclenchait sur l'ancien palier `eclaireur` (≥26).
- Charte couleur : 6 tokens dégradés (du sable doux au vert profond) ajoutés à `index.css` si absents.

### Hors périmètre
- Pas de changement aux rôles `community_profiles`.
- Pas de changement à la formule de calcul du score (le rééquilibrage Voix singulière reste tel quel).
- Pas de migration de la mémoire `community-progression-logic` (rôles ≠ paliers).

## Mémoire
Mettre à jour `mem://features/community/marcheur-impact-stories-logic` et le core terminology pour refléter : « le score d'une exploration s'appelle **Fréquence**, décliné en 6 paliers UI ».

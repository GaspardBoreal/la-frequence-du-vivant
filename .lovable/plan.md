

# Tri du carnet de route par date d'événement décroissante

## Problème

Les participations dans "Mon carnet de route" sont triées par `created_at` (date d'inscription), pas par `date_marche` (date de l'événement). Un marcheur inscrit tôt à un événement lointain le verra en haut, ce qui n'est pas logique.

## Solution

Dans `MarchesTab.tsx`, trier localement le tableau `participations` par `date_marche` décroissant avant le `.map()` du carnet de route. On ne modifie pas la query du hook (utilisée ailleurs) — on fait un `.slice().sort()` côté affichage.

## Fichier modifié

| Fichier | Changement |
|---------|-----------|
| `src/components/community/tabs/MarchesTab.tsx` | Ligne ~274 : créer `sortedParticipations` trié par `date_marche` desc, utiliser dans le `.map()` |


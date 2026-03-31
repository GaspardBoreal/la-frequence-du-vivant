

# Refonte UX des vignettes du Carnet Vivant (vue liste)

## Constat

Les cartes du Carnet Vivant (`MarcheCard` dans `CarnetVivant.tsx`) utilisent un design minimaliste timeline avec petits badges compteurs empilés, tandis que les cartes de l'onglet Marches (`EventCard` dans `MarchesTab.tsx`) ont un design plus riche et lisible : titre proéminent, description, badges pilliers colorés, date et lieu bien structurés.

## Modifications - fichier unique : `src/components/community/CarnetVivant.tsx`

### Refonte du composant `MarcheCard`

Reprendre la structure visuelle de `EventCard` :

1. **Titre en premier** : le titre de l'événement (`event.title`) en `text-sm font-semibold`, pas le lieu
2. **Exploration en sous-titre** : nom de l'exploration si présent, en texte discret
3. **Ligne date + lieu** : date formatée en `dd MMM yyyy` + lieu avec icone MapPin, comme dans EventCard
4. **Badges pilliers thématiques** : réutiliser la logique `detectPillars` (Biodiversité, Bioacoustique, Géopoétique) avec les mêmes pastilles colorées arrondies
5. **Données collectées** : garder les compteurs photos/sons/textes/espèces mais les afficher en ligne compacte avec icones (pas en colonnes empilées)
6. **Carte arrondie** : `rounded-xl`, padding `p-3.5 space-y-2`, mêmes couleurs de fond emerald pour les participations validées

### Suppression du composant `CountBadge`

Remplacé par des badges inline plus élégants alignés sur le style Marches.

### Ce qui ne change PAS

- La structure timeline (dots, border-l, seasons accordion) reste identique
- Le header "Mon carnet vivant" reste identique
- Le regroupement par saison reste identique
- Aucun autre fichier modifié

## Fichier impacté

| Fichier | Action |
|---|---|
| `src/components/community/CarnetVivant.tsx` | Refonte du composant `MarcheCard` pour matcher le style `EventCard` |


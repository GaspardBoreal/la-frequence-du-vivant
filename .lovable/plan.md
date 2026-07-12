## Objectif

Ajouter, à droite du bandeau « Visibilité publique » de l'onglet Liste de `/admin/marche-events`, un filtre « Coordonnées GPS » pour isoler rapidement les événements sans GPS (à géocoder / compléter).

## UI proposée

Sur la même ligne que « Visibilité publique : Tous / Publics / Privés », ajouter un second groupe :

```text
📍 GPS :  [ Tous ] [ Avec GPS ] [ Sans GPS (n) ]
```

- Séparateur visuel discret (`<span className="mx-2 h-4 w-px bg-border" />`) entre les deux groupes.
- Le badge « Sans GPS » affiche le nombre d'événements sans coordonnées dans la page courante (badge compteur si > 0, sinon simple libellé).
- Sur mobile, le second groupe passe à la ligne (déjà géré par `flex-wrap` existant).
- Pastille rouge discrète sur les cartes d'événements sans GPS : `<span>⚠ GPS manquant</span>` à côté du lieu, pour repérer d'un coup d'œil.

## Comportement

- Nouvel état local `gpsFilter: 'all' | 'with' | 'without'` dans `EventsListTab.tsx`.
- Le filtre s'applique côté client sur `allRows` (comme `publicFilter`), en combinant les deux :
  - `with` → `r.latitude != null && r.longitude != null`
  - `without` → `r.latitude == null || r.longitude == null`
- Le compteur « Sans GPS (n) » se calcule via `useMemo` sur `allRows`.
- Aucun changement backend, RPC, ou schéma.

## Fichier modifié

- `src/components/admin/marche-events/EventsListTab.tsx` uniquement :
  - Ajouter l'état `gpsFilter`.
  - Ajouter le second groupe de boutons dans le bandeau existant (ligne 59-74).
  - Étendre le `useMemo` `rows` pour combiner `publicFilter` + `gpsFilter`.
  - Ajouter la pastille « GPS manquant » dans la carte événement (près de `MapPin`).

## Hors scope

- Pas de modification de la carte publique `/marches-du-vivant/carte-marches-du-vivant` (déjà traitée).
- Pas de géocodage automatique (le user a choisi la saisie manuelle).

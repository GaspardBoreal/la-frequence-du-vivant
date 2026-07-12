## Diagnostic

Requête directe en base :


| Métrique                     | Valeur |
| ---------------------------- | ------ |
| Total marche_events          | **17** |
| Avec coordonnées lat/lon     | **12** |
| À venir (date ≥ aujourd'hui) | **2**  |
| Géolocalisés ET à venir      | **2**  |


Deux causes se combinent :

### Cause n°1 — Filtre "à venir" par défaut (impact majeur)

Dans `src/hooks/useCarteMdV.ts`, `DEFAULT_FILTERS.status = 'upcoming'`. Résultat : sur les 12 événements géolocalisés, **10 sont passés** (2025 → juillet 2026) et sont masqués. Seuls les 2 événements de septembre 2026 restent → **2 marqueurs sur la carte**.

### Cause n°2 — RPC exclut les événements sans coordonnées

`get_marches_map_events()` contient `WHERE me.latitude IS NOT NULL AND me.longitude IS NOT NULL`. Les 5 événements sans GPS ne remontent jamais, donc :

- Le compteur "12 événement(s)" est plafonné à 12 alors que l'admin en voit 17
- Impossible de les afficher dans Liste / Timeline / Mur / Constellation (vues non cartographiques)

### Cause n°3 — 5 événements sans GPS en base


| #   | Titre                              | Lieu texte        | Géocodable ?  |
| --- | ---------------------------------- | ----------------- | ------------- |
| 1   | DEVIAT "Jardin Monde…"             | DEVIAT            | Oui           |
| 2   | Les Arbres Gardiens                | Dordogne          | Oui (approx.) |
| 3   | DEVIAT "Marcher sur un sol…" 5 km  | DEVIAT - Charente | Oui           |
| 4   | DEVIAT "Marcher sur un sol…" 10 km | DEVIAT - Charente | Oui           |
| 5   | TAMNIES en liberté                 | *(aucun lieu)*    | Non           |


## Plan de correction

### 1. RPC : ne plus exclure les événements sans GPS

Migration sur `get_marches_map_events()` : retirer la clause `WHERE latitude IS NOT NULL`. La carte filtrera côté client (`e.latitude != null`), tandis que Liste / Timeline / Mur / Constellation afficheront **tous** les événements.

### 2. Filtres par défaut plus inclusifs

Dans `useCarteMdV.ts` :

- `DEFAULT_FILTERS.status`: `'upcoming'` → `'all'` (17 événements visibles d'entrée)
- Ajouter dans `FiltersBar` un badge/indicateur discret "17 événements · 2 à venir · 15 passés"

### 3. MapView : compteur + panneau "sans localisation"

- Compteur "X géolocalisés sur Y" reflète les événements *filtrés* (pas le total brut)
- Petit encart sous la carte listant les événements sans coordonnées avec lien vers l'admin pour les compléter (visible admin uniquement)

### 4. Backfill géocodage (optionnel, à confirmer)

Créer une edge function `geocode-marche-events` qui appelle Google Maps Geocoding via le connecteur pour les 4 événements ayant un `lieu` texte. À déclencher manuellement depuis l'admin (bouton "Géocoder les marches sans GPS"). Le 5ᵉ événement (TAMNIES sans lieu) reste à compléter manuellement.

## Détails techniques

- **Migration** : `CREATE OR REPLACE FUNCTION public.get_marches_map_events()` sans `WHERE lat/lon NOT NULL`.
- **Frontend** : `MapView` filtre `events.filter(e => e.latitude && e.longitude)` ; les autres vues consomment `filtered` tel quel.
- **Types** : `CarteMdVEvent.latitude/longitude` deviennent `number | null`.
- **FiltersBar** : sélecteur "Statut" reste, seul le défaut change.

## Question ouverte

je compléte manuellement les 5 coordonnées dans l'admin
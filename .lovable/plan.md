

# Detecteur de Zones Blanches pour les Ambassadeurs

## Contexte

Les "zones blanches" sont des territoires sans aucune mesure de biodiversite. La page Explorer les decrit deja conceptuellement. L'objectif est de creer un **outil fonctionnel** permettant aux Ambassadeurs de trouver les zones blanches les plus proches -- soit de leur position GPS, soit d'une adresse saisie.

## Sources de donnees analysees

### GBIF (deja integre)
L'edge function `biodiversity-data` interroge deja l'API GBIF (`api.gbif.org/v1/occurrence/search`) avec des coordonnees et un rayon. **C'est la source ideale pour detecter les zones blanches** : si GBIF retourne 0 occurrence dans un rayon donne, c'est une zone blanche.

### Lexicon (osfarm.org)
Deja integre via le proxy `lexicon-proxy`. Fournit des donnees cadastrales/parcellaires. **Pas pertinent pour la biodiversite** -- utile uniquement pour identifier le nom de commune d'un point GPS.

### data.gouv.fr MCP Server
Serveur MCP experimental en lecture seule. Interessant conceptuellement mais **trop complexe et instable** pour un outil simple d'ambassadeur. A explorer dans une phase ulterieure.

### Geocoding Nominatim (deja integre)
`src/utils/geocoding.ts` -- conversion adresse vers coordonnees. Reutilisable tel quel.

## Strategie de detection des zones blanches

Plutot que d'interroger un seul point, on interroge une **grille de points** autour de la position de l'utilisateur. Pour chaque point, on fait un appel GBIF leger (count only) pour determiner si des observations existent. Les points avec 0 observation sont des zones blanches.

### Algorithme

1. L'utilisateur donne sa position (GPS ou adresse)
2. On genere **8 points cardinaux** autour de sa position a des distances de 5, 10 et 15 km (soit 24 points + le point central = 25 points)
3. Pour chaque point, on appelle GBIF avec `limit=0` (count only) pour obtenir `count` d'occurrences dans un rayon de 2 km
4. Les points avec count = 0 sont des zones blanches
5. On trie par distance et on presente les plus proches

**Probleme** : 25 appels GBIF c'est trop. Solution alternative :

### Algorithme simplifie (retenu)

1. Position utilisateur obtenue
2. **Une seule edge function** `detect-zones-blanches` fait le travail :
   - Genere **8 directions** (N, NE, E, SE, S, SW, W, NW) a 5 km et 10 km = 16 points
   - Pour chaque point, fait un appel GBIF `limit=0` pour obtenir le `count`
   - Retourne les points tries : zones blanches (count=0) d'abord, puis par distance
3. Resultat affiche sur une mini-carte Leaflet

### Limitation des usages

3 recherches max par session, stockees dans `sessionStorage`.

## Architecture technique

### 1. Nouvelle edge function : `supabase/functions/detect-zones-blanches/index.ts`

**Input** : `{ latitude, longitude }`

**Logique** :
- Genere 8 points a 5 km + 8 points a 10 km autour du centre
- Pour chaque point, appelle `https://api.gbif.org/v1/occurrence/search?limit=0&decimalLatitude=X&decimalLongitude=Y&radius=2` (reponse tres legere, juste le count)
- Classe les points : zones blanches (count=0) en premier, triees par distance
- Reverse geocode les 3 meilleures zones blanches via Nominatim pour afficher un nom de lieu

**Output** :
```json
{
  "center": { "lat": 44.85, "lng": -0.57, "label": "Bordeaux" },
  "zones": [
    { "lat": 44.90, "lng": -0.52, "distance_km": 5.2, "observations": 0, "label": "Commune X", "is_blank": true },
    { "lat": 44.80, "lng": -0.62, "distance_km": 5.1, "observations": 3, "label": "Commune Y", "is_blank": false }
  ],
  "blank_count": 4,
  "total_scanned": 16
}
```

### 2. Nouveau composant : `src/components/zones-blanches/DetecteurZonesBlanches.tsx`

Un widget autonome, elegant, inserable dans la page Explorer. Design :

- Fond blanc avec bordure stone, coins arrondis, ombre douce (coherent avec la section zones blanches existante)
- **Deux boutons** cote a cote :
  - "Ma position" (icone GPS) -- appelle `navigator.geolocation`
  - Champ texte + bouton "Chercher" -- adresse libre geocodee via Nominatim
- **Etat de chargement** : animation subtile avec texte "Exploration en cours..."
- **Resultats** : liste des zones blanches trouvees avec distance, nom de commune, et un petit indicateur vert/rouge
- **Mini-carte Leaflet** (optionnelle, phase 2) montrant les points
- **Compteur de requetes** : "Il vous reste X recherches" affiche en discret sous le widget
- Quand les 3 recherches sont epuisees : message poetique invitant a revenir

### 3. Integration dans `src/pages/MarchesDuVivantExplorer.tsx`

Inserer le widget **dans la section "Zones blanches" existante** (lignes 355-401), juste apres le texte explicatif et les barres de multiplicateurs. C'est l'emplacement naturel : le lecteur vient de comprendre ce que sont les zones blanches, on lui donne l'outil pour les trouver.

### 4. Hook : `src/hooks/useDetecteurZonesBlanches.ts`

- Gere l'appel a l'edge function
- Gere le compteur de session (sessionStorage)
- Gere le geocoding d'adresse via `geocodeAddress`
- Gere la geolocalisation GPS via `navigator.geolocation`
- Expose : `{ search, searchByAddress, results, isLoading, remainingSearches }`

## Fichiers a creer/modifier

| Action | Fichier |
|--------|---------|
| Creer | `supabase/functions/detect-zones-blanches/index.ts` |
| Creer | `src/hooks/useDetecteurZonesBlanches.ts` |
| Creer | `src/components/zones-blanches/DetecteurZonesBlanches.tsx` |
| Modifier | `src/pages/MarchesDuVivantExplorer.tsx` (insertion du widget) |

## Estimation de charge API

- 16 appels GBIF `limit=0` par recherche (tres legers, ~200ms chacun)
- 3 appels Nominatim reverse geocode (pour nommer les zones blanches)
- 3 recherches max par session = **~57 appels GBIF max par session**
- GBIF n'a pas de limite stricte pour les appels en lecture


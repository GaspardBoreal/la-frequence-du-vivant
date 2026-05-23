## Objectif

Enrichir discrètement la section **Cadastre** du popup parcelle (`ParcelPopup.tsx`) avec :
- Une ligne **GPS** : `lat, lng` en décimal 6 chiffres + bouton copier (icône → check animée 2s)
- Une ligne **Découvrir sur** : 2 liens texte « Google Maps · Google Earth » ouvrant le point exact dans un nouvel onglet

## Fichier modifié

`src/components/cadastre/ParcelPopup.tsx` uniquement.

## Détails techniques

**Source des coordonnées** : le `centroid` (lat/lng) est déjà passé en prop au composant.

**Ligne GPS** (sous le bloc Surface, dans la section Cadastre) :
```
GPS : 45.123456, 0.123456  [📋]
```
- Format : `lat.toFixed(6), lng.toFixed(6)`
- Bouton copier : `lucide-react` `Copy` → `Check` (vert) pendant 2s via `useState` + `setTimeout`
- Copie via `navigator.clipboard.writeText()` avec fallback `document.execCommand('copy')` si indisponible
- Pas de toast (feedback visuel via l'icône check, plus discret)
- Click event : `e.stopPropagation()` + `e.preventDefault()` pour ne pas perturber Leaflet

**Ligne Découvrir** :
```
Découvrir sur : Google Maps · Google Earth
```
- Google Maps : `https://www.google.com/maps/@{lat},{lng},18z` (ou `?q={lat},{lng}` pour épingle)
  → choix : `https://www.google.com/maps?q={lat},{lng}` (pose un pin précis)
- Google Earth Web : `https://earth.google.com/web/@{lat},{lng},150a,500d,35y,0h,45t,0r`
  - `150a` = altitude cible ~150m
  - `500d` = distance caméra 500m
  - `35y` = FOV
  - `45t` = inclinaison 45° (vue 3D wahouhh)
- `target="_blank"` + `rel="noopener noreferrer"`
- Style : `text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline transition-colors`
- Séparateur `·` en `text-white/40`

**Robustesse** :
- Si `centroid` est `null` → ne pas afficher la sous-section GPS/Découvrir
- Liens construits via `encodeURIComponent` pas nécessaire (valeurs numériques), mais utiliser `Number.isFinite()` comme garde
- Bouton copier accessible : `aria-label="Copier les coordonnées GPS"` + `title`

## Rendu attendu (section Cadastre enrichie)

```
🗂 CADASTRE
161180000C0863
Préfixe 000 · Section C · N° 863
Surface : 0.1378 ha
GPS : 45.123456, 0.123456  📋
Découvrir sur : Google Maps · Google Earth
```

Tout reste cohérent avec le style glassmorphism dark existant (text-xs, accents emerald/amber/sky).
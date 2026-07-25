## Objectif

Aligner l'expérience de **Propriété → Portrait → Cadastre** sur celle de **Mon espace → Événement → Carte**, avec un menu d'options unifié, un mode plein écran et un bandeau d'adresse sous la carte.

---

## 1. Menu « Options carte » unifié

Réutiliser exactement le même composant `MapOptionsMenu` (bouton rond glassmorphique en bas de carte + Popover desktop / Sheet mobile), mais dans une **variante « Propriété »** qui masque ce qui n'a pas de sens ici :

**Masqué** (spécifique événement/marche) :
- Section « AJOUTER » (Point de marche, Point intermédiaire)
- Boucle fermée
- Points intermédiaires

**Conservé** :
- **Rayons d'observation** — halos autour de chaque parcelle retenue (rayon paramétrable 50 m → 1 km)
- **Stations météo** — même sous-menu avec 3 modes + slider 40-100 km, centré sur le centroïde des parcelles
- **Ajout** : nouveau bloc « AJOUTER → Parcelle cadastrale » qui active le mode tap-to-add (au lieu de cliquer directement la carte), aligné visuellement avec « Point de marche » de l'événement

Les toggles actuels au-dessus de la carte (Copier la liste / GeoJSON) restent, mais l'ancien style toggle Géo/Sat/Relief/Cadastre est déplacé dans le popover Options (section « Fond de carte »), comme demandé par cohérence.

**Persistance** : chaque toggle est mémorisé en `localStorage` (clé `propriete-cadastre-options`), pas en BDD.

---

## 2. Mode plein écran

Bouton **Maximize** en haut-droite de la carte (aligné avec les zoom controls). Au clic :

- Ouvre un overlay `fixed inset-0 z-[100]` (portalisé sur `document.body`) reprenant toute la surface
- Contient : la même `RichMap`, le même `MapOptionsMenu`, la liste latérale des parcelles retenues (drawer rétractable à droite), le bandeau d'adresse sous la carte, et un bouton **Réduire** (icône `Minimize2`)
- Verrouille `document.body` overflow, `Escape` ferme, animation d'entrée/sortie via Framer Motion
- Sur mobile : passe automatiquement en plein écran natif (100dvh) avec la liste des parcelles en Sheet du bas

Aucun re-mount de la Map n'est nécessaire si on portalise le conteneur — mais pour simplicité et robustesse (SafeMapContainer), on remonte la carte en plein écran avec les mêmes props et le même state (parcelles, options) partagé via le hook parent.

---

## 3. Bandeau d'adresse sous la carte

Sous la carte, une **carte glassmorphique** affichant l'adresse complète de la propriété, composée de :

1. **Ligne 1** : nom de la propriété (existant : `propriete.nom`) en typo éditoriale
2. **Ligne 2** : adresse dérivée = concat des parcelles retenues → `Section EP · N°46 · Commune POITIERS (86000)` (déjà en BDD via `commune_nom`, `section`, `numero`, `commune_code`)
3. **Ligne 3** : centroïde GPS formaté (`46.5812°N · 0.3421°E`), avec bouton copier
4. **Ligne 4** : liens contextuels — « Ouvrir dans Google Maps », « Ouvrir dans OpenStreetMap », « Copier l'adresse »

Design : fond sombre translucide, bordure verte forêt, icône `MapPin` en accent doré, ligne verticale décorative à gauche, chips par parcelle si plusieurs communes. Responsive : desktop = 2 colonnes (adresse | GPS+actions), mobile = empilé.

Fallback si aucune parcelle : afficher la `ville` de la propriété + centre carte GPS uniquement.

---

## Détails techniques

- **Nouveau composant** `src/components/propriete/portrait/CadastreOptionsMenu.tsx` — fork réduit de `MapOptionsMenu` (ou version paramétrable via prop `variant: 'event' | 'propriete'` directement dans le composant existant — préférence : fork pour ne pas alourdir le composant événement).
- **Nouveau composant** `src/components/propriete/portrait/CadastreFullscreen.tsx` — overlay plein écran.
- **Nouveau composant** `src/components/propriete/portrait/PropertyAddressCard.tsx` — bandeau adresse.
- **Édition** `PortraitCadastre.tsx` — brancher le menu, le bouton fullscreen, la card adresse ; retirer les 3 boutons actuels (Copier/GeoJSON) déplacés dans le popover Options.
- **Réutilise** `RichMap`, `CadastreLayer` (déjà en place), `WeatherStationsLayer`, et un nouveau `ParcelObservationRadii` (SVG circle GeoJSON simple autour de chaque centroïde parcelle).
- Aucune migration BDD.

---

## Vérification

1. Ouvrir Propriété → Portrait → Cadastre : le bouton Options apparaît, popover ouvre les sections Ajouter / Afficher / Fond de carte
2. Activer « Rayons d'observation » → halos autour des parcelles retenues
3. Activer « Stations météo → Avec points » → stations affichées dans le rayon défini
4. Cliquer Maximize → plein écran, toutes les options fonctionnent, Escape ferme
5. Sous la carte : nom, adresse dérivée des parcelles, GPS, actions — testé avec 0, 1, N parcelles

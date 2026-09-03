# Import KML : un fichier, un parcours complet

Aujourd'hui rien de tel n'existe : le KML n'est produit qu'en **export** (Pack Vivant), la page `/exploration/imports` importe du contenu IA sur des marches déjà créées, et la seule création marche + exploration est le formulaire manuel `CreateMarcheDrawer` (un point à la fois, sans événement public).

On construit la chaîne complète : **fichier déposé → marches → exploration → événement public**.

## Ce que voit l'utilisateur

Nouvel écran admin **« Importer un parcours »** (`/admin/import-parcours`), en trois temps.

**1. Dépôt** — zone de glisser-déposer acceptant `.kml`, `.kmz` et `.gpx` (le GPX vient gratuitement avec le même parseur). Taille max 10 Mo, lecture entièrement dans le navigateur.

**2. Aperçu et réglages** — rien n'est écrit en base avant validation :
- une carte affichant les points détectés (placemarks / waypoints) et le tracé s'il existe ;
- un tableau des étapes, une ligne par point : nom, ville, coordonnées, ordre — tout modifiable, chaque ligne décochable ;
- les champs de l'exploration : nom (pré-rempli avec le nom du document KML), description, type (agroécologique / éco-poétique / éco-tourisme), rayon de collecte par défaut, boucle ou non ;
- les champs de l'événement : titre, date, lieu, catégorie, et un interrupteur **« Publier la page publique »** qui prépare l'URL `/m/:slug` ;
- une case **« Lancer la collecte biodiversité »** après import.

**3. Import** — barre de progression étape par étape, puis un récapitulatif : « 12 marches créées, exploration *Le marais d'Ars* liée, événement publié sur /m/… », avec les liens directs vers l'exploration et la page publique. En cas d'échec en cours de route, ce qui a été créé est annulé (voir plus bas) et le message dit exactement où ça a bloqué.

Les points sans nom prennent « Étape 1 », « Étape 2 »… La ville est déduite par géocodage inverse quand elle manque, sans bloquer l'import si le service ne répond pas.

## Détails techniques

**Parseur navigateur** — nouveau `src/lib/geo/parseTrackFile.ts` :
- `.kmz` : dézippé avec `jszip` (déjà en dépendance) pour extraire le `doc.kml` ;
- `.kml` : `DOMParser` → `Placemark/Point` (étapes) + `LineString`/`gx:Track` (tracé) ; on lit `name`, `description`, `coordinates` (ordre lon,lat,alt) ;
- `.gpx` : `wpt` (étapes) + `trkpt` (tracé) ;
- sortie normalisée `{ documentName, steps: [{ name, description, lat, lng }], track: [{lat,lng}] }`, plus les erreurs explicites (fichier illisible, aucun point trouvé).
- Aucune nouvelle dépendance nécessaire.

**Écriture en base** — nouvelle Edge Function `import-parcours` (transactionnelle côté serveur, à privilégier sur des inserts client dispersés) :
1. `explorations` : `name`, `slug` généré et dédoublonné, `exploration_type`, `default_radius_m`, `is_loop`, `published`;
2. pour chaque étape : `marches` (`nom_marche`, `ville`, `date`, `latitude`, `longitude`, `coordonnees`, `descriptif_court`) — même forme d'insert que `CreateMarcheDrawer.tsx:79-91` ;
3. `exploration_marches` : `ordre` séquentiel, `publication_status: 'published_public'`;
4. `marche_events` : `title`, `date_marche`, `lieu`, `latitude/longitude` (barycentre des étapes), `event_type`, `category`, `exploration_id`, et si publication demandée `is_public: true` + `public_slug` via la fonction existante `generate_event_public_slug` ;
5. les points du tracé non retenus comme étapes peuvent être versés en `exploration_waypoints` (rattachés à l'événement créé et à la marche précédente), désactivé par défaut ;
6. rollback explicite : en cas d'erreur, suppression des lignes déjà insérées dans l'ordre inverse, puis retour d'un message d'erreur précis.
La fonction exige un compte admin (mêmes contrôles JWT/RPC que les autres fonctions admin) et journalise le run.

**Collecte biodiversité** — si demandée, appel de `collect-biodiversity-step` par marche après import, en tâche de fond, échec toléré (même politique que `CreateMarcheDrawer`).

**Front** — `src/pages/AdminImportParcours.tsx` + composants `TrackDropzone`, `TrackPreviewMap` (réutilise `RichMap` de `src/components/maps/`), `StepsEditorTable`, `ImportSummary`. Route protégée ajoutée dans `src/App.tsx` et entrée dans le hub outils admin.

## Ordre de réalisation

1. Parseur `parseTrackFile.ts` + écran de dépôt et aperçu carte (aucune écriture en base).
2. Edge Function `import-parcours` avec rollback, puis branchement du bouton d'import.
3. Publication de l'événement, waypoints optionnels, collecte biodiversité, récapitulatif final.

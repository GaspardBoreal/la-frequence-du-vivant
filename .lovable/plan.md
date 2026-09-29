# Note de valorisation des données — statuts de l'association

## Objectif
Produire un document formel, chiffré et daté, répondant à la remarque « les données des Marches du Vivant, seul actif dont votre propriété personnelle reste discutable », pour appuyer la rédaction des statuts de l'association LA FREQUENCE DU VIVANT.

## Contenu du livrable

### 1. Tableau de mesure (chiffres réels au 29/09/2026, déjà vérifiés en base)
- Volume total mesuré : 58 683 enregistrements sur 15 familles de données.
- Attribuables à Gaspard Boréal + Marches du Vivant : 58 594, soit **99,85 %**.
- Détail par famille : mesures IoT (55 847, 100 % Jardin Monde DEVIAT, propriétaire enregistré G. Boréal), observations marcheurs (1 088, dont 425 signées G. Boréal = 39 %), médias (477, dont 356 = 75 %), snapshots (403), photos de marches (241), marches/événements/participations (358, 17 événements sur 21 créés par G. Boréal), waypoints/audios/textes (179).
- Exclus du numérateur : 77 profils communauté (données personnelles, RGPD) et 12 propriétés tierces.

### 2. Qualification juridique en trois couches
- Données tierces sous licences ouvertes (iNaturalist/GBIF/INPN) : réutilisation, jamais appropriation.
- Contenus des marcheurs : droits conservés par les auteurs ; l'association détient une licence d'exploitation (clause statuts/CGU).
- Actif propre de l'association : méthodologie, indices (ICG, Fréquence), agrégats, rapports, structure et enrichissement de la base — droit sui generis du producteur de base de données (art. L.341-1 CPI).

### 3. Forme du livrable
- Une page privée `/admin/note-donnees` (réservée admin) présentant le tableau, le ratio et la qualification, avec bouton d'export PDF A4 pour joindre au dossier statutaire.
- Les chiffres sont recalculés en direct via une RPC SECURITY DEFINER `get_data_asset_stats()` (comptages par famille + attribution), pour que la note soit rééditable à jour à chaque sollicitation.
- Mention honnête : « mesures au [date], recalculées à chaque consultation ».

## Détails techniques
- Migration : créer `public.get_data_asset_stats()` (SECURITY DEFINER, accès admin uniquement via `check_is_admin_user`) retournant les comptages par famille et l'attribution Gaspard/MdV (marcheur_observations via exploration_marcheurs.user_id, médias/textes/participations/événements via user_id/created_by, iot_mesures via capteurs → propriété DEVIAT).
- Pas de nouvelle table. Pas de GRANT anon.
- Page React : tableau sémantique, cartes KPI (ratio %, volumes), section juridique en trois blocs, export via window.print avec styles A4.

## Vérification
- Comparer les chiffres affichés par la RPC avec les requêtes de contrôle déjà exécutées (58 683 / 58 594).
- Vérifier l'export PDF A4 et l'accès refusé hors admin.

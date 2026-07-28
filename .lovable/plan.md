## Objectif

Permettre à Gaspard Boréal (gaspard.boreal@gmail.com) d'interroger les données du projet depuis Claude (Desktop / Code / Cowork), en commençant par la propriété **Jardin Monde DEVIAT**, sans jamais exposer de clé d'administration ni contourner la sécurité existante.

## Approche retenue : serveur MCP intégré à l'app, protégé par OAuth

On expose l'application elle-même comme **serveur MCP** (Model Context Protocol) — le standard que Claude utilise pour se connecter à une source de données externe. Claude appelle des « outils » précis (lister une propriété, lire sa biodiversité, ses parcelles, ses analyses de sol…) au lieu d'avoir un accès brut à la base.

Sécurité :
- Connexion via **OAuth** : dans Claude, Gaspard clique « se connecter », il arrive sur une page de consentement de l'app, se connecte avec son compte habituel, approuve. Aucun mot de passe ni clé n'est copié-collé.
- Chaque appel d'outil s'exécute **en tant que Gaspard** : les politiques RLS existantes s'appliquent telles quelles. Aucune clé service_role n'est utilisée, aucune politique n'est assouplie.
- Accès en **lecture seule** dans cette première étape (aucun outil d'écriture), donc aucun risque d'altérer les données de production.

## Outils MCP exposés (lecture seule)

1. `list_proprietes` — propriétés accessibles à l'utilisateur (id, nom, slug, ville, rôle).
2. `get_propriete_overview` — fiche complète : parcelles (surfaces, cadastre), événements liés, contributeurs.
3. `get_propriete_biodiversity` — synthèse biodiversité (nombre d'espèces, règnes, top espèces, dates) via la RPC existante.
4. `get_propriete_species_pool` — liste détaillée des espèces observées (nom scientifique, nom FR, nb d'observations, dates, GPS) — la matière première pour vérifier les comptages.
5. `get_propriete_soil_analysis` — relevés « J'analyse le sol » (échantillons, structure, texture, pH, vie du sol).
6. `get_propriete_flora_diagnostic` — « J'identifie » : cortège botanique, indices écologiques, ICG et sa décomposition (dénominateur 16, fiabilité) — pour auditer le calcul.
7. `get_propriete_observations` — observations brutes filtrables (espèce, date, marcheur, source iNat/terrain) avec pagination.

Chaque outil réutilise les RPC et requêtes déjà en place (`get_propriete_biodiversity`, `get_user_apps_access`, tables `propriete_*`, `marcheur_observations`, snapshots), donc **les chiffres renvoyés à Claude sont exactement ceux affichés dans l'app** — condition indispensable pour vérifier la cohérence des calculs.

## Ce qui sera mis en place

1. Installation du SDK MCP et création de `src/lib/mcp/` (un fichier par outil + une entrée serveur).
2. Activation du serveur d'autorisation OAuth côté Supabase (avec enregistrement dynamique des clients, requis par Claude).
3. Ajout d'une page de consentement `/.lovable/oauth/consent` dans l'app (design cohérent avec le thème sombre existant), avec retour correct après connexion e-mail ou sociale.
4. Génération et déploiement de la fonction edge `mcp` ; l'URL à coller dans Claude sera fournie à la fin.
5. Vérification : appel réel des outils sur Jardin Monde DEVIAT et comparaison des compteurs (espèces, ICG) avec l'écran.

## Ce que Gaspard fera ensuite

Dans Claude → Paramètres → Connecteurs → « Ajouter un connecteur personnalisé » → coller l'URL du serveur → se connecter → approuver. Ensuite il peut demander en langage naturel : « recalcule l'ICG de Jardin Monde DEVIAT à partir des espèces observées », ou « propose une nouvelle interface à partir de ces données ».

## Notes techniques

- Aucun changement de schéma ni de politique RLS n'est nécessaire ; si un outil renvoie vide, c'est que RLS bloque légitimement, et on corrigera l'appartenance de l'utilisateur, pas la politique.
- Les handlers restent rapides (une requête ou une RPC), pas de traitement long incompatible avec le timeout MCP.
- L'écriture (curation GPS, validation taxonomique depuis Claude) est volontairement exclue de cette étape ; elle pourra être ajoutée ensuite comme outils marqués destructifs.

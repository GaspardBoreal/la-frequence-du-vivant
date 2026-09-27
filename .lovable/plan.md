# Aligner les noms français des espèces sur le référentiel officiel (INPN / TAXREF)

## Constat
- Aricia agestis s'affiche « Argus brun » dans l'app. En français, iNaturalist l'appelle « Collier de corail », le nom officiel du référentiel TAXREF de l'INPN.
- Cacyreus marshalli s'affiche « Cuivré des géraniums » au lieu de « Brun des pélargoniums ».
- Origine de nos noms (environ 2 100 espèces) : 1 990 viennent d'une IA, 30 de Wikipédia et 91 ont été saisis à la main. L'INPN, prévu comme première source, est hors service depuis 2025. Le relais est donc pris par Wikipédia puis l'IA, qui proposent souvent des noms usuels anciens.

## Ce qui change pour l'utilisateur
- Les noms affichés dans l'app deviennent les mêmes que dans iNaturalist réglé en français. Pour la faune et la flore de France, ces noms reprennent ceux de TAXREF.
- L'ancien nom reste accepté par la recherche : taper « argus brun » trouve toujours le Collier de corail.
- Les noms corrigés à la main par l'équipe ne sont jamais écrasés.

## Étapes
1. **Nouvelle source prioritaire.** La traduction automatique interroge d'abord le nom français d'iNaturalist. Viennent ensuite l'INPN, s'il répond à nouveau, puis Wikipédia, et l'IA en dernier recours.
2. **Rattrapage de l'existant.** Un traitement par lots, lancé depuis l'admin, revérifie tous les noms d'origine IA ou Wikipédia auprès d'iNaturalist. Quand le nom diffère, il est remplacé et l'ancien est gardé comme nom alternatif. Un rapport indique les noms changés, inchangés ou introuvables.
3. **Correction immédiate** des deux cas vus aujourd'hui, avant même le rattrapage complet.
4. **Mise à jour à l'écran.** Les écrans déjà ouverts affichent le nouveau nom après rechargement (vidage du cache local des noms).

## Vérifications
- Aricia agestis doit afficher « Collier de corail » et Cacyreus marshalli « Brun des pélargoniums » dans l'Herbier, le Cortège vivant et les fiches espèce.
- Contrôle d'un échantillon de 20 noms changés par le rattrapage : ils doivent correspondre à iNaturalist en français.
- La recherche par l'ancien nom doit fonctionner, et les 91 noms saisis à la main doivent rester intacts.

## Détails techniques
- Edge `translate-species` : ajout de `fetchInatFr(sci)` via `api.inaturalist.org/v1/taxa?q=<sci>&locale=fr&preferred_place_id=6753` (France), avec un nom exact (`name === sci`) exigé et un `preferred_common_name` gardé seulement s'il diffère du nom scientifique. Ordre : iNat → INPN → Wikipédia → IA ; `source = 'inaturalist'`.
- Nouvelle edge `realign-species-names`, réservée aux admins (JWT + `check_is_admin_user`) : lots de 50, pause d'environ 1 s entre appels iNat, `UPDATE species_translations` uniquement si `source in ('ai','wikipedia')`. L'ancien nom est ajouté à `alternative_names_fr` et la réponse contient le rapport JSON. Déclenchement par un bouton dans le hub admin.
- Recherche espèce (`HerbierDuMomentDrawer`, etc.) : elle porte aussi sur `alternative_names_fr` si ce champ est déjà chargé ; sinon ajout du champ à la requête de `useFrenchSpeciesNamesAuto`.
- Données : les deux lignes sont corrigées via `run_sql` (mises à jour de données). Aucun changement de structure de base.

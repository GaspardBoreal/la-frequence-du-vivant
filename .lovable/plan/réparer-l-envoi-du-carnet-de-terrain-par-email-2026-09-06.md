# Réparer l'envoi du Carnet de Terrain par email

## Ce qui se passe

Le message « Le service d'envoi n'a pas répondu » n'est pas une erreur de réseau côté utilisateur : le service qui prépare et expédie le carnet n'a jamais été mis en ligne. Le code existe dans le projet, mais il n'a pas été déclaré ni publié sur le serveur — exactement le même oubli que pour l'assistant de proposition de tour, réparé la semaine dernière.

La clé du prestataire d'envoi d'emails et l'adresse d'expédition sont bien enregistrées, donc rien d'autre ne manque.

## Correction

1. Déclarer le service d'envoi du carnet dans la configuration du serveur, comme les autres services du projet.
2. Le publier.
3. Vérifier qu'il répond, puis faire un envoi réel de test depuis « Maison sous Blossac » vers votre propre adresse.
4. Si le prestataire refuse l'envoi (adresse d'expédition non validée, quota), afficher le motif exact en français dans la fenêtre d'envoi plutôt qu'un message générique.

## Détails techniques

- Ajouter `[functions.send-carnet-terrain]` avec `verify_jwt = false` dans `supabase/config.toml` (l'authentification est déjà validée en interne par `validateAuth`).
- Déployer `send-carnet-terrain` via `deploy_edge_functions`.
- Test via `curl_edge_functions` (attendu : 400 « Choisissez au moins un destinataire » = fonction vivante), puis envoi réel depuis l'interface.
- Contrôler les logs de la fonction ; en cas de refus Resend, remonter `status` + corps dans la réponse JSON et l'afficher dans `messageErreurEnvoi` (`src/hooks/propriete/useCarnetEnvoi.ts`).

Aucun changement de base de données ni d'interface n'est nécessaire.

# Weenat : pourquoi rien n'arrive encore

## Constat (vérifié en base)

- Le capteur **Station Météo Virtuelle** existe bien sur « Jardin Monde DEVIAT » : parcelle Weenat `plot 122193`, type rattaché au fournisseur WEENAT. Côté configuration, tout est bon.
- Le raccordement fournisseur `LFDV-CDF-DEVIAT` est actif, avec une clé API enregistrée, mais **`last_pull_at` est vide** : aucune collecte n'a jamais eu lieu.
- La fonction de collecte `iot-pull-weenat` **n'a jamais été appelée** (aucun log).
- **Aucune tâche planifiée** n'existe pour Weenat (le cron ne contient que 2 jobs, sans rapport).
- La fonction de collecte n'accepte aujourd'hui que le **cron (clé de service) ou un administrateur** : un propriétaire de jardin qui clique sur « Collecter » reçoit un refus.

Contrairement à Brad Technology qui *pousse* ses mesures par webhook, Weenat ne pousse rien : il faut aller chercher la donnée. Personne ne va la chercher pour l'instant.

## Ce qu'il reste à faire

1. **Planifier la collecte automatique** : tâche cron horaire appelant `iot-pull-weenat` (fenêtre glissante de quelques heures, insertion sans doublon déjà gérée). Ainsi la station se remplit toute seule.
2. **Ouvrir la collecte manuelle aux gestionnaires de la propriété** : élargir l'autorisation de la fonction (admin OU personne ayant accès à la propriété visée, via le contrôle d'accès propriété existant), pour que le bouton « Collecter » de la carte « Raccordements fournisseurs » fonctionne depuis Mon projet.
3. **Premier tirage de contrôle** : lancer une collecte sur 7 jours pour cette propriété et lire le retour (nombre de points, métriques rejetées) afin de vérifier que le compte Weenat expose bien des mesures pour la parcelle 122193 — une Station Météo Virtuelle n'émet que si l'option Météo Vision est active côté Weenat. Si le retour est vide, c'est un sujet d'abonnement/droits côté Weenat, pas de code.
4. **Retour visible dans l'écran** : afficher dans la carte « Raccordements fournisseurs » la date et le statut du dernier tirage (les colonnes existent déjà mais ne sont pas exploitées), et faire disparaître le « Sans nouvelle / Aucune donnée reçue » dès la première mesure.
5. **Contrôle d'affichage** : vérifier que les grandeurs météo Weenat (pluie, rayonnement, ETP, VPD, vent, point de rosée) s'affichent correctement dans la fiche capteur et le graphe 30 jours, comme les mesures Brad.

## Détails techniques

- Cron : `cron.schedule('iot-pull-weenat-hourly', '7 * * * *', ...)` avec `net.http_post` vers la fonction, en-tête `apikey` publiable ; la fonction accepte déjà l'appel de service.
- Autorisation : ajouter dans `iot-pull-weenat` un chemin `can_access_propriete(propriete_id)` en plus de `check_is_admin_user`, en exigeant alors un `propriete_id` dans le corps.
- Upsert déjà idempotent sur `(capteur_id, grandeur, profondeur_m, mesure_at)` : aucun risque de doublon si cron et bouton manuel se chevauchent.
- Aucun changement de schéma nécessaire.

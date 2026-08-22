# Liste des propriétés toujours fraîche après enregistrement d'une fiche

## Diagnostic (vérifié)

La sauvegarde fonctionne : la ligne BORDEAUX / Patio végétalisé ISEG porte bien `departement = 'Gironde'` en base (mise à jour ce matin à 10h06, heure de Paris). Le problème est côté cache de l'application :

1. La fiche enregistre puis demande le rafraîchissement de la clé `['admin-proprietes']`.
2. Or les données de la page liste sont rangées sous des clés **voisines mais différentes** : `admin-proprietes-list`, `admin-proprietes-map`, `admin-proprietes-facets` (régions/départements), `admin-proprietes-kpis`, `admin-proprietes-sondes`… La consigne de rafraîchissement ne correspond à **aucune** d'entre elles — c'est comme afficher « rafraîchir le salon » quand tout est rangé dans « salon-nord », « salon-sud ».
3. Le cache global garde les données 5 minutes sans re-vérifier. En revenant à la liste dans ce délai, tout reste figé : lignes, compteurs KPI, et donc la liste déroulante des départements (d'où « GIRONDE » fantôme).

## Ce qui change

Après chaque action sur une fiche (enregistrement, suppression, rattachement d'un marcheur/entreprise/événement), **tout** l'écran liste se recharge au retour : lignes, compteurs KPI, liste déroulante régions, liste déroulante départements, carte. « Gironde » apparaît immédiatement, « GIRONDE » disparaît.

## Détails techniques

- `src/pages/AdminProprietes.tsx` : renommer les 7 clés de requête sous un préfixe commun à deux segments — `['admin-proprietes', 'list', …]`, `['admin-proprietes', 'map', …]`, `['admin-proprietes', 'facets']`, `['admin-proprietes', 'kpis', …]`, `['admin-proprietes', 'sondes']`, `['admin-proprietes', 'companies']`, `['admin-proprietes', 'marcheurs']`. La correspondance par préfixe de react-query fera alors toucher toutes ces clés par l'invalidation existante `['admin-proprietes']`. Aucune clé ne commence par `['admin-propriete']` (sans s) ailleurs : pas de collision avec la fiche `['admin-propriete', id]`.
- `src/pages/AdminProprieteFiche.tsx` : ajouter la même invalidation `['admin-proprietes']` aux mutations de liaisons (`setMainMarcheur` modifie la colonne « Marcheur référent » de la liste ; ajout/retrait d'entreprise et d'événement également, par cohérence).
- Vérification : sauvegarder une fiche, revenir à la liste, contrôler que le département mis à jour apparaît dans le filtre et dans la ligne sans rechargement manuel.

## Observation annexe (hors périmètre, signalée)

En base, la colonne `region` mélange trois orthographes : « NOUVELLE-AQUITAINE », « Nouvelle-Aquitaine », « Nouvelle Aquitaine » — la liste déroulante Régions affichera trois entrées pour une même région. Un nettoyage de données (passage unique à la forme canonique « Nouvelle-Aquitaine ») peut être fait sur demande ; non inclus ici.

# QR Boutinet : « cette marche est introuvable » après confirmation d'email

## Ce qui se passe

Vérifié dans le code :

- La route de l'espace marcheur est `/marches-du-vivant/mon-espace/exploration/:explorationId`. Elle attend soit un **identifiant d'exploration**, soit un identifiant d'événement **préfixé** `event-<uuid>` (`ExplorationMarcheurPage` teste `rawParam.startsWith('event-')` pour résoudre l'exploration depuis `marche_events`).
- Après confirmation d'email, le retour arrive sur `/marches-du-vivant/connexion?event=<code>`, le RPC `consume_event_signup_link` renvoie un **`event_id`** (identifiant d'événement), et la page redirige vers `.../exploration/${registered.event_id}` — **sans le préfixe `event-`**.
- L'identifiant d'événement est donc interprété comme un identifiant d'exploration, aucune exploration ne correspond, et la page affiche l'état « marche introuvable » ajouté récemment.

Le même défaut existe sur les 4 redirections de la page de connexion (QR après confirmation, QR à la connexion, QR juste après création de compte, et le lien d'invitation lecteur qui renvoie lui aussi un `event_id`). Les parcours ailleurs dans l'app (Carnet vivant, recherche globale, feed) utilisent déjà correctement `event-${id}`.

## Correction

Dans `src/pages/MarchesDuVivantConnexion.tsx`, préfixer les redirections issues d'un identifiant d'événement :

```
/marches-du-vivant/mon-espace/exploration/event-<event_id>
```

aux 4 endroits concernés (lignes ~151, ~207, ~214, ~310, ~326), via un petit utilitaire local pour éviter toute divergence future.

## Ce qui n'est pas touché

- L'inscription classique sans QR : elle ne passe par aucune de ces redirections (elle va vers « Mon espace » ou le dialogue de choix d'app) — comportement inchangé.
- Les RPC, l'email de bienvenue, les tables `event_signup_links` / `marche_participations` : aucune modification, aucune migration.
- Les liens existants ailleurs dans l'app, déjà corrects.

## Vérification

Rejouer le parcours QR Boutinet (code `07779042ad491308`) : inscription → email de confirmation → clic → arrivée sur l'espace de la marche avec titre, date et lieu réels et le bandeau Avant-première, plus d'écran « introuvable ». Puis vérifier qu'une inscription sans QR aboutit toujours sur Mon espace.

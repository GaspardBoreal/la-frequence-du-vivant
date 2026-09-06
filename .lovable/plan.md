# Corriger la création d'un Tour de Jardin sur « Maison sous Blossac »

## Ce qui se passe

Le message « Failed to send a request » ne vient pas de vos droits : c'est l'assistant de proposition de tour qui n'existe pas encore côté serveur. Je l'ai écrit hier, mais sa mise en ligne n'a pas abouti — le serveur répond « fonction introuvable » quand la page l'appelle. Le bouton ne peut donc rien faire, quel que soit l'utilisateur.

Vérifications faites côté droits, pour lever le doute :

- Sur « Maison sous Blossac », vous êtes bien rattaché en tant que **propriétaire** (avec Laurence Karki et l'équipe Ver de Terre Production ; Vincent Levavasseur et Olivier Lépine en prestataires, Victor Boixeda en marcheur historique).
- La règle d'accès aux tours de jardin est déjà celle que vous demandez : **toute personne rattachée à la propriété**, quel que soit son rôle, peut créer, modifier et supprimer les tours et leurs actions — plus le marcheur principal et les administrateurs. Rien à changer de ce côté.

## Ce que je propose

### 1. Remettre l'assistant en ligne

Redéployer la fonction de proposition, puis vérifier qu'elle répond vraiment : un appel direct doit renvoyer « accès refusé » au lieu de « introuvable ». C'est le test qui prouve que la mise en ligne a réussi, et non un simple message d'espoir.

### 2. Un message d'erreur qui dit la vérité

Aujourd'hui, toute panne s'affiche « Failed to send a request », en anglais et sans indice. Je remplace par des messages en français qui distinguent les trois cas : assistant momentanément indisponible, crédits d'intelligence artificielle épuisés, ou trop de demandes en même temps.

### 3. Ne pas rester bloqué sur l'assistant

Vérifier que la création **manuelle** d'un tour fonctionne indépendamment, pour que la page reste utilisable même si l'assistant tombe. Si le bouton manuel est absent ou fragile sur cette propriété, je le corrige.

## Détail technique

- Cause confirmée : `POST /functions/v1/propriete-tour-suggest` renvoie `404 NOT_FOUND` alors que `propriete-chat` renvoie bien `401` — la fonction n'a jamais été déployée. Le nom invoqué dans `useProprieteTours.ts` est correct ; l'absence d'entrée dans `supabase/config.toml` n'est pas en cause (une trentaine de fonctions en production n'y figurent pas non plus).
- Action : redéploiement de `supabase/functions/propriete-tour-suggest`, puis contrôle par `curl` du passage de `404` à `401`, et test réel du bouton depuis la propriété `745b455f-dacf-4e8e-8e10-9ed150f4f76e`.
- Droits vérifiés, aucune migration nécessaire : `can_access_propriete()` couvre `main_walker_id`, toute ligne de `propriete_marcheurs` (tous rôles) et les administrateurs ; les politiques `ALL` de `propriete_tours` et `propriete_tour_actions` s'appuient dessus en `USING` comme en `WITH CHECK`.
- `useProprieteTours.ts` : dans `useSuggestTour`, lire l'erreur réelle via `FunctionsHttpError` (`error.context.text()`) au lieu du message générique, et traduire les statuts 402 / 403 / 429 / 404.

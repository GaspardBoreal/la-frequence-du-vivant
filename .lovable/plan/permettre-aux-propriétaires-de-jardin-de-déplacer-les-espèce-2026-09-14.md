# Permettre aux propriétaires de jardin de déplacer les espèces sur le plan

## Ce que montre l'analyse

Le compte l.cardi@orange.fr est bien reconnu comme propriétaire du jardin « Les Hortensias » : elle est la marcheuse principale de la fiche et elle figure comme « propriétaire » dans les rattachements. À ce titre, l'Atelier du jardin lui affiche bien les outils de repositionnement.

Mais le déplacement lui-même est refusé par une seconde règle, indépendante de la propriété : seules les personnes administratrices ou ayant le statut communautaire « ambassadeur » / « sentinelle » sont autorisées à corriger la position d'une observation. Son statut communautaire est « marcheur ». Résultat : l'outil s'affiche, l'action échoue.

C'est donc une incohérence de règles, pas un bug d'affichage.

## Évolution proposée

Le droit de corriger la position d'une espèce devient possible par deux chemins :

1. le chemin actuel, global : administrateur, ambassadeur, sentinelle ;
2. un nouveau chemin, limité à un jardin précis : être propriétaire ou prestataire de ce jardin.

Un propriétaire ne pourra corriger que les observations de son propre jardin, jamais celles d'un autre lieu. Aucun droit nouveau n'est donné aux simples marcheurs rattachés en lecture.

Chaque correction reste tracée comme aujourd'hui (position d'origine conservée, auteur et date enregistrés), ce qui permet de revenir en arrière.

## Détail technique

Base de données (migration) :

- nouvelle fonction `public.can_curate_propriete_gps(_user uuid, _propriete_id uuid)` : `is_gps_curator(_user)` OU `can_curate_propriete_parcelles(_propriete_id)` (rôles `proprietaire` / `prestataire` dans `propriete_marcheurs`).
- `set_observation_gps_override` : remplacer le contrôle `is_gps_curator(_user)` par `can_curate_propriete_gps(_user, _propriete_id)`. La fonction reçoit déjà `_propriete_id`. Si `_propriete_id` est nul, on garde le contrôle global actuel.
- `reposition_marcheur_observation_gps` et `reposition_marcheur_media_gps` : ajout d'un paramètre optionnel `_propriete_id uuid DEFAULT NULL` et même contrôle. Signatures conservées pour les appels existants (paramètre par défaut).
- garde-fou de portée : quand le droit vient de la propriété, la nouvelle position doit rester dans le périmètre du jardin (rayon `geofence_buffer_m` de `proprietes`, avec un repli à 2 km si la valeur est absente) ; sinon `OUT_OF_SCOPE`.
- `clear_observation_gps_override` : même assouplissement, avec la propriété enregistrée sur la ligne d'override comme périmètre de contrôle.

Front :

- `src/hooks/propriete/useGpsOverrides.ts` transmet déjà `_propriete_id` : rien à changer.
- `src/hooks/useRepositionMediaGps.ts` : ajouter `proprieteId` aux options et le transmettre aux deux RPC.
- `src/components/propriete/gps/InlineGpsCurationLayer.tsx` / `GpsControlConsole.tsx` / `PaletteStudio.tsx` : passer l'identifiant de la propriété au hook de repositionnement.
- messages d'erreur : `FORBIDDEN` → « Vous n'avez pas les droits pour repositionner cette observation » ; `OUT_OF_SCOPE` → « Cette position sort du périmètre du jardin ».

Vérification : se placer sur le jardin « Les Hortensias », déplacer une observation depuis l'Atelier, contrôler l'enregistrement et la trace d'audit, puis vérifier qu'un déplacement hors périmètre est refusé.

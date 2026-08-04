# Monter une vidéo de terrain : progression visible et limite honnête

## Ce que disent les logs

Sur « Test de stabilité » (prélèvement G), la requête d'envoi du fichier `.mov` revient en **400** côté Storage :

```text
POST | 400 | .../storage/v1/object/propriete-tests/.../stabilite/G/....mov
```

Deux constats :

1. Le bucket `propriete-tests` n'a **aucune limite propre** — c'est la limite globale du projet (50 Mo) qui rejette le fichier de 53,8 Mo. L'application, elle, annonce 60 Mo : elle laisse donc l'utilisateur choisir un fichier voué à l'échec, puis affiche « Échec : nom-du-fichier » sans expliquer pourquoi.
2. L'envoi passe par `supabase.storage.upload()`, qui ne remonte aucun octet transféré. L'écran n'affiche qu'un compteur « Envoi 0/1… » figé pendant toute la durée — sur 50 Mo, plusieurs dizaines de secondes d'apparente inertie.

## Ce qu'on met en place

### 1. Une jauge d'envoi réelle, octet par octet

Remplacer l'appel opaque par un envoi instrumenté : on demande à Storage une URL d'envoi signée, puis on transfère le fichier avec une requête qui émet la progression. La jauge affiche le pourcentage réel, les Mo transférés sur le total, et le nom du fichier en cours.

Habillage dans l'esprit de l'Onde Courte : une barre fine ambre/or sur fond forêt, le poids du fichier en petites capitales, un halo qui pulse tant que le transfert court, puis une coche quand la preuve est déposée. En lot, une ligne par fichier avec son propre état (en attente / en cours / déposé / refusé).

### 2. Une limite honnête, annoncée avant l'envoi

- Plafond vidéo aligné sur la réalité du serveur : **50 Mo**.
- Contrôle **au moment du choix du fichier**, pas après coup : un fichier trop lourd est écarté immédiatement avec son poids affiché et un conseil concret (« filmez 20 s en 1080p plutôt que 4K, ou compressez la séquence »).
- Le libellé de la zone de dépôt annonce la limite réelle au lieu de « 60 Mo ».

### 3. Un échec qui se lit

Si le serveur refuse malgré tout, le message reprend la cause (fichier trop lourd, format refusé, session expirée, réseau interrompu) au lieu d'un « Réessayez » générique, et propose de relancer ce seul fichier — les autres preuves déjà déposées sont conservées.

## Détails techniques

- `src/hooks/propriete/usePropertyTestMedias.ts` : `MAX_VIDEO_BYTES` → 50 Mo ; `useTestMediaUpload` expose désormais un état par fichier (`{ name, size, sent, status, error }`) au lieu du seul `{ done, total }` ; l'envoi utilise `createSignedUploadUrl` + `XMLHttpRequest` (`upload.onprogress`) pour la progression, en conservant `insertWithStorageRollback` pour l'atomicité storage/DB.
- Nouveau composant `src/components/propriete/analyze/media/TestMediaUploadProgress.tsx` : rendu de la file d'envoi (barre, poids, état), stylé avec les tokens `--ds-*` existants.
- `src/components/propriete/analyze/media/TestMediaDrawer.tsx` : validation de taille à la sélection, texte de limite corrigé, remplacement du compteur « Envoi x/y » par le nouveau composant, bouton « Renvoyer » sur les lignes en erreur.
- `ChantierPhotoIntake.tsx` réutilise le même hook : la jauge et la limite y bénéficient automatiquement des mêmes correctifs.
- Aucune migration : la limite vient du projet, pas du bucket.

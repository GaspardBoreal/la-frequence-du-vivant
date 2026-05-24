## Contexte

Vincent Levavasseur (`user_id` `4bd02b8a-ef51-48ca-9e9c-f4661e5af6be`) a uploadé du contenu qui est resté en **privé par défaut** :


| Table                             | Total | Privés                              |
| --------------------------------- | ----- | ----------------------------------- |
| `marcheur_medias` (photos/vidéos) | 81    | **81** (dont `shared_to_web=false`) |
| `marcheur_audio` (sons)           | 6     | **6**                               |
| `marcheur_textes`                 | 0     | 0                                   |


## Proposition

Migration SQL ciblée sur ce seul `user_id`, qui :

1. Passe ses **81 médias** en `is_public = true` **et** `shared_to_web = true` (les deux champs sont liés par un trigger de cohérence : `shared_to_web=true` force `is_public=true`, on aligne donc les deux pour qu'ils apparaissent à la fois dans le Mur de la Convivialité et sur la page publique de la marche).
2. Passe ses **6 enregistrements audio** en `is_public = true`.
3. Met `updated_at = now()` pour invalider les caches et déclencher les triggers de re-calcul (snapshots biodiversité, fréquence du marcheur, etc.).
4. Ne touche **aucun autre utilisateur** — `WHERE user_id = '4bd02b8a-...'`.

```sql
UPDATE public.marcheur_medias
SET is_public = true, shared_to_web = true, updated_at = now()
WHERE user_id = '4bd02b8a-ef51-48ca-9e9c-f4661e5af6be'
  AND (is_public = false OR shared_to_web = false);

UPDATE public.marcheur_audio
SET is_public = true, updated_at = now()
WHERE user_id = '4bd02b8a-ef51-48ca-9e9c-f4661e5af6be'
  AND is_public = false;
```

## À confirmer

- **OK pour publier les 81 photos/vidéos et les 6 audios en une fois ?** (Vincent a donné son accord oral, on bascule tout)

Mon recommandation : **on bascule tout** — il vient d'appeler, c'est l'option la plus rapide et la plus alignée avec son intention.
# Connecter n8n en écriture Postgres sur `news` et `news_dedup`

Objectif : n8n écrit directement dans la base via une connexion PostgreSQL, sans donner à n8n les pleins pouvoirs sur les 150+ tables du projet.

## 1. Récupérer les identifiants (à faire par vous, dans Supabase)

Le mot de passe Postgres n'existe nulle part dans le code : seul Supabase le connaît, et il n'est affichable qu'une fois. S'il n'a pas été noté, il faut le réinitialiser.

1. Dashboard Supabase du projet → **Project Settings → Database**
2. **Database password → Reset database password** → copier la valeur tout de suite
3. Section **Connection string → Session pooler** (port `5432`, compatible IPv4, requis pour n8n Cloud) : y relever `host`, `port`, `database` (`postgres`) et `user`

Réinitialiser ce mot de passe n'a aucun impact sur l'application : elle utilise les clés API, pas le mot de passe Postgres.

## 2. Créer un rôle dédié `n8n_writer` (côté projet, via migration)

Plutôt que de brancher n8n avec le compte `postgres` (superutilisateur, accès total, RLS contournée partout), création d'un rôle limité :

- rôle `n8n_writer` avec mot de passe, `LOGIN`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`
- `GRANT USAGE ON SCHEMA public`
- `GRANT SELECT, INSERT, UPDATE ON public.news` et `public.news_dedup` — pas de `DELETE`, pas d'accès aux autres tables
- aucune autre table ni fonction accessible : toute requête hors périmètre échoue en `permission denied`

Le mot de passe de ce rôle sera généré par vous et fourni au moment de la migration (je ne l'inscris pas en clair dans le fichier ; le champ sera à remplacer avant validation), ou généré aléatoirement et communiqué une seule fois.

## 3. Contrainte d'unicité pour l'anti-doublon

`news_dedup` n'a pas de clé primaire déclarée sur `url_key`. Sans elle, le pattern n8n « insérer sinon incrémenter » n'est pas fiable.

- ajout d'un index unique sur `news_dedup.url_key` (après contrôle et fusion d'éventuels doublons existants)

Cela permet dans n8n un simple `INSERT ... ON CONFLICT (url_key) DO UPDATE SET last_seen_at = now(), seen_count = news_dedup.seen_count + 1`.

## 4. Configuration du credential n8n

Nœud **Postgres** → nouveau credential :

```text
Host      : aws-0-<region>.pooler.supabase.com   (depuis Session pooler)
Port      : 5432
Database  : postgres
User      : n8n_writer
Password  : <mot de passe du rôle>
SSL       : require
```

Colonnes utiles côté n8n :
- `news` : `title` (obligatoire), `external_link` (obligatoire), `description`, `image_url`, `started_at`, `metadata` (jsonb), `published` (défaut `false`)
- `news_dedup` : `url_key` (obligatoire), `title_key`, `source`, `title`, `decision`, `seen_count`

## 5. Vérification

Test de lecture/écriture sur `news` avec le rôle `n8n_writer`, puis test négatif : une lecture sur une table hors périmètre doit être refusée.

## Détails techniques

- Le Session pooler est indispensable si n8n tourne en cloud (la connexion directe `db.<ref>.supabase.co` est IPv6-only).
- Une connexion Postgres directe contourne les RLS par construction ; le garde-fou repose donc sur les `GRANT` du rôle, d'où le périmètre strict à deux tables.
- Rien à changer dans le code de l'application : ce chantier est uniquement base de données + configuration n8n.

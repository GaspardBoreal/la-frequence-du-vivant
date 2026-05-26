## Objectif

Corriger trois défauts mis en évidence par le test d'inscription d'`aurelien.dript@gmail.com` :
1. Le profil communautaire n'est pas systématiquement créé après signup (race / timeout client).
2. La page `/mon-espace` reste bloquée sur « Chargement… » au lieu de basculer vers « Créer mon profil ».
3. L'info bulle « Vérifiez vos emails » passe inaperçue.

## 1. Trigger DB de création automatique du profil (filet de sécurité)

Ajouter un trigger `AFTER INSERT ON auth.users` qui crée la ligne `community_profiles` minimale (prénom/nom tirés de `raw_user_meta_data` ou du préfixe de l'email, rôle `marcheur_en_devenir`). 

- Idempotent : `ON CONFLICT (user_id) DO NOTHING`.
- N'écrase pas la RPC `create_community_profile` (qui continue d'enrichir le profil avec `ville`, `motivation`, `types_marches_interets`, etc.) → on garde un `UPDATE` plutôt qu'un `INSERT` côté RPC si la ligne existe déjà.
- Garantit qu'aucun utilisateur authentifié ne se retrouve sans profil, quel que soit le chemin (signup web, magic link, futur OAuth).

Réparation ponctuelle : insérer manuellement la ligne `community_profiles` manquante pour `d0750220-d626-48ad-bf1b-ed4fde22688d` afin qu'`aurelien.dript@gmail.com` puisse se connecter immédiatement.

## 2. Déblocage du loader `useCommunityAuth`

Dans `src/hooks/useCommunityAuth.ts` :
- Toujours appeler `setLoading(false)` dans `onAuthStateChange` dès qu'un événement est reçu (pas uniquement après `initialResolved`). C'est le motif recommandé Supabase pour éviter le blocage si `getSession()` traîne.
- Ajouter un garde-fou : `setTimeout(() => setLoading(false), 5000)` au montage (libère le loader si l'init Supabase est anormalement lente).
- Log explicite quand `loading` bascule, pour diagnostiquer les futurs cas.

Dans `src/pages/MarchesDuVivantMonEspace.tsx` :
- Garder l'écran "Créer mon profil" comme filet (au cas où le trigger échouerait), mais comme le trigger garantira désormais l'existence du profil, cet écran ne s'affichera plus dans le flux normal.

## 3. Rendre visible l'info bulle de confirmation email

Dans `src/pages/MarchesDuVivantConnexion.tsx`, méthode `handleRegister` :
- Au lieu d'un simple `toast.success(...)` qui peut être masqué, ouvrir un état local `showEmailConfirmDialog` qui affiche un **dialog modal persistant** avec :
  - Icône email
  - Titre : « Vérifiez votre boîte mail 📬 »
  - Texte : « Un lien de confirmation a été envoyé à <email>. Cliquez dessus pour activer votre compte, puis revenez ici pour vous connecter. »
  - Lien « Renvoyer l'email » (appelle `supabase.auth.resend`).
  - Bouton « J'ai compris » qui ferme le dialog et bascule en `mode='login'`.

## 4. Fix du retry 504 dans `signUp`

Dans le chemin de retry, ne plus retourner prématurément sans créer le profil — on laisse le trigger DB s'en charger, mais on logue clairement le cas pour observabilité.

## Détails techniques

### Trigger SQL (migration)

```sql
create or replace function public.handle_new_community_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_prenom text;
  v_nom text;
begin
  v_prenom := coalesce(
    new.raw_user_meta_data->>'prenom',
    initcap(split_part(split_part(new.email, '@', 1), '.', 1)),
    'Marcheur'
  );
  v_nom := coalesce(
    new.raw_user_meta_data->>'nom',
    initcap(split_part(split_part(new.email, '@', 1), '.', 2)),
    ''
  );
  insert into public.community_profiles (user_id, prenom, nom, role)
  values (new.id, v_prenom, v_nom, 'marcheur_en_devenir')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_community on auth.users;
create trigger on_auth_user_created_community
  after insert on auth.users
  for each row execute function public.handle_new_community_user();

-- Réparation profil manquant
insert into public.community_profiles (user_id, prenom, nom, role)
select id,
  initcap(split_part(split_part(email,'@',1),'.',1)),
  initcap(split_part(split_part(email,'@',1),'.',2)),
  'marcheur_en_devenir'
from auth.users
where id = 'd0750220-d626-48ad-bf1b-ed4fde22688d'
on conflict (user_id) do nothing;
```

### RPC `create_community_profile`

Convertir l'`INSERT` en `INSERT … ON CONFLICT (user_id) DO UPDATE SET …` pour cohabiter avec le trigger (le trigger crée la coquille, la RPC enrichit).

## Hors scope

- Refonte du flux d'onboarding (déjà livré).
- Migration des autres users sans profil (à traiter séparément si le diagnostic en révèle).

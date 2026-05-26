-- 1. Trigger auto-create community_profiles on auth.users insert
create or replace function public.handle_new_community_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prenom text;
  v_nom text;
begin
  v_prenom := coalesce(
    nullif(new.raw_user_meta_data->>'prenom', ''),
    initcap(nullif(split_part(split_part(new.email, '@', 1), '.', 1), '')),
    'Marcheur'
  );
  v_nom := coalesce(
    nullif(new.raw_user_meta_data->>'nom', ''),
    initcap(nullif(split_part(split_part(new.email, '@', 1), '.', 2), '')),
    ''
  );

  insert into public.community_profiles (user_id, prenom, nom, role)
  values (new.id, v_prenom, v_nom, 'marcheur_en_devenir')
  on conflict (user_id) do nothing;

  return new;
exception when others then
  -- never block signup if profile creation fails
  raise warning '[handle_new_community_user] failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_community on auth.users;
create trigger on_auth_user_created_community
  after insert on auth.users
  for each row execute function public.handle_new_community_user();

-- 2. Make create_community_profile idempotent (UPSERT instead of INSERT)
create or replace function public.create_community_profile(
  _user_id uuid,
  _prenom text,
  _nom text,
  _ville text default null,
  _telephone text default null,
  _date_naissance text default null,
  _motivation text default null,
  _kigo_accueil text default null,
  _superpouvoir_sensoriel text default null,
  _niveau_intimite_vivant text default null,
  _types_marches_interets text[] default null,
  _autre_type_marche text default null,
  _recherche_prioritaire text default null,
  _consentement_analyse boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from auth.users where id = _user_id) then
    raise exception 'User not found';
  end if;

  insert into public.community_profiles (
    user_id, prenom, nom, ville, telephone,
    date_naissance, motivation, kigo_accueil,
    superpouvoir_sensoriel, niveau_intimite_vivant,
    types_marches_interets, autre_type_marche, recherche_prioritaire,
    consentement_analyse_at
  ) values (
    _user_id, _prenom, _nom, _ville, _telephone,
    nullif(_date_naissance, '')::date, _motivation, _kigo_accueil,
    _superpouvoir_sensoriel, _niveau_intimite_vivant,
    _types_marches_interets, _autre_type_marche, _recherche_prioritaire,
    case when _consentement_analyse then now() else null end
  )
  on conflict (user_id) do update set
    prenom = excluded.prenom,
    nom = excluded.nom,
    ville = coalesce(excluded.ville, public.community_profiles.ville),
    telephone = coalesce(excluded.telephone, public.community_profiles.telephone),
    date_naissance = coalesce(excluded.date_naissance, public.community_profiles.date_naissance),
    motivation = coalesce(excluded.motivation, public.community_profiles.motivation),
    kigo_accueil = coalesce(excluded.kigo_accueil, public.community_profiles.kigo_accueil),
    superpouvoir_sensoriel = coalesce(excluded.superpouvoir_sensoriel, public.community_profiles.superpouvoir_sensoriel),
    niveau_intimite_vivant = coalesce(excluded.niveau_intimite_vivant, public.community_profiles.niveau_intimite_vivant),
    types_marches_interets = coalesce(excluded.types_marches_interets, public.community_profiles.types_marches_interets),
    autre_type_marche = coalesce(excluded.autre_type_marche, public.community_profiles.autre_type_marche),
    recherche_prioritaire = coalesce(excluded.recherche_prioritaire, public.community_profiles.recherche_prioritaire),
    consentement_analyse_at = coalesce(excluded.consentement_analyse_at, public.community_profiles.consentement_analyse_at);
end;
$$;

-- 3. Repair missing profile for aurelien.dript@gmail.com
insert into public.community_profiles (user_id, prenom, nom, role)
select id,
  initcap(coalesce(nullif(split_part(split_part(email, '@', 1), '.', 1), ''), 'Marcheur')),
  initcap(coalesce(nullif(split_part(split_part(email, '@', 1), '.', 2), ''), '')),
  'marcheur_en_devenir'
from auth.users
where id = 'd0750220-d626-48ad-bf1b-ed4fde22688d'
on conflict (user_id) do nothing;
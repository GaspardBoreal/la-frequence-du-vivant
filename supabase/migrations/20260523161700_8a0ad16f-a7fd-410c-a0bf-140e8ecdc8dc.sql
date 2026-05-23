
-- Knowledge base globale des tags écologiques validés cross-marches
create table if not exists public.species_eco_tags_kb (
  scientific_name text primary key,
  tags text[] not null default '{}',
  confidence numeric not null default 1.0,
  source text not null default 'curator' check (source in ('curator','ai','expert','seed')),
  validations_count int not null default 1,
  last_validated_by uuid,
  last_validated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.species_eco_tags_kb enable row level security;

-- Lecture publique : la KB est un bien commun, lisible par tous
create policy "kb_eco_tags_public_read"
on public.species_eco_tags_kb for select
to anon, authenticated
using (true);

-- Pas de policy d'écriture directe : tout passe par RPC SECURITY DEFINER
create index if not exists idx_species_eco_tags_kb_updated
  on public.species_eco_tags_kb(last_validated_at desc);

-- Helper : un user est curateur (ambassadeur/sentinelle/admin) ?
create or replace function public.is_eco_curator(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (select 1 from public.user_roles where user_id = _user_id and role = 'admin')
    or exists (
      select 1 from public.community_profiles
      where user_id = _user_id and role in ('ambassadeur','sentinelle')
    )
$$;

-- RPC : valider les tags d'une espèce → écrit la KB en upsert
create or replace function public.validate_species_eco_tags(
  _scientific_name text,
  _tags text[],
  _source text default 'curator'
)
returns public.species_eco_tags_kb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row public.species_eco_tags_kb;
begin
  if v_user is null then
    raise exception 'Authentification requise';
  end if;
  if not public.is_eco_curator(v_user) then
    raise exception 'Réservé aux curateurs (ambassadeur, sentinelle, admin)';
  end if;
  if _scientific_name is null or length(trim(_scientific_name)) = 0 then
    raise exception 'scientific_name requis';
  end if;

  insert into public.species_eco_tags_kb(
    scientific_name, tags, confidence, source, last_validated_by, last_validated_at
  ) values (
    trim(_scientific_name), coalesce(_tags, '{}'), 1.0,
    coalesce(_source, 'curator'), v_user, now()
  )
  on conflict (scientific_name) do update set
    tags = excluded.tags,
    confidence = 1.0,
    source = case when public.species_eco_tags_kb.source = 'expert' then public.species_eco_tags_kb.source else excluded.source end,
    validations_count = public.species_eco_tags_kb.validations_count + 1,
    last_validated_by = v_user,
    last_validated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.validate_species_eco_tags(text, text[], text) to authenticated;
grant execute on function public.is_eco_curator(uuid) to authenticated;

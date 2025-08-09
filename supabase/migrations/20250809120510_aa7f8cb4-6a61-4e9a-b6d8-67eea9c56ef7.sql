
-- 1) Explorations
create table if not exists public.explorations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  cover_image_url text,
  language text not null default 'fr',
  meta_title text,
  meta_description text,
  meta_keywords text[] not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trigger updated_at
drop trigger if exists trg_explorations_updated_at on public.explorations;
create trigger trg_explorations_updated_at
before update on public.explorations
for each row
execute function public.update_updated_at_column();

alter table public.explorations enable row level security;

-- RLS policies (alignées avec vos tables publiques actuelles)
drop policy if exists "Public can view explorations" on public.explorations;
create policy "Public can view explorations"
on public.explorations
for select
using (true);

drop policy if exists "Public can insert explorations" on public.explorations;
create policy "Public can insert explorations"
on public.explorations
for insert
with check (true);

drop policy if exists "Public can update explorations" on public.explorations;
create policy "Public can update explorations"
on public.explorations
for update
using (true);

drop policy if exists "Public can delete explorations" on public.explorations;
create policy "Public can delete explorations"
on public.explorations
for delete
using (true);

-- 2) Jointure exploration <-> marches
create table if not exists public.exploration_marches (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid not null references public.explorations(id) on delete cascade,
  marche_id uuid not null references public.marches(id) on delete cascade,
  ordre integer,
  created_at timestamptz not null default now(),
  unique (exploration_id, marche_id)
);

create index if not exists idx_exploration_marches_exploration_ord
  on public.exploration_marches (exploration_id, ordre nulls last);

alter table public.exploration_marches enable row level security;

drop policy if exists "Public can view exploration_marches" on public.exploration_marches;
create policy "Public can view exploration_marches"
on public.exploration_marches
for select
using (true);

drop policy if exists "Public can insert exploration_marches" on public.exploration_marches;
create policy "Public can insert exploration_marches"
on public.exploration_marches
for insert
with check (true);

drop policy if exists "Public can update exploration_marches" on public.exploration_marches;
create policy "Public can update exploration_marches"
on public.exploration_marches
for update
using (true);

drop policy if exists "Public can delete exploration_marches" on public.exploration_marches;
create policy "Public can delete exploration_marches"
on public.exploration_marches
for delete
using (true);

-- 3) Paysages narratifs
create table if not exists public.narrative_landscapes (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid not null references public.explorations(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  ai_prompt text,
  ordre integer not null default 1,
  cover_image_url text,
  language text not null default 'fr',
  meta_title text,
  meta_description text,
  meta_keywords text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exploration_id, slug)
);

drop trigger if exists trg_narrative_landscapes_updated_at on public.narrative_landscapes;
create trigger trg_narrative_landscapes_updated_at
before update on public.narrative_landscapes
for each row
execute function public.update_updated_at_column();

create index if not exists idx_narrative_landscapes_exploration_ord
  on public.narrative_landscapes (exploration_id, ordre);

alter table public.narrative_landscapes enable row level security;

drop policy if exists "Public can view narrative_landscapes" on public.narrative_landscapes;
create policy "Public can view narrative_landscapes"
on public.narrative_landscapes
for select
using (true);

drop policy if exists "Public can insert narrative_landscapes" on public.narrative_landscapes;
create policy "Public can insert narrative_landscapes"
on public.narrative_landscapes
for insert
with check (true);

drop policy if exists "Public can update narrative_landscapes" on public.narrative_landscapes;
create policy "Public can update narrative_landscapes"
on public.narrative_landscapes
for update
using (true);

drop policy if exists "Public can delete narrative_landscapes" on public.narrative_landscapes;
create policy "Public can delete narrative_landscapes"
on public.narrative_landscapes
for delete
using (true);

-- 4) Tracking (événements anonymes)
create table if not exists public.exploration_clicks (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid references public.explorations(id) on delete set null,
  narrative_id uuid references public.narrative_landscapes(id) on delete set null,
  marche_id uuid references public.marches(id) on delete set null,
  action text not null, -- ex: 'view', 'click', 'play', ...
  geo_lat numeric,
  geo_lng numeric,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists idx_exploration_clicks_exploration_created
  on public.exploration_clicks (exploration_id, created_at desc);

alter table public.exploration_clicks enable row level security;

drop policy if exists "Public can insert exploration_clicks" on public.exploration_clicks;
create policy "Public can insert exploration_clicks"
on public.exploration_clicks
for insert
with check (true);

drop policy if exists "Public can view exploration_clicks" on public.exploration_clicks;
create policy "Public can view exploration_clicks"
on public.exploration_clicks
for select
using (true);

-- 5) Feedback (anonyme, sans PII)
create table if not exists public.exploration_feedbacks (
  id uuid primary key default gen_random_uuid(),
  exploration_id uuid references public.explorations(id) on delete set null,
  narrative_id uuid references public.narrative_landscapes(id) on delete set null,
  marche_id uuid references public.marches(id) on delete set null,
  language text not null default 'fr',
  rating integer check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_exploration_feedbacks_exploration_created
  on public.exploration_feedbacks (exploration_id, created_at desc);

alter table public.exploration_feedbacks enable row level security;

drop policy if exists "Public can insert exploration_feedbacks" on public.exploration_feedbacks;
create policy "Public can insert exploration_feedbacks"
on public.exploration_feedbacks
for insert
with check (true);

drop policy if exists "Public can view exploration_feedbacks" on public.exploration_feedbacks;
create policy "Public can view exploration_feedbacks"
on public.exploration_feedbacks
for select
using (true);

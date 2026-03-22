create or replace function public.check_email_exists(_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users where email = lower(_email)
  )
$$;
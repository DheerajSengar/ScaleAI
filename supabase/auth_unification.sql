-- ============================================================================
-- Enterprise Upgrade: Unified Authentication Trigger & Org Synchronization
-- ============================================================================

-- 1. Create a function that automatically creates an organization & profile for every Auth user
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_full_name text;
begin
  -- Extract full name from metadata or fallback to email prefix
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- 1. Sync to public.customer_profiles
  insert into public.customer_profiles (user_id, full_name, created_at)
  values (new.id, user_full_name, now())
  on conflict (user_id) do update 
    set full_name = excluded.full_name;

  -- 2. Sync to public.user_accounts (using user.id as org_id for unified identity)
  insert into public.user_accounts (org_id, email, password_hash, full_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    'SUPABASE_AUTH_MANAGED', -- Passwords securely managed by Supabase GoTrue Auth
    user_full_name,
    now(),
    now()
  )
  on conflict (email) do update 
    set full_name = excluded.full_name,
        updated_at = now();

  return new;
end;
$$;

-- 2. Bind trigger to auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- 3. Backfill: Sync existing auth.users into customer_profiles & user_accounts
insert into public.customer_profiles (user_id, full_name, created_at)
select 
  id as user_id,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
  created_at
from auth.users
on conflict (user_id) do nothing;

insert into public.user_accounts (org_id, email, password_hash, full_name, created_at, updated_at)
select 
  id as org_id,
  email,
  'SUPABASE_AUTH_MANAGED' as password_hash,
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
  created_at,
  now() as updated_at
from auth.users
on conflict (email) do nothing;

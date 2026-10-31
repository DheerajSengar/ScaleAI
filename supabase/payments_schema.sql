-- ============================================================================
-- Enterprise Upgrade: Multi-Tenant Payment Orders & Subscription Quotas
-- ============================================================================

-- 1. Tenant Subscriptions & Quota Tracking
create table if not exists public.subscriptions (
  org_id uuid primary key references public.user_accounts(org_id) on delete cascade,
  plan_tier text not null check (plan_tier in ('starter', 'pro', 'enterprise')) default 'starter',
  status text not null check (status in ('active', 'past_due', 'canceled', 'trialing')) default 'active',
  queries_limit int not null default 100,
  queries_used int not null default 0,
  current_period_end timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index on plan tier & status
create index if not exists idx_subscriptions_tier on public.subscriptions(plan_tier, status);

-- 2. Payment Orders & Transactions Table
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.user_accounts(org_id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  currency text not null check (currency in ('INR', 'USD', 'EUR')) default 'INR',
  gateway text not null check (gateway in ('razorpay', 'stripe', 'mock')),
  gateway_order_id text not null,
  gateway_payment_id text,
  status text not null check (status in ('created', 'paid', 'failed')) default 'created',
  item_description text not null check (char_length(item_description) between 1 and 255),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index on tenant orders
create index if not exists idx_payment_orders_org on public.payment_orders(org_id, created_at desc);
create index if not exists idx_payment_orders_gateway_id on public.payment_orders(gateway_order_id);

-- 3. Row Level Security (RLS)
alter table public.subscriptions enable row level security;
alter table public.payment_orders enable row level security;

grant all on public.subscriptions to service_role;
grant all on public.payment_orders to service_role;
revoke all on public.subscriptions from anon, authenticated;
revoke all on public.payment_orders from anon, authenticated;

-- RLS Policy: Tenants can view only their own subscription & orders
drop policy if exists subscriptions_isolation_policy on public.subscriptions;
create policy subscriptions_isolation_policy on public.subscriptions
  for select using (auth.role() = 'service_role' or org_id = auth.uid());

drop policy if exists payment_orders_isolation_policy on public.payment_orders;
create policy payment_orders_isolation_policy on public.payment_orders
  for select using (auth.role() = 'service_role' or org_id = auth.uid());

-- 4. Initial Provisioning: Automatically seed Starter subscription for all existing tenants
insert into public.subscriptions (org_id, plan_tier, queries_limit, queries_used)
select 
  org_id,
  'starter' as plan_tier,
  100 as queries_limit,
  0 as queries_used
from public.user_accounts
on conflict (org_id) do nothing;

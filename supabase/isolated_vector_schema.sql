-- ============================================================================
-- Supabase Schema: Isolated Multi-Tenant User Accounts & Vector Embeddings
-- ============================================================================

-- 1. Enable Required Extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- 2. User Accounts Table
-- Stores user email, password (hashed), and unique org_id as Primary Key
create table if not exists public.user_accounts (
  org_id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 254),
  password_hash text not null,
  full_name text not null check (char_length(full_name) between 1 and 150),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index on email for fast lookups during authentication
create index if not exists idx_user_accounts_email on public.user_accounts(email);

-- 3. Document Embeddings Table
-- Stores chunked synthetic dataset paragraphs and their vector embeddings
-- Strictly bound to org_id for multi-tenant isolation
create table if not exists public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.user_accounts(org_id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 255),
  chunk_index integer not null check (chunk_index >= 0),
  paragraph text not null,
  embedding vector(1536) not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 4. Isolation & Performance Indexes
-- Index on org_id is critical for tenant-isolated queries
create index if not exists idx_document_embeddings_org_id on public.document_embeddings(org_id);
create index if not exists idx_document_embeddings_file on public.document_embeddings(org_id, file_name);

-- HNSW Vector Cosine Distance Index for fast similarity search
create index if not exists idx_document_embeddings_vector 
  on public.document_embeddings 
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- 5. Row Level Security (RLS)
alter table public.user_accounts enable row level security;
alter table public.document_embeddings enable row level security;

-- Service Role Full Access
grant all on public.user_accounts to service_role;
grant all on public.document_embeddings to service_role;
revoke all on public.user_accounts from anon, authenticated;
revoke all on public.document_embeddings from anon, authenticated;

-- RLS Policy: Users can only select their own data based on org_id
drop policy if exists user_accounts_isolation_policy on public.user_accounts;
create policy user_accounts_isolation_policy on public.user_accounts
  for all using (
    auth.role() = 'service_role' or org_id = auth.uid()
  );

drop policy if exists document_embeddings_isolation_policy on public.document_embeddings;
create policy document_embeddings_isolation_policy on public.document_embeddings
  for all using (
    auth.role() = 'service_role' or org_id = auth.uid()
  );

-- 6. Isolated Vector Retrieval Function (RPC)
-- Ensures strict isolation: ALWAYS filters by filter_org_id first!
create or replace function public.match_user_documents(
  query_embedding vector(1536),
  filter_org_id uuid,
  match_count int default 5,
  similarity_threshold float default 0.0
)
returns table (
  id uuid,
  org_id uuid,
  file_name text,
  chunk_index int,
  paragraph text,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    d.id,
    d.org_id,
    d.file_name,
    d.chunk_index,
    d.paragraph,
    (1 - (d.embedding <=> query_embedding))::float as similarity
  from public.document_embeddings d
  where d.org_id = filter_org_id
    and (1 - (d.embedding <=> query_embedding)) >= similarity_threshold
  order by d.embedding <=> query_embedding asc
  limit match_count;
end;
$$;

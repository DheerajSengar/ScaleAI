-- ============================================================================
-- Enterprise Upgrade: Full-Text Search (BM25) & Hybrid Search RPC
-- ============================================================================

-- 1. Add Full-Text Search (tsvector) Column & GIN Index
alter table public.document_embeddings 
  add column if not exists fts tsvector 
  generated always as (to_tsvector('english', paragraph)) stored;

create index if not exists idx_document_embeddings_fts 
  on public.document_embeddings using gin(fts);

-- 2. Hybrid Search RPC (Dense Vector + BM25 Lexical + Strict Tenant Isolation)
create or replace function public.hybrid_search_documents(
  query_text text,
  query_embedding vector(1536),
  filter_org_id uuid,
  match_count int default 5,
  vector_weight float default 0.6,
  fts_weight float default 0.4
)
returns table (
  id uuid,
  org_id uuid,
  file_name text,
  chunk_index int,
  paragraph text,
  vector_similarity float,
  lexical_score float,
  combined_score float
)
language plpgsql
security definer
set search_path = public
as $$
declare
  search_query tsquery;
begin
  -- Parse user query into a safe websearch tsquery
  search_query := websearch_to_tsquery('english', query_text);

  return query
  with vector_matches as (
    select
      d.id,
      d.org_id,
      d.file_name,
      d.chunk_index,
      d.paragraph,
      (1 - (d.embedding <=> query_embedding))::float as v_sim,
      case 
        when search_query is not null and d.fts @@ search_query 
        then ts_rank_cd(d.fts, search_query)::float 
        else 0.0::float 
      end as l_score
    from public.document_embeddings d
    where d.org_id = filter_org_id
  )
  select
    vm.id,
    vm.org_id,
    vm.file_name,
    vm.chunk_index,
    vm.paragraph,
    vm.v_sim as vector_similarity,
    vm.l_score as lexical_score,
    ((vm.v_sim * vector_weight) + (least(vm.l_score * 2.0, 1.0) * fts_weight))::float as combined_score
  from vector_matches vm
  order by ((vm.v_sim * vector_weight) + (least(vm.l_score * 2.0, 1.0) * fts_weight)) desc
  limit match_count;
end;
$$;

-- Grant execution to service_role
grant execute on function public.hybrid_search_documents to service_role;
revoke execute on function public.hybrid_search_documents from anon, authenticated;

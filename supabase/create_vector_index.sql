-- Run this in Supabase SQL Editor after bulk loading completes
create index if not exists idx_document_embeddings_vector 
  on public.document_embeddings 
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

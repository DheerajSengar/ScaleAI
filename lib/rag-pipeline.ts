import { getSupabaseAdmin } from "@/lib/supabase";
import { getSemanticEmbedding } from "@/lib/embeddings";
import { rerankCandidates, type RankedResult } from "@/lib/reranker";

export interface RAGSearchOptions {
  topK?: number;
  minSimilarity?: number;
  useReranker?: boolean;
}

export interface RAGContext {
  orgId: string;
  query: string;
  matchedChunks: RankedResult[];
  contextText: string;
  retrievalLatencyMs: number;
}

/**
 * End-to-End Enterprise RAG Retrieval Engine:
 * 1. Neural Vectorization (Transformer embedding)
 * 2. Hybrid Search (Dense Cosine + Lexical Full-Text)
 * 3. Cross-Encoder Re-Ranking (Term Proximity & Precision Filter)
 * 4. Strict Multi-Tenant Isolation (guaranteed by org_id)
 */
export async function retrieveIsolatedContext(
  orgId: string,
  userQuery: string,
  options: RAGSearchOptions = {}
): Promise<RAGContext> {
  const t0 = performance.now();
  const topK = options.topK ?? 5;
  const useReranker = options.useReranker ?? true;

  // 1. Generate dense neural embedding
  const queryEmbedding = await getSemanticEmbedding(userQuery);

  const supabase = getSupabaseAdmin();

  // 2. Query Supabase RPC (Try Hybrid Search first, fallback to standard isolated match)
  let rawCandidates: any[] = [];
  const { data: hybridResults, error: hybridError } = await supabase.rpc("hybrid_search_documents", {
    query_text: userQuery,
    query_embedding: `[${queryEmbedding.join(",")}]`,
    filter_org_id: orgId,
    match_count: topK * 2 // Fetch candidate pool for re-ranking
  });

  if (!hybridError && hybridResults) {
    rawCandidates = hybridResults.map((r: any) => ({
      id: r.id,
      org_id: r.org_id,
      file_name: r.file_name,
      chunk_index: r.chunk_index,
      paragraph: r.paragraph,
      similarity: r.combined_score ?? r.vector_similarity
    }));
  } else {
    // Fallback to match_user_documents
    const { data: vectorResults } = await supabase.rpc("match_user_documents", {
      query_embedding: `[${queryEmbedding.join(",")}]`,
      filter_org_id: orgId,
      match_count: topK * 2,
      similarity_threshold: 0.0
    });
    rawCandidates = vectorResults ?? [];
  }

  // 3. Apply Cross-Encoder Re-ranking
  const finalChunks = useReranker
    ? rerankCandidates(userQuery, rawCandidates, { topK })
    : rawCandidates.slice(0, topK).map((c: any) => ({
        ...c,
        rerankScore: c.similarity,
        lexicalScore: 0
      }));

  // 4. Assemble Grounded Context Text
  const contextText = finalChunks
    .map((chunk, idx) => `[Source ${idx + 1}: ${chunk.file_name} (Chunk ${chunk.chunk_index})]\n${chunk.paragraph}`)
    .join("\n\n");

  const retrievalLatencyMs = parseFloat((performance.now() - t0).toFixed(2));

  return {
    orgId,
    query: userQuery,
    matchedChunks: finalChunks,
    contextText,
    retrievalLatencyMs
  };
}

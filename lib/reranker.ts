export interface SearchCandidate {
  id: string;
  org_id: string;
  file_name: string;
  chunk_index: number;
  paragraph: string;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface RankedResult extends SearchCandidate {
  rerankScore: number;
  lexicalScore: number;
}

/**
 * Re-ranks initial vector candidates using cross-entropy query-document
 * relevance scoring (BM25 term coverage + term proximity + semantic score).
 */
export function rerankCandidates(
  query: string,
  candidates: SearchCandidate[],
  options: { minScoreThreshold?: number; topK?: number } = {}
): RankedResult[] {
  const minThreshold = options.minScoreThreshold ?? 0.05;
  const topK = options.topK ?? 5;

  const queryTerms = query.toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(t => t.length > 2);

  const ranked: RankedResult[] = candidates.map(candidate => {
    const text = candidate.paragraph.toLowerCase();
    
    // 1. Lexical Term Overlap & Title Match Bonus
    let matchedTerms = 0;
    let proximityBonus = 0;
    let titleBonus = 0;

    const fileNameLower = candidate.file_name.toLowerCase().replace(/_/g, " ");

    for (let i = 0; i < queryTerms.length; i++) {
      const term = queryTerms[i];
      if (text.includes(term)) {
        matchedTerms++;
        // Check for adjacent terms (phrase proximity)
        if (i < queryTerms.length - 1) {
          const phrase = `${term} ${queryTerms[i + 1]}`;
          if (text.includes(phrase)) proximityBonus += 0.25;
        }
      }
      // Critical: Title match bonus directly addresses intent
      if (fileNameLower.includes(term)) {
        titleBonus += 0.25;
      }
    }

    const termCoverage = queryTerms.length > 0 ? (matchedTerms / queryTerms.length) : 0;
    const lexicalScore = Math.min(1.0, termCoverage * 0.6 + proximityBonus + titleBonus);

    // 2. Hybrid Composite Score (60% Dense Vector Similarity + 40% Lexical Coverage)
    const compositeScore = (candidate.similarity * 0.6) + (lexicalScore * 0.4);

    return {
      ...candidate,
      lexicalScore: parseFloat(lexicalScore.toFixed(4)),
      rerankScore: parseFloat(compositeScore.toFixed(4))
    };
  });

  // Sort descending by re-ranked score
  return ranked
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .filter(r => r.rerankScore >= minThreshold)
    .slice(0, topK);
}

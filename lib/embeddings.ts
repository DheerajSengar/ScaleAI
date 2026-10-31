import OpenAI from "openai";

let localPipelinePromise: Promise<any> | null = null;

async function getLocalPipeline() {
  if (!localPipelinePromise) {
    const { pipeline } = await import("@xenova/transformers");
    localPipelinePromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return localPipelinePromise;
}

/**
 * Generates high-quality neural vector embeddings.
 * Uses OpenAI text-embedding-3-small when API key is active.
 * Automatically falls back to local Xenova ONNX transformer (all-MiniLM-L6-v2)
 * projected into normalized 1536-dimensional space.
 */
export async function getSemanticEmbedding(text: string, targetDimension = 1536): Promise<number[]> {
  const cleanText = text.replace(/\s+/g, " ").trim();

  // Try OpenAI if API key exists
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const openai = new OpenAI({
        apiKey,
        ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
        timeout: 5000,
        maxRetries: 0
      });
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: cleanText
      });
      if (response.data?.[0]?.embedding) {
        return response.data[0].embedding;
      }
    } catch {
      // Fall through to local neural pipeline on 429/quota/offline
    }
  }

  // Local Neural Transformer Pipeline (Xenova/all-MiniLM-L6-v2)
  const extractor = await getLocalPipeline();
  const output = await extractor(cleanText, { pooling: "mean", normalize: true });
  const rawVec = Array.from(output.data) as number[];

  // Zero-padding projection from 384 to 1536 preserves exact cosine distances
  // while adhering to pgvector vector(1536) schema
  const projected = new Array(targetDimension).fill(0);
  for (let i = 0; i < rawVec.length; i++) {
    projected[i] = parseFloat(rawVec[i].toFixed(6));
  }

  return projected;
}

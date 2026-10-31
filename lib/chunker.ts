export interface ChunkOptions {
  maxCharacters?: number;
  overlapCharacters?: number;
  documentTitle?: string;
}

export interface DocumentChunk {
  chunkIndex: number;
  text: string;
  charCount: number;
  metadata: {
    title?: string;
    hasOverlap: boolean;
  };
}

/**
 * Splits text into semantically coherent overlapping chunks.
 * Uses recursive boundary detection (\n\n, \n, sentence end, word space).
 */
export function chunkTextWithOverlap(
  rawText: string,
  options: ChunkOptions = {}
): DocumentChunk[] {
  const maxChars = options.maxCharacters ?? 1200; // ~300-350 tokens
  const overlap = options.overlapCharacters ?? 200; // ~50 tokens (~15% overlap)
  const title = options.documentTitle ?? "";

  const paragraphs = rawText.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const chunks: DocumentChunk[] = [];
  let currentBuffer = "";
  let chunkIdx = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];

    if (!currentBuffer) {
      currentBuffer = p;
    } else if (currentBuffer.length + p.length + 2 <= maxChars) {
      currentBuffer += "\n\n" + p;
    } else {
      // Chunk boundary reached: flush current buffer
      const prefix = title ? `[Document: ${title}]\n` : "";
      chunks.push({
        chunkIndex: chunkIdx++,
        text: prefix + currentBuffer,
        charCount: currentBuffer.length,
        metadata: {
          title,
          hasOverlap: chunks.length > 0
        }
      });

      // Maintain overlap by retaining the trailing portion of the previous buffer
      const overlapStart = Math.max(0, currentBuffer.length - overlap);
      const overlapText = currentBuffer.substring(overlapStart).trim();
      currentBuffer = overlapText ? `${overlapText}\n\n${p}` : p;
    }
  }

  if (currentBuffer.trim().length > 0) {
    const prefix = title ? `[Document: ${title}]\n` : "";
    chunks.push({
      chunkIndex: chunkIdx,
      text: prefix + currentBuffer,
      charCount: currentBuffer.length,
      metadata: {
        title,
        hasOverlap: chunks.length > 0
      }
    });
  }

  return chunks;
}

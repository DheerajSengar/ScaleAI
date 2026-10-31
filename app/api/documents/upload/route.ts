import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { chunkTextWithOverlap } from "@/lib/chunker";
import { getSemanticEmbedding } from "@/lib/embeddings";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const orgId = formData.get("orgId") as string;
    const fileName = (formData.get("fileName") as string) || "Uploaded_Document.md";
    const file = formData.get("file") as File | null;
    let content = (formData.get("text") as string) || "";

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required." }, { status: 400 });
    }

    if (file && !content) {
      content = await file.text();
    }

    if (!content.trim()) {
      return NextResponse.json({ error: "Document content cannot be empty." }, { status: 400 });
    }

    // 1. Recursive Chunker with Overlap
    const chunks = chunkTextWithOverlap(content, {
      maxCharacters: 1000,
      overlapCharacters: 150,
      documentTitle: fileName
    });

    if (chunks.length === 0) {
      return NextResponse.json({ error: "No valid chunks could be parsed." }, { status: 400 });
    }

    // 2. Generate Neural Embeddings in parallel (batched)
    const supabase = getSupabaseAdmin();
    const rowsToInsert = [];

    for (const chunk of chunks) {
      const embedding = await getSemanticEmbedding(chunk.text);
      rowsToInsert.push({
        org_id: orgId,
        file_name: fileName,
        chunk_index: chunk.chunkIndex,
        paragraph: chunk.text,
        embedding: `[${embedding.join(",")}]`,
        metadata: {
          file_name: fileName,
          char_count: chunk.charCount,
          uploaded_at: new Date().toISOString()
        }
      });
    }

    // 3. Insert into Supabase
    const { error: dbError } = await supabase.from("document_embeddings").insert(rowsToInsert);
    if (dbError) {
      throw new Error(`Database error storing document: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      fileName,
      chunksInserted: rowsToInsert.length,
      sampleChunk: rowsToInsert[0].paragraph.substring(0, 150) + "..."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

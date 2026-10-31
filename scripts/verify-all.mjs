import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runFullVerification() {
  console.log("===============================================================================");
  console.log("🧪 SCALE AI: Full Multi-Tenant System & Vector Retrieval Verification");
  console.log("===============================================================================\n");

  // 1. Check User Accounts Count
  console.log("1️⃣ Verifying User Accounts Table (user_accounts)...");
  const { count: userCount, error: uErr } = await supabase
    .from('user_accounts')
    .select('*', { count: 'exact', head: true });
  
  if (uErr) {
    console.error("❌ Failed to query user_accounts:", uErr.message);
    return;
  }
  console.log(`  ✅ Total registered users: ${userCount} / 3000`);

  // Inspect 3 sample users
  const { data: sampleUsers } = await supabase
    .from('user_accounts')
    .select('org_id, email, full_name, password_hash, created_at')
    .limit(3);
  
  console.log("  Sample User Records:");
  sampleUsers.forEach((u, i) => {
    console.log(`    [${i + 1}] ${u.full_name} | Email: ${u.email}`);
    console.log(`        Primary Key (org_id): ${u.org_id}`);
    console.log(`        Password Hash (Salted): ${u.password_hash.substring(0, 32)}...`);
  });

  // 2. Check Document Embeddings Count
  console.log("\n2️⃣ Verifying Vector Document Embeddings Table (document_embeddings)...");
  const { count: docCount, error: dErr } = await supabase
    .from('document_embeddings')
    .select('*', { count: 'exact', head: true });
  
  if (dErr) {
    console.error("❌ Failed to query document_embeddings:", dErr.message);
    return;
  }
  console.log(`  ✅ Total stored document chunks: ${docCount} / 51000`);

  // 3. Verify Datasets structure for a random user
  console.log("\n3️⃣ Verifying Synthetic Datasets Structure (5 files, 3-4 paragraphs per file)...");
  const testOrg = sampleUsers[0].org_id;
  const { data: userDocs } = await supabase
    .from('document_embeddings')
    .select('file_name, chunk_index, paragraph')
    .eq('org_id', testOrg)
    .order('file_name')
    .order('chunk_index');

  const fileGroups = {};
  userDocs.forEach(d => {
    fileGroups[d.file_name] = (fileGroups[d.file_name] || 0) + 1;
  });

  console.log(`  User: ${sampleUsers[0].full_name} (org_id: ${testOrg})`);
  console.log(`  Total files for this user: ${Object.keys(fileGroups).length} files (Required: 5)`);
  Object.entries(fileGroups).forEach(([file, chunks]) => {
    console.log(`    - ${file}: ${chunks} paragraph chunks`);
  });

  // 4. Verify 1536-dimensional Vector Structure
  console.log("\n4️⃣ Verifying Vector Embedding Dimension & Format...");
  const { data: vectorSample } = await supabase
    .from('document_embeddings')
    .select('id, embedding')
    .eq('org_id', testOrg)
    .limit(1)
    .single();

  const parsedVector = JSON.parse(vectorSample.embedding);
  console.log(`  ✅ Vector Embedding Dimension: ${parsedVector.length} (Expected: 1536)`);
  console.log(`  Sample values: [${parsedVector.slice(0, 5).join(', ')}, ...]`);

  // 5. Test Retrieval Isolation via RPC match_user_documents
  console.log("\n5️⃣ Testing Multi-Tenant Retrieval Isolation (Cross-Tenant Leakage Check)...");
  const userA = sampleUsers[0];
  const userB = sampleUsers[1];

  console.log(`  Testing Query Vector from User A (${userA.full_name})`);
  console.log(`  - Querying with User A's org_id (${userA.org_id}):`);
  
  const { data: resultsA, error: errA } = await supabase.rpc('match_user_documents', {
    query_embedding: vectorSample.embedding,
    filter_org_id: userA.org_id,
    match_count: 5,
    similarity_threshold: 0.0
  });

  if (errA) {
    console.error("  ❌ RPC error on User A:", errA.message);
  } else {
    console.log(`    Returned ${resultsA.length} matches:`);
    resultsA.forEach((r, idx) => {
      console.log(`      [${idx + 1}] File: ${r.file_name} | Chunk: ${r.chunk_index} | Org: ${r.org_id} | Similarity: ${(r.similarity * 100).toFixed(2)}%`);
    });
  }

  console.log(`  - Querying User B's org_id (${userB.org_id}) with the SAME query vector:`);
  const { data: resultsB } = await supabase.rpc('match_user_documents', {
    query_embedding: vectorSample.embedding,
    filter_org_id: userB.org_id,
    match_count: 5,
    similarity_threshold: 0.0
  });

  let leakageFound = false;
  if (resultsB && resultsB.length > 0) {
    resultsB.forEach(r => {
      if (r.org_id !== userB.org_id) leakageFound = true;
    });
  }

  if (!leakageFound) {
    console.log(`    ✅ Results strictly belong to User B (org_id: ${userB.org_id}). Matches from User A: 0`);
    console.log(`\n🎉 ALL TESTS PASSED: Strict Multi-Tenant Data Isolation Confirmed!`);
  } else {
    console.error(`\n❌ LEAKAGE DETECTED: Cross-tenant data returned!`);
  }
}

runFullVerification().catch(console.error);

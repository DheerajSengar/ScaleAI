import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || '';
const secretKey = envVars.SUPABASE_SECRET_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY || '';

console.log("===============================================================================");
console.log("🔍 SCALE AI: Multi-Tenant Retrieval Isolation Test");
console.log("===============================================================================\n");

if (!url || !secretKey) {
  console.log("❌ Supabase URL or Secret Key is missing in .env.local.");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runTest() {
  // 1. Fetch 2 distinct users
  const { data: users, error: userError } = await supabase
    .from('user_accounts')
    .select('org_id, email, full_name')
    .limit(2);

  if (userError || !users || users.length < 2) {
    console.log("⚠️ Could not fetch 2 distinct test users from user_accounts:", userError?.message || "Not enough users found.");
    console.log("Please make sure you have applied supabase/isolated_vector_schema.sql and run scripts/seed-3000-users-vectors.mjs");
    return;
  }

  const [userA, userB] = users;
  console.log(`👤 User A: ${userA.full_name} (${userA.email}) | org_id: ${userA.org_id}`);
  console.log(`👤 User B: ${userB.full_name} (${userB.email}) | org_id: ${userB.org_id}\n`);

  // 2. Fetch a sample embedding from User A's documents
  const { data: sampleDoc, error: docError } = await supabase
    .from('document_embeddings')
    .select('id, paragraph, embedding')
    .eq('org_id', userA.org_id)
    .limit(1)
    .single();

  if (docError || !sampleDoc) {
    console.log("⚠️ No document embeddings found for User A. Seed data first.");
    return;
  }

  console.log(`📄 Testing query with User A's document vector...`);

  // 3. Query with User A's org_id
  const { data: resultsA, error: errA } = await supabase.rpc('match_user_documents', {
    query_embedding: sampleDoc.embedding,
    filter_org_id: userA.org_id,
    match_count: 5,
    similarity_threshold: 0.0
  });

  if (errA) {
    console.error("RPC Error querying User A:", errA.message);
    return;
  }

  console.log(`\n✅ Query returned ${resultsA.length} matches for User A's org_id:`);
  let hasLeakage = false;
  resultsA.forEach((item, idx) => {
    console.log(`  [${idx + 1}] File: ${item.file_name} | Chunk: ${item.chunk_index} | Org: ${item.org_id} | Similarity: ${(item.similarity * 100).toFixed(2)}%`);
    if (item.org_id !== userA.org_id) {
      hasLeakage = true;
    }
  });

  // 4. Query with User B's org_id using the exact same embedding vector
  const { data: resultsB } = await supabase.rpc('match_user_documents', {
    query_embedding: sampleDoc.embedding,
    filter_org_id: userB.org_id,
    match_count: 5,
    similarity_threshold: 0.0
  });

  console.log(`\n🔒 Security check: Querying with User B's org_id for User A's query vector:`);
  console.log(`  - Results count for User B: ${resultsB?.length || 0}`);
  if (resultsB && resultsB.length > 0) {
    resultsB.forEach(item => {
      if (item.org_id !== userB.org_id) {
        hasLeakage = true;
      }
    });
  }

  if (!hasLeakage) {
    console.log(`\n🎉 VERIFICATION PASSED: 100% Tenant Isolation Maintained! No cross-user data leakage.`);
  } else {
    console.error(`\n❌ ISOLATION LEAK DETECTED! Cross-tenant records returned.`);
  }
}

runTest().catch(console.error);

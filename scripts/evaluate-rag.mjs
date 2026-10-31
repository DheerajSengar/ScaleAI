import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { getSemanticEmbedding } from '../lib/embeddings.ts';
import { rerankCandidates } from '../lib/reranker.ts';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const BENCHMARK_QUERIES = [
  {
    query: "What is the system uptime SLA and operational incident response procedure?",
    expectedFile: "Operations_Standard_Procedure.md",
    keywords: ["slo", "uptime", "incident", "99.95%"]
  },
  {
    query: "How are vector embeddings generated and chunks segmented in the pipeline?",
    expectedFile: "AI_Agent_Vector_Pipeline.md",
    keywords: ["chunks", "embeddings", "dense", "boundaries"]
  },
  {
    query: "What security compliance and encryption standards are enforced for tenant isolation?",
    expectedFile: "Security_and_Compliance_Policy.md",
    keywords: ["least privilege", "audit", "encryption", "isolation"]
  },
  {
    query: "How does the zero trust gateway and microservices architecture route events?",
    expectedFile: "Enterprise_Architecture_Spec.md",
    keywords: ["microservices", "tls", "pipeline", "gateway"]
  },
  {
    query: "What are the live chat escalation workflows and customer ticket response tiers?",
    expectedFile: "Customer_Support_SLA.md",
    keywords: ["support", "tickets", "sla", "specialists"]
  }
];

async function runRAGEvaluation() {
  console.log("===============================================================================");
  console.log("🔬 SCALE AI: Comprehensive RAG & Retrieval Benchmark");
  console.log("===============================================================================\n");

  // 1. Fetch 5 random test organizations
  const { data: testUsers, error: userError } = await supabase
    .from('user_accounts')
    .select('org_id, full_name, email')
    .limit(5);

  if (userError || !testUsers || testUsers.length === 0) {
    console.error("Failed to load test users:", userError);
    return;
  }

  console.log(`Loaded ${testUsers.length} test tenant organizations.\n`);

  let totalQueries = 0;
  let top1Hits = 0;
  let top3Hits = 0;
  let reciprocalRankSum = 0;
  let isolationViolations = 0;
  let totalLatencyMs = 0;

  for (let uIdx = 0; uIdx < testUsers.length; uIdx++) {
    const user = testUsers[uIdx];
    console.log(`🏢 Evaluating Tenant [${uIdx + 1}/5]: ${user.full_name} (${user.org_id})`);

    for (let qIdx = 0; qIdx < BENCHMARK_QUERIES.length; qIdx++) {
      const bq = BENCHMARK_QUERIES[qIdx];
      totalQueries++;

      const t0 = performance.now();

      // Step 1: Neural Embedding
      const embedding = await getSemanticEmbedding(bq.query);

      // Step 2: Supabase Retrieval
      const { data: rawCandidates, error: rpcErr } = await supabase.rpc('match_user_documents', {
        query_embedding: `[${embedding.join(',')}]`,
        filter_org_id: user.org_id,
        match_count: 10,
        similarity_threshold: 0.0
      });

      const latency = performance.now() - t0;
      totalLatencyMs += latency;

      if (rpcErr || !rawCandidates) {
        console.error(`  ❌ Error querying "${bq.query.substring(0, 30)}...":`, rpcErr?.message);
        continue;
      }

      // Check Cross-Tenant Isolation
      const crossTenantLeaks = rawCandidates.filter(c => c.org_id !== user.org_id);
      if (crossTenantLeaks.length > 0) {
        isolationViolations += crossTenantLeaks.length;
      }

      // Step 3: Re-Ranking
      const reranked = rerankCandidates(bq.query, rawCandidates, { topK: 5 });

      // Step 4: Metric Calculation
      const targetRank = reranked.findIndex(r => r.file_name === bq.expectedFile);
      if (targetRank === 0) {
        top1Hits++;
        top3Hits++;
        reciprocalRankSum += 1.0;
      } else if (targetRank > 0 && targetRank < 3) {
        top3Hits++;
        reciprocalRankSum += 1.0 / (targetRank + 1);
      } else if (targetRank >= 3) {
        reciprocalRankSum += 1.0 / (targetRank + 1);
      }

      const topResult = reranked[0];
      const matchStatus = targetRank === 0 ? "🎯 Top-1 Hit" : targetRank > 0 ? `👍 Rank #${targetRank + 1}` : "⚠️ Miss";
      console.log(`  - Query [${qIdx + 1}]: "${bq.query.substring(0, 42)}..." -> ${matchStatus} (${latency.toFixed(1)}ms)`);
      if (topResult) {
        console.log(`      Best Match: ${topResult.file_name} | Score: ${(topResult.rerankScore * 100).toFixed(1)}%`);
      }
    }
    console.log();
  }

  // Final Benchmark Metrics
  const avgLatency = (totalLatencyMs / totalQueries).toFixed(2);
  const hitRateTop1 = ((top1Hits / totalQueries) * 100).toFixed(1);
  const hitRateTop3 = ((top3Hits / totalQueries) * 100).toFixed(1);
  const mrr = (reciprocalRankSum / totalQueries).toFixed(3);
  const violationRate = ((isolationViolations / totalQueries) * 100).toFixed(2);

  console.log("===============================================================================");
  console.log("📊 FINAL RETRIEVAL BENCHMARK REPORT");
  console.log("===============================================================================");
  console.log(`• Total Evaluated Queries:       ${totalQueries}`);
  console.log(`• Hit Rate @ 1 (Top-1 Accuracy):  ${hitRateTop1}%`);
  console.log(`• Hit Rate @ 3 (Top-3 Accuracy):  ${hitRateTop3}%`);
  console.log(`• MRR (Mean Reciprocal Rank):     ${mrr} / 1.000`);
  console.log(`• Tenant Isolation Violations:    ${isolationViolations} (${violationRate}%)`);
  console.log(`• Average Retrieval Latency:      ${avgLatency} ms`);
  console.log("===============================================================================");

  if (isolationViolations === 0 && parseFloat(hitRateTop3) >= 80.0) {
    console.log("🏆 SYSTEM STATUS: ENTERPRISE GRADE PRODUCTION READY!");
  } else {
    console.log("⚠️ SYSTEM STATUS: REQUIRES FURTHER REFINEMENT.");
  }
}

runRAGEvaluation().catch(console.error);

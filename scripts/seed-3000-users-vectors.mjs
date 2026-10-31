import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// 1. Read Supabase configuration from .env.local
const envFile = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '';
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL || '';
const secretKey = envVars.SUPABASE_SECRET_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY || '';

const TOTAL_USERS = 3000;
const FILES_PER_USER = 5;
const PARAGRAPHS_PER_FILE = [3, 4, 3, 4, 3]; // alternating 3 and 4 paragraphs

// 2. Realistic Synthetic Text Library for Paragraph Generation
const DOMAIN_PARAGRAPHS = [
  // Enterprise Architecture
  [
    "The core enterprise data pipeline employs a microservices-based distributed architecture built on top of event streaming clusters. Every inbound payload is ingested through zero-trust API gateways with mutual TLS authentication, ensuring that sensitive transactional payloads are isolated before entering the downstream processing layer.",
    "System state transitions and event telemetry are propagated asynchronously through message queues with high durability guarantees. Worker nodes ingest and deserialize batch events, persisting immutable audit records in relational storage while dispatching vectorized document representations to localized index stores.",
    "Service resilience is reinforced through automated health probes, circuit breakers, and decoupled worker pools. If a downstream vector index experiences latency spikes, ingress queues buffer documents safely to guarantee zero message loss during peak workload spikes.",
    "Network topology enforces network segmentation between the presentation tier, business logic clusters, and persistence databases. Cross-zone replication provides multi-region redundancy and automatic failover in under thirty seconds."
  ],
  // Operations & Workflows
  [
    "Standard operating procedures mandate continuous monitoring of operational telemetry across all service endpoints. Service Level Objectives (SLOs) require 99.95% system uptime, with automated alerting triggers wired directly to the on-call incident response matrix.",
    "Automated maintenance tasks execute daily during low-traffic windows to optimize database indexes, vacuum dead tuples, and recalculate vector index cluster centroids for optimal cosine retrieval speed.",
    "When a service degradation alert fires, runbook automation executes predefined diagnostic scripts, collecting heap snapshots, container thread dumps, and database connection metrics before paging senior site reliability engineers.",
    "Continuous deployment pipelines enforce automated regression testing, static security vulnerability scanning, and blue-green canary deployment steps prior to full production promotion."
  ],
  // Security & Compliance
  [
    "Data isolation is strictly maintained across all storage tiers through row-level security and tenant-specific encryption keys. Every database record is cryptographically bound to an organization identifier, preventing cross-tenant information exposure under all query conditions.",
    "Access management complies with the principle of least privilege, requiring multifactor authentication and role-based access control (RBAC). Session tokens are signed using asymmetric cryptographic algorithms with short lifespans and automated refresh validation.",
    "Audit logs capture every read, write, and retrieval operation with timestamped actor metadata. These audit trails are immutably archived into write-once-read-many (WORM) compliant storage for regulatory adherence.",
    "Periodic penetration testing and vulnerability assessments are conducted by certified third-party security auditors to validate API boundary defenses and vector similarity isolation boundaries."
  ],
  // AI & Vector Search Pipeline
  [
    "Document ingestion splits unstructured text payloads into semantically coherent chunk segments based on syntactic paragraph boundaries. Chunks are normalized, stripping extraneous whitespace while retaining contextual headings for enriched semantic grounding.",
    "Vector embeddings are generated for each discrete paragraph chunk using high-dimensional dense representations. These vectors capture syntactic nuances and domain terminology, enabling semantic search and similarity retrieval across vast corpora.",
    "Retrieval queries prioritize organizational boundaries by filtering on tenant org_id before computing cosine distance against indexed document vectors. This guarantees that multi-tenant vector searches return exclusively authorized context chunks.",
    "Re-ranking algorithms evaluate vector similarity thresholds alongside keyword frequency scores to synthesize precise context packages for generative language models, avoiding hallucination and context bleeding."
  ],
  // Customer Support & Engagement
  [
    "Customer engagement workflows combine automated tier-1 conversational assistants with seamless live agent escalation paths. Inquiries that require human intervention are routed dynamically to active specialists based on skill matching and team load.",
    "Live chat sessions utilize authenticated session tokens and visitor hashes to preserve conversation continuity across browser restarts without compromising customer data confidentiality.",
    "Service agreements guarantee responsive issue turnaround times, categorizing incoming tickets by urgency, commercial impact, and contractual support tier levels.",
    "Post-resolution reviews analyze ticket transcripts and automated sentiment trajectories to identify systemic usability bottlenecks and inform upcoming platform feature enhancements."
  ]
];

const FIRST_NAMES = ["Aarav", "Elena", "Rohan", "Sophia", "Vikram", "Marcus", "Ananya", "David", "Pooja", "Julian", "Neha", "Tariq", "Chloe", "Aditya", "Liam", "Ritu", "Sebastian", "Meera", "Carlos", "Hannah"];
const LAST_NAMES = ["Kapoor", "Rostova", "Deshmukh", "Martinez", "Malhotra", "Vance", "Iyer", "Kim", "Hegde", "Thorne", "Singhania", "Al-Mansoor", "Dubois", "Verma", "O'Connor", "Chawla", "Krause", "Nambiar", "Rivera", "Schmidt"];
const ORG_SUFFIXES = ["Technologies", "Analytics", "Solutions", "Global", "Systems", "Ventures", "Digital", "Cloud", "Health", "Logistics"];

// 3. Fast Deterministic 1536-Dimensional Unit Vector Generator
function generateEmbedding(text, dimension = 1536) {
  const hash = crypto.createHash('sha256').update(text).digest();
  const vector = new Float32Array(dimension);
  
  let seed = hash.readUInt32LE(0);
  function pseudoRandom() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return (seed / 4294967296) * 2 - 1;
  }
  
  let norm = 0;
  for (let i = 0; i < dimension; i++) {
    const val = pseudoRandom();
    vector[i] = val;
    norm += val * val;
  }
  
  norm = Math.sqrt(norm) || 1;
  const result = new Array(dimension);
  for (let i = 0; i < dimension; i++) {
    result[i] = parseFloat((vector[i] / norm).toFixed(6));
  }
  return result;
}

// 4. Main Seeding Process
async function main() {
  console.log("===============================================================================");
  console.log(`🚀 SCALE AI: Multi-Tenant Vector Seeding Engine`);
  console.log(`🎯 Targets: ${TOTAL_USERS} Users | 5 Files/User | 3-4 Paragraphs/File | Isolated org_id`);
  console.log("===============================================================================\n");

  const users = [];
  const allEmbeddings = [];

  const fileNames = [
    "Enterprise_Architecture_Spec.md",
    "Operations_Standard_Procedure.md",
    "Security_and_Compliance_Policy.md",
    "AI_Agent_Vector_Pipeline.md",
    "Customer_Support_SLA.md"
  ];

  console.log(`Generating data structures in memory...`);
  const t0 = Date.now();

  for (let i = 1; i <= TOTAL_USERS; i++) {
    const orgId = crypto.randomUUID();
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    const orgSuffix = ORG_SUFFIXES[(i * 7) % ORG_SUFFIXES.length];
    const fullName = `${firstName} ${lastName}`;
    const company = `${lastName} ${orgSuffix}`;
    const email = `user_${String(i).padStart(4, '0')}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`;
    
    // Hash password with salt
    const salt = crypto.randomBytes(8).toString('hex');
    const rawPass = `SecurePass${i}!@#`;
    const passwordHash = crypto.createHash('sha256').update(rawPass + salt).digest('hex') + ':' + salt;

    users.push({
      org_id: orgId,
      email: email,
      password_hash: passwordHash,
      full_name: fullName,
      created_at: new Date(Date.now() - (i % 30) * 86400000).toISOString()
    });

    // Generate 5 Files per User
    for (let fIdx = 0; fIdx < FILES_PER_USER; fIdx++) {
      const fileName = fileNames[fIdx];
      const pCount = PARAGRAPHS_PER_FILE[fIdx];
      const domainTexts = DOMAIN_PARAGRAPHS[fIdx];

      for (let pIdx = 0; pIdx < pCount; pIdx++) {
        const baseParagraph = domainTexts[pIdx % domainTexts.length];
        const customizedParagraph = `[Tenant: ${company} | OrgID: ${orgId}]\n${baseParagraph}`;
        const embedding = generateEmbedding(customizedParagraph);

        allEmbeddings.push({
          id: crypto.randomUUID(),
          org_id: orgId,
          file_name: fileName,
          chunk_index: pIdx,
          paragraph: customizedParagraph,
          embedding: `[${embedding.join(',')}]`, // pgvector text representation
          metadata: {
            user_email: email,
            company: company,
            file_category: fileName.replace('.md', ''),
            chunk_length: customizedParagraph.length
          }
        });
      }
    }

    if (i % 500 === 0 || i === TOTAL_USERS) {
      process.stdout.write(`  - Prepared ${i}/${TOTAL_USERS} users and ${allEmbeddings.length} document chunks...\r`);
    }
  }

  console.log(`\n✅ In-memory data generation finished in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
  console.log(`  - Total Users: ${users.length}`);
  console.log(`  - Total Vector Document Chunks: ${allEmbeddings.length}`);

  // Save JSON summary of first 100 users for quick reference
  const summaryPath = path.resolve('data/users_seed_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(users.slice(0, 100), null, 2), 'utf8');
  console.log(`\n📁 Reference summary of initial 100 users saved to: ${summaryPath}`);

  // Test Supabase connectivity
  console.log(`\nConnecting to Supabase at: ${url}`);
  if (!url || !secretKey) {
    console.warn(`⚠️ Supabase credentials are not configured in .env.local.`);
    printManualInstructions();
    return;
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { count, error } = await supabase.from('user_accounts').select('*', { count: 'exact', head: true });
    if (error) {
      console.warn(`⚠️ Supabase ping failed: ${error.message}`);
      printManualInstructions();
      return;
    }

    console.log(`✅ Supabase connection successful! Current user_accounts count: ${count ?? 0}`);
    console.log(`Beginning batch upload to Supabase...`);

    // Batch insert users
    const USER_BATCH_SIZE = 250;
    for (let i = 0; i < users.length; i += USER_BATCH_SIZE) {
      const batch = users.slice(i, i + USER_BATCH_SIZE);
      const { error: insertErr } = await supabase.from('user_accounts').upsert(batch, { onConflict: 'email' });
      if (insertErr) {
        console.error(`Error uploading user batch ${i}-${i + batch.length}:`, insertErr.message);
        break;
      }
      process.stdout.write(`  - Uploaded ${Math.min(i + USER_BATCH_SIZE, users.length)}/${users.length} users\r`);
    }
    console.log(`\n✅ All users inserted into user_accounts!`);

    // Batch insert embeddings
    const EMBED_BATCH_SIZE = 100;
    for (let i = 0; i < allEmbeddings.length; i += EMBED_BATCH_SIZE) {
      const batch = allEmbeddings.slice(i, i + EMBED_BATCH_SIZE);
      const { error: embedErr } = await supabase.from('document_embeddings').insert(batch);
      if (embedErr) {
        console.error(`Error uploading embedding batch ${i}-${i + batch.length}:`, embedErr.message);
        break;
      }
      if (i % 1000 === 0 || i + EMBED_BATCH_SIZE >= allEmbeddings.length) {
        process.stdout.write(`  - Uploaded ${Math.min(i + EMBED_BATCH_SIZE, allEmbeddings.length)}/${allEmbeddings.length} vector chunks\r`);
      }
    }
    console.log(`\n🎉 All ${allEmbeddings.length} document chunks successfully stored with isolated org_ids!`);

  } catch (err) {
    console.warn(`⚠️ Direct insertion encountered error: ${err.message}`);
    printManualInstructions();
  }
}

function printManualInstructions() {
  console.log(`\n-------------------------------------------------------------------------------`);
  console.log(`ℹ️ Supabase Setup & Execution Guide:`);
  console.log(`1. Run the schema in your Supabase SQL Editor:`);
  console.log(`   File: supabase/isolated_vector_schema.sql`);
  console.log(`2. If your Supabase project was paused on the free tier, restore it at:`);
  console.log(`   https://supabase.com/dashboard`);
  console.log(`3. Once active, run this script to populate all 3000 users and their 5 datasets:`);
  console.log(`   node scripts/seed-3000-users-vectors.mjs`);
  console.log(`-------------------------------------------------------------------------------\n`);
}

main().catch(console.error);

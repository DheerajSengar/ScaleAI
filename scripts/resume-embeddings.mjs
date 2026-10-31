import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const key = envVars.SUPABASE_SECRET_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const FILES_PER_USER = 5;
const PARAGRAPHS_PER_FILE = [3, 4, 3, 4, 3];

const DOMAIN_PARAGRAPHS = [
  [
    "The core enterprise data pipeline employs a microservices-based distributed architecture built on top of event streaming clusters. Every inbound payload is ingested through zero-trust API gateways with mutual TLS authentication, ensuring that sensitive transactional payloads are isolated before entering the downstream processing layer.",
    "System state transitions and event telemetry are propagated asynchronously through message queues with high durability guarantees. Worker nodes ingest and deserialize batch events, persisting immutable audit records in relational storage while dispatching vectorized document representations to localized index stores.",
    "Service resilience is reinforced through automated health probes, circuit breakers, and decoupled worker pools. If a downstream vector index experiences latency spikes, ingress queues buffer documents safely to guarantee zero message loss during peak workload spikes.",
    "Network topology enforces network segmentation between the presentation tier, business logic clusters, and persistence databases. Cross-zone replication provides multi-region redundancy and automatic failover in under thirty seconds."
  ],
  [
    "Standard operating procedures mandate continuous monitoring of operational telemetry across all service endpoints. Service Level Objectives (SLOs) require 99.95% system uptime, with automated alerting triggers wired directly to the on-call incident response matrix.",
    "Automated maintenance tasks execute daily during low-traffic windows to optimize database indexes, vacuum dead tuples, and recalculate vector index cluster centroids for optimal cosine retrieval speed.",
    "When a service degradation alert fires, runbook automation executes predefined diagnostic scripts, collecting heap snapshots, container thread dumps, and database connection metrics before paging senior site reliability engineers.",
    "Continuous deployment pipelines enforce automated regression testing, static security vulnerability scanning, and blue-green canary deployment steps prior to full production promotion."
  ],
  [
    "Data isolation is strictly maintained across all storage tiers through row-level security and tenant-specific encryption keys. Every database record is cryptographically bound to an organization identifier, preventing cross-tenant information exposure under all query conditions.",
    "Access management complies with the principle of least privilege, requiring multifactor authentication and role-based access control (RBAC). Session tokens are signed using asymmetric cryptographic algorithms with short lifespans and automated refresh validation.",
    "Audit logs capture every read, write, and retrieval operation with timestamped actor metadata. These audit trails are immutably archived into write-once-read-many (WORM) compliant storage for regulatory adherence.",
    "Periodic penetration testing and vulnerability assessments are conducted by certified third-party security auditors to validate API boundary defenses and vector similarity isolation boundaries."
  ],
  [
    "Document ingestion splits unstructured text payloads into semantically coherent chunk segments based on syntactic paragraph boundaries. Chunks are normalized, stripping extraneous whitespace while retaining contextual headings for enriched semantic grounding.",
    "Vector embeddings are generated for each discrete paragraph chunk using high-dimensional dense representations. These vectors capture syntactic nuances and domain terminology, enabling semantic search and similarity retrieval across vast corpora.",
    "Retrieval queries prioritize organizational boundaries by filtering on tenant org_id before computing cosine distance against indexed document vectors. This guarantees that multi-tenant vector searches return exclusively authorized context chunks.",
    "Re-ranking algorithms evaluate vector similarity thresholds alongside keyword frequency scores to synthesize precise context packages for generative language models, avoiding hallucination and context bleeding."
  ],
  [
    "Customer engagement workflows combine automated tier-1 conversational assistants with seamless live agent escalation paths. Inquiries that require human intervention are routed dynamically to active specialists based on skill matching and team load.",
    "Live chat sessions utilize authenticated session tokens and visitor hashes to preserve conversation continuity across browser restarts without compromising customer data confidentiality.",
    "Service agreements guarantee responsive issue turnaround times, categorizing incoming tickets by urgency, commercial impact, and contractual support tier levels.",
    "Post-resolution reviews analyze ticket transcripts and automated sentiment trajectories to identify systemic usability bottlenecks and inform upcoming platform feature enhancements."
  ]
];

const fileNames = [
  "Enterprise_Architecture_Spec.md",
  "Operations_Standard_Procedure.md",
  "Security_and_Compliance_Policy.md",
  "AI_Agent_Vector_Pipeline.md",
  "Customer_Support_SLA.md"
];

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

async function retryInsert(batch, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error } = await supabase.from('document_embeddings').insert(batch);
    if (!error) return true;
    console.warn(`\nBatch insert error (attempt ${attempt}/${retries}): ${error.message}`);
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, 2000 * attempt));
    } else {
      throw error;
    }
  }
}

async function main() {
  console.log("Fetching existing users from user_accounts...");
  let allUsers = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('org_id, email, full_name')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allUsers = allUsers.concat(data);
    page++;
  }
  console.log(`Loaded ${allUsers.length} total users.`);

  // Find org_ids that already have document_embeddings using pagination
  console.log("Checking which users already have documents...");
  let existingOrgs = [];
  let dPage = 0;
  while (true) {
    const { data: pageData, error: orgError } = await supabase
      .from('document_embeddings')
      .select('org_id')
      .range(dPage * 1000, (dPage + 1) * 1000 - 1);
    if (orgError) throw orgError;
    if (!pageData || pageData.length === 0) break;
    existingOrgs = existingOrgs.concat(pageData);
    dPage++;
  }

  const existingOrgSet = new Set(existingOrgs.map(r => r.org_id));
  console.log(`Found ${existingOrgSet.size} users with existing documents (${existingOrgs.length} chunks).`);

  const pendingUsers = allUsers.filter(u => !existingOrgSet.has(u.org_id));
  console.log(`Remaining users to populate: ${pendingUsers.length}`);

  if (pendingUsers.length === 0) {
    console.log("All users already have their document embeddings! Nothing to do.");
    return;
  }

  let uploadedUsers = 0;
  const totalUsersToUpload = pendingUsers.length;
  let chunkBuffer = [];
  let totalChunksUploaded = 0;
  const BATCH_SIZE = 100;

  console.log(`Uploading documents for ${totalUsersToUpload} users in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < pendingUsers.length; i++) {
    const user = pendingUsers[i];
    const orgId = user.org_id;

    for (let fIdx = 0; fIdx < FILES_PER_USER; fIdx++) {
      const fileName = fileNames[fIdx];
      const pCount = PARAGRAPHS_PER_FILE[fIdx];
      const domainTexts = DOMAIN_PARAGRAPHS[fIdx];

      for (let pIdx = 0; pIdx < pCount; pIdx++) {
        const baseParagraph = domainTexts[pIdx % domainTexts.length];
        const customizedParagraph = `[Tenant: ${user.full_name} | OrgID: ${orgId}]\n${baseParagraph}`;
        const embedding = generateEmbedding(customizedParagraph);

        chunkBuffer.push({
          id: crypto.randomUUID(),
          org_id: orgId,
          file_name: fileName,
          chunk_index: pIdx,
          paragraph: customizedParagraph,
          embedding: `[${embedding.join(',')}]`,
          metadata: {
            user_email: user.email,
            company: user.full_name,
            file_category: fileName.replace('.md', ''),
            chunk_length: customizedParagraph.length
          }
        });

        if (chunkBuffer.length >= BATCH_SIZE) {
          await retryInsert(chunkBuffer);
          totalChunksUploaded += chunkBuffer.length;
          chunkBuffer = [];
        }
      }
    }

    uploadedUsers++;
    if (uploadedUsers % 50 === 0 || uploadedUsers === totalUsersToUpload) {
      const pct = ((uploadedUsers / totalUsersToUpload) * 100).toFixed(1);
      process.stdout.write(`  - Seeded ${uploadedUsers}/${totalUsersToUpload} users (${totalChunksUploaded} chunks) [${pct}%]...\r`);
    }
  }

  if (chunkBuffer.length > 0) {
    await retryInsert(chunkBuffer);
    totalChunksUploaded += chunkBuffer.length;
  }

  console.log(`\n🎉 Completed uploading all remaining vector chunks! Total uploaded in this session: ${totalChunksUploaded}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

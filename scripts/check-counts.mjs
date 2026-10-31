import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const [u, d] = await Promise.all([
    supabase.from('user_accounts').select('*', { count: 'exact', head: true }),
    supabase.from('document_embeddings').select('*', { count: 'exact', head: true })
  ]);
  console.log('user_accounts count:', u.count);
  console.log('document_embeddings count:', d.count);
}

main().catch(console.error);

/**
 * Supabase Connection Test — fetch-only (no npm imports needed)
 * Run: node test-supabase-connection.mjs
 */

const SUPABASE_URL      = 'https://xjtgsmdjprmcaeopvwcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdGdzbWRqcHJtY2Flb3B2d2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3MTIzNjksImV4cCI6MjEwNDI4ODM2OX0.v8RijZnDm2oiAftgAS5vdEqWQgps6aYRvLzP_oBD0Oo';
const SUPABASE_SVC_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqdGdzbWRqcHJtY2Flb3B2d2NxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODcxMjM2OSwiZXhwIjoyMTA0Mjg4MzY5fQ.jjwxOkZIEQUOYxWadIrs_GC9wRPtxzYvL36HQ_XdH0k';

// Tables commonly used in the project
const TABLES = [
  'products', 'orders', 'categories', 'advance_orders',
  'inventory', 'inventory_movements', 'staff', 'users', 'barcode_registry',
];

const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', C = '\x1b[36m', B = '\x1b[1m', X = '\x1b[0m';
const pass = (m) => console.log(`  ${G}✔${X} ${m}`);
const fail = (m) => console.log(`  ${R}✘${X} ${m}`);
const info = (m) => console.log(`  ${C}ℹ${X} ${m}`);
const sec  = (t) => console.log(`\n${B}${Y}▶ ${t}${X}`);

async function restQuery(table, key, limit = 1) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}`;
  const res  = await fetch(url, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
  });
  const body = await res.json().catch(() => res.text());
  return { status: res.status, ok: res.ok, body };
}

async function main() {
  let passed = 0, failed = 0;
  console.log(`\n${B}══════════════════════════════════════════${X}`);
  console.log(`${B}     Supabase Connection Test Suite       ${X}`);
  console.log(`${B}══════════════════════════════════════════${X}`);

  // 1 ── Config validation ──────────────────────────────────────────────────
  sec('1. Configuration Validation');
  if (SUPABASE_URL.includes('.supabase.co')) {
    pass(`Project URL: ${SUPABASE_URL}`); passed++;
  } else {
    fail('URL looks invalid'); failed++;
  }
  if (SUPABASE_ANON_KEY.startsWith('eyJ')) {
    pass('Anon key format looks valid (JWT)'); passed++;
  } else {
    fail('Anon key missing or malformed'); failed++;
  }
  if (SUPABASE_SVC_KEY.startsWith('eyJ')) {
    pass('Service-role key format looks valid (JWT)'); passed++;
  } else {
    fail('Service-role key missing or malformed'); failed++;
  }

  // 2 ── Auth health ────────────────────────────────────────────────────────
  sec('2. Auth Endpoint Health');
  try {
    const res  = await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: SUPABASE_ANON_KEY } });
    const body = await res.text();
    if (res.ok) { pass(`Auth healthy — HTTP ${res.status}: ${body.trim()}`); passed++; }
    else        { fail(`Auth returned HTTP ${res.status}: ${body}`); failed++; }
  } catch (e) { fail(`Auth check error: ${e.message}`); failed++; }

  // 3 ── REST ping with anon key ────────────────────────────────────────────
  sec('3. REST API Ping (anon key)');
  try {
    const res  = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers: { apikey: SUPABASE_ANON_KEY } });
    const body = await res.text();
    // Supabase REST root returns 200 with OpenAPI spec
    if (res.status === 200) { pass(`REST root reachable — HTTP ${res.status}`); passed++; }
    else { info(`REST root returned HTTP ${res.status}: ${body.slice(0, 120)}`); }
  } catch (e) { fail(`REST ping error: ${e.message}`); failed++; }

  // 4 ── Table queries with anon key ────────────────────────────────────────
  sec('4. Table Access — Anon Key');
  let anonFound = false;
  for (const tbl of TABLES) {
    try {
      const { status, ok, body } = await restQuery(tbl, SUPABASE_ANON_KEY);
      if (ok && Array.isArray(body)) {
        pass(`"${tbl}" accessible — ${body.length} row(s) returned`); passed++;
        anonFound = true;
      } else if (status === 404 || (body?.code === '42P01') || body?.message?.includes('does not exist')) {
        info(`"${tbl}" — table not found`);
      } else if (status === 401 || status === 403 || body?.code === '42501' || body?.message?.includes('permission')) {
        info(`"${tbl}" — RLS blocked (HTTP ${status})`);
      } else {
        info(`"${tbl}" — HTTP ${status}: ${JSON.stringify(body).slice(0, 80)}`);
      }
    } catch (e) { info(`"${tbl}" — fetch error: ${e.message}`); }
  }
  if (!anonFound) info('No tables readable by anon key — this is normal if RLS is enforced.');

  // 5 ── Table queries with service-role key ────────────────────────────────
  sec('5. Table Access — Service-Role Key (bypasses RLS)');
  let svcFound = false;
  for (const tbl of TABLES) {
    try {
      const { status, ok, body } = await restQuery(tbl, SUPABASE_SVC_KEY);
      if (ok && Array.isArray(body)) {
        pass(`"${tbl}" accessible — ${body.length} row(s) returned`); passed++;
        svcFound = true;
        break; // one success is enough to confirm service-role works
      } else if (status === 404 || body?.code === '42P01') {
        info(`"${tbl}" — table not found`);
      } else {
        info(`"${tbl}" — HTTP ${status}: ${JSON.stringify(body).slice(0, 80)}`);
      }
    } catch (e) { info(`"${tbl}" — fetch error: ${e.message}`); }
  }
  if (!svcFound) {
    info('None of the common tables found via service-role key — tables may have different names.');
  }

  // 6 ── Storage buckets ────────────────────────────────────────────────────
  sec('6. Storage — Bucket List');
  try {
    const res  = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: { apikey: SUPABASE_SVC_KEY, Authorization: `Bearer ${SUPABASE_SVC_KEY}` },
    });
    const body = await res.json().catch(() => res.text());
    if (res.ok && Array.isArray(body)) {
      if (body.length > 0) { pass(`${body.length} bucket(s): ${body.map(b => b.name).join(', ')}`); }
      else                 { pass('Storage reachable — no buckets exist yet'); }
      passed++;
    } else {
      info(`Storage returned HTTP ${res.status}: ${JSON.stringify(body).slice(0, 120)}`);
    }
  } catch (e) { fail(`Storage error: ${e.message}`); failed++; }

  // 7 ── Realtime endpoint ──────────────────────────────────────────────────
  sec('7. Realtime Endpoint Reachability');
  try {
    const res = await fetch(`${SUPABASE_URL}/realtime/v1/api/tenants`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (res.status < 500) { pass(`Realtime endpoint reachable (HTTP ${res.status})`); passed++; }
    else { fail(`Realtime endpoint error HTTP ${res.status}`); failed++; }
  } catch (e) { fail(`Realtime error: ${e.message}`); failed++; }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${B}══════════════════════════════════════════${X}`);
  console.log(`  ${B}Results:${X} ${G}${passed} passed${X}  ${failed > 0 ? R : G}${failed} failed${X}`);
  console.log(`${B}══════════════════════════════════════════${X}\n`);
  if (failed === 0) console.log(`${G}${B}🎉 All checks passed! Supabase connection is healthy.${X}\n`);
}

main().catch(err => { console.error(`${R}Fatal:${X}`, err); process.exit(1); });

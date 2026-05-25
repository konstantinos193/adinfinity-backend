/**
 * API Test Script — tests all endpoints end-to-end
 * Usage: node test-api.js
 *
 * Prerequisites: server must be running (npm run dev)
 * If you don't have an admin account yet: node create-admin.js
 * Env vars: BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD
 */

const BASE_URL      = process.env.BASE_URL      || 'http://localhost:3001';
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL   || 'admin@test.com';
const ADMIN_PASSWORD= process.env.ADMIN_PASSWORD|| 'password123';

const C = {
  reset : '\x1b[0m',
  bold  : '\x1b[1m',
  green : '\x1b[32m',
  red   : '\x1b[31m',
  yellow: '\x1b[33m',
  cyan  : '\x1b[36m',
  gray  : '\x1b[90m',
  white : '\x1b[97m',
};

let passed = 0, failed = 0;
let token = null, createdId = null, createdSlug = null;
const timings = [];   // { label, status, ms, ok }
let suiteStart;

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function request(method, path, body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const t0 = performance.now();
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const ms  = Math.round(performance.now() - t0);

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, ms };
}

function msTag(ms) {
  const color = ms < 100 ? C.green : ms < 400 ? C.yellow : C.red;
  return `${color}${String(ms).padStart(4)}ms${C.reset}`;
}

// log a real endpoint (tracked in timings, shown with ms)
function log(label, status, data, ms, notes = '') {
  const ok   = status >= 200 && status < 300;
  const icon = ok ? `${C.green}✓` : `${C.red}✗`;
  const sc   = ok ? C.green : C.red;
  console.log(
    `  ${icon}${C.reset}  ${C.bold}${label.padEnd(46)}${C.reset}` +
    `${sc}${String(status).padStart(3)}${C.reset}  ${msTag(ms)}` +
    (notes ? `  ${C.gray}${notes}${C.reset}` : '')
  );
  if (!ok) {
    const body = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    console.log(`     ${C.gray}${body.slice(0, 300)}${C.reset}`);
  }
  if (ok) passed++; else failed++;
  timings.push({ label, status, ms, ok });
  return ok;
}

// log an assertion check (no timing — just pass/fail)
function check(label, pass, statusShown) {
  const icon = pass ? `${C.green}✓` : `${C.red}✗`;
  const sc   = pass ? C.green : C.red;
  console.log(
    `  ${icon}${C.reset}  ${label.padEnd(46)}` +
    `${sc}${String(statusShown).padStart(3)}${C.reset}`
  );
  if (pass) passed++; else failed++;
}

function section(name) {
  const bar = '─'.repeat(Math.max(0, 50 - name.length));
  console.log(`\n${C.cyan}${C.bold}── ${name} ${bar}${C.reset}`);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function testHealth() {
  section('Health');
  const r = await request('GET', '/health');
  // fall back — many NestJS apps don't mount a root route
  if (r.status === 404) {
    console.log(`  ${C.gray}–  No /health route — skipping${C.reset}`);
    return;
  }
  log('GET /health', r.status, r.data, r.ms);
}

async function testAuth() {
  section('Auth');

  let r = await request('POST', '/auth/login', { email: ADMIN_EMAIL, password: 'wrongpass' });
  check('POST /auth/login  (wrong password — expect 401)', r.status === 401, r.status);

  r = await request('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const ok = log('POST /auth/login', r.status, r.data, r.ms);
  if (ok && r.data?.access_token) {
    token = r.data.access_token;
    console.log(`     ${C.gray}Token acquired${C.reset}`);
  } else if (r.status === 401) {
    console.log(`\n  ${C.yellow}⚠  Login failed — run: node create-admin.js${C.reset}\n`);
  }

  r = await request('POST', '/auth/login', { email: 'not-an-email', password: '123' });
  check('POST /auth/login  (bad body — expect 400)', r.status === 400, r.status);
}

async function testAdminInvitations() {
  section('Admin Invitations (JWT-protected)');

  if (!token) {
    console.log(`  ${C.yellow}⚠  Skipping — no token${C.reset}`);
    return;
  }

  let r = await request('GET', '/admin/invitations');
  check('GET /admin/invitations  (no token — expect 401)', r.status === 401, r.status);

  r = await request('POST', '/admin/invitations', {
    slug: `test-wedding-${Date.now()}`,
    brideName: 'Maria', groomName: 'Nikos',
    weddingDate: '2026-09-15T16:00:00.000Z',
    story: 'We met at a coffee shop in Athens.',
    rsvpDeadline: '2026-08-01T00:00:00.000Z',
    invitationType: 'MINI_WEBSITE',
    events: [
      { type: 'CEREMONY',  name: 'Church Ceremony',   date: '2026-09-15T15:00:00.000Z', address: 'Agios Dimitrios, Athens' },
      { type: 'RECEPTION', name: 'Wedding Reception',  date: '2026-09-15T19:00:00.000Z', address: 'Grand Ballroom, Glyfada', mapsUrl: 'https://maps.google.com/?q=Glyfada' },
    ],
    contacts: [
      { role: 'BRIDE', name: 'Maria Papadopoulou', phone: '+306900000001' },
      { role: 'GROOM', name: 'Nikos Georgiou',     phone: '+306900000002' },
    ],
    giftRegistries: [
      { ownerName: 'Maria & Nikos', bankName: 'Alpha Bank', iban: 'GR1601101250000000012300695' },
    ],
  }, true);
  const createOk = log('POST /admin/invitations', r.status, r.data, r.ms);
  if (createOk) {
    createdId   = r.data?.id;
    createdSlug = r.data?.slug;
    console.log(`     ${C.gray}id=${createdId}  slug=${createdSlug}${C.reset}`);
  }

  if (createdSlug) {
    r = await request('POST', '/admin/invitations', {
      slug: createdSlug, brideName: 'X', groomName: 'Y', weddingDate: '2026-09-15T16:00:00.000Z',
    }, true);
    check('POST /admin/invitations  (dup slug — expect 4xx)', r.status >= 400, r.status);
  }

  r = await request('GET', '/admin/invitations', null, true);
  const listOk = log('GET /admin/invitations', r.status, r.data, r.ms);
  if (listOk) console.log(`     ${C.gray}${Array.isArray(r.data) ? r.data.length : '?'} invitation(s)${C.reset}`);

  if (createdId) {
    r = await request('GET', `/admin/invitations/${createdId}`, null, true);
    log('GET /admin/invitations/:id', r.status, r.data, r.ms, `id=${createdId}`);

    r = await request('GET', '/admin/invitations/nonexistent-id-000', null, true);
    check('GET /admin/invitations/:id  (bad id — expect 404)', r.status === 404, r.status);

    r = await request('PATCH', `/admin/invitations/${createdId}`, { story: 'Updated.', status: 'ACTIVE' }, true);
    log('PATCH /admin/invitations/:id', r.status, r.data, r.ms);

    r = await request('GET', `/admin/invitations/${createdId}/rsvps`, null, true);
    const rOk = log('GET /admin/invitations/:id/rsvps', r.status, r.data, r.ms);
    if (rOk) console.log(`     ${C.gray}${Array.isArray(r.data) ? r.data.length : '?'} rsvp(s) so far${C.reset}`);
  }
}

async function testPublicInvitations() {
  section('Public Invitations');

  let r = await request('GET', '/invitations/slug-that-does-not-exist-xyz');
  check('GET /invitations/:slug  (bad slug — expect 404)', r.status === 404, r.status);

  if (createdSlug) {
    r = await request('GET', `/invitations/${createdSlug}`);
    log('GET /invitations/:slug', r.status, r.data, r.ms, `slug=${createdSlug}`);
  } else {
    console.log(`  ${C.yellow}⚠  Skipping — no slug (create failed)${C.reset}`);
  }
}

async function testRsvp() {
  section('RSVP');

  if (!createdSlug) {
    console.log(`  ${C.yellow}⚠  Skipping — no slug${C.reset}`);
    return;
  }

  let r = await request('POST', `/invitations/${createdSlug}/rsvp`, {
    guestName: 'Giorgos Papadopoulos', phone: '+306900000099',
    attending: true, adultCount: 2, hasChildren: true, childCount: 1,
    dietary: 'VEGAN', hasAllergy: false, message: 'So excited!',
  });
  log('POST /invitations/:slug/rsvp  (attending)', r.status, r.data, r.ms);

  r = await request('POST', `/invitations/${createdSlug}/rsvp`, {
    guestName: 'Eleni Stavros', attending: false,
  });
  log('POST /invitations/:slug/rsvp  (not attending)', r.status, r.data, r.ms);

  r = await request('POST', `/invitations/${createdSlug}/rsvp`, { phone: '+306900000099' });
  check('POST /invitations/:slug/rsvp  (bad body — expect 400)', r.status === 400, r.status);

  r = await request('POST', '/invitations/no-such-slug-xyz/rsvp', { guestName: 'Ghost', attending: true });
  check('POST /invitations/:slug/rsvp  (bad slug — expect 404)', r.status === 404, r.status);

  if (token && createdId) {
    r = await request('GET', `/admin/invitations/${createdId}/rsvps`, null, true);
    const ok = log('GET /admin/invitations/:id/rsvps  (after rsvps)', r.status, r.data, r.ms);
    if (ok) console.log(`     ${C.gray}${Array.isArray(r.data) ? r.data.length : '?'} rsvp(s) recorded${C.reset}`);
  }
}

async function testCleanup() {
  section('Cleanup');

  if (!token || !createdId) {
    console.log(`  ${C.yellow}⚠  Skipping — nothing to delete${C.reset}`);
    return;
  }

  let r = await request('DELETE', `/admin/invitations/${createdId}`, null, true);
  log('DELETE /admin/invitations/:id', r.status, r.data, r.ms, `id=${createdId}`);

  r = await request('GET', `/admin/invitations/${createdId}`, null, true);
  check('GET /admin/invitations/:id  (after delete — expect 404)', r.status === 404, r.status);
}

// ─── Timing summary ──────────────────────────────────────────────────────────
function printTimingSummary() {
  if (!timings.length) return;

  const totalMs = Math.round(performance.now() - suiteStart);
  const sorted  = [...timings].sort((a, b) => b.ms - a.ms);
  const avg     = Math.round(timings.reduce((s, t) => s + t.ms, 0) / timings.length);
  const max     = sorted[0];
  const min     = sorted[sorted.length - 1];

  console.log(`\n${C.bold}${C.white}Timing breakdown (timed requests only)${C.reset}`);
  console.log(`${'─'.repeat(66)}`);
  console.log(
    `  ${'Endpoint'.padEnd(48)}` +
    `${'Status'.padStart(6)}` +
    `${'  ms'.padStart(8)}`
  );
  console.log(`${'─'.repeat(66)}`);
  for (const t of sorted) {
    const sc  = t.ok ? C.green : C.red;
    const label = t.label.length > 47 ? t.label.slice(0, 44) + '...' : t.label;
    console.log(
      `  ${label.padEnd(48)}` +
      `${sc}${String(t.status).padStart(6)}${C.reset}` +
      `  ${msTag(t.ms)}`
    );
  }
  console.log(`${'─'.repeat(66)}`);
  console.log(
    `  ${'Slowest:'.padEnd(12)}${C.bold}${max.label}${C.reset}  ${msTag(max.ms)}\n` +
    `  ${'Fastest:'.padEnd(12)}${C.bold}${min.label}${C.reset}  ${msTag(min.ms)}\n` +
    `  ${'Average:'.padEnd(12)}${msTag(avg)}\n` +
    `  ${'Total wall:'.padEnd(12)}${C.cyan}${totalMs}ms${C.reset}`
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  suiteStart = performance.now();

  console.log(`\n${C.bold}${C.cyan}Adifinity API Test Suite${C.reset}`);
  console.log(`${C.gray}Base URL : ${BASE_URL}${C.reset}`);
  console.log(`${C.gray}Admin    : ${ADMIN_EMAIL}${C.reset}`);

  try {
    await testHealth();
    await testAuth();
    await testAdminInvitations();
    await testPublicInvitations();
    await testRsvp();
    await testCleanup();
  } catch (err) {
    console.error(`\n${C.red}Fatal: ${err.message}${C.reset}`);
    console.error(err.stack);
  }

  printTimingSummary();

  const total    = passed + failed;
  const allGreen = failed === 0;
  console.log(`\n${'─'.repeat(66)}`);
  console.log(
    `${C.bold}Results: ${C.green}${passed} passed${C.reset}` +
    (failed > 0 ? `, ${C.red}${failed} failed${C.reset}` : '') +
    ` / ${total} total`
  );
  console.log(allGreen
    ? `${C.green}${C.bold}All tests passed!${C.reset}\n`
    : `${C.red}${C.bold}Some tests failed.${C.reset}\n`
  );

  process.exit(allGreen ? 0 : 1);
}

main();

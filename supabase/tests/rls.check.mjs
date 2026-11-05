/**
 * RLS check: calls the Supabase REST API as signed-out, regular and admin
 * users and verifies the policies in supabase/migrations behave as intended.
 *
 * STAGING ONLY. It creates throwaway users (with the service-role key) and
 * deletes them afterwards. It refuses to run against production.
 *
 * Usage:
 *   RLS_TEST_REF=<staging-ref> npm run test:rls
 *
 * Keys are fetched through the Supabase CLI (must be logged in), or supply
 * RLS_TEST_ANON_KEY and RLS_TEST_SERVICE_KEY yourself. Keys are never printed.
 */
import { execFileSync } from 'node:child_process';

// Projects this script must never touch.
const PRODUCTION_REFS = ['izogogrmawhnildegyug'];

const REF = process.env.RLS_TEST_REF;
if (!REF) {
  console.error('Set RLS_TEST_REF to the staging project ref.');
  process.exit(2);
}
if (PRODUCTION_REFS.includes(REF)) {
  console.error(`Refusing to run against production (${REF}).`);
  process.exit(2);
}
const URL = `https://${REF}.supabase.co`;

let anon = process.env.RLS_TEST_ANON_KEY;
let service = process.env.RLS_TEST_SERVICE_KEY;
if (!anon || !service) {
  const out = execFileSync(
    'supabase',
    ['projects', 'api-keys', `--remote=${REF}`, '-o', 'json'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  const keys = JSON.parse(out.slice(out.indexOf('[')));
  const find = (re) =>
    keys.find((k) => re.test(`${k.name ?? ''} ${k.type ?? ''} ${k.id ?? ''}`));
  anon = (find(/anon/i) ?? find(/publishable/i))?.api_key;
  service = (find(/service_role/i) ?? find(/secret/i))?.api_key;
}
if (!anon || !service) throw new Error('Could not obtain API keys');
console.log(`Running RLS checks against ${REF}`);

const stamp = Date.now();
const pw = `Test-${stamp}-pw!`;
const mk = (n) => `rls-${n}-${stamp}@example.com`;

async function api(
  path,
  { method = 'GET', key = anon, token, body, headers = {} } = {},
) {
  const res = await fetch(`${URL}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

async function createUser(n, app_metadata) {
  const r = await api('/auth/v1/admin/users', {
    method: 'POST',
    key: service,
    body: { email: mk(n), password: pw, email_confirm: true, app_metadata },
  });
  if (!r.json?.id) throw new Error(`create ${n}: ${JSON.stringify(r.json)}`);
  const s = await api('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email: mk(n), password: pw },
  });
  return { id: r.json.id, token: s.json.access_token };
}

const A = await createUser('a');
const B = await createUser('b');
const ADM = await createUser('admin', { role: 'admin' });

let pass = 0,
  fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + detail}`);
};
// A write that RLS blocks either errors (403) or affects 0 rows (200 + []).
const blocked = (r) =>
  r.status === 403 ||
  r.status === 401 ||
  (r.status < 300 && Array.isArray(r.json) && r.json.length === 0);
const allowed = (r) =>
  r.status < 300 && (!Array.isArray(r.json) || r.json.length > 0);

// --- Setup: A creates a recipe with an ingredient and equipment (as owner)
const equip = await api('/rest/v1/equipment', {
  method: 'POST',
  key: service,
  body: { name: `pan-${stamp}` },
});
const equipId = equip.json?.[0]?.id;
const rec = await api('/rest/v1/recipe', {
  method: 'POST',
  token: A.token,
  body: { name: 'A recipe', user_id: A.id },
});
check('A can insert own recipe', allowed(rec), JSON.stringify(rec));
const rid = rec.json?.[0]?.id;
const ing = await api('/rest/v1/recipe_ingredient', {
  method: 'POST',
  token: A.token,
  body: { recipe_id: rid, name: 'flour', position: 0 },
});
check(
  'A can insert ingredient on own recipe',
  allowed(ing),
  JSON.stringify(ing),
);
const iid = ing.json?.[0]?.id;
const re = await api('/rest/v1/recipe_equipment', {
  method: 'POST',
  token: A.token,
  body: { recipe_id: rid, equipment_id: equipId },
});
check('A can insert equipment on own recipe', allowed(re), JSON.stringify(re));

// --- Reads
const anonRead = await api(`/rest/v1/recipe?id=eq.${rid}`);
check(
  'Signed-out visitor can read recipes',
  allowed(anonRead),
  JSON.stringify(anonRead),
);
const anonIng = await api(`/rest/v1/recipe_ingredient?recipe_id=eq.${rid}`);
check(
  'Signed-out visitor can read ingredients',
  allowed(anonIng),
  JSON.stringify(anonIng),
);

// --- Signed-out writes
check(
  'Signed-out cannot insert recipe',
  !allowed(
    await api('/rest/v1/recipe', { method: 'POST', body: { name: 'x' } }),
  ),
);
check(
  'Signed-out cannot update recipe',
  blocked(
    await api(`/rest/v1/recipe?id=eq.${rid}`, {
      method: 'PATCH',
      body: { name: 'hacked' },
    }),
  ),
);
check(
  'Signed-out cannot delete recipe',
  blocked(await api(`/rest/v1/recipe?id=eq.${rid}`, { method: 'DELETE' })),
);

// --- B attacks A's data
check(
  'B cannot update A recipe',
  blocked(
    await api(`/rest/v1/recipe?id=eq.${rid}`, {
      method: 'PATCH',
      token: B.token,
      body: { name: 'hacked' },
    }),
  ),
);
check(
  'B cannot delete A recipe',
  blocked(
    await api(`/rest/v1/recipe?id=eq.${rid}`, {
      method: 'DELETE',
      token: B.token,
    }),
  ),
);
check(
  'B cannot reassign A recipe to self',
  blocked(
    await api(`/rest/v1/recipe?id=eq.${rid}`, {
      method: 'PATCH',
      token: B.token,
      body: { user_id: B.id },
    }),
  ),
);
check(
  'B cannot insert recipe as A',
  !allowed(
    await api('/rest/v1/recipe', {
      method: 'POST',
      token: B.token,
      body: { name: 'spoof', user_id: A.id },
    }),
  ),
);
check(
  'B cannot add ingredient to A recipe',
  !allowed(
    await api('/rest/v1/recipe_ingredient', {
      method: 'POST',
      token: B.token,
      body: { recipe_id: rid, name: 'poison', position: 1 },
    }),
  ),
);
check(
  'B cannot update A ingredient',
  blocked(
    await api(`/rest/v1/recipe_ingredient?id=eq.${iid}`, {
      method: 'PATCH',
      token: B.token,
      body: { name: 'hacked' },
    }),
  ),
);
check(
  'B cannot delete A ingredient',
  blocked(
    await api(`/rest/v1/recipe_ingredient?id=eq.${iid}`, {
      method: 'DELETE',
      token: B.token,
    }),
  ),
);
check(
  'B cannot add equipment to A recipe',
  !allowed(
    await api('/rest/v1/recipe_equipment', {
      method: 'POST',
      token: B.token,
      body: { recipe_id: rid, equipment_id: equipId },
    }),
  ),
);
check(
  'B cannot delete A equipment',
  blocked(
    await api(`/rest/v1/recipe_equipment?recipe_id=eq.${rid}`, {
      method: 'DELETE',
      token: B.token,
    }),
  ),
);

// --- Lookup tables: non-admin
check(
  'Regular user cannot add equipment',
  !allowed(
    await api('/rest/v1/equipment', {
      method: 'POST',
      token: A.token,
      body: { name: 'nope' },
    }),
  ),
);
check(
  'Regular user cannot add category',
  !allowed(
    await api('/rest/v1/category', {
      method: 'POST',
      token: A.token,
      body: { name: 'nope' },
    }),
  ),
);
check(
  'Regular user cannot add ingredient',
  !allowed(
    await api('/rest/v1/ingredient', {
      method: 'POST',
      token: A.token,
      body: { name: 'nope', category: 'x' },
    }),
  ),
);
check(
  'Regular user can read categories',
  (await api('/rest/v1/category', { token: A.token })).status === 200,
);

// --- Lookup tables: admin (the case that failed in production)
const ae = await api('/rest/v1/equipment', {
  method: 'POST',
  token: ADM.token,
  body: { name: `tart-${stamp}` },
});
check('Admin can add equipment', allowed(ae), JSON.stringify(ae));
const ac = await api('/rest/v1/category', {
  method: 'POST',
  token: ADM.token,
  body: { name: `cat-${stamp}` },
});
check('Admin can add category', allowed(ac), JSON.stringify(ac));
const cid = ac.json?.[0]?.id;
check(
  'Admin can update category',
  allowed(
    await api(`/rest/v1/category?id=eq.${cid}`, {
      method: 'PATCH',
      token: ADM.token,
      body: { name: `cat2-${stamp}` },
    }),
  ),
);
check(
  'Admin can delete category',
  allowed(
    await api(`/rest/v1/category?id=eq.${cid}`, {
      method: 'DELETE',
      token: ADM.token,
    }),
  ),
);
const ai = await api('/rest/v1/ingredient', {
  method: 'POST',
  token: ADM.token,
  body: { name: `ing-${stamp}`, category: 'x' },
});
check('Admin can add ingredient', allowed(ai), JSON.stringify(ai));

// --- Owner can edit; admin can edit and delete
check(
  'A can update own recipe',
  allowed(
    await api(`/rest/v1/recipe?id=eq.${rid}`, {
      method: 'PATCH',
      token: A.token,
      body: { name: 'A renamed' },
    }),
  ),
);
check(
  'A can update own ingredient',
  allowed(
    await api(`/rest/v1/recipe_ingredient?id=eq.${iid}`, {
      method: 'PATCH',
      token: A.token,
      body: { name: 'sugar' },
    }),
  ),
);
check(
  'A can delete own equipment row',
  allowed(
    await api(`/rest/v1/recipe_equipment?recipe_id=eq.${rid}`, {
      method: 'DELETE',
      token: A.token,
    }),
  ),
);
check(
  'Admin can update A recipe',
  allowed(
    await api(`/rest/v1/recipe?id=eq.${rid}`, {
      method: 'PATCH',
      token: ADM.token,
      body: { name: 'admin edit' },
    }),
  ),
);
check(
  'Admin can delete A recipe',
  allowed(
    await api(`/rest/v1/recipe?id=eq.${rid}`, {
      method: 'DELETE',
      token: ADM.token,
    }),
  ),
);

// --- Shopping list isolation (unchanged policies, sanity check)
const sl = await api('/rest/v1/shopping_list_item', {
  method: 'POST',
  token: A.token,
  body: { user_id: A.id, name: 'milk', purchased: false },
});
check('A can add own shopping item', allowed(sl), JSON.stringify(sl));
const slB = await api('/rest/v1/shopping_list_item', { token: B.token });
check(
  'B cannot see A shopping items',
  slB.status === 200 && slB.json.length === 0,
  JSON.stringify(slB),
);

// --- Cleanup: delete test users and leftover rows (staging only)
await api(`/rest/v1/shopping_list_item?user_id=eq.${A.id}`, {
  method: 'DELETE',
  key: service,
});
for (const u of [A, B, ADM])
  await api(`/auth/v1/admin/users/${u.id}`, { method: 'DELETE', key: service });
await api(`/rest/v1/equipment?name=like.*-${stamp}`, {
  method: 'DELETE',
  key: service,
});
await api(`/rest/v1/ingredient?name=eq.ing-${stamp}`, {
  method: 'DELETE',
  key: service,
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

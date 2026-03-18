const API_URL = process.env.API_URL || 'http://localhost:3000';
const BETTER_AUTH_URL = `${API_URL}/v1/better-auth`;

const SEED_EMAIL = process.env.SEED_USER_EMAIL || 'agent@novu.co';
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD || 'Agent123!@#';
const SEED_ORG_NAME = process.env.SEED_ORG_NAME || 'Agent Organization';
const SEED_USER_NAME = process.env.SEED_USER_NAME || 'Agent User';

const MAX_HEALTH_RETRIES = 30;
const HEALTH_RETRY_DELAY_MS = 2000;

async function waitForApi() {
  console.log(`Waiting for API at ${API_URL}...`);

  for (let i = 0; i < MAX_HEALTH_RETRIES; i++) {
    try {
      const res = await fetch(`${API_URL}/v1/health-check`);
      if (res.ok) {
        console.log('API is ready.');

        return;
      }
    } catch {
      // API not ready yet
    }

    await new Promise((r) => setTimeout(r, HEALTH_RETRY_DELAY_MS));
  }

  throw new Error(`API did not become ready within ${(MAX_HEALTH_RETRIES * HEALTH_RETRY_DELAY_MS) / 1000}s`);
}

function extractSessionToken(res) {
  const token = res.headers.get('set-auth-token');
  if (token) return token;

  const cookies = res.headers.getSetCookie?.() || [];
  for (const cookie of cookies) {
    const match = cookie.match(/better-auth\.session_token=([^;]+)/);
    if (match) return match[1];
  }

  return null;
}

async function signUp() {
  console.log(`Signing up user: ${SEED_EMAIL}`);

  const res = await fetch(`${BETTER_AUTH_URL}/api/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      name: SEED_USER_NAME,
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    if (body?.message?.includes('already') || body?.code === 'USER_ALREADY_EXISTS') {
      console.log('User already exists, signing in instead...');

      return signIn();
    }
    throw new Error(`Sign-up failed: ${JSON.stringify(body)}`);
  }

  const token = extractSessionToken(res) || body?.token;
  if (!token) throw new Error('No session token returned from sign-up');

  console.log('User created successfully.');

  return { token, user: body.user };
}

async function signIn() {
  const res = await fetch(`${BETTER_AUTH_URL}/api/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
    }),
  });

  const body = await res.json();

  if (!res.ok) throw new Error(`Sign-in failed: ${JSON.stringify(body)}`);

  const token = extractSessionToken(res) || body?.token;
  if (!token) throw new Error('No session token returned from sign-in');

  console.log('Signed in successfully.');

  return { token, user: body.user };
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function listOrganizations(token) {
  const res = await fetch(`${BETTER_AUTH_URL}/api/organization/list`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (!res.ok) return [];

  const body = await res.json();

  return body || [];
}

async function createOrganization(token) {
  console.log(`Creating organization: ${SEED_ORG_NAME}`);

  const existingOrgs = await listOrganizations(token);
  const existingOrg = existingOrgs.find?.((org) => org.name === SEED_ORG_NAME);

  if (existingOrg) {
    console.log(`Organization "${SEED_ORG_NAME}" already exists.`);

    return existingOrg;
  }

  const slug = SEED_ORG_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const res = await fetch(`${BETTER_AUTH_URL}/api/organization/create`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name: SEED_ORG_NAME, slug }),
  });

  const body = await res.json();

  if (!res.ok) throw new Error(`Create organization failed: ${JSON.stringify(body)}`);

  console.log('Organization created successfully.');

  return body;
}

async function setActiveOrganization(token, organizationId) {
  console.log('Setting active organization...');

  const res = await fetch(`${BETTER_AUTH_URL}/api/organization/set-active`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ organizationId }),
  });

  if (!res.ok) {
    const body = await res.json();
    throw new Error(`Set active organization failed: ${JSON.stringify(body)}`);
  }

  const updatedToken = extractSessionToken(res);

  console.log('Active organization set.');

  return updatedToken || token;
}

async function triggerNovuSync(token) {
  console.log('Triggering Novu entity sync...');

  const res = await fetch(`${API_URL}/v1/organizations/me`, {
    method: 'GET',
    headers: authHeaders(token),
  });

  if (res.ok) {
    console.log('Novu sync completed (internal user, org, and environments created).');
  } else {
    const body = await res.text();
    console.warn(`Novu sync request returned ${res.status}: ${body}`);
    console.warn('The sync will happen automatically on first dashboard login.');
  }
}

async function main() {
  try {
    await waitForApi();

    const { token } = await signUp();
    const org = await createOrganization(token);

    const orgId = org.id || org._id;
    const updatedToken = await setActiveOrganization(token, orgId);

    await triggerNovuSync(updatedToken);

    console.log('\n========================================');
    console.log('  Agent environment seeded successfully');
    console.log('========================================');
    console.log(`  Email:        ${SEED_EMAIL}`);
    console.log(`  Password:     ${SEED_PASSWORD}`);
    console.log(`  Organization: ${SEED_ORG_NAME}`);
    console.log(`  Dashboard:    http://localhost:4201`);
    console.log('========================================\n');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

main();

const bcrypt = require('bcryptjs');
const { makeSupabaseClient } = require('./helpers/mockSupabase');

jest.mock('../lib/supabaseAdmin', () => ({
  getSupabaseAdmin: jest.fn(),
}));

const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const { POST } = require('../app/api/register/route');

// Route handlers take a Request-like object and only ever call
// `.json()` on it in this route, so a minimal stub is enough — no
// need to construct a real Next.js/Fetch Request.
function makeRequest(body) {
  return { json: async () => body };
}

// A fully valid payload — individual tests override just the field(s)
// they're exercising, so a change to one field never breaks unrelated
// tests the way copy-pasted partial payloads would.
const VALID = {
  name: 'Alice',
  username: 'validuser',
  password: 'password1',
  phone: '+91 98765 43210',
  school: 'Kendriya Vidyalaya',
};

// Both the "does this username already exist" probes (students +
// admins tables) resolve with { data: null } by default, which is
// the "no conflict" case. Override per table as needed.
function noConflictClient(overrides = {}) {
  return makeSupabaseClient({
    students: { data: null, error: null },
    admins: { data: null, error: null },
    ...overrides,
  });
}

describe('POST /api/register - required fields', () => {
  it('rejects an unparseable body', async () => {
    const res = await POST({ json: async () => { throw new Error('bad json'); } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid request body/i);
  });

  it.each(['name', 'username', 'password', 'phone', 'school'])('rejects when %s is missing', async (field) => {
    const payload = { ...VALID };
    delete payload[field];
    const res = await POST(makeRequest(payload));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/required/i);
  });

  it('rejects when name is only whitespace', async () => {
    const res = await POST(makeRequest({ ...VALID, name: '   ' }));
    expect(res.status).toBe(400);
  });

  it('rejects when phone is only whitespace', async () => {
    const res = await POST(makeRequest({ ...VALID, phone: '   ' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/required/i);
  });

  it('rejects when school is only whitespace', async () => {
    const res = await POST(makeRequest({ ...VALID, school: '   ' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/required/i);
  });
});

describe('POST /api/register - username format', () => {
  it('rejects usernames shorter than 3 characters', async () => {
    const res = await POST(makeRequest({ ...VALID, username: 'ab' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/3-20 characters/i);
  });

  it('rejects usernames longer than 20 characters', async () => {
    const res = await POST(makeRequest({ ...VALID, username: 'a'.repeat(21) }));
    expect(res.status).toBe(400);
  });

  it('rejects usernames with spaces', async () => {
    const res = await POST(makeRequest({ ...VALID, username: 'alice 123' }));
    expect(res.status).toBe(400);
  });

  it('rejects usernames with symbols outside dot/underscore', async () => {
    const res = await POST(makeRequest({ ...VALID, username: 'alice@123' }));
    expect(res.status).toBe(400);
  });

  it('accepts usernames with dots and underscores', async () => {
    getSupabaseAdmin.mockReturnValue(noConflictClient({
      students: [
        { data: null, error: null }, // duplicate-check probe
        { data: { id: 's1', username: 'a.b_c', name: 'Alice', created_at: '2026-01-01' }, error: null }, // insert
      ],
    }));
    const res = await POST(makeRequest({ ...VALID, username: 'a.b_c' }));
    expect(res.status).toBe(201);
  });

  it('normalizes uppercase usernames to lowercase rather than rejecting them', async () => {
    getSupabaseAdmin.mockReturnValue(noConflictClient({
      students: [
        { data: null, error: null },
        { data: { id: 's1', username: 'alice123', name: 'Alice', created_at: '2026-01-01' }, error: null },
      ],
    }));
    const res = await POST(makeRequest({ ...VALID, username: 'Alice123' }));
    expect(res.status).toBe(201);
    expect((await res.json()).student.username).toBe('alice123');
  });

  it('rejects the reserved username "admin"', async () => {
    const res = await POST(makeRequest({ ...VALID, name: 'Sneaky', username: 'admin' }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/reserved/i);
  });

  it('treats the reserved-username check as case-insensitive (username is lowercased first)', async () => {
    const res = await POST(makeRequest({ ...VALID, name: 'Sneaky', username: 'ADMIN' }));
    expect(res.status).toBe(409);
  });

  it('checks username format before password length (username error wins)', async () => {
    const res = await POST(makeRequest({ ...VALID, username: 'ab', password: '1' }));
    const body = await res.json();
    expect(body.error).toMatch(/3-20 characters/i);
  });
});

describe('POST /api/register - password', () => {
  it('rejects passwords shorter than 6 characters', async () => {
    const res = await POST(makeRequest({ ...VALID, password: '12345' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/at least 6 characters/i);
  });

  it('checks password length before phone format (password error wins)', async () => {
    const res = await POST(makeRequest({ ...VALID, password: '123', phone: 'not-a-phone' }));
    const body = await res.json();
    expect(body.error).toMatch(/at least 6 characters/i);
  });
});

describe('POST /api/register - phone format', () => {
  it('rejects letters in the phone field', async () => {
    const res = await POST(makeRequest({ ...VALID, phone: 'call-me-maybe' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/valid phone number/i);
  });

  it('rejects phone numbers shorter than 7 characters', async () => {
    const res = await POST(makeRequest({ ...VALID, phone: '12345' }));
    expect(res.status).toBe(400);
  });

  it('rejects phone numbers longer than 20 characters', async () => {
    const res = await POST(makeRequest({ ...VALID, phone: '1'.repeat(21) }));
    expect(res.status).toBe(400);
  });

  it('accepts digits, spaces, +, (), and - for country-code formatting', async () => {
    getSupabaseAdmin.mockReturnValue(noConflictClient({
      students: [
        { data: null, error: null },
        { data: { id: 's1', username: 'validuser', name: 'Alice', phone: '+1 (555) 123-4567', created_at: '2026-01-01' }, error: null },
      ],
    }));
    const res = await POST(makeRequest({ ...VALID, phone: '+1 (555) 123-4567' }));
    expect(res.status).toBe(201);
  });
});

describe('POST /api/register - school', () => {
  it('rejects school names longer than 200 characters', async () => {
    const res = await POST(makeRequest({ ...VALID, school: 'A'.repeat(201) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/too long/i);
  });

  it('accepts a school name at exactly 200 characters', async () => {
    getSupabaseAdmin.mockReturnValue(noConflictClient({
      students: [
        { data: null, error: null },
        { data: { id: 's1', username: 'validuser', name: 'Alice', created_at: '2026-01-01' }, error: null },
      ],
    }));
    const res = await POST(makeRequest({ ...VALID, school: 'A'.repeat(200) }));
    expect(res.status).toBe(201);
  });
});

describe('POST /api/register - username collisions', () => {
  it('rejects when the username already exists in the students table', async () => {
    getSupabaseAdmin.mockReturnValue(noConflictClient({
      students: { data: { id: 'existing' }, error: null },
    }));
    const res = await POST(makeRequest({ ...VALID, username: 'taken' }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already taken/i);
  });

  it('rejects when the username already exists in the admins table', async () => {
    getSupabaseAdmin.mockReturnValue(noConflictClient({
      admins: { data: { id: 'existing-admin' }, error: null },
    }));
    const res = await POST(makeRequest({ ...VALID, username: 'rootish' }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/already taken/i);
  });

  it('checks both the students and admins tables', async () => {
    const client = noConflictClient({
      students: [
        { data: null, error: null },
        { data: { id: 's1', username: 'fresh', name: 'Alice', created_at: '2026-01-01' }, error: null },
      ],
    });
    getSupabaseAdmin.mockReturnValue(client);

    await POST(makeRequest({ ...VALID, username: 'fresh' }));

    expect(client.from).toHaveBeenCalledWith('students');
    expect(client.from).toHaveBeenCalledWith('admins');
  });
});

describe('POST /api/register - successful creation', () => {
  it('creates the student with self_registered: true, trimmed fields, and a hashed password', async () => {
    const client = noConflictClient({
      students: [
        { data: null, error: null }, // duplicate-check probe
        { data: { id: 's1', username: 'brandnew', name: 'Brand New', phone: '9876543210', school: 'ABC School', created_at: '2026-01-01' }, error: null }, // insert result
      ],
    });
    getSupabaseAdmin.mockReturnValue(client);

    const res = await POST(makeRequest({
      name: '  Brand New  ',
      username: '  BrandNew  ',
      password: 'password1',
      phone: '  9876543210  ',
      school: '  ABC School  ',
    }));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.student).toEqual({ id: 's1', username: 'brandnew', name: 'Brand New', phone: '9876543210', school: 'ABC School', created_at: '2026-01-01' });

    // Find the .insert() call recorded on the students chain and check its payload.
    const insertCall = client.from.mock.results
      .filter((_, i) => client.from.mock.calls[i][0] === 'students')
      .map((r) => r.value.insert.mock.calls)
      .find((calls) => calls.length > 0);
    expect(insertCall).toBeDefined();
    const insertPayload = insertCall[0][0];

    expect(insertPayload.name).toBe('Brand New'); // trimmed
    expect(insertPayload.username).toBe('brandnew'); // trimmed + lowercased
    expect(insertPayload.phone).toBe('9876543210'); // trimmed
    expect(insertPayload.school).toBe('ABC School'); // trimmed
    expect(insertPayload.self_registered).toBe(true);
    expect(insertPayload.password_hash).not.toBe('password1');
    await expect(bcrypt.compare('password1', insertPayload.password_hash)).resolves.toBe(true);
  });

  it('never returns the password hash to the caller', async () => {
    getSupabaseAdmin.mockReturnValue(noConflictClient({
      students: [
        { data: null, error: null },
        { data: { id: 's1', username: 'safe', name: 'Safe', created_at: '2026-01-01' }, error: null },
      ],
    }));
    const res = await POST(makeRequest({ ...VALID, username: 'safe' }));
    const body = await res.json();
    expect(body.student.password_hash).toBeUndefined();
  });

  it('returns a 500 with the db error message when the insert fails', async () => {
    getSupabaseAdmin.mockReturnValue(noConflictClient({
      students: [
        { data: null, error: null },
        { data: null, error: { message: 'insert failed: unique violation' } },
      ],
    }));
    const res = await POST(makeRequest({ ...VALID, username: 'raceduser' }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/insert failed/i);
  });
});

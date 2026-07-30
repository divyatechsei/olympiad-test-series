const bcrypt = require('bcryptjs');
const { makeSupabaseClient } = require('./helpers/mockSupabase');

jest.mock('../lib/supabaseAdmin', () => ({
  getSupabaseAdmin: jest.fn(),
}));

const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const { authOptions } = require('../lib/authOptions');

// NOTE: in the installed next-auth version, CredentialsProvider(options)
// returns a provider object whose top-level `.authorize` is a hardcoded
// no-op (`() => null`); the function we actually configured is preserved
// at `.options.authorize`, which is what next-auth's internals read from
// at request time.
const authorize = authOptions.providers[0].options.authorize;

describe('authOptions - basic config', () => {
  it('uses JWT session strategy', () => {
    expect(authOptions.session.strategy).toBe('jwt');
  });

  it('points the sign-in page at /login', () => {
    expect(authOptions.pages.signIn).toBe('/login');
  });

  it('exposes exactly one credentials provider', () => {
    expect(authOptions.providers).toHaveLength(1);
    expect(typeof authorize).toBe('function');
  });
});

describe('authOptions.authorize', () => {
  it('returns null when username is missing', async () => {
    await expect(authorize({ password: 'pw', role: 'student' })).resolves.toBeNull();
  });

  it('returns null when password is missing', async () => {
    await expect(authorize({ username: 'alice', role: 'student' })).resolves.toBeNull();
  });

  it('returns null when credentials are entirely absent', async () => {
    await expect(authorize(undefined)).resolves.toBeNull();
  });

  it('looks up the student in the "students" table for a non-admin role', async () => {
    const hash = await bcrypt.hash('correct-horse', 10);
    const client = makeSupabaseClient({
      students: { data: { id: 's1', username: 'alice', name: 'Alice', password_hash: hash }, error: null },
    });
    getSupabaseAdmin.mockReturnValue(client);

    const user = await authorize({ username: 'alice', password: 'correct-horse', role: 'student' });

    expect(client.from).toHaveBeenCalledWith('students');
    expect(user).toEqual({ id: 's1', username: 'alice', name: 'Alice', role: 'student', selfRegistered: false });
  });

  it('looks up the admin in the "admins" table when role is "admin"', async () => {
    const hash = await bcrypt.hash('admin-pass', 10);
    const client = makeSupabaseClient({
      admins: { data: { id: 'a1', username: 'root', name: 'Root Admin', password_hash: hash }, error: null },
    });
    getSupabaseAdmin.mockReturnValue(client);

    const user = await authorize({ username: 'root', password: 'admin-pass', role: 'admin' });

    expect(client.from).toHaveBeenCalledWith('admins');
    expect(user.role).toBe('admin');
  });

  it('treats any non-"admin" role value as "student"', async () => {
    const hash = await bcrypt.hash('pw', 10);
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      students: { data: { id: 's1', username: 'bob', name: 'Bob', password_hash: hash }, error: null },
    }));

    const user = await authorize({ username: 'bob', password: 'pw', role: 'totally-not-admin' });
    expect(user.role).toBe('student');
  });

  it('lowercases and trims the username before lookup', async () => {
    const hash = await bcrypt.hash('pw', 10);
    const client = makeSupabaseClient({
      students: { data: { id: 's1', username: 'carol', name: 'Carol', password_hash: hash }, error: null },
    });
    getSupabaseAdmin.mockReturnValue(client);

    await authorize({ username: '  CAROL  ', password: 'pw', role: 'student' });

    // The mock chain returned by from('students') records every .eq() call.
    const studentsCallIndex = client.from.mock.calls.findIndex((args) => args[0] === 'students');
    const studentsChain = client.from.mock.results[studentsCallIndex].value;
    expect(studentsChain.eq.mock.calls).toContainEqual(['username', 'carol']);
  });

  it('returns null when no account matches the username', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      students: { data: null, error: { message: 'not found' } },
    }));
    await expect(authorize({ username: 'ghost', password: 'pw', role: 'student' })).resolves.toBeNull();
  });

  it('returns null when the account row is null even without an error', async () => {
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      students: { data: null, error: null },
    }));
    await expect(authorize({ username: 'ghost', password: 'pw', role: 'student' })).resolves.toBeNull();
  });

  it('returns null when the password does not match the stored hash', async () => {
    const hash = await bcrypt.hash('the-real-password', 10);
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      students: { data: { id: 's1', username: 'dave', name: 'Dave', password_hash: hash }, error: null },
    }));

    const user = await authorize({ username: 'dave', password: 'wrong-guess', role: 'student' });
    expect(user).toBeNull();
  });
});

describe('authOptions.authorize - selfRegistered flag', () => {
  it('reflects self_registered: true from the student row', async () => {
    const hash = await bcrypt.hash('pw', 10);
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      students: { data: { id: 's1', username: 'newkid', name: 'New Kid', password_hash: hash, self_registered: true }, error: null },
    }));

    const user = await authorize({ username: 'newkid', password: 'pw', role: 'student' });
    expect(user.selfRegistered).toBe(true);
  });

  it('reflects self_registered: false from the student row', async () => {
    const hash = await bcrypt.hash('pw', 10);
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      students: { data: { id: 's1', username: 'oldkid', name: 'Old Kid', password_hash: hash, self_registered: false }, error: null },
    }));

    const user = await authorize({ username: 'oldkid', password: 'pw', role: 'student' });
    expect(user.selfRegistered).toBe(false);
  });

  it('defaults to false when the student row has no self_registered column value (legacy rows)', async () => {
    const hash = await bcrypt.hash('pw', 10);
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      students: { data: { id: 's1', username: 'legacy', name: 'Legacy Student', password_hash: hash }, error: null },
    }));

    const user = await authorize({ username: 'legacy', password: 'pw', role: 'student' });
    expect(user.selfRegistered).toBe(false);
  });

  it('is always false for admins, even if an admin row somehow had self_registered: true', async () => {
    const hash = await bcrypt.hash('pw', 10);
    getSupabaseAdmin.mockReturnValue(makeSupabaseClient({
      admins: { data: { id: 'a1', username: 'root', name: 'Root', password_hash: hash, self_registered: true }, error: null },
    }));

    const user = await authorize({ username: 'root', password: 'pw', role: 'admin' });
    expect(user.selfRegistered).toBe(false);
  });
});

describe('authOptions.callbacks.jwt', () => {
  it('copies user fields onto the token on initial sign-in', async () => {
    const token = await authOptions.callbacks.jwt({
      token: {},
      user: { id: 'u1', username: 'eve', name: 'Eve', role: 'student' },
    });
    expect(token).toEqual({ id: 'u1', username: 'eve', name: 'Eve', role: 'student' });
  });

  it('leaves an existing token untouched on subsequent calls (no user object)', async () => {
    const existingToken = { id: 'u1', username: 'eve', name: 'Eve', role: 'student', extra: 'keep-me' };
    const token = await authOptions.callbacks.jwt({ token: existingToken, user: undefined });
    expect(token).toBe(existingToken);
    expect(token.extra).toBe('keep-me');
  });

  it('copies selfRegistered onto the token on initial sign-in', async () => {
    const token = await authOptions.callbacks.jwt({
      token: {},
      user: { id: 'u1', username: 'newkid', name: 'New Kid', role: 'student', selfRegistered: true },
    });
    expect(token.selfRegistered).toBe(true);
  });
});

describe('authOptions.callbacks.session', () => {
  it('copies token fields onto session.user', async () => {
    const session = { user: {} };
    const token = { id: 'u1', username: 'eve', name: 'Eve', role: 'admin' };

    const result = await authOptions.callbacks.session({ session, token });

    expect(result.user).toEqual({ id: 'u1', username: 'eve', name: 'Eve', role: 'admin', selfRegistered: undefined });
  });

  it('copies selfRegistered onto session.user', async () => {
    const session = { user: {} };
    const token = { id: 'u1', username: 'newkid', name: 'New Kid', role: 'student', selfRegistered: true };

    const result = await authOptions.callbacks.session({ session, token });

    expect(result.user.selfRegistered).toBe(true);
  });
});

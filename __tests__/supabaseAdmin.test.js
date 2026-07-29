jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ mockClient: true })),
}));

const { createClient } = require('@supabase/supabase-js');
const { getSupabaseAdmin } = require('../lib/supabaseAdmin');

describe('getSupabaseAdmin', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    createClient.mockClear();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('throws when SUPABASE_URL is missing', () => {
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    expect(() => getSupabaseAdmin()).toThrow(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  });

  it('throws when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => getSupabaseAdmin()).toThrow(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  });

  it('throws when both are missing', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => getSupabaseAdmin()).toThrow();
  });

  it('creates a client with the service-role key and disabled session persistence', () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';

    const client = getSupabaseAdmin();

    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-key',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    expect(client).toEqual({ mockClient: true });
  });
});

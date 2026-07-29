import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from './supabaseAdmin';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }, // 'admin' | 'student', chosen by the login form's tab
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const supabase = getSupabaseAdmin();
        const table = credentials.role === 'admin' ? 'admins' : 'students';
        const uname = credentials.username.trim().toLowerCase();

        const { data: account, error } = await supabase
          .from(table)
          .select('*')
          .eq('username', uname)
          .single();

        if (error || !account) return null;

        const valid = await bcrypt.compare(credentials.password, account.password_hash);
        if (!valid) return null;

        return {
          id: account.id,
          username: account.username,
          name: account.name,
          role: credentials.role === 'admin' ? 'admin' : 'student',
          // Only meaningful for students — see migration_006. Drives
          // whether the catalog route honors global unlocks for this
          // account or requires a personal grant for everything.
          selfRegistered: credentials.role === 'admin' ? false : !!account.self_registered,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.name = user.name;
        token.selfRegistered = user.selfRegistered;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.user.name = token.name;
      session.user.selfRegistered = token.selfRegistered;
      return session;
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

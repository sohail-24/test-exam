import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-secret',
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        // 1. Check Super Admin credentials
        const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || 'admin@lopytech.com').toLowerCase();
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'LopyAdmin@2026';

        if (email === superAdminEmail && password === superAdminPassword) {
          return {
            id: 'super-admin',
            email: superAdminEmail,
            name: 'Super Admin',
            role: 'SUPER_ADMIN' as Role,
            tenantId: null,
            orgName: 'LopyTech Master',
            slug: null,
          };
        }

        // 2. Check Client (Tenant Admin) or Student credentials from database
        const dbUser = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        });

        if (!dbUser) {
          throw new Error('ACCOUNT_NOT_FOUND');
        }

        // Check password match (plain text or fallback)
        if (dbUser.password && dbUser.password !== password) {
          throw new Error('Invalid email or password.');
        }

        // Check tenant active status for client admins
        if (dbUser.tenant && !dbUser.tenant.isActive) {
          throw new Error('Your portal is currently deactivated. Please contact support.');
        }

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || dbUser.tenant?.name || 'Portal Admin',
          role: dbUser.role,
          tenantId: dbUser.tenantId,
          orgName: dbUser.tenant?.name || 'Organization',
          slug: dbUser.tenant?.slug || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          role?: Role;
          tenantId?: string | null;
          orgName?: string | null;
          slug?: string | null;
        };
        token.role = u.role;
        token.tenantId = u.tenantId;
        token.orgName = u.orgName;
        token.slug = u.slug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = (token.role as Role) ?? 'TENANT_ADMIN';
        session.user.tenantId = (token.tenantId as string | null) ?? null;
        session.user.orgName = (token.orgName as string | null) ?? null;
        session.user.kycComplete = true;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
};

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      tenantId: string | null;
      orgName?: string | null;
      kycComplete: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    tenantId?: string | null;
    orgName?: string | null;
    slug?: string | null;
  }
}

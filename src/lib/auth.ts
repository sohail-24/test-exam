import crypto from 'crypto';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import {
  getGoogleOAuthConfig,
  getNextAuthSecret,
  getSuperAdminConfig,
  validateServerEnv,
} from '@/lib/env';

validateServerEnv();

const googleOAuthConfig = getGoogleOAuthConfig();

function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

type HttpsCookieOptions = NonNullable<NextAuthOptions['cookies']>['sessionToken'] extends
  | { options?: infer O }
  | undefined
  ? O & { partitioned?: boolean }
  : never;

function buildHttpsCookieOptions(): HttpsCookieOptions {
  return {
    httpOnly: true,
    sameSite: 'none',
    path: '/',
    secure: true,
    partitioned: true,
  };
}

export function getAuthOptions(isHttps = false): NextAuthOptions {
  const httpsCookieOptions = buildHttpsCookieOptions();

  return {
    adapter: PrismaAdapter(prisma),
    secret: getNextAuthSecret(),
    cookies: isHttps
      ? {
          sessionToken: {
            name: 'next-auth.session-token',
            options: httpsCookieOptions,
          },
          callbackUrl: {
            name: 'next-auth.callback-url',
            options: httpsCookieOptions,
          },
          csrfToken: {
            name: 'next-auth.csrf-token',
            options: httpsCookieOptions,
          },
        }
      : undefined,
    providers: [
    ...(googleOAuthConfig
      ? [
          GoogleProvider({
            clientId: googleOAuthConfig.clientId,
            clientSecret: googleOAuthConfig.clientSecret,
          }),
        ]
      : []),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        portal: { label: 'Portal', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;
        const superAdminConfig = getSuperAdminConfig();

        // 1. Dedicated Super Master login portal flow (never falls back to DB users)
        if (credentials.portal === 'super-master' || credentials.portal === 'super-admin') {
          if (!superAdminConfig) {
            throw new Error(
              'Super Master authentication is not configured. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in your environment.',
            );
          }

          if (
            safeCompare(email, superAdminConfig.email) &&
            safeCompare(password, superAdminConfig.password)
          ) {
            return {
              id: 'super-admin',
              email: superAdminConfig.email,
              name: 'Super Master',
              role: 'SUPER_ADMIN' as Role,
              tenantId: null,
              orgName: 'LopyTech Master',
              slug: null,
            };
          }

          throw new Error('Invalid Super Master credentials.');
        }

        // 2. Check Super Master credentials when signing in via unified /login
        if (superAdminConfig && safeCompare(email, superAdminConfig.email)) {
          if (safeCompare(password, superAdminConfig.password)) {
            return {
              id: 'super-admin',
              email: superAdminConfig.email,
              name: 'Super Master',
              role: 'SUPER_ADMIN' as Role,
              tenantId: null,
              orgName: 'LopyTech Master',
              slug: null,
            };
          }
          throw new Error('Invalid email or password.');
        }

        // 3. Check Client (Tenant Admin) or Student credentials from database
        const dbUser = await prisma.user.findUnique({
          where: { email },
          include: { tenant: true },
        });

        if (!dbUser) {
          throw new Error('ACCOUNT_NOT_FOUND');
        }

        // Super Master credentials must come exclusively from environment variables, never DB
        if (dbUser.role === 'SUPER_ADMIN') {
          throw new Error('Invalid email or password.');
        }

        // Reject missing stored passwords instead of bypassing verification
        if (!dbUser.password || dbUser.password !== password) {
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
          kycComplete: dbUser.kycComplete,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: Role;
          tenantId?: string | null;
          orgName?: string | null;
          slug?: string | null;
          kycComplete?: boolean;
        };
        token.id = u.id ?? token.sub;
        token.role = u.role ?? 'STUDENT';
        token.tenantId = u.tenantId ?? null;
        token.orgName = u.orgName ?? null;
        token.slug = u.slug ?? null;
        token.kycComplete = u.kycComplete ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? session.user.id;
        session.user.role = (token.role as Role) ?? 'STUDENT';
        session.user.tenantId = (token.tenantId as string | null) ?? null;
        session.user.orgName = (token.orgName as string | null) ?? null;
        session.user.kycComplete = Boolean(token.kycComplete);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
    pages: {
      signIn: '/login',
      error: '/login',
    },
    session: { strategy: 'jwt' },
  };
}

export const authOptions: NextAuthOptions = getAuthOptions(
  process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
);

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

import crypto from 'crypto';
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import {
  getEffectiveNextAuthUrl,
  getGoogleOAuthConfig,
  getNextAuthSecret,
  getSuperAdminConfig,
  validateServerEnv,
} from '@/lib/env';

validateServerEnv();

const effectiveNextAuthUrl = getEffectiveNextAuthUrl();
const useSecureCookies = effectiveNextAuthUrl?.startsWith('https://') ?? false;
const googleOAuthConfig = getGoogleOAuthConfig();

function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function extractPathname(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = trimmed.startsWith('/')
      ? new URL(trimmed, 'http://localhost')
      : new URL(trimmed);
    const pathname = parsed.pathname.replace(/\/+$/, '');
    return pathname || '/';
  } catch {
    return null;
  }
}

function getHeaderValue(
  headers: Record<string, unknown> | undefined,
  headerName: string,
): string | undefined {
  if (!headers) return undefined;
  const target = headerName.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    }
  }
  return undefined;
}

function validateServerPortalContext(
  req: { headers?: Record<string, unknown>; body?: Record<string, unknown> } | undefined,
  portal: 'super-master' | 'institute',
): void {
  const referer = getHeaderValue(req?.headers, 'referer');
  const refererPath = extractPathname(referer);

  if (referer) {
    const allowedHosts = new Set<string>();
    const forwardedHost = getHeaderValue(req?.headers, 'x-forwarded-host');
    const requestHost = getHeaderValue(req?.headers, 'host');

    if (forwardedHost) {
      allowedHosts.add(forwardedHost.split(',')[0].trim().toLowerCase());
    }
    if (requestHost) {
      allowedHosts.add(requestHost.split(',')[0].trim().toLowerCase());
    }
    if (effectiveNextAuthUrl) {
      try {
        allowedHosts.add(new URL(effectiveNextAuthUrl).host.toLowerCase());
      } catch {
        // Ignore invalid configured URL
      }
    }

    if (allowedHosts.size > 0) {
      try {
        const refererHost = new URL(referer).host.toLowerCase();
        if (refererHost && !allowedHosts.has(refererHost)) {
          throw new Error('Authentication request origin mismatch.');
        }
      } catch (err) {
        if (err instanceof Error && err.message === 'Authentication request origin mismatch.') {
          throw err;
        }
      }
    }
  }

  const rawCallbackUrl = typeof req?.body?.callbackUrl === 'string' ? req.body.callbackUrl : null;
  const callbackPath = extractPathname(rawCallbackUrl);

  if (portal === 'super-master') {
    if (refererPath && refererPath !== '/super-master-login') {
      throw new Error('Super Master sign-in is only permitted from /super-master-login.');
    }
    if (
      callbackPath &&
      callbackPath !== '/super-master-login' &&
      callbackPath !== '/super-master' &&
      !callbackPath.startsWith('/super-master/')
    ) {
      throw new Error('Super Master sign-in is only permitted for the Super Master portal.');
    }
    return;
  }

  if (refererPath && refererPath !== '/login') {
    throw new Error('Institute sign-in is only permitted from /login.');
  }
  if (
    callbackPath &&
    (callbackPath === '/super-master-login' ||
      callbackPath === '/super-master' ||
      callbackPath.startsWith('/super-master/') ||
      callbackPath === '/super-admin' ||
      callbackPath.startsWith('/super-admin/'))
  ) {
    throw new Error('Institute sign-in cannot target the Super Master portal.');
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: getNextAuthSecret(),
  useSecureCookies,
  providers: [
    ...(googleOAuthConfig
      ? [
          GoogleProvider({
            clientId: googleOAuthConfig.clientId,
            clientSecret: googleOAuthConfig.clientSecret,
          }),
        ]
      : []),
    // 1. Isolated Super Master Credentials Provider (environment secrets only; never queries DB)
    CredentialsProvider({
      id: 'super-master',
      name: 'Super Master',
      credentials: {
        email: { label: 'Super Master Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        validateServerPortalContext(req, 'super-master');

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;
        const superAdminConfig = getSuperAdminConfig();

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
            kycComplete: true,
          };
        }

        throw new Error('Invalid Super Master credentials.');
      },
    }),
    // 2. Isolated Institute Admin Credentials Provider (DB TENANT_ADMIN + active tenant only)
    CredentialsProvider({
      id: 'credentials',
      name: 'Institute Portal Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        validateServerPortalContext(req, 'institute');

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;
        const superAdminConfig = getSuperAdminConfig();

        // Always reject Super Master credentials on the institute login portal
        if (superAdminConfig && safeCompare(email, superAdminConfig.email)) {
          throw new Error('Invalid email or password.');
        }

        let dbUser;
        try {
          dbUser = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
          });
        } catch (err) {
          console.error('[auth] Failed to query institute user:', err);
          throw new Error('Institute authentication service is temporarily unavailable.');
        }

        if (!dbUser) {
          throw new Error('ACCOUNT_NOT_FOUND');
        }

        // Never authenticate SUPER_ADMIN accounts via the institute login portal
        if (dbUser.role === 'SUPER_ADMIN') {
          throw new Error('Invalid email or password.');
        }

        // Reject missing or non-matching stored passwords
        if (!dbUser.password || !safeCompare(dbUser.password, password)) {
          throw new Error('Invalid email or password.');
        }

        // Restrict institute login strictly to TENANT_ADMIN accounts (reject students)
        if (dbUser.role !== 'TENANT_ADMIN') {
          throw new Error('Only institute administrator accounts can sign in here.');
        }

        // Require a valid, active tenant association
        if (!dbUser.tenantId || !dbUser.tenant) {
          throw new Error('No valid institute workspace is associated with this account.');
        }

        if (!dbUser.tenant.isActive) {
          throw new Error('Your portal is currently deactivated. Please contact support.');
        }

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || dbUser.tenant.name || 'Portal Admin',
          role: 'TENANT_ADMIN' as Role,
          tenantId: dbUser.tenantId,
          orgName: dbUser.tenant.name,
          slug: dbUser.tenant.slug,
          kycComplete: dbUser.kycComplete,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const u = user as { role?: Role; tenantId?: string | null };

      if (account?.provider === 'super-master') {
        return u.role === 'SUPER_ADMIN' && u.tenantId === null;
      }

      if (account?.provider === 'credentials') {
        return u.role === 'TENANT_ADMIN' && Boolean(u.tenantId);
      }

      return true;
    },
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
        token.tenantId = u.role === 'SUPER_ADMIN' ? null : (u.tenantId ?? null);
        token.orgName = u.orgName ?? null;
        token.slug = u.role === 'SUPER_ADMIN' ? null : (u.slug ?? null);
        token.kycComplete = u.kycComplete ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? session.user.id;
        session.user.role = (token.role as Role) ?? 'STUDENT';
        session.user.tenantId =
          token.role === 'SUPER_ADMIN' ? null : ((token.tenantId as string | null) ?? null);
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

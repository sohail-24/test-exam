import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';
import { getAuthOptions } from '@/lib/auth';

async function authHandler(
  req: NextRequest,
  context: { params: { nextauth: string[] } },
) {
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const isHttps =
    forwardedProto === 'https' ||
    req.nextUrl.protocol === 'https:' ||
    (process.env.NEXTAUTH_URL?.startsWith('https://') ?? false);

  return NextAuth(req, context, getAuthOptions(isHttps));
}

export { authHandler as GET, authHandler as POST };

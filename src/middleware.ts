import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAMES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
];

function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some(
    (cookie) =>
      Boolean(cookie.value) &&
      SESSION_COOKIE_NAMES.some(
        (name) => cookie.name === name || cookie.name.startsWith(`${name}.`),
      ),
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/super-admin/login') {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/super-master-login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  if (
    pathname === '/' ||
    pathname === '/super-master' ||
    pathname.startsWith('/super-master/') ||
    pathname === '/super-admin' ||
    pathname.startsWith('/super-admin/')
  ) {
    if (!hasSessionCookie(req)) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/super-master-login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/super-master', '/super-master/:path*', '/super-admin', '/super-admin/:path*'],
};

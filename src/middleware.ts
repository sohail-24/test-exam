import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAMES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
];

const CSRF_COOKIE_NAMES = [
  '__Secure-next-auth.csrf-token',
  'next-auth.csrf-token',
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

function hasValidSession(req: NextRequest): boolean {
  if (!hasSessionCookie(req)) return false;

  // Check for CSRF cookie as well - presence indicates valid session setup
  const hasCsrfCookie = req.cookies.getAll().some(
    (cookie) =>
      Boolean(cookie.value) &&
      CSRF_COOKIE_NAMES.some(
        (name) => cookie.name === name || cookie.name.startsWith(`${name}.`),
      ),
  );

  return hasCsrfCookie;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect legacy super-admin/login to super-master-login
  if (pathname === '/super-admin/login' || pathname === '/super-admin') {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/super-master-login';
    loginUrl.search = '';
    return NextResponse.redirect(loginUrl);
  }

  // Super Master portal routes (protected, requires SUPER_ADMIN session)
  if (
    pathname === '/' ||
    pathname === '/super-master' ||
    pathname.startsWith('/super-master/') ||
    pathname === '/super-admin' ||
    pathname.startsWith('/super-admin/')
  ) {
    if (!hasValidSession(req)) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/super-master-login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Institute Admin dashboard routes (protected, requires TENANT_ADMIN session)
  if (
    pathname.startsWith('/admin') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/')
  ) {
    if (!hasValidSession(req)) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/super-master',
    '/super-master/:path*',
    '/super-admin',
    '/super-admin/:path*',
    '/admin',
    '/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
  ],
};

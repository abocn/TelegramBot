import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth-constants';

const protectedApiRoutes = [
  '/api/user/profile',
  '/api/user/settings',
  '/api/user/delete',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const sessionToken = bearerToken || cookieToken;

  const isProtectedApiRoute = protectedApiRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtectedApiRoute && !sessionToken) {
    return new NextResponse(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (pathname === '/login' && sessionToken) {
    return NextResponse.redirect(new URL('/account', request.url));
  }

  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
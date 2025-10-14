import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { routeAccessMap } from './lib/settings';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith('/sign-in')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (user) {
    const role = user.user_metadata?.role as string | undefined;

    for (const [route, allowedRoles] of Object.entries(routeAccessMap)) {
      const regex = new RegExp(`^${route.replace(/\(\.\*\)/g, '.*')}$`);
      if (regex.test(request.nextUrl.pathname) && role && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL(`/${role}`, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

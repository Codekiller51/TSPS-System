import { createServerClient } from '@supabase/ssr';
import { TempAdminManager } from '@/lib/temp-admin';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Validate temporary admin if applicable
  if (user) {
    const isTempAdmin = user.user_metadata?.temp_admin as boolean;

    if (isTempAdmin) {
      const tempAdminManager = new TempAdminManager();
      const validation = await tempAdminManager.validateTempAdmin(user.id);
      
      if (!validation.isValid) {
        // Force logout for invalid temp admin
        const response = NextResponse.redirect(new URL('/sign-in', request.url));
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        return response;
      }
    }
  }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/sign-in') &&
    !request.nextUrl.pathname.startsWith('/sign-up')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // We need to create a response first to allow the client to set cookies
    // But we need the client to get the user based on the cookies from the request
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Check if user is logged in
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected Routes Logic
    const path = request.nextUrl.pathname
    const isProtectedRoute =
        path.startsWith('/super-admin') ||
        path.startsWith('/org-admin') ||
        path.startsWith('/caretaker') ||
        path.startsWith('/family') ||
        path.startsWith('/patient')

    if (isProtectedRoute) {
        // 1. Auth Check
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // 2. Role Check
        const role = user.user_metadata?.role
        // Simple Role to Path mapping check
        if (path.startsWith('/super-admin') && role !== 'super_admin') return NextResponse.redirect(new URL('/', request.url))
        if (path.startsWith('/org-admin') && role !== 'org_admin') return NextResponse.redirect(new URL('/', request.url))
        if (path.startsWith('/caretaker') && role !== 'caretaker') return NextResponse.redirect(new URL('/', request.url))
        if (path.startsWith('/family') && role !== 'family') return NextResponse.redirect(new URL('/', request.url))
        if (path.startsWith('/patient') && role !== 'patient') return NextResponse.redirect(new URL('/', request.url))

        // 3. Prevent Caching for Protected Routes (Fixes Back Button Issue)
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Route protection logic
    const path = request.nextUrl.pathname

    // Auth pages (accessible only when NOT logged in)
    const isAuthPage = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/reset-password')

    // Public pages (accessible to everyone)
    const isPublicPage = path === '/' || path.startsWith('/auth') || path.startsWith('/api') || path.startsWith('/_next') || path.includes('.')

    // Protected pages (accessible only when logged in)
    const isProtectedPage = !isAuthPage && !isPublicPage

    // Redirect unauthenticated users to login
    if (!user && isProtectedPage) {
        const redirectUrl = new URL('/login', request.url)
        // Optional: Save the original URL to redirect back after login
        // redirectUrl.searchParams.set('next', path)
        return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users to dashboard if they try to access auth pages
    if (user && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}

import { NextRequest, NextResponse } from "next/server";

// Debemos evitar importar módulos de Node (como crypto/bcrypt) en el runtime Edge,
// por eso definimos aquí el nombre de la cookie en lugar de reutilizar auth.ts.
const SESSION_COOKIE_NAME = "session_token";

// Rutas públicas que NO requieren autenticación
const PUBLIC_PATHS = [
    "/login",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/validate",
];

function isPublicPath(pathname: string) {
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Permitir siempre archivos estáticos y recursos internos
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/assets")
    ) {
        return NextResponse.next();
    }

    // Permitir rutas públicas
    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    // Comprobar cookie de sesión
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        const loginUrl = new URL("/login", req.url);
        // Guardamos la URL original para poder redirigir después del login si se quiere
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Validar que la cookie corresponde a una sesión real (evita entrar con cookies inválidas).
    try {
        const validateUrl = new URL("/api/auth/validate", req.url)
        const res = await fetch(validateUrl, {
            headers: {
                cookie: req.headers.get("cookie") ?? "",
            },
            cache: "no-store",
        })

        if (!res.ok) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("from", pathname);
            return NextResponse.redirect(loginUrl);
        }
    } catch {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./src/auth";

// Rutas públicas que NO requieren autenticación
const PUBLIC_PATHS = [
    "/login",
    "/api/auth/login",
    "/api/auth/logout",
];

function isPublicPath(pathname: string) {
    return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req: NextRequest) {
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

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};

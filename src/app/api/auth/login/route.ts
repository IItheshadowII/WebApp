import { NextRequest, NextResponse } from "next/server"
import { signInWithCredentials, SESSION_COOKIE_NAME } from "@/auth"

export async function POST(req: NextRequest) {
    const { email, password, name } = await req.json().catch(() => ({})) as {
        email?: string
        password?: string
        name?: string
    }

    if (!email || !password) {
        return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    try {
        const session = await signInWithCredentials(email, password, name)

        const response = NextResponse.json({
            ok: true,
            user: session.user,
            // Devolvemos también el token para que el cliente pueda reforzar la cookie si hace falta
            sessionToken: session.sessionToken,
        })

        response.cookies.set(SESSION_COOKIE_NAME, session.sessionToken, {
            httpOnly: true,
            sameSite: "lax",
            // IMPORTANTE: en tu entorno actual la app corre sobre HTTP (no HTTPS),
            // por eso no usamos `secure: true` porque el navegador ignoraría la cookie.
            secure: false,
            path: "/",
            expires: new Date(session.expires),
        })

        return response
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Credenciales inválidas" }, { status: 401 })
    }
}

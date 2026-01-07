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
            // En producción (HTTPS) conviene marcar Secure.
            secure: process.env.NODE_ENV === "production",
            path: "/",
            expires: new Date(session.expires),
        })

        return response
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Credenciales inválidas" }, { status: 401 })
    }
}

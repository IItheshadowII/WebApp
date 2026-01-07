import { cookies } from "next/headers"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export const SESSION_COOKIE_NAME = "session_token"

export type AppSession = {
    user: {
        id: string
        name: string | null
        email: string | null
        image?: string | null
    }
    expires: string
    sessionToken: string
}

export const auth = async (): Promise<AppSession | null> => {
    const cookieStore: any = cookies()
    const token = cookieStore.get?.(SESSION_COOKIE_NAME)?.value
    if (!token) return null

    const session = await prisma.session.findUnique({
        where: { sessionToken: token },
        include: { user: true },
    })

    if (!session || !session.user) return null

    return {
        user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
        },
        expires: session.expires.toISOString(),
        sessionToken: token,
    }
}

export async function signInWithCredentials(email: string, password: string, name?: string) {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        throw new Error("Usuario no encontrado")
    }

    if (!user.isActive) {
        throw new Error("Usuario deshabilitado")
    }

    if (!user.passwordHash) {
        throw new Error("El usuario no tiene contraseña configurada")
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
        throw new Error("Credenciales inválidas")
    }

    const sessionToken = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días

    await prisma.session.create({
        data: {
            sessionToken,
            userId: user.id,
            expires,
        },
    })

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
        },
        expires: expires.toISOString(),
        sessionToken,
    } satisfies AppSession
}

export async function signOut() {
    const cookieStore: any = cookies()
    const token = cookieStore.get?.(SESSION_COOKIE_NAME)?.value
    if (token) {
        await prisma.session.deleteMany({ where: { sessionToken: token } })
    }

    cookieStore.set?.(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    })
}

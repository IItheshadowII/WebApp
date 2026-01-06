import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

async function requireAdmin() {
    // Intento 1: si hay sesión y el usuario es admin, úsalo
    const session = await auth()
    if (session?.user?.id) {
        const me = await prisma.user.findUnique({ where: { id: session.user.id } })
        if (me?.isAdmin) return me
    }

    // Fallback: usa (o crea) un admin global para entornos sin login
    let admin = await prisma.user.findFirst({ where: { isAdmin: true } })
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                email: "admin@example.com",
                name: "Admin",
                isActive: true,
                isAdmin: true,
            },
        })
    }

    return admin
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const me = await requireAdmin()
    if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    const body = await req.json().catch(() => ({})) as {
        name?: string
        password?: string
        isActive?: boolean
        isAdmin?: boolean
    }

    const data: any = {}
    if (typeof body.name !== "undefined") data.name = body.name
    if (typeof body.isActive !== "undefined") data.isActive = body.isActive
    if (typeof body.isAdmin !== "undefined") data.isAdmin = body.isAdmin
    if (body.password) {
        data.passwordHash = await bcrypt.hash(body.password, 10)
    }

    const updated = await prisma.user.update({
        where: { id },
        data,
    })

    return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, isActive: updated.isActive, isAdmin: updated.isAdmin })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const me = await requireAdmin()
    if (!me) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params

    if (id === me.id) {
        return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })

    return NextResponse.json({ success: true })
}

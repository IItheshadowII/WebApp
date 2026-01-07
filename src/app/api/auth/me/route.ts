import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

async function getOrCreateDefaultUser() {
    const defaultEmail = process.env.DEFAULT_USER_EMAIL || "mock@example.com";

    const user = await prisma.user.upsert({
        where: { email: defaultEmail },
        update: {},
        create: {
            email: defaultEmail,
            name: "Usuario",
            isActive: true,
            isAdmin: true,
        },
    });

    return user;
}

export async function GET(_req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.id) {
            // Return the user from session
            return NextResponse.json({ user: session.user });
        }
        // Si no hay sesión, intentamos usar un usuario "real" antes que el mock
        const defaultEmail = process.env.DEFAULT_USER_EMAIL || "mock@example.com";

        // Preferimos devolver un usuario activo NO admin (ej. un usuario real) antes que el admin
        let realUser = await prisma.user.findFirst({
            where: {
                isActive: true,
                isAdmin: false,
                // Evitamos el usuario de demo por defecto si existe
                email: { not: defaultEmail },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Si no encontramos usuarios no-admin, devolvemos cualquier usuario activo (incluye admin)
        if (!realUser) {
            realUser = await prisma.user.findFirst({
                where: { isActive: true, email: { not: defaultEmail } },
                orderBy: { createdAt: 'desc' },
            })
        }

        if (realUser) {
            const displayName = realUser.name || (realUser.email ? realUser.email.split("@")[0] : "Usuario");
            return NextResponse.json({
                user: {
                    id: realUser.id,
                    name: displayName,
                    email: realUser.email,
                    image: realUser.image,
                },
            });
        }

        // Si no encontramos ningún usuario real, usamos/creamos el usuario por defecto
        const user = await getOrCreateDefaultUser();
        return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, image: user.image } });
    } catch (e) {
        return NextResponse.json({ user: { id: null, name: 'Usuario', email: null } });
    }
}
 

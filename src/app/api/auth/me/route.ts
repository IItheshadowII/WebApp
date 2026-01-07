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

        const user = await getOrCreateDefaultUser();
        return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, image: user.image } });
    } catch (e) {
        return NextResponse.json({ user: { id: null, name: 'Usuario', email: null } });
    }
}
 

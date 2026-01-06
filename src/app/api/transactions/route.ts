import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

async function getOrCreateDefaultUserId() {
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

    return user.id;
}

export async function POST(req: NextRequest) {
    const session = await auth();
    let userId = session?.user?.id || null;

    if (!userId) {
        userId = await getOrCreateDefaultUserId();
    }

    const data = await req.json().catch(() => ({}));

    const transaction = await prisma.transaction.create({
        data: {
            ...data,
            userId,
            date: new Date(),
        },
    });

    return NextResponse.json(transaction);
}

export async function GET(req: NextRequest) {
    const session = await auth();
    let userId = session?.user?.id || null;

    if (!userId) {
        userId = await getOrCreateDefaultUserId();
    }

    const transactions = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
}

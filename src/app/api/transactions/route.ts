import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await req.json().catch(() => ({}));

    const transaction = await prisma.transaction.create({
        data: {
            ...data,
            userId: session.user.id,
            date: new Date(),
        },
    });

    return NextResponse.json(transaction);
}

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json([], { status: 200 })

    const transactions = await prisma.transaction.findMany({
        where: { userId: session.user.id },
        orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
}

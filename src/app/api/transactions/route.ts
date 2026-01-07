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

    // Normalize amount server-side to accept formats like "400.000", "1.234.567,89" or "400000"
    function normalizeNumberInput(input: any) {
        if (input === null || typeof input === 'undefined') return null
        let s = String(input)
        // keep digits, dots and commas
        s = s.replace(/[^0-9.,]/g, '')
        if (!s) return null
        // normalize commas to dots
        s = s.replace(/,/g, '.')
        const dotCount = (s.match(/\./g) || []).length
        if (dotCount > 1) {
            // keep only last dot as decimal separator, remove other dots (thousand separators)
            const last = s.lastIndexOf('.')
            const intPart = s.slice(0, last).replace(/\./g, '')
            const fracPart = s.slice(last + 1)
            return fracPart ? `${intPart}.${fracPart}` : intPart
        }
        if (dotCount === 1) {
            const [intPart, fracPart] = s.split('.')
            // heuristic: if fractional part has 3 digits, it's probably a thousands grouping (e.g. 400.000)
            if (fracPart.length === 3) {
                return `${intPart}${fracPart}`
            }
            return fracPart ? `${intPart}.${fracPart}` : intPart
        }
        return s
    }

    const normalizedAmountRaw = normalizeNumberInput(data.amount)
    const amountNumber = normalizedAmountRaw !== null ? parseFloat(normalizedAmountRaw) : null
    if (amountNumber === null || Number.isNaN(amountNumber) || amountNumber <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
        data: {
            ...data,
            amount: amountNumber,
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

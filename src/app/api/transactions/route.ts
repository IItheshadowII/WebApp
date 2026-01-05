import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Simplificamos: el endpoint ya no requiere autenticación para leer transacciones.
export async function POST(req: NextRequest) {
    const data = await req.json();

    const transaction = await prisma.transaction.create({
        data: {
            ...data,
            // Si no se provee userId, Prisma fallará; se asume que el frontend envía uno válido.
            date: new Date(),
        },
    });

    return NextResponse.json(transaction);
}

export async function GET(req: NextRequest) {
    const transactions = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
}

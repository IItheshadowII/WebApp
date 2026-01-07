import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await req.json();

    const updated = await prisma.transaction.update({
        where: { id },
        data: {
            ...(typeof data.isPaid !== 'undefined' ? { isPaid: data.isPaid } : {}),
            ...(typeof data.isSavings !== 'undefined' ? { isSavings: data.isSavings } : {}),
        },
    });

    return NextResponse.json(updated);
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    await prisma.transaction.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}

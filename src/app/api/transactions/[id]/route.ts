import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    // Update the transaction (datos compartidos, solo se exige estar logueado)
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
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete the transaction (datos compartidos, solo se exige estar logueado)
    await prisma.transaction.delete({
        where: { id },
    });

    return NextResponse.json({ success: true });
}

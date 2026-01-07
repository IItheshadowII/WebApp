import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.aIConfig.findFirst({ where: { userId: session.user.id } });
    if (!existing) {
        return NextResponse.json({ provider: "google", apiKey: "", modelName: "" });
    }

    return NextResponse.json({
        provider: existing.provider,
        apiKey: existing.apiKey,
        modelName: existing.modelName || "",
    });
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { provider, apiKey, modelName } = await req.json();

    await prisma.aIConfig.upsert({
        where: {
            // Note: In schema we don't have a unique constraint on userId alone for aiConfig, 
            // let's adjust the schema or use findFirst + update/create
            id: (await prisma.aIConfig.findFirst({ where: { userId: session.user.id } }))?.id || 'new'
        },
        update: { provider, apiKey, modelName },
        create: { userId: session.user.id, provider, apiKey, modelName },
    });

    return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { extractTicketData } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Usamos la primera configuración de IA disponible como configuración global
    const aiConfig = await prisma.aIConfig.findFirst();

    if (!aiConfig) {
        return NextResponse.json({
            error: "AI not configured",
            message: "Por favor configura una API Key de Google o OpenAI primero."
        }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extraction = await extractTicketData(
        buffer,
        aiConfig.provider as any,
        aiConfig.apiKey
    );

    return NextResponse.json(extraction);
}

import { NextRequest, NextResponse } from "next/server";

// Simple helper to get an approximate official USD -> ARS rate from the internet
export async function GET(_req: NextRequest) {
    try {
        // Public, free endpoint. You can change it later if you prefer another provider.
        const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=ARS");

        if (!res.ok) {
            return NextResponse.json(
                { rate: 1, error: "No se pudo obtener la cotización (respuesta no válida)." },
                { status: 502 }
            );
        }

        const data: any = await res.json();
        const rate = typeof data?.rates?.ARS === "number" ? data.rates.ARS : null;

        if (!rate || rate <= 0) {
            return NextResponse.json(
                { rate: 1, error: "Datos de cotización inválidos." },
                { status: 502 }
            );
        }

        return NextResponse.json({ rate });
    } catch (e) {
        return NextResponse.json(
            { rate: 1, error: "Error de red al consultar la cotización." },
            { status: 502 }
        );
    }
}

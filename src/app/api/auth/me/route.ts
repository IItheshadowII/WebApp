import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(_req: NextRequest) {
    try {
        const session = await auth();
        if (session?.user?.id) {
            // Return the user from session
            return NextResponse.json({ user: session.user });
        }
        // Sin sesión: no devolvemos un usuario “por defecto” ni creamos mock users.
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
 

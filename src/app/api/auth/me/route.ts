import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET() {
    const session = await auth()
    if (!session) {
        return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ user: session.user }, { status: 200 })
}

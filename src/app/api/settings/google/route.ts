import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const SETTINGS_FILE = path.join(DATA_DIR, 'google_settings.json')

async function ensureDir() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true })
}

export async function GET() {
  try {
    const raw = await fs.promises.readFile(SETTINGS_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (e) {
    return NextResponse.json({}, { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    await ensureDir()
    await fs.promises.writeFile(SETTINGS_FILE, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await fs.promises.unlink(SETTINGS_FILE)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

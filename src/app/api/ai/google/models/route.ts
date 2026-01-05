import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const SETTINGS_FILE = path.join(DATA_DIR, 'google_settings.json')

export async function GET() {
  try {
    const raw = await fs.promises.readFile(SETTINGS_FILE, 'utf-8')
    const settings = JSON.parse(raw)
    const apiKey = settings.apiKey
    const baseUrl = settings.baseUrl || 'https://generativelanguage.googleapis.com/v1'

    if (!apiKey) return NextResponse.json({ ok: false, error: 'API key missing' }, { status: 400 })

    const endpointBase = `${baseUrl.replace(/\/$/, '')}/models`
    const isSimpleApiKey = typeof apiKey === 'string' && apiKey.startsWith('AIza')
    const endpoint = isSimpleApiKey ? `${endpointBase}?key=${encodeURIComponent(apiKey)}` : endpointBase

    const headers: any = {}
    if (!isSimpleApiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(endpoint, {
      method: 'GET',
      headers
    })

    if (!res.ok) {
      const t = await res.text()
      return NextResponse.json({ ok: false, error: t }, { status: res.status })
    }

    const data = await res.json()
    // Try to normalize models list
    const models = data.models || data
    return NextResponse.json({ ok: true, models })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), '.data')
const SETTINGS_FILE = path.join(DATA_DIR, 'google_settings.json')

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prompt, temperature = 0.2, maxTokens = 512 } = body

    // Load settings
    let settings: any = null
    try {
      const raw = await fs.promises.readFile(SETTINGS_FILE, 'utf-8')
      settings = JSON.parse(raw)
    } catch (e) {
      return NextResponse.json({ ok: false, error: 'No API settings configured' }, { status: 400 })
    }

    const apiKey = settings.apiKey
    const model = settings.model || 'gemini-2.0'
    const baseUrl = settings.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'API key missing in settings' }, { status: 400 })
    }

    // Call Google Generative Language API (Gemini).
    // If the stored key is a simple API key (starts with 'AIza'), use `?key=` param.
    const base = baseUrl.replace(/\/$/, '')
    const modelPath = model.startsWith('models/') ? model : `models/${model}`
    const endpointBase = `${base}/${modelPath}:generateContent`
    const isSimpleApiKey = typeof apiKey === 'string' && apiKey.startsWith('AIza')
    const endpoint = isSimpleApiKey ? `${endpointBase}?key=${encodeURIComponent(apiKey)}` : endpointBase

    const headers: any = { 'Content-Type': 'application/json' }
    if (!isSimpleApiKey) headers['Authorization'] = `Bearer ${apiKey}`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data.error || data }, { status: res.status })
    }
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

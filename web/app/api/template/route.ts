import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const templateId = searchParams.get('id') || 'pen-testing'

  // Map template IDs to file names
  const templateMap: Record<string, string> = {
    'pen-testing': 'pen-testing-flyer.html',
    'flyer-template': 'flyer-template.html',
  }

  const fileName = templateMap[templateId]
  if (!fileName) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  try {
    // In production, templates are in the public folder
    // In development, we can also check the src/templates folder
    let templatePath = join(process.cwd(), 'public', 'templates', fileName)

    if (!existsSync(templatePath)) {
      // Fallback to src/templates in parent directory (for local dev)
      templatePath = join(process.cwd(), '..', 'src', 'templates', fileName)
    }

    if (!existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template file not found' }, { status: 404 })
    }

    const html = readFileSync(templatePath, 'utf-8')

    // Get the origin from the request for base URL
    const origin = request.headers.get('origin') || request.headers.get('host') || 'http://localhost:3000'
    const baseUrl = origin.startsWith('http') ? origin : `http://${origin}`

    // Convert relative asset paths to absolute for preview
    // Add base tag so images load correctly in iframe srcDoc
    let processedHtml = html
      .replace(/src="\.\.\/assets\//g, 'src="/assets/')
      .replace(/href="\.\.\/assets\//g, 'href="/assets/')

    // Add base tag after <head> to make relative URLs work in srcDoc iframe
    processedHtml = processedHtml.replace(
      /<head>/i,
      `<head>\n  <base href="${baseUrl}/">`
    )

    return NextResponse.json({ html: processedHtml })
  } catch (error) {
    console.error('Template load error:', error)
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 })
  }
}

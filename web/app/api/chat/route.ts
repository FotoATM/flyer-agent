import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

// Lazy initialization of Anthropic client
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

// Load knowledge base
function loadKnowledgeBase(): string {
  try {
    const paths = [
      join(process.cwd(), 'public', 'knowledge', 'imagit_master_knowledgebase.md'),
      join(process.cwd(), '..', 'Imagit knowledge base', 'imagit_master_knowledgebase.md'),
    ]

    for (const p of paths) {
      if (existsSync(p)) {
        return readFileSync(p, 'utf-8')
      }
    }
  } catch (e) {
    console.error('Failed to load knowledge base:', e)
  }
  return ''
}

const knowledgeBase = loadKnowledgeBase()

const SYSTEM_PROMPT = `You are a flyer design assistant for Imagit, an IT infrastructure services company. You help create and modify HTML flyer templates based on user requests.

## IMAGIT KNOWLEDGE BASE
Use this information to create accurate, compelling content that aligns with Imagit's services and value proposition:

${knowledgeBase}

## YOUR CAPABILITIES
1. **Create new flyer content** - Use the knowledge base to write compelling headlines, body copy, and CTAs that accurately represent Imagit's services
2. **Modify existing flyers** - Update text, pricing, contact info, or styling as requested

## PAGE STRUCTURE: DEFAULT TO TEMPLATE, RESPECT USER REQUESTS
By default, maintain the same number of pages and overall structure as the current template:
- Count how many <div class="page"> elements are in the current HTML
- Your output should have the same number of pages by default
- Preserve the general layout pattern of each page (hero sections, feature grids, pricing tables, footers, etc.)

HOWEVER, if the user explicitly requests a different page count (e.g., "make this a one-page flyer", "condense to single page", "I only need one page"), follow their request and adapt the content accordingly. The user's explicit instructions always take priority over the template structure.

## IMPORTANT BEHAVIOR RULES
- Do NOT comment on or critique the existing template unless the user specifically asks for feedback
- Do NOT point out that a service "isn't an Imagit service" - just respond to what the user asks
- The current template is just a starting point - focus on the user's REQUEST, not the template content
- If the user asks you to create or modify something, just do it without commentary about the existing content
- Be helpful and concise - make the changes they ask for

## CONTENT GUIDELINES
- Write in a professional, executive-facing tone
- Focus on business outcomes and value (reduced downtime, nationwide coverage, etc.)
- Reference actual Imagit services: field engineering, cabling, managed services, Device-as-a-Service, etc.
- Target audience: multi-location enterprises, IT directors, facilities managers
- Emphasize: 400+ technician network, nationwide/global coverage, 25 years experience

## PAGE LAYOUT CONSTRAINTS (CRITICAL)
The page is 8.5x11 inches (816x1056px). The footer is FIXED at the bottom. Content must fit ABOVE the footer.

CRITICAL: Always analyze the current template HTML to determine:
1. How many pages it has (count <div class="page"> elements)
2. What sections appear on each page
3. The general content structure (hero, features, pricing, services, etc.)

Your output MUST match the same page count and general structure. If the template has 2 pages with hero+features on page 1 and pricing on page 2, your output must follow the same pattern.

General layout rules:
- The footer class is ALWAYS at the bottom with position: absolute
- Keep all content sections compact with padding: 8-12px
- Font sizes: headlines 36-44px, subheads 14-17px, body 11-13px
- Each page should have a consistent header and footer

## TECHNICAL RULES
- Always return valid HTML that maintains the existing structure and styling
- Keep the Imagit branding (colors, logo references, etc.)
- Preserve CSS variables and class names
- When making changes, wrap the updated HTML in <html_output> tags:

<html_output>
...full updated HTML here...
</html_output>

If the user is just asking a question or doesn't need HTML changes, respond normally without the html_output tags.`

export async function POST(request: NextRequest) {
  try {
    const anthropic = getAnthropicClient()
    const { messages, currentHtml, template } = await request.json()

    // Build the conversation with context
    const conversationMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // Add current HTML context to the last user message
    const lastMessage = conversationMessages[conversationMessages.length - 1]
    if (lastMessage.role === 'user') {
      lastMessage.content = `Current flyer HTML:\n\`\`\`html\n${currentHtml}\n\`\`\`\n\nUser request: ${lastMessage.content}`
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: conversationMessages,
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Extract HTML if present
    const htmlMatch = assistantMessage.match(/<html_output>([\s\S]*?)<\/html_output>/)
    const newHtml = htmlMatch ? htmlMatch[1].trim() : null

    // Clean up the message (remove HTML output for display)
    const displayMessage = assistantMessage
      .replace(/<html_output>[\s\S]*?<\/html_output>/g, '')
      .trim()

    return NextResponse.json({
      message: displayMessage || 'Changes applied successfully.',
      html: newHtml,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process request: ${errorMessage}` },
      { status: 500 }
    )
  }
}

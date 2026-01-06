'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [htmlContent, setHtmlContent] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('pen-testing')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const templates = [
    { id: 'pen-testing', name: 'Penetration Testing' },
    { id: 'flyer-template', name: 'Referral Program' },
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load initial template
  useEffect(() => {
    loadTemplate(selectedTemplate)
  }, [selectedTemplate])

  const loadTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/template?id=${templateId}`)
      const data = await res.json()
      if (data.html) {
        setHtmlContent(data.html)
      }
    } catch (error) {
      console.error('Failed to load template:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          currentHtml: htmlContent,
          template: selectedTemplate,
        }),
      })

      const data = await res.json()

      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }

      if (data.html) {
        setHtmlContent(data.html)
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!htmlContent) return

    // Inject print styles to remove browser headers/footers and margins
    const printStyles = `
      <style>
        @page {
          size: letter;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    `

    // Insert print styles into the HTML
    const htmlWithPrintStyles = htmlContent.replace('</head>', `${printStyles}</head>`)

    // Open print dialog - user can save as PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlWithPrintStyles)
      printWindow.document.close()
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 100)
      }
    }
  }

  return (
    <main className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-imagit-navy border-b border-imagit-ink px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-imagit-teal">Imagit Flyer Generator</h1>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="bg-imagit-navy border border-imagit-ink rounded px-3 py-1.5 text-sm focus:border-imagit-teal outline-none"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isLoading || !htmlContent}
          className="bg-imagit-teal hover:bg-imagit-light-teal text-imagit-navy font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Download PDF
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-1/2 flex flex-col border-r border-imagit-ink">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-gray-400 text-center mt-8">
                <p className="text-lg mb-2">Welcome to Flyer Generator</p>
                <p className="text-sm">Describe what changes you want to make to the flyer.</p>
                <p className="text-sm mt-4">Examples:</p>
                <ul className="text-sm mt-2 space-y-1 text-gray-500">
                  <li>"Change the headline to 'Secure Your Future'"</li>
                  <li>"Update the pricing to start at $5,000"</li>
                  <li>"Make the CTA more urgent"</li>
                </ul>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-imagit-ink ml-8'
                    : 'bg-gray-800 mr-8'
                }`}
              >
                <p className="text-xs text-imagit-teal mb-1 font-semibold">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </p>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message bg-gray-800 mr-8 p-3 rounded-lg">
                <p className="text-xs text-imagit-teal mb-1 font-semibold">Assistant</p>
                <p className="text-sm text-gray-400">Thinking...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-imagit-ink">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe changes to the flyer..."
                className="flex-1 bg-gray-800 border border-imagit-ink rounded px-4 py-2 focus:border-imagit-teal outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-imagit-teal hover:bg-imagit-light-teal text-imagit-navy font-semibold px-6 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 bg-gray-900 p-4 overflow-auto">
          <div className="bg-white rounded shadow-lg overflow-hidden" style={{ width: '100%', aspectRatio: '8.5/11' }}>
            {htmlContent ? (
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                className="w-full h-full border-0 preview-frame"
                style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
                title="Flyer Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Loading template...
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

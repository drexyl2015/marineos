import { useState, useRef, useEffect } from 'react'
import { Ship, X, Send, ChevronDown, Sparkles } from 'lucide-react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
  isError?: boolean
  retryText?: string
}

interface AIAssistantWidgetProps {
  selectedRole: string
}

const SUGGESTIONS = [
  'Which crew certificates expire this month?',
  'Generate a port briefing for Rotterdam',
  'What are the STCW rest hour requirements?',
  'Who is available to crew the next voyage?',
]

const TOOL_LABELS: Record<string, string> = {
  search_crew: 'Crew Search',
  get_crew_profile: 'Crew Profile',
  get_expiring_certificates: 'Cert Expiry',
  get_available_crew: 'Available Crew',
  get_active_alerts: 'Active Alerts',
  get_fleet_compliance_summary: 'Fleet Summary',
  get_vessel_manifest: 'Vessel Manifest',
  search_certificates: 'Cert Search',
  get_crew_assignments: 'Assignments',
  check_crew_compliance: 'Compliance Check',
  assess_crew_risk: 'Risk Assessment',
  generate_port_briefing: 'Port Briefing',
  recommend_crew_for_position: 'Crew Match',
  analyze_crew_pool: 'Pool Analysis',
  lookup_stcw_requirement: 'STCW Lookup',
  lookup_mlc_requirement: 'MLC Lookup',
  get_watchkeeping_requirements: 'Watchkeeping',
}

function ToolBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sea-900/60 border border-sea-500/30 text-sea-400 text-[10px] font-medium">
      <Sparkles className="w-2.5 h-2.5" />
      {TOOL_LABELS[name] ?? name}
    </span>
  )
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="w-2 h-2 rounded-full bg-sea-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-sea-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-sea-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-navy-700 px-1 rounded text-sea-300 text-xs">$1</code>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<p class="font-semibold text-white mt-2">$1</p>')
    .replace(/^[-•]\s+(.+)$/gm, '<li class="ml-3 list-disc">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>')
}

export default function AIAssistantWidget({ selectedRole }: AIAssistantWidgetProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [history, setHistory] = useState<unknown[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 250)
    }
  }, [open])

  const sendMessage = async (text?: string) => {
    const userMsg = (text ?? input).trim()
    if (!userMsg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/ai/chat`, {
        message: userMsg,
        history,
        context: { role: selectedRole },
      })
      setHistory(res.data.history)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: res.data.reply,
          toolsUsed: res.data.tools_used ?? [],
        },
      ])
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; reply?: string } }; message?: string }
      const detail =
        axiosErr?.response?.data?.reply ??
        axiosErr?.response?.data?.detail ??
        axiosErr?.message ??
        'Unknown error'
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I couldn't complete that request — ${detail}`,
          isError: true,
          retryText: userMsg,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close AI Assistant' : 'Open AI Assistant'}
        className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-sea-600 hover:bg-sea-500 text-white shadow-lg shadow-sea-900/50 flex items-center justify-center transition-all duration-200 hover:scale-110 ring-2 ring-sea-400/30"
        style={{ boxShadow: '0 0 20px rgba(16,185,129,0.35), 0 4px 16px rgba(0,0,0,0.5)' }}
      >
        {open ? <ChevronDown className="w-6 h-6" /> : <Ship className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-[200] h-[520px] rounded-2xl flex flex-col shadow-2xl chat-panel-enter overflow-hidden"
          style={{
            background: 'rgba(15,23,42,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6), 0 0 40px rgba(16,185,129,0.08)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sea-600/20 border border-sea-500/30 flex items-center justify-center">
                <Ship className="w-4 h-4 text-sea-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">MarineOS AI</p>
                <p className="text-steel-500 text-[10px] mt-0.5">17 Maritime Tools</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-1.5 rounded-lg text-steel-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 chat-messages-scroll"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-steel-400 text-xs text-center pt-2">
                  Ask anything about your fleet, crew, or maritime regulations.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="w-full text-left px-3 py-2 rounded-xl border border-white/10 bg-navy-800/60 text-steel-300 text-xs hover:border-sea-500/40 hover:bg-navy-800 hover:text-white transition-all duration-150"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sea-600/25 border border-sea-500/30 text-white'
                      : 'bg-navy-800/80 border border-white/8 text-steel-200'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                      className="prose-sm"
                    />
                  ) : (
                    <p>{msg.content}</p>
                  )}
                  {msg.isError && msg.retryText && (
                    <button
                      type="button"
                      onClick={() => sendMessage(msg.retryText)}
                      className="mt-2 text-[10px] text-sea-400 hover:text-sea-300 underline block"
                    >
                      Retry
                    </button>
                  )}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/8">
                      {msg.toolsUsed.map(t => (
                        <ToolBadge key={t} name={t} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-navy-800/80 border border-white/8 rounded-xl">
                  <ThinkingDots />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3 flex gap-2 flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about crew, certs, regulations…"
              rows={1}
              className="flex-1 bg-navy-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-steel-500 resize-none focus:outline-none focus:border-sea-500/50 transition-colors"
              style={{ maxHeight: '80px', overflowY: 'auto' }}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="w-9 h-9 rounded-xl bg-sea-600 hover:bg-sea-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0 self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

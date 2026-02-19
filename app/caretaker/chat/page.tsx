'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Send, Bot, User, Loader2, AlertTriangle } from 'lucide-react'

export default function CaretakerChatPage() {
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: 'Hello! I am your BedCare AI assistant. Select a patient to get context-aware help, or just ask a general question.' }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [patients, setPatients] = useState<any[]>([])
    const [selectedPatientId, setSelectedPatientId] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchPatients()
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchPatients = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: caretaker } = await supabase.from('caretakers').select('id, organization_id').eq('user_id', user.id).single()
        if (caretaker) {
            const { data } = await supabase.from('patients').select('id, name').eq('organization_id', caretaker.organization_id) // Fetch all in org or just assigned?
            // PRD says "Caretaker selects patient". Usually assigned.
            // Let's allow selecting from assigned for now.
            const { data: assigned } = await supabase.from('patients').select('id, name').eq('caretaker_id', caretaker.id)
            setPatients(assigned || [])
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/gemini/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content, patientId: selectedPatientId })
            })

            const data = await res.json()

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
            }
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Please check your connection.' }])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white p-4 shadow-sm z-10">
                <h1 className="text-xl font-bold text-gray-800 mb-2">AI Medical Assistant</h1>
                <select
                    className="w-full p-2 border rounded-lg text-sm bg-gray-50"
                    value={selectedPatientId}
                    onChange={(e) => {
                        setSelectedPatientId(e.target.value)
                        setMessages([{ role: 'assistant', content: `Context switched to ${patients.find(p => p.id === e.target.value)?.name || 'General'}. How can I help?` }])
                    }}
                >
                    <option value="">Select Patient for Context...</option>
                    {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                {selectedPatientId && (
                    <div className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                        <Bot size={12} /> Using medical context for {patients.find(p => p.id === selectedPatientId)?.name}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                            }`}>
                            <p className="text-sm shadow-black drop-shadow-sm">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2 text-gray-500 text-sm">
                            <Loader2 className="animate-spin h-4 w-4" /> Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t pb-24"> {/* Extra padding for bottom nav */}
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                        placeholder="Ask about medications, care..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    )
}

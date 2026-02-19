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
            // Prepare context
            let context = ''
            if (selectedPatientId) {
                const patient = patients.find(p => p.id === selectedPatientId)
                if (patient) {
                    context = `Patient Name: ${patient.name}. User is asking in the context of this patient.`
                }
            }

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    context
                })
            })

            const data = await res.json()

            if (data.text) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.text }])
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

    const [activeTab, setActiveTab] = useState<'ai' | 'family'>('ai')
    const [familyMembers, setFamilyMembers] = useState<any[]>([])
    const [selectedFamilyId, setSelectedFamilyId] = useState('')
    const [familyMessages, setFamilyMessages] = useState<any[]>([])
    const [familyInput, setFamilyInput] = useState('')
    const [caretakerId, setCaretakerId] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        if (activeTab === 'family') {
            fetchFamilyMembers()
        }
    }, [activeTab])

    useEffect(() => {
        if (selectedFamilyId) {
            fetchFamilyHistory(selectedFamilyId)

            const channel = supabase
                .channel(`public:chats:${selectedFamilyId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
                    const newMsg = payload.new
                    if (newMsg.initiator_id === selectedFamilyId || newMsg.recipient_id === selectedFamilyId) {
                        setFamilyMessages(prev => {
                            if (prev.find(m => m.id === newMsg.id)) return prev
                            return [...prev, newMsg]
                        })
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [selectedFamilyId])

    const fetchFamilyMembers = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUserId(user.id)

        const { data: caretaker } = await supabase.from('caretakers').select('id, organization_id').eq('user_id', user.id).single()
        if (caretaker) {
            setCaretakerId(caretaker.id)
            // Fetch patients assigned to this caretaker
            const { data: assignedPatients } = await supabase.from('patients').select('id').eq('caretaker_id', caretaker.id)

            if (assignedPatients && assignedPatients.length > 0) {
                const patientIds = assignedPatients.map(p => p.id)
                // Fetch profiles (families) linked to these patients
                const { data: families } = await supabase
                    .from('profiles')
                    .select('id, full_name, linked_patient_id, patients:linked_patient_id(name)')
                    .in('linked_patient_id', patientIds)
                    .eq('role', 'family')

                setFamilyMembers(families || [])
            }
        }
    }

    const fetchFamilyHistory = async (familyId: string) => {
        if (!userId) return
        const { data } = await supabase
            .from('chats')
            .select('*')
            .or(`and(initiator_id.eq.${userId},recipient_id.eq.${familyId}),and(initiator_id.eq.${familyId},recipient_id.eq.${userId})`)
            .order('created_at', { ascending: true })

        setFamilyMessages(data || [])
    }

    const handleSendFamily = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!familyInput.trim() || !selectedFamilyId || !userId) return

        const text = familyInput.trim()
        setFamilyInput('')

        // Optimistic update
        const tempId = Date.now().toString() // Temporary ID
        const optimisticMsg = {
            id: tempId,
            initiator_id: userId,
            recipient_id: selectedFamilyId,
            message: text,
            created_at: new Date().toISOString()
        }

        // Add immediately
        setFamilyMessages(prev => [...prev, optimisticMsg])

        const { data, error } = await supabase.from('chats').insert([
            {
                initiator_id: userId,
                recipient_id: selectedFamilyId,
                message: text
            }
        ]).select().single()

        if (error) {
            console.error('Error sending message:', error)
            alert('Failed to send')
            // Rollback if needed, or just let user know. 
            // Simple rollback: remove the optimistic message
            setFamilyMessages(prev => prev.filter(m => m.id !== tempId))
        } else if (data) {
            // Replace optimistic with real one (mostly for ID sync)
            setFamilyMessages(prev => {
                // Check if the real message (data.id) is already in the list (from subscription)
                if (prev.find(m => m.id === data.id)) {
                    // Subscription beat us. Remove optimistic one.
                    return prev.filter(m => m.id !== tempId)
                }
                // Subscription hasn't arrived or we beat it. Update optimistic to real.
                return prev.map(m => m.id === tempId ? data : m)
            })
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white p-4 shadow-sm z-10">
                <div className="flex gap-4 mb-4 border-b">
                    <button
                        className={`pb-2 px-4 font-medium ${activeTab === 'ai' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('ai')}
                    >
                        AI Assistant
                    </button>
                    <button
                        className={`pb-2 px-4 font-medium ${activeTab === 'family' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('family')}
                    >
                        Family Chat
                    </button>
                </div>

                {activeTab === 'ai' && (
                    <>
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
                    </>
                )}

                {activeTab === 'family' && (
                    <>
                        <h1 className="text-xl font-bold text-gray-800 mb-2">Family Chat</h1>
                        <select
                            className="w-full p-2 border rounded-lg text-sm bg-gray-50"
                            value={selectedFamilyId}
                            onChange={(e) => setSelectedFamilyId(e.target.value)}
                        >
                            <option value="">Select Family Member...</option>
                            {familyMembers.map(f => (
                                <option key={f.id} value={f.id}>{f.full_name} (Patient: {f.patients?.name})</option>
                            ))}
                        </select>
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {activeTab === 'ai' ? (
                    <>
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
                    </>
                ) : (
                    <>
                        {familyMessages.map((msg) => {
                            const isMe = msg.initiator_id === userId
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${isMe
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border'
                                        }`}>
                                        <p className="text-sm">{msg.message}</p>
                                    </div>
                                </div>
                            )
                        })}
                        {familyMessages.length === 0 && selectedFamilyId && (
                            <div className="text-center text-gray-500 mt-10">No messages yet. Start the conversation!</div>
                        )}
                        {!selectedFamilyId && (
                            <div className="text-center text-gray-500 mt-10">Select a family member to chat.</div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t pb-24">
                {activeTab === 'ai' ? (
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
                ) : (
                    <form onSubmit={handleSendFamily} className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                            placeholder="Message family..."
                            value={familyInput}
                            onChange={(e) => setFamilyInput(e.target.value)}
                            disabled={!selectedFamilyId}
                        />
                        <button
                            type="submit"
                            disabled={!familyInput.trim() || !selectedFamilyId}
                            className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

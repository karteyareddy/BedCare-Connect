'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Send, Bot, User, Loader2, AlertTriangle, Users, Mic } from 'lucide-react'
import { motion } from 'framer-motion'
import VoiceRecorder from '@/components/VoiceRecorder'

export default function CaretakerChatPage() {
    // Shared State
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [caretakerId, setCaretakerId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [activeTab, setActiveTab] = useState<'ai' | 'family' | 'patient'>('ai')

    // AI Chat State
    const [messages, setMessages] = useState<any[]>([
        { role: 'assistant', content: 'Hello! I am your BedCare AI assistant. Select a patient to get context-aware help, or just ask a general question.' }
    ])
    const [input, setInput] = useState('')

    // Patient Data (Used for AI Context & Patient Chat)
    const [patients, setPatients] = useState<any[]>([])
    const [selectedPatientId, setSelectedPatientId] = useState('')
    const [patientMessages, setPatientMessages] = useState<any[]>([])
    const [patientInput, setPatientInput] = useState('')

    // Family Chat State
    const [familyMembers, setFamilyMembers] = useState<any[]>([])
    const [selectedFamilyId, setSelectedFamilyId] = useState('')
    const [familyMessages, setFamilyMessages] = useState<any[]>([])
    const [familyInput, setFamilyInput] = useState('')

    const supabase = createClient()

    // 1. Initial Load
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            const { data: caretaker } = await supabase.from('caretakers').select('id, organization_id').eq('user_id', user.id).single()
            if (caretaker) {
                setCaretakerId(caretaker.id)
                // Fetch assigned patients
                const { data: assigned } = await supabase.from('patients').select('id, name, user_id').eq('caretaker_id', caretaker.id)
                setPatients(assigned || [])
            }
        }
        init()
    }, [])

    // 2. Fetch Family Members when tab active
    useEffect(() => {
        if (activeTab === 'family' && patients.length > 0) {
            const patientIds = patients.map(p => p.id)
            const fetchFamilies = async () => {
                const { data: families } = await supabase
                    .from('profiles')
                    .select('id, full_name, linked_patient_id, patients:linked_patient_id(name)')
                    .in('linked_patient_id', patientIds)
                    .eq('role', 'family')
                setFamilyMembers(families || [])
            }
            fetchFamilies()
        }
    }, [activeTab, patients])

    // 3. Subscriptions & History Loading
    useEffect(() => {
        if (!userId) return

        // Polling interval for auto-refresh (every 2 seconds)
        const interval = setInterval(() => {
            if (activeTab === 'family' && selectedFamilyId) {
                // Refresh Family Chat
                const fetchFamily = async () => {
                    const { data } = await supabase
                        .from('chats')
                        .select('*')
                        .or(`and(initiator_id.eq.${userId},recipient_id.eq.${selectedFamilyId}),and(initiator_id.eq.${selectedFamilyId},recipient_id.eq.${userId})`)
                        .order('created_at', { ascending: true })
                    if (data) setFamilyMessages(data)
                }
                fetchFamily()
            } else if (activeTab === 'patient' && selectedPatientId) {
                // Refresh Patient Chat
                const patient = patients.find(p => p.id === selectedPatientId)
                if (patient?.user_id) {
                    const fetchPatient = async () => {
                        const { data } = await supabase
                            .from('chats')
                            .select('*')
                            .or(`and(initiator_id.eq.${userId},recipient_id.eq.${patient.user_id}),and(initiator_id.eq.${patient.user_id},recipient_id.eq.${userId})`)
                            .order('created_at', { ascending: true })
                        if (data) setPatientMessages(data)
                    }
                    fetchPatient()
                }
            }
        }, 2000)

        // Realtime Subscription (Keep as backup/primary)
        const channel = supabase
            .channel('public:chats')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
                // ... (Keep existing realtime logic if desired, or rely on polling)
                // For simplicity and robustness with polling, we can keep this but polling ensures freshness
            })
            .subscribe()

        return () => {
            clearInterval(interval)
            supabase.removeChannel(channel)
        }
    }, [userId, activeTab, selectedFamilyId, selectedPatientId, patients])


    // Scroll handling
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, familyMessages, patientMessages, activeTab])


    // Handlers
    const handleSendAI = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
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
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }])
            }
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: 'Network error.' }])
        } finally {
            setLoading(false)
        }
    }

    const VOICE_PREFIX = '[VOICE]:'
    const isVoice = (msg: string) => msg?.startsWith(VOICE_PREFIX)
    const getVoiceUrl = (msg: string) => msg?.replace(VOICE_PREFIX, '')

    const handleSendFamilyVoice = async (audioBase64: string) => {
        if (!selectedFamilyId || !userId) return
        try {
            await supabase.from('chats').insert([{
                initiator_id: userId,
                recipient_id: selectedFamilyId,
                message: `${VOICE_PREFIX}${audioBase64}`
            }])
        } catch (err) { console.error('Voice error:', err) }
    }

    const handleSendPatientVoice = async (audioBase64: string) => {
        if (!selectedPatientId || !userId) return
        const patient = patients.find(p => p.id === selectedPatientId)
        if (!patient?.user_id) return
        try {
            await supabase.from('chats').insert([{
                initiator_id: userId,
                recipient_id: patient.user_id,
                message: `${VOICE_PREFIX}${audioBase64}`
            }])
        } catch (err) { console.error('Voice error:', err) }
    }

    const handleSendFamily = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!familyInput.trim() || !selectedFamilyId || !userId) return

        const text = familyInput.trim()
        setFamilyInput('')

        // Optimistic
        const tempId = Date.now().toString()
        const optimisticMsg = {
            id: tempId, initiator_id: userId, recipient_id: selectedFamilyId,
            message: text, created_at: new Date().toISOString()
        }
        setFamilyMessages(prev => [...prev, optimisticMsg])

        const { data, error } = await supabase.from('chats').insert([{
            initiator_id: userId, recipient_id: selectedFamilyId, message: text
        }]).select().single()

        if (error) {
            console.error('Error sending:', error)
            setFamilyMessages(prev => prev.filter(m => m.id !== tempId))
        } else if (data) {
            setFamilyMessages(prev => prev.map(m => m.id === tempId ? data : m))
        }
    }

    const handleSendPatient = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!patientInput.trim() || !selectedPatientId || !userId) return

        const patient = patients.find(p => p.id === selectedPatientId)
        if (!patient?.user_id) return

        const text = patientInput.trim()
        setPatientInput('')

        // Optimistic
        const tempId = Date.now().toString()
        const optimisticMsg = {
            id: tempId, initiator_id: userId, recipient_id: patient.user_id,
            message: text, created_at: new Date().toISOString()
        }
        setPatientMessages(prev => [...prev, optimisticMsg])

        const { data, error } = await supabase.from('chats').insert([{
            initiator_id: userId, recipient_id: patient.user_id, message: text
        }]).select().single()

        if (error) {
            console.error('Error sending:', error)
            setPatientMessages(prev => prev.filter(m => m.id !== tempId))
        } else if (data) {
            setPatientMessages(prev => prev.map(m => m.id === tempId ? data : m))
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="bg-white p-4 shadow-sm z-10">
                <div className="flex gap-4 mb-4 border-b overflow-x-auto">
                    <button
                        className={`pb-2 px-4 font-medium whitespace-nowrap ${activeTab === 'ai' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('ai')}
                    >
                        AI Assistant
                    </button>
                    <button
                        className={`pb-2 px-4 font-medium whitespace-nowrap ${activeTab === 'patient' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('patient')}
                    >
                        Patient Chat
                    </button>
                    <button
                        className={`pb-2 px-4 font-medium whitespace-nowrap ${activeTab === 'family' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
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

                {activeTab === 'patient' && (
                    <>
                        <h1 className="text-xl font-bold text-gray-800 mb-2">Patient Chat</h1>
                        <select
                            className="w-full p-2 border rounded-lg text-sm bg-gray-50"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                            <option value="">Select Patient to Chat...</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
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
                {activeTab === 'ai' && (
                    <>
                        {messages.map((msg, idx) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                key={idx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                    }`}>
                                    <p className="text-sm shadow-black drop-shadow-sm">{msg.content}</p>
                                </div>
                            </motion.div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2 text-gray-500 text-sm">
                                    <Loader2 className="animate-spin h-4 w-4" /> Thinking...
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'patient' && (
                    <>
                        {patientMessages.map((msg, idx) => {
                            const isMe = msg.initiator_id === userId
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    key={msg.id || idx}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                        }`}>
                                        {isVoice(msg.message) ? (
                                            <div className="flex items-center gap-2">
                                                <Mic size={14} className="opacity-60" />
                                                <audio src={getVoiceUrl(msg.message)} controls className="h-7 max-w-[180px]" />
                                            </div>
                                        ) : (
                                            <p className="text-sm">{msg.message}</p>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                        {patientMessages.length === 0 && selectedPatientId && (
                            <div className="text-center text-gray-500 mt-10">No messages yet. Say hello to your patient!</div>
                        )}
                        {!selectedPatientId && (
                            <div className="text-center text-gray-500 mt-10">Select a patient to chat.</div>
                        )}
                    </>
                )}

                {activeTab === 'family' && (
                    <>
                        {familyMessages.map((msg, idx) => {
                            const isMe = msg.initiator_id === userId
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    key={msg.id || idx}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                        }`}>
                                        {isVoice(msg.message) ? (
                                            <div className="flex items-center gap-2">
                                                <Mic size={14} className="opacity-60" />
                                                <audio src={getVoiceUrl(msg.message)} controls className="h-7 max-w-[180px]" />
                                            </div>
                                        ) : (
                                            <p className="text-sm">{msg.message}</p>
                                        )}
                                    </div>
                                </motion.div>
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
                {activeTab === 'ai' && (
                    <form onSubmit={handleSendAI} className="flex gap-2">
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
                )}

                {activeTab === 'patient' && (
                    <form onSubmit={handleSendPatient} className="flex gap-2 items-center">
                        <VoiceRecorder onSendVoice={handleSendPatientVoice} disabled={!selectedPatientId} />
                        <input
                            type="text"
                            className="flex-1 border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm"
                            placeholder="Message patient..."
                            value={patientInput}
                            onChange={(e) => setPatientInput(e.target.value)}
                            disabled={!selectedPatientId}
                        />
                        <button
                            type="submit"
                            disabled={!patientInput.trim() || !selectedPatientId}
                            className="w-11 h-11 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                )}

                {activeTab === 'family' && (
                    <form onSubmit={handleSendFamily} className="flex gap-2 items-center">
                        <VoiceRecorder onSendVoice={handleSendFamilyVoice} disabled={!selectedFamilyId} />
                        <input
                            type="text"
                            className="flex-1 border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-sm"
                            placeholder="Message family..."
                            value={familyInput}
                            onChange={(e) => setFamilyInput(e.target.value)}
                            disabled={!selectedFamilyId}
                        />
                        <button
                            type="submit"
                            disabled={!familyInput.trim() || !selectedFamilyId}
                            className="w-11 h-11 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors flex-shrink-0"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

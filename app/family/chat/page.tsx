'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Send, User, Mic } from 'lucide-react'
import VoiceRecorder from '@/components/VoiceRecorder'
import OrgPageBackground from '@/components/OrgPageBackground'

export default function FamilyChatPage() {
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [caretaker, setCaretaker] = useState<any>(null)
    const [patient, setPatient] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'caretaker' | 'patient'>('caretaker')
    const [userId, setUserId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchData()

        const channel = supabase
            .channel('public:chats')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
                const newMessage = payload.new
                setMessages(prev => {
                    if (prev.find(m => m.id === newMessage.id)) return prev
                    if (newMessage.recipient_id === userId || newMessage.initiator_id === userId) {
                        return [...prev, newMessage]
                    }
                    return prev
                })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId])

    useEffect(() => {
        scrollToBottom()
    }, [messages, activeTab])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            const { data: profile } = await supabase.from('profiles').select('linked_patient_id').eq('id', user.id).single()

            if (profile?.linked_patient_id) {
                // Get patient details including user_id for chat
                const { data: patientData } = await supabase
                    .from('patients')
                    .select('id, caretaker_id, name, user_id')
                    .eq('id', profile.linked_patient_id)
                    .single()

                setPatient(patientData)

                if (patientData?.caretaker_id) {
                    const { data: caretakerData } = await supabase.from('caretakers').select('user_id, name').eq('id', patientData.caretaker_id).single()
                    setCaretaker(caretakerData)
                }

                // Fetch all relevant history
                const { data: history } = await supabase
                    .from('chats')
                    .select('*')
                    .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)
                    .order('created_at', { ascending: true })

                setMessages(history || [])
            }
        } catch (error) {
            console.error('Error fetching chat data:', error)
        } finally {
            setLoading(false)
        }
    }

    const VOICE_PREFIX = '[VOICE]:'
    const isVoice = (msg: string) => msg?.startsWith(VOICE_PREFIX)
    const getVoiceUrl = (msg: string) => msg?.replace(VOICE_PREFIX, '')

    const handleSendVoice = async (audioBase64: string) => {
        if (!userId) return
        let recipientId = null
        if (activeTab === 'caretaker' && caretaker) recipientId = caretaker.user_id
        if (activeTab === 'patient' && patient) recipientId = patient.user_id
        if (!recipientId) return
        try {
            await supabase.from('chats').insert([{
                initiator_id: userId,
                recipient_id: recipientId,
                message: `${VOICE_PREFIX}${audioBase64}`
            }])
        } catch (err) { console.error('Voice send error:', err) }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !userId) return

        let recipientId = null
        if (activeTab === 'caretaker' && caretaker) recipientId = caretaker.user_id
        if (activeTab === 'patient' && patient) recipientId = patient.user_id

        if (!recipientId) return

        const text = input.trim()
        setInput('')

        try {
            const { error } = await supabase.from('chats').insert([
                {
                    initiator_id: userId,
                    recipient_id: recipientId,
                    message: text
                }
            ])
            if (error) throw error
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Failed to send message')
        }
    }

    // Filter messages for current tab
    const currentMessages = messages.filter(m => {
        const otherId = activeTab === 'caretaker' ? caretaker?.user_id : patient?.user_id
        if (!otherId) return false
        return (m.initiator_id === userId && m.recipient_id === otherId) ||
            (m.initiator_id === otherId && m.recipient_id === userId)
    })

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] relative">
            <OrgPageBackground />
            <div className="relative z-10 flex flex-col h-full">
                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveTab('caretaker')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'caretaker'
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Caretaker Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('patient')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${activeTab === 'patient'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Patient Chat
                    </button>
                </div>

                <div className="bg-white p-4 shadow-sm mb-4 rounded-xl border border-blue-100 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activeTab === 'caretaker' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                        <User size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-800">
                            {activeTab === 'caretaker'
                                ? (caretaker ? caretaker.name : 'No Caretaker Assigned')
                                : (patient ? patient.name : 'Linked Patient')}
                        </h2>
                        {((activeTab === 'caretaker' && caretaker) || (activeTab === 'patient' && patient)) &&
                            <p className="text-xs text-green-500 flex items-center gap-1">● Online</p>
                        }
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 p-2">
                    {currentMessages.map((msg) => {
                        const isMe = msg.initiator_id === userId
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                    ? (activeTab === 'caretaker' ? 'bg-indigo-600' : 'bg-blue-600') + ' text-white rounded-br-none'
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
                            </div>
                        )
                    })}
                    {loading && <div className="text-center text-gray-400 text-sm">Loading chat...</div>}

                    <div ref={messagesEndRef} />
                </div>

                <div className="mt-4 pt-2">
                    <form onSubmit={handleSend} className="flex gap-2 items-center">
                        <VoiceRecorder onSendVoice={handleSendVoice} />
                        <input
                            type="text"
                            className="flex-1 border border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm text-sm"
                            placeholder={`Message ${activeTab}...`}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={activeTab === 'caretaker' ? !caretaker : !patient}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || (activeTab === 'caretaker' ? !caretaker : !patient)}
                            className={`w-11 h-11 text-white rounded-full flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 flex-shrink-0 ${activeTab === 'caretaker' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

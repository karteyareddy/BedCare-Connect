'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Send, User, Users, ChevronLeft, Mic } from 'lucide-react'
import { motion } from 'framer-motion'
import VoiceRecorder from '@/components/VoiceRecorder'

const VOICE_PREFIX = '[VOICE]:'

function VoiceMessageBubble({ src }: { src: string }) {
    return (
        <div className="flex items-center gap-2">
            <Mic size={14} className="opacity-60 flex-shrink-0" />
            <audio src={src} controls className="h-7 max-w-[200px]" />
        </div>
    )
}

export default function PatientChatPage() {
    const [conversations, setConversations] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => { fetchData() }, [])

    useEffect(() => {
        if (!userId || !selectedUser) return
        loadChatHistory(selectedUser)

        const interval = setInterval(async () => {
            const { data: history } = await supabase
                .from('chats')
                .select('*')
                .or(`and(initiator_id.eq.${userId},recipient_id.eq.${selectedUser.user_id}),and(initiator_id.eq.${selectedUser.user_id},recipient_id.eq.${userId})`)
                .order('created_at', { ascending: true })
            if (history) setMessages(history)
        }, 2000)

        const channel = supabase.channel('public:chats')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, () => { })
            .subscribe()

        return () => { clearInterval(interval); supabase.removeChannel(channel) }
    }, [userId, selectedUser])

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            const { data: patient } = await supabase.from('patients').select('*').eq('user_id', user.id).single()
            if (!patient) return

            const convos = []
            if (patient.caretaker_id) {
                const { data: caretaker } = await supabase.from('caretakers').select('user_id, name, phone').eq('id', patient.caretaker_id).single()
                if (caretaker) convos.push({ ...caretaker, role: 'Caretaker', type: 'caretaker' })
            }

            const { data: familyMembers } = await supabase.from('profiles').select('id, full_name').eq('linked_patient_id', patient.id).eq('role', 'family')
            if (familyMembers) {
                familyMembers.forEach(fam => convos.push({ user_id: fam.id, name: fam.full_name, role: 'Family', type: 'family' }))
            }

            setConversations(convos)
        } catch (error) {
            console.error('Error fetching chat init:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const chatWithId = params.get('chatWith')
        if (chatWithId && conversations.length > 0 && !selectedUser) {
            const targetUser = conversations.find(c => c.user_id === chatWithId)
            if (targetUser) loadChatHistory(targetUser)
        }
    }, [conversations])

    const loadChatHistory = async (otherUser: any) => {
        if (!userId) return
        setSelectedUser(otherUser)
        setLoading(true)
        try {
            const { data: history } = await supabase
                .from('chats')
                .select('*')
                .or(`and(initiator_id.eq.${userId},recipient_id.eq.${otherUser.user_id}),and(initiator_id.eq.${otherUser.user_id},recipient_id.eq.${userId})`)
                .order('created_at', { ascending: true })
            setMessages(history || [])
        } catch (error) {
            console.error('Error loading history:', error)
        } finally {
            setLoading(false)
        }
    }

    const sendMessage = async (text: string) => {
        if (!text.trim() || !selectedUser || !userId) return
        setSending(true)
        try {
            const { error } = await supabase.from('chats').insert([{
                initiator_id: userId,
                recipient_id: selectedUser.user_id,
                message: text
            }])
            if (error) throw error
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Failed to send message')
        } finally {
            setSending(false)
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        const text = input.trim()
        if (!text) return
        setInput('')
        await sendMessage(text)
    }

    const handleSendVoice = async (audioBase64: string) => {
        await sendMessage(`${VOICE_PREFIX}${audioBase64}`)
    }

    const isVoice = (msg: string) => msg?.startsWith(VOICE_PREFIX)
    const getVoiceUrl = (msg: string) => msg?.replace(VOICE_PREFIX, '')

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            {!selectedUser ? (
                <div className="space-y-3">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Messages</h2>
                    {loading ? (
                        <p className="text-gray-500 text-sm text-center py-8">Loading contacts...</p>
                    ) : conversations.length === 0 ? (
                        <p className="text-gray-500 text-center py-10">No contacts found.</p>
                    ) : conversations.map(user => (
                        <div
                            key={user.user_id}
                            onClick={() => loadChatHistory(user)}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${user.type === 'caretaker' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                {user.type === 'caretaker' ? <User size={22} /> : <Users size={22} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">{user.name}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{user.role}</p>
                            </div>
                            <ChevronLeft size={18} className="text-gray-300 rotate-180" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Chat Header */}
                    <div className="bg-white p-3 shadow-sm mb-3 rounded-2xl border border-gray-100 flex items-center gap-3">
                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ChevronLeft size={22} />
                        </button>
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${selectedUser.type === 'caretaker' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {selectedUser.type === 'caretaker' ? <User size={20} /> : <Users size={20} />}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">{selectedUser.name}</h2>
                            <p className="text-xs text-green-500 flex items-center gap-1">● Online</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-3 p-2">
                        {messages.map((msg, idx) => {
                            const isMe = msg.initiator_id === userId
                            const voice = isVoice(msg.message)
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    key={msg.id || idx}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                                        }`}>
                                        {voice ? (
                                            <VoiceMessageBubble src={getVoiceUrl(msg.message)} />
                                        ) : (
                                            <p className="text-sm">{msg.message}</p>
                                        )}
                                        <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </motion.div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="mt-3 pt-2">
                        <form onSubmit={handleSend} className="flex gap-2 items-center">
                            <VoiceRecorder onSendVoice={handleSendVoice} disabled={sending} />
                            <input
                                type="text"
                                className="flex-1 border border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-black text-sm"
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || sending}
                                className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex-shrink-0"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    )
}

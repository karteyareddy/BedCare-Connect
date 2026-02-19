'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Send, User } from 'lucide-react'

export default function FamilyChatPage() {
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [caretaker, setCaretaker] = useState<any>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchData()

        // Subscribe to new messages
        const channel = supabase
            .channel('public:chats')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
                const newMessage = payload.new
                // Only add if it belongs to this conversation
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
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            // Get linked patient
            const { data: profile } = await supabase.from('profiles').select('linked_patient_id').eq('id', user.id).single()

            if (profile?.linked_patient_id) {
                // Get patient's caretaker
                const { data: patient } = await supabase.from('patients').select('caretaker_id').eq('id', profile.linked_patient_id).single()

                if (patient?.caretaker_id) {
                    const { data: caretakerData } = await supabase.from('caretakers').select('user_id, name').eq('id', patient.caretaker_id).single()
                    setCaretaker(caretakerData)

                    if (caretakerData) {
                        // Fetch history
                        const { data: history } = await supabase
                            .from('chats')
                            .select('*')
                            .or(`initiator_id.eq.${user.id},recipient_id.eq.${user.id}`)
                            .order('created_at', { ascending: true })

                        // Filter for this specific caretaker conversation if needed, 
                        // but for now, family only chats with one caretaker.
                        setMessages(history || [])
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching chat data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !caretaker || !userId) return

        const text = input.trim()
        setInput('')

        try {
            const { error } = await supabase.from('chats').insert([
                {
                    initiator_id: userId,
                    recipient_id: caretaker.user_id,
                    message: text
                }
            ])
            if (error) throw error
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Failed to send message')
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="bg-white p-4 shadow-sm mb-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <User size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-gray-800">{caretaker ? caretaker.name : 'No Caretaker Assigned'}</h2>
                    {caretaker && <p className="text-xs text-green-500 flex items-center gap-1">● Online</p>}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-2">
                {messages.map((msg) => {
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
                {loading && <div className="text-center text-gray-400 text-sm">Loading chat...</div>}
                {!loading && !caretaker && (
                    <div className="text-center text-gray-500">
                        <p>No caretaker is currently assigned to your patient.</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 pt-2">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                        placeholder="Message caretaker..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={!caretaker}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || !caretaker}
                        className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    )
}

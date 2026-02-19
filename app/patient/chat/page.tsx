'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Send, User, Users, ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PatientChatPage() {
    const [conversations, setConversations] = useState<any[]>([])
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (!userId || !selectedUser) return

        // 1. Initial Load
        loadChatHistory(selectedUser)

        // 2. Polling Interval (Every 2 seconds)
        const interval = setInterval(() => {
            const fetchUpdates = async () => {
                const { data: history } = await supabase
                    .from('chats')
                    .select('*')
                    .or(`and(initiator_id.eq.${userId},recipient_id.eq.${selectedUser.user_id}),and(initiator_id.eq.${selectedUser.user_id},recipient_id.eq.${userId})`)
                    .order('created_at', { ascending: true })

                if (history) {
                    // Simple Diff check or just replace.
                    // To avoid scroll jumping, we ideally check length, but replacing is safer for consistency if array is small.
                    setMessages(history)
                }
            }
            fetchUpdates()
        }, 2000)

        // 3. Keep Subscription
        const channel = supabase
            .channel('public:chats')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
                // Keep this for immediate updates if they work
            })
            .subscribe()

        return () => {
            clearInterval(interval)
            supabase.removeChannel(channel)
        }
    }, [userId, selectedUser])

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

            // 1. Get Patient Details
            const { data: patient } = await supabase.from('patients').select('*').eq('user_id', user.id).single()
            if (!patient) return

            const convos = []

            // 2. Get Caretaker
            if (patient.caretaker_id) {
                const { data: caretaker } = await supabase.from('caretakers').select('user_id, name, phone').eq('id', patient.caretaker_id).single()
                if (caretaker) {
                    convos.push({
                        ...caretaker,
                        role: 'Caretaker',
                        type: 'caretaker'
                    })
                }
            }

            // 3. Get Family Members
            const { data: familyMembers } = await supabase
                .from('profiles')
                .select('id, full_name') // id is the user_id
                .eq('linked_patient_id', patient.id)
                .eq('role', 'family')

            if (familyMembers) {
                familyMembers.forEach(fam => {
                    convos.push({
                        user_id: fam.id, // Profile ID is the Auth User ID
                        name: fam.full_name,
                        role: 'Family',
                        type: 'family'
                    })
                })
            }

            setConversations(convos)

        } catch (error) {
            console.error('Error fetching chat init:', error)
        } finally {
            setLoading(false)
        }
    }

    // Handle Deep Linking
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const chatWithId = params.get('chatWith')

        if (chatWithId && conversations.length > 0 && !selectedUser) {
            const targetUser = conversations.find(c => c.user_id === chatWithId)
            if (targetUser) {
                loadChatHistory(targetUser)
            }
        }
    }, [conversations])

    const loadChatHistory = async (otherUser: any) => {
        if (!userId) return
        setSelectedUser(otherUser)
        setLoading(true)
        try {
            // Fetch history only between me and the selected user
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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !selectedUser || !userId) return

        const text = input.trim()
        setInput('')

        // Optimistic UI update could go here

        try {
            const { error } = await supabase.from('chats').insert([
                {
                    initiator_id: userId,
                    recipient_id: selectedUser.user_id,
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
            {!selectedUser ? (
                // Conversation List
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Select a Conversation</h2>
                    {loading ? <p>Loading contacts...</p> : conversations.map(user => (
                        <div
                            key={user.user_id}
                            onClick={() => loadChatHistory(user)}
                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                            <div className={`p-3 rounded-full ${user.type === 'caretaker' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                {user.type === 'caretaker' ? <User size={24} /> : <Users size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{user.name}</h3>
                                <p className="text-sm text-gray-500">{user.role}</p>
                            </div>
                        </div>
                    ))}
                    {!loading && conversations.length === 0 && (
                        <p className="text-gray-500 text-center py-10">No contacts found.</p>
                    )}
                </div>
            ) : (
                // Chat Interface
                <>
                    <div className="bg-white p-3 shadow-sm mb-4 rounded-xl border border-blue-100 flex items-center gap-3">
                        <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={24} />
                        </button>
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedUser.type === 'caretaker' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {selectedUser.type === 'caretaker' ? <User size={20} /> : <Users size={20} />}
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800">{selectedUser.name}</h2>
                            <p className="text-xs text-green-500 flex items-center gap-1">● Online</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 p-2">
                        {messages.map((msg, idx) => {
                            const isMe = msg.initiator_id === userId
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    key={msg.id || idx}
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 rounded-bl-none border'
                                        }`}>
                                        <p className="text-sm">{msg.message}</p>
                                    </div>
                                </motion.div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="mt-4 pt-2">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-black"
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </>
            )}
        </div>
    )
}

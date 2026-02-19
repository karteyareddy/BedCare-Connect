'use client'

import { useState } from 'react'
import { Send, User } from 'lucide-react'

export default function FamilyChatPage() {
    // Mock Chat for Demo
    const [messages, setMessages] = useState([
        { id: 1, role: 'caretaker', text: 'Good morning! Just letting you know that breakfast was served and medication taken.' },
        { id: 2, role: 'user', text: 'Thank you! How was his mood today?' },
    ])
    const [input, setInput] = useState('')

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return
        setMessages([...messages, { id: Date.now(), role: 'user', text: input }])
        setInput('')
        // Simulate reply
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'caretaker', text: 'He is in good spirits! Watching TV now.' }])
        }, 2000)
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="bg-white p-4 shadow-sm mb-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <User size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-gray-800">Caretaker</h2>
                    <p className="text-xs text-green-500 flex items-center gap-1">● Online</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-2">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 rounded-bl-none border'
                            }`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-2">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 border rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                        placeholder="Message caretaker..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    )
}

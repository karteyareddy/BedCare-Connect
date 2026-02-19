'use client'

import React from 'react'
import Link from 'next/link'
import { Home, Users, CheckSquare, MessageSquare, Menu } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import { usePathname } from 'next/navigation'

export default function CaretakerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Top Bar */}
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-lg font-bold text-indigo-600">BedCare</h1>
                <LogoutButton />
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 pb-20">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t fixed bottom-0 left-0 right-0 z-20 pb-safe">
                <div className="flex justify-around items-center">
                    <Link href="/caretaker/dashboard" className={`flex flex-col items-center p-3 w-full ${isActive('/caretaker/dashboard') ? 'text-indigo-600' : 'text-gray-500'}`}>
                        <Home size={24} />
                        <span className="text-[10px] mt-1 font-medium">Home</span>
                    </Link>
                    <Link href="/caretaker/patients" className={`flex flex-col items-center p-3 w-full ${isActive('/caretaker/patients') ? 'text-indigo-600' : 'text-gray-500'}`}>
                        <Users size={24} />
                        <span className="text-[10px] mt-1 font-medium">Patients</span>
                    </Link>
                    <Link href="/caretaker/tasks" className={`flex flex-col items-center p-3 w-full ${isActive('/caretaker/tasks') ? 'text-indigo-600' : 'text-gray-500'}`}>
                        <CheckSquare size={24} />
                        <span className="text-[10px] mt-1 font-medium">Tasks</span>
                    </Link>
                    <Link href="/caretaker/chat" className={`flex flex-col items-center p-3 w-full ${isActive('/caretaker/chat') ? 'text-indigo-600' : 'text-gray-500'}`}>
                        <MessageSquare size={24} />
                        <span className="text-[10px] mt-1 font-medium">Chat</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}

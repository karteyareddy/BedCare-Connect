'use client'

import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, MessageSquare, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'

export default function FamilyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Desktop Sidebar (visible on md and up) */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    <h1 className="text-xl font-bold text-indigo-600">BedCare Family</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/family/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/family/dashboard') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/family/chat" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/family/chat') ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <MessageSquare size={20} />
                        <span>Chat</span>
                    </Link>
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header (hidden on md and up) */}
                <header className="md:hidden bg-white shadow p-4 flex justify-between items-center z-10">
                    <h1 className="text-xl font-bold text-indigo-600">BedCare Family</h1>
                    <button onClick={handleSignOut} className="text-gray-500 hover:text-red-500">
                        <LogOut size={24} />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
                    <div className="max-w-4xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Bottom Nav for Mobile (hidden on md and up) */}
            <nav className="md:hidden bg-white border-t fixed bottom-0 left-0 right-0 z-20 pb-safe">
                <div className="flex justify-around items-center">
                    <Link href="/family/dashboard" className={`flex flex-col items-center p-3 w-full ${isActive('/family/dashboard') ? 'text-indigo-600' : 'text-gray-500'}`}>
                        <LayoutDashboard size={24} />
                        <span className="text-[10px] mt-1 font-medium">Progress</span>
                    </Link>
                    <Link href="/family/chat" className={`flex flex-col items-center p-3 w-full ${isActive('/family/chat') ? 'text-indigo-600' : 'text-gray-500'}`}>
                        <MessageSquare size={24} />
                        <span className="text-[10px] mt-1 font-medium">Chat</span>
                    </Link>
                </div>
            </nav>
        </div>
    )
}

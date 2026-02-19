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
        <div className="flex flex-col min-h-screen bg-gray-50">
            <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-indigo-600">BedCare Family</h1>
                <button onClick={handleSignOut} className="text-gray-500 hover:text-red-500">
                    <LogOut size={24} />
                </button>
            </header>

            <main className="flex-1 p-4 pb-20">
                {children}
            </main>

            {/* Bottom Nav for Mobile Family Experience (assuming mobile first for them too) */}
            <nav className="bg-white border-t fixed bottom-0 left-0 right-0 z-20 pb-safe">
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

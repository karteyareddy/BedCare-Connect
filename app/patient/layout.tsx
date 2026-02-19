'use client'

import React from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function PatientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-blue-50">
            <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-xl font-bold text-blue-600">BedCare Patient</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/patient/chat')} className="text-gray-500 hover:text-blue-500">
                        Chat
                    </button>
                    <button onClick={handleSignOut} className="text-gray-500 hover:text-red-500">
                        <LogOut size={24} />
                    </button>
                </div>
            </header>
            <main className="p-4 max-w-2xl mx-auto">
                {children}
            </main>
        </div>
    )
}

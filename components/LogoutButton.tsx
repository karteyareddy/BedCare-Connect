'use client'

import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton({ className = "" }: { className?: string }) {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <button
            onClick={handleSignOut}
            className={`flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors ${className}`}
            title="Sign Out"
        >
            <LogOut size={20} />
            <span className="hidden md:inline">Logout</span>
        </button>
    )
}

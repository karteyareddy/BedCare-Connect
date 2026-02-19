'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2, Lock } from 'lucide-react'

export default function OrganizationGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true)
    const [paused, setPaused] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()

    useEffect(() => {
        checkStatus()
    }, [pathname])

    const checkStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Get profile to find org_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single()

            if (!profile?.organization_id) {
                setLoading(false)
                return
            }

            // 2. Check Org Status
            const { data: org } = await supabase
                .from('organizations')
                .select('status')
                .eq('id', profile.organization_id)
                .single()

            if (org?.status === 'paused') {
                setPaused(true)
            } else {
                setPaused(false)
            }

        } catch (error) {
            console.error('Error checking org status:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>

    if (paused) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Suspended</h1>
                    <p className="text-gray-600 mb-6">
                        Your organization's access to BedCare Connect has been temporarily paused by the administrator.
                    </p>
                    <p className="text-sm text-gray-500">
                        Please contact support or your system administrator for assistance.
                    </p>
                    <button
                        onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
                        className="mt-8 text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

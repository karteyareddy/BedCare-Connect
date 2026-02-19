'use client'

import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, Users, UserPlus, FileText, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import OrganizationGuard from '@/components/OrganizationGuard'

export default function OrgAdminLayout({
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
        <OrganizationGuard>
            <div className="flex h-screen bg-gray-100">
                {/* Sidebar */}
                <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold text-indigo-600">BedCare</h2>
                        <p className="text-xs text-gray-500">Org Admin Portal</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        <Link href="/org-admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </Link>
                        <Link href="/org-admin/caretakers" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                            <Users size={20} />
                            <span>Caretakers</span>
                        </Link>
                        <Link href="/org-admin/patients" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                            <UserPlus size={20} />
                            <span>Patients</span>
                        </Link>
                        <Link href="/org-admin/tasks" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                            <FileText size={20} />
                            <span>Tasks</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
                            <FileText size={20} />
                            <span>Reports</span>
                        </Link>
                    </nav>
                    <div className="p-4 border-t">
                        <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors">
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </OrganizationGuard>
    )
}

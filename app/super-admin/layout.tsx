'use client'

import React from 'react'
import Sidebar from '@/components/Sidebar'
import { LayoutDashboard, Building, PlusCircle } from 'lucide-react'

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const navItems = [
        { label: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
        { label: 'Create Org', href: '/super-admin/create-organization', icon: PlusCircle },
    ]

    return (
        <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
            <Sidebar title="BedCare Super" items={navItems} />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    )
}

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Users, UserPlus, FileText, LogOut, Menu, Activity, PieChart, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import OrganizationGuard from '@/components/OrganizationGuard'
import { useLanguage } from '@/components/LanguageProvider'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function OrgAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
    const { t } = useLanguage()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    const navItems = [
        { href: '/org-admin/dashboard', icon: LayoutDashboard, label: t('common.dashboard') },
        { href: '/org-admin/caretakers', icon: Users, label: t('common.caretakers') },
        { href: '/org-admin/patients', icon: Activity, label: t('common.patients') },
        { href: '/org-admin/tasks', icon: FileText, label: t('common.tasks') },
        { href: '/org-admin/families', icon: Users, label: t('common.families') },
        { href: '/org-admin/reports', icon: PieChart, label: t('common.reports') },
    ]

    return (
        <OrganizationGuard>
            <div className="flex h-screen bg-gray-100">
                {/* Sidebar */}
                <aside
                    className={`bg-white shadow-xl hidden md:flex flex-col transition-all duration-300 ease-in-out z-20 ${isSidebarExpanded ? 'w-64' : 'w-20'
                        }`}
                    onMouseEnter={() => setIsSidebarExpanded(true)}
                    onMouseLeave={() => setIsSidebarExpanded(false)}
                >
                    <div className="p-6 border-b flex items-center justify-between whitespace-nowrap h-20">
                        {isSidebarExpanded ? (
                            <div className="transition-opacity duration-300 opacity-100">
                                <h2 className="text-2xl font-bold text-indigo-600">{t('common.appName')}</h2>
                                <p className="text-xs text-gray-500">{t('common.orgAdmin')}</p>
                            </div>
                        ) : (
                            <div className="w-full flex justify-center transition-opacity duration-300">
                                <span className="text-2xl font-bold text-indigo-600">B</span>
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 p-3 space-y-2 overflow-x-hidden">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 whitespace-nowrap ${isActive(item.href)
                                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 line-clamp-1'
                                    } ${!isSidebarExpanded ? 'justify-center' : ''}`}
                            >
                                <item.icon size={24} className={`flex-shrink-0 ${isActive(item.href) ? 'text-indigo-600' : 'text-gray-400'}`} />
                                <span className={`transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 translate-x-0 ml-2' : 'opacity-0 -translate-x-4 hidden w-0'
                                    }`}>
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </nav>

                    <div className="p-4 border-t border-gray-100 space-y-2">
                        {/* Language Switcher */}
                        <div className={`transition-all duration-300 ${!isSidebarExpanded ? 'flex justify-center' : ''}`}>
                            {isSidebarExpanded ? (
                                <LanguageSwitcher />
                            ) : (
                                <div className="text-gray-500">
                                    <Globe size={24} />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSignOut}
                            className={`flex items-center gap-4 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full transition-all duration-200 whitespace-nowrap ${!isSidebarExpanded ? 'justify-center' : ''}`}
                        >
                            <LogOut size={24} className="flex-shrink-0" />
                            <span className={`transition-all duration-300 ${isSidebarExpanded ? 'opacity-100 translate-x-0 ml-2' : 'opacity-0 -translate-x-4 hidden w-0'
                                }`}>
                                {t('common.signOut')}
                            </span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-300">
                    {children}
                </main>
            </div>
        </OrganizationGuard>
    )
}

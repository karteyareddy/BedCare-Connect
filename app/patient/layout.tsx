'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, MessageCircle, LayoutDashboard, Heart, ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const supabase = createClient()
    const { t } = useLanguage()
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    // Auto-collapse on narrow desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                setCollapsed(true)
            } else if (window.innerWidth >= 1024) {
                setCollapsed(false)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Close mobile sidebar on route change
    useEffect(() => { setMobileOpen(false) }, [pathname])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    const navItems = [
        { href: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/patient/chat', icon: MessageCircle, label: t('common.chat') },
    ]

    const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
        <div className={`flex flex-col h-full ${mobile ? 'w-64' : ''}`}>
            {/* Logo */}
            <div className={`flex items-center border-b border-gray-100 ${collapsed && !mobile ? 'p-3 justify-center' : 'p-5 gap-2'}`}>
                <div
                    className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
                    onClick={() => !mobile && setCollapsed(c => !c)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <span className="text-white text-sm font-bold">B</span>
                </div>
                {(!collapsed || mobile) && (
                    <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap overflow-hidden">
                        BedCare <span className="text-blue-600">Patient</span>
                    </h1>
                )}
            </div>

            {/* Nav */}
            <nav className={`flex-1 space-y-1 ${collapsed && !mobile ? 'p-2' : 'p-4'}`}>
                {navItems.map(({ href, icon: Icon, label }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center rounded-xl font-medium transition-all ${collapsed && !mobile ? 'p-3 justify-center' : 'gap-3 px-4 py-3'
                            } ${isActive(href) ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                        title={collapsed && !mobile ? label : undefined}
                    >
                        <Icon size={20} className="flex-shrink-0" />
                        {(!collapsed || mobile) && <span>{label}</span>}
                    </Link>
                ))}
            </nav>

            {/* Health badge */}
            {(!collapsed || mobile) && (
                <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                        <Heart size={14} className="text-pink-500" />
                        <span className="text-xs font-bold text-blue-700">Health Status</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                        <span className="text-xs text-gray-600 font-medium">All Good</span>
                    </div>
                </div>
            )}

            {/* Bottom */}
            <div className={`border-t border-gray-100 ${collapsed && !mobile ? 'p-2 space-y-1' : 'p-4 space-y-1'}`}>
                {(!collapsed || mobile) && (
                    <div className="px-2 py-1">
                        <LanguageSwitcher />
                    </div>
                )}
                <button
                    onClick={handleSignOut}
                    className={`flex items-center w-full text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium ${collapsed && !mobile ? 'p-3 justify-center' : 'gap-3 px-4 py-3'
                        }`}
                    title={collapsed && !mobile ? t('common.signOut') : undefined}
                >
                    <LogOut size={20} />
                    {(!collapsed || mobile) && <span>{t('common.signOut')}</span>}
                </button>
            </div>

            {/* Collapse toggle (desktop only) */}
            {!mobile && (
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors z-10"
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            )}
        </div>
    )

    return (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50">

            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:block relative bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'
                    }`}
            >
                <SidebarContent />
            </aside>

            {/* Mobile Overlay Sidebar */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 md:hidden flex">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="relative z-50 bg-white shadow-xl w-64 h-full">
                        <SidebarContent mobile />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">

                {/* Mobile Header */}
                <header className="md:hidden bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 p-4 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <Menu size={22} />
                        </button>
                        <h1 className="text-base font-bold text-gray-900">
                            BedCare <span className="text-blue-600">Patient</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <button onClick={handleSignOut} className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 pb-24 md:pb-6">
                    <div className="max-w-[1600px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden bg-white border-t border-gray-100 fixed bottom-0 left-0 right-0 z-20">
                <div className="flex justify-around items-center">
                    {navItems.map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} className={`flex flex-col items-center p-3 flex-1 transition-colors ${isActive(href) ? 'text-blue-600' : 'text-gray-400'}`}>
                            <Icon size={22} />
                            <span className="text-[10px] mt-1 font-medium">{label}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    )
}

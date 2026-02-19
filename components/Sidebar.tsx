'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, LayoutDashboard, Settings } from 'lucide-react'
import LogoutButton from './LogoutButton'

interface SidebarItem {
    label: string
    href: string
    icon: React.ElementType
}

interface SidebarProps {
    title: string
    items: SidebarItem[]
}

export default function Sidebar({ title, items }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-20">
                <span className="font-bold text-lg text-indigo-600">{title}</span>
                <button onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
                md:translate-x-0 md:static md:inset-auto md:shadow-none md:border-r border-gray-200
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 hidden md:block">
                        <h2 className="text-2xl font-bold text-indigo-600">{title}</h2>
                    </div>

                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {items.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)} // Close on mobile click
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.href)
                                            ? 'bg-indigo-50 text-indigo-600 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-100">
                        <div className="px-4 py-3 flex items-center gap-3 text-gray-600 hover:text-red-600 cursor-pointer">
                            <LogoutButton className="w-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-20 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    )
}

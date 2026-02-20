'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Plus, Loader2, Trash2, Search, User, Phone, Mail, UserCheck } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'

export default function ManageCaretakersPage() {
    const [caretakers, setCaretakers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    })
    const [creating, setCreating] = useState(false)
    const { t } = useLanguage()

    const supabase = createClient()

    useEffect(() => {
        fetchCaretakers()
    }, [])

    const fetchCaretakers = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

            if (profile?.organization_id) {
                const { data, error } = await supabase
                    .from('caretakers')
                    .select('*')
                    .eq('organization_id', profile.organization_id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setCaretakers(data || [])
            }
        } catch (error) {
            console.error('Error fetching caretakers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            if (formData.password.length < 6) {
                throw new Error('Password must be at least 6 characters')
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            if (!profile?.organization_id) throw new Error('No organization found for admin')

            const response = await fetch('/api/admin/create-caretaker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password,
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    organization_id: profile.organization_id
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to create caretaker')

            setShowModal(false)
            fetchCaretakers()
            setFormData({ name: '', email: '', password: '', phone: '' })
            // Optional: Add toast notification here
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to create caretaker')
        } finally {
            setCreating(false)
        }
    }

    const filteredCaretakers = caretakers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    )

    return (
        <div className="p-6 md:p-10 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('caretakers.title')}</h1>
                    <p className="text-gray-500 mt-1">{t('caretakers.subtitle')}</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <Plus size={20} />
                    {t('caretakers.addCaretaker')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('caretakers.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    {t('caretakers.showing')} <span className="font-semibold text-gray-900">{filteredCaretakers.length}</span> {t('caretakers.staffMembers')}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCaretakers.map((caretaker) => (
                    <div key={caretaker.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <User size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 line-clamp-1">{caretaker.name}</h3>
                                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    {t('caretakers.active')}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600 mb-6">
                            <div className="flex items-center gap-3">
                                <Phone size={16} className="text-gray-400" />
                                <span>{caretaker.phone}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-gray-400" />
                                <span className="truncate">{caretaker.email || t('caretakers.noEmail')}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-50">
                            <button className="flex-1 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                {t('caretakers.viewDetails')}
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredCaretakers.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <UserCheck size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">{t('caretakers.noCaretakersFound')}</h3>
                        <p className="mt-1">{t('caretakers.tryAdjusting')}</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">{t('caretakers.addNewTitle')}</h2>
                            <p className="text-sm text-gray-500 mt-1">{t('caretakers.addNewSubtitle')}</p>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('caretakers.fullName')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Sarah Jones"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="e.g. sarah@bedcare.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('caretakers.phone')}</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="e.g. +1 234 567 8900"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all"
                                >
                                    {creating && <Loader2 className="animate-spin h-4 w-4" />}
                                    {t('caretakers.createAccount')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

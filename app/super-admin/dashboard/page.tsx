'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Plus, Building, Users, Trash2, PauseCircle, PlayCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { useLanguage } from '@/components/LanguageProvider'

export default function SuperAdminDashboard() {
    const { t } = useLanguage()
    const [organizations, setOrganizations] = useState<any[]>([])
    const [stats, setStats] = useState({
        totalOrgs: 0,
        totalPatients: 0,
        totalCaretakers: 0
    })
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrganizations(data || [])
            setStats(prev => ({ ...prev, totalOrgs: data?.length || 0 }))
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (orgId: string, currentStatus: string) => {
        setActionLoading(orgId)
        try {
            const newStatus = currentStatus === 'active' ? 'paused' : 'active'
            const res = await fetch('/api/super-admin/manage-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'TOGGLE_STATUS', organization_id: orgId, status: newStatus })
            })
            if (!res.ok) throw new Error('Failed to update status')

            setOrganizations(orgs => orgs.map(org =>
                org.id === orgId ? { ...org, status: newStatus } : org
            ))
        } catch (error) {
            alert(t('superAdminPortal.updateError'))
        } finally {
            setActionLoading(null)
        }
    }

    const handleDelete = async (orgId: string) => {
        if (!confirm(t('superAdminPortal.deleteConfirm'))) return

        setActionLoading(orgId)
        try {
            const res = await fetch('/api/super-admin/manage-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', organization_id: orgId })
            })
            if (!res.ok) throw new Error('Failed to delete')

            setOrganizations(orgs => orgs.filter(org => org.id !== orgId))
            setStats(prev => ({ ...prev, totalOrgs: prev.totalOrgs - 1 }))
        } catch (error) {
            alert(t('superAdminPortal.deleteError'))
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <header className="mb-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">{t('superAdminPortal.dashboardTitle')}</h1>
                <div className="flex gap-3">
                    <Link href="/super-admin/create-organization" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                        <Plus size={20} />
                        {t('superAdminPortal.createOrganization')}
                    </Link>
                    <LogoutButton />
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                            <Building size={24} />
                        </div>
                        <div>
                            <h3 className="text-gray-500 text-sm">{t('superAdminPortal.totalOrganizations')}</h3>
                            <p className="text-2xl font-bold">{stats.totalOrgs}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organizations List */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-700">{t('superAdminPortal.allOrganizations')}</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.name')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.owner')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.createdAt')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {organizations.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-4 text-center">{t('superAdminPortal.noOrganizationsFound')}</td></tr>
                        ) : (
                            organizations.map((org) => (
                                <tr key={org.id} className={org.status === 'paused' ? 'bg-gray-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                                        {org.status === 'paused' && <span className="text-xs text-red-500 font-bold">{t('common.paused').toUpperCase()}</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{org.owner_name}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{new Date(org.created_at).toLocaleDateString()}</div></td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${org.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {org.status === 'paused' ? t('common.paused') : t('common.active')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(org.id, org.status)}
                                                disabled={actionLoading === org.id}
                                                className={`text-xs px-2 py-1 rounded border ${org.status === 'paused' ? 'border-green-300 text-green-600 hover:bg-green-50' : 'border-yellow-300 text-yellow-600 hover:bg-yellow-50'}`}
                                            >
                                                {actionLoading === org.id ? <Loader2 className="animate-spin" size={14} /> : (org.status === 'paused' ? t('common.resume') : t('common.pause'))}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(org.id)}
                                                disabled={actionLoading === org.id}
                                                className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                                            >
                                                {actionLoading === org.id ? <Loader2 className="animate-spin" size={14} /> : t('common.delete')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

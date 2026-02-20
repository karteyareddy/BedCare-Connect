'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { FileText, User, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3, PieChart, ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'

export default function ReportsPage() {
    const { t } = useLanguage()
    const [caretakers, setCaretakers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [orgName, setOrgName] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Get Organization ID
            const { data: orgData, error: orgError } = await supabase
                .from('profiles')
                .select('organization_id, organizations(name)')
                .eq('id', user.id)
                .single()

            if (orgError || !orgData?.organization_id) {
                console.error('Error fetching organization:', orgError)
                return
            }

            const orgId = orgData.organization_id
            // @ts-ignore
            setOrgName(orgData.organizations?.name || 'Organization')

            // 2. Fetch Caretakers linked to this Org
            const { data: caretakersData, error: ctError } = await supabase
                .from('caretakers')
                .select(`
                    id,
                    name,
                    phone,
                    specialization,
                    organization_id
                `)
                .eq('organization_id', orgId)

            if (ctError) throw ctError

            // 3. Fetch Tasks for these caretakers to calculate stats
            const reports = await Promise.all((caretakersData || []).map(async (caretaker) => {
                // Get assigned patient
                const { data: patientData } = await supabase
                    .from('patients')
                    .select('id, name, room_number')
                    .eq('caretaker_id', caretaker.id)
                    .single()

                let stats = {
                    total: 0,
                    completed: 0,
                    pending: 0,
                    completionRate: 0
                }

                if (patientData) {
                    const { data: tasks } = await supabase
                        .from('tasks')
                        .select('status')
                        .eq('patient_id', patientData.id)

                    if (tasks) {
                        stats.total = tasks.length
                        stats.completed = tasks.filter(t => t.status === 'completed').length
                        stats.pending = tasks.filter(t => t.status === 'pending').length
                        stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
                    }
                }

                return {
                    ...caretaker,
                    patient: patientData,
                    stats
                }
            }))

            setCaretakers(reports)

        } catch (error) {
            console.error('Error fetching reports:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">{t('common.loading')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-10 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('reports.title')}</h1>
                    <p className="text-gray-500 mt-1">{t('reports.subtitle')} <span className="font-semibold text-gray-700">{orgName}</span></p>
                </div>
                <div className="bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-100 flex items-center gap-3 text-sm font-medium text-gray-600">
                    <User size={18} className="text-indigo-600" />
                    <span>{t('reports.totalStaff')}: <span className="font-bold text-gray-900">{caretakers.length}</span></span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6">
                {caretakers.map((caretaker) => (
                    <div key={caretaker.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-md transition-all duration-300">
                        <div className="flex flex-col lg:flex-row gap-8 lg:items-center">

                            {/* Staff Profile */}
                            <div className="lg:w-1/3 flex items-start gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                    <span className="text-xl font-bold">{caretaker.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{caretaker.name}</h3>
                                    <p className="text-sm text-gray-500 mb-2">{caretaker.specialization || 'General Nurse'}</p>
                                    {caretaker.patient ? (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                            {t('reports.assignedTo')}: {caretaker.patient.name} ({caretaker.patient.room_number})
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                                            <AlertCircle size={12} />
                                            {t('reports.noActiveAssignment')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Divider for mobile */}
                            <div className="h-px w-full bg-gray-100 lg:hidden"></div>

                            {/* Stats Cards */}
                            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-4">

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative overflow-hidden group">
                                    <div className="absolute right-2 top-2 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <FileText size={40} />
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('reports.totalTasks')}</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-gray-900">{caretaker.stats.total}</span>
                                        <span className="text-xs text-gray-400 mb-1">{t('reports.tasks')}</span>
                                    </div>
                                </div>

                                <div className="bg-green-50 rounded-xl p-4 border border-green-100 relative overflow-hidden group">
                                    <div className="absolute right-2 top-2 opacity-5 text-green-600 group-hover:opacity-10 transition-opacity">
                                        <CheckCircle size={40} />
                                    </div>
                                    <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">{t('reports.completed')}</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-green-700">{caretaker.stats.completed}</span>
                                        <div className="flex items-center text-xs text-green-600 mb-1 bg-white/50 px-1.5 rounded">
                                            <ArrowUpRight size={10} className="mr-0.5" />
                                            {caretaker.stats.completionRate}%
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 relative overflow-hidden group">
                                    <div className="absolute right-2 top-2 opacity-5 text-orange-600 group-hover:opacity-10 transition-opacity">
                                        <Clock size={40} />
                                    </div>
                                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-1">{t('reports.pending')}</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-orange-700">{caretaker.stats.pending}</span>
                                        <span className="text-xs text-orange-600/70 mb-1">{t('reports.remaining')}</span>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6 pt-6 border-t border-gray-50">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('reports.efficiency')}</span>
                                <span className="text-sm font-bold text-gray-900">{caretaker.stats.completionRate}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${caretaker.stats.completionRate >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                                        caretaker.stats.completionRate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                                            'bg-gradient-to-r from-red-500 to-pink-500'
                                        }`}
                                    style={{ width: `${caretaker.stats.completionRate}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}

                {caretakers.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{t('reports.noData')}</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">{t('reports.noDataDesc')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

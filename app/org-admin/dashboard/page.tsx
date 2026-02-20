'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Users, UserCheck, AlertTriangle, FileCheck, CheckCircle, Clock, Activity, ArrowUpRight } from 'lucide-react'
import TaskCompletionChart from '@/components/TaskCompletionChart'
import TaskStatusPieChart from '@/components/TaskStatusPieChart'
import { useLanguage } from '@/components/LanguageProvider'

export default function OrgAdminDashboard() {
    const [stats, setStats] = useState({
        caretakers: 0,
        patients: 0,
        alerts: 0,
        tasksCompleted: 0,
        tasksPending: 0
    })
    const [recentAlerts, setRecentAlerts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [chartData, setChartData] = useState<any[]>([])
    const [pieData, setPieData] = useState({ completed: 0, pending: 0 })
    const { t } = useLanguage()

    const supabase = createClient()

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) return

            // 1. Get Organization ID
            const { data: orgData, error: orgError } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', user.id)
                .single()

            if (orgError || !orgData || !orgData.organization_id) {
                console.error('Error fetching organization:', orgError)
                return
            }

            const orgId = orgData.organization_id

            // 2. Fetch Stats
            const { count: caretakersCount } = await supabase
                .from('caretakers')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId)

            const { count: patientsCount } = await supabase
                .from('patients')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', orgId)

            // Get all patient IDs for this org to filter alerts and tasks
            const { data: orgPatients } = await supabase
                .from('patients')
                .select('id')
                .eq('organization_id', orgId)

            const patientIds = orgPatients?.map(p => p.id) || []

            let alertsCount = 0
            let tasksCompletedCount = 0
            let tasksPendingCount = 0
            let recentAlertsData: any[] = []
            let chartTasks: any[] = []

            if (patientIds.length > 0) {
                const { count: aCount } = await supabase
                    .from('alerts')
                    .select('*', { count: 'exact', head: true })
                    .in('patient_id', patientIds)
                    .eq('status', 'active')
                alertsCount = aCount || 0

                const { count: tCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .in('patient_id', patientIds)
                    .eq('status', 'completed')
                tasksCompletedCount = tCount || 0

                const { count: pCount } = await supabase
                    .from('tasks')
                    .select('*', { count: 'exact', head: true })
                    .in('patient_id', patientIds)
                    .eq('status', 'pending')
                tasksPendingCount = pCount || 0

                // Fetch Recent Alerts
                const { data: rAlerts } = await supabase
                    .from('alerts')
                    .select(`
                        id,
                        type,
                        created_at,
                        patients (
                            name,
                            room_number
                        )
                    `)
                    .in('patient_id', patientIds)
                    .eq('status', 'active')
                    .order('created_at', { ascending: false })
                    .limit(5)
                recentAlertsData = rAlerts || []

                // Fetch Tasks for Chart (Last 7 Days)
                const { data: cTasks } = await supabase
                    .from('tasks')
                    .select('*')
                    .in('patient_id', patientIds)
                    .gte('due_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                chartTasks = cTasks || []
            }

            setStats({
                caretakers: caretakersCount || 0,
                patients: patientsCount || 0,
                alerts: alertsCount,
                tasksCompleted: tasksCompletedCount,
                tasksPending: tasksPendingCount
            })
            setRecentAlerts(recentAlertsData)

            // Process Chart Data
            if (chartTasks.length >= 0) {
                // 1. Pie Stats
                const completed = chartTasks.filter(t => t.status === 'completed').length
                const pending = chartTasks.filter(t => t.status === 'pending').length
                setPieData({ completed, pending })

                // 2. Bar Chart
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    return d.toISOString().split('T')[0]
                }).reverse()

                const chart = last7Days.map(date => {
                    const dayTasks = chartTasks.filter(t => t.due_date?.startsWith(date))
                    return {
                        date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                        completed: dayTasks.filter(t => t.status === 'completed').length,
                        pending: dayTasks.filter(t => t.status === 'pending').length
                    }
                })
                setChartData(chart)
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDismiss = async (id: string) => {
        if (!confirm('Mark alert as resolved?')) return
        try {
            await supabase.from('alerts').update({ status: 'resolved' }).eq('id', id)
            fetchDashboardData() // Refresh
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="p-6 md:p-10 space-y-8 bg-gray-50/50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('common.dashboard')}</h1>
                    <p className="text-gray-500 mt-1">{t('common.performanceMetrics')} BedCare</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                    <Activity size={16} className="text-green-500" />
                    <span>System Operational</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{t('common.totalStaff')}</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">{stats.caretakers}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-600">
                        <ArrowUpRight size={14} />
                        <span>Active</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{t('common.activePatients')}</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-green-600 transition-colors">{stats.patients}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                            <UserCheck size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-500">
                        <span>Registered</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{t('common.pending')}</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-amber-600 transition-colors">{stats.tasksPending}</h3>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-amber-600">
                        <span>Needs Attention</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">{t('common.completed')}</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-purple-600 transition-colors">{stats.tasksCompleted}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                            <FileCheck size={24} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-600">
                        <ArrowUpRight size={14} />
                        <span>This Week</span>
                    </div>
                </div>
            </div>

            {/* Active Alerts Section */}
            {stats.alerts > 0 && (
                <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 rounded-lg text-red-600 animate-pulse">
                            <AlertTriangle size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">{t('common.pendingAlerts')}</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {recentAlerts.map(alert => (
                            <div key={alert.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full uppercase tracking-wide">Emergency</span>
                                        <span className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{alert.patients?.name || 'Unknown Patient'}</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {t('common.room')}: <span className="font-medium">{alert.patients?.room_number || 'N/A'}</span> • Type: {alert.type}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDismiss(alert.id)}
                                    className="w-full py-2 bg-white border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    Mark as Resolved
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">{t('common.taskCompletionRate')}</h3>
                    <div className="h-80 w-full">
                        <TaskCompletionChart data={chartData} />
                    </div>
                </div>
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">{t('common.taskStatusOverview')}</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        <TaskStatusPieChart completed={pieData.completed} pending={pieData.pending} />
                    </div>
                </div>
            </div>
        </div>
    )
}

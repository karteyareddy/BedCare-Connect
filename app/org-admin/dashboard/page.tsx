'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import {
    Activity, Users, ClipboardList, AlertTriangle,
    TrendingUp
} from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'
import { useLanguage } from '@/components/LanguageProvider'

export default function DashboardPage() {
    const { t } = useLanguage()
    const [stats, setStats] = useState({
        totalStaff: 0,
        activePatients: 0,
        pendingAlerts: 0,
        todayTasks: 0
    })
    const [alerts, setAlerts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [chartData, setChartData] = useState<any[]>([])
    const [pieData, setPieData] = useState({ completed: 0, pending: 0, overdue: 0 })

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

            if (profile?.organization_id) {
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
                const dateStr = sevenDaysAgo.toISOString().split('T')[0]

                // Fetch Counts and Chart Data
                const [staff, patients, alertsData, tasks, chartTasks] = await Promise.all([
                    supabase.from('caretakers').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id),
                    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id),
                    supabase.from('alerts').select(`
            *,
            patients (name)
          `).eq('organization_id', profile.organization_id).eq('status', 'active').order('created_at', { ascending: false }).limit(5),
                    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('due_date', new Date().toISOString().split('T')[0]),
                    supabase.from('tasks').select('*').eq('organization_id', profile.organization_id).gte('due_date', dateStr)
                ])

                setStats({
                    totalStaff: staff.count || 0,
                    activePatients: patients.count || 0,
                    pendingAlerts: alertsData.data?.length || 0,
                    todayTasks: tasks.count || 0
                })

                if (alertsData.data) setAlerts(alertsData.data)

                // Process Chart Data
                if (chartTasks.data) {
                    processChartData(chartTasks.data)
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const processChartData = (tasks: any[]) => {
        const today = new Date().toISOString().split('T')[0]

        // Pie Chart Stats
        let completed = 0
        let pending = 0
        let overdue = 0

        tasks.forEach(task => {
            const taskDate = task.due_date ? task.due_date.split('T')[0] : ''

            if (task.status === 'completed') {
                completed++
            } else {
                if (taskDate < today && taskDate !== '') {
                    overdue++
                } else {
                    pending++
                }
            }
        })
        setPieData({ completed, pending, overdue })

        // Bar Chart (Last 7 Days)
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - i)
            return d.toISOString().split('T')[0]
        }).reverse()

        const chart = last7Days.map(date => {
            // Robust check: handles 'YYYY-MM-DD' or ISO timestamps
            const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(date))
            return {
                name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                completed: dayTasks.filter(t => t.status === 'completed').length,
                pending: dayTasks.filter(t => t.status !== 'completed').length
            }
        })
        setChartData(chart)
    }

    const handleResolveAlert = async (id: string) => {
        if (!confirm(t('common.confirmResolve'))) return

        const { error } = await supabase
            .from('alerts')
            .update({ status: 'resolved' })
            .eq('id', id)

        if (!error) {
            fetchData()
        }
    }

    const taskCompletionData = chartData
    const taskStatusData = [
        { name: t('common.completed'), value: pieData.completed },
        { name: t('common.pending'), value: pieData.pending },
        { name: t('common.overdue'), value: pieData.overdue },
    ]

    const COLORS = ['#10B981', '#F59E0B', '#EF4444']

    return (
        <div className="p-6 md:p-10 space-y-8 bg-gray-50/50 min-h-screen">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('common.dashboard')}</h1>
                <p className="text-gray-500 mt-1">{t('common.performanceMetrics')} BedCare</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('common.totalStaff')}</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStaff}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('common.activePatients')}</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.activePatients}</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                        <Activity size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('common.pendingAlerts')}</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingAlerts}</h3>
                    </div>
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center animate-pulse">
                        <AlertTriangle size={24} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">{t('common.todayTasks')}</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.todayTasks}</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <ClipboardList size={24} />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">{t('common.taskCompletionRate')}</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskCompletionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="completed" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={32} />
                                <Bar dataKey="pending" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">{t('common.taskStatusOverview')}</h3>
                    <div className="h-72 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={taskStatusData}
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {taskStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value, entry: any) => (
                                        <span className="text-gray-600 font-medium ml-1">
                                            {value} <span className="text-gray-400">({entry.payload.value})</span>
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Alerts & Health */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Alerts List */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">{t('common.pendingAlerts')}</h3>
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">{t('common.needsAttention')}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {alerts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <CheckCircle className="mx-auto h-10 w-10 text-green-400 mb-3" />
                                <p>{t('common.systemOperational')}</p>
                            </div>
                        ) : (
                            alerts.map(alert => (
                                <div key={alert.id} className="p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="mt-1">
                                        <AlertTriangle size={20} className="text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-medium text-gray-900">{alert.message}</h4>
                                            <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{t('common.type')}: <span className="font-medium capitalize">{alert.type}</span></p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                {alert.patients?.name || t('common.unknown')}
                                            </span>
                                            <button
                                                onClick={() => handleResolveAlert(alert.id)}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                {t('common.markResolved')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Organization Health */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity size={120} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">{t('common.organizationHealth')}</h3>
                    <p className="text-indigo-100 text-sm mb-6">{t('common.performanceMetrics')}</p>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>{t('common.systemOperational')}</span>
                                <span className="font-bold">98%</span>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 w-[98%] rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>{t('caretakers.active')}</span>
                                <span className="font-bold">100%</span>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 w-full rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>{t('common.registered')}</span>
                                <span className="font-bold">85%</span>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-400 w-[85%] rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                        <div>
                            <p className="text-indigo-100 text-xs uppercase tracking-wider">{t('common.thisWeek')}</p>
                            <p className="text-2xl font-bold">+24%</p>
                        </div>
                        <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    )
}

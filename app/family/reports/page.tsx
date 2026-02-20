'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import dynamic from 'next/dynamic'
import { BarChart2, TrendingUp, CheckCircle, Clock } from 'lucide-react'
import OrgPageBackground from '@/components/OrgPageBackground'

const TaskStatusPieChart = dynamic(() => import('@/components/TaskStatusPieChart'), { ssr: false })
const TaskCompletionChart = dynamic(() => import('@/components/TaskCompletionChart'), { ssr: false })

export default function FamilyReportsPage() {
    const [patient, setPatient] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [pieData, setPieData] = useState({ completed: 0, pending: 0 })
    const [chartData, setChartData] = useState<any[]>([])
    const [weeklyStats, setWeeklyStats] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('linked_patient_id')
                .eq('id', user.id)
                .single()

            if (profile?.linked_patient_id) {
                const { data: patientData } = await supabase
                    .from('patients')
                    .select('name')
                    .eq('id', profile.linked_patient_id)
                    .single()

                setPatient(patientData)

                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('patient_id', profile.linked_patient_id)

                if (tasksData) {
                    const completed = tasksData.filter(t => t.status === 'completed').length
                    const pending = tasksData.filter(t => t.status !== 'completed').length
                    setPieData({ completed, pending })

                    // Build last 7 days chart
                    const last7Days = [...Array(7)].map((_, i) => {
                        const d = new Date()
                        d.setDate(d.getDate() - i)
                        return d.toISOString().split('T')[0]
                    }).reverse()

                    const chart = last7Days.map(date => {
                        const dayTasks = tasksData.filter(t => t.due_date?.startsWith(date))
                        return {
                            date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                            completed: dayTasks.filter(t => t.status === 'completed').length,
                            pending: dayTasks.filter(t => t.status !== 'completed').length
                        }
                    })
                    setChartData(chart)

                    // Weekly breakdown
                    const weekly = last7Days.map(date => {
                        const dayTasks = tasksData.filter(t => t.due_date?.startsWith(date))
                        const comp = dayTasks.filter(t => t.status === 'completed').length
                        const total = dayTasks.length
                        return {
                            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                            completed: comp,
                            pending: total - comp,
                            total,
                            pct: total > 0 ? Math.round((comp / total) * 100) : 0
                        }
                    }).filter(d => d.total > 0)
                    setWeeklyStats(weekly)
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    const total = pieData.completed + pieData.pending
    const completionRate = total > 0 ? Math.round((pieData.completed / total) * 100) : 0

    return (
        <div className="space-y-6 pb-10 relative">
            <OrgPageBackground />
            <div className="relative z-10">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Care Reports</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {patient ? `Data visualization for ${patient.name}` : 'Care analytics and trends'}
                    </p>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-sm text-center">
                        <p className="text-2xl font-bold">{total}</p>
                        <p className="text-xs text-indigo-200 mt-1">Total Tasks</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-sm text-center">
                        <p className="text-2xl font-bold">{pieData.completed}</p>
                        <p className="text-xs text-emerald-200 mt-1">Completed</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-sm text-center">
                        <p className="text-2xl font-bold">{completionRate}%</p>
                        <p className="text-xs text-amber-200 mt-1">Success Rate</p>
                    </div>
                </div>

                {/* Charts */}
                {total > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <BarChart2 size={16} className="text-indigo-600" />
                                    </div>
                                    <h2 className="font-bold text-gray-800">Task Status Overview</h2>
                                </div>
                                <TaskStatusPieChart completed={pieData.completed} pending={pieData.pending} />
                            </div>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <TrendingUp size={16} className="text-emerald-600" />
                                    </div>
                                    <h2 className="font-bold text-gray-800">7-Day Completion Trend</h2>
                                </div>
                                <TaskCompletionChart data={chartData} />
                            </div>
                        </div>

                        {/* Weekly Breakdown Table */}
                        {weeklyStats.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h2 className="font-bold text-gray-800">Daily Breakdown</h2>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {weeklyStats.map((day, i) => (
                                        <div key={i} className="px-6 py-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-semibold text-gray-700">{day.date}</p>
                                                <span className="text-xs text-gray-400">{day.total} tasks</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                                                        style={{ width: `${day.pct}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle size={12} />{day.completed}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-amber-600">
                                                        <Clock size={12} />{day.pending}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <BarChart2 size={40} className="text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No data available yet</p>
                        <p className="text-gray-400 text-sm mt-1">Reports will appear once tasks are assigned</p>
                    </div>
                )}
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Users, UserCheck, AlertTriangle, FileCheck, CheckCircle } from 'lucide-react'

export default function OrgAdminDashboard() {
    const [stats, setStats] = useState({
        caretakers: 0,
        patients: 0,
        alerts: 0,
        tasksCompleted: 0
    })
    const [recentAlerts, setRecentAlerts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)

            const { count: caretakersCount } = await supabase.from('caretakers').select('*', { count: 'exact', head: true })
            const { count: patientsCount } = await supabase.from('patients').select('*', { count: 'exact', head: true })
            const { count: alertsCount } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'active')
            const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed')

            setStats({
                caretakers: caretakersCount || 0,
                patients: patientsCount || 0,
                alerts: alertsCount || 0,
                tasksCompleted: tasksCount || 0
            })

            // Fetch actual alerts details
            const { data: alertsData } = await supabase
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
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(5)

            setRecentAlerts(alertsData || [])

        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDismiss = async (id: string) => {
        if (!confirm('Mark alert as resolved?')) return
        try {
            await supabase.from('alerts').update({ status: 'resolved' }).eq('id', id)
            fetchStats() // Refresh
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.patients}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Active Caretakers</h3>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.caretakers}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-green-600">
                            <UserCheck size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Active Alerts</h3>
                            <p className="text-3xl font-bold text-red-600 mt-2">{stats.alerts}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-red-600">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-gray-500 text-sm font-medium">Tasks Completed</h3>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.tasksCompleted}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                            <FileCheck size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Alerts Section */}
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={24} />
                    Active Emergency Alerts
                </h2>
                {recentAlerts.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-green-50 rounded-lg border border-green-100">
                        <CheckCircle className="inline-block mr-2 text-green-500" size={20} />
                        No active alerts. All systems normal.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentAlerts.map(alert => (
                            <div key={alert.id} className="flex justify-between items-center bg-red-50 p-4 rounded-lg border border-red-200 animate-pulse">
                                <div>
                                    <p className="font-bold text-red-800">
                                        {alert.type} - {alert.patients?.name || 'Unknown Patient'}
                                    </p>
                                    <p className="text-sm text-red-600">
                                        Room: {alert.patients?.room_number || 'N/A'} • {new Date(alert.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDismiss(alert.id)}
                                    className="px-4 py-2 bg-white text-red-600 text-sm font-bold rounded shadow hover:bg-red-50"
                                >
                                    Resolve
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Status</h2>
                <div className="text-center py-8 text-gray-500">
                    No recent activity to display.
                </div>
            </div>
        </div>
    )
}

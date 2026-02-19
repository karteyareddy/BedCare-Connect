'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Users, UserCheck, AlertTriangle, FileCheck } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

export default function OrgAdminDashboard() {
    const [stats, setStats] = useState({
        caretakers: 0,
        patients: 0,
        alerts: 0,
        tasksCompleted: 0
    })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)
            // In a real app, these would be separate queries or a stored procedure
            // For now, we mock or fetch all (which is inefficient but fine for MVP)

            const { count: caretakersCount } = await supabase.from('caretakers').select('*', { count: 'exact', head: true })
            const { count: patientsCount } = await supabase.from('patients').select('*', { count: 'exact', head: true })
            const { count: alertsCount } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'active')
            // tasks completed today?
            const { count: tasksCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed')

            setStats({
                caretakers: caretakersCount || 0,
                patients: patientsCount || 0,
                alerts: alertsCount || 0,
                tasksCompleted: tasksCount || 0
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
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

            {/* Recent Activity or other sections can go here */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Status</h2>
                <div className="text-center py-8 text-gray-500">
                    No recent activity to display.
                </div>
            </div>
        </div>
    )
}

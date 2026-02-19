'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { MapPin, Activity, AlertTriangle, Clock, CheckSquare, Camera, Link, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function CaretakerDashboard() {
    const supabase = createClient()
    const router = useRouter()
    const [patient, setPatient] = useState<any>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAssignedPatient()
    }, [])

    const fetchAssignedPatient = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get caretaker ID
            const { data: caretaker } = await supabase.from('caretakers').select('id').eq('user_id', user.id).single()

            if (caretaker) {
                // Fetch SINGLE patient assigned to this caretaker
                const { data: patientData, error: patientError } = await supabase
                    .from('patients')
                    .select(`
                        *,
                        alerts (id, type, status, created_at)
                    `)
                    .eq('caretaker_id', caretaker.id)
                    .single() // Expecting only one

                if (patientData) {
                    setPatient(patientData)

                    // Fetch tasks for this patient
                    const { data: tasksData } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('patient_id', patientData.id)
                        .order('due_date', { ascending: true })

                    setTasks(tasksData || [])
                }
            }
        } catch (error) {
            console.error('Error fetching patient:', error)
        } finally {
            setLoading(false)
        }
    }

    const markTaskComplete = async (taskId: string) => {
        // In a real app, this would open the camera/proof upload flow
        // For now, simple toggle or redirect to tasks page
        router.push('/caretaker/tasks')
    }

    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    if (!patient) {
        return (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <User size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Patient Assigned</h3>
                <p className="text-gray-500 mt-2">You currently do not have any patient assigned to you. Please contact your administrator.</p>
            </div>
        )
    }

    const activeAlerts = patient.alerts?.filter((a: any) => a.status === 'active') || []

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">My Patient</h2>
                <p className="text-gray-500 text-sm">Today&apos;s active assignment</p>
            </div>

            {/* Patient Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{patient.name}</h2>

                <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={18} className="text-indigo-500" />
                        <span>Room: <span className="font-semibold text-gray-900">{patient.room_number || 'N/A'}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Activity size={18} className="text-green-500" />
                        <span>Status: <span className="font-semibold text-gray-900">{patient.condition || 'Stable'}</span></span>
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            {activeAlerts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-pulse">
                    <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                        <AlertTriangle size={20} />
                        Active Alerts ({activeAlerts.length})
                    </h3>
                    <div className="space-y-2">
                        {activeAlerts.map((alert: any) => (
                            <div key={alert.id} className="bg-white p-3 rounded-md shadow-sm text-sm text-red-600 flex justify-between items-center">
                                <span>{alert.type} Alert</span>
                                <span className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tasks Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Assigned Tasks</h3>
                </div>

                <div className="space-y-3">
                    {tasks.length === 0 ? (
                        <p className="text-gray-500 text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">No tasks pending for today.</p>
                    ) : (
                        tasks.map((task) => (
                            <div key={task.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center ${task.status === 'completed' ? 'opacity-60' : ''}`}>
                                <div>
                                    <h4 className={`font-semibold ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>Due: {task.due_date ? new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}</span>
                                        </div>
                                    </div>
                                </div>

                                {task.status !== 'completed' && (
                                    <button
                                        onClick={() => markTaskComplete(task.id)}
                                        className="bg-indigo-100 text-indigo-600 p-2 rounded-full hover:bg-indigo-200 transition-colors"
                                        title="Complete Task"
                                    >
                                        <Camera size={20} />
                                    </button>
                                )}
                                {task.status === 'completed' && (
                                    <div className="text-green-500">
                                        <CheckSquare size={24} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, MapPin, Activity, AlertTriangle, CheckSquare, Clock, Camera } from 'lucide-react'
import Link from 'next/link'
import OrgPageBackground from '@/components/OrgPageBackground'

function PatientDetailsContent() {
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const router = useRouter()
    const supabase = createClient()
    const [patient, setPatient] = useState<any>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchPatientDetails(id)
        }
    }, [id])

    const fetchPatientDetails = async (patientId: string) => {
        try {
            setLoading(true)
            // 1. Fetch Patient Info & Alerts
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select(`
                    *,
                    alerts (id, type, status, created_at)
                `)
                .eq('id', patientId)
                .single()

            if (patientError) throw patientError
            setPatient(patientData)

            // 2. Fetch Tasks for this patient
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('patient_id', patientId)
                .order('due_date', { ascending: true })

            if (tasksError) throw tasksError
            setTasks(tasksData || [])

        } catch (error) {
            console.error('Error fetching details:', error)
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
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
    }

    if (!patient) {
        return <div className="p-4 text-center">Patient not found</div>
    }

    const activeAlerts = patient.alerts?.filter((a: any) => a.status === 'active') || []

    return (
        <div className="min-h-screen pb-20 relative">
            <OrgPageBackground />
            <div className="relative z-10">
                {/* Header */}
                <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800">Patient Details</h1>
                </div>

                <div className="p-4 space-y-6">
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
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-bold text-gray-400">Age:</span>
                                <span>{patient.age}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-bold text-gray-400">Gender:</span>
                                <span>{patient.gender}</span>
                            </div>
                        </div>
                    </div>

                    {/* Alerts Section (if any) */}
                    {activeAlerts.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
                                <AlertTriangle size={20} />
                                Active Alerts
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
                            <Link href="/caretaker/tasks" className="text-indigo-600 text-sm font-medium hover:underline">View All</Link>
                        </div>

                        <div className="space-y-3">
                            {tasks.length === 0 ? (
                                <p className="text-gray-500 text-center py-4 bg-white rounded-xl border border-dashed border-gray-300">No tasks assigned.</p>
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
            </div>
        </div>
    )
}

export default function PatientDetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
            <PatientDetailsContent />
        </Suspense>
    )
}

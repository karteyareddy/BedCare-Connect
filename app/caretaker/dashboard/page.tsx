'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { MapPin, Activity, AlertTriangle, Clock, CheckSquare, Camera, User, Shield, ChevronRight, Stethoscope } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/LanguageProvider'
import { motion } from 'framer-motion'

export default function CaretakerDashboard() {
    const supabase = createClient()
    const router = useRouter()
    const { t } = useLanguage()
    const [patient, setPatient] = useState<any>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [caretakerName, setCaretakerName] = useState('')

    useEffect(() => {
        fetchAssignedPatient()
    }, [])

    const fetchAssignedPatient = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()
            if (profile?.full_name) setCaretakerName(profile.full_name.split(' ')[0])

            const { data: caretaker } = await supabase
                .from('caretakers')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (caretaker) {
                const { data: patientData } = await supabase
                    .from('patients')
                    .select(`*, alerts (id, type, status, created_at)`)
                    .eq('caretaker_id', caretaker.id)
                    .single()

                if (patientData) {
                    setPatient(patientData)
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
        router.push('/caretaker/tasks')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    if (!patient) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200"
            >
                <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User size={36} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('caretakerPortal.noPatient')}</h3>
                <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm">{t('caretakerPortal.noPatientDesc')}</p>
            </motion.div>
        )
    }

    const activeAlerts = patient.alerts?.filter((a: any) => a.status === 'active') || []
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const pendingTasks = tasks.filter(t => t.status !== 'completed').length
    const completionPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

    const conditionColor = patient.condition?.toLowerCase() === 'critical'
        ? { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
        : patient.condition?.toLowerCase() === 'stable'
            ? { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' }
            : { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }

    return (
        <div className="space-y-5 pb-10">

            {/* Welcome Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield size={16} className="text-emerald-200" />
                            <span className="text-emerald-100 text-sm font-medium">
                                {t('caretakerPortal.subtitle')}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold">
                            {caretakerName ? `Hi, ${caretakerName} 👋` : 'Welcome 👋'}
                        </h1>
                        <p className="text-emerald-100 text-sm mt-0.5">
                            {pendingTasks > 0
                                ? `${pendingTasks} task${pendingTasks > 1 ? 's' : ''} pending today`
                                : 'All tasks completed! 🎉'}
                        </p>
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <Stethoscope size={26} className="text-white" />
                    </div>
                </div>

                {/* Progress Bar */}
                {tasks.length > 0 && (
                    <div className="mt-5">
                        <div className="flex justify-between text-xs text-emerald-100 mb-1.5">
                            <span>{t('caretakerPortal.assignedTasks')}</span>
                            <span>{completedTasks}/{tasks.length} • {completionPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPct}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-white rounded-full"
                            />
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4"
                >
                    <h3 className="text-red-800 font-bold flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle size={16} className="text-red-600" />
                        </div>
                        {t('caretakerPortal.activeAlerts')} ({activeAlerts.length})
                    </h3>
                    <div className="space-y-2">
                        {activeAlerts.map((alert: any) => (
                            <div key={alert.id} className="bg-white p-3 rounded-xl shadow-sm text-sm flex justify-between items-center border border-red-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    <span className="text-red-700 font-medium">{alert.type} {t('caretakerPortal.alertSuffix')}</span>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Patient Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <User size={16} className="text-emerald-600" />
                    </div>
                    <h2 className="font-bold text-gray-800">{t('caretakerPortal.title')}</h2>
                </div>
                <div className="p-5">
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-white text-2xl font-bold">{patient.name?.charAt(0)}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mt-1 ${conditionColor.bg} ${conditionColor.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${conditionColor.dot}`}></span>
                                {patient.condition || t('caretakerPortal.stable')}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <MapPin size={15} className="text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">{t('caretakerPortal.room')}</p>
                                <p className="text-sm font-semibold text-gray-800">{patient.room_number || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Activity size={15} className="text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">{t('caretakerPortal.status')}</p>
                                <p className="text-sm font-semibold text-gray-800">{patient.condition || t('caretakerPortal.stable')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tasks Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">{t('caretakerPortal.assignedTasks')}</h3>
                    {pendingTasks > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                            {pendingTasks} pending
                        </span>
                    )}
                </div>

                {tasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">
                        <CheckSquare size={32} className="mx-auto mb-2 text-gray-300" />
                        {t('caretakerPortal.noTasks')}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {tasks.map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.04 }}
                                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${task.status === 'completed' ? 'opacity-60' : ''}`}
                            >
                                {/* Status indicator */}
                                <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-green-400' : 'bg-amber-400'}`} />

                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                        <Clock size={11} />
                                        <span>
                                            {t('caretakerPortal.due')}: {task.due_date
                                                ? new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : t('caretakerPortal.today')}
                                        </span>
                                    </div>
                                </div>

                                {task.status === 'completed' ? (
                                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckSquare size={18} className="text-green-600" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => markTaskComplete(task.id)}
                                        className="w-9 h-9 bg-emerald-100 hover:bg-emerald-200 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                                        title={t('caretakerPortal.completeTask')}
                                    >
                                        <Camera size={18} />
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

        </div>
    )
}

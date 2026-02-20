'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Heart, Phone, User, MapPin, Activity, CheckCircle, Clock, Stethoscope, Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'

export default function FamilyDashboard() {
    const { t } = useLanguage()
    const [patient, setPatient] = useState<any>(null)
    const [caretaker, setCaretaker] = useState<any>(null)
    const [familyName, setFamilyName] = useState<string>('')
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ completed: 0, pending: 0, total: 0 })
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get family member's profile (name + linked patient)
            const { data: profile } = await supabase
                .from('profiles')
                .select('linked_patient_id, full_name')
                .eq('id', user.id)
                .single()

            if (profile?.full_name) {
                setFamilyName(profile.full_name.split(' ')[0])
            }

            if (profile?.linked_patient_id) {
                const { data: patientData } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', profile.linked_patient_id)
                    .single()

                setPatient(patientData)

                if (patientData) {
                    // Fetch caretaker details
                    if (patientData.caretaker_id) {
                        const { data: caretakerData } = await supabase
                            .from('caretakers')
                            .select('*')
                            .eq('id', patientData.caretaker_id)
                            .single()
                        setCaretaker(caretakerData)
                    }

                    // Fetch recent tasks (last 5)
                    const { data: tasksData } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('patient_id', patientData.id)
                        .order('due_date', { ascending: false })
                        .limit(5)

                    setTasks(tasksData || [])

                    // Count stats
                    const { data: allTasks } = await supabase
                        .from('tasks')
                        .select('status')
                        .eq('patient_id', patientData.id)

                    const completed = allTasks?.filter(t => t.status === 'completed').length || 0
                    const pending = allTasks?.filter(t => t.status === 'pending').length || 0
                    setStats({ completed, pending, total: (allTasks?.length || 0) })
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

    const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    return (
        <div className="space-y-6 pb-10">

            {/* Greeting Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={20} className="text-yellow-300" />
                            <span className="text-indigo-200 text-sm font-medium">{t('familyPortal.portalLabel')}</span>
                        </div>
                        <h1 className="text-2xl font-bold mb-1">
                            {t('familyPortal.greeting')} {familyName || 'there'} 👋
                        </h1>
                        {patient ? (
                            <p className="text-indigo-100 text-sm">
                                <span className="font-semibold text-white">{patient.name}</span> {t('familyPortal.patientCareMessage')}
                            </p>
                        ) : (
                            <p className="text-indigo-100 text-sm">{t('familyPortal.noPatientLinked')}</p>
                        )}
                    </div>
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <Heart size={28} className="text-pink-300" />
                    </div>
                </div>

                {/* Quick Stats */}
                {stats.total > 0 && (
                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm text-center">
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-indigo-200">{t('familyPortal.totalTasks')}</p>
                        </div>
                        <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm text-center">
                            <p className="text-2xl font-bold text-green-300">{stats.completed}</p>
                            <p className="text-xs text-indigo-200">{t('common.completed')}</p>
                        </div>
                        <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm text-center">
                            <p className="text-2xl font-bold text-yellow-300">{completionPct}%</p>
                            <p className="text-xs text-indigo-200">{t('familyPortal.done')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Patient Details Card */}
            {patient && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <User size={18} className="text-blue-600" />
                            </div>
                            <h2 className="font-bold text-gray-800 text-lg">{t('familyPortal.patientDetails')}</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                                <span className="text-white text-2xl font-bold">{patient.name?.charAt(0)}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{patient.name}</h3>
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${patient.condition?.toLowerCase() === 'critical'
                                    ? 'bg-red-100 text-red-700'
                                    : patient.condition?.toLowerCase() === 'stable'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    <Activity size={10} />
                                    {patient.condition || 'Stable'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <MapPin size={16} className="text-indigo-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">{t('familyPortal.room')}</p>
                                    <p className="text-sm font-semibold text-gray-800">{patient.room_number || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Activity size={16} className="text-green-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">{t('familyPortal.status')}</p>
                                    <p className="text-sm font-semibold text-gray-800">{patient.condition || t('familyPortal.stable')}</p>
                                </div>
                            </div>
                            {patient.age && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <User size={16} className="text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">{t('familyPortal.age')}</p>
                                        <p className="text-sm font-semibold text-gray-800">{patient.age} {t('familyPortal.years')}</p>
                                    </div>
                                </div>
                            )}
                            {patient.diagnosis && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl col-span-2">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Stethoscope size={16} className="text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">{t('familyPortal.diagnosis')}</p>
                                        <p className="text-sm font-semibold text-gray-800">{patient.diagnosis}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Caretaker Details Card */}
            {caretaker && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Stethoscope size={18} className="text-emerald-600" />
                            </div>
                            <h2 className="font-bold text-gray-800 text-lg">{t('familyPortal.caretakerDetails')}</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-white text-xl font-bold">{caretaker.name?.charAt(0)}</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{caretaker.name}</h3>
                                    <p className="text-sm text-gray-500">{caretaker.phone}</p>
                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        {t('familyPortal.activeCaretaker')}
                                    </span>
                                </div>
                            </div>
                            <a
                                href={`tel:${caretaker.phone}`}
                                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                <Phone size={16} />
                                <span className="text-sm">{t('familyPortal.call')}</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            {tasks.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-800 text-lg">{t('familyPortal.recentActivity')}</h2>
                        <a href="/family/tasks" className="text-sm text-indigo-600 font-medium hover:text-indigo-700">{t('familyPortal.viewAll')} →</a>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {tasks.map((task) => (
                            <div key={task.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${task.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'
                                    }`}>
                                    {task.status === 'completed'
                                        ? <CheckCircle size={18} className="text-green-600" />
                                        : <Clock size={18} className="text-amber-600" />
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold truncate ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                        {task.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : t('familyPortal.noDate')}
                                    </p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${task.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {task.status === 'completed' ? t('familyPortal.doneBadge') : t('familyPortal.pendingBadge')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!patient && !loading && (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={28} className="text-gray-400" />
                    </div>
                    <h3 className="text-gray-700 font-semibold text-lg">{t('familyPortal.noPatientTitle')}</h3>
                    <p className="text-gray-400 text-sm mt-1">{t('familyPortal.noPatientDesc')}</p>
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useNetworkStatus } from '@/components/NetworkStatusProvider'
import { addToSyncQueue } from '@/lib/offlineStorage'
import { AlertCircle, Phone, User as UserIcon, Clock, MessageCircle, Heart, Activity, Shield, Siren } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/components/LanguageProvider'

export default function PatientDashboard() {
    const { t } = useLanguage()
    const [patient, setPatient] = useState<any>(null)
    const [caretaker, setCaretaker] = useState<any>(null)
    const [tasks, setTasks] = useState<any[]>([])
    const [familyMembers, setFamilyMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [emergencyLoading, setEmergencyLoading] = useState(false)

    const { online } = useNetworkStatus()
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: patientData } = await supabase.from('patients').select('*').eq('user_id', user.id).single()

            if (patientData) {
                setPatient(patientData)

                if (patientData.caretaker_id) {
                    const { data: caretakerData } = await supabase.from('caretakers').select('*').eq('id', patientData.caretaker_id).single()
                    setCaretaker(caretakerData)
                }

                const { data: familyData } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('linked_patient_id', patientData.id)
                    .eq('role', 'family')

                setFamilyMembers(familyData?.map(f => ({ ...f, user_id: f.id })) || [])

                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('patient_id', patientData.id)
                    .eq('status', 'pending')
                    .order('due_date', { ascending: true })

                setTasks(tasksData || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEmergency = async () => {
        if (!patient) return
        if (!confirm(t('patientPortal.confirmEmergency'))) return

        setEmergencyLoading(true)
        try {
            const alertData = { patient_id: patient.id, organization_id: patient.organization_id, type: 'EMERGENCY', status: 'active' }

            if (online) {
                const { error } = await supabase.from('alerts').insert([alertData])
                if (error) throw error

                const { data: { user } } = await supabase.auth.getUser()
                if (caretaker && user) {
                    await supabase.from('chats').insert([{ initiator_id: user.id, recipient_id: caretaker.user_id, message: t('patientPortal.emergencyMessage') }])
                }
                if (familyMembers.length > 0 && user) {
                    await supabase.from('chats').insert(familyMembers.map(member => ({ initiator_id: user.id, recipient_id: member.id, message: t('patientPortal.emergencyMessage') })))
                }
                alert(t('patientPortal.emergencySent'))
            } else {
                await addToSyncQueue('alerts', 'POST', alertData)
                alert(t('patientPortal.emergencyQueued'))
            }
        } catch (error) {
            console.error('Emergency Error:', error)
            alert(t('patientPortal.emergencyFailed'))
        } finally {
            setEmergencyLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-5 pb-10"
        >
            {/* Greeting Banner — full width */}
            {patient && (
                <motion.div
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 md:p-6 text-white shadow-lg"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-blue-200 text-sm font-medium mb-1">Welcome back 👋</p>
                            <h1 className="text-2xl md:text-3xl font-bold">{patient.name}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex items-center gap-1 text-xs bg-white/20 px-2.5 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                    Active Patient
                                </span>
                                {patient.room_number && (
                                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">Room {patient.room_number}</span>
                                )}
                            </div>
                        </div>
                        <div className="bg-white/20 rounded-xl p-3">
                            <Heart size={26} className="text-pink-300" />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Desktop 2-column grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* LEFT COLUMN */}
                <div className="space-y-8">

                    {/* Emergency Button */}
                    <motion.button
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring' }}
                        onClick={handleEmergency}
                        disabled={emergencyLoading}
                        className="w-full relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-10 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                    >
                        {/* Pulse rings */}
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-32 h-32 rounded-full bg-white/10 animate-ping absolute"></span>
                            <span className="w-20 h-20 rounded-full bg-white/10 animate-ping absolute" style={{ animationDelay: '0.5s' }}></span>
                        </span>
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <Siren size={34} />
                            </div>
                            <span className="text-2xl font-extrabold tracking-wide">{t('patientPortal.emergencyHelp')}</span>
                            <span className="text-xs font-normal bg-white/20 px-3 py-1 rounded-full">{t('patientPortal.tapToAlert')}</span>
                        </div>
                    </motion.button>

                    {/* Today's Schedule */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Activity size={15} className="text-blue-500" />
                                {t('patientPortal.todaySchedule')}
                            </h2>
                            <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2.5 py-1 rounded-full">{tasks.length} pending</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {tasks.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Activity size={22} className="text-green-500" />
                                    </div>
                                    <p className="text-gray-500 font-medium text-sm">{t('patientPortal.noPendingTasks')}</p>
                                </div>
                            ) : (
                                tasks.map((task, index) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + (index * 0.07) }}
                                    >
                                        <div className="flex items-stretch">
                                            <div className="w-1.5 bg-gradient-to-b from-blue-400 to-indigo-500 flex-shrink-0" />
                                            <div className="flex-1 p-4 flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 text-sm">{task.title}</h3>
                                                    {task.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1.5 rounded-xl ml-3 flex-shrink-0">
                                                    <Clock size={12} />
                                                    {task.due_date
                                                        ? new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : t('patientPortal.anytime')
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">

                    {/* Caretaker Card */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <Shield size={15} className="text-blue-600" />
                                </div>
                                <h2 className="font-bold text-gray-700 text-sm">{t('patientPortal.yourCaretaker')}</h2>
                            </div>
                        </div>
                        <div className="p-5">
                            {caretaker ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                                            <span className="text-white text-lg font-bold">{caretaker.name?.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{caretaker.name}</p>
                                            <p className="text-gray-500 text-sm flex items-center gap-1">
                                                <Phone size={12} />{caretaker.phone}
                                            </p>
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium mt-0.5 text-emerald-600">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>On Duty
                                            </span>
                                        </div>
                                    </div>
                                    <a
                                        href={`tel:${caretaker.phone}`}
                                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm text-sm"
                                    >
                                        <Phone size={15} /> Call
                                    </a>
                                </div>
                            ) : (
                                <p className="text-gray-400 italic text-sm">{t('patientPortal.noCaretakerAssigned')}</p>
                            )}
                        </div>
                    </motion.div>

                    {/* Family Card */}
                    {familyMembers.length > 0 && (
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-3.5 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-100 rounded-lg">
                                        <UserIcon size={15} className="text-purple-600" />
                                    </div>
                                    <h2 className="font-bold text-gray-700 text-sm">{t('patientPortal.yourFamily')}</h2>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {familyMembers.map((member: any) => (
                                    <div key={member.id} className="px-5 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                                                <span className="text-white text-sm font-bold">{member.full_name?.charAt(0)}</span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{member.full_name}</p>
                                                <p className="text-gray-400 text-xs">{t('common.families')}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={`/patient/chat?chatWith=${member.user_id}`}
                                            className="flex items-center gap-1.5 bg-purple-100 text-purple-600 hover:bg-purple-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                                        >
                                            <MessageCircle size={13} />{t('common.chat')}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Quick Stats */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                                <Activity size={18} className="text-emerald-600" />
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Health Status</p>
                            <p className="text-base font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>All Good
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                                <Clock size={18} className="text-blue-600" />
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Pending Tasks</p>
                            <p className="text-base font-bold text-blue-700 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
                        </div>
                    </motion.div>

                </div>
            </div>
        </motion.div>
    )
}


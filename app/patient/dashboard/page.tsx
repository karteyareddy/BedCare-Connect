'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useNetworkStatus } from '@/components/NetworkStatusProvider'
import { addToSyncQueue } from '@/lib/offlineStorage'
import { AlertCircle, Phone, User as UserIcon, CheckCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PatientDashboard() {
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

            // Fetch Patient Details
            const { data: patientData } = await supabase.from('patients').select('*').eq('user_id', user.id).single()

            if (patientData) {
                setPatient(patientData)

                // Fetch Caretaker
                if (patientData.caretaker_id) {
                    const { data: caretakerData } = await supabase.from('caretakers').select('*').eq('id', patientData.caretaker_id).single()
                    setCaretaker(caretakerData)
                }

                // Fetch Family Members linked to this patient
                const { data: familyData } = await supabase
                    .from('profiles')
                    .select('id, full_name') // id IS the user_id in profiles table
                    .eq('linked_patient_id', patientData.id)
                    .eq('role', 'family')

                // Map results to ensure we have a 'user_id' property if needed, or update usage
                const mappedFamily = familyData?.map(f => ({
                    ...f,
                    user_id: f.id // Map id to user_id for consistency
                })) || []

                setFamilyMembers(mappedFamily)

                // Fetch Tasks (Today)
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
        if (!confirm('Are you sure you want to send an EMERGENCY ALERT?')) return

        setEmergencyLoading(true)
        try {
            const alertData = {
                patient_id: patient.id,
                organization_id: patient.organization_id,
                type: 'EMERGENCY',
                status: 'active'
            }

            if (online) {
                // 1. Create Alert
                const { error } = await supabase.from('alerts').insert([alertData])
                if (error) throw error

                // 2. Send Chat to Caretaker
                const { data: { user } } = await supabase.auth.getUser()
                if (caretaker && user) {
                    await supabase.from('chats').insert([{
                        initiator_id: user.id,
                        recipient_id: caretaker.user_id, // Caretaker's auth user_id
                        message: '🚨 EMERGENCY ALERT! I need help immediately!'
                    }])
                }

                // 3. Send Chat to Family
                if (familyMembers.length > 0 && user) {
                    const familyChats = familyMembers.map(member => ({
                        initiator_id: user.id, // Patient
                        recipient_id: member.id, // Family Profile ID / User ID
                        message: '🚨 EMERGENCY ALERT! I need help immediately!'
                    }))

                    await supabase.from('chats').insert(familyChats)
                }

                alert('Emergency Alert Sent! Caretaker and Family have been notified via Chat and System Alert.')
            } else {
                // Offline - local storage + sync
                await addToSyncQueue('alerts', 'POST', alertData)
                alert('You are offline. Emergency Alert Queued! It will be sent as soon as connection is restored.')
            }

        } catch (error) {
            console.error('Emergency Error:', error)
            alert('Failed to send alert. Please try calling directly.')
        } finally {
            setEmergencyLoading(false)
        }
    }

    if (loading) return <div className="flex justify-center p-10">Loading...</div>

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >

            {/* Emergency Button */}
            <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                onClick={handleEmergency}
                disabled={emergencyLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-8 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2 animate-pulse active:scale-95 transition-transform"
            >
                <AlertCircle size={48} />
                <span className="text-2xl">EMERGENCY HELP</span>
                <span className="text-xs font-normal opacity-80">(Tap to alert caretaker)</span>
            </motion.button>

            {/* Caretaker Info */}
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"
            >
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <UserIcon size={20} className="text-blue-500" /> Your Caretaker
                </h2>
                {caretaker ? (
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-bold text-xl text-gray-900">{caretaker.name}</p>
                            <p className="text-gray-500 text-sm">{caretaker.phone}</p>
                        </div>
                        <a href={`tel:${caretaker.phone}`} className="bg-green-100 p-3 rounded-full text-green-600 hover:bg-green-200">
                            <Phone size={24} />
                        </a>
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No caretaker assigned yet.</p>
                )}
            </motion.div>

            {/* Family Members Info */}
            <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"
            >
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <UserIcon size={20} className="text-purple-500" /> Your Family
                </h2>
                {familyMembers.length > 0 ? (
                    <div className="space-y-4">
                        {familyMembers.map((member: any) => (
                            <div key={member.id} className="flex justify-between items-center border-b last:border-0 pb-3 last:pb-0 border-gray-100">
                                <div>
                                    <p className="font-bold text-gray-900">{member.full_name}</p>
                                    <p className="text-gray-500 text-xs">Family Member</p>
                                </div>
                                <a href={`/patient/chat?chatWith=${member.user_id}`} className="bg-purple-100 px-4 py-2 rounded-full text-purple-600 hover:bg-purple-200 text-sm font-bold flex items-center gap-2 transition-colors">
                                    Chat
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 italic">No family members linked yet.</p>
                )}
            </motion.div>

            {/* Tasks List */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="text-lg font-semibold text-gray-800 mb-3 ml-1">Today&apos;s Schedule</h2>
                <div className="space-y-3">
                    {tasks.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 bg-white rounded-xl border border-dashed">
                            No pending tasks for today.
                        </div>
                    ) : (
                        tasks.map((task, index) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + (index * 0.1) }}
                                className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-400 flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="font-bold text-gray-800">{task.title}</h3>
                                    <p className="text-sm text-gray-500">{task.description}</p>
                                </div>
                                <div className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                                    <Clock size={12} />
                                    {task.due_date ? new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Anytime'}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

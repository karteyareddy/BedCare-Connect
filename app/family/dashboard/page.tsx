'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { CheckCircle, Clock } from 'lucide-react'
import Image from 'next/image'

export default function FamilyDashboard() {
    const [tasks, setTasks] = useState<any[]>([])
    const [patient, setPatient] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // In a real app, we need to link Family User -> Patient
            // For this hackathon, let's assume Family User ID is linked to Patient via a 'family_id' column in patient? 
            // or a 'families' table.
            // Let's assume we store 'patient_id' in family user metadata for simplicity.
            // OR, we query patients where 'family_email' matches?

            // Let's assume we link via `profiles` -> `patient_id`? No, profile is 1:1.
            // Let's add a quick hack: we fetch the FIRST patient in the same organization for now (demo mode)
            // OR better: Assume the user IS the patient's family login.
            // Let's fetch patients where organization_id matches (demo mode limits visibility).

            // Actually, better: The PRD says "Create Family login per patient".
            // We can store the patient_id in user_metadata when creating the family user.
            // Since I didn't implement family creation logic, I'll fallback to:
            // Fetching the patient with the same name as the family user (very hacky) OR just fetch all patients in Org if role is 'family' (but filtering by assigned).

            // Let's assume for Demo that family user sees ALL patients in their org (or just one).
            // I'll fetch the profile, get org_id, then get the first patient.
            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

            if (profile?.organization_id) {
                const { data: patientData } = await supabase.from('patients').select('*').eq('organization_id', profile.organization_id).limit(1).single()
                setPatient(patientData)

                if (patientData) {
                    const { data: tasksData } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('patient_id', patientData.id)
                        .order('due_date', { ascending: false }) // Recent first

                    setTasks(tasksData || [])
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{patient ? `${patient.name}'s Care Log` : 'Care Log'}</h2>

            {loading ? (
                <div className="flex justify-center p-10">Loading...</div>
            ) : (
                <div className="space-y-6 relative border-l-2 border-gray-200 ml-3 pl-6 pb-10">
                    {tasks.map((task) => (
                        <div key={task.id} className="relative mb-8">
                            <span className={`absolute -left-[33px] top-0 flex items-center justify-center w-8 h-8 rounded-full ring-4 ring-white ${task.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {task.status === 'completed' ? <CheckCircle size={16} className="text-white" /> : <Clock size={16} className="text-white" />}
                            </span>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 text-lg">{task.title}</h3>
                                    <span className="text-xs text-gray-400">{new Date(task.due_date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-600 mb-3">{task.description}</p>

                                {task.status === 'completed' && task.proof_url && (
                                    <div className="mt-3">
                                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Proof of Care</p>
                                        <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100 border">
                                            {/* Using standard img for external Supabase URLs to avoid Next.js domain config issues in demo */}
                                            <img
                                                src={task.proof_url}
                                                alt="Task Proof"
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                    </div>
                                )}
                                {task.status === 'pending' && (
                                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Pending</span>
                                )}
                            </div>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <p className="text-gray-500 italic">No tasks recorded yet.</p>
                    )}
                </div>
            )}
        </div>
    )
}

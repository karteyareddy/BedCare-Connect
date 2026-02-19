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

            // Get linked patient from profile
            const { data: profile } = await supabase.from('profiles').select('linked_patient_id').eq('id', user.id).single()

            if (profile?.linked_patient_id) {
                const { data: patientData } = await supabase.from('patients').select('*').eq('id', profile.linked_patient_id).single()
                setPatient(patientData)

                if (patientData) {
                    const { data: tasksData } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('patient_id', patientData.id)
                        .order('due_date', { ascending: false }) // Recent first

                    setTasks(tasksData || [])
                }
            } else {
                console.log('No linked patient found for this family account.')
            }

        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{patient ? `${patient.name}'s Care Log` : 'Care Log'}</h2>

            {loading ? (
                <div className="flex justify-center p-10">Loading...</div>
            ) : (
                <div className="space-y-6 relative border-l-2 border-gray-200 ml-3 pl-6 pb-10 max-w-3xl">
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
                                        <button
                                            onClick={() => setSelectedImage(task.proof_url)}
                                            className="relative h-48 w-full md:w-64 rounded-lg overflow-hidden bg-gray-100 border hover:opacity-90 transition-opacity"
                                        >
                                            <img
                                                src={task.proof_url}
                                                alt="Task Proof"
                                                className="object-cover w-full h-full"
                                            />
                                        </button>
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

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full proof"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                    />
                </div>
            )}
        </div>
    )
}

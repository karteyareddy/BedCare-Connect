'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Plus, Loader2, Calendar, User, CheckCircle, Clock } from 'lucide-react'

export default function ManageTasksPage() {
    const [tasks, setTasks] = useState<any[]>([])
    const [caretakers, setCaretakers] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        caretaker_id: '',
        patient_id: '',
        due_date: ''
    })
    const [creating, setCreating] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

            if (profile?.organization_id) {
                // Fetch Data in Parallel
                const [tasksResult, caretakersResult, patientsResult] = await Promise.allSettled([
                    supabase
                        .from('tasks')
                        .select(`*, caretakers (name), patients (name)`)
                        .eq('organization_id', profile.organization_id)
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('caretakers')
                        .select('id, name')
                        .eq('organization_id', profile.organization_id),
                    supabase
                        .from('patients')
                        .select('id, name')
                        .eq('organization_id', profile.organization_id)
                ])

                // Handle Tasks
                if (tasksResult.status === 'fulfilled') {
                    if (tasksResult.value.error) {
                        console.error('Tasks fetch error:', tasksResult.value.error)
                    } else {
                        setTasks(tasksResult.value.data || [])
                    }
                }

                // Handle Caretakers
                if (caretakersResult.status === 'fulfilled') {
                    if (caretakersResult.value.error) {
                        console.error('Caretakers fetch error:', caretakersResult.value.error)
                    } else {
                        setCaretakers(caretakersResult.value.data || [])
                    }
                }

                // Handle Patients
                if (patientsResult.status === 'fulfilled') {
                    if (patientsResult.value.error) {
                        console.error('Patients fetch error:', patientsResult.value.error)
                    } else {
                        setPatients(patientsResult.value.data || [])
                    }
                }
            }
        } catch (error: any) {
            console.error('Error fetching data:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            if (error.message) console.error('Error message:', error.message)
            if (error.details) console.error('Error details prop:', error.details)
            if (error.hint) console.error('Error hint:', error.hint)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            if (!profile?.organization_id) throw new Error('No organization found')

            const { error } = await supabase.from('tasks').insert([
                {
                    organization_id: profile.organization_id,
                    title: formData.title,
                    description: formData.description,
                    caretaker_id: formData.caretaker_id || null,
                    patient_id: formData.patient_id || null,
                    due_date: formData.due_date || null,
                    status: 'pending'
                }
            ])

            if (error) throw error

            setShowModal(false)
            fetchData()
            setFormData({ title: '', description: '', caretaker_id: '', patient_id: '', due_date: '' })
        } catch (error: any) {
            console.error('Error creating task:', error)
            alert('Failed to create task')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className='p-6'>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Tasks</h1>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                    <Plus size={20} />
                    Assign Task
                </button>
            </div>



            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg text-gray-800">{task.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {task.status}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 flex-1">{task.description}</p>

                        <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-indigo-500" />
                                <span>{task.caretakers?.name || 'Unassigned'}</span>
                            </div>
                            {task.patients && (
                                <div className="flex items-center gap-2">
                                    <User size={16} className="text-pink-500" />
                                    <span>Patient: {task.patients.name}</span>
                                </div>
                            )}
                            {task.due_date && (
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-orange-500" />
                                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && !loading && (
                    <div className="col-span-full text-center py-10 text-gray-500">No tasks found. Assign a new task using the button above.</div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 text-black">Assign New Task</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900">Task Title</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border-gray-400 border p-2 text-black"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900">Description</label>
                                <textarea className="mt-1 block w-full rounded-md border-gray-400 border p-2 text-black" rows={3}
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900">Assign To (Caretaker)</label>
                                <select className="mt-1 block w-full rounded-md border-gray-400 border p-2 text-black"
                                    value={formData.caretaker_id} onChange={e => setFormData({ ...formData, caretaker_id: e.target.value })}>
                                    <option value="">Select Caretaker</option>
                                    {caretakers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900">Related Patient (Optional)</label>
                                <select className="mt-1 block w-full rounded-md border-gray-400 border p-2 text-black"
                                    value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value })}>
                                    <option value="">Select Patient</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900">Due Date</label>
                                <input type="date" className="mt-1 block w-full rounded-md border-gray-400 border p-2 text-black"
                                    value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={creating} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                    {creating && <Loader2 className="animate-spin h-4 w-4" />} Assign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

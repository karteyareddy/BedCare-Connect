'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Plus, Loader2, FileText, UserPlus, X } from 'lucide-react'
import UploadCaseSheet from '@/components/UploadCaseSheet'

export default function ManagePatientsPage() {
    const [patients, setPatients] = useState<any[]>([])
    const [caretakers, setCaretakers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // Auto-generated usually, but for now manual
        room_number: '',
        condition: '',
        caretaker_id: ''
    })
    const [creating, setCreating] = useState(false)
    const [selectedPatientForUpload, setSelectedPatientForUpload] = useState<any>(null)

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
                // Fetch Patients
                const { data: patientsData, error: patientsError } = await supabase
                    .from('patients')
                    .select(`
                *,
                caretakers (
                    name
                )
            `)
                    .eq('organization_id', profile.organization_id)

                if (patientsError) throw patientsError
                setPatients(patientsData || [])

                // Fetch Caretakers for dropdown
                const { data: caretakersData, error: caretakersError } = await supabase
                    .from('caretakers')
                    .select('id, name')
                    .eq('organization_id', profile.organization_id)

                if (caretakersError) throw caretakersError
                setCaretakers(caretakersData || [])
            }
        } catch (error) {
            console.error('Error fetching data:', error)
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

            // 1. Create Auth User (Similar workaround/hack as ViewCaretakers)
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qkbstsilkczvzgxmhsnw.supabase.co'}/auth/v1/signup?apikey=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Wjp8Hq97ZcCylRtEbInDMA_9hJKfeIT'}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, password: formData.password })
            })

            const authData = await response.json()
            if (!response.ok) throw new Error(authData.msg || authData.message || 'Failed to create user')

            const userId = authData.user?.id || authData.id

            // 2. Insert into Profiles
            await supabase.from('profiles').insert([
                { id: userId, role: 'patient', organization_id: profile.organization_id, full_name: formData.name }
            ])

            // 3. Insert into Patients
            const { error: patientError } = await supabase.from('patients').insert([
                {
                    user_id: userId,
                    organization_id: profile.organization_id,
                    name: formData.name,
                    room_number: formData.room_number,
                    condition: formData.condition,
                    caretaker_id: formData.caretaker_id || null
                }
            ])
            if (patientError) throw patientError

            setShowModal(false)
            fetchData()
            setFormData({ name: '', email: '', password: '', room_number: '', condition: '', caretaker_id: '' })
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to create patient')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className='p-6'>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Patients</h1>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                    <Plus size={20} />
                    Add Patient
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caretaker</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {patients.map((patient) => (
                            <tr key={patient.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{patient.name}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{patient.room_number}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{patient.condition}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {patient.caretakers ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {patient.caretakers.name}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => setSelectedPatientForUpload(patient)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Upload Case Sheet"><FileText size={18} /></button>
                                    <button className="text-indigo-600 hover:text-indigo-900" title="Assign Caretaker"><UserPlus size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && !loading && (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No patients found. Add one to get started.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Add New Patient</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email (Username)</label>
                                <input type="email" required className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input type="password" required className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Room Number</label>
                                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                                    value={formData.room_number} onChange={e => setFormData({ ...formData, room_number: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Condition/Diagnosis</label>
                                <textarea className="mt-1 block w-full rounded-md border-gray-300 border p-2" rows={3}
                                    value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Assign Caretaker</label>
                                <select className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                                    value={formData.caretaker_id} onChange={e => setFormData({ ...formData, caretaker_id: e.target.value })}>
                                    <option value="">Select a Caretaker</option>
                                    {caretakers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={creating} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                                    {creating && <Loader2 className="animate-spin h-4 w-4" />} Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedPatientForUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Upload Case Sheet for {selectedPatientForUpload.name}</h2>
                            <button onClick={() => setSelectedPatientForUpload(null)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                        <UploadCaseSheet
                            patientId={selectedPatientForUpload.id}
                            onUploadComplete={() => {
                                // Optional: Refresh data or just close
                                setSelectedPatientForUpload(null)
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

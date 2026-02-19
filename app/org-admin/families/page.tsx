'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Plus, Loader2, Trash2, Users } from 'lucide-react'

export default function ManageFamiliesPage() {
    const [families, setFamilies] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        patient_id: ''
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
                // Fetch Families (profiles with role 'family')
                // Note: We need to join with patients to show linked patient name
                const { data: familyData, error: familyError } = await supabase
                    .from('profiles')
                    .select(`
                        *,
                        patients:linked_patient_id (name)
                    `)
                    .eq('organization_id', profile.organization_id)
                    .eq('role', 'family')

                if (familyError) throw familyError
                setFamilies(familyData || [])

                // Fetch Patients for dropdown
                const { data: patientsData, error: patientsError } = await supabase
                    .from('patients')
                    .select('id, name')
                    .eq('organization_id', profile.organization_id)

                if (patientsError) throw patientsError
                setPatients(patientsData || [])
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

            const response = await fetch('/api/admin/create-family', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password,
                    name: formData.name.trim(),
                    organization_id: profile.organization_id,
                    patient_id: formData.patient_id
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to create family account')

            setShowModal(false)
            fetchData()
            setFormData({ name: '', email: '', password: '', patient_id: '' })
            alert('Family account created successfully')
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to create family account')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className='p-6'>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Families</h1>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                    <Plus size={20} />
                    Add Family Member
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Patient</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {families.map((family) => (
                            <tr key={family.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500">
                                            <Users size={20} />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{family.full_name}</div>
                                            <div className="text-sm text-gray-500">{family.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {family.patients ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {family.patients.name}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">Not Linked</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {families.length === 0 && !loading && (
                            <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">No family accounts found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add Family Member</h2>
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
                                <input type="password" required minLength={6} className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Link to Patient</label>
                                <select required className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                                    value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value })}>
                                    <option value="">Select a Patient</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
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
        </div>
    )
}

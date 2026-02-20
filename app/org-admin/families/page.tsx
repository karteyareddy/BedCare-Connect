'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Plus, Loader2, Trash2, Users, Search, Mail, UserCheck, Link as LinkIcon, AlertCircle } from 'lucide-react'

export default function ManageFamiliesPage() {
    const [families, setFamilies] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
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
                const { data: familyData, error: familyError } = await supabase
                    .from('profiles')
                    .select(`
                        *,
                        patients:linked_patient_id (name)
                    `)
                    .eq('organization_id', profile.organization_id)
                    .eq('role', 'family')
                    .order('created_at', { ascending: false })

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

    const filteredFamilies = families.filter(f =>
        f.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6 md:p-10 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Families</h1>
                    <p className="text-gray-500 mt-1">Connect family members to patients for updates.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Family Member
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or patient..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-900">{filteredFamilies.length}</span> family members
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFamilies.map((family) => (
                    <div key={family.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                <Users size={32} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 line-clamp-1">{family.full_name}</h3>
                                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit mt-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    Connected
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600 mb-6">
                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-gray-400" />
                                <span className="truncate">{family.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <LinkIcon size={16} className="text-gray-400" />
                                <div className="flex-1">
                                    <span className="text-gray-500 block text-xs">Linked Patient</span>
                                    {family.patients ? (
                                        <span className="font-medium text-indigo-600">{family.patients.name}</span>
                                    ) : (
                                        <span className="text-orange-500 italic text-xs">Not Linked</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-50">
                            <button className="flex-1 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                Edit Details
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {filteredFamilies.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <Users size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No family members found</h3>
                        <p className="mt-1">Add a family member to grant them access to patient updates.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-900">Add Family Member</h2>
                            <p className="text-sm text-gray-500 mt-1">Create an account for a patient's relative.</p>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Username)</label>
                                <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input type="password" required minLength={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Patient</label>
                                <select required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.patient_id} onChange={e => setFormData({ ...formData, patient_id: e.target.value })}>
                                    <option value="">Select a Patient</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-50">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors">Cancel</button>
                                <button type="submit" disabled={creating} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all">
                                    {creating && <Loader2 className="animate-spin h-4 w-4" />} Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

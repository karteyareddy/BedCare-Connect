'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Plus, Loader2, Trash2 } from 'lucide-react'

export default function ManageCaretakersPage() {
    const [caretakers, setCaretakers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: ''
    })
    const [creating, setCreating] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchCaretakers()
    }, [])

    const fetchCaretakers = async () => {
        try {
            setLoading(true)
            // Get current user's org id
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

            if (profile?.organization_id) {
                const { data, error } = await supabase
                    .from('caretakers')
                    .select('*')
                    .eq('organization_id', profile.organization_id)

                if (error) throw error
                setCaretakers(data || [])
            }
        } catch (error) {
            console.error('Error fetching caretakers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            if (formData.password.length < 6) {
                throw new Error('Password must be at least 6 characters')
            }

            // 1. Get Org ID
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            if (!profile?.organization_id) throw new Error('No organization found for admin')

            // 2. Call API to create caretaker
            const response = await fetch('/api/admin/create-caretaker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password,
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    organization_id: profile.organization_id
                })
            })

            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Failed to create caretaker')

            setShowModal(false)
            fetchCaretakers()
            setFormData({ name: '', email: '', password: '', phone: '' })
            alert('Caretaker created successfully')
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to create caretaker')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className='p-6'>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Caretakers</h1>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
                    <Plus size={20} />
                    Add Caretaker
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {caretakers.map((caretaker) => (
                            <tr key={caretaker.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{caretaker.name}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{caretaker.phone}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">--</div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {caretakers.length === 0 && !loading && (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No caretakers found. Add one to get started.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Caretaker</h2>
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
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input type="tel" required className="mt-1 block w-full rounded-md border-gray-300 border p-2"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
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

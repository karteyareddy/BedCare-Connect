'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Plus, Loader2, FileText, UserPlus, X, Search, Users, User, Activity, MapPin, Calendar, ClipboardList, Edit } from 'lucide-react'
import UploadCaseSheet from '@/components/UploadCaseSheet'
import { useLanguage } from '@/components/LanguageProvider'

export default function ManagePatientsPage() {
    const [patients, setPatients] = useState<any[]>([])
    const [caretakers, setCaretakers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        room_number: '',
        condition: '',
        caretaker_id: ''
    })
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [selectedPatientForUpload, setSelectedPatientForUpload] = useState<any>(null)
    const { t } = useLanguage()

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
                    .order('created_at', { ascending: false })

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

    const handleEdit = (patient: any) => {
        setEditingId(patient.id)
        setFormData({
            name: patient.name,
            email: patient.email || '',
            password: '',
            room_number: patient.room_number,
            condition: patient.condition,
            caretaker_id: patient.caretaker_id || ''
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
            if (!profile?.organization_id) throw new Error('No organization found')

            if (editingId) {
                // Update existing patient
                // We only update non-auth fields here for simplicity
                const { error } = await supabase
                    .from('patients')
                    .update({
                        name: formData.name.trim(),
                        room_number: formData.room_number.trim(),
                        condition: formData.condition.trim(),
                        caretaker_id: formData.caretaker_id || null
                    })
                    .eq('id', editingId)

                if (error) throw error
                // alert('Patient updated successfully') // Optional: Toast
            } else {
                // Create new patient
                const response = await fetch('/api/admin/create-patient', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email.trim(),
                        password: formData.password,
                        name: formData.name.trim(),
                        organization_id: profile.organization_id,
                        room_number: formData.room_number.trim(),
                        condition: formData.condition.trim(),
                        caretaker_id: formData.caretaker_id
                    })
                })

                const result = await response.json()
                if (!response.ok) throw new Error(result.error || 'Failed to create patient')
                // alert('Patient created successfully')
            }

            setShowModal(false)
            setEditingId(null)
            fetchData()
            setFormData({ name: '', email: '', password: '', room_number: '', condition: '', caretaker_id: '' })

        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to save patient')
        } finally {
            setCreating(false)
        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingId(null)
        setFormData({ name: '', email: '', password: '', room_number: '', condition: '', caretaker_id: '' })
    }

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.condition?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-6 md:p-10 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('patients.title')}</h1>
                    <p className="text-gray-500 mt-1">{t('patients.subtitle')}</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null)
                        setFormData({ name: '', email: '', password: '', room_number: '', condition: '', caretaker_id: '' })
                        setShowModal(true)
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <Plus size={20} />
                    {t('patients.admitPatient')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('patients.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-gray-500">
                    {t('patients.showing')} <span className="font-semibold text-gray-900">{filteredPatients.length}</span> {t('patients.patientsCount')}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPatients.map((patient) => (
                    <div key={patient.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-teal-500"></div>

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                    {patient.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1 text-lg">{patient.name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <MapPin size={12} />
                                        <span>{t('patients.roomNumber')} {patient.room_number}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md">
                                {t('patients.inCare')}
                            </div>
                        </div>

                        <div className="space-y-3 text-sm mb-6">
                            <div className="flex items-start gap-3">
                                <Activity size={16} className="text-gray-400 mt-0.5" />
                                <p className="text-gray-600 line-clamp-2 leading-relaxed">
                                    <span className="font-medium text-gray-700">{t('patients.diagnosis')}:</span> {patient.condition || 'Not specified'}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <User size={16} className="text-gray-400" />
                                <div className="flex-1">
                                    <span className="text-gray-500 block text-xs">{t('patients.assignedCaretaker')}</span>
                                    {patient.caretakers ? (
                                        <span className="font-medium text-indigo-600">{patient.caretakers.name}</span>
                                    ) : (
                                        <span className="text-orange-500 italic text-xs">{t('patients.unassigned')}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                            <button
                                onClick={() => setSelectedPatientForUpload(patient)}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <FileText size={16} />
                                {t('patients.uploadCaseSheet')}
                            </button>
                            <button
                                onClick={() => handleEdit(patient)}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Edit size={16} />
                                {t('patients.editDetails')}
                            </button>
                        </div>
                    </div>
                ))}

                {filteredPatients.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 border-dashed">
                        <Users size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">{t('patients.noPatientsFound')}</h3>
                        <p className="mt-1">{t('patients.tryAdjusting')}</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[90vh] overflow-y-auto transform transition-all scale-100">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-gray-900">{editingId ? t('patients.editTitle') : t('patients.admitTitle')}</h2>
                            <p className="text-sm text-gray-500 mt-1">{editingId ? t('patients.editSubtitle') : t('patients.admitSubtitle')}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('caretakers.fullName')}</label>
                                <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            {!editingId && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                                        <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                                        <input type="password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.roomNumber')}</label>
                                    <input type="text" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.room_number} onChange={e => setFormData({ ...formData, room_number: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.assignCaretaker')}</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.caretaker_id} onChange={e => setFormData({ ...formData, caretaker_id: e.target.value })}>
                                        <option value="">{t('patients.selectCaretaker')}</option>
                                        {caretakers
                                            .filter(c =>
                                                // Allow if unassigned to any patient or assigned to this patient
                                                !patients.some(p => p.caretaker_id === c.id && p.id !== editingId)
                                            )
                                            .map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.condition')}</label>
                                <textarea className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" rows={3}
                                    value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-50">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors">{t('common.cancel')}</button>
                                <button type="submit" disabled={creating} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all">
                                    {creating && <Loader2 className="animate-spin h-4 w-4" />} {editingId ? t('patients.updatePatient') : t('patients.createPatient')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedPatientForUpload && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{t('patients.uploadCaseSheet')}</h2>
                            <button onClick={() => setSelectedPatientForUpload(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-700">
                            {t('patients.uploadingFor')}: <span className="font-bold">{selectedPatientForUpload.name}</span>
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

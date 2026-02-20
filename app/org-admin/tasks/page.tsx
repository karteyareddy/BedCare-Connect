'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Plus, Loader2, Calendar, User, CheckCircle, Clock, Search, Filter, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useLanguage } from '@/components/LanguageProvider'
import OrgPageBackground from '@/components/OrgPageBackground'

export default function ManageTasksPage() {
    const { t } = useLanguage()
    const [tasks, setTasks] = useState<any[]>([])
    const [filteredTasks, setFilteredTasks] = useState<any[]>([])
    const [caretakers, setCaretakers] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        caretaker_id: '',
        patient_id: '',
        due_date: '',
        start_time: '',
        end_time: ''
    })
    const [creating, setCreating] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        filterTasks()
    }, [tasks, searchTerm, statusFilter])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()

            if (profile?.organization_id) {
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

                if (tasksResult.status === 'fulfilled' && tasksResult.value.data) setTasks(tasksResult.value.data)
                if (caretakersResult.status === 'fulfilled' && caretakersResult.value.data) setCaretakers(caretakersResult.value.data)
                if (patientsResult.status === 'fulfilled' && patientsResult.value.data) setPatients(patientsResult.value.data)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterTasks = () => {
        let result = tasks

        // Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(t => t.status === statusFilter)
        }

        // Search Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase()
            result = result.filter(t =>
                t.title.toLowerCase().includes(lowerTerm) ||
                t.description?.toLowerCase().includes(lowerTerm) ||
                t.caretakers?.name?.toLowerCase().includes(lowerTerm) ||
                t.patients?.name?.toLowerCase().includes(lowerTerm)
            )
        }

        setFilteredTasks(result)
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
                    start_time: formData.start_time || null,
                    end_time: formData.end_time || null,
                    status: 'pending'
                }
            ])

            if (error) throw error

            setShowModal(false)
            fetchData()
            setFormData({ title: '', description: '', caretaker_id: '', patient_id: '', due_date: '', start_time: '', end_time: '' })
        } catch (error: any) {
            console.error('Error creating task:', error)
            alert('Failed to create task')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="p-6 md:p-10 space-y-8 min-h-screen relative">
            <OrgPageBackground />
            <div className="relative z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('tasks.title')}</h1>
                        <p className="text-gray-500 mt-1">{t('tasks.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 font-medium"
                    >
                        <Plus size={20} />
                        {t('tasks.createTask')}
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* Status Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['all', 'pending', 'completed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${statusFilter === status
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {status === 'all' ? t('common.all') : status === 'pending' ? t('common.pending') : t('common.completed')}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder={t('tasks.searchPlaceholder')}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Tasks Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('tasks.noTasks')}</h3>
                        <p className="text-gray-500 text-sm mt-1">{t('tasks.noTasksDesc')}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTasks.map(task => (
                            <div key={task.id} className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 flex flex-col relative overflow-hidden">

                                {/* Status Stripe */}
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}></div>

                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <h3 className="font-bold text-lg text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">{task.title}</h3>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${task.status === 'completed'
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                        {task.status === 'completed' ? t('common.completed') : t('common.pending')}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mb-6 pl-3 flex-1 leading-relaxed line-clamp-3">
                                    {task.description || 'No description provided.'}
                                </p>

                                <div className="space-y-3 pl-3 mt-auto">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                            <User size={14} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-medium text-gray-900 truncate">{task.caretakers?.name || t('patients.unassigned')}</p>
                                            <p className="text-xs text-gray-500 truncate">Caretaker</p>
                                        </div>
                                    </div>

                                    {task.patients && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 flex-shrink-0">
                                                <User size={14} />
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-medium text-gray-900 truncate">{task.patients.name}</p>
                                                <p className="text-xs text-gray-500 truncate">Patient</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 mt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                                        {task.due_date && (
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                                            </div>
                                        )}
                                        {(task.start_time || task.end_time) && (
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} className="text-gray-400" />
                                                <span>
                                                    {task.start_time?.slice(0, 5)} - {task.end_time?.slice(0, 5)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {task.proof_url && (
                                    <div className="mt-4 pl-3">
                                        <a href={task.proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1">
                                            <CheckCircle size={12} />
                                            {t('tasks.viewProof')}
                                        </a>
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>
                )}

                {/* Create Task Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h2 className="text-xl font-bold text-gray-900">{t('tasks.assignNew')}</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('tasks.taskTitle')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm py-2.5 px-3"
                                        placeholder="e.g. Morning Medication"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('tasks.assignTo')}</label>
                                        <select
                                            className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm py-2.5 px-3"
                                            value={formData.caretaker_id}
                                            onChange={e => setFormData({ ...formData, caretaker_id: e.target.value })}
                                        >
                                            <option value="">{t('tasks.selectCaretaker')}</option>
                                            {caretakers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('common.patients')}</label>
                                        <select
                                            className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm py-2.5 px-3"
                                            value={formData.patient_id}
                                            onChange={e => setFormData({ ...formData, patient_id: e.target.value })}
                                        >
                                            <option value="">{t('families.selectPatient')}</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('tasks.description')}</label>
                                    <textarea
                                        className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm py-2.5 px-3"
                                        rows={3}
                                        placeholder="Add detailed instructions..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('tasks.dueDate')}</label>
                                        <input
                                            type="date"
                                            className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm py-2.5 px-3"
                                            value={formData.due_date}
                                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('tasks.startTime')}</label>
                                        <input
                                            type="time"
                                            className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm py-2.5 px-3"
                                            value={formData.start_time}
                                            onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('tasks.endTime')}</label>
                                        <input
                                            type="time"
                                            className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 shadow-sm text-sm py-2.5 px-3"
                                            value={formData.end_time}
                                            onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-5 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {creating && <Loader2 className="animate-spin h-4 w-4" />}
                                        {t('tasks.assignButton')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

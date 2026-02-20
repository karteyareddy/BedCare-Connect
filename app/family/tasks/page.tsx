'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { CheckCircle, Clock, Filter, Image as ImageIcon, X } from 'lucide-react'

type FilterType = 'all' | 'completed' | 'pending'

export default function FamilyTasksPage() {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('all')
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('profiles')
                .select('linked_patient_id')
                .eq('id', user.id)
                .single()

            if (profile?.linked_patient_id) {
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('patient_id', profile.linked_patient_id)
                    .order('due_date', { ascending: false })

                setTasks(tasksData || [])
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const filtered = tasks.filter(t =>
        filter === 'all' ? true : t.status === filter
    )

    const completed = tasks.filter(t => t.status === 'completed').length
    const pending = tasks.filter(t => t.status !== 'completed').length

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Care Tasks</h1>
                <p className="text-gray-500 text-sm mt-1">Track all care activities for your loved one</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Total</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-green-600">{completed}</p>
                    <p className="text-xs text-gray-500 mt-1">Completed</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-amber-500">{pending}</p>
                    <p className="text-xs text-gray-500 mt-1">Pending</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
                {(['all', 'completed', 'pending'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all capitalize ${filter === f
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {f === 'all' ? 'All' : f === 'completed' ? `✓ Completed (${completed})` : `⏳ Pending (${pending})`}
                    </button>
                ))}
            </div>

            {/* Task Cards */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400 font-medium">No {filter !== 'all' ? filter : ''} tasks found</p>
                    </div>
                ) : (
                    filtered.map((task) => (
                        <div
                            key={task.id}
                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${task.status === 'completed' ? 'border-green-100' : 'border-gray-100'
                                }`}
                        >
                            <div className={`h-1 w-full ${task.status === 'completed' ? 'bg-green-400' : 'bg-amber-400'}`} />
                            <div className="p-5">
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${task.status === 'completed' ? 'bg-green-100' : 'bg-amber-100'
                                        }`}>
                                        {task.status === 'completed'
                                            ? <CheckCircle size={18} className="text-green-600" />
                                            : <Clock size={18} className="text-amber-600" />
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`font-bold text-gray-800 ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                                                {task.title}
                                            </h3>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {task.status === 'completed' ? 'Done' : 'Pending'}
                                            </span>
                                        </div>
                                        {task.description && (
                                            <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                                        )}
                                        <p className="text-xs text-gray-400">
                                            {task.due_date
                                                ? `Due: ${new Date(task.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
                                                : 'No due date'
                                            }
                                        </p>

                                        {/* Proof Photo */}
                                        {task.status === 'completed' && task.proof_url && (
                                            <div className="mt-3">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                                    <ImageIcon size={11} /> Proof of Care
                                                </p>
                                                <button
                                                    onClick={() => setSelectedImage(task.proof_url)}
                                                    className="relative h-36 w-48 rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity shadow-sm"
                                                >
                                                    <img src={task.proof_url} alt="Proof" className="object-cover w-full h-full" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-5 right-5 text-white bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full proof"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}

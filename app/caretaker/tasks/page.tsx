'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Camera, CheckCircle, Clock, UploadCloud, Loader2 } from 'lucide-react'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { saveToDevice, addToSyncQueue } from '@/lib/offlineStorage'
import { useNetworkStatus } from '@/components/NetworkStatusProvider'

export default function CaretakerTasksPage() {
    const [tasks, setTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
    const { online } = useNetworkStatus()
    const supabase = createClient()

    useEffect(() => {
        fetchTasks()
    }, [activeTab])

    const fetchTasks = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: caretaker } = await supabase.from('caretakers').select('id').eq('user_id', user.id).single()

            if (caretaker) {
                const { data, error } = await supabase
                    .from('tasks')
                    .select(`
                *,
                patients (name, room_number)
            `)
                    .eq('caretaker_id', caretaker.id)
                    .eq('status', activeTab)
                    .order('due_date', { ascending: true })

                if (error) throw error
                setTasks(data || [])
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCompleteTask = async (taskId: string) => {
        try {
            // 1. Take Photo
            const image = await CapacitorCamera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Camera
            })

            if (!image.base64String) return

            // 2. Save/Upload Logic
            let proofUrl = ''

            if (online) {
                // Upload to Supabase Storage
                const fileName = `${taskId}_${Date.now()}.jpeg`
                const { data, error } = await supabase.storage.from('task-proofs').upload(fileName, decode(image.base64String), {
                    contentType: 'image/jpeg'
                })

                if (error) {
                    console.error('Upload failed, falling back to offline logic if possible or alerting', error)
                    // For robustness, could fallback to local
                } else {
                    const { data: publicUrlData } = supabase.storage.from('task-proofs').getPublicUrl(fileName)
                    proofUrl = publicUrlData.publicUrl
                }
            } else {
                // Offline: Save to filesystem and queue sync
                const fileName = `${taskId}_${Date.now()}.jpeg`
                const savedUri = await saveToDevice(fileName, image.base64String)
                proofUrl = savedUri // This is a local URI

                // Queue the upload tasks
                // In a real app, the sync engine effectively handles the queued "complete task" action which includes the image
                // For now, we simulate by storing the action
                await addToSyncQueue('tasks', 'PATCH', { id: taskId, status: 'completed', proof_url: 'PENDING_UPLOAD_' + fileName })
            }

            // 3. Update Task Status
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'completed', proof_url: proofUrl })
                .eq('id', taskId)

            if (error) throw error

            fetchTasks()

        } catch (error) {
            console.error('Error completing task:', error)
            alert('Failed to complete task. Please try again.')
        }
    }

    // Helper to decode base64 for upload
    const decode = (str: string): Uint8Array => {
        const binaryString = atob(str);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    return (
        <div className="pb-20">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tasks</h1>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-200 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'pending' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'completed' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                    Completed
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500">No {activeTab} tasks found.</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-1 inline-block">
                                        Room {task.patients?.room_number}
                                    </span>
                                    <h3 className="font-bold text-gray-900">{task.title}</h3>
                                    <p className="text-sm text-gray-500">{task.description}</p>
                                </div>
                                <div className="flex items-center text-xs text-orange-500 font-medium whitespace-nowrap">
                                    <Clock size={12} className="mr-1" />
                                    {task.due_date ? new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No due time'}
                                </div>
                            </div>

                            {activeTab === 'pending' && (
                                <button
                                    onClick={() => handleCompleteTask(task.id)}
                                    className="bg-indigo-600 text-white w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 mt-2 active:bg-indigo-700 transition-colors"
                                >
                                    <Camera size={18} />
                                    Complete & Upload Proof
                                </button>
                            )}

                            {activeTab === 'completed' && (
                                <div className="text-green-600 text-sm font-medium flex items-center gap-1 mt-1">
                                    <CheckCircle size={16} /> Completed
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

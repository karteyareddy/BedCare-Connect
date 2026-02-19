'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { User, MapPin, ChevronRight, Activity, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function CaretakerDashboard() {
    const [patients, setPatients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchAssignedPatients()
    }, [])

    const fetchAssignedPatients = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get caretaker ID
            const { data: caretaker } = await supabase.from('caretakers').select('id').eq('user_id', user.id).single()

            if (caretaker) {
                const { data, error } = await supabase
                    .from('patients')
                    .select(`
                *,
                alerts (id, type, status)
            `)
                    .eq('caretaker_id', caretaker.id)

                if (error) throw error
                setPatients(data || [])
            }
        } catch (error) {
            console.error('Error fetching patients:', error)
        } finally {
            setLoading(false)
        }
    }

    // Count active alerts per patient helper
    const getActiveAlerts = (patient: any) => {
        return patient.alerts?.filter((a: any) => a.status === 'active').length || 0
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">My Patients</h2>
                <p className="text-gray-500 text-sm">Today&apos;s assignments</p>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : patients.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl shadow-sm">
                        <p className="text-gray-500">No patients assigned to you yet.</p>
                    </div>
                ) : (
                    patients.map((patient) => {
                        const activeAlerts = getActiveAlerts(patient)
                        return (
                            <Link href={`/caretaker/patient?id=${patient.id}`} key={patient.id} className="block">
                                <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 transition-transform active:scale-95 ${activeAlerts > 0 ? 'border-red-500 ring-2 ring-red-100' : 'border-indigo-500'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-4">
                                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{patient.name}</h3>
                                                <div className="flex items-center text-xs text-gray-500 mt-1 gap-1">
                                                    <MapPin size={12} />
                                                    <span>Room {patient.room_number}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-indigo-600 mt-1 gap-1 bg-indigo-50 px-2 py-0.5 rounded-full w-fit">
                                                    <Activity size={12} />
                                                    <span>{patient.condition}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {activeAlerts > 0 && (
                                            <div className="animate-pulse flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold">
                                                <AlertTriangle size={12} />
                                                <span>{activeAlerts} ALERT</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm text-gray-500">
                                        <span>Tap to view details & tasks</span>
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        )
                    })
                )}
            </div>
        </div>
    )
}

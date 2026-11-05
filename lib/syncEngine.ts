import { getSyncQueue, removeFromSyncQueue, getOfflineMonitoringEvents, removeOfflineMonitoringEvent } from './offlineStorage'
import { createClient } from './supabaseClient'

export const syncData = async () => {
    const supabase = createClient()
    
    // 1. Sync generic queue items
    const queue = await getSyncQueue()
    if (queue && queue.length > 0) {
        for (const item of queue) {
            try {
                const { url, method, body, id } = item
                const { error } = await supabase.from(url).insert(body)
                if (!error) {
                    await removeFromSyncQueue(id)
                } else {
                    console.error('Sync error:', error)
                }
            } catch (error) {
                console.error('Sync processing error:', error)
            }
        }
    }

    // 2. Sync AI monitoring events
    try {
        const events = await getOfflineMonitoringEvents()
        if (events && events.length > 0) {
            for (const ev of events) {
                const { error } = await supabase.from('monitoring_events').insert({
                    id: ev.id,
                    patient_id: ev.patientId,
                    activity_type: ev.activityType,
                    status: ev.status,
                    confidence: ev.confidence,
                    detected_at: ev.detectedAt,
                    source: ev.source || 'AI',
                    verification_status: ev.verificationStatus || 'PENDING',
                    verified_by: ev.verifiedBy || null,
                    verified_at: ev.verifiedAt || null,
                    sync_status: 'synced'
                })
                if (!error) {
                    await removeOfflineMonitoringEvent(ev.id)
                } else {
                    console.error('Monitoring event sync error:', error)
                }
            }
        }
    } catch (err) {
        console.error('Monitoring events sync error:', err)
    }
}

// Hook to run sync automatically when online
import { useEffect } from 'react'
import { useNetworkStatus } from '@/components/NetworkStatusProvider'

export const useSync = () => {
    const { online } = useNetworkStatus()

    useEffect(() => {
        if (online) {
            syncData()
        }
    }, [online])
}

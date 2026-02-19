import { openDB, DBSchema } from 'idb'
import { Filesystem, Directory } from '@capacitor/filesystem'

interface BedCareDB extends DBSchema {
    tasks: {
        key: string
        value: any
    }
    alerts: {
        key: string
        value: any
    }
    syncQueue: {
        key: string
        value: {
            id: string
            url: string
            method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
            body: any
            timestamp: number
        }
    }
}

const DB_NAME = 'bedcare-db'
const DB_VERSION = 1

export const initDB = async () => {
    return openDB<BedCareDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('tasks')) {
                db.createObjectStore('tasks', { keyPath: 'id' })
            }
            if (!db.objectStoreNames.contains('alerts')) {
                db.createObjectStore('alerts', { keyPath: 'id' })
            }
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id' })
            }
        },
    })
}

export const saveToDevice = async (filename: string, data: string) => {
    try {
        const result = await Filesystem.writeFile({
            path: filename,
            data: data,
            directory: Directory.Data,
        })
        return result.uri
    } catch (e) {
        console.error('Error saving file to device', e)
        throw e
    }
}

export const readFromDevice = async (filename: string) => {
    try {
        const contents = await Filesystem.readFile({
            path: filename,
            directory: Directory.Data,
        })
        return contents.data
    } catch (e) {
        console.error('Error reading file from device', e)
        return null
    }
}

export const addToSyncQueue = async (url: string, method: 'POST' | 'PUT' | 'DELETE' | 'PATCH', body: any) => {
    const db = await initDB()
    const id = crypto.randomUUID()
    await db.put('syncQueue', {
        id,
        url,
        method,
        body,
        timestamp: Date.now()
    })
}

export const getSyncQueue = async () => {
    const db = await initDB()
    return db.getAll('syncQueue')
}

export const removeFromSyncQueue = async (id: string) => {
    const db = await initDB()
    await db.delete('syncQueue', id)
}

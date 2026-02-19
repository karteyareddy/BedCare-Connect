"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

interface NetworkStatusContextType {
    online: boolean
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({ online: true })

export const useNetworkStatus = () => useContext(NetworkStatusContext)

export const NetworkStatusProvider = ({ children }: { children: React.ReactNode }) => {
    const [online, setOnline] = useState(true)

    useEffect(() => {
        const updateOnlineStatus = () => {
            setOnline(navigator.onLine)
        }

        if (typeof window !== 'undefined') {
            setOnline(navigator.onLine)
            window.addEventListener('online', updateOnlineStatus)
            window.addEventListener('offline', updateOnlineStatus)
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('online', updateOnlineStatus)
                window.removeEventListener('offline', updateOnlineStatus)
            }
        }
    }, [])

    return (
        <NetworkStatusContext.Provider value={{ online }}>
            <div className={`fixed bottom-4 right-4 z-50 p-2 rounded-full shadow-lg transition-colors duration-300 ${online ? 'bg-green-500' : 'bg-red-500'}`}>
                {online ? <Wifi className="text-white w-6 h-6" /> : <WifiOff className="text-white w-6 h-6" />}
            </div>
            {children}
        </NetworkStatusContext.Provider>
    )
}

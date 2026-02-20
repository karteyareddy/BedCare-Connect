'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations, Language } from '@/lib/translations'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en')

    useEffect(() => {
        const storedLang = localStorage.getItem('app-language') as Language
        if (storedLang && ['en', 'ta', 'te', 'ml'].includes(storedLang)) {
            setLanguageState(storedLang)
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('app-language', lang)
    }

    const t = (key: string) => {
        const keys = key.split('.')

        if (keys.length === 2) {
            const namespace = keys[0] as keyof typeof translations['en']
            const k = keys[1]

            // Check if translation exists in current language
            if (translations[language] && (translations[language] as any)[namespace]) {
                const val = (translations[language] as any)[namespace][k]
                if (val) return val
            }

            // Fallback to English
            if (translations['en'] && (translations['en'] as any)[namespace]) {
                const val = (translations['en'] as any)[namespace][k]
                if (val) return val
            }
        } else if (keys.length === 1) {
            // Handle root level keys if any later, but for now fallback to common just in case or return key
            // This part is less critical given current structure but good tailored
        }

        return key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

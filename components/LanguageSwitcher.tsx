'use client'

import { useLanguage } from './LanguageProvider'
import { Globe } from 'lucide-react'
import { useState } from 'react'

export default function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'ta', label: 'தமிழ் (Tamil)' },
        { code: 'te', label: 'తెలుగు (Telugu)' },
        { code: 'ml', label: 'മലയാളം (Malayalam)' },
    ]

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Select Language"
            >
                <Globe size={18} />
                <span className="uppercase font-medium">{language}</span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-100 z-20 overflow-hidden">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    // @ts-ignore
                                    setLanguage(lang.code)
                                    setIsOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${language === lang.code ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-gray-700'
                                    }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

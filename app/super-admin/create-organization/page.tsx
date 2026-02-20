'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Copy, Check } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'

export default function CreateOrganizationPage() {
    const { t } = useLanguage()
    const [formData, setFormData] = useState({
        name: '',
        owner_name: '',
        license_number: '',
        email: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [credentials, setCredentials] = useState<{ email: string, password: string } | null>(null)
    const [copied, setCopied] = useState(false)
    const router = useRouter()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setCredentials(null)

        try {
            const res = await fetch('/api/create-org-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to create organization')

            setCredentials(data.credentials)

        } catch (err: any) {
            setError(err.message || 'Failed to create organization')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (credentials) {
            const text = `Organization Created!\nURL: ${window.location.origin}/login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`
            navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    if (credentials) {
        return (
            <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">{t('superAdminPortal.orgCreated')}</h2>
                    <p className="text-gray-600 mb-6">{t('superAdminPortal.orgCreatedDesc')}</p>

                    <div className="bg-gray-50 p-4 rounded-lg text-left border border-gray-200 mb-6">
                        <div className="mb-3">
                            <span className="text-xs font-bold text-gray-500 uppercase">Email</span>
                            <div className="text-gray-900 font-mono">{credentials.email}</div>
                        </div>
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase">Password</span>
                            <div className="text-gray-900 font-mono">{credentials.password}</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={copyToClipboard}
                            className={`flex-1 flex justify-center items-center gap-2 py-2 px-4 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? t('superAdminPortal.copied') : t('superAdminPortal.copyDetails')}
                        </button>
                        <button
                            onClick={() => router.push('/super-admin/dashboard')}
                            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {t('superAdminPortal.done')}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-center">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('superAdminPortal.createApplication')}</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('superAdminPortal.orgName')}</label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('superAdminPortal.ownerName')}</label>
                        <input
                            type="text"
                            name="owner_name"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.owner_name}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('superAdminPortal.licenseNumber')}</label>
                        <input
                            type="text"
                            name="license_number"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.license_number}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('superAdminPortal.adminEmail')}</label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : t('superAdminPortal.createOrganization')}
                    </button>
                </form>
            </div>
        </div>
    )
}

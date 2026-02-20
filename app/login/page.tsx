'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()
    const { t } = useLanguage()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const trimmedEmail = email.trim()

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password,
            })

            if (error) throw error

            if (data.user) {
                // Fetch role from profiles table to be sure
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single()

                const role = profile?.role || data.user.user_metadata.role || 'patient'

                // Sync role to user_metadata for Middleware if needed
                if (data.user.user_metadata.role !== role) {
                    await supabase.auth.updateUser({
                        data: { role: role }
                    })
                }

                if (role === 'super_admin') router.push('/super-admin/dashboard')
                else if (role === 'org_admin') router.push('/org-admin/dashboard')
                else if (role === 'caretaker') router.push('/caretaker/dashboard')
                else if (role === 'family') router.push('/family/dashboard')
                else router.push('/patient/dashboard')
            }
        } catch (err: any) {
            console.error('Login Error:', err)
            setError(err.message || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-gray-50 relative">
            <Link href="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 transition-colors text-gray-600 hover:text-blue-600 lg:text-white/80 lg:hover:text-white">
                <ArrowLeft size={20} />
                <span className="font-medium">{t('auth.backToHome')}</span>
            </Link>

            <div className="absolute top-6 right-6 z-50">
                <LanguageSwitcher />
            </div>

            {/* Left Panel - Visual & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-teal-500 opacity-90"></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                {/* Content */}
                <div className="relative z-10 text-white max-w-lg px-12 text-center">
                    <div className="mb-8 flex items-center justify-center">
                        <div className="bg-white p-2 rounded-full shadow-2xl w-72 h-72 flex items-center justify-center">
                            <img src="/logo.png" alt="BedCare Connect Logo" className="w-full h-full object-contain" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold mb-6 tracking-tight">{t('auth.welcomeTitle')}</h1>
                    <p className="text-lg text-blue-100 leading-relaxed">
                        {t('auth.welcomeSubtitle')}
                    </p>
                </div>

                {/* Decorative Circles */}
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <div className="max-w-md w-full">
                    <div className="text-center lg:text-left mb-10">
                        {/* Logo visible on mobile/right only */}
                        <div className="lg:hidden mb-6 flex justify-center">
                            <img src="/logo.png" alt="BedCare Connect Logo" className="h-16 w-auto" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('auth.signIn')}</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {t('auth.welcomeBack')}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-colors"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-colors"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    {t('auth.rememberMe')}
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                    {t('auth.forgotPassword')}
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all transform hover:scale-[1.01]"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                            ) : (
                                <>
                                    {t('auth.signInButton')} <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </button>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                {t('auth.noAccount')}{' '}
                                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                    {t('auth.contactAdmin')}
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import LanguageSwitcher from '@/components/LanguageSwitcher'

// SVG decorative medical background for left panel
const LeftPanelDecor = () => (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
            <radialGradient id="lbg" cx="40%" cy="60%" r="70%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#0d9488" />
            </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#lbg)" />

        {/* Dot grid removed */}
        {/* Crosses removed */}

        {/* Heartbeat / ECG line */}
        <polyline
            points="20,400 60,400 80,360 100,440 120,340 140,440 160,400 380,400"
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Stethoscope hint and DNA removed */}
        {/* Small floating circles removed */}
    </svg>
)

// SVG decorative background for right panel (form side)
const RightPanelDecor = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        {/* Light crosses removed */}
        {/* ECG lines removed */}

        {/* Soft corner blobs */}
        <circle cx="0" cy="0" r="180" fill="rgba(37,99,235,0.04)" />
        <circle cx="760" cy="760" r="200" fill="rgba(13,148,136,0.04)" />

        {/* Floating dots removed */}
    </svg>
)

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
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single()

                const role = profile?.role || data.user.user_metadata.role || 'patient'

                if (data.user.user_metadata.role !== role) {
                    await supabase.auth.updateUser({ data: { role } })
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
        <div className="min-h-screen flex bg-gray-50 relative overflow-hidden">
            <Link href="/" className="absolute top-6 left-6 z-50 flex items-center gap-2 transition-colors text-gray-600 hover:text-blue-600 lg:text-white/80 lg:hover:text-white">
                <ArrowLeft size={20} />
                <span className="font-medium">{t('auth.backToHome')}</span>
            </Link>

            <div className="absolute top-6 right-6 z-50">
                <LanguageSwitcher />
            </div>

            {/* ── Left Panel ─────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
                <LeftPanelDecor />

                {/* Content on top of SVG */}
                <div className="relative z-10 text-white max-w-lg px-12 text-center">
                    <div className="mb-8 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-3xl shadow-2xl border border-white/30">
                            <div className="bg-white rounded-2xl w-64 h-64 flex items-center justify-center shadow-xl">
                                <img src="/logo.png" alt="BedCare Connect Logo" className="w-56 h-56 object-contain" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold mb-4 tracking-tight drop-shadow-lg">
                        {t('auth.welcomeTitle')}
                    </h1>
                    <p className="text-lg text-blue-100 leading-relaxed drop-shadow">
                        {t('auth.welcomeSubtitle')}
                    </p>

                    {/* Trust badges */}
                    <div className="mt-8 flex justify-center gap-4 flex-wrap">
                        {['Secure', 'HIPAA Ready', '24/7 Care'].map(badge => (
                            <span key={badge} className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold text-white/90">
                                ✦ {badge}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Panel ────────────────────────────────────── */}
            <div className="w-full lg:w-1/2 relative flex items-center justify-center p-8 lg:p-16 bg-white">
                <RightPanelDecor />

                <div className="relative z-10 max-w-md w-full">
                    <div className="text-center lg:text-left mb-10">
                        {/* Logo on mobile */}
                        <div className="lg:hidden mb-6 flex justify-center">
                            <img src="/logo.png" alt="BedCare Connect Logo" className="h-16 w-auto" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('auth.signIn')}</h2>
                        <p className="mt-2 text-sm text-gray-500">{t('auth.welcomeBack')}</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
                                <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-red-700">{error}</p>
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
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-colors bg-gray-50 focus:bg-white"
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
                                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-colors bg-gray-50 focus:bg-white"
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
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
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

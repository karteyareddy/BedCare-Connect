"use client"

import Link from 'next/link'
import { Activity, ShieldCheck, UserCheck, HeartPulse, ArrowRight, Globe, Plus } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import BlurText from '../components/BlurText'

export default function Home() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="BedCare Connect" className="w-20 h-20 object-contain" />
              <div className="text-2xl font-bold">
                <span className="text-blue-600">BedCare</span> <span className="text-green-600">Connect</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">{t('landing.home')}</Link>
              <Link href="#" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">{t('landing.howItWorks')}</Link>
              <Link href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">{t('landing.contact')}</Link>

              <div className="mr-2">
                <LanguageSwitcher />
              </div>

              <Link
                href="/login"
                className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-full font-semibold transition-all transform hover:-translate-y-0.5 shadow-md"
              >
                {t('landing.login')}
              </Link>
            </div>

            {/* Mobile menu button (placeholder) */}
            <div className="md:hidden flex items-center gap-4">
              <LanguageSwitcher />
              <button className="text-gray-600 p-2">
                <span className="sr-only">Open menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-blue-600 text-white overflow-hidden pt-10">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-teal-500 opacity-90"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        {/* Decorative Circles */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-center text-center">

          {/* Logo Container */}
          <div className="bg-white p-1 rounded-full shadow-2xl mb-8 w-40 h-40 flex items-center justify-center animate-fade-in-up">
            <img src="/logo.png" alt="BedCare Connect" className="w-full h-full object-contain" />
          </div>

          <div className="flex justify-center mb-6">
            <BlurText
              text={t('landing.heroTitle')}
              delay={500}
              animateBy="words"
              direction="top"
              className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-sm text-white"
              stepDuration={1}
            />
          </div>

          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mb-10 leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>

          <Link
            href="/login"
            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full shadow-lg hover:bg-gray-100 hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            <UserCheck size={20} />
            <span>{t('landing.loginPortal')}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">{t('landing.featuresTitle')}</h2>
          <p className="mt-4 text-lg text-gray-600">{t('landing.featuresSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="h-14 w-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
              <Activity size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.realTimeMonitoring')}</h3>
            <p className="text-gray-600 leading-relaxed">
              {t('landing.realTimeDesc')}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="h-14 w-14 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 mb-6">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.securePrivate')}</h3>
            <p className="text-gray-600 leading-relaxed">
              {t('landing.secureDesc')}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="h-14 w-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
              <HeartPulse size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('landing.aiAssistance')}</h3>
            <p className="text-gray-600 leading-relaxed">
              {t('landing.aiDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Bar */}
      <div id="contact" className="bg-blue-50 py-8 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 text-gray-800">

          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-full text-white">
              <ShieldCheck size={20} />
            </div>
            <span className="font-bold">KARE clg, Mh3- Hostel</span>
          </div>

          <div className="h-8 w-px bg-gray-300 hidden md:block"></div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-full text-white">
              <Plus size={20} />
            </div>
            <span className="font-bold">123456789</span>
          </div>

          <div className="h-8 w-px bg-gray-300 hidden md:block"></div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-full text-white">
              <Globe size={20} />
            </div>
            <span className="font-bold">admin@bedcare.com</span>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-full">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="font-bold text-xl tracking-tight">BedCare Connect</span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} BedCare Connect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

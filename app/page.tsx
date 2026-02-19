import Link from 'next/link'
import { Activity, ShieldCheck, UserCheck, HeartPulse } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 p-4 bg-white rounded-full shadow-lg animate-bounce">
          <HeartPulse size={64} className="text-red-500" />
        </div>

        <h1 className="text-5xl font-extrabold text-blue-900 mb-4 tracking-tight">
          BedCare Connect
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          A technology-driven inclusive caregiving platform designed to improve the quality of life for bedridden individuals through structured task management and AI-assisted care.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:-translate-y-1 flex items-center gap-2"
          >
            <UserCheck size={20} />
            Login Portal
          </Link>

          <Link
            href="/super-admin/dashboard"
            className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-full shadow-md border border-indigo-100 hover:bg-indigo-50 transition transform hover:-translate-y-1 flex items-center gap-2"
          >
            <ShieldCheck size={20} />
            Super Admin (Debug)
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
              <Activity size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">Real-time Monitoring</h3>
            <p className="text-gray-500 text-sm">Track patient vitals and task completion instantly from anywhere.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">Secure & Private</h3>
            <p className="text-gray-500 text-sm">Role-based access ensures patient data is only seen by authorized personnel.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
              <HeartPulse size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">AI Assistance</h3>
            <p className="text-gray-500 text-sm">Gemini AI summarizes case sheets and provides instant medical context.</p>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-gray-400 text-sm">
        © 2024 BedCare Connect. All rights reserved.
      </footer>
    </div>
  )
}

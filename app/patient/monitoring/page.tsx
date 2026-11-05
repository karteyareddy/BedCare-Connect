'use client';

import React, { useState } from 'react';
import { Camera, ShieldCheck, EyeOff, CheckCircle2, Lock } from 'lucide-react';

export default function PatientMonitoringPage() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-16 h-16 mx-auto bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-cyan-400">
          <Camera className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-white">Camera & Activity Monitoring</h1>
          <p className="text-slate-400 text-sm mt-2">
            Your camera is configured to assist caretakers with safety and medication monitoring.
          </p>
        </div>

        {/* Status Indicator */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isPaused
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="font-bold text-sm">
              {isPaused ? 'Monitoring Temporarily Paused' : 'Monitoring Active'}
            </span>
          </div>
          <ShieldCheck className="w-5 h-5" />
        </div>

        {/* Privacy Note */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-left text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <Lock className="w-4 h-4 text-cyan-400" />
            Privacy Protection Guarantee
          </div>
          <p className="leading-relaxed">
            Raw video feeds are processed locally on device and are never recorded or stored on remote servers. Only activity classification events are logged.
          </p>
        </div>

        {/* Patient Emergency Pause Button */}
        <button
          onClick={() => setIsPaused((prev) => !prev)}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
            isPaused
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400'
          }`}
        >
          {isPaused ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Resume Monitoring
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" /> Pause Monitoring
            </>
          )}
        </button>
      </div>
    </div>
  );
}

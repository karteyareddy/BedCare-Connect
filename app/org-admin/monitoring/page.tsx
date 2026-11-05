'use client';

import React, { useState } from 'react';
import { Settings, Shield, Sliders, Activity, Save } from 'lucide-react';

export default function OrgAdminMonitoringPage() {
  const [isActive, setIsActive] = useState(true);
  const [fps, setFps] = useState(8);
  const [fallEnabled, setFallEnabled] = useState(true);
  const [inactivityMins, setInactivityMins] = useState(60);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Shield className="w-4 h-4" /> Admin Controls
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">AI Monitoring Configuration</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage AI inference thresholds, fall detection sensitivities, and privacy controls across organization patients.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 animate-spin" />
          Configuration updated successfully!
        </div>
      )}

      {/* Settings Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Enable AI Toggle */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Global AI Monitoring Engine</h3>
            <p className="text-xs text-slate-400">Enable real-time computer vision inference for assigned caretakers.</p>
          </div>
          <button
            onClick={() => setIsActive((prev) => !prev)}
            className={`w-14 h-8 rounded-full transition p-1 flex items-center ${
              isActive ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md" />
          </button>
        </div>

        {/* Inference Rate */}
        <div className="space-y-2 border-b border-slate-800 pb-4">
          <label className="text-sm font-bold text-white flex items-center justify-between">
            <span>Client AI Inference Rate (FPS)</span>
            <span className="text-cyan-400 font-mono">{fps} FPS</span>
          </label>
          <input
            type="range"
            min={4}
            max={15}
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <p className="text-xs text-slate-400">Lower FPS reduces mobile battery and GPU usage; higher FPS increases posture tracking precision.</p>
        </div>

        {/* Fall Detection Toggle */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">Emergency Fall Detection</h3>
            <p className="text-xs text-slate-400">Enable sudden posture displacement and rapid descent detection algorithms.</p>
          </div>
          <button
            onClick={() => setFallEnabled((prev) => !prev)}
            className={`w-14 h-8 rounded-full transition p-1 flex items-center ${
              fallEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-slate-950 shadow-md" />
          </button>
        </div>

        {/* Inactivity Threshold */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-white">Prolonged Inactivity Alert Threshold</label>
          <select
            value={inactivityMins}
            onChange={(e) => setInactivityMins(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none"
          >
            <option value={30}>30 Minutes</option>
            <option value={60}>60 Minutes (Default)</option>
            <option value={120}>120 Minutes (2 Hours)</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Save className="w-4 h-4" /> Save Monitoring Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

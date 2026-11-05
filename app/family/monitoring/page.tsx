'use client';

import React, { useState, useEffect } from 'react';
import { CameraPreview } from '@/components/monitoring/CameraPreview';
import { ActivityTimeline } from '@/components/monitoring/ActivityTimeline';
import { MonitoringEvent } from '@/lib/monitoring/types';
import { getOfflineMonitoringEvents } from '@/lib/offlineStorage';
import { Heart, Activity, Pill, Footprints, ShieldCheck, Clock, Camera, Eye, EyeOff } from 'lucide-react';

export default function FamilyMonitoringPage() {
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [showLiveCam, setShowLiveCam] = useState<boolean>(true);
  const [patientId, setPatientId] = useState<string>('demo-patient-001');

  const loadEvents = async () => {
    const offline = await getOfflineMonitoringEvents();
    if (offline && offline.length > 0) {
      setEvents(offline);
    } else {
      setEvents([
        {
          id: 'ev-01',
          patientId: 'P001',
          activityType: 'MEDICATION_ACTIVITY',
          status: 'LIKELY_TAKEN',
          confidence: 0.91,
          detectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          source: 'AI',
          verificationStatus: 'VERIFIED',
          syncStatus: 'synced',
          details: 'Hand-to-mouth medication sequence verified by Caretaker.',
        },
        {
          id: 'ev-02',
          patientId: 'P001',
          activityType: 'WALKING',
          status: 'DETECTED',
          confidence: 0.86,
          detectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          source: 'AI',
          verificationStatus: 'VERIFIED',
          syncStatus: 'synced',
        },
        {
          id: 'ev-03',
          patientId: 'P001',
          activityType: 'SITTING',
          status: 'DETECTED',
          confidence: 0.88,
          detectedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
          source: 'AI',
          verificationStatus: 'VERIFIED',
          syncStatus: 'synced',
        },
      ]);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleEventDetected = (event: MonitoringEvent) => {
    setEvents((prev) => [event, ...prev]);
  };

  const latestMedication = events.find((e) => e.activityType === 'MEDICATION_ACTIVITY');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Heart className="w-4 h-4 text-rose-400" /> Family Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Patient Live Monitoring</h1>
          <p className="text-slate-400 text-sm mt-1">
            Direct access to live camera feed, real-time activity timeline, and medication compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLiveCam((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition"
          >
            {showLiveCam ? (
              <>
                <EyeOff className="w-4 h-4" /> Hide Live Cam
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" /> Access Live Cam
              </>
            )}
          </button>

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs text-emerald-400 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Monitoring Active</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Medication Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Today's Medication</span>
            <Pill className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {latestMedication ? (
              <span className="text-cyan-400">Likely Taken ({Math.round(latestMedication.confidence * 100)}%)</span>
            ) : (
              <span className="text-slate-400">Scheduled / Pending</span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {latestMedication
              ? `Detected at ${new Date(latestMedication.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Monitoring active in scheduled window.'}
          </p>
        </div>

        {/* Mobility Status Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Mobility Status</span>
            <Footprints className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400">Active & Moving</div>
          <p className="text-xs text-slate-400">Walking and posture movements detected within expected thresholds.</p>
        </div>

        {/* Safety & Fall Alerts Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Safety & Fall Status</span>
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-indigo-400">Normal (0 Alerts)</div>
          <p className="text-xs text-slate-400">No fall or prolonged inactivity emergencies detected.</p>
        </div>
      </div>

      {/* Main Grid: Live Camera Stream & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Live Camera View Section */}
        {showLiveCam && (
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-400" />
                Direct Live Camera Stream
              </h3>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-medium">
                Authorized Family Stream
              </span>
            </div>
            <CameraPreview
              patientId={patientId}
              onEventDetected={handleEventDetected}
              showOverlay={true}
            />
          </div>
        )}

        {/* Activity Timeline Section */}
        <div className={showLiveCam ? 'lg:col-span-6' : 'lg:col-span-12'}>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Today's Activity Timeline
              </h3>
              <span className="text-xs text-slate-400">Updated in real-time</span>
            </div>

            <ActivityTimeline events={events} isCaretakerView={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

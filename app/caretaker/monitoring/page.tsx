'use client';

import React, { useState, useEffect } from 'react';
import { CameraPreview } from '@/components/monitoring/CameraPreview';
import { ActivityTimeline } from '@/components/monitoring/ActivityTimeline';
import { FallAlertModal } from '@/components/monitoring/FallAlertModal';
import { MonitoringEvent } from '@/lib/monitoring/types';
import { getOfflineMonitoringEvents } from '@/lib/offlineStorage';
import { ShieldCheck, Activity, PlusCircle, CheckCircle2, Clock } from 'lucide-react';

export default function CaretakerMonitoringPage() {
  const [patientId, setPatientId] = useState<string>('demo-patient-001');
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [activeFallEvent, setActiveFallEvent] = useState<MonitoringEvent | null>(null);
  const [manualActivity, setManualActivity] = useState<string>('MEDICATION_ACTIVITY');

  const loadEvents = async () => {
    try {
      const offline = await getOfflineMonitoringEvents();
      // Combine with local mock/API events
      setEvents(offline || []);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEventDetected = (event: MonitoringEvent) => {
    setEvents((prev) => [event, ...prev]);

    if (event.activityType === 'POSSIBLE_FALL') {
      setActiveFallEvent(event);
    }
  };

  const handleVerify = async (eventId: string, status: 'VERIFIED' | 'REJECTED') => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, verificationStatus: status, status: status === 'VERIFIED' ? 'VERIFIED' : 'REJECTED' }
          : e
      )
    );

    try {
      await fetch(`/api/monitoring/events/${eventId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus: status, verifiedBy: 'caretaker-001' }),
      });
    } catch (err) {
      console.error('Failed to submit verification to server:', err);
    }
  };

  const handleManualAdd = () => {
    const newEvent: MonitoringEvent = {
      id: crypto.randomUUID(),
      patientId,
      activityType: manualActivity as any,
      status: 'VERIFIED',
      confidence: 1.0,
      detectedAt: new Date().toISOString(),
      source: 'MANUAL',
      verificationStatus: 'VERIFIED',
      syncStatus: 'pending',
      details: 'Recorded manually by caretaker.',
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-8 space-y-8">
      {/* Fall Alert Popup */}
      <FallAlertModal
        event={activeFallEvent}
        onConfirm={(id) => {
          handleVerify(id, 'VERIFIED');
          setActiveFallEvent(null);
        }}
        onReject={(id) => {
          handleVerify(id, 'REJECTED');
          setActiveFallEvent(null);
        }}
        onDismiss={() => setActiveFallEvent(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Activity className="w-4 h-4" /> Caretaker Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">AI Patient Monitoring</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time computer vision camera stream and rule-based activity detection engine.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs">
          <span className="text-slate-400 font-medium">Patient ID:</span>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-cyan-300 font-mono rounded px-2 py-1 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Camera Preview */}
        <div className="lg:col-span-7 space-y-6">
          <CameraPreview
            patientId={patientId}
            onEventDetected={handleEventDetected}
            showOverlay={true}
          />

          {/* Manual Record Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              Manual Activity Record Override
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={manualActivity}
                onChange={(e) => setManualActivity(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
              >
                <option value="MEDICATION_ACTIVITY">💊 Medication Activity</option>
                <option value="WALKING">🚶 Walking</option>
                <option value="SITTING">🪑 Sitting</option>
                <option value="LYING">🛌 Lying / Resting</option>
                <option value="EATING">🍛 Eating</option>
                <option value="DRINKING">🥤 Drinking</option>
              </select>
              <button
                onClick={handleManualAdd}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition"
              >
                Record Event
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Timeline & Caretaker Verification */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Live Detection Feed & Verification
              </h3>
              <span className="text-xs text-slate-500">{events.length} events recorded</span>
            </div>

            <ActivityTimeline
              events={events}
              onVerify={handleVerify}
              isCaretakerView={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

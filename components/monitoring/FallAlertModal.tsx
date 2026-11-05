'use client';

import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { MonitoringEvent } from '@/lib/monitoring/types';

interface FallAlertModalProps {
  event: MonitoringEvent | null;
  onConfirm: (eventId: string) => void;
  onReject: (eventId: string) => void;
  onDismiss: () => void;
}

export const FallAlertModal: React.FC<FallAlertModalProps> = ({
  event,
  onConfirm,
  onReject,
  onDismiss,
}) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-rose-500/20">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/40 animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Possible Fall Detected</h3>
            <p className="text-xs text-rose-300 font-mono">
              Timestamp: {new Date(event.detectedAt).toLocaleTimeString()} | Confidence: {Math.round(event.confidence * 100)}%
            </p>
          </div>
        </div>

        <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-xl text-slate-200 text-sm">
          <p className="font-semibold text-rose-300 mb-1">AI Detection Notice:</p>
          <p className="text-slate-300 text-xs leading-relaxed">
            {event.details || 'Sudden body movement and horizontal orientation detected. Please verify patient status immediately.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => onConfirm(event.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold transition text-sm shadow-lg shadow-rose-500/30"
          >
            <CheckCircle className="w-4 h-4" />
            Confirm Fall Emergency
          </button>

          <button
            onClick={() => onReject(event.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold transition text-sm"
          >
            <XCircle className="w-4 h-4" />
            False Alarm
          </button>
        </div>
      </div>
    </div>
  );
};

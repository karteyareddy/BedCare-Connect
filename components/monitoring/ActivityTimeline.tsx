'use client';

import React from 'react';
import { MonitoringEvent } from '@/lib/monitoring/types';
import { Pill, Footprints, Armchair, BedDouble, Utensils, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface ActivityTimelineProps {
  events: MonitoringEvent[];
  onVerify?: (eventId: string, status: 'VERIFIED' | 'REJECTED') => void;
  isCaretakerView?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  onVerify,
  isCaretakerView = false,
}) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm font-medium">No activity events recorded yet today.</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'MEDICATION_ACTIVITY':
        return <Pill className="w-5 h-5 text-cyan-400" />;
      case 'WALKING':
        return <Footprints className="w-5 h-5 text-emerald-400" />;
      case 'SITTING':
        return <Armchair className="w-5 h-5 text-blue-400" />;
      case 'LYING':
      case 'RESTING':
        return <BedDouble className="w-5 h-5 text-indigo-400" />;
      case 'EATING':
      case 'DRINKING':
        return <Utensils className="w-5 h-5 text-amber-400" />;
      case 'POSSIBLE_FALL':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (event: MonitoringEvent) => {
    if (event.verificationStatus === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified by Caretaker
        </span>
      );
    }
    if (event.verificationStatus === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
          <XCircle className="w-3.5 h-3.5" /> Rejected by Caretaker
        </span>
      );
    }
    if (event.activityType === 'MEDICATION_ACTIVITY') {
      const isLikely = event.confidence >= 0.90;
      return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
          isLikely ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' : 'text-amber-300 bg-amber-500/10 border-amber-500/30'
        }`}>
          {isLikely ? 'Likely medication activity' : 'Uncertain'} ({Math.round(event.confidence * 100)}%)
        </span>
      );
    }
    return (
      <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
        {Math.round(event.confidence * 100)}% confidence
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            event.activityType === 'POSSIBLE_FALL'
              ? 'bg-rose-950/20 border-rose-500/40'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shrink-0">
              {getActivityIcon(event.activityType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-white capitalize">
                  {event.activityType.toLowerCase().replace('_', ' ')}
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(event.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {event.details || `AI detected ${event.activityType.toLowerCase().replace('_', ' ')}.`}
              </p>
              <div className="mt-2">{getStatusBadge(event)}</div>
            </div>
          </div>

          {/* Caretaker Verification Actions */}
          {isCaretakerView && event.verificationStatus === 'PENDING' && onVerify && (
            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              <button
                onClick={() => onVerify(event.id, 'VERIFIED')}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
              >
                Confirm
              </button>
              <button
                onClick={() => onVerify(event.id, 'REJECTED')}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

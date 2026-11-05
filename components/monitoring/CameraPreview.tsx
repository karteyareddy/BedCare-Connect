'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Camera, VideoOff, RefreshCw, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { ClientVisionProvider } from '@/lib/monitoring/aiService';
import { ActivityEngine } from '@/lib/monitoring/activityEngine';
import { FrameAnalysis, MonitoringEvent } from '@/lib/monitoring/types';

interface CameraPreviewProps {
  patientId: string;
  onEventDetected?: (event: MonitoringEvent) => void;
  showOverlay?: boolean;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  patientId,
  onEventDetected,
  showOverlay = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [fps, setFps] = useState<number>(8);
  const [lastDetectedLabel, setLastDetectedLabel] = useState<string>('System Idle');
  const [latestConfidence, setLatestConfidence] = useState<number | null>(null);
  const [consentGranted, setConsentGranted] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const visionProviderRef = useRef<ClientVisionProvider | null>(null);
  const activityEngineRef = useRef<ActivityEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastInferenceTimeRef = useRef<number>(0);

  useEffect(() => {
    visionProviderRef.current = new ClientVisionProvider();
    visionProviderRef.current.initialize();
    activityEngineRef.current = new ActivityEngine(patientId);

    return () => {
      stopCamera();
      if (visionProviderRef.current) {
        visionProviderRef.current.dispose();
      }
    };
  }, [patientId]);

  const requestCameraStart = () => {
    if (!consentGranted) {
      setShowConsentModal(true);
      return;
    }
    startCamera();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      setStream(mediaStream);
      setHasPermission(true);
      setIsMonitoring(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera stream error / browser permission denied:', err);
      setHasPermission(false);
      setIsMonitoring(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsMonitoring(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Main Inference & Transparent AI Overlay Drawing Loop
  useEffect(() => {
    let active = true;

    const processFrameLoop = async () => {
      if (!active || !isMonitoring) return;

      const now = Date.now();
      const intervalMs = 1000 / fps;

      if (now - lastInferenceTimeRef.current >= intervalMs) {
        lastInferenceTimeRef.current = now;

        if (visionProviderRef.current && activityEngineRef.current) {
          const analysis: FrameAnalysis = await visionProviderRef.current.processFrame(
            videoRef.current || document.createElement('canvas')
          );

          // Render Transparent AI Overlay on top of live video feed
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              const width = 640;
              const height = 480;
              canvasRef.current.width = width;
              canvasRef.current.height = height;

              // Clear canvas so video element shows underneath
              ctx.clearRect(0, 0, width, height);

              // If webcam is not streaming, draw fallback status background
              if (!videoRef.current || videoRef.current.readyState < 2) {
                ctx.fillStyle = '#090d16';
                ctx.fillRect(0, 0, width, height);

                ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
                ctx.lineWidth = 1;
                for (let x = 0; x < width; x += 40) {
                  ctx.beginPath();
                  ctx.moveTo(x, 0);
                  ctx.lineTo(x, height);
                  ctx.stroke();
                }
                for (let y = 0; y < height; y += 40) {
                  ctx.beginPath();
                  ctx.moveTo(0, y);
                  ctx.lineTo(width, y);
                  ctx.stroke();
                }
              }

              // 1. Draw Object Bounding Boxes
              for (const obj of analysis.detectedObjects) {
                const [bx, by, bw, bh] = obj.bbox;
                const isMed = obj.label.includes('medicine');
                const strokeColor = isMed ? '#00F0FF' : '#39D353';

                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(bx * width, by * height, bw * width, bh * height);

                ctx.fillStyle = isMed ? 'rgba(0, 240, 255, 0.85)' : 'rgba(57, 211, 83, 0.85)';
                ctx.fillRect(bx * width, by * height - 20, 160, 20);

                ctx.fillStyle = '#030712';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText(`${obj.label} (${Math.round(obj.confidence * 100)}%)`, bx * width + 4, by * height - 6);
              }

              // 2. Draw Pose Skeleton Connections
              if (analysis.poseLandmarks) {
                const p = analysis.poseLandmarks;
                ctx.strokeStyle = '#00F0FF';
                ctx.lineWidth = 3;

                const connections = [
                  [p.leftShoulder, p.rightShoulder],
                  [p.leftShoulder, p.leftElbow],
                  [p.leftElbow, p.leftWrist],
                  [p.rightShoulder, p.rightElbow],
                  [p.rightElbow, p.rightWrist],
                  [p.leftShoulder, p.leftHip],
                  [p.rightShoulder, p.rightHip],
                  [p.leftHip, p.rightHip],
                  [p.leftHip, p.leftKnee],
                  [p.rightHip, p.rightKnee],
                  [p.leftKnee, p.leftAnkle],
                  [p.rightKnee, p.rightAnkle],
                ];

                for (const [p1, p2] of connections) {
                  if (p1 && p2) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x * width, p1.y * height);
                    ctx.lineTo(p2.x * width, p2.y * height);
                    ctx.stroke();
                  }
                }

                // Draw Joint Nodes
                const joints = [
                  p.nose, p.leftEye, p.rightEye, p.mouth,
                  p.leftShoulder, p.rightShoulder, p.leftElbow, p.rightElbow,
                  p.leftWrist, p.rightWrist, p.leftHip, p.rightHip,
                  p.leftKnee, p.rightKnee
                ];

                for (const j of joints) {
                  if (j) {
                    ctx.beginPath();
                    ctx.arc(j.x * width, j.y * height, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = '#39D353';
                    ctx.fill();
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                  }
                }
              }

              // 3. Draw Hand Landmarks
              if (analysis.handLandmarks) {
                ctx.fillStyle = '#F59E0B';
                for (const lm of analysis.handLandmarks.landmarks) {
                  ctx.beginPath();
                  ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }
            }
          }

          // Process frame through activity engine
          const newEvents = await activityEngineRef.current.processFrame(analysis);
          if (newEvents && newEvents.length > 0) {
            const ev = newEvents[0];
            setLastDetectedLabel(ev.activityType.replace('_', ' '));
            setLatestConfidence(ev.confidence);
            if (onEventDetected) {
              onEventDetected(ev);
            }
          }
        }
      }

      if (isMonitoring && active) {
        animationFrameRef.current = requestAnimationFrame(processFrameLoop);
      }
    };

    if (isMonitoring) {
      processFrameLoop();
    }

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMonitoring, fps, onEventDetected]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-cyan-400">
              <ShieldCheck className="w-8 h-8 shrink-0" />
              <h3 className="text-xl font-bold text-white">Camera Monitoring Consent</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              This AI Patient Monitoring module uses the device camera to assist with patient activity detection (medication sequence, posture, and fall alerts).
            </p>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                AI detections are probabilistic estimates and do not constitute clinical proof. Raw video streams are processed locally and discarded immediately.
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConsentModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConsentGranted(true);
                  setShowConsentModal(false);
                  startCamera();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition text-sm"
              >
                Grant & Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <h2 className="text-lg font-semibold text-white">AI Patient Monitor</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">FPS:</span>
          <select
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value={5}>5 FPS (Battery Saver)</option>
            <option value={8}>8 FPS (Balanced)</option>
            <option value={15}>15 FPS (High Precision)</option>
          </select>
        </div>
      </div>

      {/* Video Stream + Transparent AI Canvas Overlay Container */}
      <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {isMonitoring ? (
          <>
            {/* Real Webcam Stream Video Element */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
            {/* Transparent AI Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-emerald-400 font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>AI Pipeline Processing ({fps} FPS)</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-3">
            <VideoOff className="w-12 h-12 stroke-[1.5]" />
            <p className="text-sm font-medium">Monitoring is currently inactive</p>
            {hasPermission === false && (
              <p className="text-xs text-rose-400">Camera permission denied. Please allow camera access in browser settings.</p>
            )}
          </div>
        )}
      </div>

      {/* Status Indicators & Control Buttons */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
          <div className="text-slate-400">Last Detected Activity</div>
          <div className="text-sm font-semibold text-cyan-300 capitalize flex items-center justify-between">
            <span>{lastDetectedLabel}</span>
            {latestConfidence !== null && (
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                {Math.round(latestConfidence * 100)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMonitoring ? (
            <button
              onClick={stopCamera}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold text-sm transition"
            >
              <VideoOff className="w-4 h-4" />
              Stop Monitoring
            </button>
          ) : (
            <button
              onClick={requestCameraStart}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition"
            >
              <Camera className="w-4 h-4" />
              Start Monitoring
            </button>
          )}

          <button
            onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
            title="Switch Camera"
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export type ActivityType =
  | 'MEDICATION_ACTIVITY'
  | 'WALKING'
  | 'SITTING'
  | 'STANDING'
  | 'LYING'
  | 'EATING'
  | 'DRINKING'
  | 'POSSIBLE_FALL'
  | 'INACTIVITY';

export type ActivityStatus =
  | 'DETECTED'
  | 'LIKELY_TAKEN'
  | 'NOT_CONFIRMED'
  | 'POSSIBLE_FALL'
  | 'VERIFIED'
  | 'REJECTED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface MonitoringEvent {
  id: string;
  patientId: string;
  activityType: ActivityType;
  status: ActivityStatus;
  confidence: number;
  detectedAt: string;
  source: 'AI' | 'MANUAL';
  verificationStatus: VerificationStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  syncStatus: 'pending' | 'synced';
  details?: string;
}

export interface Landmark2D {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface HandLandmarks {
  wrist: Landmark2D;
  thumbTip: Landmark2D;
  indexTip: Landmark2D;
  middleTip: Landmark2D;
  landmarks: Landmark2D[];
}

export interface PoseLandmarks {
  nose: Landmark2D;
  leftEye: Landmark2D;
  rightEye: Landmark2D;
  mouth: Landmark2D;
  leftShoulder: Landmark2D;
  rightShoulder: Landmark2D;
  leftElbow: Landmark2D;
  rightElbow: Landmark2D;
  leftWrist: Landmark2D;
  rightWrist: Landmark2D;
  leftHip: Landmark2D;
  rightHip: Landmark2D;
  leftKnee: Landmark2D;
  rightKnee: Landmark2D;
  leftAnkle: Landmark2D;
  rightAnkle: Landmark2D;
  landmarks: Landmark2D[];
}

export interface DetectedObject {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface FrameAnalysis {
  personDetected: boolean;
  personConfidence: number;
  handLandmarks: HandLandmarks | null;
  poseLandmarks: PoseLandmarks | null;
  detectedObjects: DetectedObject[];
  timestamp: number;
}

export type MedicationState =
  | 'IDLE'
  | 'REACHED_MEDICINE'
  | 'MEDICINE_INTERACTION'
  | 'HAND_TO_MOUTH'
  | 'COMPLETED';

export interface MonitoringConfig {
  patientId: string;
  isActive: boolean;
  inferenceFps: number;
  fallDetectionEnabled: boolean;
  inactivityThresholdMins: number;
  confidenceThreshold: number;
}

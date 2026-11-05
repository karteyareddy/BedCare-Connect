import { FrameAnalysis, MedicationState, ActivityType, ActivityStatus } from '../types';
import { distance2D } from '../utils/geometry';
import { calculateMedicationConfidence, getConfidenceLabel } from '../utils/confidence';

export interface DetectionResult {
  activity: ActivityType;
  status: ActivityStatus;
  confidence: number;
  label: string;
  state: MedicationState;
  timestamp: string;
  details?: string;
}

export class MedicationDetector {
  private currentState: MedicationState = 'IDLE';
  private stateTimestamp: number = 0;
  private handToMouthApproaches: number = 0;
  private lastHandDistance: number = 1.0;
  private minMouthDistance: number = 1.0;
  private objectInteractions: number = 0;

  public process(frame: FrameAnalysis): DetectionResult | null {
    const now = frame.timestamp;
    const pose = frame.poseLandmarks;
    const hand = frame.handLandmarks;

    if (!pose && !hand) {
      return null;
    }

    // Identify mouth landmark (from pose mouth or nose)
    const mouthTarget = pose ? (pose.mouth || pose.nose) : null;
    // Identify hand landmark (wrist or indexTip)
    const handTarget = hand ? hand.indexTip : (pose ? pose.rightWrist || pose.leftWrist : null);

    let currentHandMouthDist = 1.0;
    if (mouthTarget && handTarget) {
      currentHandMouthDist = distance2D(mouthTarget, handTarget);
      if (currentHandMouthDist < this.minMouthDistance) {
        this.minMouthDistance = currentHandMouthDist;
      }
    }

    // Check for medicine container or cup / bottle / pill box object detection
    const medObject = frame.detectedObjects.find(
      (obj) =>
        obj.label.includes('bottle') ||
        obj.label.includes('cup') ||
        obj.label.includes('cell phone') ||
        obj.label.includes('box') ||
        obj.label.includes('medicine')
    );

    if (medObject) {
      this.objectInteractions++;
    }

    // State machine logic
    switch (this.currentState) {
      case 'IDLE':
        if (medObject || (handTarget && pose && (distance2D(handTarget, pose.rightHip) < 0.25 || distance2D(handTarget, pose.leftHip) < 0.25))) {
          this.currentState = 'REACHED_MEDICINE';
          this.stateTimestamp = now;
        } else if (currentHandMouthDist < 0.18) {
          // Direct hand to mouth from idle
          this.currentState = 'HAND_TO_MOUTH';
          this.stateTimestamp = now;
        }
        break;

      case 'REACHED_MEDICINE':
        if (medObject || this.objectInteractions > 0) {
          this.currentState = 'MEDICINE_INTERACTION';
          this.stateTimestamp = now;
        } else if (now - this.stateTimestamp > 5000) {
          // Timeout, reset to idle
          this.currentState = 'IDLE';
        }
        break;

      case 'MEDICINE_INTERACTION':
        if (currentHandMouthDist < 0.20) {
          this.currentState = 'HAND_TO_MOUTH';
          this.handToMouthApproaches++;
          this.stateTimestamp = now;
        } else if (now - this.stateTimestamp > 8000) {
          this.currentState = 'IDLE';
        }
        break;

      case 'HAND_TO_MOUTH':
        if (currentHandMouthDist > 0.28) {
          // Hand moved away from mouth after approaching
          this.currentState = 'COMPLETED';
          this.stateTimestamp = now;
        } else if (now - this.stateTimestamp > 6000) {
          this.currentState = 'COMPLETED';
        }
        break;

      case 'COMPLETED':
        // Calculate multi-signal confidence
        const confidence = calculateMedicationConfidence({
          handMedicineInteraction: medObject ? 0.30 : (this.objectInteractions > 0 ? 0.20 : 0.15),
          handToMouthMovement: this.minMouthDistance < 0.15 ? 0.30 : (this.minMouthDistance < 0.25 ? 0.20 : 0.10),
          sequenceCorrectness: 0.20,
          temporalConsistency: 0.10,
          objectDetection: medObject ? 0.10 : 0.05,
        });

        const { label, status } = getConfidenceLabel(confidence);

        const result: DetectionResult = {
          activity: 'MEDICATION_ACTIVITY',
          status,
          confidence,
          label,
          state: 'COMPLETED',
          timestamp: new Date(now).toISOString(),
          details: `Sequence completed. Hand-to-mouth proximity: ${Math.round((1 - this.minMouthDistance) * 100)}%`,
        };

        // Reset state after reporting
        this.reset();
        return result;
    }

    this.lastHandDistance = currentHandMouthDist;
    return null;
  }

  public reset() {
    this.currentState = 'IDLE';
    this.stateTimestamp = 0;
    this.handToMouthApproaches = 0;
    this.lastHandDistance = 1.0;
    this.minMouthDistance = 1.0;
    this.objectInteractions = 0;
  }
}

import { FrameAnalysis, ActivityType, ActivityStatus } from '../types';
import { distance2D } from '../utils/geometry';

export interface FallDetectionResult {
  activity: ActivityType;
  status: ActivityStatus;
  confidence: number;
  label: string;
  timestamp: string;
  details?: string;
}

export class FallDetector {
  private lastHeadY: number = 0;
  private lastTimestamp: number = 0;
  private highSpeedDownwardCount: number = 0;
  private cooldownUntil: number = 0;

  public process(frame: FrameAnalysis): FallDetectionResult | null {
    const now = frame.timestamp;
    if (now < this.cooldownUntil) return null;

    const pose = frame.poseLandmarks;
    if (!pose) return null;

    const headY = (pose.nose.y + pose.leftEye.y + pose.rightEye.y) / 3;
    const shoulderY = (pose.leftShoulder.y + pose.rightShoulder.y) / 2;
    const hipY = (pose.leftHip.y + pose.rightHip.y) / 2;

    if (this.lastTimestamp > 0) {
      const dt = (now - this.lastTimestamp) / 1000;
      if (dt > 0.05 && dt < 1.0) {
        const headVelocity = (headY - this.lastHeadY) / dt;

        // Rapid downward movement of head/torso (headVelocity > 0.8 in normalized canvas coordinates)
        if (headVelocity > 0.75) {
          this.highSpeedDownwardCount++;
        } else {
          this.highSpeedDownwardCount = Math.max(0, this.highSpeedDownwardCount - 1);
        }

        // Horizontal posture check: head & shoulders & hips near same vertical plane (y-coordinates close)
        const isHorizontal = Math.abs(headY - hipY) < 0.18;

        if (this.highSpeedDownwardCount >= 2 && isHorizontal) {
          this.cooldownUntil = now + 10000; // 10 sec cooldown
          this.highSpeedDownwardCount = 0;

          return {
            activity: 'POSSIBLE_FALL',
            status: 'POSSIBLE_FALL',
            confidence: 0.88,
            label: 'Possible fall detected',
            timestamp: new Date(now).toISOString(),
            details: 'Sudden posture displacement and horizontal body orientation detected.',
          };
        }
      }
    }

    this.lastHeadY = headY;
    this.lastTimestamp = now;
    return null;
  }

  public reset() {
    this.lastHeadY = 0;
    this.lastTimestamp = 0;
    this.highSpeedDownwardCount = 0;
    this.cooldownUntil = 0;
  }
}

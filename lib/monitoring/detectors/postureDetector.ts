import { FrameAnalysis, ActivityType, ActivityStatus } from '../types';
import { calculateAngle, distance2D } from '../utils/geometry';

export interface PostureResult {
  activity: ActivityType;
  status: ActivityStatus;
  confidence: number;
  label: string;
  timestamp: string;
}

export class PostureDetector {
  private previousHipPositions: { x: number; y: number; time: number }[] = [];
  private lastReportedActivity: ActivityType | null = null;
  private lastReportTime: number = 0;

  public process(frame: FrameAnalysis): PostureResult | null {
    const now = frame.timestamp;
    const pose = frame.poseLandmarks;
    if (!pose) return null;

    const shoulderY = (pose.leftShoulder.y + pose.rightShoulder.y) / 2;
    const hipY = (pose.leftHip.y + pose.rightHip.y) / 2;
    const hipX = (pose.leftHip.x + pose.rightHip.x) / 2;
    const kneeY = (pose.leftKnee.y + pose.rightKnee.y) / 2;
    const ankleY = (pose.leftAnkle.y + pose.rightAnkle.y) / 2;

    // Track hip positions over a 2 second temporal window for walking detection
    this.previousHipPositions.push({ x: hipX, y: hipY, time: now });
    this.previousHipPositions = this.previousHipPositions.filter((p) => now - p.time <= 2500);

    // Calculate displacement over window
    let totalMovement = 0;
    if (this.previousHipPositions.length > 3) {
      const oldest = this.previousHipPositions[0];
      const newest = this.previousHipPositions[this.previousHipPositions.length - 1];
      totalMovement = Math.sqrt(Math.pow(newest.x - oldest.x, 2) + Math.pow(newest.y - oldest.y, 2));
    }

    // Angles
    const hipAngle = calculateAngle(pose.leftShoulder, pose.leftHip, pose.leftKnee);
    const kneeAngle = calculateAngle(pose.leftHip, pose.leftKnee, pose.leftAnkle);

    let detectedActivity: ActivityType = 'STANDING';
    let confidence = 0.85;
    let label = 'Standing detected';

    // 1. Lying/Resting: Head/Shoulder/Hip near horizontal alignment
    if (Math.abs(shoulderY - hipY) < 0.12 && Math.abs(hipY - kneeY) < 0.15) {
      detectedActivity = 'LYING';
      confidence = 0.90;
      label = 'Lying / Resting detected';
    }
    // 2. Sitting: Hip angle around ~90deg and knee angle bent
    else if (hipAngle < 135 && kneeAngle < 130) {
      detectedActivity = 'SITTING';
      confidence = 0.88;
      label = 'Sitting detected';
    }
    // 3. Walking: Consistent hip movement over frame buffer
    else if (totalMovement > 0.15 && this.previousHipPositions.length >= 4) {
      detectedActivity = 'WALKING';
      confidence = 0.86;
      label = 'Walking detected';
    }
    // 4. Standing
    else {
      detectedActivity = 'STANDING';
      confidence = 0.82;
      label = 'Standing detected';
    }

    // Avoid spamming duplicate posture events (throttle reporting every 15 seconds unless activity changes)
    if (detectedActivity === this.lastReportedActivity && now - this.lastReportTime < 15000) {
      return null;
    }

    this.lastReportedActivity = detectedActivity;
    this.lastReportTime = now;

    return {
      activity: detectedActivity,
      status: 'DETECTED',
      confidence,
      label,
      timestamp: new Date(now).toISOString(),
    };
  }
}

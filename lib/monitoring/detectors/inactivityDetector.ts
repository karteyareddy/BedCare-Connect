import { FrameAnalysis, ActivityType, ActivityStatus } from '../types';

export interface InactivityResult {
  activity: ActivityType;
  status: ActivityStatus;
  confidence: number;
  label: string;
  timestamp: string;
  details?: string;
}

export class InactivityDetector {
  private lastActivityTimestamp: number = Date.now();
  private inactivityThresholdMins: number = 60;
  private hasEmittedAlert: boolean = false;

  constructor(thresholdMins: number = 60) {
    this.inactivityThresholdMins = thresholdMins;
    this.lastActivityTimestamp = Date.now();
  }

  public recordActivity() {
    this.lastActivityTimestamp = Date.now();
    this.hasEmittedAlert = false;
  }

  public checkInactivity(now: number = Date.now()): InactivityResult | null {
    const elapsedMins = (now - this.lastActivityTimestamp) / (1000 * 60);

    if (elapsedMins >= this.inactivityThresholdMins && !this.hasEmittedAlert) {
      this.hasEmittedAlert = true;
      const hours = Math.floor(elapsedMins / 60);
      const mins = Math.round(elapsedMins % 60);
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      return {
        activity: 'INACTIVITY',
        status: 'DETECTED',
        confidence: 0.85,
        label: 'Possible prolonged inactivity',
        timestamp: new Date(now).toISOString(),
        details: `No significant activity detected for ${timeStr}.`,
      };
    }

    return null;
  }

  public reset() {
    this.lastActivityTimestamp = Date.now();
    this.hasEmittedAlert = false;
  }
}

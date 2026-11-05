import { FrameAnalysis, MonitoringEvent } from './types';
import { MedicationDetector } from './detectors/medicationDetector';
import { FallDetector } from './detectors/fallDetector';
import { PostureDetector } from './detectors/postureDetector';
import { InactivityDetector } from './detectors/inactivityDetector';
import { saveMonitoringEventLocally } from '../offlineStorage';

export class ActivityEngine {
  private patientId: string;
  private medicationDetector = new MedicationDetector();
  private fallDetector = new FallDetector();
  private postureDetector = new PostureDetector();
  private inactivityDetector = new InactivityDetector(60);

  constructor(patientId: string, inactivityThresholdMins: number = 60) {
    this.patientId = patientId;
    this.inactivityDetector = new InactivityDetector(inactivityThresholdMins);
  }

  public async processFrame(frame: FrameAnalysis): Promise<MonitoringEvent[]> {
    const events: MonitoringEvent[] = [];

    // Reset inactivity timer if person is active or moving
    if (frame.personDetected && (frame.poseLandmarks || frame.handLandmarks)) {
      this.inactivityDetector.recordActivity();
    }

    // 1. Fall Detection (High Urgency)
    const fallResult = this.fallDetector.process(frame);
    if (fallResult) {
      const event: MonitoringEvent = {
        id: crypto.randomUUID(),
        patientId: this.patientId,
        activityType: fallResult.activity,
        status: fallResult.status,
        confidence: fallResult.confidence,
        detectedAt: fallResult.timestamp,
        source: 'AI',
        verificationStatus: 'PENDING',
        syncStatus: 'pending',
        details: fallResult.details,
      };
      events.push(event);
      await saveMonitoringEventLocally(event);
    }

    // 2. Medication Activity Detection
    const medResult = this.medicationDetector.process(frame);
    if (medResult) {
      const event: MonitoringEvent = {
        id: crypto.randomUUID(),
        patientId: this.patientId,
        activityType: medResult.activity,
        status: medResult.status,
        confidence: medResult.confidence,
        detectedAt: medResult.timestamp,
        source: 'AI',
        verificationStatus: 'PENDING',
        syncStatus: 'pending',
        details: medResult.details,
      };
      events.push(event);
      await saveMonitoringEventLocally(event);
    }

    // 3. Daily Posture Activity Detection (Standing, Sitting, Walking, Lying)
    const postureResult = this.postureDetector.process(frame);
    if (postureResult) {
      const event: MonitoringEvent = {
        id: crypto.randomUUID(),
        patientId: this.patientId,
        activityType: postureResult.activity,
        status: postureResult.status,
        confidence: postureResult.confidence,
        detectedAt: postureResult.timestamp,
        source: 'AI',
        verificationStatus: 'VERIFIED', // Posture tracking auto-accepts by default
        syncStatus: 'pending',
      };
      events.push(event);
      await saveMonitoringEventLocally(event);
    }

    // 4. Inactivity Check
    const inactivityResult = this.inactivityDetector.checkInactivity(frame.timestamp);
    if (inactivityResult) {
      const event: MonitoringEvent = {
        id: crypto.randomUUID(),
        patientId: this.patientId,
        activityType: inactivityResult.activity,
        status: inactivityResult.status,
        confidence: inactivityResult.confidence,
        detectedAt: inactivityResult.timestamp,
        source: 'AI',
        verificationStatus: 'PENDING',
        syncStatus: 'pending',
        details: inactivityResult.details,
      };
      events.push(event);
      await saveMonitoringEventLocally(event);
    }

    return events;
  }

  public reset() {
    this.medicationDetector.reset();
    this.fallDetector.reset();
    this.postureDetector.reset();
    this.inactivityDetector.reset();
  }
}

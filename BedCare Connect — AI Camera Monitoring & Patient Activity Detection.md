# BedCare Connect — AI Camera Monitoring & Patient Activity Detection

## 1. Feature Overview

Add a new **AI Patient Monitoring** module to the existing BedCare Connect application.

BedCare Connect currently has four user roles:

- Admin
- Caretaker
- Family
- Patient

There is **no doctor role**.

The new module allows authorized family members and caretakers to monitor a patient using a mobile camera and use pretrained computer-vision models to identify selected patient activities.

The first version must **not require creating or training a custom dataset**.

The implementation should use:

- Pretrained YOLO model for person/object detection
- MediaPipe Hands for hand tracking
- MediaPipe Pose for body-pose estimation
- Rule-based temporal activity detection
- Optional pretrained action-recognition models later
- Capacitor for mobile deployment
- IndexedDB for offline event storage
- Existing BedCare backend for synchronization and persistence

The AI must never claim that it can definitively prove that a patient swallowed a tablet.

Use terminology such as:

> "Medication activity detected"

or

> "Likely medication taken — 91% confidence"

instead of:

> "Tablet definitely swallowed."

---

# 2. Main Objectives

The new feature must provide:

1. Secure camera monitoring
2. Patient/person detection
3. Hand tracking
4. Body-pose detection
5. Medicine/medicine-container detection where supported
6. Medication activity detection
7. Walking detection
8. Sitting detection
9. Lying/resting detection
10. Basic eating/drinking activity detection where feasible
11. Fall detection
12. Prolonged inactivity detection
13. AI confidence scores
14. Caretaker verification
15. Family activity dashboard
16. Activity history
17. Medication activity alerts
18. Fall alerts
19. Offline AI-event storage
20. Automatic synchronization when internet returns
21. Camera and monitoring permissions
22. Privacy and access controls

---

# 3. Important Implementation Principle

Do NOT attempt to build a single large AI model that understands everything.

Use a modular pipeline:

```text
Camera
   ↓
Video Frames
   ↓
Person/Object Detection
   ↓
Hand Tracking + Pose Estimation
   ↓
Feature Extraction
   ↓
Rule-Based Activity Engine
   ↓
AI Activity Event
   ↓
Local Storage
   ↓
Backend Synchronization
   ↓
Caretaker / Family Dashboard
```

The system should be designed so that a custom-trained activity model can be added later without rewriting the whole application.

---

# 4. User Role Permissions

## 4.1 Admin

Admin can:

- Enable/disable AI monitoring for a patient
- Manage monitoring permissions
- View monitoring configuration
- View AI event audit logs
- View which users accessed monitoring
- Configure activity types
- Configure alert thresholds

Admin should NOT automatically have unrestricted access to patient camera footage unless the existing application permissions explicitly allow it.

---

## 4.2 Caretaker

Caretaker can:

- Start monitoring
- Stop monitoring
- View camera preview
- View AI detections
- View patient activities
- Verify medication detections
- Reject incorrect AI detections
- Manually record activities
- Receive patient alerts
- View activity history

---

## 4.3 Family

Family can:

- View authorized patient's monitoring status
- View camera when permission is granted
- View today's activities
- View medication activity
- View alerts
- View activity history

Family should not be allowed to modify AI configuration unless explicitly authorized.

---

## 4.4 Patient

Patient should be able to:

- See that monitoring is active where appropriate
- See camera/monitoring status
- Disable monitoring if the application's consent/permission model allows it
- View relevant activity information

The exact consent model should follow the application's existing authorization system.

---

# 5. Camera Module

Create a new module:

```text
AI Patient Monitoring
```

The first version should support:

- Camera permission
- Start monitoring
- Stop monitoring
- Camera preview
- Monitoring status
- AI processing status
- Last detected activity
- Connection status

Example UI:

```text
--------------------------------
 Patient Monitoring
--------------------------------

        CAMERA PREVIEW

       [ Patient View ]

--------------------------------

● Monitoring Active

AI Status:
Processing

Last Activity:
Medication activity detected

[ Stop Monitoring ]
--------------------------------
```

The UI must be mobile responsive.

Minimum supported width:

```text
320px
```

No horizontal page scrolling.

---

# 6. Camera Architecture

Do not continuously upload raw camera video to the backend.

Preferred architecture:

```text
Camera
   ↓
Mobile Device
   ↓
AI Inference
   ↓
Activity Detection
   ↓
Event Only
   ↓
IndexedDB
   ↓
Backend
```

The application should send activity events rather than continuously uploading video.

If evidence images/clips are later implemented, they must be:

- Explicitly controlled
- Encrypted
- Access-controlled
- Retained for a limited period
- Deleted according to the configured retention policy

Continuous recording must NOT be the default.

---

# 7. AI Technology Stack

Use the following architecture where technically compatible with the existing project.

## Person/Object Detection

Use:

```text
YOLO
```

Use a pretrained model.

Do not train from scratch.

Initially use YOLO for:

- Person detection
- Common objects
- Medicine container/strip where supported

If the selected pretrained model cannot reliably detect tablets, do NOT pretend that it can.

Design the system so a medicine-specific detector can be plugged in later.

---

# 8. Hand Tracking

Use:

```text
MediaPipe Hands
```

Track:

- Wrist
- Thumb
- Index finger
- Finger landmarks

The system should calculate:

- Hand position
- Hand velocity
- Hand direction
- Distance to detected medicine
- Distance to mouth/face

---

# 9. Pose Estimation

Use:

```text
MediaPipe Pose
```

Track:

- Head
- Shoulders
- Elbows
- Wrists
- Hips
- Knees
- Ankles

Use pose information to detect:

- Standing
- Sitting
- Walking
- Lying/resting
- Sudden posture changes

---

# 10. Medication Activity Detection

The first version must use a rule-based approach instead of requiring a custom-trained model.

The system should detect a sequence of events.

Example:

```text
Patient detected
       ↓
Medicine/container detected
       ↓
Hand moves toward medicine
       ↓
Hand reaches medicine
       ↓
Hand moves upward
       ↓
Hand approaches mouth
       ↓
Hand moves away
       ↓
Medication activity detected
```

Create an activity state machine:

```text
IDLE

↓
REACHED_MEDICINE

↓
MEDICINE_INTERACTION

↓
HAND_TO_MOUTH

↓
COMPLETED
```

If the sequence does not complete:

```text
REACHED_MEDICINE
        ↓
MEDICINE_RELEASED
        ↓
NOT_CONFIRMED
```

Do not mark the medication as definitely taken.

---

# 11. Medication Confidence Score

Create a confidence score from multiple signals.

Example:

```text
Hand → medicine interaction      30%
Medicine → mouth movement        30%
Correct movement sequence        20%
Temporal consistency              10%
Object detection                  10%
------------------------------------
Total                             100%
```

These weights are configurable and are only initial prototype values.

Example output:

```text
Confidence = 0.91
```

UI:

```text
Medication Activity

Status:
Likely taken

Confidence:
91%

Detected:
09:04 AM
```

Suggested initial interpretation:

```text
90–100%:
Likely medication activity

70–89%:
Uncertain

Below 70%:
Not detected
```

These thresholds must be configurable and must not be represented as clinically validated values.

---

# 12. Daily Activity Detection

Create an activity engine that can recognize:

```text
WALKING
SITTING
STANDING
LYING
EATING
DRINKING
MEDICATION_ACTIVITY
POSSIBLE_FALL
INACTIVITY
```

The initial implementation should prioritize:

1. Medication activity
2. Walking
3. Sitting
4. Possible fall
5. Inactivity

Eating and drinking can be implemented after the core pipeline works.

---

# 13. Walking Detection

Use pose landmarks and temporal movement.

Basic logic:

```text
Person detected
+
Body landmarks moving consistently
+
Leg/hip movement
+
Position changes over multiple frames
=
Walking activity
```

Do not classify a single frame as walking.

Use a short temporal window.

---

# 14. Sitting Detection

Use body landmark geometry.

Example:

```text
Hip angle
+
Knee angle
+
Torso position
=
Sitting
```

The exact thresholds should be configurable.

---

# 15. Lying/Resting Detection

Use:

- Shoulder position
- Hip position
- Body orientation
- Relative landmark alignment

Classify as:

```text
LYING / RESTING
```

Do not infer medical conditions from this activity.

---

# 16. Fall Detection

Implement a basic possible-fall detector using pose.

Example:

```text
Standing / walking
       ↓
Sudden body movement
       ↓
Body orientation changes
       ↓
Person becomes horizontal
       ↓
Little/no movement
       ↓
POSSIBLE FALL
```

The system must use:

```text
Possible fall detected
```

rather than:

```text
Patient definitely fell
```

Add caretaker verification.

Example:

```text
--------------------------------
⚠ Possible Fall Detected

Patient: [Patient Name]
Time: 14:32

AI Confidence: 88%

[ View ]
[ Confirm ]
[ False Alarm ]
--------------------------------
```

---

# 17. Prolonged Inactivity

Track the patient's last meaningful activity.

Example:

```text
Last activity:
10:35 AM

Current time:
12:45 PM

Inactivity:
2h 10m
```

If configured threshold is exceeded:

```text
Possible prolonged inactivity
```

Do not automatically interpret inactivity as a medical emergency.

---

# 18. AI Event Data Model

Create an activity event structure.

Example:

```json
{
  "id": "EV001",
  "patientId": "P001",
  "activityType": "MEDICATION_ACTIVITY",
  "status": "LIKELY_TAKEN",
  "confidence": 0.91,
  "detectedAt": "2026-09-03T09:04:32Z",
  "source": "AI",
  "verificationStatus": "PENDING",
  "verifiedBy": null,
  "verifiedAt": null,
  "syncStatus": "pending"
}
```

Possible activity types:

```text
MEDICATION_ACTIVITY
WALKING
SITTING
STANDING
LYING
EATING
DRINKING
POSSIBLE_FALL
INACTIVITY
```

Possible statuses:

```text
DETECTED
LIKELY_TAKEN
NOT_CONFIRMED
POSSIBLE_FALL
VERIFIED
REJECTED
```

---

# 19. Backend APIs

Add APIs according to the existing backend architecture.

Recommended endpoints:

```text
POST /api/monitoring/start

POST /api/monitoring/stop

GET /api/patients/:patientId/monitoring-status

POST /api/monitoring/events

GET /api/patients/:patientId/activities

GET /api/patients/:patientId/activities/today

POST /api/monitoring/events/:eventId/verify

GET /api/patients/:patientId/alerts

POST /api/monitoring/permissions
```

Do not duplicate existing APIs if equivalent endpoints already exist.

Reuse the existing authentication and patient/caretaker/family relationships.

---

# 20. Offline Architecture

BedCare Connect must work in rural areas where internet connectivity may be unavailable.

AI activity events must first be stored locally.

Use:

```text
IndexedDB
```

Example:

```text
AI Detection
     ↓
IndexedDB
     ↓
syncStatus = pending
```

When internet returns:

```text
IndexedDB
     ↓
Sync Manager
     ↓
Backend
     ↓
syncStatus = synced
```

The sync process must:

- Retry failed uploads
- Avoid duplicate events
- Preserve event timestamps
- Handle temporary network failures
- Mark successful events as synced
- Keep unsynced events locally

Use an idempotency/event ID to prevent duplicates.

---

# 21. Offline Camera/AI Behavior

When offline:

```text
Camera
 ↓
AI
 ↓
Activity detected
 ↓
Local event
```

The application should NOT require internet just to record an AI activity event.

When connectivity returns:

```text
Local events
 ↓
Sync
 ↓
Backend
 ↓
Family/Caretaker dashboard
```

---

# 22. Family Monitoring Dashboard

Add a new section:

```text
Patient Monitoring
```

Display:

```text
Patient Name
Monitoring Status
Camera Status
Today's Activities
Medication Status
Alerts
Activity Timeline
```

Example:

```text
--------------------------------
Patient Monitoring
--------------------------------

Patient:
Kumar

● Monitoring Active

Today's Activities

09:04 AM
💊 Medication activity
Likely taken — 91%

10:20 AM
🚶 Walking detected

11:10 AM
🪑 Sitting detected

01:05 PM
🍛 Eating detected

02:00 PM
⚠ Medication activity not detected
--------------------------------
```

---

# 23. Caretaker Dashboard

Caretaker should see more detailed AI information.

Example:

```text
--------------------------------
AI Monitoring
--------------------------------

09:04 AM

Medication Activity

AI Status:
Likely taken

Confidence:
91%

Verification:
Pending

[ Confirm ]
[ Reject ]
--------------------------------
```

When confirmed:

```text
Status:
Verified by Caretaker
```

When rejected:

```text
Status:
Rejected by Caretaker
```

---

# 24. Medication Schedule Integration

Integrate AI activity detection with the existing medication/task system if one exists.

Example:

```text
Medication Schedule

09:00 AM
     ↓
Monitoring window
     ↓
AI detection
     ↓
Activity detected?
   /        \
 YES        NO
 ↓           ↓
Likely       Alert
taken        caretaker
```

The monitoring window should be configurable.

Example:

```text
Scheduled:
09:00 AM

Detection window:
08:45 AM – 09:30 AM
```

Do not hard-code this value if the existing medication system already has configurable schedules.

---

# 25. Alert System

Create alerts for:

### Medication

```text
Medication activity not detected
```

### Possible fall

```text
Possible fall detected
```

### Prolonged inactivity

```text
Possible prolonged inactivity
```

Alerts should be sent according to the existing notification architecture.

Do not spam family members for every minor AI detection.

---

# 26. Privacy and Security

This feature handles sensitive patient information.

Implement:

- Authentication
- Authorization
- Role-based access
- Patient-family relationship validation
- Patient-caretaker relationship validation
- HTTPS
- Secure API endpoints
- Encrypted stored sensitive data where applicable
- Access logs
- Camera status indicator
- Monitoring enable/disable
- Configurable retention
- No public camera streams
- No unauthenticated camera access

Do not expose:

```text
/api/camera/live
```

or similar endpoints publicly without authorization.

---

# 27. Consent

Before camera monitoring starts, display a clear consent/authorization mechanism appropriate to the deployment.

Example:

```text
Camera Monitoring

This feature uses the camera to assist with
patient activity monitoring.

AI detections are estimates and may be incorrect.

[ Start Monitoring ]
[ Cancel ]
```

The patient/family/caretaker permissions must follow the application's authorization policy.

---

# 28. Do Not Store Continuous Video by Default

Default behavior:

```text
Camera
 ↓
Local AI
 ↓
Activity event
 ↓
Discard frame/video
```

Only retain media evidence if explicitly implemented and authorized.

If evidence is stored:

- Encrypt it
- Restrict access
- Add expiration
- Log access
- Delete automatically after retention period

---

# 29. Project Folder Structure

Adapt this to the existing BedCare Connect architecture rather than creating duplicate structures.

Suggested structure:

```text
src/
├── modules/
│   └── monitoring/
│       ├── components/
│       │   ├── CameraPreview
│       │   ├── MonitoringStatus
│       │   ├── ActivityTimeline
│       │   ├── ActivityCard
│       │   ├── MedicationDetectionCard
│       │   ├── FallAlert
│       │   └── MonitoringControls
│       │
│       ├── services/
│       │   ├── cameraService
│       │   ├── aiService
│       │   ├── yoloService
│       │   ├── handTrackingService
│       │   ├── poseService
│       │   ├── activityEngine
│       │   ├── medicationDetector
│       │   ├── fallDetector
│       │   └── monitoringSyncService
│       │
│       ├── storage/
│       │   └── monitoringStore
│       │
│       ├── types/
│       │   └── monitoringTypes
│       │
│       └── utils/
│           ├── confidence
│           ├── geometry
│           └── activityStateMachine
```

Follow the existing project's naming conventions if they differ.

---

# 30. AI Service Interface

Create an abstraction so AI implementations can change later.

Example conceptual interface:

```text
AIService

initialize()

processFrame(frame)

detectPerson(frame)

detectObjects(frame)

detectHands(frame)

detectPose(frame)

detectActivity(features)

dispose()
```

The application should not directly depend on YOLO or MediaPipe everywhere.

Use a service abstraction.

This will allow future replacement with:

```text
Custom trained model
```

without rewriting the monitoring UI.

---

# 31. Activity Engine

Create a centralized activity engine.

Conceptually:

```text
ActivityEngine
     │
     ├── MedicationDetector
     ├── WalkingDetector
     ├── SittingDetector
     ├── EatingDetector
     ├── DrinkingDetector
     ├── FallDetector
     └── InactivityDetector
```

Each detector should return:

```json
{
  "activity": "WALKING",
  "confidence": 0.84,
  "timestamp": "...",
  "status": "DETECTED"
}
```

---

# 32. Performance Requirements

Do not run expensive AI processing on every possible frame if unnecessary.

Use a controlled inference rate.

Example:

```text
Camera:
30 FPS

AI inference:
5–10 FPS
```

The exact rate should be configurable based on device performance.

Use frame skipping where appropriate.

Avoid blocking the UI thread.

---

# 33. Mobile Optimization

The final application should:

- Work on Android through Capacitor
- Be responsive
- Minimize battery consumption
- Minimize memory usage
- Avoid unnecessary video uploads
- Process only required frames
- Stop AI processing when monitoring is stopped
- Release camera/model resources correctly

---

# 34. Development Stages

Implement in this exact order.

## Stage 1 — Camera

Build:

```text
Camera permission
Camera preview
Start monitoring
Stop monitoring
```

Do not implement AI yet.

---

## Stage 2 — Person Detection

Add:

```text
Camera
 ↓
YOLO
 ↓
Person detected
```

Show:

```text
Person detected
```

on the UI.

---

## Stage 3 — Hand Tracking

Add MediaPipe Hands.

Display/debug:

```text
Hand detected
Wrist coordinates
Finger landmarks
```

Do not expose raw technical information in the production family UI.

---

## Stage 4 — Pose Tracking

Add MediaPipe Pose.

Implement:

```text
Standing
Sitting
Walking
Lying
```

using rules.

---

## Stage 5 — Medication Activity

Implement:

```text
Medicine interaction
 ↓
Hand movement
 ↓
Hand-to-mouth movement
 ↓
Temporal sequence
 ↓
Medication activity
```

Return:

```text
Likely medication activity
```

rather than definite swallowing.

---

## Stage 6 — Event Storage

Create:

```text
MonitoringEvent
```

Save events in IndexedDB.

---

## Stage 7 — Backend

Synchronize events with the backend.

---

## Stage 8 — Caretaker Verification

Add:

```text
Confirm
Reject
```

actions.

---

## Stage 9 — Family Dashboard

Add:

```text
Monitoring
Activities
Medication
Alerts
Timeline
```

---

## Stage 10 — Offline Sync

Implement:

```text
Offline → IndexedDB
Online → Sync
```

---

## Stage 11 — Fall Detection

Implement possible-fall detection.

---

## Stage 12 — Daily Routine

Add:

```text
Eating
Drinking
Walking
Sitting
Resting
```

where technically reliable.

---

# 35. Future Custom Model Support

Do not make the first version dependent on custom training.

Later, if a dataset becomes available:

```text
Collected Data
      ↓
Labeling
      ↓
Training
      ↓
Validation
      ↓
Testing
      ↓
Model Export
      ↓
AIService
```

The new model can replace the rule-based medication detector.

Example:

```text
Current:

Hand + Pose + Rules
       ↓
Medication activity


Future:

Hand + Pose + Custom LSTM/Transformer
       ↓
Medication activity
```

The rest of the BedCare architecture should remain unchanged.

---

# 36. Testing Requirements

Test the following.

## Camera

- Camera permission granted
- Camera permission denied
- Camera unavailable
- Start monitoring
- Stop monitoring
- App background/foreground behavior

## AI

- Person detected
- No person detected
- Multiple people detected
- Poor lighting
- Partial body visibility
- Patient moving
- Patient sitting
- Patient walking

## Medication

Test:

```text
Patient performs medication sequence
Patient picks medicine but does not take it
Patient touches medicine
Patient drinks water
Patient brings empty hand to mouth
Patient leaves medicine untouched
```

The system must avoid confidently classifying ambiguous situations.

## Offline

Test:

```text
Internet ON
Internet OFF
Internet returns
Upload fails
Upload succeeds
Duplicate sync
App restart while events are pending
```

## Authorization

Test:

```text
Family A → Patient A ✓
Family A → Patient B ✗

Caretaker A → Assigned patient ✓
Caretaker A → Unassigned patient ✗
```

---

# 37. Acceptance Criteria

The feature is considered successfully implemented when:

### Camera

- Authorized caretaker can start monitoring.
- Camera preview works on supported mobile devices.
- Monitoring can be stopped.
- Camera state is clearly displayed.

### AI

- Person detection works.
- Hand tracking works.
- Pose tracking works.
- Basic activity detection works.
- Medication activity pipeline works.

### Medication

The system can recognize a sequence consistent with medication activity and report:

```text
Likely medication activity
```

with a confidence score.

It must NOT claim certainty that a tablet was swallowed.

### Offline

- AI events are stored locally when offline.
- Events synchronize when internet returns.
- Duplicate events are not created.

### Family

- Authorized family members can see activities.
- Family can see medication status.
- Family can see relevant alerts.

### Caretaker

- Caretaker can verify AI detections.
- Verification status is stored.

### Security

- Unauthorized users cannot access patient monitoring.
- Camera access is authenticated.
- Patient monitoring permissions are enforced.

---

# 38. Important Constraints

Do NOT:

- Train a model from scratch for the first version.
- Require a custom dataset for the first implementation.
- Upload continuous video unnecessarily.
- Claim that the AI can medically prove swallowing.
- Make AI detections irreversible.
- Block the application when internet is unavailable.
- expose patient camera streams publicly.
- hard-code patient IDs.
- bypass existing authentication.
- create a separate authentication system.
- duplicate existing patient/caretaker/family relationships.

Reuse the existing BedCare Connect architecture wherever possible.

---

# 39. Final Target Architecture

```text
                    BEDCARE CONNECT
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
     PATIENT           CARETAKER            FAMILY
        │                  │                  │
        │                  │             Monitoring
        │                  │              Dashboard
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                     CAMERA MODULE
                           │
                           ↓
                      VIDEO FRAME
                           │
                 ┌─────────┴─────────┐
                 │                   │
                YOLO              MediaPipe
                 │                   │
          Person / Object       Hands / Pose
                 │                   │
                 └─────────┬─────────┘
                           ↓
                    FEATURE DATA
                           │
                           ↓
                   ACTIVITY ENGINE
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
     Medication         Walking          Fall
          ↓                ↓                ↓
          └────────────────┼────────────────┘
                           ↓
                      AI EVENT
                           │
                           ↓
                       IndexedDB
                           │
                     Internet?
                      /       \
                    YES       NO
                     ↓         ↓
                 Backend    Local Queue
                     ↓         │
                     └── Sync ─┘
                           ↓
                 Caretaker / Family
                       Dashboard
                           ↓
                      Verification
```

# 40. Implementation Rule

**First make the camera work. Then add person detection. Then hand/pose tracking. Then medication activity detection. Then event storage. Then backend synchronization. Then dashboards and alerts.**

Do not attempt to implement all AI activities simultaneously.

The initial MVP should be:

```text
Camera
  ↓
Person detection
  ↓
Hand + pose tracking
  ↓
Medication activity rules
  ↓
Confidence score
  ↓
AI event
  ↓
IndexedDB
  ↓
Backend
  ↓
Caretaker verification
  ↓
Family dashboard
```

This MVP should be completed and tested before adding fall detection and broader daily-routine recognition.
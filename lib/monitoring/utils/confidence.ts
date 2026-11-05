export interface MedicationConfidenceFactors {
  handMedicineInteraction: number; // 0 to 0.30
  handToMouthMovement: number;     // 0 to 0.30
  sequenceCorrectness: number;     // 0 to 0.20
  temporalConsistency: number;     // 0 to 0.10
  objectDetection: number;         // 0 to 0.10
}

export function calculateMedicationConfidence(factors: MedicationConfidenceFactors): number {
  const total =
    factors.handMedicineInteraction +
    factors.handToMouthMovement +
    factors.sequenceCorrectness +
    factors.temporalConsistency +
    factors.objectDetection;
  return Math.min(1.0, Math.max(0.0, Math.round(total * 100) / 100));
}

export function getConfidenceLabel(confidence: number): { label: string; status: 'LIKELY_TAKEN' | 'NOT_CONFIRMED'; badgeColor: string } {
  if (confidence >= 0.90) {
    return {
      label: 'Likely medication activity',
      status: 'LIKELY_TAKEN',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    };
  } else if (confidence >= 0.70) {
    return {
      label: 'Uncertain medication activity',
      status: 'NOT_CONFIRMED',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    };
  } else {
    return {
      label: 'Medication activity not confirmed',
      status: 'NOT_CONFIRMED',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    };
  }
}

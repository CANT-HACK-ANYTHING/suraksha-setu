import type { SOSRequest, WaterLevel } from '../types/disaster';

interface TriageParams {
  trappedCount: number;
  hasInfants: boolean;
  hasElderlyOrDisabled: boolean;
  hasPregnantWomen: boolean;
  medicalEmergency: boolean;
  waterLevel: WaterLevel;
  distanceToRiverKm?: number;
}

/**
 * Multi-Factor Battlefield & Disaster Triage Urgency Scoring Algorithm
 * Calculates deterministic urgency index S in [0, 100]
 */
export function calculateTriageUrgency(params: TriageParams): {
  score: number;
  priority: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MODERATE';
} {
  let score = 15; // Baseline distress score

  // 1. Demographic Vulnerabilities
  if (params.hasInfants) score += 25;
  if (params.hasPregnantWomen) score += 25;
  if (params.hasElderlyOrDisabled) score += 20;

  // Trapped group scaling: +3 points per additional person beyond 1, capped at +15
  if (params.trappedCount > 1) {
    score += Math.min((params.trappedCount - 1) * 3, 15);
  }

  // 2. Critical Medical Crisis (Oxygen, cardiac, dialysis, severe bleeding)
  if (params.medicalEmergency) {
    score += 35;
  }

  // 3. Environmental Threat: Rising Inundation Level
  switch (params.waterLevel) {
    case 'FIRST_FLOOR_ROOFTOP':
      score += 30;
      break;
    case 'WAIST_DEPTH':
      score += 18;
      break;
    case 'ANKLE_DEPTH':
      score += 6;
      break;
  }

  // 4. Proximity to Palar River Basin breach
  if (params.distanceToRiverKm !== undefined && params.distanceToRiverKm < 0.8) {
    score += 15;
  }

  // Cap at 100
  const finalScore = Math.min(Math.round(score), 100);

  // Classify Military/Civilian Triage Band
  let priority: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MODERATE' = 'P3_MODERATE';
  if (finalScore >= 75) {
    priority = 'P1_CRITICAL';
  } else if (finalScore >= 45) {
    priority = 'P2_HIGH';
  }

  return {
    score: finalScore,
    priority,
  };
}

/**
 * Sort SOS requests by urgency score descending (critical priority queue)
 */
export function sortSOSByUrgency(requests: SOSRequest[]): SOSRequest[] {
  return [...requests].sort((a, b) => {
    // Unresolved first
    if (a.status === 'RESCUED' && b.status !== 'RESCUED') return 1;
    if (a.status !== 'RESCUED' && b.status === 'RESCUED') return -1;
    // Then by urgency score descending
    return b.urgencyScore - a.urgencyScore;
  });
}

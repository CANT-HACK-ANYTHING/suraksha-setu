import type {
  PalarTelemetry,
  HazardIncident,
  SOSRequest,
  CalamitySimulationControls,
  FieldMission,
  RiskFormulaWeights,
  ThreatLevel,
} from '../types/disaster';
import { calculateCompositeRisk } from '../utils/riskEngine';

// API Base URL (Can be set via window/env or overridden by user backend)
export const API_BASE_URL = (typeof window !== 'undefined' && (window as unknown as { SURAKSHA_API_URL?: string }).SURAKSHA_API_URL) || 'http://localhost:5000/api/v1';

// Real-time Event Bus using HTML5 BroadcastChannel for multi-window sync
const crisisChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('suraksha_crisis_mesh')
  : null;

export type CrisisEvent =
  | { type: 'CALAMITY_UPDATED'; payload: { controls: CalamitySimulationControls; telemetry: PalarTelemetry } }
  | { type: 'SOS_CREATED'; payload: SOSRequest }
  | { type: 'UNIT_DISPATCHED'; payload: { sosId: string; unitName: string; mission?: FieldMission } }
  | { type: 'MISSION_STATUS_UPDATED'; payload: { missionId: string; status: FieldMission['status']; sosId: string } }
  | { type: 'SHELTER_OCCUPANCY_CHANGED'; payload: { shelterId: string; delta: number } }
  | { type: 'BROADCAST_STAGE_CHANGED'; payload: 'DANGER' | 'NEAR_DANGER' | 'SAFE' }
  | { type: 'HAZARD_INJECTED'; payload: HazardIncident };

export function broadcastCrisisEvent(event: CrisisEvent) {
  if (crisisChannel) {
    try {
      crisisChannel.postMessage(event);
    } catch {
      // Ignore broadcast errors
    }
  }
}

export function subscribeToCrisisEvents(callback: (event: CrisisEvent) => void) {
  if (!crisisChannel) return () => {};
  const handler = (ev: MessageEvent<CrisisEvent>) => {
    callback(ev.data);
  };
  crisisChannel.addEventListener('message', handler);
  return () => {
    crisisChannel.removeEventListener('message', handler);
  };
}

/**
 * REST & State API Service Layer
 * Fully compatible with mock local state and ready to plug in backend endpoints
 */
export const crisisApi = {
  // -------------------------------------------------------------
  // PAGE 4: CALAMITY STUDIO ENDPOINTS
  // -------------------------------------------------------------
  async calibrateSimulation(controls: CalamitySimulationControls): Promise<{
    controls: CalamitySimulationControls;
    updatedTelemetry: PalarTelemetry;
  }> {
    // 1. Calculate new risk formula weights
    const rainfallP = Math.min(Math.round((controls.rainfallMmPerHour / 250) * 100), 100);
    const waterLevelW = Math.min(Math.round((controls.riverGaugeMeters / 10.5) * 100), 100);
    const inundationD = Math.min(Math.round((controls.inundationDepthFeet / 6.5) * 100), 100);
    const vulnerabilityV = 80;
    const evacuationDifficultyE = controls.inundationDepthFeet > 3.0 ? 85 : 50;

    const riskWeights: RiskFormulaWeights = calculateCompositeRisk({
      rainfallP,
      waterLevelW,
      inundationDepthD: inundationD,
      vulnerabilityV,
      evacuationDifficultyE,
    });

    let status: ThreatLevel = riskWeights.threatStatus;
    if (controls.riverGaugeMeters >= 7.5 || controls.riverDischargeCusecs > 28000) {
      status = 'RED';
    }

    const updatedTelemetry: PalarTelemetry = {
      riverGaugeMeters: controls.riverGaugeMeters,
      dangerMarkMeters: 7.5,
      dischargeRateCusecs: controls.riverDischargeCusecs,
      mordhanaDamDischargeCusecs: controls.mordhanaDamDischargeCusecs,
      status,
      advisoryText:
        status === 'RED'
          ? `CRITICAL ALERT: Palar discharge reached ${controls.riverDischargeCusecs.toLocaleString()} cusecs. Kangeyanallur Causeway is submerged. Evacuate Katpadi lowlands now.`
          : status === 'ORANGE'
          ? `WATCH ADVISORY: Palar river level at ${controls.riverGaugeMeters}m approaching danger mark. Prepare for evacuation.`
          : 'NORMAL: Palar river flow within safe embankment capacity.',
      hindiAdvisoryText:
        status === 'RED'
          ? `गंभीर चेतावनी: पालाड़ नदी का बहाव ${controls.riverDischargeCusecs.toLocaleString()} क्यूसेक पहुंचा। तुरंत ऊंचे स्थानों पर जाएं।`
          : 'सामान्य स्थिति: पालाड़ नदी का स्तर सामान्य है।',
      tamilAdvisoryText:
        status === 'RED'
          ? `அதிதீவிர எச்சரிக்கை: பாலாற்றில் ${controls.riverDischargeCusecs.toLocaleString()} கனஅடி நீர் பாய்கிறது. உடனே பாதுகாப்பான முகாம்களுக்கு செல்லவும்.`
          : 'பாதுகாப்பானது: ஆற்று நீர்மட்டம் இயல்பு நிலையில் உள்ளது.',
      lastUpdated: 'Live simulated sync via Crisis Engine',
      riskBreakdown: riskWeights,
    };

    // Broadcast change to other windows
    broadcastCrisisEvent({
      type: 'CALAMITY_UPDATED',
      payload: { controls, telemetry: updatedTelemetry },
    });

    return { controls, updatedTelemetry };
  },

  // -------------------------------------------------------------
  // PAGE 1: CITIZEN HELP ENDPOINTS
  // -------------------------------------------------------------
  async submitSOS(newRequest: SOSRequest): Promise<SOSRequest> {
    broadcastCrisisEvent({
      type: 'SOS_CREATED',
      payload: newRequest,
    });
    return newRequest;
  },

  // -------------------------------------------------------------
  // PAGE 2: DEOC COMMAND ENDPOINTS
  // -------------------------------------------------------------
  async dispatchUnit(sosId: string, unitName: string, responderId: string): Promise<FieldMission> {
    const mission: FieldMission = {
      id: `mis-${Date.now()}`,
      sosId,
      responderId,
      responderName: unitName,
      responderType: unitName.includes('Boat') ? 'NDRF_BOAT' : 'AAPDA_MITRA',
      status: 'ASSIGNED',
      targetLocation: [12.9320, 79.1120],
      targetLandmark: 'Shenbakkam Palar river corridor',
      trappedCount: 4,
      priorityLevel: 'P1_CRITICAL',
      waterLevel: 'FIRST_FLOOR_ROOFTOP',
      medicalUrgency: true,
      destinationShelterId: 'shelter-1',
      assignedAt: 'Just now',
      lastUpdateTimestamp: 'Just now',
    };

    broadcastCrisisEvent({
      type: 'UNIT_DISPATCHED',
      payload: { sosId, unitName, mission },
    });

    return mission;
  },

  async broadcastStage(stage: 'DANGER' | 'NEAR_DANGER' | 'SAFE'): Promise<'DANGER' | 'NEAR_DANGER' | 'SAFE'> {
    broadcastCrisisEvent({
      type: 'BROADCAST_STAGE_CHANGED',
      payload: stage,
    });
    return stage;
  },

  // -------------------------------------------------------------
  // PAGE 3: FIELD RESPONDER ENDPOINTS
  // -------------------------------------------------------------
  async updateMissionStatus(
    missionId: string,
    sosId: string,
    status: FieldMission['status']
  ): Promise<void> {
    broadcastCrisisEvent({
      type: 'MISSION_STATUS_UPDATED',
      payload: { missionId, status, sosId },
    });
  },

  async intakeVictimsToShelter(shelterId: string, victimCount: number): Promise<void> {
    broadcastCrisisEvent({
      type: 'SHELTER_OCCUPANCY_CHANGED',
      payload: { shelterId, delta: victimCount },
    });
  },
};

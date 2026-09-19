/**
 * SurakshaSetu Event Mesh & REST API Client
 * Connects frontend portals to the backend and synchronizes state via BroadcastChannel.
 */

import type {
  SOSRequest,
  HazardIncident,
  Shelter,
  PalarTelemetry,
  CrisisMeshMessage,
  CrisisEventType,
  CalamityDials,
} from '../types/disaster';
import {
  INITIAL_SOS_REQUESTS,
  INITIAL_HAZARDS,
  INITIAL_SHELTERS,
  INITIAL_TELEMETRY,
} from '../data/mockVelloreData';

const API_BASE = 'http://localhost:8000/api';
const MESH_CHANNEL_NAME = 'suraksha_crisis_mesh';

// Initialize Browser BroadcastChannel Event Mesh
let meshChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    meshChannel = new BroadcastChannel(MESH_CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel not supported or restricted in this environment:', e);
  }
}

/**
 * Broadcast an event across all active SurakshaSetu browser tabs/windows.
 */
export function broadcastCrisisEvent(type: CrisisEventType, payload: any, sender = 'web_client'): void {
  const message: CrisisMeshMessage = {
    type,
    payload,
    timestamp: new Date().toISOString(),
    sender,
  };

  if (meshChannel) {
    try {
      meshChannel.postMessage(message);
    } catch (err) {
      console.error('Error posting to crisis mesh:', err);
    }
  }
}

/**
 * Subscribe to the real-time crisis mesh event stream.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeCrisisMesh(handler: (msg: CrisisMeshMessage) => void): () => void {
  if (!meshChannel) return () => {};

  const listener = (event: MessageEvent<CrisisMeshMessage>) => {
    if (event.data && event.data.type) {
      handler(event.data);
    }
  };

  meshChannel.addEventListener('message', listener);
  return () => {
    meshChannel?.removeEventListener('message', listener);
  };
}

// ---------------------------------------------------------------------------
// REST API CLIENT WITH RESILIENT FALLBACK TO LOCAL DATA
// ---------------------------------------------------------------------------

async function safeFetch<T>(endpoint: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallback;
    }
    return (await res.json()) as T;
  } catch {
    // API server offline or unreachable -> seamless fallback
    return fallback;
  }
}

export const CrisisAPI = {
  // 1. SOS Distress Requests
  async getSOSRequests(): Promise<SOSRequest[]> {
    return safeFetch<SOSRequest[]>('/sos', INITIAL_SOS_REQUESTS);
  },

  async submitSOS(data: Partial<SOSRequest>): Promise<boolean> {
    broadcastCrisisEvent('NEW_SOS', data, 'citizen_portal');
    try {
      const res = await fetch(`${API_BASE}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch {
      return true; // Accepted locally into event mesh
    }
  },

  async dispatchResponder(sosId: string, unitName: string): Promise<boolean> {
    broadcastCrisisEvent('SOS_DISPATCH', { sosId, unitName }, 'command_center');
    try {
      const res = await fetch(`${API_BASE}/sos/${sosId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitName }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // 2. Hazards & Road Obstructions
  async getHazards(): Promise<HazardIncident[]> {
    return safeFetch<HazardIncident[]>('/hazards', INITIAL_HAZARDS);
  },

  async reportHazard(hazard: Partial<HazardIncident>): Promise<boolean> {
    broadcastCrisisEvent('NEW_HAZARD', hazard, 'field_responder');
    try {
      const res = await fetch(`${API_BASE}/hazards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hazard),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // 3. Shelters & Relief Supplies
  async getShelters(): Promise<Shelter[]> {
    return safeFetch<Shelter[]>('/shelters', INITIAL_SHELTERS);
  },

  async registerShelterIntake(shelterId: string, additionalOccupancy: number): Promise<boolean> {
    broadcastCrisisEvent('SHELTER_INTAKE', { shelterId, additionalOccupancy }, 'field_responder');
    try {
      const res = await fetch(`${API_BASE}/shelters/${shelterId}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: additionalOccupancy }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  // 4. Live Telemetry
  async getTelemetry(): Promise<PalarTelemetry> {
    return safeFetch<PalarTelemetry>('/telemetry', INITIAL_TELEMETRY);
  },

  // 5. Calamity Dials Sync
  broadcastCalamityDials(dials: CalamityDials): void {
    broadcastCrisisEvent('CALAMITY_DIALS_UPDATE', dials, 'calamity_studio');
  },

  // 6. Broadcast Threat Stage Override
  broadcastStageOverride(stage: 'DANGER' | 'NEAR_DANGER' | 'SAFE'): void {
    broadcastCrisisEvent('BROADCAST_STAGE_CHANGE', { stage }, 'command_center');
  },
};

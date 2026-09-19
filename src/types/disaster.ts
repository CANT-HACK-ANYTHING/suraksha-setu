export type ThreatLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export type CalamityType =
  | 'FLOOD'
  | 'FLASH_FLOOD'
  | 'CYCLONE'
  | 'EARTHQUAKE'
  | 'LANDSLIDE'
  | 'HEATWAVE';

export interface AmenityFlags {
  medicalAid: boolean;
  solarPower: boolean;
  drinkingWater: boolean;
  babyFood: boolean;
  wheelchairAccessible: boolean;
  communityKitchen: boolean;
  womenChildCare: boolean;
}

export interface Shelter {
  id: string;
  name: string;
  hindiName: string;
  tamilName: string;
  location: [number, number];
  address: string;
  capacityTotal: number;
  capacityOccupied: number;
  amenities: AmenityFlags;
  phone: string;
  distanceKm: number;
  status: 'OPEN' | 'NEAR_CAPACITY' | 'FULL';
  elevationMeters: number;
  contactPerson: string;
  lastVerifiedAt: string;
}

export type HazardType =
  | 'FLOOD_DEEP'
  | 'FALLEN_TREE'
  | 'LIVE_WIRE'
  | 'BRIDGE_CLOSED'
  | 'ROAD_COLLAPSE'
  | 'LANDSLIDE_DEBRIS';

export interface HazardIncident {
  id: string;
  type: HazardType;
  title: string;
  hindiTitle: string;
  tamilTitle: string;
  location: [number, number];
  roadName: string;
  waterDepthFeet?: number;
  status: 'UNVERIFIED' | 'COMMUNITY_CONFIRMED' | 'AUTHORITY_VERIFIED' | 'RESOLVED';
  upvotes: number;
  reportedAt: string;
  reportedBy: string;
}

export type WaterLevel = 'ANKLE_DEPTH' | 'WAIST_DEPTH' | 'FIRST_FLOOR_ROOFTOP';

export type EmergencyCategory =
  | 'BOAT_EVACUATION'
  | 'CRITICAL_MEDICAL'
  | 'STRANDED_FAMILY'
  | 'FOOD_WATER'
  | 'MISSING_PERSON'
  | 'DAMAGED_BRIDGE_ROAD'
  | 'SHELTER_OVERCROWDED';

export interface SOSRequest {
  id: string;
  citizenName: string;
  phone: string;
  location: [number, number];
  landmark: string;
  category: EmergencyCategory;
  trappedCount: number;
  hasInfants: boolean;
  hasElderlyOrDisabled: boolean;
  hasPregnantWomen: boolean;
  medicalEmergency: boolean;
  medicalDetails?: string;
  waterLevel: WaterLevel;
  urgencyScore: number;
  priorityLevel: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MODERATE';
  status: 'WAITING_DISPATCH' | 'RESCUE_BOAT_DISPATCHED' | 'RESCUED';
  dispatchedUnit?: string;
  timestamp: string;
}

export interface RiskFormulaWeights {
  rainfallForecastP: number; // 0.30 P
  riverWaterLevelW: number;  // 0.25 W
  inundationDepthD: number;  // 0.20 D
  vulnerabilityV: number;    // 0.15 V
  evacuationDifficultyE: number; // 0.10 E
  compositeScore: number;    // R
  threatStatus: ThreatLevel;
}

export interface PalarTelemetry {
  riverGaugeMeters: number;
  dangerMarkMeters: number;
  dischargeRateCusecs: number;
  mordhanaDamDischargeCusecs: number;
  status: ThreatLevel;
  advisoryText: string;
  hindiAdvisoryText: string;
  tamilAdvisoryText: string;
  lastUpdated: string;
  riskBreakdown: RiskFormulaWeights;
}

export type VolunteerSkill =
  | 'BOAT_OPERATOR'
  | 'AMBULANCE_DRIVER'
  | 'PARAMEDIC_DOCTOR'
  | 'FOOD_DISTRIBUTOR'
  | 'COMMUNITY_KITCHEN_CHEF'
  | 'DRONE_MAPPING';

export interface VolunteerResource {
  id: string;
  name: string;
  skill: VolunteerSkill;
  status: 'DEPLOYED' | 'STANDBY' | 'RETURNING';
  assignedZone: string;
  assetDetails: string;
  phoneMasked: string;
}

export interface MissingPersonReport {
  id: string;
  personName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'CHILD';
  lastSeenLocation: string;
  clothingDescription: string;
  reportedBy: string;
  contactPhone: string;
  status: 'SEARCHING' | 'FOUND_SAFE' | 'AT_SHELTER';
  shelterId?: string;
  timestamp: string;
}

export interface SafeCheckIn {
  id: string;
  name: string;
  familySize: number;
  currentShelterOrLocation: string;
  phone: string;
  status: 'SAFE_AT_SHELTER' | 'EVACUATED_TO_RELATIVES';
  timestamp: string;
}

export type Language = 'en' | 'hi' | 'ta';
export type AppMode = 'CITIZEN_HELP' | 'COMMAND_CENTER' | 'FIELD_RESPONDER' | 'CALAMITY_STUDIO' | 'CITIZEN';

export type ResponderRole = 'NDRF_BOAT_PILOT' | 'AAPDA_MITRA_VOLUNTEER' | 'SDRF_PARAMEDIC';

export type MissionStage =
  | 'ASSIGNED_EN_ROUTE'
  | 'ON_SCENE'
  | 'EXTRACTING_VICTIMS'
  | 'SAFE_AT_SHELTER';

export interface ResponderMission {
  id: string;
  sosId: string;
  assignedUnit: string;
  victimName: string;
  peopleCount: number;
  location: [number, number];
  locationName: string;
  stage: MissionStage;
  medicalAttentionNeeded: boolean;
  updatedAt: string;
}

export interface CalamityDials {
  palarDischargeCusecs: number; // 0 - 60,000
  riverGaugeMeters: number;      // 0 - 10.5 (7.5m Danger line)
  mordhanaDamCusecs: number;     // 0 - 30,000
  cycloneWindKmh: number;        // 0 - 180
  streetInundationFeet: number;  // 0 - 6.5
  gridPowerOutage: boolean;
}

export type CrisisEventType =
  | 'BROADCAST_STAGE_CHANGE'
  | 'CALAMITY_DIALS_UPDATE'
  | 'TELEMETRY_UPDATE'
  | 'NEW_SOS'
  | 'SOS_DISPATCH'
  | 'NEW_HAZARD'
  | 'HAZARD_RESOLVED'
  | 'SHELTER_INTAKE'
  | 'MISSION_STAGE_UPDATE';

export interface CrisisMeshMessage {
  type: CrisisEventType;
  payload: any;
  timestamp: string;
  sender: string;
}

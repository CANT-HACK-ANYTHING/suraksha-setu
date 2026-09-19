import type { RiskFormulaWeights, ThreatLevel } from '../types/disaster';

/**
 * Multi-Hazard Decision Support Risk Scoring Engine
 * Blueprint Formula: R = 0.30P + 0.25W + 0.20D + 0.15V + 0.10E
 *
 * P = Rainfall forecast risk (0-100)
 * W = River / water-level surge risk (0-100)
 * D = Reported inundation depth risk (0-100)
 * V = Population vulnerability index (0-100)
 * E = Evacuation difficulty / cut-off factor (0-100)
 */
export function calculateCompositeRisk(params: {
  rainfallP: number;
  waterLevelW: number;
  inundationDepthD: number;
  vulnerabilityV: number;
  evacuationDifficultyE: number;
}): RiskFormulaWeights {
  const { rainfallP, waterLevelW, inundationDepthD, vulnerabilityV, evacuationDifficultyE } = params;

  const R =
    0.30 * rainfallP +
    0.25 * waterLevelW +
    0.20 * inundationDepthD +
    0.15 * vulnerabilityV +
    0.10 * evacuationDifficultyE;

  const compositeScore = Math.min(Math.round(R), 100);

  let threatStatus: ThreatLevel = 'GREEN';
  if (compositeScore >= 75) {
    threatStatus = 'RED';
  } else if (compositeScore >= 50) {
    threatStatus = 'ORANGE';
  } else if (compositeScore >= 25) {
    threatStatus = 'YELLOW';
  }

  return {
    rainfallForecastP: rainfallP,
    riverWaterLevelW: waterLevelW,
    inundationDepthD: inundationDepthD,
    vulnerabilityV: vulnerabilityV,
    evacuationDifficultyE: evacuationDifficultyE,
    compositeScore,
    threatStatus,
  };
}

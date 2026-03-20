/**
 * players.js — Static player definitions for both squads.
 *
 * Stats format: { base: number, max: number }  (§11 Stat Format)
 * max = base + volatilityRange (default 2), used to check if human can win.
 *
 * Signature skills (§6.5):
 *   huCF — "Clinical"  (Shoot): +3 flat bonus on SHO resolution
 *   huCB — "Sweeper"   (Block): +1 Heat on successful Block
 *   aiGK — "Wall"      (Block): AI GK volatility reduced to 0 on Block saves
 */

export const HUMAN_SQUAD = [
  {
    id: 'huGK', name: 'Torres', kickoffZone: '1B',
    stats: {
      DRI: { base: 6,  max: 8  },
      PAS: { base: 8,  max: 10 },
      SHO: { base: 5,  max: 7  },
      AGG: { base: 9,  max: 11 },
      COM: { base: 11, max: 13 },
      SPE: 3,
    },
    volatility: 2, heat: 0, xp: 0, level: 1,
    sig: null,
  },
  {
    id: 'huCB', name: 'Diallo', kickoffZone: '2B',
    stats: {
      DRI: { base: 7,  max: 9  },
      PAS: { base: 8,  max: 10 },
      SHO: { base: 6,  max: 8  },
      AGG: { base: 8,  max: 10 },
      COM: { base: 10, max: 12 },
      SPE: 3,
    },
    volatility: 2, heat: 0, xp: 0, level: 1,
    sig: {
      name: 'Sweeper', action: 'block',
      effect: { heatBonus: 1 },   // +1 Heat on successful Block
    },
  },
  {
    id: 'huRB', name: 'Soto', kickoffZone: '3C',
    stats: {
      DRI: { base: 9,  max: 11 },
      PAS: { base: 9,  max: 11 },
      SHO: { base: 7,  max: 9  },
      AGG: { base: 7,  max: 9  },
      COM: { base: 8,  max: 10 },
      SPE: 4,
    },
    volatility: 2, heat: 0, xp: 0, level: 1,
    sig: null,
  },
  {
    id: 'huLW', name: 'Nkosi', kickoffZone: '4A',
    stats: {
      DRI: { base: 10, max: 12 },
      PAS: { base: 10, max: 12 },
      SHO: { base: 9,  max: 11 },
      AGG: { base: 6,  max: 8  },
      COM: { base: 7,  max: 9  },
      SPE: 5,
    },
    volatility: 2, heat: 0, xp: 0, level: 1,
    sig: null,
  },
  {
    id: 'huCF', name: 'Marco', kickoffZone: '5B',
    stats: {
      DRI: { base: 11, max: 13 },
      PAS: { base: 9,  max: 11 },
      SHO: { base: 12, max: 14 },
      AGG: { base: 5,  max: 7  },
      COM: { base: 6,  max: 8  },
      SPE: 4,
    },
    volatility: 2, heat: 0, xp: 0, level: 1,
    sig: {
      name: 'Clinical', action: 'shoot',
      effect: { flatBonus: 3 },   // +3 to SHO on shoot resolution
    },
  },
];

export const AI_SQUAD = [
  {
    id: 'aiGK', name: 'Kovač', kickoffZone: '6B',
    stats: {
      DRI: { base: 5,  max: 5  },
      PAS: { base: 7,  max: 7  },
      SHO: { base: 4,  max: 4  },
      AGG: { base: 8,  max: 8  },
      COM: { base: 12, max: 12 },
      SPE: 3,
    },
    volatility: 0, heat: 0,
    sig: {
      name: 'Wall', action: 'block',
      effect: { volatilityOverride: 0 },  // COM volatility = 0 on Block saves
    },
  },
  {
    id: 'aiCB', name: 'Reyes', kickoffZone: '5B',
    stats: {
      DRI: { base: 7,  max: 7  },
      PAS: { base: 7,  max: 7  },
      SHO: { base: 6,  max: 6  },
      AGG: { base: 9,  max: 9  },
      COM: { base: 10, max: 10 },
      SPE: 3,
    },
    volatility: 0, heat: 0, sig: null,
  },
  {
    id: 'aiRB', name: 'Dupont', kickoffZone: '4A',
    stats: {
      DRI: { base: 9,  max: 9  },
      PAS: { base: 8,  max: 8  },
      SHO: { base: 7,  max: 7  },
      AGG: { base: 7,  max: 7  },
      COM: { base: 8,  max: 8  },
      SPE: 4,
    },
    volatility: 0, heat: 0, sig: null,
  },
  {
    id: 'aiLW', name: 'Osei', kickoffZone: '3C',
    stats: {
      DRI: { base: 10, max: 10 },
      PAS: { base: 9,  max: 9  },
      SHO: { base: 8,  max: 8  },
      AGG: { base: 6,  max: 6  },
      COM: { base: 7,  max: 7  },
      SPE: 5,
    },
    volatility: 0, heat: 0, sig: null,
  },
  {
    id: 'aiCF', name: 'Pinto', kickoffZone: '2B',
    stats: {
      DRI: { base: 11, max: 11 },
      PAS: { base: 8,  max: 8  },
      SHO: { base: 10, max: 10 },
      AGG: { base: 5,  max: 5  },
      COM: { base: 6,  max: 6  },
      SPE: 4,
    },
    volatility: 0, heat: 0, sig: null,
  },
];

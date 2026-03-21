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
      DRI: { base: 2,  max: 4  },
      PAS: { base: 4,  max: 6  },
      SHO: { base: 2,  max: 4  },
      AGG: { base: 14, max: 16 }, // THE MOUNTAIN
      COM: { base: 15, max: 17 }, // THE MOUNTAIN
      SPE: 2,
    },
    volatility: 2, heat: 0, fitness: 40, maxFitness: 40, xp: 0, level: 1,
    number: 1,
    sig: null,
  },
  {
    id: 'huCB', name: 'Diallo', kickoffZone: '2B',
    stats: {
      DRI: { base: 5,  max: 7  },
      PAS: { base: 6,  max: 8  },
      SHO: { base: 4,  max: 6  },
      AGG: { base: 12, max: 14 },
      COM: { base: 13, max: 15 },
      SPE: 3,
    },
    volatility: 2, heat: 0, fitness: 35, maxFitness: 35, xp: 0, level: 1,
    number: 4,
    sig: {
      name: 'Sweeper', action: 'block',
      effect: { heatBonus: 1 },
    },
  },
  {
    id: 'huRB', name: 'Soto', kickoffZone: '3C',
    stats: {
      DRI: { base: 9,  max: 11 },
      PAS: { base: 10, max: 12 }, // THE ENGINE
      SHO: { base: 7,  max: 9  },
      AGG: { base: 8,  max: 10 },
      COM: { base: 10, max: 12 },
      SPE: 4,
    },
    volatility: 2, heat: 0, fitness: 45, maxFitness: 45, xp: 0, level: 1,
    number: 2,
    sig: null,
  },
  {
    id: 'huLW', name: 'Nkosi', kickoffZone: '4A',
    stats: {
      DRI: { base: 14, max: 16 }, // THE BLUR
      PAS: { base: 12, max: 14 }, // THE BLUR
      SHO: { base: 10, max: 12 },
      AGG: { base: 3,  max: 5  },
      COM: { base: 4,  max: 6  },
      SPE: 6,
    },
    volatility: 2, heat: 0, fitness: 12, maxFitness: 12, xp: 0, level: 1,
    number: 7,
    sig: null,
  },
  {
    id: 'huCF', name: 'Marco', kickoffZone: '5B',
    stats: {
      DRI: { base: 10, max: 12 },
      PAS: { base: 8,  max: 10 },
      SHO: { base: 14, max: 16 }, // THE SPECIALIST
      AGG: { base: 4,  max: 6  },
      COM: { base: 5,  max: 7  },
      SPE: 4,
    },
    volatility: 2, heat: 0, fitness: 18, maxFitness: 18, xp: 0, level: 1,
    number: 10,
    sig: {
      name: 'Clinical', action: 'shoot',
      effect: { flatBonus: 3 },
    },
  },
];

export const AI_SQUAD = [
  {
    id: 'aiGK', name: 'Kovač', kickoffZone: '6B',
    stats: {
      DRI: { base: 4,  max: 4  },
      PAS: { base: 10, max: 10 },
      SHO: { base: 4,  max: 4  },
      AGG: { base: 13, max: 13 },
      COM: { base: 16, max: 16 }, // THE WALL
      SPE: 3,
    },
    volatility: 0, heat: 0, fitness: 30, maxFitness: 30,
    number: 22,
    sig: {
      name: 'Wall', action: 'block',
      effect: { volatilityOverride: 0 },
    },
  },
  {
    id: 'aiCB', name: 'Reyes', kickoffZone: '5B',
    stats: {
      DRI: { base: 6,  max: 6  },
      PAS: { base: 7,  max: 7  },
      SHO: { base: 6,  max: 6  },
      AGG: { base: 15, max: 15 }, // IRON DEFENSE
      COM: { base: 14, max: 14 },
      SPE: 3,
    },
    volatility: 0, heat: 0, fitness: 35, maxFitness: 35, number: 5, sig: null,
  },
  {
    id: 'aiRB', name: 'Dupont', kickoffZone: '3C',
    stats: {
      DRI: { base: 10, max: 10 },
      PAS: { base: 11, max: 11 },
      SHO: { base: 8,  max: 8  },
      AGG: { base: 10, max: 10 },
      COM: { base: 10, max: 10 },
      SPE: 4,
    },
    volatility: 0, heat: 0, fitness: 25, maxFitness: 25, number: 8, sig: null,
  },
  {
    id: 'aiLW', name: 'Osei', kickoffZone: '4A',
    stats: {
      DRI: { base: 15, max: 15 }, // ELITE DRIBBLER
      PAS: { base: 13, max: 13 },
      SHO: { base: 10, max: 10 },
      AGG: { base: 5,  max: 5  },
      COM: { base: 6,  max: 6  },
      SPE: 5,
    },
    volatility: 0, heat: 0, fitness: 15, maxFitness: 15, number: 11, sig: null,
  },
  {
    id: 'aiCF', name: 'Pinto', kickoffZone: '2B',
    stats: {
      DRI: { base: 10, max: 10 },
      PAS: { base: 8,  max: 8  },
      SHO: { base: 15, max: 15 }, // MASTER FINISHER
      AGG: { base: 5,  max: 5  },
      COM: { base: 6,  max: 6  },
      SPE: 4,
    },
    volatility: 0, heat: 0, fitness: 20, maxFitness: 20, number: 9, sig: null,
  },
];

/**
 * players.js — Player Definitions (V2.30 Nightmare AI).
 * 
 * CHALLENGE PHILOSOPHY:
 * - AI Stats are set to 18-20.
 * - Human Max Base Roll (Stat + 3) cannot beat AI base stats.
 * - RESULT: Move usage (Red/Blue/Gray) is MANDATORY to win duels.
 */

export const HUMAN_SQUAD = [
  {
    id: 'huGK', name: 'Poliakov', kickoffZone: '1B',
    stats: {
      PAS: 10, SHO: 6, AGG: 10, COM: 11, DIV: 12, REF: 14, SPE: 4,
    },
    momentum: 0, fitness: 45, maxFitness: 45, number: 1, sig: null,
    portrait: '/huGK_portrait.png',
  },
  {
    id: 'huCB', name: 'Fritz', kickoffZone: '2B',
    stats: {
      DRI: 8, PAS: 10, SHO: 7, AGG: 12, COM: 12, SPE: 5,
    },
    momentum: 0, fitness: 40, maxFitness: 40, number: 4,
    sig: {
      name: 'Sweeper', action: 'block',
      effect: { momentumBonus: 1 },
    },
    portrait: '/huCB_portrait.png',
  },
  {
    id: 'huRB', name: 'Suzuki', kickoffZone: '3C',
    stats: {
      DRI: 10, PAS: 12, SHO: 8, AGG: 11, COM: 11, SPE: 6,
    },
    momentum: 0, fitness: 45, maxFitness: 45, number: 2, sig: null,
    portrait: '/huRB_portrait.png',
  },
  {
    id: 'huLW', name: 'Junior', kickoffZone: '4A',
    stats: {
      DRI: 14, PAS: 13, SHO: 11, AGG: 8, COM: 8, SPE: 8,
    },
    momentum: 0, fitness: 20, maxFitness: 20, number: 7, sig: null,
    portrait: '/huLW_portrait.png',
  },
  {
    id: 'huCF', name: 'Donaldinho', kickoffZone: '5B',
    stats: {
      DRI: 11, PAS: 9, SHO: 15, AGG: 8, COM: 9, SPE: 6,
    },
    momentum: 0, fitness: 25, maxFitness: 25, number: 10,
    sig: {
      name: 'Clinical', action: 'shoot',
      effect: { flatBonus: 3 },
    },
    portrait: '/huCF_portrait.png',
  },
];

export const AI_SQUAD = [
  {
    id: 'aiGK', name: 'Lasagna', kickoffZone: '6B',
    stats: {
      PAS: 11, SHO: 7, AGG: 12, COM: 13, DIV: 19, REF: 13, SPE: 4,
    },
    momentum: 0, fitness: 45, maxFitness: 45, number: 22,
    sig: {
      name: 'Wall', action: 'block',
      effect: { fixedMax: true },
    },
    portrait: '/aiGK_portrait.png',
  },
  {
    id: 'aiCB', name: 'McLovin', kickoffZone: '5B',
    stats: {
      DRI: 12, PAS: 15, SHO: 22, AGG: 25, COM: 24, SPE: 5,
    },
    momentum: 0, fitness: 40, maxFitness: 40, number: 5, sig: null,
    portrait: '/aiCB_portrait.png',
  },
  {
    id: 'aiRB', name: 'Dupont', kickoffZone: '3C',
    stats: {
      DRI: 20, PAS: 22, SHO: 20, AGG: 22, COM: 22, SPE: 6,
    },
    momentum: 0, fitness: 35, maxFitness: 35, number: 8, sig: null,
    portrait: '/aiRB_portrait.png',
  },
  {
    id: 'aiLW', name: 'Ping', kickoffZone: '4A',
    stats: {
      DRI: 22, PAS: 25, SHO: 22, AGG: 18, COM: 15, SPE: 7,
    },
    momentum: 0, fitness: 25, maxFitness: 25, number: 11, sig: null,
    portrait: '/aiLW_portrait.png',
  },
  {
    id: 'aiCF', name: 'Pong', kickoffZone: '2B',
    stats: {
      DRI: 25, PAS: 15, SHO: 25, AGG: 15, COM: 15, SPE: 6,
    },
    momentum: 0, fitness: 30, maxFitness: 30, number: 9, sig: null,
    portrait: '/aiCF_portrait.png',
  },
];

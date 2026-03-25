/**
 * moves.js — Strategic Move Deck V2.0 (High Stakes).
 * 
 * TRADEOFF PHILOSOPHY:
 * - Red (Vs Press): Escape vs Fitness/Momentum drain.
 * - Blue (Vs Block): Precision vs Rhythm/Resource.
 * - Gray (Defense): Protection vs Exhaustion.
 */

export const MOVES = [
  // ── RED moves (Vs Press: Escape & Agility) ────────────────────────
  {
    id: 'fluid_dribble',
    name: 'Fluid Dribble',
    color: 'red',
    tuCost: 1,
    momentumReq: 0,
    effect: { stat: 'DRI', bonus: 3, momentumDelta: 1 }, 
    description: '+3 DRI, +1 Momentum. Slick.',
  },
  {
    id: 'full_send',
    name: 'Full Send',
    color: 'red',
    tuCost: 3,
    momentumReq: 0,
    effect: { stat: 'DRI', bonus: 8, fitnessDelta: -6 },
    description: '+8 DRI, -6 Fit. Burn the jets.',
  },
  {
    id: 'elastic_kick',
    name: 'Elastic Kick',
    color: 'red',
    tuCost: 2,
    momentumReq: 1,
    effect: { stat: 'DRI', bonus: 4, momentumDelta: 2 },
    description: 'Bouncing rhythm. +4 DRI, +2 Momentum.',
  },
  {
    id: 'nutmeg',
    name: 'Nutmeg',
    color: 'red',
    tuCost: 2,
    momentumReq: 3,
    effect: { stat: 'DRI', bonus: 7, aiValueDelta: -2 },
    description: 'Humiliating. +7 DRI, -2 AI.',
  },
  {
    id: 'maradona_turn',
    name: '360 Roulette',
    color: 'red',
    tuCost: 3,
    momentumReq: 4,
    effect: { stat: 'DRI', bonus: 10, momentumDelta: -4 },
    description: 'Elite escape. +10 DRI, -4 Momentum.',
  },

  // ── BLUE moves (Vs Block: Precision & Power) ──────────────────────
  {
    id: 'chip_pass',
    name: 'Chip Pass',
    color: 'blue',
    tuCost: 1,
    momentumReq: 0,
    effect: { stat: 'PAS', bonus: 4, ballState: 'AIR' },
    description: '+4 PAS. Sets ball to AIR.',
  },
  {
    id: 'no_look_pass',
    name: 'No-Look Pass',
    color: 'blue',
    tuCost: 2,
    momentumReq: 2,
    effect: { stat: 'PAS', bonus: 6, momentumDelta: -1 },
    description: 'Deception. +6 PAS, -1 Momentum.',
  },
  {
    id: 'rocket_shot',
    name: 'Rocket Shot',
    color: 'blue',
    tuCost: 3,
    momentumReq: 3,
    effect: { stat: 'SHO', bonus: 7 },
    description: 'Blast through. +7 SHO vs Block.',
  },
  {
    id: 'precision_cross',
    name: 'Precision Cross',
    color: 'blue',
    tuCost: 2,
    momentumReq: 4,
    effect: { stat: 'PAS', bonus: 8, fitnessDelta: -4 },
    description: 'Deep effort. +8 PAS, -4 Fit.',
  },
  {
    id: 'trivela_flick',
    name: 'Trivela Flick',
    color: 'blue',
    tuCost: 3,
    momentumReq: 6,
    effect: { stat: 'SHO', bonus: 12, momentumDelta: -5 },
    description: 'Magical curve. +12 SHO, -5 Momentum.',
  },

  // ── GRAY moves (Defense: Holding the Line) ────────────────────────
  {
    id: 'jockey',
    name: 'Jockey',
    color: 'gray',
    tuCost: 1,
    momentumReq: 0,
    effect: { stat: 'COM', bonus: 3 },
    description: 'Safe play. +3 COM.',
  },
  {
    id: 'crunching_tackle',
    name: 'Crunching Tackle',
    color: 'gray',
    tuCost: 2,
    momentumReq: 0,
    effect: { stat: 'AGG', bonus: 6, fitnessDelta: -3 },
    description: 'Aggressive poke. +6 AGG, -3 Fit.',
  },
  {
    id: 'shadow_cover',
    name: 'Shadow Cover',
    color: 'gray',
    tuCost: 2,
    momentumReq: 1,
    effect: { aiValueDelta: -5 },
    description: 'Suffocating. -5 to AI.',
  },
  {
    id: 'tactical_foul',
    name: 'Last Man Tackle',
    color: 'gray',
    tuCost: 3,
    momentumReq: 0,
    effect: { stat: 'AGG', bonus: 12, fitnessDelta: -10 },
    description: 'Stop them cold. +12 AGG, -10 Fit.',
  },
  {
    id: 'respiratory_sync',
    name: 'Iron Lungs',
    color: 'gray',
    tuCost: 1,
    momentumReq: 2,
    effect: { fitnessDelta: 10 },
    description: 'Breathe. +10 Fitness (Req: 2 Mom).',
  },
];

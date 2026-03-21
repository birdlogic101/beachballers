/**
 * moves.js — Starter move deck definitions.
 *
 * Move colors (§5 AI Intent Filter):
 *   red  → counters Press
 *   blue → counters Block
 *   gray → defense (when AI attacks)
 *
 * Effect types supported in V1.0:
 *   { stat: 'DRI'|'PAS'|'SHO'|'AGG'|'COM', bonus: number, duration: 'duel'|'match' }
 *   { heatDelta: number }   ← directly modifies heat
 */

export const MOVES = [
  // ── RED moves (counter Press) ──────────────────────────────────────
  {
    id: 'slippery_footwork',
    name: 'Slippery Footwork',
    color: 'red',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'DRI', bonus: 4, heatDelta: 1 }, 
    description: '+4 DRI, +1 Heat. Slick.',
  },
  {
    id: 'full_send',
    name: 'Full Send',
    color: 'red',
    tuCost: 2,
    heatReq: 1,
    effect: { stat: 'DRI', bonus: 8, fitnessDelta: -5 },
    description: '+8 DRI, -5 Fit. Desperate.',
  },
  {
    id: 'showboat',
    name: 'Showboat',
    color: 'red',
    tuCost: 1,
    heatReq: 5,
    effect: { stat: 'DRI', bonus: 2, nextMoveBonus: 3 },
    description: '+2 DRI. Next move +3.',
  },
  {
    id: 'body_feint',
    name: 'Body Feint',
    color: 'red',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'DRI', bonus: 3 },
    description: 'Basic feint. +3 DRI.',
  },
  {
    id: 'flair_pass',
    name: 'Flair Pass',
    color: 'red',
    tuCost: 2,
    heatReq: 2,
    effect: { stat: 'PAS', bonus: 6, heatDelta: -3 },
    description: 'Style over rhythm. +6 PAS, -3 Heat.',
  },

  // ── BLUE moves (counter Block) ─────────────────────────────────────
  {
    id: 'lobby_pass',
    name: 'Lobby Pass',
    color: 'blue',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'PAS', bonus: 4, ballState: 'AIR' },
    description: '+4 PAS. Balls in the AIR.',
  },
  {
    id: 'false_shot',
    name: 'False Shot',
    color: 'blue',
    tuCost: 2,
    heatReq: 2,
    effect: { convertTo: 'DRI', bonus: 3 },
    description: 'Fake it. DRI vs Block (+3).',
  },
  {
    id: 'the_cannon',
    name: 'The Cannon',
    color: 'blue',
    tuCost: 3,
    heatReq: 4,
    effect: { stat: 'SHO', bonus: 10, heatDelta: -2 },
    description: 'Nuclear. +10 SHO, -2 Heat.',
  },
  {
    id: 'precision_shot',
    name: 'Precision Shot',
    color: 'blue',
    tuCost: 2,
    heatReq: 0,
    effect: { stat: 'SHO', bonus: 5 },
    description: 'Steady aim. +5 SHO.',
  },
  {
    id: 'one_two',
    name: 'One-Two',
    color: 'blue',
    tuCost: 2,
    heatReq: 1,
    effect: { stat: 'PAS', bonus: 4, heatDelta: 2 },
    description: 'Build rhythm. +4 PAS, +2 Heat.',
  },

  // ── GRAY moves (Defense) ─────────────────────────
  {
    id: 'jockey',
    name: 'Jockey',
    color: 'gray',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'COM', bonus: 3 },
    description: 'Safe play. +3 COM.',
  },
  {
    id: 'aggressive_poke',
    name: 'Aggressive Poke',
    color: 'gray',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'AGG', bonus: 5, heatDelta: -2 },
    description: 'Steal it! +5 AGG, -2 Heat.',
  },
  {
    id: 'sand_trap',
    name: 'Sand Trap',
    color: 'gray',
    tuCost: 2,
    heatReq: 1,
    effect: { aiValueDelta: -3 },
    description: 'Quicksand. -3 to AI.',
  },
  {
    id: 'tactical_foul',
    name: 'Tactical Foul',
    color: 'gray',
    tuCost: 3,
    heatReq: 0,
    effect: { stat: 'AGG', bonus: 10, fitnessDelta: -10 },
    description: 'Stop them now. +10 AGG, -10 Fit.',
  },
  {
    id: 'iron_lungs',
    name: 'Iron Lungs',
    color: 'gray',
    tuCost: 1,
    heatReq: 0,
    effect: { fitnessDelta: 5 },
    description: 'Breathe. +5 Fitness.',
  },
];

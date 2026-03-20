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
    id: 'body_feint',
    name: 'Body Feint',
    color: 'red',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'DRI', bonus: 2, duration: 'duel' },
    description: '+2 DRI this duel.',
  },
  {
    id: 'burst_step',
    name: 'Burst Step',
    color: 'red',
    tuCost: 2,
    heatReq: 0,
    effect: { stat: 'DRI', bonus: 4, duration: 'duel' },
    description: '+4 DRI this duel.',
  },
  {
    id: 'ignite',
    name: 'Ignite',
    color: 'red',
    tuCost: 2,
    heatReq: 2,
    effect: { heatDelta: 2 },
    description: '+2 Heat. Best used when already warm.',
  },

  // ── BLUE moves (counter Block) ─────────────────────────────────────
  {
    id: 'through_ball',
    name: 'Through Ball',
    color: 'blue',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'PAS', bonus: 2, duration: 'duel' },
    description: '+2 PAS this duel.',
  },
  {
    id: 'precision',
    name: 'Precision',
    color: 'blue',
    tuCost: 2,
    heatReq: 0,
    effect: { stat: 'SHO', bonus: 3, duration: 'duel' },
    description: '+3 SHO this duel.',
  },
  {
    id: 'composure',
    name: 'Composure',
    color: 'blue',
    tuCost: 1,
    heatReq: -2,
    effect: { heatDelta: 1 },
    description: '+1 Heat. Available even when cold.',
  },

  // ── GRAY moves (defense — when AI attacks) ─────────────────────────
  {
    id: 'read_play',
    name: 'Read the Play',
    color: 'gray',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'COM', bonus: 2, duration: 'duel' },
    description: '+2 COM this duel.',
  },
  {
    id: 'pressure',
    name: 'Pressure',
    color: 'gray',
    tuCost: 2,
    heatReq: 1,
    effect: { stat: 'AGG', bonus: 3, duration: 'duel' },
    description: '+3 AGG this duel. Requires 1 Heat.',
  },
];

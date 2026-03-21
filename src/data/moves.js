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
    description: '+2 DRI. Simple and effective.',
  },
  {
    id: 'quick_layoff',
    name: 'Quick Layoff',
    color: 'red',
    tuCost: 1,
    heatReq: 1,
    effect: { stat: 'PAS', bonus: 3, duration: 'duel' },
    description: '+3 PAS. Play around the pressure.',
  },
  {
    id: 'nutmeg',
    name: 'Nutmeg',
    color: 'red',
    tuCost: 2,
    heatReq: 2,
    effect: { stat: 'DRI', bonus: 5, heatDelta: -1 },
    description: '+5 DRI but -1 Heat. High risk.',
  },
  {
    id: 'adrenaline',
    name: 'Adrenaline',
    color: 'red',
    tuCost: 2,
    heatReq: 0,
    effect: { heatDelta: 1, stat: 'DRI', bonus: 2, duration: 'duel' },
    description: '+1 Heat and +2 DRI.',
  },
  {
    id: 'pump_up_red',
    name: 'Pump Up',
    color: 'red',
    tuCost: 1,
    heatReq: -2,
    effect: { heatDelta: 1 },
    description: '+1 Heat. Get the rhythm back.',
  },

  // ── BLUE moves (counter Block) ─────────────────────────────────────
  {
    id: 'through_ball',
    name: 'Through Ball',
    color: 'blue',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'PAS', bonus: 2, duration: 'duel' },
    description: '+2 PAS. Split the defense.',
  },
  {
    id: 'pump_up_blue',
    name: 'Pump Up',
    color: 'blue',
    tuCost: 1,
    heatReq: -2,
    effect: { heatDelta: 1 },
    description: '+1 Heat. Find the gap.',
  },
  {
    id: 'tiki_taka',
    name: 'Tiki Taka',
    color: 'blue',
    tuCost: 3,
    heatReq: 2,
    effect: { stat: 'PAS', bonus: 3, duration: 'match' },
    description: '+3 PAS for the entire MATCH.',
  },
  {
    id: 'power_blast',
    name: 'Power Blast',
    color: 'blue',
    tuCost: 2,
    heatReq: 4,
    effect: { stat: 'SHO', bonus: 6, heatDelta: -2 },
    description: '+6 SHO but -2 Heat. Unstoppable.',
  },
  {
    id: 'dummy_run',
    name: 'Dummy Run',
    color: 'blue',
    tuCost: 2,
    heatReq: 1,
    effect: { stat: 'DRI', bonus: 3, duration: 'duel' },
    description: '+3 DRI. Bait the block.',
  },
  {
    id: 'precision_shot',
    name: 'Precision Shot',
    color: 'blue',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'SHO', bonus: 3, duration: 'duel' },
    description: '+3 SHO.',
  },

  // ── GRAY moves (defense — when AI attacks) ─────────────────────────
  {
    id: 'read_play',
    name: 'Read the Play',
    color: 'gray',
    tuCost: 1,
    heatReq: 0,
    effect: { stat: 'COM', bonus: 2, duration: 'duel' },
    description: '+2 COM.',
  },
  {
    id: 'ignite',
    name: 'Ignite',
    color: 'gray',
    tuCost: 1,
    heatReq: -1,
    effect: { heatDelta: 2 },
    description: '+2 Heat. Prepare to Press.',
  },
  {
    id: 'wind_wall',
    name: 'Wind Wall',
    color: 'gray',
    tuCost: 2,
    heatReq: 2,
    effect: { aiValueDelta: -3, duration: 'duel' },
    description: '-3 to AI intent info. Cold as ice.',
  },
  {
    id: 'full_block',
    name: 'Full Block',
    color: 'gray',
    tuCost: 3,
    heatReq: 3,
    effect: { stat: 'COM', bonus: 6, duration: 'duel' },
    description: '+6 COM. Stand your ground.',
  },
  {
    id: 'stark_tackle',
    name: 'Stark Tackle',
    color: 'gray',
    tuCost: 2,
    heatReq: 1,
    effect: { stat: 'AGG', bonus: 5, heatDelta: -1 },
    description: '+5 AGG but -1 Heat.',
  },
  {
    id: 'second_wind',
    name: 'Second Wind',
    color: 'gray',
    tuCost: 1,
    heatReq: -5,
    effect: { heatDelta: 2 },
    description: '+2 Heat. Only when exhausted.',
  },
];

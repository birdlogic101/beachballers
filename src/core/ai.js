/**
 * ai.js — AI intent generation (Slay The Spire style).
 *
 * KEY RULES (§2, §4 AI ASYMMETRY):
 *  - AI has NO Playbook, Heat, or Touch Units
 *  - Intent is a fixed outcome value or flat modifier
 *  - Intents: Press, Block, Dribble, Pass, Shoot
 *  - AI has NO volatility — all values are fixed
 */

export const AI_ACTIONS = {
  PRESS:   'Press',
  BLOCK:   'Block',
  DRIBBLE: 'Dribble',
  PASS:    'Pass',
  SHOOT:   'Shoot',
};

/** Maps AI intent to the human move color it loads (§5 AI Intent Filter) */
export const INTENT_TO_MOVE_COLOR = {
  Press:   'red',
  Block:   'blue',
  Dribble: 'gray',
  Pass:    'gray',
  Shoot:   'gray',
};

/**
 * Generates the AI's intent for the current duel.
 *
 * @param {Object}  aiPlayer    - AI player object
 * @param {string}  zone        - AI player's current zone
 * @param {boolean} isDefending - true if AI is defender, false if attacker
 * @returns {{ action: string, value: number }}
 */
export function generateIntent(aiPlayer, zone, isDefending) {
  const row = parseInt(zone[0]);

  // Use context-specific weights
  const weights = isDefending ? _defendingWeights(row) : _attackingWeights(row);
  
  // Filter actions based on context
  const actions = isDefending 
    ? { PRESS: AI_ACTIONS.PRESS, BLOCK: AI_ACTIONS.BLOCK }
    : { DRIBBLE: AI_ACTIONS.DRIBBLE, PASS: AI_ACTIONS.PASS, SHOOT: AI_ACTIONS.SHOOT };

  const action  = _weightedPick(actions, weights);
  const value   = _intentValue(aiPlayer, action);

  return { action, value };
}

function _defendingWeights(row) {
  // [Press, Block]
  switch (row) {
    case 5: case 6: return [20, 80]; // Back: prioritize block
    case 1: case 2: return [70, 30]; // Front: prioritize press
    default:        return [50, 50];
  }
}

function _attackingWeights(row) {
  // [Dribble, Pass, Shoot]
  switch (row) {
    case 1: case 2: return [20, 10, 70]; // Close to goal: shoot!
    case 5: case 6: return [40, 60,  0]; // Far back: dribble/pass out
    default:        return [40, 40, 20];
  }
}

function _weightedPick(actions, weights) {
  const keys   = Object.values(actions);
  const total  = weights.reduce((a, b) => a + b, 0);
  let rand     = Math.random() * total;
  for (let i = 0; i < keys.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return keys[i];
  }
  return keys[keys.length - 1];
}

function _intentValue(aiPlayer, action) {
  const stats = aiPlayer.stats;
  switch (action) {
    case AI_ACTIONS.PRESS:   return stats.AGG.base;
    case AI_ACTIONS.BLOCK:   return stats.COM.base;
    case AI_ACTIONS.DRIBBLE: return stats.DRI.base;
    case AI_ACTIONS.PASS:    return stats.PAS.base;
    case AI_ACTIONS.SHOOT:   return stats.SHO.base;
    default:                 return 0;
  }
}

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
 * In V1.0, intent probabilities are simple weighted rolls based on zone.
 * Modelled as STS-style: the AI "telegraphs" a fixed action.
 *
 * @param {Object} aiPlayer  - AI player object with stats
 * @param {string} zone      - AI player's current zone
 * @returns {{ action: string, value: number }}
 */
export function generateIntent(aiPlayer, zone) {
  const row = parseInt(zone[0]);

  // Weight table: [Press, Block, Dribble, Pass, Shoot]
  // AI becomes more aggressive (shoot/press) closer to human goal (rows 2-3)
  // AI tends to defend (block/pass) farther back (rows 4-5)
  const weights = _intentWeights(row);
  const action  = _weightedPick(AI_ACTIONS, weights);
  const value   = _intentValue(aiPlayer, action);

  return { action, value };
}

function _intentWeights(row) {
  // [Press, Block, Dribble, Pass, Shoot]
  switch (row) {
    case 2: return [25, 15, 20, 15, 25]; // aggressive
    case 3: return [20, 15, 25, 20, 20];
    case 4: return [10, 25, 25, 30, 10]; // balanced
    case 5: return [10, 30, 20, 35,  5]; // defensive
    default:return [15, 20, 25, 25, 15];
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

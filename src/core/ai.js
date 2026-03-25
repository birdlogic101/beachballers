import { rollMomentum } from './duel.js';
import { getRole } from './formation.js';

/**
 * ai.js — AI intent generation (Slay The Spire style).
 *
 * KEY RULES (§2, §4 AI ASYMMETRY):
 *  - AI uses the SAME Momentum/Roll rules as Human.
 *  - Intent is PRE-ROLLED: the player sees the final outcome (Attribute + Roll).
 *  - Block = Attribute + Momentum (Fixed).
 *  - Press/Dribble/Pass/Shoot = Attribute + Roll(0, Momentum).
 */

export const AI_ACTIONS = {
  PRESS:   'press',
  BLOCK:   'block',
  DRIBBLE: 'dribble',
  PASS:    'pass',
  SHOOT:   'shoot',
};

/** Maps AI intent to the human move color it loads (§5 AI Intent Filter) */
export const INTENT_TO_MOVE_COLOR = {
  press:   'red',
  block:   'blue',
  dribble: 'gray',
  pass:    'gray',
  shoot:   'gray',
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
  let weights = isDefending ? _defendingWeights(row) : _attackingWeights(row);
  console.log(`[AI-GENERA-INTENT] Player: ${aiPlayer.name}, Mom: ${aiPlayer.momentum}, Row: ${row}, SHO: ${aiPlayer.stats.SHO}`);
  
  // Filter actions based on context
  const actions = isDefending 
    ? { PRESS: AI_ACTIONS.PRESS, BLOCK: AI_ACTIONS.BLOCK }
    : { DRIBBLE: AI_ACTIONS.DRIBBLE, PASS: AI_ACTIONS.PASS, SHOOT: AI_ACTIONS.SHOOT };

  // NEWS (§6.2): AI Shooting Momentum Validation
  // AI Row numbering: 6(Own GK) -> 1(Human GK).
  // Formula: req = row - 1 (e.g. Row 4 requires 3 Momentum).
  if (!isDefending) {
    const momentum = aiPlayer.momentum || 0;
    const shootReq = Math.max(0, row - 1);
    if (momentum < shootReq) {
      weights = [...weights]; // Clone to avoid mutation
      weights[2] = 0; // Disable SHOOT weight
    }
  }

  // Safety (§GK Rule): GKs cannot DRIBBLE
  if (getRole(zone) === 'GK' && !isDefending) {
    weights = [...weights];
    weights[0] = 0; // Dribble weight = 0
  }

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
  const momentum = aiPlayer.momentum || 0;
  const stats = aiPlayer.stats;
  let attr;
  
  switch (action) {
    case AI_ACTIONS.PRESS:   attr = (stats.AGG || 0); break;
    case AI_ACTIONS.BLOCK:   attr = (stats.COM || 0); break;
    case AI_ACTIONS.DRIBBLE: attr = (stats.DRI || 0); break;
    case AI_ACTIONS.PASS:    attr = (stats.PAS || 0); break;
    case AI_ACTIONS.SHOOT:   attr = (stats.SHO || 0); break;
    default:                 attr = 0; break;
  }

  const isBlock = action === AI_ACTIONS.BLOCK;
  const isWall  = aiPlayer.sig && aiPlayer.sig.name === 'Wall' && isBlock;

  let finalVal;
  if (isBlock || isWall) {
    finalVal = attr + momentum;
  } else {
    finalVal = rollMomentum(attr, momentum);
    console.log(`[AI-ROLL] Attr ${attr} + Roll [0..${momentum}] = ${finalVal}`);
  }

  console.log(`[AI-INTENT] Player: ${aiPlayer.name}, Action: ${action}, Attr: ${attr}, Mom: ${momentum}, Final: ${finalVal}`);
  return finalVal;
}

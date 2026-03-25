import { MOVES } from '../data/moves.js';

/**
 * duel.js — Duel setup, resolution, and momentum rolling.
 *
 * KEY RULES:
 *  - Defender wins on tie (§11 Tie-Break)
 *  - Human rolls momentum first, then compare vs AI fixed value (§11 Resolution Sequence)
 *  - Attacker must STRICTLY exceed defender to win
 */

/**
 * Rolls a player's stat with momentum.
 * Result is in [base, base + momentum] (if positive) or [base + momentum, base] (if negative).
 * NEWS (§11): Universal roll logic.
 * @param {number} base
 * @param {number} momentum
 * @returns {number}
 */
export function rollMomentum(base, momentum) {
  if (momentum === 0) return base;
  if (momentum > 0) {
    return base + Math.floor(Math.random() * (momentum + 1));
  } else {
    // Negative momentum (Cold Trap)
    return base + Math.floor(Math.random() * (momentum - 1 + 1)); // floor(rand * -2) e.g. 0, -1, -2
  }
}

/**
 * Core resolution: compare a (rolled) attack value vs a (fixed) defend value.
 * Defender wins on equal (§11 Tie-Break).
 * @param {number} attackValue   - final attack value (after momentum roll)
 * @param {number} defendValue   - final defend value (AI fixed, or human rolled)
 * @returns {'attacker' | 'defender'}
 */
export function resolveAction(attackValue, defendValue) {
  return attackValue > defendValue ? 'attacker' : 'defender';
}

/**
 * Returns the resolution of a Block action.
 * Block wins on tie (Block >= Attacker).
 * @param {number} attackerVal
 * @param {number} blockVal
 * @returns {'steal' | 'penalty'}
 */
export function resolveBlockResolution(attackerVal, blockVal) {
  return blockVal >= attackerVal ? 'steal' : 'muffled';
}

/**
 * Sets up a new duel between an attacker and a defender.
 * Assigns the lane (inside/outside) for the attacker randomly.
 * Defender is always inside (§5 Lanes).
 *
 * @param {Object} attacker - player object
 * @param {Object} defender - player object (AI)
 * @param {Object} aiIntent - { action: string, value: number }
 * @returns {Object} activeDuel partial state
 */
export function setupDuel(attacker, defender, aiIntent) {
  const lane = Math.random() < 0.5 ? 'inside' : 'outside';
  const touchUnits = Math.max(3, attacker.stats.SPE);

  // NEWS (§5): Reactionary Filter. Load moves matching AI intent color.
  const action = aiIntent.action.toLowerCase();
  let filterColor = 'gray'; // Default (Defense)
  if (action === 'press') filterColor = 'red';
  if (action === 'block') filterColor = 'blue';

  const moveHand = MOVES.filter(m => m.color === filterColor);

  return {
    attacker:    attacker.id,
    defender:    defender.id,
    lane,
    touchUnits,
    movesPlayed: [],
    moveHand, 
    aiIntent,
    buffs:       {},
  };
}

/**
 * Returns the effective stat value for a player in the current duel.
 * 
 * KEY RULES (§11):
 * - HUMAN: Attribute + Roll(0, Momentum) (except Block).
 * - BLOCK: Attribute + Momentum (Secure Max).
 * - AI: Pre-rolled intent value includes momentum.
 *
 * @param {Object} player
 * @param {string} stat             e.g. 'DRI', 'PAS', 'SHO', 'REF'
 * @param {Object} buffs            e.g. { DRI: 3, SHO: -1 }
 * @param {string} actionType       e.g. 'dribble', 'block', 'press'
 * @param {boolean} isHuman
 * @returns {number}
 */
export function getEffectiveValue(player, stat, buffs = {}, actionType = 'pass', isHuman = true) {
  const momentum = player.momentum || 0;
  const attr = player.stats[stat] || 0;
  const base = Math.max(0, attr + (buffs[stat] ?? 0));
  
  const isBlock = actionType.toLowerCase() === 'block';
  
  if (isHuman) {
    if (isBlock) {
      return base + momentum; // Secure Max
    } else {
      return rollMomentum(base, momentum); // Gamble
    }
  }
  
  // AI case: If we are here, it's for internal calculation (not the fixed intent display)
  // For AI, we still use the roll for consistency if needed, but usually we use fixed intent.
  return rollMomentum(base, momentum);
}

export function applyMoveEffect(state, move) {
  const buffs = { ...state.activeDuel.buffs };
  let momentumDelta = 0;
  let fitnessDelta = 0;

  // 1. Basic Stat Buffs
  if (move.effect.stat && (!move.effect.duration || move.effect.duration === 'duel')) {
    const current = buffs[move.effect.stat] || 0;
    buffs[move.effect.stat] = current + move.effect.bonus;
  }

  // 2. Resource Deltas
  if (move.effect.momentumDelta) momentumDelta = move.effect.momentumDelta;
  if (move.effect.fitnessDelta)  fitnessDelta  = move.effect.fitnessDelta;

  // 3. Info Manipulation
  if (move.effect.aiValueDelta) {
    const current = buffs.aiValueDelta || 0;
    buffs.aiValueDelta = current + move.effect.aiValueDelta;
  }

  // 4. Tactical Flags
  if (move.effect.convertTo)      buffs.convertTo = move.effect.convertTo;
  if (move.effect.ballState)      buffs.ballState = move.effect.ballState;
  if (move.effect.nextMoveBonus)  buffs.nextMoveBonus = move.effect.nextMoveBonus;

  return { buffs, momentumDelta, fitnessDelta };
}

/**
 * Applies a signature skill bonus to the final value.

 * Only triggers on Exit Actions (§6.5).
 * @param {Object} player
 * @param {string} exitAction  'dribble' | 'pass' | 'shoot'
 * @param {number} value       current final value
 * @returns {number}
 */
export function applySignatureSkill(player, actionType, value) {
  const sig = player.sig;
  if (!sig || sig.action !== actionType.toLowerCase()) return value;
  
  let finalVal = value;
  
  if (sig.effect.flatBonus) {
    finalVal += sig.effect.flatBonus;
  }
  
  if (sig.effect.fixedMax) {
    // Wall effect: Force result to [Base + Momentum]
    finalVal = (player.stats[player.id === 'huGK' || player.id === 'aiGK' ? (_getStatKey(actionType)) : (_getStatKey(actionType))] || 0) + (player.momentum || 0);
    // Actually simpler if we just pass the range, but for now let's just make it very strong.
    finalVal += 5; // Simulating a "Good" roll for the Wall.
  }
  
  return finalVal;
}

function _getStatKey(action) {
  const map = { dribble: 'DRI', pass: 'PAS', shoot: 'SHO', press: 'AGG', block: 'COM', save: 'DIV' };
  return map[action.toLowerCase()] || 'PAS';
}

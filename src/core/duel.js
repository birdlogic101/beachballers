import { MOVES } from '../data/moves.js';

/**
 * duel.js — Duel setup, resolution, and volatility rolling.
 *
 * KEY RULES:
 *  - Defender wins on tie (§11 Tie-Break)
 *  - Human rolls volatility first, then compare vs AI fixed value (§11 Resolution Sequence)
 *  - Attacker must STRICTLY exceed defender to win
 */

/**
 * Rolls a human player's stat with volatility.
 * Result is always in [base, base + volatilityRange].
 * @param {number} base
 * @param {number} volatilityRange  e.g. 2 → rolls 0, 1, or 2 extra
 * @returns {number}
 */
export function rollVolatility(base, volatilityRange = 2) {
  return base + Math.floor(Math.random() * (volatilityRange + 1));
}

/**
 * Core resolution: compare a (rolled) attack value vs a (fixed) defend value.
 * Defender wins on equal (§11 Tie-Break).
 * @param {number} attackValue   - final attack value (after volatility roll)
 * @param {number} defendValue   - final defend value (AI fixed, or human rolled)
 * @returns {'attacker' | 'defender'}
 */
export function resolveAction(attackValue, defendValue) {
  return attackValue > defendValue ? 'attacker' : 'defender';
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

  return {
    attacker:    attacker.id,
    defender:    defender.id,
    lane,
    touchUnits,
    movesPlayed: [],
    moveHand:    [...MOVES], 
    aiIntent,
    buffs:       {},
  };
}

/**
 * Returns the effective attack stat value for a player in the current duel,
 * accounting for buffs accumulated from move cards this turn.
 * @param {Object} player
 * @param {string} stat      e.g. 'DRI', 'PAS', 'SHO'
 * @param {Object} buffs     e.g. { DRI: 3, SHO: -1 }
 * @param {number} volatilityRange
 * @returns {number}
 */
export function getEffectiveAttackValue(player, stat, buffs = {}, volatilityRange = 2) {
  const base = player.stats[stat].base + (buffs[stat] ?? 0);
  return rollVolatility(base, volatilityRange);
}

export function applyMoveEffect(state, move) {
  const buffs = { ...state.activeDuel.buffs };
  let heatDelta = 0;
  let fitnessDelta = 0;

  // 1. Basic Stat Buffs
  if (move.effect.stat && (!move.effect.duration || move.effect.duration === 'duel')) {
    const current = buffs[move.effect.stat] || 0;
    buffs[move.effect.stat] = current + move.effect.bonus;
  }

  // 2. Resource Deltas
  if (move.effect.heatDelta)    heatDelta = move.effect.heatDelta;
  if (move.effect.fitnessDelta) fitnessDelta = move.effect.fitnessDelta;

  // 3. Info Manipulation
  if (move.effect.aiValueDelta) {
    const current = buffs.aiValueDelta || 0;
    buffs.aiValueDelta = current + move.effect.aiValueDelta;
  }

  // 4. Tactical Flags (Stored in buffs to persist through the duel)
  if (move.effect.convertTo)      buffs.convertTo = move.effect.convertTo;
  if (move.effect.ballState)      buffs.ballState = move.effect.ballState;
  if (move.effect.nextMoveBonus)  buffs.nextMoveBonus = move.effect.nextMoveBonus;

  return { buffs, heatDelta, fitnessDelta };
}

/**
 * Applies a signature skill bonus to the final value.

 * Only triggers on Exit Actions (§6.5).
 * @param {Object} player
 * @param {string} exitAction  'dribble' | 'pass' | 'shoot'
 * @param {number} value       current final value
 * @returns {number}
 */
export function applySignatureSkill(player, exitAction, value) {
  const sig = player.sig;
  if (!sig || sig.action !== exitAction) return value;
  return value + (sig.effect.flatBonus ?? 0);
}

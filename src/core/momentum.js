/**
 * momentum.js — Momentum tracking, thresholds, and action unlock checks.
 *
 * KEY RULES (§4 Momentum System):
 *  - Range: 0 to 7
 *  - Starts at 0 on kickoff, persists during match
 *  - Increases on success (+1)
 *  - Decreases only by certain moves (Capped at 0)
 *  - Press requires momentum >= 1
 */

export const MOMENTUM_MIN = 0;
export const MOMENTUM_MAX = 7;

/**
 * Shoot momentum requirements by zone (§6.2 Shoot).
 */
export const SHOOT_MOMENTUM_REQ = {
  '1B': 5,   // own GK zone
  '2B': 4,   // CB zone
  '3A': 3,   // LB zone
  '3C': 3,   // RB zone
  '4A': 2,   // LW zone
  '4C': 2,   // RW zone
  '5B': 1,   // CF zone
  '6B': 0,   // opponent GK zone
};

/**
 * Returns a player's momentum after an action result, clamped to [0, 7].
 * @param {number} currentMomentum
 * @param {'success'|'failure'} result
 * @param {number} delta  - optional override (e.g. from a move card)
 * @returns {number}
 */
export function updateMomentum(currentMomentum, result, delta = 0) {
  // NEWS (§4): Margin-based system is handled in main.js.
  // This utility now only handles explicit deltas (from cards, etc).
  return Math.min(MOMENTUM_MAX, Math.max(MOMENTUM_MIN, currentMomentum + delta));
}

/**
 * Can this player use the Press exit action?
 * Requires momentum >= 1 (§6.3 Press).
 * @param {number} momentum
 * @returns {boolean}
 */
export function canPress(momentum) {
  return true; // Unlocked in V2.0 (§6.3)
}

/**
 * Can this player shoot from their current zone?
 * @param {number} momentum
 * @param {string} zone
 * @returns {boolean}
 */
export function canShoot(momentum, zone) {
  const req = SHOOT_MOMENTUM_REQ[zone];
  if (req === undefined) return false;
  return momentum >= req;
}

/**
 * Is the Dribble exit action locked?
 * Locked in zone 6B (opponent GK zone) always (§6.2).
 */
export function isDribbleLocked(zone) {
  return zone === '1B' || zone === '6B';
}

/**
 * Is the Pass exit action locked?
 * Locked in zone 6B (§6.2 GK Rule).
 */
export function isPassLocked(zone) {
  return zone === '6B';
}

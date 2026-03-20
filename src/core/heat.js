/**
 * heat.js — Heat tracking, thresholds, and action unlock checks.
 *
 * KEY RULES (§4 Heat System):
 *  - Range: -5 (cold) to +10 (on fire)
 *  - Starts at 0 on kickoff, persists during match
 *  - GK gains heat on saves (+1 per save) only
 *  - Press requires heat >= 1 (intentional design — §11)
 */

export const HEAT_MIN = -5;
export const HEAT_MAX = 10;

/**
 * Shoot heat requirements by zone (§6.2 Shoot).
 */
export const SHOOT_HEAT_REQ = {
  '1B': 6,   // own GK zone
  '2B': 5,   // CB zone
  '3A': 4,   // LB zone
  '3C': 4,   // RB zone
  '4A': 3,   // LW zone
  '4C': 3,   // RW zone
  '5B': 2,   // CF zone
  '6B': 1,   // opponent GK zone
};

/**
 * Returns a player's heat after an action result, clamped to [HEAT_MIN, HEAT_MAX].
 * @param {number} currentHeat
 * @param {'success'|'failure'} result
 * @param {number} delta  - optional override (e.g. from a move card)
 * @returns {number}
 */
export function updateHeat(currentHeat, result, delta = null) {
  const change = delta !== null ? delta : (result === 'success' ? 1 : -1);
  return Math.min(HEAT_MAX, Math.max(HEAT_MIN, currentHeat + change));
}

/**
 * GK-specific: heat gains +1 on a save.
 */
export function updateHeatOnSave(currentHeat) {
  return updateHeat(currentHeat, 'success');
}

/**
 * Can this player use the Press exit action?
 * Requires heat >= 1 (§6.3 Press — intentional design).
 * @param {number} heat
 * @returns {boolean}
 */
export function canPress(heat) {
  return heat >= 1;
}

/**
 * Can this player shoot from their current zone?
 * @param {number} heat
 * @param {string} zone
 * @returns {boolean}
 */
export function canShoot(heat, zone) {
  const req = SHOOT_HEAT_REQ[zone];
  if (req === undefined) return false;
  return heat >= req;
}

/**
 * Is the Dribble exit action locked?
 * Locked in zone 6B (opponent GK zone) always (§6.2).
 * Also locked if maxHumanValue < AI intent value (checked in duel.js).
 * @param {string} zone
 * @returns {boolean}
 */
export function isDribbleLocked(zone) {
  return zone === '6B';
}

/**
 * Is the Pass exit action locked?
 * Locked in zone 6B (§6.2 GK Rule).
 * @param {string} zone
 * @returns {boolean}
 */
export function isPassLocked(zone) {
  return zone === '6B';
}

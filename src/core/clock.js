/**
 * clock.js — Match clock system (§8 Match Clock & Time System).
 *
 * KEY RULES:
 *  - 2 halves × 12 virtual minutes = 24 total
 *  - Clock ticks +1 minute each time an Exit Action is pressed
 *  - Match ends at 24:00; ongoing duels resolve first if ball in flight
 */

export const MATCH_DURATION = 24;   // total virtual minutes
export const HALF_DURATION  = 12;   // virtual minutes per half

/**
 * Advances the clock by 1 virtual minute (called on every Exit Action).
 * @param {number} currentClock - minutes elapsed so far
 * @returns {number}
 */
export function tick(currentClock) {
  return Math.min(MATCH_DURATION, currentClock + 1);
}

/**
 * Returns true if the match is over.
 * @param {number} clock
 * @returns {boolean}
 */
export function isMatchOver(clock) {
  return clock >= MATCH_DURATION;
}

/**
 * Returns whether we're currently in the second half.
 * @param {number} clock
 * @returns {boolean}
 */
export function isSecondHalf(clock) {
  return clock >= HALF_DURATION;
}

/**
 * Formats the clock for display: "MM:SS" where seconds are always 00.
 * e.g. 5 → "05:00", 12 → "12:00"
 * @param {number} clock
 * @returns {string}
 */
export function formatClock(clock) {
  return `${String(clock).padStart(2, '0')}:00`;
}

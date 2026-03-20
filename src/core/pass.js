/**
 * pass.js — Heat-driven pass targeting (§6.2 Pass System).
 *
 * KEY RULES:
 *  - Heat > 0 : pass forward X rows (capped at row 5 for field, not 6B)
 *  - Heat < 0 : pass back X rows (capped at row 2 for field; GK always to 2B)
 *  - Heat = 0 : lane switch — same row, opposite column
 *  - GK EXCEPTION: GK at 1B always passes to 2B regardless of Heat (§6.2 Scenario E)
 *  - Locked in zone 6B (handled by heat.isPassLocked)
 */

/** Zone → row number */
const rowOf = z => parseInt(z[0]);

/** Zone → column letter */
const colOf = z => z.slice(1);

/**
 * The "opposite column" in the same row for a Heat=0 lane switch.
 * Row 3 and 4 have A and C as the two options.
 * Rows 2 and 5 only have B — no meaningful lane switch possible.
 */
function oppositeLaneZone(zone) {
  const col = colOf(zone);
  const row = rowOf(zone);
  if (row === 3 || row === 4) {
    return col === 'A' ? `${row}C` : `${row}A`;
  }
  // Row 2 or 5: only B exists — return same zone (no switch possible)
  return zone;
}

/**
 * Returns the target zone for a pass action.
 *
 * @param {number} heat         - current heat of the passer
 * @param {string} fromZone     - zone the passer is currently in
 * @returns {string}            - target zone
 */
export function getPassTarget(heat, fromZone) {
  // GK exception: always passes to 2B
  if (fromZone === '1B') return '2B';

  const row = rowOf(fromZone);

  if (heat === 0) {
    return oppositeLaneZone(fromZone);
  }

  if (heat > 0) {
    // Forward pass: X rows ahead where X = heat value, capped at row 5
    const targetRow = Math.min(5, row + heat);
    return `${targetRow}B`;
  }

  // heat < 0: backward pass: X rows back where X = |heat|, capped at row 2
  const targetRow = Math.max(2, row + heat); // heat is negative so this subtracts
  return `${targetRow}B`;
}

/**
 * Returns whether a pass scenario triggers the Ripple (formation change).
 * Currently: ALL passes trigger ripple EXCEPT the GK roll-out (static).
 * @param {string} fromZone
 * @returns {boolean}
 */
export function passTriggersRipple(fromZone) {
  return fromZone !== '1B';
}

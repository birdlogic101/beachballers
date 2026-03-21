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
 * The ball seeks the closest teammate to the target row.
 */
export function getPassTarget(state, fromZone) {
  const isHuman = (state.possession === 'human');
  const teammates = isHuman ? state.humans : state.ais;
  const passer = teammates.find(p => p.zone === fromZone);
  
  if (!passer) return fromZone;

  // GK exception: always passes to next row
  if (fromZone === '1B') {
     const t2B = teammates.find(p => p.zone === '2B');
     if (t2B) return '2B';
  }
  if (fromZone === '6B') {
     const t5B = teammates.find(p => p.zone === '5B');
     if (t5B) return '5B';
  }

  const heat = passer.heat || 0;
  const row = rowOf(fromZone);
  let targetRow;

  if (heat === 0) {
    // Lane Switch or Small movement
    targetRow = row;
  } else if (isHuman) {
    targetRow = Math.min(5, Math.max(2, row + heat));
  } else {
    targetRow = Math.min(5, Math.max(2, row - heat));
  }

  // Find teammate closest to targetRow (but not the passer)
  const choices = teammates.filter(p => p.id !== passer.id);
  if (choices.length === 0) return fromZone;

  // Sort by row distance to targetRow
  choices.sort((a, b) => {
    const distA = Math.abs(rowOf(a.zone) - targetRow);
    const distB = Math.abs(rowOf(b.zone) - targetRow);
    if (distA !== distB) return distA - distB;
    // Tie-break: prefer forward direction
    const bwdA = isHuman ? (rowOf(a.zone) < row) : (rowOf(a.zone) > row);
    const bwdB = isHuman ? (rowOf(b.zone) < row) : (rowOf(b.zone) > row);
    if (bwdA !== bwdB) return bwdA ? 1 : -1;
    return 0;
  });

  const bestZone = choices[0].zone;
  
  // FINAL SAFETY (§6.2 Fix): If logic results in same zone, force a different teammate
  if (bestZone === fromZone) {
     return choices[1] ? choices[1].zone : fromZone;
  }

  return bestZone;
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

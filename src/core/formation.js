/**
 * formation.js — Grid constants, role mapping, and cascade (rotation) engine.
 *
 * CASCADE ALGORITHM (derived from §7):
 *   Sort 4 field humans by row: [p0(r2), p1(r3), p2(r4), p3(r5)]
 *   - Dribble from row 2:  swap {p0,p1} AND {p2,p3}  ("full cascade")
 *   - Dribble from row 3:  swap {p1,p2} only           ("mid cascade")
 *   - Dribble from row 4:  swap {p0,p1} AND {p2,p3}  ("full cascade")
 *   - Dribble from row 5:  dribbler → 6B, no cascade  ("goal duel")
 *
 *   Zone assignment per swap:
 *   - Advancing player  → dribbleTarget(their old zone, [other's old zone])
 *   - Dropping player   → mirrorDribbleTarget(their old zone, [other's old zone])
 *   Exception: slot-0 drop always = 2B, slot-3 advance always = 5B.
 *
 * AI Coverage: after each cascade, AI re-distributes to match same zones
 * as human field players, preserving 1v1 at every occupied row.
 */

// ─── Grid ────────────────────────────────────────────────────────────────────

export const ZONES = ['1B', '2B', '3A', '3C', '4A', '4C', '5B', '6B'];

// ─── Role mapping (§3) ───────────────────────────────────────────────────────

export function getRole(zone) {
  const roleMap = {
    '1B': 'GK', '2B': 'CB',
    '3A': 'LB', '3C': 'RB',
    '4A': 'LW', '4C': 'RW',
    '5B': 'CF', '6B': 'GK',
  };
  return roleMap[zone] ?? null;
}

// ─── Kickoff positions (§3) ──────────────────────────────────────────────────

export const KICKOFF_HUMAN = { GK: '1B', CB: '2B', RB: '3C', LW: '4A', CF: '5B' };
export const KICKOFF_AI    = { GK: '6B', CB: '5B', RB: '4A', LW: '3C', CF: '2B' };

// ─── Dribble target column rules (§7 Core Principles) ────────────────────────

/**
 * Returns the target zone when a human player at `fromZone` dribbles forward.
 * Column is preserved where possible; rows 4x both converge to 5B.
 */
export function dribbleTarget(fromZone, occupiedByTeammates = []) {
  switch (fromZone) {
    case '2B': return !occupiedByTeammates.includes('3A') ? '3A' : '3C';
    case '3A': return '4A';
    case '3C': return '4C';
    case '4A': return '5B';
    case '4C': return '5B';
    case '5B': return '6B';
    default:   return null;
  }
}

/** Mirror: target zone for an AI player dribbling toward row 1. */
export function mirrorDribbleTarget(fromZone, occupiedByTeammates = []) {
  switch (fromZone) {
    case '5B': return !occupiedByTeammates.includes('4C') ? '4C' : '4A';
    case '4C': return '3C';
    case '4A': return '3A';
    case '3C': return '2B';
    case '3A': return '2B';
    case '2B': return '1B';
    default:   return null;
  }
}

// ─── Cascade engine ───────────────────────────────────────────────────────────

/**
 * Applies human dribble cascade. Returns updated { humans, ais }.
 * @param {Object}   state
 * @param {string}   dribblerZone  - zone the dribbler is leaving
 */
export function cascade(state, dribblerZone) {
  const humans = state.humans.map(p => ({ ...p }));
  const ais    = state.ais.map(p =>   ({ ...p }));

  _applyRotation(humans, dribblerZone, false);
  _redistributeAI(humans, ais, '1B', '6B');

  return { humans, ais };
}

/**
 * Mirror cascade for AI dribble success (§7 Mirror Rule).
 */
export function mirrorCascade(state, dribblerZone) {
  const humans = state.humans.map(p => ({ ...p }));
  const ais    = state.ais.map(p =>   ({ ...p }));

  _applyRotation(ais, dribblerZone, true);
  _redistributeAI(ais, humans, '6B', '1B');

  return { humans, ais };
}

// ─── Core rotation helper ─────────────────────────────────────────────────────

/**
 * Applies the zone rotation in-place to `team` (either humans or ais).
 *
 * @param {Object[]} team         mutated in place
 * @param {string}   dribblerZone the zone the dribbler is leaving
 * @param {boolean}  mirror       true = AI direction (toward row 1)
 */
function _applyRotation(team, dribblerZone, mirror) {
  const gkZone   = mirror ? '6B' : '1B';
  const goalZone = mirror ? '1B' : '6B';

  // Sort ascending (r2 → r5) for human; descending (r5 → r2) for AI
  const field = team
    .filter(p => p.zone !== gkZone)
    .sort((a, b) => mirror
      ? _rowOf(b.zone) - _rowOf(a.zone)   // AI: r5 first (their "back")
      : _rowOf(a.zone) - _rowOf(b.zone)   // Human: r2 first (their "back")
    );

  if (field.length < 4) return;

  // In both directions, field = [p0(back), p1, p2, p3(front)]
  // p0=r2,r1=r3,p2=r4,p3=r5 for human
  // p0=r5,p1=r4,p2=r3,p3=r2 for AI
  const [p0, p1, p2, p3] = field;
  const row = _rowOf(dribblerZone);

  // Map the dribbler's row to a slot index (0=back, 3=front)
  const dribblerIdx = field.findIndex(p => p.zone === dribblerZone);

  if (dribblerIdx === 3) {
    // Front player dribbles → Goal Duel, no cascade
    const dribbler = field.find(p => p.zone === dribblerZone);
    if (dribbler) dribbler.zone = goalZone;
    return;
  }

  if (dribblerIdx === 0 || dribblerIdx === 2) {
    // Back or mid-back player → full cascade: swap both pairs
    _swapPair(p0, p1, mirror);
    _swapPair(p2, p3, mirror);
  } else {
    // dribblerIdx === 1: mid-front player → single pair swap
    _swapPair(p1, p2, mirror);
  }
}


/**
 * Swaps two adjacent-row players' zones.
 * The advancing player (lower row for human, higher for AI) uses dribbleTarget.
 * The dropping player uses mirrorDribbleTarget.
 *
 * @param {Object}  pLow   player in the lower-numbered row
 * @param {Object}  pHigh  player in the higher-numbered row
 * @param {boolean} mirror  true = AI direction (pHigh advances)
 */
function _swapPair(pLow, pHigh, mirror) {
  const oldLow = pLow.zone;

  if (!mirror) {
    pLow.zone  = dribbleTarget(oldLow, [pHigh.zone]);
    pHigh.zone = _safeDropZone(oldLow);   // drop to opposite col in pLow's row
  } else {
    pLow.zone  = mirrorDribbleTarget(oldLow, [pHigh.zone]);
    pHigh.zone = _safeDropZone(oldLow);
  }
}

/** The zone the dropping player lands in: same row as oldLow, opposite column. */
function _safeDropZone(oldLow) {
  const row = _rowOf(oldLow);
  const col = oldLow.slice(1);
  if (row === 2 || row === 5) return `${row}B`;  // only B is valid
  const opp = col === 'A' ? 'C' : col === 'C' ? 'A' : 'B';
  return `${row}${opp}`;
}




// ─── AI redistribution ────────────────────────────────────────────────────────

/**
 * After a team cascade, the cover team re-distributes to sit in the same
 * zones as the moved team's field players (1v1 preserved).
 */
function _redistributeAI(movedTeam, coverTeam, movedGKZone, coverGKZone) {
  const movedField = movedTeam
    .filter(p => p.zone !== movedGKZone)
    .sort((a, b) => _rowOf(a.zone) - _rowOf(b.zone));

  const coverField = coverTeam
    .filter(p => p.zone !== coverGKZone)
    .sort((a, b) => _rowOf(a.zone) - _rowOf(b.zone));

  movedField.forEach((mover, i) => {
    if (coverField[i]) coverField[i].zone = mover.zone;
  });
}

function _rowOf(zone) { return parseInt(zone[0]); }

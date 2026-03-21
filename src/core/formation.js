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
export const KICKOFF_AI    = { GK: '6B', CB: '5B', RB: '3C', LW: '4A', CF: '2B' };

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
  
  // Goal Duel (§7.4): No ripple if dribbling from row 5
  if (parseInt(dribblerZone[0]) === 5) return { humans, ais };

  // High-fidelity AI marker tracking (§7)
  const row = parseInt(dribblerZone[0]);
  _redistributeAIIdentity(humans, ais, row, false);

  return { humans, ais };
}

export function mirrorCascade(state, dribblerZone) {
  const humans = state.humans.map(p => ({ ...p }));
  const ais    = state.ais.map(p =>   ({ ...p }));

  _applyRotation(ais, dribblerZone, true);
  
  // Goal Duel (§7.4): No ripple if AI dribbling into row 1
  if (parseInt(dribblerZone[0]) === 2) return { humans, ais };

  const row = parseInt(dribblerZone[0]);
  _redistributeAIIdentity(ais, humans, row, true);

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
 * Identity-based redistribution (§7 Ripple Effects).
 * Maps specific AI players to human field players based on the dribble row.
 */
function _redistributeAIIdentity(movedTeam, coverTeam, dribbleRow, isMirror) {
  const gkZone = isMirror ? '6B' : '1B';
  const cvGK   = isMirror ? '1B' : '6B';

  const mField = movedTeam.filter(p => p.zone !== gkZone);
  const cField = coverTeam.filter(p => p.zone !== cvGK);
  if (mField.length < 4 || cField.length < 4) return;

  // Identity Map: we need a stable way to find RB, LW, CB, CF
  const getP = (team, role) => team.find(p => p.id.toLowerCase().includes(role.toLowerCase()));
  
  // Define markers based on scenarios (§7)
  let markerMap = {}; // { humanRole -> aiRole }
  
  // Scenario Row logic: 
  // Human R2/R4 dribbles -> Full Cascade.
  // Human R3 dribble -> Mid Cascade.
  // (Mirror matches appropriately)
  const isFull = (isMirror ? (dribbleRow === 5 || dribbleRow === 3) : (dribbleRow === 2 || dribbleRow === 4));
  const isMid  = (isMirror ? (dribbleRow === 4) : (dribbleRow === 3));

  if (isFull) {
    // Full Cascade (§7.1 / §7.3)
    // Results: huRB↔aiCF, huCB↔aiRB, huLW↔aiCB, huCF↔aiLW (normalized roles)
    markerMap = { RB: 'CF', CB: 'RB', LW: 'CB', CF: 'LW' };
  } else if (isMid) {
    // Mid Cascade (§7.2)
    // Results: huRB↔aiCB, huLW↔aiCF, huCB↔aiRB, huCF↔aiLW
    markerMap = { RB: 'CB', LW: 'CF', CB: 'RB', CF: 'LW' };
    // Goal Duel (§7.4) or static state: Keep row-based 1v1
    // Filter out goal zones so field markers stay in row 2/5
    const goalRow = isMirror ? 1 : 6;
    mField.sort((a,b) => _rowOf(a.zone) - _rowOf(b.zone));
    cField.sort((a,b) => _rowOf(a.zone) - _rowOf(b.zone));
    mField.forEach((m, i) => { 
      if (cField[i]) {
        // Markers stay in the field (rows 2-5). They don't enter the GK net/zone 6.
        if (_rowOf(m.zone) !== goalRow) {
          cField[i].zone = m.zone;
        }
      }
    });
    return;
  }

  // Apply the map
  const roles = ['RB', 'CB', 'LW', 'CF'];
  roles.forEach(role => {
    // mField always follows the roles of 'movedTeam' (could be Human or AI)
    // We want to map the MOVE-TEAM's role to the COVER-TEAM's role.
    const mover = getP(mField, role);
    const marker = getP(cField, markerMap[role]);
    if (mover && marker) marker.zone = mover.zone;
  });
}

function _rowOf(zone) { return parseInt(zone[0]); }

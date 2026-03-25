/**
 * state.js — GameState factory and phase definitions.
 *
 * All state transitions return a NEW state object (no mutation).
 * Usage: const newState = { ...state, phase: PHASE.DUEL_SETUP }
 */

export const PHASE = {
  KICKOFF:       'KICKOFF',
  DUEL_SETUP:    'DUEL_SETUP',
  PLAYER_ACTION: 'PLAYER_ACTION',
  EXIT_ACTION:   'EXIT_ACTION',
  RESOLUTION:    'RESOLUTION',
  ROTATION:      'ROTATION',
  ONE_V_ZERO:    'ONE_V_ZERO',   // GK ball possession — no defender
  GOAL_ANIMATION: 'GOAL_ANIMATION',
  MATCH_OVER:    'MATCH_OVER',
};

/**
 * Creates the initial GameState for a new match.
 * @param {Object[]} humanSquad  - Array of human player objects from data/players.js
 * @param {Object[]} aiSquad     - Array of AI player objects from data/players.js
 * @returns {GameState}
 */
export function createInitialState(humanSquad, aiSquad) {
  // Deep-clone squad data so state is self-contained
  // Initialize player zones from their kickoff positions
  const humans = humanSquad.map(p => ({ ...p, zone: p.kickoffZone, momentum: 0, xp: p.xp ?? 0 }));
  const ais    = aiSquad.map(p =>   ({ ...p, zone: p.kickoffZone, momentum: 0 }));


  return {
    phase:        PHASE.KICKOFF,
    clock:        0,           // virtual minutes elapsed (0–24)
    half:         1,           // 1 or 2
    ballZone:     '3B',        // e.g. '3C', '5B'
    ballState:    'GROUND',    // 'GROUND' or 'AIR'
    score:        { human: 0, ai: 0 },
    possession:   null,        // 'human' | 'ai'  — set after coin toss
    humans,                    // array of player objects
    ais,                       // array of player objects
    selectedHumanId: null,      // for tactical hud inspection
    selectedAIId:    null,      // for tactical hud inspection
    activeDuel: {
      attacker:   null,        // player id
      defender:   null,        // player id (ai player)
      lane:       null,        // 'inside' | 'outside'
      touchUnits: 0,           // TU remaining this turn
      movesPlayed: [],         // move ids played this turn
      aiIntent:   null,        // { action, value } from ai.generateIntent()
      buffs:      {},          // { stat: totalBonus } accumulated this turn
    },
  };
}

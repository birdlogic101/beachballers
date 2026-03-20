/**
 * main.js — Application entry point and state machine "conductor".
 *
 * Implements the dispatch() pattern to handle all state transitions
 * and trigger re-renders across all UI modules.
 */

import { PHASE, createInitialState } from './core/state.js';
import { HUMAN_SQUAD, AI_SQUAD } from './data/players.js';
import { MOVES } from './data/moves.js';
import { 
  setupDuel, 
  resolveAction, 
  getEffectiveAttackValue, 
  applySignatureSkill,
  applyMoveEffect 
} from './core/duel.js';
import { cascade, mirrorCascade, getRole } from './core/formation.js';
import { updateHeat, updateHeatOnSave, canPress } from './core/heat.js';
import { getPassTarget, passTriggersRipple } from './core/pass.js';
import { generateIntent } from './core/ai.js';
import { tick, isMatchOver } from './core/clock.js';

// UI Modules
import { initField, renderField } from './ui/field.js';
import { initHUD, renderHUD } from './ui/hud.js';
import { initCarousel, renderCarousel } from './ui/carousel.js';
import { initActions, renderActions } from './ui/actions.js';

// ─── Global State ────────────────────────────────────────────────────────────

let state = null;

/**
 * The main dispatcher for all game events.
 * @param {Object} action - { type: string, ...payload }
 */
function dispatch(action) {
  console.log('Dispatch:', action.type, action);
  
  const prevState = { ...state };
  let nextState = { ...state };

  switch (action.type) {
    case 'INIT':
      nextState = createInitialState(HUMAN_SQUAD, AI_SQUAD);
      console.log('INIT State:', nextState);
      _showOverlay('kickoff-overlay');
      break;

    case 'KICKOFF':
      console.log('KICKOFF Action');
      nextState.phase = PHASE.DUEL_SETUP;
      nextState.possession = 'human'; // Human starts with ball in V1.0
      nextState.ballZone = '5B';      // human CF starts at 5B
      _hideOverlays();
      nextState = _setupNextDuel(nextState);
      console.log('KICKOFF Final State:', nextState);
      break;

    case 'PLAY_MOVE':
      nextState = _handlePlayMove(nextState, action.moveId);
      break;

    case 'EXIT_ACTION':
      nextState = _handleExitAction(nextState, action.actionType);
      break;

    case 'RESTART':
      window.location.reload();
      return;

    default:
      console.warn('Unknown action type:', action.type);
  }

  state = nextState;
  _render(state);
}

// ─── Phase Handlers ──────────────────────────────────────────────────────────

/**
 * Sets up the next duel based on the current ballZone and possession.
 */
function _setupNextDuel(s) {
  const ns = { ...s };
  console.log('Setup Duel at:', ns.ballZone, 'Possession:', ns.possession);

  const attacker = ns.possession === 'human' 
    ? ns.humans.find(p => p.zone === ns.ballZone)
    : ns.ais.find(p => p.zone === ns.ballZone);

  const defender = ns.possession === 'human'
    ? ns.ais.find(p => p.zone === ns.ballZone)
    : ns.humans.find(p => p.zone === ns.ballZone);

  if (!attacker) {
    console.warn('No attacker found in zone:', ns.ballZone);
    return ns;
  }

  if (!defender) {
    // 1v0 state (GK possession)
    ns.phase = PHASE.ONE_V_ZERO;
    ns.activeDuel = {
      attacker: attacker.id,
      defender: null,
      lane: 'inside',
      touchUnits: 0,
      movesPlayed: [],
      aiIntent: null,
      buffs: {},
    };
  } else {
    // Standard duel setup
    const intent = generateIntent(defender, defender.zone);
    const duelData = setupDuel(attacker, defender, intent);
    ns.activeDuel = duelData;
    ns.phase = PHASE.PLAYER_ACTION;
  }

  return ns;
}

function _handlePlayMove(s, moveId) {
  const ns = { ...s };
  const move = MOVES.find(m => m.id === moveId);
  if (!move || ns.activeDuel.touchUnits < move.tuCost) return ns;

  // Deduct TU
  ns.activeDuel.touchUnits -= move.tuCost;
  ns.activeDuel.movesPlayed.push(moveId);

  // Apply effect
  const { buffs, heatDelta } = applyMoveEffect(ns, move);
  ns.activeDuel.buffs = buffs;

  // Apply heat delta immediately to the attacker
  const attacker = ns.possession === 'human' 
    ? ns.humans.find(p => p.id === ns.activeDuel.attacker)
    : ns.ais.find(p => p.id === ns.activeDuel.attacker);
  
  if (heatDelta !== 0) {
    attacker.heat = updateHeat(attacker.heat, 'success', heatDelta);
  }

  return ns;
}

function _handleExitAction(s, type) {
  let ns = { ...s };
  const duel = ns.activeDuel;
  
  // 1. Tick clock
  ns.clock = tick(ns.clock);
  if (isMatchOver(ns.clock)) {
    ns.phase = PHASE.MATCH_OVER;
    _showGameOver(ns);
    return ns;
  }

  // 2. Resolve duel logic
  if (ns.phase === PHASE.ONE_V_ZERO) {
    // 1v0 always succeeds (no defender)
    ns = _handleSuccess(ns, type);
  } else {
    const attacker = ns.possession === 'human' 
      ? ns.humans.find(p => p.id === duel.attacker)
      : ns.ais.find(p => p.id === duel.attacker);
    
    // Attacker rolls volatility
    // Map action type to stat
    const statMap = { 'dribble': 'DRI', 'pass': 'PAS', 'shoot': 'SHO', 'press': 'AGG', 'block': 'COM' };
    const stat = statMap[type];
    
    let attackerVal = getEffectiveAttackValue(attacker, stat, duel.buffs, attacker.volatility);
    attackerVal = applySignatureSkill(attacker, type, attackerVal);

    // Defender value is fixed (from AI intent)
    const defenderVal = duel.aiIntent.value;

    const winner = resolveAction(attackerVal, defenderVal);

    if (winner === 'attacker') {
      ns = _handleSuccess(ns, type);
    } else {
      ns = _handleFailure(ns, type);
    }
  }

  return ns;
}

function _handleSuccess(s, type) {
  let ns = { ...s };
  const attacker = ns.possession === 'human' 
    ? ns.humans.find(p => p.id === ns.activeDuel.attacker)
    : ns.ais.find(p => p.id === ns.activeDuel.attacker);

  // Heat up
  attacker.heat = updateHeat(attacker.heat, 'success');

  if (type === 'dribble') {
    // Determine target before cascade to update ballZone
    const teamZones = (ns.possession === 'human' ? ns.humans : ns.ais)
      .filter(p => p.id !== attacker.id && p.zone !== (ns.possession === 'human' ? '1B' : '6B'))
      .map(p => p.zone);
    
    // We need to import dribbleTarget/mirrorDribbleTarget or just use the result of cascade
    const result = ns.possession === 'human' 
      ? cascade(ns, attacker.zone)
      : mirrorCascade(ns, attacker.zone);
    
    ns.humans = result.humans;
    ns.ais = result.ais;

    // The attacker's new zone is the ball's new location
    const movedAttacker = (ns.possession === 'human' ? ns.humans : ns.ais)
      .find(p => p.id === attacker.id);
    
    if (movedAttacker) {
      ns.ballZone = movedAttacker.zone;
    } else {
      console.error('Attacker lost after cascade:', attacker.id);
    }
  } else if (type === 'pass') {

    const target = getPassTarget(attacker.heat, attacker.zone);
    if (passTriggersRipple(attacker.zone)) {
      // Small logic to shift positions on pass? 
      // V1.0 says: pass triggers ripple (Passer Drop)
      // For now, let's keep pass simpler as requested if not fully defined
    }
    ns.ballZone = target;
  } else if (type === 'shoot') {
    // Goal!
    if (ns.possession === 'human') ns.score.human++;
    else ns.score.ai++;
    
    // Reset to kickoff (possession switches)
    ns.possession = ns.possession === 'human' ? 'ai' : 'human';
    ns.ballZone = ns.possession === 'human' ? '5B' : '2B';
    const init = createInitialState(HUMAN_SQUAD, AI_SQUAD);
    ns.humans = init.humans;
    ns.ais = init.ais;
  }

  return _setupNextDuel(ns);
}

function _handleFailure(s, type) {
  let ns = { ...s };
  const attacker = ns.possession === 'human' 
    ? ns.humans.find(p => p.id === ns.activeDuel.attacker)
    : ns.ais.find(p => p.id === ns.activeDuel.attacker);
  
  // Heat down
  attacker.heat = updateHeat(attacker.heat, 'failure');
  
  // Turnover!
  ns.possession = ns.possession === 'human' ? 'ai' : 'human';
  return _setupNextDuel(ns);
}

// ─── Rendering ───────────────────────────────────────────────────────────────

function _render(s) {
  renderField(s);
  renderHUD(s);
  renderCarousel(s);
  renderActions(s);
}

// ─── Internal UI Helpers ─────────────────────────────────────────────────────

function _showOverlay(id) {
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

function _hideOverlays() {
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
}

function _showGameOver(s) {
  _showOverlay('game-over-overlay');
  const text = document.getElementById('match-result-text');
  if (!text) return;
  const h = s.score.human;
  const a = s.score.ai;
  if (h > a) text.textContent = `You Won! ${h} - ${a}`;
  else if (a > h) text.textContent = `AI Won! ${h} - ${a}`;
  else text.textContent = `Draw! ${h} - ${a}`;
}

// ─── Initialization ──────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  // Init UI Components
  const fieldContainer = document.getElementById('field-minimap-v2');
  if (fieldContainer) initField(fieldContainer);
  
  initHUD();
  
  // Pass the central dispatch to UI modules that need it
  initCarousel(dispatch);
  initActions(dispatch);

  // Buttons found in overlays
  document.getElementById('btn-kickoff')?.addEventListener('click', () => dispatch({ type: 'KICKOFF' }));
  document.getElementById('btn-restart')?.addEventListener('click', () => dispatch({ type: 'RESTART' }));

  // Kickoff game state
  dispatch({ type: 'INIT' });
});


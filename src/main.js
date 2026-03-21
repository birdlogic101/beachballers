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
      console.log('KICKOFF Action - Coin Toss');
      _hideOverlays();
      
      // Random Coin Toss
      const toss = Math.random() > 0.5 ? 'human' : 'ai';
      nextState.possession = toss;
      // RB gets the ball: Human huRB is in 3C, AI aiRB is in 4A
      nextState.ballZone = toss === 'human' ? '3C' : '4A';
      
      console.log('Toss Result:', toss, 'Ball starts at RB in:', nextState.ballZone);
      
      nextState.phase = PHASE.DUEL_SETUP;
      nextState = _setupNextDuel(nextState);
      break;

    case 'PLAY_MOVE':
      nextState = _handlePlayMove(nextState, action.moveId);
      break;

    case 'EXIT_ACTION':
      nextState = _handleExitAction(nextState, action.actionType.toLowerCase());
      break;

    case 'FINALIZE_RESOLUTION':
      nextState = _finalizeResolution(nextState);
      break;

    case 'TRIGGER_GK_STAGE':
      nextState.resolution = {
        ...nextState.resolution,
        stage: 2,
        rolledValue: action.modifiedShotVal,
        defendValue: action.gkVal,
        finalWinner: action.finalWinner,
        gkId: action.gkId
      };
      // Finalize after 1.5s
      setTimeout(() => dispatch({ type: 'FINALIZE_RESOLUTION' }), 1500);
      break;

    case 'RESTART':
      window.location.reload();
      return;

    case 'KICKOFF_RESET':
      _hideOverlays();
      // Reset positions after goal animation
      const initReset = createInitialState(HUMAN_SQUAD, AI_SQUAD);
      nextState.humans = initReset.humans;
      nextState.ais = initReset.ais;
      nextState.possession = action.nextPoss;
      nextState.ballZone = action.nextBall;
      nextState.phase = PHASE.DUEL_SETUP;
      nextState = _setupNextDuel(nextState);
      break;

    case 'SELECT_PLAYER':
      const player = (nextState.humans || []).find(p => p.id === action.playerId) ||
                     (nextState.ais || []).find(p => p.id === action.playerId);
      if (player) {
         if (nextState.humans.some(h => h.id === player.id)) nextState.selectedHumanId = player.id;
         else nextState.selectedAIId = player.id;
      }
      break;

    default:
      console.warn('Unknown action type:', action.type);
  }

  state = nextState;
  _render(state);

  // ─── AI Auto-Execution (POST-RENDER) ───
  // ONLY in 1v0 (uncontested) situation. In 1v1, the human must always trigger resolution.
  const aiShouldAct = (state.possession === 'ai') && (state.phase === PHASE.ONE_V_ZERO);

  if (aiShouldAct && state.activeDuel?.aiIntent) {
    console.log('AI (1v0) acting autonomously:', state.activeDuel.aiIntent.action);
    setTimeout(() => {
       // Re-verify phase before executing (ensure no mid-delay state change)
       if (state.phase === PHASE.ONE_V_ZERO && state.possession === 'ai') {
         dispatch({ type: 'EXIT_ACTION', actionType: state.activeDuel.aiIntent.action });
       }
    }, 1200);
  }
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
    const isHumanPoss = (ns.possession === 'human');
    ns.activeDuel = {
      attacker: attacker.id,
      defender: null,
      touchUnits: Math.max(3, attacker.stats.SPE),
      movesPlayed: [],
      moveHand: [...MOVES],
      // For Human: show 'Block' to filter moves to Blue. For AI: set real intent to Pass.
      aiIntent: isHumanPoss ? { action: 'Block', value: 0 } : { action: 'pass', value: attacker.stats.PAS.base },
      buffs: {}
    };
    return ns;
  } else {
    // Standard duel setup
    const isAIDefending = (ns.possession === 'human');
    const aiParticipant = isAIDefending ? defender : attacker;
    
    const intent = generateIntent(aiParticipant, aiParticipant.zone, isAIDefending);
    const duelData = setupDuel(attacker, defender, intent);
    ns.activeDuel = duelData;
    ns.phase = PHASE.PLAYER_ACTION;
  }

  // Set default selections for tactical HUD
  if (attacker) {
    const isHum = ns.humans.some(h => h.id === attacker.id);
    if (isHum) ns.selectedHumanId = attacker.id;
    else ns.selectedAIId = attacker.id;
  }
  if (defender) {
    const isHum = ns.humans.some(h => h.id === defender.id);
    if (isHum) ns.selectedHumanId = defender.id;
    else ns.selectedAIId = defender.id;
  }

  return ns;
}

function _handlePlayMove(s, moveId) {
  const ns = { ...s };
  const move = MOVES.find(m => m.id === moveId);
  if (!move || ns.activeDuel.touchUnits < move.tuCost) return ns;

  // 0. Consume combo bonus if any
  const comboBonus = ns.activeDuel.buffs.nextMoveBonus || 0;
  if (comboBonus) {
    console.log('APPLYING COMBO BONUS:', comboBonus);
    ns.activeDuel.buffs.nextMoveBonus = 0; // Consume
  }

  // Deduct TU
  ns.activeDuel.touchUnits -= move.tuCost;
  ns.activeDuel.movesPlayed.push(moveId);

  // Apply effects immediately to the attacker
  const attacker = ns.possession === 'human' 
    ? ns.humans.find(p => p.id === ns.activeDuel.attacker)
    : ns.ais.find(p => p.id === ns.activeDuel.attacker);

  if (attacker) {
    const { buffs, heatDelta, fitnessDelta } = applyMoveEffect(ns, move);
    ns.activeDuel.buffs = buffs;
    
    // Apply combo bonus to the CURRENT move's primary stat if applicable
    if (comboBonus && move.effect.stat) {
      ns.activeDuel.buffs[move.effect.stat] = (ns.activeDuel.buffs[move.effect.stat] || 0) + comboBonus;
    }
    
    if (heatDelta) attacker.heat = updateHeat(attacker.heat, 'bonus', heatDelta);
    if (fitnessDelta) {
      attacker.fitness = Math.max(0, (attacker.fitness || 20) + fitnessDelta);
      // Check for injury
      if (attacker.fitness <= 0) {
        ns.phase = PHASE.MATCH_OVER;
        ns.gameOver = true;
        ns.winner = ns.possession === 'human' ? 'ai' : 'human';
        ns.gameOverReason = `${attacker.name} collapsed from exhaustion!`;
      }
    }

    if (buffs.ballState) {
      ns.ballState = buffs.ballState;
    }
    
    // Perma-buff for 'match' duration moves
    if (move.effect.duration === 'match' && move.effect.stat) {
       attacker.stats[move.effect.stat].base += move.effect.bonus;
    }
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

  const isHumanAttacker = ns.possession === 'human';
  const human = isHumanAttacker 
    ? ns.humans.find(h => h.id === duel.attacker)
    : ns.humans.find(h => h.id === duel.defender);
  
  const ai = isHumanAttacker
    ? ns.ais.find(p => p.id === duel.defender)
    : ns.ais.find(p => p.id === duel.attacker);

  ns.ballState = 'GROUND'; // Reset air state on every touch resolution

  const isOneVZero = (ns.phase === PHASE.ONE_V_ZERO);

  if (isOneVZero) {
    // Uncontested distribution (GK save result) — Bypasses rolls/participants (§1v0)
    ns.phase = PHASE.RESOLUTION;
    ns.resolution = {
      actionType: type,
      stage: 0,
      isHuman: isHumanAttacker,
      isOneVZero: true,
      winner: 'attacker'
    };
    setTimeout(() => dispatch({ type: 'FINALIZE_RESOLUTION' }), 800);
    return ns;
  }

  if (!human || !ai) {
    console.warn('Missing participants for resolution.');
    return ns;
  }

  const attacker = isHumanAttacker ? human : ai;
  const defender = isHumanAttacker ? ai : human;

  // 2. Human rolls based on chosen action; AI uses fixed intent value
  let statKey = _getStatKey(type); 
  if (isHumanAttacker && duel.buffs.convertTo) {
    console.log('CONVERTING Action Stat to:', duel.buffs.convertTo);
    statKey = duel.buffs.convertTo;
  }
  
  let humanVal = getEffectiveAttackValue(human, statKey, duel.buffs, human.volatility);
  humanVal = applySignatureSkill(human, type, humanVal);

  // AI intent value modified by buffs (e.g. Wind Wall)
  const aiVal = Math.max(0, duel.aiIntent.value + (duel.buffs.aiValueDelta || 0));
  
  // Distinguish who is 'attacker' for resolution function logic
  const attackerVal = isHumanAttacker ? humanVal : aiVal;
  const defenderVal = isHumanAttacker ? aiVal : humanVal;

  // 3. Resolve
  const attackerAction = isHumanAttacker ? type : duel.aiIntent.action.toLowerCase();

  if (attackerAction === 'shoot' && !isOneVZero) {
    // 2-PHASE SHOOT RESOLUTION (§8)
    const isGoalZoneShot = (isHumanAttacker && attacker.zone === '6B') || (!isHumanAttacker && attacker.zone === '1B');

    if (isGoalZoneShot) {
      // In Goal Zone: Skip Stage 1, go straight to Finish (§8: Phase 2 only)
      ns.phase = PHASE.RESOLUTION;
      const gk = isHumanAttacker 
        ? ns.ais.find(p => getRole(p.zone) === 'GK')
        : ns.humans.find(p => getRole(p.zone) === 'GK');
      
      if (!gk) {
        console.error('GK not found for Goal Zone shot!');
        return _handleSuccess(ns, 'shoot');
      }

      const gkVal = gk.stats.COM.base;
      const finalWinner = resolveAction(attackerVal, gkVal);

      ns.resolution = {
        actionType: 'shoot',
        humanAction: isHumanAttacker ? 'shoot' : 'block',
        aiAction: isHumanAttacker ? 'block' : 'shoot',
        stage: 2,
        isHuman: isHumanAttacker,
        humanVal: humanVal,
        aiVal: aiVal,
        rolledValue: attackerVal,
        defendValue: gkVal,
        winner: finalWinner,
        finalWinner: finalWinner,
        gkId: gk.id
      };

      setTimeout(() => dispatch({ type: 'FINALIZE_RESOLUTION' }), 1500);
      return ns;
    }

    const isBlock = isHumanAttacker ? (duel.aiIntent.action === 'Block') : (type === 'block');
    
    // STAGE 1: vs Field Defender (Outside the Box)
    let stage1Winner;
    let modifiedShotVal = attackerVal; 

    if (!isBlock) {
      stage1Winner = resolveAction(attackerVal, defenderVal);
    } else {
      if (defenderVal >= attackerVal) {
        // Successful block stops ball (§8.1)
        stage1Winner = 'defender';
        modifiedShotVal = 0;
      } else {
        // Partial block reduces shot
        modifiedShotVal = Math.max(1, attackerVal - defenderVal);
        stage1Winner = 'attacker';
      }
    }

    // Entering Resolution Stage 1
    ns.phase = PHASE.RESOLUTION;
    ns.resolution = {
      actionType: 'shoot',
      humanAction: type,
      aiAction: duel.aiIntent.action.toLowerCase(),
      stage: 1,
      isHuman: isHumanAttacker,
      humanVal: humanVal,
      aiVal: aiVal,
      isBlock: isBlock,
      stage1Winner: stage1Winner,
      rolledValue: attackerVal,
      defendValue: defenderVal,
      winner: stage1Winner
    };

    if (stage1Winner === 'defender') {
       // Stopped by Press OR Clean Block
       setTimeout(() => dispatch({ type: 'FINALIZE_RESOLUTION' }), 1500);
    } else {
       // Proceed to GK Finish
       setTimeout(() => {
         const gk = !isHumanAttacker 
           ? ns.humans.find(p => getRole(p.zone) === 'GK')
           : ns.ais.find(p => getRole(p.zone) === 'GK');

         if (!gk) return dispatch({ type: 'FINALIZE_RESOLUTION' });

         const gkVal = gk.stats.COM.base;
         const finalWinner = resolveAction(modifiedShotVal, gkVal);
         
         dispatch({ 
           type: 'TRIGGER_GK_STAGE', 
           modifiedShotVal, 
           gkVal,
           finalWinner,
           gkId: gk.id
         });
       }, 1000);
    }
    return ns;
  } else {
    // STANDARD RESOLUTION (Dribble, Pass, 1v0 Shoot, OR Defending)
    // In 1v0, attacker always wins
    const winner = isOneVZero ? 'attacker' : resolveAction(attackerVal, defenderVal);

    ns.phase = PHASE.RESOLUTION;
    ns.resolution = {
      actionType: isHumanAttacker ? type : duel.aiIntent.action.toLowerCase(),
      humanAction: type,
      aiAction: duel.aiIntent.action.toLowerCase(),
      winner: winner,
      stage: 0,
      isHuman: isHumanAttacker,
      humanVal: humanVal,
      aiVal: aiVal,
      rolledValue: attackerVal,
      defendValue: isOneVZero ? 0 : defenderVal
    };

    setTimeout(() => {
      dispatch({ type: 'FINALIZE_RESOLUTION' });
    }, 1500);
  }

  return ns;
}

function _finalizeResolution(s) {
  let ns = { ...s };
  const res = ns.resolution;
  if (!res) return ns;

  let winner;
  if (res.actionType === 'shoot' && res.stage === 2) {
    winner = res.finalWinner;
  } else if (res.actionType === 'shoot' && res.stage === 1) {
    winner = res.stage1Winner;
  } else {
    winner = res.winner;
  }

  if (winner === 'attacker') {
    ns = _handleSuccess(ns, res.actionType);
  } else {
    ns = _handleFailure(ns, res.actionType);
  }

  ns.resolution = null; // Clear
  return ns;
}

function _getStatKey(action) {
  const map = { dribble: 'DRI', pass: 'PAS', shoot: 'SHO', press: 'AGG', block: 'COM' };
  return map[action] || 'PAS';
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
    const target = getPassTarget(ns, attacker.zone);
    ns.ballZone = target;
  } else if (type === 'shoot') {
    // Goal Scored!
    if (ns.possession === 'human') {
      ns.score.human++;
      ns.ballZone = '7B'; // AI Net
    } else {
      ns.score.ai++;
      ns.ballZone = '0B'; // Human Net
    }
    
    ns.phase = PHASE.GOAL_ANIMATION;
    
    // Determine who kicked off next
    const nextPoss = ns.possession === 'human' ? 'ai' : 'human';
    const nextBall = nextPoss === 'human' ? '3C' : '4A';

    // Timer 1: Wait for ball glide (Minimap transition is 2s)
    setTimeout(() => {
      // Show "GOAL!" notification (text pop)
      const goalNotif = document.getElementById('goal-notification');
      if (goalNotif) {
        goalNotif.classList.remove('hidden');
        // Timer 2: Wait for celebration animation (CSS is 2s)
        setTimeout(() => {
          goalNotif.classList.add('hidden');
          dispatch({ type: 'KICKOFF_RESET', nextPoss, nextBall });
        }, 2000);
      } else {
        // Fallback if element missing
        dispatch({ type: 'KICKOFF_RESET', nextPoss, nextBall });
      }
    }, 2000);
  }

  return _setupNextDuel(ns);
}

function _handleFailure(s, type) {
  let ns = { ...s };
  const res = s.resolution; // Use previous resolution for damage calc
  const attackerId = s.activeDuel.attacker;

  // 1. Flip Possession
  ns.possession = s.possession === 'human' ? 'ai' : 'human';

  // 2. Physical Attrition: Damage from 'Press' (§Fitness System)
  const isPress = s.possession === 'human' 
    ? (res?.aiAction === 'press') 
    : (res?.humanAction === 'press');

  if (isPress && res) {
    const damage = Math.max(0, res.defendValue - res.rolledValue);
    if (damage > 0) {
      const attacker = s.possession === 'human' 
        ? ns.humans.find(p => p.id === attackerId)
        : ns.ais.find(p => p.id === attackerId);
      
      if (attacker) {
        attacker.fitness = Math.max(0, (attacker.fitness || 20) - damage);
        console.log(`PLAYER HIT! ${attacker.name} lost ${damage} Fitness. Current: ${attacker.fitness}`);
        
        if (attacker.fitness <= 0) {
           ns.gameOver = true;
           ns.winner = s.possession === 'human' ? 'ai' : 'human';
           ns.gameOverReason = `${attacker.name} is injured! Competition over.`;
        }
      }
    }
  }
  const attacker = s.possession === 'human' 
    ? ns.humans.find(p => p.id === ns.activeDuel.attacker)
    : ns.ais.find(p => p.id === ns.activeDuel.attacker);
  
  // Heat down
  attacker.heat = updateHeat(attacker.heat, 'failure');
  
  if (type === 'shoot') {
    // 1. Shooter drops back to Row 5/2 (§10.2)
    const shooterId = s.activeDuel.attacker;
    const isHumanShooter = (s.possession === 'human');
    
    if (isHumanShooter) {
      const p = ns.humans.find(h => h.id === shooterId);
      if (p && p.zone === '6B') p.zone = '5B';
    } else {
      const p = ns.ais.find(a => a.id === shooterId);
      if (p && p.zone === '1B') p.zone = '2B';
    }

    // 2. Ball Placement (§8)
    // If it was a Stage 1 block/interception, ball stays in field. 
    // If it was a Stage 2 GK save, ball glides to GK.
    if (s.resolution?.stage === 2) {
      ns.ballZone = (ns.possession === 'human' ? '1B' : '6B');
    } else {
      // Stays in current duel zone (interception)
      ns.ballZone = s.ballZone;
    }
  }

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

  if (s.gameOverReason) {
    text.textContent = s.gameOverReason;
    return;
  }

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
  if (fieldContainer) initField(fieldContainer, dispatch);
  
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


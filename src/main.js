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
  resolveBlockResolution,
  getEffectiveValue, 
  applySignatureSkill,
  applyMoveEffect 
} from './core/duel.js';
import { cascade, mirrorCascade, getRole } from './core/formation.js';
import { updateMomentum, canPress } from './core/momentum.js';
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
      
      console.log('Toss Result:', toss, 'Ball starts at:', nextState.ballZone);
      
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
      const reflex = _calculateReflex(action.modifiedShotVal, action.gkVal);
      console.log(`[REFLEX-CHECK] Shot=${action.modifiedShotVal}, DIV=${action.gkVal}, Chance=${reflex?.chance}, Success=${reflex?.success}`);
      
      nextState.resolution = {
        ...nextState.resolution,
        stage: 2,
        rolledValue: action.modifiedShotVal,
        defendValue: action.gkVal,
        baseDIV: action.gkVal, // Anchor for flicker
        winner: action.winner,
        gkId: action.gkId,
        defenderId: action.gkId, // Fix for Momentum Gain
        reflexStatus: reflex ? 'rolling' : null,
        reflexChance: reflex ? reflex.chance : 0,
        reflexSuccess: reflex ? reflex.success : false,
        defenderName: action.defenderName,
        statusText: reflex ? "GK MIRACLE REFLEX?!" : "CHALLENGING GOALKEEPER..."
      };
      
      if (reflex) {
        // Visual Flicker Loop
        let flickerCount = 0;
        const shotValue = action.modifiedShotVal;
        const gkBase = action.gkVal;
        
        const flickerInterval = setInterval(() => {
          flickerCount++;
          // NEWS: Flicker through the entire range [Base, Shot] for visceral "struggle"
          const flickerVal = Math.floor(gkBase + Math.random() * (shotValue - gkBase + 1));
          dispatch({ type: 'GK_FLICKER', val: flickerVal });
          
          if (flickerCount >= 10) {
            clearInterval(flickerInterval);
            dispatch({ type: 'RESOLVE_REFLEX' });
          }
        }, 120);
      } else {
        setTimeout(() => dispatch({ type: 'FINALIZE_RESOLUTION' }), 1500);
      }
      break;

    case 'GK_FLICKER':
      if (nextState.resolution) {
        nextState.resolution.defendValue = action.val;
      }
      break;

    case 'RESOLVE_REFLEX':
      if (nextState.resolution) {
        const isSuccess = nextState.resolution.reflexSuccess;
        console.log(`[REFLEX-RESULT] Landed on: ${isSuccess ? 'MIRACLE' : 'EFFORT'}, Success=${isSuccess}`);
        
        nextState.resolution.reflexStatus = isSuccess ? 'saved' : 'failed';
        nextState.resolution.statusText = isSuccess 
          ? "UNBELIEVABLE MIRACLE SAVE!" 
          : "REFLEXES BEATEN!";
        
        // Final landing value: 
        // If success: match the shot. 
        // If failure: show a "High Effort" near-miss value for visual drama.
        if (isSuccess) {
           nextState.resolution.defendValue = nextState.resolution.rolledValue;
           nextState.resolution.winner = 'defender';
        } else {
           const base = nextState.resolution.baseDIV || nextState.resolution.defendValue;
           const margin = nextState.resolution.rolledValue - base;
           nextState.resolution.defendValue = Math.floor(base + (Math.random() * margin * 0.8));
        }

        setTimeout(() => dispatch({ type: 'FINALIZE_RESOLUTION' }), 2000);
      }
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
  console.log(`[SYSTEM] Setting up duel at ${ns.ballZone} | Possession: ${ns.possession}`);

  let attacker = ns.possession === 'human' 
    ? ns.humans.find(p => p.zone === ns.ballZone)
    : ns.ais.find(p => p.zone === ns.ballZone);

  let defender = ns.possession === 'human'
    ? ns.ais.find(p => p.zone === ns.ballZone)
    : ns.humans.find(p => p.zone === ns.ballZone);

  // Systemic Fallback: If no player found in zone (data error), pick first available
  if (!attacker) {
    console.warn(`[SYSTEM] No attacker found in ${ns.ballZone}! Falling back to first squad member.`);
    attacker = ns.possession === 'human' ? ns.humans[0] : ns.ais[0];
  }

  if (!defender) {
    console.log(`[SYSTEM] Entering 1v0 mode at ${ns.ballZone}`);
    ns.phase = PHASE.ONE_V_ZERO;
    const isHumanPoss = (ns.possession === 'human');
    ns.activeDuel = {
      attacker: attacker.id,
      defender: null,
      touchUnits: Math.max(3, attacker.stats.SPE || 3),
      movesPlayed: [],
      moveHand: [], // Hidden (§7.5)
      aiIntent: isHumanPoss ? { action: 'block', value: 0 } : { action: 'pass', value: (attacker.stats.PAS || 0) },
      buffs: {}
    };
  } else {
    console.log(`[SYSTEM] Duel localized: ${attacker.id} (ATK) vs ${defender.id} (DEF)`);
    const isAIDefending = (ns.possession === 'human');
    const aiParticipant = isAIDefending ? defender : attacker;
    
    // AI Intent logic
    const intent = generateIntent(aiParticipant, aiParticipant.zone, isAIDefending);
    console.log(`[DUEL-SETUP] AI Participant: ${aiParticipant.name}, Zone: ${aiParticipant.zone}, Momentum: ${aiParticipant.momentum}`);
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

  console.log('[SYSTEM] Active Duel Object:', ns.activeDuel);
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
    const { buffs, momentumDelta, fitnessDelta } = applyMoveEffect(ns, move);
    ns.activeDuel.buffs = buffs;
    
    // Apply combo bonus to the CURRENT move's primary stat if applicable
    if (comboBonus && move.effect.stat) {
      ns.activeDuel.buffs[move.effect.stat] = (ns.activeDuel.buffs[move.effect.stat] || 0) + comboBonus;
    }
    
    if (momentumDelta) attacker.momentum = updateMomentum(attacker.momentum, 'bonus', momentumDelta);
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
       attacker.stats[move.effect.stat] += move.effect.bonus;
    }
  }

  return ns;
}

function _handleExitAction(s, type) {
  console.log(`[SYSTEM] EXIT_ACTION Triggered phase: ${s.phase} | type: ${type}`);
  try {
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
      const attacker = isHumanAttacker ? human : ai;
      ns.resolution = {
        actionType: type,
        stage: 0,
        isHuman: isHumanAttacker,
        isOneVZero: true,
        winner: 'attacker',
        attackerName: attacker?.name || "Goalkeeper",
        defenderName: "",
        statusText: "UNCONTESTED DISTRIBUTION"
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
    
    let humanVal = getEffectiveValue(human, statKey, duel.buffs, type, true);
    humanVal = applySignatureSkill(human, type, humanVal);

    // 2b. AI rolls (fixed values) accounting for buffs/penalties
    const aiAction = duel.aiIntent.action.toLowerCase();
    
    // NEWS (§11.3): Use the pre-rolled intent value as the baseline to ensure margin consistency
    let aiVal = (duel.aiIntent.value || 0) + (duel.buffs.aiValueDelta || 0);
    
    // Apply signature skill on top of the intent if relevant (e.g. Marco AI Clinical)
    if (isHumanAttacker === false) {
       aiVal = applySignatureSkill(ai, aiAction, aiVal);
    }
    
    // Distinguish who is 'attacker' for resolution function logic
    const attackerVal = isHumanAttacker ? humanVal : aiVal;
    const defenderVal = isHumanAttacker ? aiVal : humanVal;

    // 3. Resolve
    const attackerAction = isHumanAttacker ? type : duel.aiIntent.action.toLowerCase();
    const defenderAction = isHumanAttacker ? duel.aiIntent.action.toLowerCase() : type;

    if (attackerAction === 'shoot') {
      // 2-PHASE SHOOT RESOLUTION (§8) - Mandatory even in 1v0
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

        const isHumanGK = !isHumanAttacker;
        const gkValBase = getEffectiveValue(gk, 'DIV', {}, 'save', isHumanGK);
        const gkVal = applySignatureSkill(gk, 'save', gkValBase);
        let winner = resolveAction(attackerVal, gkVal);
        
        const reflex = _calculateReflex(attackerVal, gkVal);

        const defender = isHumanGK 
          ? ns.humans.find(p => p.id === gk.id) 
          : ns.ais.find(p => p.id === gk.id);
        const latestAttacker = (isHumanAttacker
          ? ns.humans.find(p => p.id === duel.attacker)
          : ns.ais.find(p => p.id === duel.attacker));

        ns.resolution = {
          actionType: 'shoot',
          humanAction: isHumanAttacker ? 'shoot' : 'save',
          aiAction: isHumanAttacker ? 'save' : 'shoot',
          stage: 2,
          isHuman: isHumanAttacker,
          humanVal: humanVal,
          aiVal: aiVal,
          rolledValue: attackerVal,
          defendValue: gkVal,
          baseDIV: gkVal, // CRITICAL: Fix for NaN in Reflex Visuals
          winner: winner,
          reflexStatus: reflex ? 'rolling' : null,
          reflexChance: reflex ? reflex.chance : 0,
          reflexSuccess: reflex ? reflex.success : false,
          gkId: gk.id,
          attackerId: duel.attacker,
          defenderId: gk.id,
          attackerName: latestAttacker?.name || "Attacker",
          defenderName: defender?.name || "Goalkeeper",
          statusText: winner === 'attacker' ? "CHALLENGING GOALKEEPER..." : "GK SAVED!"
        };

        if (reflex) {
          setTimeout(() => dispatch({ type: 'RESOLVE_REFLEX' }), 1800);
        } else {
          setTimeout(() => dispatch({ type: 'FINALIZE_RESOLUTION' }), 2000);
        }
        return ns;
      }

      // STAGE 1: vs Field Defender (Outside the Box)
      const isBlock = isHumanAttacker ? (duel.aiIntent.action === 'block') : (type === 'block');
      let stage1Winner;
      let modifiedShotVal = attackerVal; 

      if (isOneVZero) {
        // Uncontested Shot: Auto-pass Stage 1
        stage1Winner = 'attacker';
        modifiedShotVal = attackerVal;
      } else {
        if (!isBlock) {
          stage1Winner = resolveAction(attackerVal, defenderVal);
          if (stage1Winner === 'attacker') {
            modifiedShotVal = attackerVal; 
          }
        } else {
          const blockRes = resolveBlockResolution(attackerVal, defenderVal);
          if (blockRes === 'steal') {
            stage1Winner = 'defender';
            modifiedShotVal = 0;
          } else {
            modifiedShotVal = Math.max(0, attackerVal - defenderVal);
            stage1Winner = 'attacker';
          }
        }
      }

      // Entering Resolution Stage 1
      ns.phase = PHASE.RESOLUTION;
      ns.resolution = {
        actionType: 'shoot',
        humanAction: type,
        aiAction: isOneVZero ? 'block' : duel.aiIntent.action.toLowerCase(),
        stage: 1,
        isHuman: isHumanAttacker,
        humanVal: humanVal,
        aiVal: isOneVZero ? 0 : aiVal,
        isBlock: isBlock,
        isOneVZero: isOneVZero,
        stage1Winner: stage1Winner,
        rolledValue: attackerVal,
        defendValue: isOneVZero ? 0 : defenderVal,
        winner: stage1Winner,
        attackerId: duel.attacker,
        defenderId: isOneVZero ? null : duel.defender,
        attackerName: human?.name || ai?.name,
        defenderName: isOneVZero ? "NONE" : (isHumanAttacker ? ai?.name : human?.name),
        statusText: isOneVZero ? "UNCONTESTED SHOT!" : (stage1Winner === 'attacker' ? "DEFENDER BYPASSED!" : "STRIKE BLOCKED!")
      };

      if (stage1Winner === 'defender') {
         setTimeout(() => dispatch({ type: 'FINALIZE_RESOLUTION' }), 1800);
      } else {
         setTimeout(() => {
           // Narrative beat: CHALLENGING GK starts
           const gk = !isHumanAttacker 
             ? ns.humans.find(p => getRole(p.zone) === 'GK')
             : ns.ais.find(p => getRole(p.zone) === 'GK');

           if (!gk) return dispatch({ type: 'FINALIZE_RESOLUTION' });

           const gkValBase = getEffectiveValue(gk, 'DIV', {}, 'save', !isHumanAttacker);
           const gkVal = applySignatureSkill(gk, 'save', gkValBase);
           const winner = resolveAction(modifiedShotVal, gkVal);
           
           dispatch({ 
             type: 'TRIGGER_GK_STAGE', 
             modifiedShotVal, 
             gkVal,
             winner,
             gkId: gk.id
           });
         }, 1800);
      }
      return ns;
    } else {
      // STANDARD RESOLUTION
      let winner;
      let blockRes = null;

      if (defenderAction === 'block' && !isOneVZero) {
        blockRes = resolveBlockResolution(attackerVal, defenderVal);
        winner = blockRes === 'steal' ? 'defender' : 'attacker';
      } else {
        winner = isOneVZero ? 'attacker' : resolveAction(attackerVal, defenderVal);
      }

      ns.phase = PHASE.RESOLUTION;
      ns.resolution = {
        actionType: isHumanAttacker ? type : duel.aiIntent.action.toLowerCase(),
        humanAction: type,
        aiAction: duel.aiIntent.action.toLowerCase(),
        winner: winner,
        blockRes: blockRes,
        stage: 0,
        isHuman: isHumanAttacker,
        humanVal: humanVal,
        aiVal: aiVal,
        rolledValue: attackerVal,
        defendValue: isOneVZero ? 0 : defenderVal,
        attackerId: duel.attacker,
        defenderId: duel.defender
      };

      setTimeout(() => {
        dispatch({ type: 'FINALIZE_RESOLUTION' });
      }, 1500);
    }

    return ns;
  } catch (err) {
    console.error('[SYSTEM] FATAL ERROR IN RESOLUTION:', err);
    return s;
  }
}

function _calculateReflex(shotVal, gkVal) {
  const s = Math.ceil(shotVal);
  const g = Math.floor(gkVal);
  if (s <= g) return null;
  
  const margin = s - g;
  const chance = 1 / (margin + 1);
  const roll = Math.random();
  const success = roll < chance;
  
  console.log(`[MIRACLE-ROLL] Shot:${s}, DIV:${g}, Margin:${margin}, Chance:${chance.toFixed(3)}, Roll:${roll.toFixed(3)}, Success:${success}`);
  return { chance, success };
}

function _finalizeResolution(s) {
  let ns = { ...s };
  const res = ns.resolution;
  if (!res) return ns;

  const winner = res.winner;
  if (winner === 'attacker') {
    res.statusText = "GOAL SCORED!";
    ns = _handleSuccess(ns, res.actionType);
  } else {
    res.statusText = res.actionType === 'shoot' ? "SHOT SAVED!" : "CHALLENGE LOST";
    ns = _handleFailure(ns, res.actionType);
  }


  ns.resolution = null; // Clear
  return ns;
}

function _getStatKey(action) {
  const map = { dribble: 'DRI', pass: 'PAS', shoot: 'SHO', press: 'AGG', block: 'COM', save: 'DIV' };
  return map[action] || 'PAS';
}

function _handleSuccess(s, type) {
  let ns = { ...s };
  const attackerId = s.activeDuel.attacker;
  
  // Re-acquire reference from ns
  let attacker = (ns.humans.find(p => p.id === attackerId) || ns.ais.find(p => p.id === attackerId));

  if (type === 'dribble') {
    // Determine target before cascade to update ballZone
    const teamZones = (ns.possession === 'human' ? ns.humans : ns.ais)
      .filter(p => (p.id !== attackerId) && p.zone !== (ns.possession === 'human' ? '1B' : '6B'))
      .map(p => p.zone);
    
    const result = ns.possession === 'human' 
      ? cascade(ns, attacker.zone)
      : mirrorCascade(ns, attacker.zone);
    
    ns.humans = result.humans;
    ns.ais = result.ais;

    // The attacker's new zone is the ball's new location
    const movedAttacker = (ns.possession === 'human' ? ns.humans : ns.ais)
      .find(p => p.id === attackerId);
    
    if (movedAttacker) {
      ns.ballZone = movedAttacker.zone;
    } else {
      console.error('Attacker lost after cascade:', attackerId);
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
    
    // NEWS (§11.2): Goal resets ALL momentum for a fresh kickoff
    [...ns.humans, ...ns.ais].forEach(p => p.momentum = 0);

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

  // Handle Momentum generation (§Momentum System)
  const res = ns.resolution; 
  if (res && res.winner === 'attacker') {
    let momentumGain = 0;

    if (res.isOneVZero) {
      momentumGain = 1; // Flat +1 for uncontested distribution (V2.20)
    } else {
      const margin = Math.max(0, res.rolledValue - res.defendValue);
      const isDefenderBlock = (ns.possession === 'human') ? (res.aiAction === 'block') : (res.humanAction === 'block');
      momentumGain = isDefenderBlock ? 0 : margin; // Block "contains" momentum
    }

    console.log(`[DEBUG] MOMENTUM: Type=${type}, is1v0=${res.isOneVZero}, Gain=${momentumGain}`);

    if (momentumGain > 0) {
      // CRITICAL: Re-find attacker in the LATEST ns state (might have been replaced by cascade)
      const latestAttacker = (ns.humans.find(p => p.id === attackerId) || ns.ais.find(p => p.id === attackerId));
      
      if (type === 'dribble' || type === 'shoot') {
        if (latestAttacker) {
          const oldMom = latestAttacker.momentum;
          latestAttacker.momentum = Math.min(7, latestAttacker.momentum + momentumGain);
          console.log(`[DEBUG] ATTACKER ${latestAttacker.name} MOM: ${oldMom} -> ${latestAttacker.momentum} (Gain: +${momentumGain})`);
        }
      } else if (type === 'pass') {
        const receiverZone = ns.ballZone;
        const receiver = (ns.possession === 'human' ? ns.humans : ns.ais).find(p => p.zone === receiverZone);
        if (receiver) {
          receiver.momentum = Math.min(7, receiver.momentum + momentumGain);
          // Attacker loses momentum after a pass (§11.2)
          if (latestAttacker) latestAttacker.momentum = 0; 
        }
      }
    }

    // NEWS (§11.2): Success resets opponent momentum to 0
    const latestDefender = (ns.humans.find(p => p.id === res.defenderId) || ns.ais.find(p => p.id === res.defenderId));
    if (latestDefender) latestDefender.momentum = 0;
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
  
  // Recovery Drop (§10.2 Ext): If possession flips in a Goal Zone, the loser drops back.
  const isGoalZonePoss = (s.ballZone === '1B' || s.ballZone === '6B');
  if (isGoalZonePoss) {
    const loser = (s.possession === 'human') 
      ? ns.humans.find(p => p.id === attackerId)
      : ns.ais.find(p => p.id === attackerId);
    
    if (loser) {
      if (loser.zone === '1B') loser.zone = '2B';
      if (loser.zone === '6B') loser.zone = '5B';
      console.log(`RECOVERY DROP: ${loser.name} retreated from goal zone.`);
    }
    
    // Ball Reset: Ball belongs to the GK now (§8)
    ns.ballZone = (ns.possession === 'human' ? '6B' : '1B'); // Flipping logic
    // Wait! ns.possession was flipped at line 693. 
    // If ns.possession is 'human', ball is at 1B.
    ns.ballZone = (ns.possession === 'human' ? '1B' : '6B');
  }

  // 3. (Legacy check: Shooter drops back) - Already handled by Recovery Drop above but kept specialized for shots
  if (type === 'shoot') {
    // Stage 2 shots always land at GK net
    if (s.resolution?.stage === 2) {
      ns.ballZone = (ns.possession === 'human' ? '1B' : '6B');
    }
  }

  // 2b. Momentum Gain for the new possessor (§6.3 / §11.1)
  const margin = Math.max(0, res?.defendValue - res?.rolledValue);
  const newAttacker = ns.possession === 'human' 
    ? ns.humans.find(p => p.id === res?.defenderId)
    : ns.ais.find(p => p.id === res?.defenderId);
  
  // Rule (§6.3): Block "contains" even the winner's momentum (Gain = 0)
  // EXCEPT for Goalkeepers: who get +1 (Security Bonus)
  const defenderAction = (ns.possession === 'human') ? res?.aiAction : res?.humanAction;
  const isGK = newAttacker && (getRole(newAttacker.zone) === 'GK');
  
  let momentumGain = (defenderAction === 'block') ? 0 : margin;
  if (isGK && defenderAction === 'block') momentumGain = 1;

  console.log(`[DEBUG] STEAL MOMENTUM: Action=${defenderAction}, isGK=${isGK}, Margin=${margin}, Gain=${momentumGain}`);

  if (newAttacker && momentumGain > 0) {
    const oldMom = newAttacker.momentum;
    newAttacker.momentum = Math.min(7, newAttacker.momentum + momentumGain);
    console.log(`[DEBUG] NEW ATTACKER MOM: ${oldMom} -> ${newAttacker.momentum}`);
  }

  return _setupNextDuel(ns);
}

// ─── Rendering ───────────────────────────────────────────────────────────────

let _renderCount = 0;
function _render(s) {
  _renderCount++;
  console.log(`[SYSTEM] Render Loop #${_renderCount} | Phase: ${s.phase}`);
  
  try { renderField(s); console.log('  -> Field Rendered'); } catch (e) { console.error('Error rendering Field:', e); }
  try { renderHUD(s); console.log('  -> HUD Rendered'); } catch (e) { console.error('Error rendering HUD:', e); }
  try { renderCarousel(s); console.log('  -> Carousel Rendered'); } catch (e) { console.error('Error rendering Carousel:', e); }
  try { renderActions(s); console.log('  -> Actions Rendered'); } catch (e) { console.error('Error rendering Actions:', e); }
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

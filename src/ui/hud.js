/**
 * hud.js — Heads-Up Display renderer.
 * Manages player portraits, larger heat bars (with numeric labels), 
 * and the focal Dilemma display (with dimmed volatility range).
 */

import { formatClock } from '../core/clock.js';
import { PHASE } from '../core/state.js';

let _lastState = null;
let _hoveredAction = null; // 'dribble', 'pass', 'shoot' etc.

export function initHUD() {
  const actors = document.querySelectorAll('.duel-actor');
  actors.forEach(actor => {
    actor.addEventListener('click', () => {
      const grid = actor.querySelector('.stat-grid');
      if (grid) grid.classList.toggle('visible');
    });
  });
}

export function renderHUD(state) {
  _lastState = state;
  
  // 1. Meta (Clock, Score)
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = formatClock(state.clock);

  const scoreHuman = document.getElementById('score-human');
  if (scoreHuman) scoreHuman.textContent = state.score.human;

  const scoreAI = document.getElementById('score-ai');
  if (scoreAI) scoreAI.textContent = state.score.ai;

  // Tactical Cards
  _renderTopCards(state);

  // 2. Player Duel Actors
  const allPlayers = [...(state.humans || []), ...(state.ais || [])];
  const attacker = allPlayers.find(p => p.id === state.activeDuel?.attacker);
  const defender = allPlayers.find(p => p.id === state.activeDuel?.defender);

  let humanActor = null;
  let aiActor = null;

  if (attacker) {
    const isHuman = state.humans.some(p => p.id === attacker.id);
    if (isHuman) humanActor = attacker; else aiActor = attacker;
  }
  if (defender) {
    const isHuman = state.humans.some(p => p.id === defender.id);
    if (isHuman) humanActor = defender; else aiActor = defender;
  }

  const actorHumanEl = document.getElementById('actor-human');
  const actorAIEl = document.getElementById('actor-ai');

  if (state.phase === 'KICKOFF' || (!humanActor && !aiActor)) {
    if (actorHumanEl) actorHumanEl.classList.add('hidden');
    if (actorAIEl) actorAIEl.classList.add('hidden');
    _hideDilemma();
  } else if (state.phase === PHASE.ONE_V_ZERO) {
    // FORCE SINGLE CARD: Only show the player who has the ball (§1v0)
    if (state.possession === 'human') {
      const actualAttacker = state.humans.find(p => p.id === state.activeDuel?.attacker);
      if (actorHumanEl && actualAttacker) {
        actorHumanEl.classList.remove('hidden');
        _fillActor(actorHumanEl, actualAttacker, state.activeDuel?.buffs ?? {}, 'human', true);
      }
      if (actorAIEl) actorAIEl.classList.add('hidden');
    } else {
      const actualAttacker = state.ais.find(p => p.id === state.activeDuel?.attacker);
      if (actorAIEl && actualAttacker) {
        actorAIEl.classList.remove('hidden');
        _fillActor(actorAIEl, actualAttacker, {}, 'ai', true);
      }
      if (actorHumanEl) actorHumanEl.classList.add('hidden');
    }
    _hideDilemma();
  } else {
    if (actorHumanEl) {
      actorHumanEl.classList.remove('hidden');
      if (humanActor) {
        const hasPoss = state.possession === 'human';
        _fillActor(actorHumanEl, humanActor, state.activeDuel?.buffs ?? {}, 'human', hasPoss);
      }
    }
    if (actorAIEl) {
      actorAIEl.classList.remove('hidden');
      if (aiActor) {
        const hasPoss = state.possession === 'ai';
        _fillActor(actorAIEl, aiActor, {}, 'ai', hasPoss);
      }
    }
    if (state.phase === PHASE.RESOLUTION && state.resolution?.isOneVZero) {
      _hideDilemma();
    } else {
      _renderDilemma(state, humanActor, aiActor);
    }
  }

  // Possession Ball
  const pBall = document.getElementById('possession-ball');
  if (pBall) {
    const isShowing = state.phase !== 'KICKOFF' && state.phase !== 'MATCH_OVER' && state.possession;
    pBall.classList.toggle('hidden', !isShowing);
    if (isShowing) {
      pBall.classList.toggle('pos-human', state.possession === 'human');
      pBall.classList.toggle('pos-ai',    state.possession === 'ai');
    }
  }
}

/**
 * Called by actions.js to update the central dilemma on hover.
 */
export function setHoveredAction(type) {
  _hoveredAction = type;
  if (_lastState) renderHUD(_lastState);
}

function _fillActor(el, player, buffs, team, hasPossession) {
  // Stats (Center actors focus on Dilemma, only show bonus-aware grid)
  const statGrid = el.querySelector('.actor-stats');
  const statsToRender = team === 'human' ? ['DRI','PAS','SHO'] : ['AGG','COM'];
  statGrid.innerHTML = '';
  statsToRender.forEach(key => {
    const base = player.stats[key].base;
    const bonus = buffs[key] || 0;
    
    const div = document.createElement('div');
    div.className = 'stat-cell';
    div.innerHTML = `
      <span class="s-label">${key}</span>
      <span class="s-value">${base + bonus}</span>
    `;
    statGrid.appendChild(div);
  });
}

function _renderTopCards(state) {
  const leftEl = document.getElementById('player-info-left');
  const rightEl = document.getElementById('player-info-right');
  if (!leftEl || !rightEl) return;

  const hPlayer = (state.humans || []).find(p => p.id === state.selectedHumanId);
  const aiPlayer = (state.ais || []).find(p => p.id === state.selectedAIId);

  if (hPlayer) {
    leftEl.classList.remove('hidden');
    _fillMiniCard(leftEl, hPlayer, 'human');
  } else leftEl.classList.add('hidden');

  if (aiPlayer) {
    rightEl.classList.remove('hidden');
    _fillMiniCard(rightEl, aiPlayer, 'ai');
  } else rightEl.classList.add('hidden');
}

function _fillMiniCard(el, player, team) {
  const isAI = team === 'ai';
  const stats = team === 'human' ? ['DRI','PAS','SHO'] : ['AGG','COM'];
  el.className = `top-player-info ${team}`;
  
  el.innerHTML = `
    <img src="/${team}_player_portrait.png" class="mini-portrait" alt="${player.name}">
    <div class="mini-main">
      <div class="mini-name-row">
        <span class="mini-name">${player.name}</span>
        <span class="mini-number">#${player.number}</span>
      </div>
      <div class="mini-stats">
        ${stats.map(s => `
          <span class="mini-stat-item">${s}<span class="mini-stat-val">${player.stats[s].base}</span></span>
        `).join('')}
        <span class="mini-stat-item">HEAT<span class="mini-stat-val">${player.heat > 0 ? '+' : ''}${player.heat}</span></span>
      </div>
    </div>
  `;
}
import { applySignatureSkill } from '../core/duel.js';

function _renderDilemma(state, human, ai) {
  const container = document.getElementById('dilemma-container');
  if (!container) return;
  container.classList.remove('hidden');

  const intent = state.activeDuel?.aiIntent;
  const isRes = state.phase === PHASE.RESOLUTION;
  const res = state.resolution;
  const actionType = isRes ? res.actionType : (_hoveredAction || (state.possession === 'human' ? 'pass' : 'block'));

  const hValEl = document.getElementById('dilemma-val-human');
  const hLabelEl = document.getElementById('dilemma-label-human');
  const aValEl = document.getElementById('dilemma-val-ai');
  const aLabelEl = document.getElementById('dilemma-label-ai');

  if (isRes && res) {
    // ─── RESOLUTION MODE ───
    const isHumanAttacker = state.possession === 'human';

    if (res.actionType === 'shoot') {
      if (res.stage === 1) {
        hLabelEl.textContent = 'Shot';
        aLabelEl.textContent = res.aiAction || 'Defend';
        
        const stage1HumanWon = isHumanAttacker ? (res.stage1Winner === 'attacker') : (res.stage1Winner === 'defender');
        const finalHuman = isHumanAttacker ? res.rolledValue : res.defendValue;
        const finalAI = isHumanAttacker ? res.defendValue : res.rolledValue;

        if (res.isBlock) {
          _animateRoll(hValEl, finalHuman, finalHuman, finalHuman, true, isHumanAttacker ? ` - ${finalAI}` : '');
          aValEl.textContent = finalAI;
        } else {
          _animateRoll(hValEl, 0, 0, finalHuman, stage1HumanWon);
          aValEl.textContent = finalAI;
        }
      } else {
        hLabelEl.textContent = 'Final Shot';
        aLabelEl.textContent = 'GK Block';
        const humanWonResult = isHumanAttacker ? (res.finalWinner === 'attacker') : (res.finalWinner === 'defender');
        const finalHuman = isHumanAttacker ? res.rolledValue : res.defendValue;
        const finalAI = isHumanAttacker ? res.defendValue : res.rolledValue;

        _animateRoll(hValEl, 0, 0, finalHuman, humanWonResult);
        aValEl.textContent = finalAI;
      }
    } else {
      const hAction = res.humanAction || actionType;
      hLabelEl.textContent = hAction;
      const statKey = _getStatKey(hAction);
      
      // Calculate realistic range including buffs AND signature skills
      let base = human ? (human.stats[statKey].base + (state.activeDuel?.buffs[statKey] ?? 0)) : 0;
      base = applySignatureSkill(human, hAction, base);
      const vol = human ? human.volatility : 0;
      
      const humanWonResult = isHumanAttacker ? (res.winner === 'attacker') : (res.winner === 'defender');
      const finalHumanVal = isHumanAttacker ? res.rolledValue : res.defendValue;
      const finalAIVal = isHumanAttacker ? res.defendValue : res.rolledValue;

      _animateRoll(hValEl, base, base + vol, finalHumanVal, humanWonResult);
      aValEl.textContent = finalAIVal;
      aLabelEl.textContent = res.aiAction || (intent ? intent.action : 'Wait');
    }
  } else {
    // ─── NORMAL MODE (PREDICTION) ───
    if (human) {
      const statKey = _getStatKey(actionType);
      let base = human.stats[statKey].base + (state.activeDuel?.buffs[statKey] ?? 0);
      base = applySignatureSkill(human, actionType, base);
      const vol = human.volatility;
      
      hValEl.innerHTML = `${base}<span class="dim">-${base + vol}</span>`;
      hLabelEl.textContent = actionType;
      hValEl.className = 'd-val';
    }
    if (intent) {
      const aiVal = Math.max(0, intent.value + (state.activeDuel?.buffs.aiValueDelta || 0));
      aValEl.textContent = aiVal;
      aLabelEl.textContent = intent.action;
    } else {
      aValEl.textContent = '--';
      aLabelEl.textContent = 'Wait';
    }
  }
}

let _rollInterval = null;
function _animateRoll(el, min, max, final, isWin, suffix = '') {
  if (_rollInterval) clearInterval(_rollInterval);
  
  let ticks = 0;
  const maxTicks = 12;
  
  _rollInterval = setInterval(() => {
    ticks++;
    if (ticks < maxTicks) {
      // Roll random numbers in range
      const val = min === max ? min : Math.floor(Math.random() * (max - min + 1)) + min;
      el.textContent = val + suffix;
      el.className = 'd-val shake-anim';
    } else {
      // Show final
      clearInterval(_rollInterval);
      el.textContent = final;
      el.className = 'd-val ' + (isWin ? 'win-glow' : 'loss-glow');
    }
  }, 80);
}

function _hideDilemma() {
  const container = document.getElementById('dilemma-container');
  if (container) container.classList.add('hidden');
}

function _getStatKey(action) {
  const map = { dribble: 'DRI', pass: 'PAS', shoot: 'SHO', press: 'AGG', block: 'COM' };
  return map[action] || 'PAS';
}

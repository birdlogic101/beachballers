/**
 * hud.js — Heads-Up Display renderer.
 * Manages player portraits, larger heat bars (with numeric labels), 
 * and the focal Dilemma display (with dimmed volatility range).
 */

import { formatClock } from '../core/clock.js';

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
  } else {
    if (actorHumanEl) {
      actorHumanEl.classList.remove('hidden');
      if (humanActor) _fillActor(actorHumanEl, humanActor, state.activeDuel?.buffs ?? {}, 'human');
    }
    if (actorAIEl) {
      actorAIEl.classList.remove('hidden');
      if (aiActor) _fillActor(actorAIEl, aiActor, {}, 'ai');
    }
    _renderDilemma(state, humanActor, aiActor);
  }
}

/**
 * Called by actions.js to update the central dilemma on hover.
 */
export function setHoveredAction(type) {
  _hoveredAction = type;
  if (_lastState) renderHUD(_lastState);
}

function _fillActor(el, player, buffs, team) {
  const nameEl = el.querySelector('.p-name');
  if (nameEl) nameEl.textContent = player.name;
  
  const roleEl = el.querySelector('.p-role');
  if (roleEl) roleEl.textContent = player.zone;

  // Heat Bar + Value
  const heatFill = el.querySelector('.heat-bar-fill');
  const heatLabel = el.querySelector('.heat-value');
  if (heatFill) {
    const percent = ((player.heat + 5) / 15) * 100;
    heatFill.style.width = `${Math.max(5, percent)}%`;
    if (player.heat < 0) heatFill.style.background = '#5285e0';
    else if (player.heat >= 7) heatFill.style.background = '#ff4820';
    else heatFill.style.background = '#f5c842';
  }
  if (heatLabel) {
    heatLabel.textContent = `HEAT: ${player.heat > 0 ? '+' : ''}${player.heat}`;
  }

  // Stats (Player cards show FIXED values)
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

function _renderDilemma(state, human, ai) {
  const container = document.getElementById('dilemma-container');
  if (!container) return;
  container.classList.remove('hidden');

  const intent = state.activeDuel?.aiIntent;
  const actionType = _hoveredAction || (state.possession === 'human' ? 'pass' : (intent?.action.toLowerCase() || 'block'));

  // 1. Human Side (Range: Bright Base - Dim Max)
  const hValEl = document.getElementById('dilemma-val-human');
  const hLabelEl = document.getElementById('dilemma-label-human');
  
  if (human) {
    const statKey = _getStatKey(actionType);
    const base = human.stats[statKey].base + (state.activeDuel?.buffs[statKey] ?? 0);
    const vol = human.volatility;
    hValEl.innerHTML = `${base}<span class="dim">-${base + vol}</span>`;
    hLabelEl.textContent = actionType;
  }

  // 2. AI Side (Fixed Value)
  const aValEl = document.getElementById('dilemma-val-ai');
  const aLabelEl = document.getElementById('dilemma-label-ai');

  if (intent) {
    aValEl.textContent = intent.value;
    aLabelEl.textContent = intent.action;
  } else {
    aValEl.textContent = '--';
    aLabelEl.textContent = 'Wait';
  }
}

function _hideDilemma() {
  const container = document.getElementById('dilemma-container');
  if (container) container.classList.add('hidden');
}

function _getStatKey(action) {
  const map = { dribble: 'DRI', pass: 'PAS', shoot: 'SHO', press: 'AGG', block: 'COM' };
  return map[action] || 'PAS';
}

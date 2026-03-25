/**
 * hud.js — Nuclear Rewrite V1.1
 * Restoring Resolution display support.
 */

import { formatClock } from '../core/clock.js';
import { PHASE } from '../core/state.js';
import { applySignatureSkill } from '../core/duel.js';

let _lastState = null;
let _hoveredAction = null; 

export function initHUD() {
}

export function renderHUD(state) {
  _lastState = state;
  const phase = state.phase;
  const res = state.resolution;
  
  // 1. Meta (Clock, Score)
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = formatClock(state.clock);
  
  const sH = document.getElementById('score-human');
  const sA = document.getElementById('score-ai');
  if (sH) sH.textContent = state.score.human;
  if (sA) sA.textContent = state.score.ai;

  // 2. Element Visibility
  const hEl = document.getElementById('actor-human');
  const aEl = document.getElementById('actor-ai');
  const dEl = document.getElementById('dilemma-container');
  const pBall = document.getElementById('possession-ball');

  const showHUD = (phase === 'PLAYER_ACTION' || phase === 'RESOLUTION' || phase === 'ONE_V_ZERO');
  
  if (hEl) hEl.style.display = showHUD ? 'flex' : 'none';
  if (dEl) dEl.style.display = showHUD ? 'flex' : 'none';
  
  const is1v1 = showHUD && phase !== 'ONE_V_ZERO';
  if (aEl) aEl.style.display = is1v1 ? 'flex' : 'none';
  
  if (pBall) {
    pBall.style.display = showHUD ? 'block' : 'none';
    if (showHUD) {
      pBall.className = state.possession === 'human' ? 'pos-human' : 'pos-ai';
    }
  }

  // 3. Content Population
  const allPlayers = [...(state.humans || []), ...(state.ais || [])];
  const duel = state.activeDuel;
  
  let humanActor = null;
  let aiActor = null;

  if (showHUD && duel) {
    const atk = allPlayers.find(p => p.id === duel.attacker);
    const def = allPlayers.find(p => p.id === duel.defender);
    
    if (atk) {
      if (atk.id.startsWith('hu')) humanActor = atk; else aiActor = atk;
    }
    if (def) {
      if (def.id.startsWith('hu')) humanActor = def; else aiActor = def;
    }

    const isHumanAttacking = state.possession === 'human';
    const hStats = isHumanAttacking ? ['DRI','PAS','SHO'] : ['AGG','COM'];
    const aStats = isHumanAttacking ? ['AGG','COM'] : ['DRI','PAS','SHO'];

    // GK Special Handling: Always show DIV
    if (humanActor?.stats.DIV !== undefined) hStats.push('DIV');
    if (aiActor?.stats.DIV !== undefined) aStats.push('DIV');

    if (humanActor && hEl) _fillActor(hEl, humanActor, duel.buffs || {}, hStats);
    if (aiActor && aEl) _fillActor(aEl, aiActor, {}, aStats);

    // ─── GK PREVIEW (secondary card) ───
    const hGK = allPlayers.find(p => p.id === 'huGK');
    const aGK = allPlayers.find(p => p.id === 'aiGK');
    const hGKPreview = document.getElementById('actor-human-gk');
    const aGKPreview = document.getElementById('actor-ai-gk');

    if (hGKPreview) {
       // Only show human GK preview if human is DEFENDING and current actor isn't already the GK
       const showH = !isHumanAttacking && (humanActor?.id !== 'huGK');
       hGKPreview.classList.toggle('hidden', !showH);
       if (showH && hGK) _fillActor(hGKPreview, hGK, {}, ['DIV']);
    }
    if (aGKPreview) {
       // Only show AI GK preview if AI is DEFENDING and current actor isn't already the GK
       const showA = isHumanAttacking && (aiActor?.id !== 'aiGK');
       aGKPreview.classList.toggle('hidden', !showA);
       if (showA && aGK) _fillActor(aGKPreview, aGK, {}, ['DIV']);
    }
    
    _renderDilemma(state, humanActor, aiActor);
  }

  _renderTopCards(state);
}

function _fillActor(el, player, buffs, statList) {
  if (!el) return;
  const statGrid = el.querySelector('.stat-grid');
  if (statGrid) {
    statGrid.style.display = 'flex';
    statGrid.innerHTML = '';
    
    statList.forEach(key => {
      if (player.stats[key] === undefined) return;
      const val = (player.stats[key] || 0) + (buffs[key] || 0);
      statGrid.innerHTML += `
        <div class="stat-cell">
          <span class="s-label">${key}</span>
          <span class="s-value">${val}</span>
        </div>`;
    });
  }
  
  const portWrap = el.querySelector('.portrait-wrap');
  if (portWrap) {
    const img = portWrap.querySelector('img');
    if (img) img.src = player.portrait;
    portWrap.classList.toggle('momentum-active', player.momentum > 0);
  }
}

function _renderTopCards(state) {
  const left = document.getElementById('player-info-left');
  const right = document.getElementById('player-info-right');
  const hP = (state.humans || []).find(p => p.id === state.selectedHumanId);
  const aP = (state.ais || []).find(p => p.id === state.selectedAIId);

  if (left) {
    left.style.display = hP ? 'flex' : 'none';
    if (hP) _fillMiniCard(left, hP, 'human');
  }
  if (right) {
    right.style.display = aP ? 'flex' : 'none';
    if (aP) _fillMiniCard(right, aP, 'ai');
  }
}

function _fillMiniCard(el, p, team) {
  const momPct = (Math.max(0, p.momentum) / 7) * 100;
  const stats = ['DRI','PAS','SHO','AGG','COM','DIV'].filter(s => p.stats[s] !== undefined);
  el.className = `top-player-info ${team}`;
  el.innerHTML = `
    <img src="${p.portrait}" class="mini-portrait">
    <div class="mini-main">
      <div class="mini-name-row">
        <span class="mini-name">${p.name}</span>
        <span class="mini-number">#${p.number}</span>
      </div>
      <div class="mini-stats">
        ${stats.filter(s => p.stats[s] !== undefined).map(s => `
          <div class="mini-stat-item">${s}<div class="mini-stat-val">${p.stats[s]}</div></div>
        `).join('')}
      </div>
      <div class="momentum-container-hud">
        <div class="momentum-fill-hud" style="width: ${momPct}%"></div>
        <span class="momentum-label-hud">MOMENTUM ${p.momentum}</span>
      </div>
      <div class="fitness-container">
        <div class="fitness-fill" style="width: ${(p.fitness / (p.maxFitness || 20)) * 100}%"></div>
        <span class="fitness-label">FITNESS ${p.fitness}/${p.maxFitness || 20}</span>
      </div>
    </div>
  `;
}

function _renderDilemma(state, human, ai) {
  const hValEl = document.getElementById('dilemma-val-human');
  const aValEl = document.getElementById('dilemma-val-ai');
  const hLabelEl = document.getElementById('dilemma-label-human');
  const aLabelEl = document.getElementById('dilemma-label-ai');

  if (!hValEl || !aValEl) return;

  const res = state.resolution;
  const isRes = state.phase === PHASE.RESOLUTION;

  if (isRes && res) {
    // ─── RESOLUTION MODE ───
    const hVal = res.isHuman ? res.rolledValue : res.defendValue;
    const aVal = res.isHuman ? res.defendValue : res.rolledValue;

    // 1v0 Logic: Hide AI side if uncontested (EXCEPT if shooting, then show GK)
    const vsEl = document.getElementById('vs-divider');
    const aiSideEl = document.getElementById('dilemma-ai');
    const isShot = res.actionType === 'shoot';
    if (vsEl) vsEl.style.display = (res.isOneVZero && !isShot) ? 'none' : 'block';
    if (aiSideEl) aiSideEl.style.display = (res.isOneVZero && !isShot) ? 'none' : 'flex';

    if (!res.isOneVZero) {
       hValEl.textContent = hVal;
       aValEl.textContent = aVal;
    } else {
       hValEl.textContent = ""; // Blank or "OK"
    }

    // NEWS: Dramatic Aliases (§6.4)
    let hAlias = res.humanAction;
    let aAlias = res.aiAction;

    if (res.actionType === 'shoot' && res.stage === 2) {
      hAlias = res.isHuman ? "POWER STRIKE!" : "GK DIVE!";
      aAlias = res.isHuman ? "GK DIVE!" : "POWER STRIKE!";
    }

    hLabelEl.textContent = `${res.attackerName || "Attacker"}: ${hAlias}`;
    
    // NEW (§6.4): Multi-Stage & Dramatic Narrative UX (V2.12)
    const statusText = res.statusText || "";
    
    if (res.reflexStatus === 'rolling') {
      const pct = Math.round((res.reflexChance || 0) * 100);
      aLabelEl.textContent = `REFLEX ATTEMPT (${pct}%)`;
      aLabelEl.className = 'd-label pulse-text';
    } else if (res.reflexStatus === 'saved') {
      aLabelEl.textContent = statusText || "REFLEX SAVE!";
      aLabelEl.className = 'd-label miracle-glow';
    } else if (res.reflexStatus === 'failed') {
      aLabelEl.textContent = statusText || "REFLEX FAILED!";
      aLabelEl.className = 'd-label fail-text';
    } else if (statusText) {
      // Use the narrator's text if available + Defender name
      aLabelEl.textContent = `${res.defenderName || "Defender"}: ${statusText}`;
      aLabelEl.className = 'd-label narrator-text';
      
      // Color coding for narrative beats
      if (statusText.includes("BYPASSED")) aLabelEl.classList.add('win-text');
      if (statusText.includes("BLOCKED")) aLabelEl.classList.add('fail-text');
    } else {
      aLabelEl.textContent = `${res.defenderName || "Defender"}: ${aAlias}`;
      aLabelEl.className = 'd-label';
    }
    
    const hWon = (res.winner === 'attacker' && res.isHuman) || (res.winner === 'defender' && !res.isHuman);
    hValEl.className = 'd-val ' + (hWon ? 'win-glow' : 'loss-glow');
    aValEl.className = 'd-val ' + (!hWon ? 'win-glow' : 'loss-glow');
    
  } else {
    // ─── NORMAL MODE (PREDICTION) ───
    const vsEl = document.getElementById('vs-divider');
    const aiSideEl = document.getElementById('dilemma-ai');
    
    // In 1v0, only show AI side if hovering/choosing a Shoot action
    const currentAction = _hoveredAction || (state.possession === 'human' ? 'pass' : 'block');
    const isShoot = currentAction.toLowerCase() === 'shoot';
    const forceShowAI = state.phase === PHASE.ONE_V_ZERO && isShoot;

    if (vsEl) vsEl.style.display = (state.phase === PHASE.ONE_V_ZERO && !forceShowAI) ? 'none' : 'block';
    if (aiSideEl) aiSideEl.style.display = (state.phase === PHASE.ONE_V_ZERO && !forceShowAI) ? 'none' : 'flex';

    const intent = state.activeDuel?.aiIntent;
    if (intent) {
      aValEl.textContent = intent.value;
      aLabelEl.textContent = intent.action;
    } else {
      aValEl.textContent = '--';
      aLabelEl.textContent = 'Wait';
    }

    if (human) {
      const action = _hoveredAction || (state.possession === 'human' ? 'pass' : 'block');
      const statKey = _getStatKey(action);
      const base = (human.stats[statKey] || 0) + (state.activeDuel?.buffs[statKey] || 0);
      const mom = human.momentum || 0;
      
      if (action.toLowerCase() === 'block') {
        hValEl.textContent = base + mom;
      } else {
        hValEl.innerHTML = `${base}${mom > 0 ? `<span class="dim">-${base + mom}</span>` : ''}`;
      }
      hLabelEl.textContent = action;
    } else {
      hValEl.textContent = '--';
    }
    hValEl.className = 'd-val';
    aValEl.className = 'd-val';
  }
}

export function setHoveredAction(type) {
  _hoveredAction = type;
  if (_lastState) renderHUD(_lastState);
}

function _getStatKey(action) {
  const map = { dribble: 'DRI', pass: 'PAS', shoot: 'SHO', press: 'AGG', block: 'COM', save: 'REF' };
  return map[action ? action.toLowerCase() : ''] || 'PAS';
}

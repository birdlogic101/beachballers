/**
 * carousel.js — Move Card Carousel renderer (Horizontal).
 * Filters cards by AI intent color (§5) and handles TU/Momentum cost lock.
 */

import { MOVES } from '../data/moves.js';
import { INTENT_TO_MOVE_COLOR } from '../core/ai.js';

let _dispatch = null;

export function initCarousel(dispatch) {
  _dispatch = dispatch;
}

export function renderCarousel(state) {
  const wrap = document.getElementById('move-carousel');
  if (!wrap) return;

  // 1v0 state or no duel — hide carousel
  const phase = state.phase;
  if (phase === 'KICKOFF' || phase === 'MATCH_OVER') {
    wrap.classList.add('hidden');
    document.getElementById('tu-banner')?.classList.add('hidden');
    return;
  }
  wrap.classList.remove('hidden');

  // Filter moves by AI intent color (if any)
  const intent = state.activeDuel?.aiIntent;
  const intentColor = intent ? INTENT_TO_MOVE_COLOR[intent.action.toLowerCase()] : null;
  const hand = state.activeDuel?.moveHand ?? [];
  
  const available = intentColor 
    ? hand.filter(m => m.color === intentColor)
    : hand;

  const currentTU = state.activeDuel?.touchUnits ?? 0;
  
  // Find active human player to check Momentum
  const human = state.humans.find(p => p.id === state.activeDuel?.attacker || p.id === state.activeDuel?.defender);
  const currentMomentum = human ? human.momentum : 0;

  const tuBanner = document.getElementById('tu-banner');
  const tuVal = document.getElementById('tu-active-val');
  if (tuBanner && tuVal) {
    tuBanner.classList.remove('hidden');
    tuVal.textContent = state.activeDuel?.touchUnits ?? 0;
  }

  wrap.innerHTML = '';
  available.forEach(move => {
    const card = document.createElement('article');
    const isAffordable = (currentTU >= move.tuCost) && (currentMomentum >= (move.momentumReq || 0));
    
    card.className = `move-card ${!isAffordable ? 'disabled' : ''}`;
    card.dataset.id = move.id;
    
    card.innerHTML = `
      <div class="m-color-tag" style="background: var(--color-${move.color})"></div>
      <div class="m-name">${move.name}</div>
      <div class="m-desc">${_moveDesc(move)}</div>
      <div class="m-cost-footer">
        <span class="m-tu-cost">${move.tuCost} TU</span>
        ${move.momentumReq ? `<span class="m-momentum-req">+${move.momentumReq} M</span>` : ''}
      </div>
    `;

    if (isAffordable) {
      card.onclick = () => _dispatch({ type: 'PLAY_MOVE', moveId: move.id });
    }
    
    wrap.appendChild(card);
  });
}

function _moveDesc(move) {
  const parts = [];
  const ef = move.effect;
  if (ef.stat) parts.push(`+${ef.bonus} ${ef.stat}`);
  if (ef.momentumDelta) parts.push(`${ef.momentumDelta > 0 ? '+' : ''}${ef.momentumDelta} Momentum`);
  if (ef.fitnessDelta) parts.push(`${ef.fitnessDelta > 0 ? '+' : ''}${ef.fitnessDelta} Fit`);
  if (ef.aiValueDelta) parts.push(`${ef.aiValueDelta} AI`);
  if (ef.ballState === 'AIR') parts.push('↑ AIR');
  if (ef.convertTo) parts.push(`➔ ${ef.convertTo}`);
  
  return parts.length > 0 ? parts.join(', ') : (move.description || '');
}

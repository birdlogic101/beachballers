/**
 * carousel.js — Move Card Carousel renderer (Horizontal).
 * Filters cards by AI intent color (§5) and handles TU/Heat cost lock.
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
  if (phase === 'ONE_V_ZERO' || phase === 'KICKOFF' || phase === 'MATCH_OVER') {

    wrap.classList.add('hidden');
    return;
  }
  wrap.classList.remove('hidden');

  // Filter moves by AI intent color (if any)
  const intent = state.activeDuel?.aiIntent;
  const intentColor = intent ? INTENT_TO_MOVE_COLOR[intent.action] : null;
  const available = intentColor 
    ? MOVES.filter(m => m.color === intentColor)
    : MOVES;

  const currentTU = state.activeDuel?.touchUnits ?? 0;
  
  // Find active human player to check Heat
  const human = state.humans.find(p => p.id === state.activeDuel?.attacker || p.id === state.activeDuel?.defender);
  const currentHeat = human ? human.heat : 0;

  wrap.innerHTML = '';
  available.forEach(move => {
    const card = document.createElement('article');
    const isAffordable = (currentTU >= move.tuCost) && (currentHeat >= (move.heatReq || 0));
    
    card.className = `move-card ${!isAffordable ? 'disabled' : ''}`;
    card.dataset.id = move.id;
    
    card.innerHTML = `
      <div class="m-color-tag" style="background: var(--color-${move.color})"></div>
      <div class="m-name">${move.name}</div>
      <div class="m-cost">TU: ${move.tuCost}</div>
      <div class="m-req">Heat: ${move.heatReq || 0}</div>
      <div class="m-desc">${_moveDesc(move)}</div>
    `;

    if (isAffordable) {
      card.onclick = () => _dispatch({ type: 'PLAY_MOVE', moveId: move.id });
    }

    
    wrap.appendChild(card);
  });
}

function _moveDesc(move) {
  if (move.effect.stat) return `+${move.effect.bonus} ${move.effect.stat}`;
  if (move.effect.heatBonus) return `+${move.effect.heatBonus} Heat`;
  return '';
}

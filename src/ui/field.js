/**
 * field.js — SVG minimap renderer (Vertical layout).
 * 6 rows (top-to-bottom) x 3 columns (left-to-right).
 * Supports Ball marker and multi-entity offsets per zone.
 */

const SVG_W  = 180;
const SVG_H  = 360;
const PAD    = 10;
const CELL_W = (SVG_W - PAD*2) / 3;
const CELL_H = (SVG_H - PAD*2) / 6;

/** Column letter → column index (A=0, B=1, C=2) */
const colIdx = c => c === 'A' ? 0 : c === 'B' ? 1 : 2;
const rowIdx = r => r - 1;

function zoneToXY(zone) {
  const row = parseInt(zone[0]);
  const col = zone[1];
  const x = PAD + colIdx(col) * CELL_W + CELL_W / 2;
  // Row 1 (Human GK) at bottom, Row 6 (AI GK) at top
  let y;
  if (row === 7) y = PAD - 3; // Inside AI Net
  else if (row === 0) y = PAD + 6 * CELL_H + 3; // Inside Human Net
  else y = PAD + (6 - row) * CELL_H + CELL_H / 2;
  
  return { x, y };
}

let _svgEl = null;
let _dispatch = null;

export function initField(container, dispatch) {
  if (!container) return;
  _dispatch = dispatch;
  
  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
  svg.style.width = '100%';
  svg.style.height = '100%';

  // Draw grid (Vertical)
  for (let r = 1; r <= 6; r++) {
    for (let c = 0; c < 3; c++) {
      const x = PAD + c * CELL_W;
      const y = PAD + (r - 1) * CELL_H;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x + 2);
      rect.setAttribute('y', y + 2);
      rect.setAttribute('width', CELL_W - 4);
      rect.setAttribute('height', CELL_H - 4);
      rect.setAttribute('rx', 6);
      rect.setAttribute('fill', 'rgba(255,255,255,0.02)');
      rect.setAttribute('stroke', 'rgba(255,255,255,0.05)');
      rect.setAttribute('stroke-width', '1');
      svg.appendChild(rect);
    }
  }

  // Nets
  const netW = CELL_W * 0.8;
  const netH = 6;
  // Top Net (AI)
  const topNet = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  topNet.setAttribute('x', PAD + CELL_W + (CELL_W - netW)/2);
  topNet.setAttribute('y', PAD - netH);
  topNet.setAttribute('width', netW);
  topNet.setAttribute('height', netH);
  topNet.setAttribute('fill', 'rgba(255,255,255,0.2)');
  topNet.setAttribute('stroke', '#fff');
  topNet.setAttribute('rx', 2);
  topNet.setAttribute('class', 'minimap-net');
  svg.appendChild(topNet);

  // Bottom Net (Human)
  const botNet = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  botNet.setAttribute('x', PAD + CELL_W + (CELL_W - netW)/2);
  botNet.setAttribute('y', PAD + 6 * CELL_H);
  botNet.setAttribute('width', netW);
  botNet.setAttribute('height', netH);
  botNet.setAttribute('fill', 'rgba(255,255,255,0.2)');
  botNet.setAttribute('stroke', '#fff');
  botNet.setAttribute('rx', 2);
  botNet.setAttribute('class', 'minimap-net');
  svg.appendChild(botNet);

  container.appendChild(svg);
  _svgEl = svg;
}

export function renderField(state) {
  if (!_svgEl) return;

  // 1. Zone Highlight (Reuse or Create)
  let highlight = _svgEl.querySelector('.zone-highlight');
  // Hide highlight during goal animation or kickoff setup
  const shouldShow = state.ballZone && state.phase !== 'GOAL_ANIMATION' && state.phase !== 'KICKOFF';
  
  if (shouldShow) {
    if (!highlight) {
      highlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      highlight.setAttribute('class', 'zone-highlight');
      highlight.setAttribute('width', CELL_W - 2);
      highlight.setAttribute('height', CELL_H - 2);
      highlight.setAttribute('rx', 6);
      highlight.setAttribute('fill', 'rgba(245,200,66,0.08)');
      highlight.setAttribute('stroke', 'var(--accent)');
      highlight.setAttribute('stroke-width', '1');
      _svgEl.insertBefore(highlight, _svgEl.firstChild);
    }
    const r = parseInt(state.ballZone[0]);
    const c = colIdx(state.ballZone[1]);
    highlight.setAttribute('x', PAD + c * CELL_W + 1);
    highlight.setAttribute('y', PAD + (6 - r) * CELL_H + 1);
  } else if (highlight) highlight.remove();

  // 2. Players (Stateful update for animation)
  const allPlayers = [...state.humans, ...state.ais];
  
  allPlayers.forEach(p => {
    const isHuman = state.humans.includes(p);
    const isSelected = p.id === state.selectedHumanId;
    const fill = isHuman ? '#5285e0' : '#ff9f43';
    const ox = isHuman ? -10 : 10;
    const oy = -8;
    _drawOrUpdateDot(p, fill, isSelected ? 'var(--accent)' : '#fff', ox, oy, isSelected);
  });

  // 3. Ball
  let ball = _svgEl.querySelector('.ball-dot');
  if (state.ballZone) {
    const { x, y } = zoneToXY(state.ballZone);
    if (!ball) {
      ball = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ball.setAttribute('class', 'ball-dot');
      ball.setAttribute('r', 3.5);
      ball.setAttribute('fill', '#fff');
      ball.setAttribute('stroke', '#000');
      ball.setAttribute('stroke-width', '1');
      ball.setAttribute('filter', 'drop-shadow(0 0 4px rgba(255,255,255,0.8))');
      _svgEl.appendChild(ball);
    }
    const isGoal = state.ballZone === '0B' || state.ballZone === '7B';
    ball.setAttribute('cx', x);
    ball.setAttribute('cy', y + (isGoal ? 0 : 8));
  } else if (ball) ball.remove();
}

function _drawOrUpdateDot(player, fill, stroke, ox, oy, isSelected) {
  if (!player.zone) return;
  const { x, y } = zoneToXY(player.zone);
  const targetX = x + ox;
  const targetY = y + oy;
  
  let group = _svgEl.querySelector(`[data-player-id="${player.id}"]`);
  
  if (!group) {
    group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'player-group');
    group.setAttribute('data-player-id', player.id);
    group.style.cursor = 'pointer';
    group.style.pointerEvents = 'all';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', 8); 
    circle.setAttribute('fill', fill);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', isSelected ? '2' : '1.5');
    circle.setAttribute('filter', isSelected ? 'drop-shadow(0 0 4px var(--accent))' : 'none');
    circle.setAttribute('cx', 0); // Local center
    circle.setAttribute('cy', 0);
    group.appendChild(circle);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'minimap-text');
    text.setAttribute('x', 0); // Local center
    text.setAttribute('y', 0);
    text.textContent = player.number;
    group.appendChild(text);

    group.addEventListener('click', (e) => {
      e.stopPropagation();
      if (_dispatch) _dispatch({ type: 'SELECT_PLAYER', playerId: player.id });
    });

    _svgEl.appendChild(group);
  }

  // Update position (Animation triggered by CSS transitions on 'transform')
  group.setAttribute('transform', `translate(${targetX}, ${targetY})`);
}

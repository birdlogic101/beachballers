import { setHoveredAction } from './hud.js';
import { PHASE } from '../core/state.js';
import { canShoot, canPress, isDribbleLocked, isPassLocked } from '../core/momentum.js';

let _dispatch = null;

export function initActions(dispatch) {
  _dispatch = dispatch;
  
  // Attach click listeners
  const btnIds = ['btn-dribble', 'btn-pass', 'btn-shoot', 'btn-press', 'btn-block'];
  btnIds.forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('click', () => {
      const type = id.replace('btn-', '');
      _dispatch({ type: 'EXIT_ACTION', actionType: type });
    });

    // Hover logic: Update central Dilemma display
    btn.addEventListener('mouseenter', () => {
      const type = id.replace('btn-', '');
      setHoveredAction(type);
    });
    btn.addEventListener('mouseleave', () => {
      setHoveredAction(null);
    });
  });
}


export function renderActions(state) {
  const isHumanAttacking = state.possession === 'human';
  const phase = state.phase;

  // Toggle Visibility of Groups
  const attackGroup = document.getElementById('btn-group-attack');
  const defendGroup = document.getElementById('btn-group-defend');

  if (attackGroup) attackGroup.classList.toggle('hidden', !isHumanAttacking);
  if (defendGroup) defendGroup.classList.toggle('hidden', isHumanAttacking);

  const attacker = isHumanAttacking 
    ? state.humans.find(p => p.id === state.activeDuel?.attacker)
    : state.ais.find(p => p.id === state.activeDuel?.attacker);

  const defender = isHumanAttacking
    ? state.ais.find(p => p.id === state.activeDuel?.defender)
    : state.humans.find(p => p.id === state.activeDuel?.defender);

  const isActionable = (phase === PHASE.PLAYER_ACTION || phase === PHASE.ONE_V_ZERO);

  // Attack Buttons
  const btnDribble = document.getElementById('btn-dribble');
  if (btnDribble) {
    btnDribble.disabled = !isActionable || isDribbleLocked(state.ballZone);
  }
  const btnPass = document.getElementById('btn-pass');
  if (btnPass) {
    btnPass.disabled = !isActionable || isPassLocked(state.ballZone);
  }
  const btnShoot = document.getElementById('btn-shoot');
  if (btnShoot) {
    btnShoot.disabled = !isActionable || !attacker || !canShoot(attacker.momentum, state.ballZone);
  }

  // Defend Buttons
  const btnPress = document.getElementById('btn-press');
  if (btnPress) {
    const humanDef = state.humans.find(p => p.id === state.activeDuel?.defender);
    btnPress.disabled = !isActionable || !humanDef || !canPress(humanDef.momentum);
  }
  const btnBlock = document.getElementById('btn-block');
  if (btnBlock) {
    btnBlock.disabled = !isActionable; // Block is always allowed if actionable
  }
}

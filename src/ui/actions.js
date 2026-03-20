import { setHoveredAction } from './hud.js';

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

  // Dribble Lock (§7.4 row 5 vacant rule / GK zone 6B)
  const btnDribble = document.getElementById('btn-dribble');
  if (btnDribble) {
    const row = state.ballZone ? parseInt(state.ballZone[0]) : 0;
    btnDribble.disabled = (row === 6); // Cannot dribble out of game?
  }

  // Pass Lock
  const btnPass = document.getElementById('btn-pass');
  if (btnPass) {
    btnPass.disabled = (state.ballZone === '6B'); // Hard lock for GK exit
  }

  // Shoot Lock (Zone thresholds §8)
  const btnShoot = document.getElementById('btn-shoot');
  if (btnShoot) {
    const row = state.ballZone ? parseInt(state.ballZone[0]) : 0;
    // For V1.0, row 2 and 3 can shoot
    btnShoot.disabled = (row > 3 || row < 2);
  }

  // Press/Block (Heat requirement §10)
  const btnPress = document.getElementById('btn-press');
  if (btnPress) {
    const defender = state.humans.find(p => p.zone === state.ballZone);
    btnPress.disabled = !defender || defender.heat < 1;
  }

  // Global Lock: Only allow actions in Exit/Player phase
  const isActionable = (phase === PHASE.PLAYER_ACTION || phase === PHASE.ONE_V_ZERO);
  const allBtns = document.querySelectorAll('.wheel-btn');
  allBtns.forEach(b => {
    if (!isActionable) b.disabled = true;
  });
}

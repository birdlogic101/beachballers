import './style.css';
import { MatchEngine } from './game/MatchEngine.js';
import { DuelManager } from './game/DuelManager.js';
import { MOCK_ROSTER, MOCK_AI_TEAM, PLAYBOOK } from './game/data.js';
import { CONSTANTS } from './game/Constants.js';

class GameUI {
  constructor() {
    this.match = new MatchEngine();
    this.duel = new DuelManager();
    this.init();
  }

  init() {
    this.match.initMatch();
    this.setupDuelHUD();
    this.renderMinimap();
    this.bindEvents();
    this.setupActionPredictions();
    this.updateUI();
  }

  setupDuelHUD() {
    const isAttackerAI = this.match.possession === 'AI';
    const ballPos = this.match.ballPosition;
    
    // Antigravity Design Update: Clear "Inactive" state for everyone at start of new turn/duel
    this.match.teams.player.forEach(p => p.inactive = false);
    this.match.teams.ai.forEach(p => p.inactive = false);

    // Find active actors based on position
    const attackerTeam = isAttackerAI ? this.match.teams.ai : this.match.teams.player;
    const defenderTeam = isAttackerAI ? this.match.teams.player : this.match.teams.ai;
    
    const attacker = attackerTeam.find(p => p.pos.x === ballPos.x && p.pos.y === ballPos.y);
    
    // Antigravity Fix: If no attacker at spot (ball fell short), pick best candidate
    let activeAttacker = attacker;
    if (!activeAttacker) {
      activeAttacker = [...attackerTeam].sort((a,b) => {
        const sA = (a.stats.DRI||0) + (a.stats.PAS||0) + (a.stats.SHO||0);
        const sB = (b.stats.DRI||0) + (b.stats.PAS||0) + (b.stats.SHO||0);
        return sB - sA;
      })[0];
      if (activeAttacker) activeAttacker.pos = { ...ballPos };
    }

    const defender = defenderTeam.find(p => p.pos.x === ballPos.x && p.pos.y === ballPos.y);
    
    if (!activeAttacker) {
      console.error("No attacker found at", ballPos);
      return;
    }
    
    // If no defender in zone, pick the most appropriate defender
    let activeDefender = defender;
    if (!activeDefender) {
      const isAttackerInOwnGoal = (isAttackerAI && ballPos.y === 3) || (!isAttackerAI && ballPos.y === 0);
      const isAttackingGoal = (isAttackerAI && ballPos.y === 0) || (!isAttackerAI && ballPos.y === 3);
      
      if (isAttackingGoal) {
        // Attacking the opponent's goal - pick the opponent GK
        activeDefender = defenderTeam.find(p => p.isGK);
      } else if (!isAttackerInOwnGoal) {
        // Midfield - pick the best opponent tackler
        activeDefender = [...defenderTeam].sort((a,b) => (b.stats.TAC || 0) - (a.stats.TAC || 0))[0];
      }
      // Result: If isAttackerInOwnGoal and no one is there, activeDefender stays null
    }

    this.duel.setupDuel(activeAttacker, activeDefender, isAttackerAI);
    this.renderMoves();
    this.renderPlayerCard('attacker-card', activeAttacker);
    this.renderPlayerCard('defender-card', activeDefender);
}

  renderMinimap() {
    const map = document.querySelector('#minimap .minimap-grid');
    if (!map) return;
    map.innerHTML = '';
    // Draw rows from Top (y=3) to Bottom (y=0)
    for (let y = 3; y >= 0; y--) {
      const row = document.createElement('div');
      row.className = 'map-row';
      const zonesInRow = (y === 0 || y === 3) ? 1 : 2;
      for (let x = 0; x < zonesInRow; x++) {
        const zone = document.createElement('div');
        zone.className = 'map-zone';
        if (y === 0 || y === 3) zone.classList.add('gk');
        
        const isBallHere = (this.match.ballPosition.y === y && 
                            (zonesInRow === 1 ? true : this.match.ballPosition.x === x));
        
        if (isBallHere) zone.classList.add('active');
        
        // Render Player dots
        const playersInZone = this.match.teams.player.filter(p => p.pos.y === y && (zonesInRow === 1 ? true : p.pos.x === x));
        playersInZone.forEach((p, i) => {
          const dot = document.createElement('div');
          dot.className = `player-dot ${i > 0 ? 'dot-offset-' + i : ''}`;
          dot.innerText = p.number;
          zone.appendChild(dot);
        });
        
        // Render AI dots
        const aiInZone = this.match.teams.ai.filter(p => p.pos.y === y && (zonesInRow === 1 ? true : p.pos.x === x));
        aiInZone.forEach((p, i) => {
          const dot = document.createElement('div');
          dot.className = `ai-dot ${i > 0 || playersInZone.length > 0 ? 'dot-offset-' + (i + playersInZone.length) : ''}`;
          dot.innerText = p.number;
          zone.appendChild(dot);
        });

        row.appendChild(zone);
      }
      map.appendChild(row);
    }
  }

  renderPlayerCard(id, player) {
    const card = document.getElementById(id);
    const grid = card.querySelector('.stat-grid');
    grid.innerHTML = '';
    
    card.querySelector('.name').innerText = `#${player.number} ${player.name}`;
    card.querySelector('.heat-text').innerText = `Heat: ${player.heat}`;
    card.querySelector('.heat-fill').style.width = `${(player.heat / CONSTANTS.MAX_HEAT) * 100}%`;

    const statsToShow = ['DRI', 'PAS', 'SHO', 'TAC', 'REA', 'CON'];
    statsToShow.forEach(s => {
      const item = document.createElement('div');
      item.className = 'stat-item';
      item.innerHTML = `<span class="stat-label">${s}</span><span class="stat-val">${player.stats[s]}</span>`;
      grid.appendChild(item);
    });
  }

  bindEvents() {
    ['dribble', 'pass', 'shoot'].forEach(action => {
      const btn = document.getElementById(`btn-${action}`);
      if (!btn) return;
      btn.addEventListener('click', () => {
        if (action === 'pass') {
          this.showPassMenu();
        } else {
          this.handleAction(action.toUpperCase());
        }
      });
      btn.addEventListener('mouseenter', () => this.showPrediction(action.toUpperCase()));
      btn.addEventListener('mouseleave', () => this.hidePrediction());
    });
    
    document.getElementById('btn-hold').onclick = () => this.handleHold();
  }

  showPassMenu() {
    const isPlayer = this.match.possession === 'PLAYER';
    if (!isPlayer) return;

    const teammates = this.match.teams.player.filter(p => p.id !== this.duel.attacker.id);
    let menu = document.getElementById('pass-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'pass-menu';
      document.body.appendChild(menu);
    }
    
    menu.className = 'glass-panel';
    menu.innerHTML = '<h3>SELECT TARGET</h3>';
    
    teammates.forEach(tm => {
      const option = document.createElement('div');
      option.className = 'pass-option';
      option.innerHTML = `
        <div class="pass-info">
          <div class="pass-name">#${tm.number} ${tm.name}</div>
          <div class="pass-stats">
            CON: <span>${tm.stats.CON}</span>
            SHO: <span>${tm.stats.SHO}</span>
            PAS: <span>${tm.stats.PAS}</span>
          </div>
        </div>
      `;
      option.onclick = () => {
        this.handleAction('PASS', tm);
        menu.remove();
      };
      menu.appendChild(option);
    });

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-ghost';
    closeBtn.style.marginTop = '10px';
    closeBtn.innerText = 'CANCEL';
    closeBtn.onclick = () => menu.remove();
    menu.appendChild(closeBtn);
  }

  setupActionPredictions() {
    this.predictionBox = document.getElementById('prediction-box');
  }

  showPrediction(type) {
    // Determine active combatants based on action type
    let aPlayer, dPlayer, aStatName, dStatName;

    if (type === 'TACKLE') {
      aPlayer = this.duel.defender; // Player is tackling
      dPlayer = this.duel.attacker;
      aStatName = 'TAC';
      dStatName = 'CON';
    } else {
      aPlayer = this.duel.attacker; // AI or Player is exiting
      dPlayer = this.duel.defender;
      aStatName = this.duel.getMatchupStat(type);
      dStatName = 'REA';
    }

    const aVal = this.duel.getEffectiveStat(aPlayer, aStatName);
    const dVal = this.duel.getEffectiveStat(dPlayer, dStatName);
    let remaining = aVal - dVal;
    let formula = `${aVal} ${aStatName} - ${dVal} ${dStatName} = ${remaining}`;
    
    if (type === 'SHOOT') {
      const dist = this.duel.getDistanceToGoal(this.match.ballPosition.y, !this.duel.isAttackerAI);
      const penalty = dist * CONSTANTS.SHOOT_DISTANCE_PENALTY;
      remaining -= penalty;
      formula = `${aVal} SHO - ${dVal} REA - ${penalty} Dist = ${remaining}`;
    }

    const successChance = remaining > 0 ? "High" : "Blocked";
    this.predictionBox.querySelector('.prediction-text').innerText = `${aPlayer.name} ${type}: ${successChance}`;
    this.predictionBox.querySelector('.formula-text').innerText = formula;
    this.predictionBox.classList.remove('hidden');
  }

  hidePrediction() {
    this.predictionBox.classList.add('hidden');
  }


  handleAction(type, targetTeammate = null) {
    let result;
    if (type === 'TACKLE') {
      result = this.duel.resolveTackle();
    } else {
      result = this.duel.resolveExitAction(type, this.match.ballPosition.y);
    }
    
    this.showResolution(type, result);
    this.match.incrementClock(CONSTANTS.TURN_DURATION_SECS);

    let shouldSwap = false;
    
    if (result.success) {
      if (type === 'DRIBBLE') {
        this.match.handleSuccessfulDribble(!this.duel.isAttackerAI, this.duel.attacker.id);
      } else if (type === 'SHOOT') {
        this.match.recordGoal(this.duel.isAttackerAI ? 'ai' : 'player');
      } else if (type === 'PASS') {
        // AI Teammate Selection
        if (!targetTeammate && this.duel.isAttackerAI) {
          const team = this.match.teams.ai;
          const teammates = team.filter(p => !p.isGK && p.id !== this.duel.attacker.id);
          targetTeammate = teammates[Math.floor(Math.random() * teammates.length)];
        }
        
        if (targetTeammate) {
          // Lane Logic: Randomize landing lane for receiver in midfield
          if (targetTeammate.pos.y > 0 && targetTeammate.pos.y < 3) {
            targetTeammate.pos.x = Math.random() > 0.5 ? 0 : 1;
          } else {
            targetTeammate.pos.x = 0; // Goal Zones are always x=0
          }
          this.match.ballPosition = { ...targetTeammate.pos };
          this.match.clearInactiveStates();
        }
      } else if (type === 'TACKLE') {
        this.match.swapPossession();
        // Possession simply changes hands at current spot.
      }
    } else {
      // FAILURE
      if (type !== 'TACKLE') {
        // If an attacker fails their exit action, swap possession.
        shouldSwap = true;
        
        if (type === 'PASS' || type === 'SHOOT') {
          if (result.failureRow !== undefined) {
            this.match.ballPosition.y = result.failureRow;
            if (result.failureRow === 0 || result.failureRow === 3) this.match.ballPosition.x = 0;
          }
          // Save state inactive
          if (type === 'SHOOT' && (this.match.ballPosition.y === 0 || this.match.ballPosition.y === 3)) {
            this.duel.attacker.inactive = true;
          }
        }
        
        if (type === 'DRIBBLE') {
          // Attacker is tackled/blocked on a dribble attempt
          if (result.reason === 'INTERCEPTED' && this.duel.defender) {
            this.duel.defender.pos = { ...this.match.ballPosition };
          }
          this.duel.attacker.inactive = true;
        }
        
        if (type === 'PASS' && result.reason === 'INTERCEPTED' && this.duel.defender) {
          this.duel.defender.pos = { ...this.match.ballPosition };
        }
      }
      // If TACKLE failed, possession stays with attacker (no swap).
    }

    if (shouldSwap) {
      this.match.swapPossession();
    } else if (type !== 'TACKLE' && type !== 'SHOOT') {
      this.match.resetShotClock();
    }

    setTimeout(() => {
      this.match.transitionToFlow(() => {
        this.setupDuelHUD();
        this.renderMinimap();
        this.updateUI();
        this.updateScoreboard();
      });
    }, 2000);
  }

  handleHold() {
    this.duel.handleHold();
    this.match.incrementClock(CONSTANTS.TURN_DURATION_SECS);
    
    const isGKZone = this.match.ballPosition.y === 0 || this.match.ballPosition.y === 3;
    if (isGKZone) {
      this.match.handleGKShotClock();
    } else {
      this.match.resetShotClock();
    }

    if (['DRIBBLE', 'PASS', 'SHOOT', 'TACKLE'].includes(this.duel.aiIntent)) {
      this.handleAction(this.duel.aiIntent); 
    } else {
      setTimeout(() => {
        this.match.transitionToFlow(() => {
          this.duel.rollAIIntent(this.duel.isAttackerAI);
          this.updateUI();
          this.renderMoves();
          this.renderPlayerCard('attacker-card', this.duel.attacker);
          this.renderPlayerCard('defender-card', this.duel.defender);
        });
      }, 1000);
    }
  }

  updateUI() {
    this.updateScoreboard(); 
    document.querySelector('.half').innerText = `${this.match.half}${this.match.half === 1 ? 'st' : 'nd'} Half`;

    if (this.match.phase === 'START' || this.match.phase === 'HALF_TIME' || this.match.phase === 'MATCH_OVER') {
      this.showMatchEventModal();
      return;
    }

    const intentEl = document.getElementById('ai-intent-bubble');
    const possessionText = this.match.possession === 'PLAYER' ? "PLAYER possession" : "AI possession";
    const intentPrefix = this.duel.isAttackerAI ? "AI Offensive Intent: " : "AI Defensive Intent: ";
    intentEl.innerText = `${possessionText} | ${intentPrefix}${this.duel.aiIntent}`;

    const exitActions = document.getElementById('exit-actions');
    const updateBtnState = (id, action) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const isUnlocked = this.duel.unlockedActions.has(action);
      btn.disabled = !isUnlocked;
      btn.classList.toggle('locked', !isUnlocked);
    };

    if (this.duel.isAttackerAI) {
      document.getElementById('btn-dribble').classList.add('hidden');
      document.getElementById('btn-pass').classList.add('hidden');
      document.getElementById('btn-shoot').classList.add('hidden');
      
      let tackleBtn = document.getElementById('btn-tackle');
      if (!tackleBtn) {
        tackleBtn = document.createElement('button');
        tackleBtn.id = 'btn-tackle';
        tackleBtn.className = 'exit-btn';
        tackleBtn.innerText = 'TACKLE';
        tackleBtn.onclick = () => this.handleAction('TACKLE');
        exitActions.insertBefore(tackleBtn, document.getElementById('btn-hold'));
      } else {
        tackleBtn.classList.remove('hidden');
      }
      updateBtnState('btn-tackle', 'TACKLE');
    } else {
      document.getElementById('btn-dribble').classList.remove('hidden');
      document.getElementById('btn-pass').classList.remove('hidden');
      
      const isHomeGK = this.duel.attacker.isGK && (this.match.ballPosition.y === 0 || this.match.ballPosition.y === 3);
      if (isHomeGK) {
        document.getElementById('btn-shoot').classList.add('hidden');
      } else {
        document.getElementById('btn-shoot').classList.remove('hidden');
        updateBtnState('btn-shoot', 'SHOOT');
      }
      
      updateBtnState('btn-dribble', 'DRIBBLE');
      updateBtnState('btn-pass', 'PASS');

      if (document.getElementById('btn-tackle')) document.getElementById('btn-tackle').classList.add('hidden');
    }

    const heatPercent = (this.duel.attacker.heat / CONSTANTS.MAX_HEAT) * 100;
    const mainHeatFill = document.querySelector('#heat-section .heat-fill');
    if (mainHeatFill) {
      mainHeatFill.style.width = `${heatPercent}%`;
    }
  }

  renderMoves() {
    const container = document.getElementById('move-carousel');
    container.innerHTML = '';
    
    let activeMoves = [];
    if (this.duel.isAttackerAI) {
      activeMoves = PLAYBOOK.defending;
    } else {
      const intentMap = { 'TACKLE': 'RED', 'PRESS': 'ORANGE', 'BLOCK': 'BLUE' };
      const color = intentMap[this.duel.aiIntent] || 'RED';
      activeMoves = PLAYBOOK.attacking[color];
    }

    activeMoves.forEach(move => {
      const check = this.duel.checkMovePrereqs(move, this.duel.attacker);
      const card = document.createElement('div');
      card.className = `move-card ${!check.valid ? 'disabled' : ''}`;
      
      let prereqHtml = '';
      if (!check.valid) {
        prereqHtml = `<div class="move-prereq">${check.reason}</div>`;
      }

      card.innerHTML = `
        <div class="move-header">
           <div class="move-name">${move.name}</div>
           <div class="move-cost">🔥 ${move.cost} TU</div>
        </div>
        ${prereqHtml}
        <div class="move-desc">${move.desc}</div>
      `;
      if (check.valid) card.onclick = () => this.applyMove(move);
      container.appendChild(card);
    });
  }

  applyMove(move) {
    const res = this.duel.applyMove(move, this.duel.attacker);
    if (!res.success) {
      // Could show a toast here if needed
      return;
    }
    
    // Gain Heat on move use (Standard move reward)
    this.duel.attacker.heat = Math.min(CONSTANTS.MAX_HEAT, this.duel.attacker.heat + CONSTANTS.HEAT_GAIN_MOVE);
    
    this.updateUI();
    this.renderPlayerCard('attacker-card', this.duel.attacker);
    this.renderPlayerCard('defender-card', this.duel.defender);
    
    if (this.duel.touchUnits <= 0) {
      document.getElementById('move-carousel').classList.add('hidden');
    } else {
      this.renderMoves(); // Refresh moves to show new prereq status
    }
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  updateScoreboard() {
    document.querySelector('.score-player').innerText = this.match.score.player;
    document.querySelector('.score-ai').innerText = this.match.score.ai;
    document.querySelector('.timer').innerText = this.match.formattedTime;
  }

  showMatchEventModal() {
    if (document.getElementById('event-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'event-modal';
    modal.className = 'glass-panel event-modal';
    
    let title = '';
    let body = '';
    let btnText = '';
    let action = null;

    if (this.match.phase === 'START') {
      title = 'MATCH START';
      body = 'Are you ready for Kickoff?';
      btnText = 'Kickoff!';
      action = () => {
        this.match.phase = 'BREAK';
        modal.remove();
        this.setupDuelHUD();
        this.updateUI();
      };
    } else if (this.match.phase === 'HALF_TIME') {
      title = 'HALF TIME';
      body = `Score: Player ${this.match.score.player} - ${this.match.score.ai} AI`;
      btnText = 'Start 2nd Half';
      action = () => {
        this.match.startSecondHalf();
        this.match.phase = 'BREAK';
        modal.remove();
        this.setupDuelHUD();
        this.updateUI();
      };
    } else if (this.match.phase === 'MATCH_OVER') {
      title = 'FULL TIME';
      const winner = this.match.score.player > this.match.score.ai ? 'PLAYER WINS!' : 
                     this.match.score.ai > this.match.score.player ? 'AI WINS!' : 'DRAW!';
      body = `${winner}<br>Final Score: ${this.match.score.player} - ${this.match.score.ai}`;
      btnText = 'Reset Match';
      action = () => {
        location.reload();
      };
    }

    modal.innerHTML = `
      <h2>${title}</h2>
      <p>${body}</p>
    `;
    
    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.innerText = btnText;
    btn.onclick = action;
    modal.appendChild(btn);

    document.body.appendChild(modal);
  }

  showResolution(type, result) {
    const el = document.getElementById('resolution-msg');
    el.className = `resolution-msg ${result.success ? 'success' : 'fail'}`;
    el.style.display = 'block';
    
    let currentVal = Math.floor(result.aVal);
    const finalVal = Math.floor(result.totalAVal || result.aVal);
    const dVal = Math.floor(result.dVal);

    // Initial msg
    const getMsg = (val) => {
      if (result.success) {
        if (type === 'SHOOT') return 'GOAL!';
        if (type === 'TACKLE') return 'RECOVERED!';
        return 'SUCCESS!';
      }
      if (result.reason === 'INTERCEPTED') return 'INTERCEPTED!';
      if (result.reason === 'FELL_SHORT') return 'FELL SHORT!';
      return 'FAILED!';
    };

    el.style.pointerEvents = 'none';

    // If there is volatility, animate it
    if (finalVal > currentVal) {
      let roll = currentVal;
      const interval = setInterval(() => {
        roll++;
        el.innerText = `ROLLING... (${roll} vs ${dVal})`;
        if (roll >= finalVal) {
          clearInterval(interval);
          el.innerText = `${getMsg(finalVal)} (${finalVal} vs ${dVal})`;
          setTimeout(() => el.style.display = 'none', 2000);
        }
      }, 80);
    } else {
      el.innerText = `${getMsg(currentVal)} (${currentVal} vs ${dVal})`;
      setTimeout(() => el.style.display = 'none', 2000);
    }
  }
}

new GameUI();

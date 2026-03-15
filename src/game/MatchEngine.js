import { CONSTANTS } from './Constants.js';
import { MOCK_ROSTER, MOCK_AI_TEAM } from './data.js';

export class MatchEngine {
  constructor() {
    this.timer = 0; // in seconds
    this.score = { player: 0, ai: 0 };
    this.phase = 'START';
    this.possession = null;
    this.half = 1;
    this.ballPosition = { x: 0, y: 1 };
    this.isMatchOver = false;
    this.holdStreak = 0;
    this.firstHalfKickoff = null;
    
    // Deep clone rosters to maintain state per match
    this.teams = {
      player: JSON.parse(JSON.stringify(MOCK_ROSTER)),
      ai: JSON.parse(JSON.stringify(MOCK_AI_TEAM))
    };
  }

  initMatch() {
    this.possession = Math.random() > 0.5 ? 'PLAYER' : 'AI';
    this.firstHalfKickoff = this.possession;
    this.setupKickoff();
  }

  setupKickoff() {
    // Reset positions to default (V1.0 simplification)
    this.teams.player = JSON.parse(JSON.stringify(MOCK_ROSTER));
    this.teams.ai = JSON.parse(JSON.stringify(MOCK_AI_TEAM));

    const lane = Math.random() > 0.5 ? 0 : 1;
    const isPlayerPossession = this.possession === 'PLAYER';
    
    // Set ball position (Kickoff starts in Midfield 1 for Player, Midfield 2 for AI)
    if (isPlayerPossession) {
      this.ballPosition = { x: lane, y: CONSTANTS.ZONES.FIELD_MIN };
    } else {
      this.ballPosition = { x: lane, y: CONSTANTS.ZONES.FIELD_MAX };
    }

    // Lane Logic: Find the kick-off player and move them to the chosen lane
    const attackerTeam = isPlayerPossession ? this.teams.player : this.teams.ai;
    const kicker = attackerTeam.find(p => p.pos.y === this.ballPosition.y);
    if (kicker) kicker.pos.x = lane;

    // The defender in that same zone should always start Inside (x=0)
    const defenderTeam = isPlayerPossession ? this.teams.ai : this.teams.player;
    const marker = defenderTeam.find(p => p.pos.y === this.ballPosition.y);
    if (marker) marker.pos.x = 0;

    // Only set phase to BREAK if we aren't at half-time or match over
    if (this.phase !== 'HALF_TIME' && this.phase !== 'MATCH_OVER' && this.phase !== 'START') {
      this.phase = 'BREAK';
    }
    this.holdStreak = 0;
  }

  incrementClock(seconds) {
    if (this.isMatchOver) return;
    this.timer += seconds;
    this.checkMatchTermination();
  }

  checkMatchTermination() {
    // Half-time check (12:00 = 720 seconds)
    if (this.half === 1 && this.timer >= 720) {
      this.timer = 720;
      this.phase = 'HALF_TIME';
    } 
    // Full-time check (24:00 = 1440 seconds)
    else if (this.half === 2 && this.timer >= 1440) {
      this.timer = 1440;
      this.isMatchOver = true;
      this.phase = 'MATCH_OVER';
    }
  }

  startSecondHalf() {
    if (this.half !== 1) return;
    this.half = 2;
    this.timer = 720;
    // Swap initial possession for second half
    this.possession = this.firstHalfKickoff === 'PLAYER' ? 'AI' : 'PLAYER';
    this.setupKickoff();
  }

  get formattedTime() {
    const m = Math.floor(this.timer / 60).toString().padStart(2, '0');
    const s = (this.timer % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  recordGoal(team) {
    this.score[team]++;
    this.incrementClock(60); // 1 minute celebration/reset
    
    // Antigravity Design Update: Post-goal Heat Reset to 3 (Physical toll)
    const teamKey = team === 'player' ? 'player' : 'ai';
    this.teams[teamKey].forEach(p => {
      p.heat = 3;
      p.inactive = false;
    });

    this.possession = team === 'player' ? 'AI' : 'PLAYER';
    this.setupKickoff();
  }

  handleSuccessfulDribble(isPlayer, moverId) {
    const dir = isPlayer ? 1 : -1;
    const oldY = this.ballPosition.y;
    const oldX = this.ballPosition.x;
    const newY = Math.max(0, Math.min(3, oldY + dir));
    const newX = (newY === 0 || newY === 3) ? 0 : oldX;

    const teamKey = isPlayer ? 'player' : 'ai';
    // Explicitly use the mover's ID if provided, otherwise fallback to position search
    const mover = moverId ? 
      this.teams[teamKey].find(p => p.id === moverId) :
      this.teams[teamKey].find(p => p.pos.y === oldY && p.pos.x === oldX);
    
    if (mover) {
      // Find teammate at target (to swap positions and keep formation)
      const teammate = this.teams[teamKey].find(p => p.pos.y === newY && p.pos.x === newX && p !== mover);
      if (teammate) {
        teammate.pos.y = mover.pos.y;
        teammate.pos.x = mover.pos.x;
      }
      mover.pos.y = newY;
      mover.pos.x = newX;
    }

    this.ballPosition.y = newY;
    this.ballPosition.x = newX;
    
    this.clearInactiveStates();
  }

  clearInactiveStates() {
    this.teams.player.forEach(p => p.inactive = false);
    this.teams.ai.forEach(p => p.inactive = false);
  }

  handleGKShotClock() {
    this.holdStreak++;
    if (this.holdStreak >= 3) {
      const opponentTeam = this.possession === 'PLAYER' ? this.teams.ai : this.teams.player;
      // Get best striker
      const striker = [...opponentTeam].sort((a,b) => (b.stats.SHO || 0) - (a.stats.SHO || 0))[0];
      // Force duel in GK zone
      striker.pos = { ...this.ballPosition };
      this.holdStreak = 0;
      return true; // Clock triggered
    }
    return false;
  }

  resetShotClock() {
    this.holdStreak = 0;
  }

  swapPossession() {
    const losingTeamKey = this.possession === 'PLAYER' ? 'player' : 'ai';
    this.possession = this.possession === 'PLAYER' ? 'AI' : 'PLAYER';
    this.resetShotClock();

    // New possession team logic
    const gainingTeamKey = this.possession === 'player' ? 'player' : 'ai'; // Actually this.possession is 'PLAYER' or 'AI'
    const newAttackerTeamKey = this.possession === 'PLAYER' ? 'player' : 'ai';
    const newDefenderTeamKey = this.possession === 'PLAYER' ? 'ai' : 'player';

    // Randomize the landing lane for the new attacker
    const landingLane = Math.random() > 0.5 ? 0 : 1;
    this.ballPosition.x = landingLane;

    // Goal Zone Logic: turnover in Goal Zone forces retreat
    if (this.ballPosition.y === 0 || this.ballPosition.y === 3) {
      const retreatRow = losingTeamKey === 'player' ? 1 : 2;
      this.teams[losingTeamKey].forEach(p => {
        if (!p.isGK && (p.pos.y === 0 || p.pos.y === 3)) {
          p.pos.y = retreatRow;
          p.pos.x = 0; // Default to inside lane on retreat
        }
      });
    }

    // Position new attacker and defender if possible
    const newAttacker = this.teams[newAttackerTeamKey].find(p => p.pos.y === this.ballPosition.y);
    if (newAttacker) newAttacker.pos.x = landingLane;

    const newDefender = this.teams[newDefenderTeamKey].find(p => p.pos.y === this.ballPosition.y);
    if (newDefender) newDefender.pos.x = 0; // Defenders start Inside
  }

  transitionToFlow(callback) {
    this.phase = 'FLOW';
    setTimeout(() => {
      this.phase = 'BREAK';
      if (callback) callback();
    }, 1000);
  }
}

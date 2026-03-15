import { CONSTANTS } from './Constants.js';

export class DuelManager {
  constructor() {
    this.attacker = null;
    this.defender = null;
    this.touchUnits = CONSTANTS.TOUCH_UNITS_DEFAULT;
    this.aiIntent = null;
    this.activeModifiers = [];
    this.consecutiveHolds = 0;
  }

  setupDuel(attacker, defender, isAttackerAI) {
    this.attacker = attacker;
    this.defender = defender;
    this.isAttackerAI = isAttackerAI;
    this.touchUnits = attacker.stats.SPE || CONSTANTS.TOUCH_UNITS_DEFAULT;
    this.activeModifiers = [];
    this.rollAIIntent(isAttackerAI);
  }

  rollAIIntent(isAttackerAI) {
    if (isAttackerAI && this.attacker.isGK) {
      this.aiIntent = 'PASS';
      return;
    }

    let weights, intents;
    
    if (isAttackerAI) {
      // Offensive Intent (from SOT)
      weights = [30, 20, 10, 40]; // Dribble, Pass, Shoot, Hold
      intents = ['DRIBBLE', 'PASS', 'SHOOT', 'HOLD'];
    } else {
      // Defensive Intent (from SOT)
      weights = [40, 40, 20]; // Tackle, Press, Block
      intents = ['TACKLE', 'PRESS', 'BLOCK'];
    }

    const r = Math.random() * 100;
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (r <= sum) {
        this.aiIntent = intents[i];
        break;
      }
    }
  }

  applyModifier(mod) {
    this.activeModifiers.push(mod);
  }

  getEffectiveStat(actor, statType) {
    if (!actor) return 0;
    let base = actor.stats[statType] || 10;
    
    // Antigravity Design Update: Softened Inactive Penalty (-50% instead of 0)
    if (actor.inactive) {
      base = Math.floor(base * 0.5);
    }
    
    // Low Heat Penalty
    if (actor.heat <= 0) {
      base = Math.floor(base * 0.8);
    }

    const mods = this.activeModifiers.filter(m => m.targetId === actor.id && (m.stat === statType || m.stat === statType + '_DEBUFF'));
    const bonus = mods.reduce((sum, m) => sum + m.value, 0);
    
    return Math.min(CONSTANTS.MAX_STAT_BUFFED, Math.max(1, base + bonus));
  }

  getDistanceToGoal(currentY, isAttackerPlayer) {
    const goalY = isAttackerPlayer ? CONSTANTS.ZONES.GK_AI : CONSTANTS.ZONES.GK_PLAYER;
    return Math.abs(goalY - currentY);
  }

  resolveExitAction(actionType, currentY) {
    const attackerStat = this.getMatchupStat(actionType);
    const aVal = this.getEffectiveStat(this.attacker, attackerStat);
    
    // Logic Fix: PASS in the opponent's Goal zone ignores GK Reaction
    const isAttackingGoal = (this.isAttackerAI && currentY === 0) || (!this.isAttackerAI && currentY === 3);
    const dVal = (actionType === 'PASS' && isAttackingGoal) ? 0 : (this.defender ? this.getEffectiveStat(this.defender, 'REA') : 0);

    // 1. Interaction Phase
    const volatilityBonus = Math.floor(Math.random() * 3); // 0, 1, or 2
    const totalAVal = aVal + volatilityBonus;
    let remainingVal = totalAVal - dVal;
    
    const result = {
      success: false,
      reason: '',
      aVal,
      volatilityBonus,
      totalAVal,
      dVal,
      remainingAfterInteraction: remainingVal,
      phases: []
    };

    // 2. Turnover/Failure Logic (Early - Interception)
    if (remainingVal <= 0) {
      result.success = false;
      result.reason = 'INTERCEPTED';
      if (actionType === 'SHOOT') {
        result.failureRow = this.isAttackerAI ? 3 : 0;
      } else {
        result.failureRow = currentY;
      }
      this.updateHeat(false);
      return result;
    }

    // 3. Distance Penalty Logic
    if (actionType === 'SHOOT' || actionType === 'PASS') {
      const isPlayer = !this.isAttackerAI;
      const targetY = (actionType === 'SHOOT') ? (isPlayer ? 3 : 0) : (isPlayer ? 2 : 1);
      
      const penalty = Math.abs(currentY - targetY);
      remainingVal -= penalty;
      result.distancePenalty = penalty;
      result.remainingAfterDistance = remainingVal;

      if (remainingVal <= 0) {
        result.success = false;
        result.reason = 'FELL_SHORT';
        const dir = isPlayer ? 1 : -1;
        result.failureRow = Math.max(0, Math.min(3, currentY + dir)); 
        this.updateHeat(false);
        return result;
      }
    }

    // 4. Success Case
    result.success = true;
    this.updateHeat(true);
    return result;
  }

  resolveTackle() {
    // Tackler is technically the "Defender" in the DuelManager object, 
    // but they are initiating this specific action.
    const aVal = this.defender ? this.getEffectiveStat(this.defender, 'TAC') : 0; 
    const dVal = this.attacker ? this.getEffectiveStat(this.attacker, 'CON') : 0; 
    
    const volatilityBonus = Math.floor(Math.random() * 3);
    const totalAVal = aVal + volatilityBonus;

    const result = {
      success: totalAVal > dVal,
      aVal,
      volatilityBonus,
      totalAVal,
      dVal,
      statUsed: 'TAC'
    };
    
    // Attacker loses heat on being tackled, Defender gains heat on success
    if (result.success) {
      this.attacker.heat = Math.max(CONSTANTS.MIN_HEAT, this.attacker.heat - CONSTANTS.HEAT_LOSS_DUEL_FAIL);
      this.defender.heat = Math.min(CONSTANTS.MAX_HEAT, this.defender.heat + CONSTANTS.HEAT_GAIN_EXIT_SUCCESS);
    }
    
    return result;
  }

  updateHeat(success) {
    if (success) {
      this.attacker.heat = Math.min(CONSTANTS.MAX_HEAT, this.attacker.heat + CONSTANTS.HEAT_GAIN_EXIT_SUCCESS);
    } else {
      this.attacker.heat = Math.max(CONSTANTS.MIN_HEAT, this.attacker.heat - CONSTANTS.HEAT_LOSS_EXIT_FAIL);
      this.defender.heat = Math.min(CONSTANTS.MAX_HEAT, this.defender.heat + CONSTANTS.HEAT_GAIN_EXIT_SUCCESS);
    }
  }

  getMatchupStat(action) {
    const map = {
      'DRIBBLE': 'DRI',
      'PASS': 'PAS',
      'SHOOT': 'SHO',
      'TACKLE': 'TAC'
    };
    return map[action] || 'DRI';
  }

  handleHold() {
    this.consecutiveHolds++;
    // Logic for disabling Hold after 2 turns would be handled in the UI/Turn loop
    return { canHoldAgain: this.consecutiveHolds < CONSTANTS.HOLD_LIMIT_CONSECUTIVE };
  }
}

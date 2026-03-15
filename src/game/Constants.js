export const CONSTANTS = {
  MATCH_DURATION_MINS: 24, // 24 minutes total
  TURN_DURATION_SECS: 60, // 1 minute turns
  STARTING_HEAT: 3,
  MAX_HEAT: 10,
  MIN_HEAT: 0,
  DEFAULT_VOLATILITY: 0.10, // 10%
  TOUCH_UNITS_DEFAULT: 3,
  HEAT_GAIN_MOVE: 1,
  HEAT_GAIN_EXIT_SUCCESS: 2,
  HEAT_GAIN_GOAL: 5,
  HEAT_LOSS_EXIT_FAIL: 1,
  HEAT_LOSS_DUEL_FAIL: 2,
  STAKE_SCALING: 5, // Hold pressure (legacy)
  SHOOT_DISTANCE_PENALTY: 2, // per zone
  PASS_DISTANCE_PENALTY: 1, // per zone
  MAX_STAT_BASE: 20,
  MAX_STAT_BUFFED: 30,
  HOLD_LIMIT_CONSECUTIVE: 2,
  KICKOFF_POSITIONS: {
    PLAYER: { x: 0, y: 1 }, // Row 1 (x will be randomized in engine)
    AI: { x: 1, y: 2 }     // Row 2
  },
  ZONES: {
    GK_PLAYER: 0,
    GK_AI: 3,
    FIELD_MIN: 1,
    FIELD_MAX: 2
  }
};

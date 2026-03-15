export const MOCK_ROSTER = [
  {
    id: 'p1', name: 'LB', number: 2, isGK: false, pos: { x: 0, y: 1 },
    stats: { DRI: 14, PAS: 10, SHO: 12, TAC: 8, REA: 11, CON: 13, SPE: 3 },
    heat: 3, lane: 0
  },
  {
    id: 'p2', name: 'RB', number: 3, isGK: false, pos: { x: 1, y: 1 },
    stats: { DRI: 10, PAS: 15, SHO: 8, TAC: 12, REA: 13, CON: 10, SPE: 3 },
    heat: 3, lane: 0
  },
  {
    id: 'p3', name: 'LF', number: 7, isGK: false, pos: { x: 0, y: 2 },
    stats: { DRI: 11, PAS: 11, SHO: 10, TAC: 10, REA: 10, CON: 10, SPE: 3 },
    heat: 3, lane: 0
  },
  {
    id: 'p4', name: 'RF', number: 10, isGK: false, pos: { x: 1, y: 2 },
    stats: { DRI: 12, PAS: 9, SHO: 10, TAC: 9, REA: 11, CON: 9, SPE: 4 },
    heat: 3, lane: 0
  },
  {
    id: 'gk_player', name: 'The Wall', number: 1, isGK: true, pos: { x: 0, y: 0 },
    stats: { DRI: 5, PAS: 8, SHO: 5, TAC: 15, REA: 13, CON: 15, SPE: 2 },
    heat: 3, lane: 0
  }
];

export const MOCK_AI_TEAM = [
  {
    id: 'ai1', name: 'LF', number: 9, isGK: false, pos: { x: 0, y: 2 },
    stats: { DRI: 12, PAS: 12, SHO: 10, TAC: 10, REA: 10, CON: 10, SPE: 3 },
    heat: 3, lane: 0
  },
  {
    id: 'ai2', name: 'RF', number: 11, isGK: false, pos: { x: 1, y: 2 },
    stats: { DRI: 9, PAS: 10, SHO: 14, TAC: 8, REA: 9, CON: 11, SPE: 3 },
    heat: 3, lane: 0
  },
  {
    id: 'ai3', name: 'LB', number: 4, isGK: false, pos: { x: 0, y: 1 },
    stats: { DRI: 8, PAS: 9, SHO: 8, TAC: 15, REA: 11, CON: 14, SPE: 2 },
    heat: 3, lane: 0
  },
  {
    id: 'ai4', name: 'RB', number: 5, isGK: false, pos: { x: 1, y: 1 },
    stats: { DRI: 13, PAS: 11, SHO: 9, TAC: 7, REA: 12, CON: 8, SPE: 4 },
    heat: 3, lane: 0
  },
  {
    id: 'gk_ai', name: 'Sentinel', number: 1, isGK: true, pos: { x: 0, y: 3 },
    stats: { DRI: 5, PAS: 7, SHO: 5, TAC: 14, REA: 12, CON: 16, SPE: 2 },
    heat: 3, lane: 0
  }
];

export const PLAYBOOK = {
  attacking: {
    RED: [
      { id: 'm1', name: 'Low Stance', cost: 1, unlocks: ['DRIBBLE'], effect: { stat: 'CON', value: 2, duration: 'turn' }, desc: 'Unlocks DRIBBLE. +2 CON.' },
      { id: 'm2', name: 'Shield', cost: 1, prereqs: { minHeat: 4 }, unlocks: ['DRIBBLE'], effect: { stat: 'CON', value: 3, duration: 'turn' }, desc: 'Unlocks DRIBBLE. +3 CON vs Tackle.' },
      { id: 'r3', name: 'Space Finder', cost: 1, prereqs: { lane: 1 }, unlocks: ['DRIBBLE', 'PASS'], effect: { stat: 'DRI', value: 3, duration: 'turn' }, desc: 'Outside lane only. Unlocks DRIBBLE/PASS.' },
      { id: 'r4', name: 'Swift Turn', cost: 1, unlocks: ['DRIBBLE'], effect: { stat: 'DRI', value: 2, duration: 'next' }, desc: 'Unlocks DRIBBLE. +2 next DRI.' },
      { id: 'r5', name: 'Pressure Soak', cost: 2, prereqs: { minHeat: 6 }, unlocks: ['DRIBBLE'], effect: { stat: 'CON', value: 5, duration: 'turn' }, desc: 'Unlocks DRIBBLE. Max protection.' }
    ],
    ORANGE: [
      { id: 'm3', name: 'One-Two Setup', cost: 1, unlocks: ['PASS'], effect: { stat: 'PAS', value: 4, duration: 'exit' }, desc: 'Unlocks PASS. +4 PAS.' },
      { id: 'm4', name: 'Scoop Prep', cost: 1, prereqs: { minHeat: 4 }, unlocks: ['PASS'], effect: { ballState: 'AIR' }, desc: 'Unlocks PASS. Lifts ball to AIR.' },
      { id: 'o3', name: 'Field Vision', cost: 1, prereqs: { minHeat: 5 }, unlocks: ['PASS'], effect: { stat: 'PAS', value: 2, duration: 'turn' }, desc: 'Unlocks PASS. +2 PAS.' },
      { id: 'o4', name: 'Link Up', cost: 1, unlocks: ['PASS', 'DRIBBLE'], effect: { stat: 'PAS', value: 3, duration: 'next' }, desc: 'Unlocks PASS/DRIBBLE. +3 next action.' },
      { id: 'o5', name: 'Deep Breath', cost: 2, prereqs: { minHeat: 6 }, unlocks: ['PASS'], effect: { stat: 'PAS', value: 6, duration: 'exit' }, desc: 'High Focus. Unlocks PASS.' }
    ],
    BLUE: [
      { id: 'm5', name: 'Fake Shot', cost: 1, unlocks: ['SHOOT', 'DRIBBLE'], effect: { stat: 'DRI', value: 5, duration: 'next' }, desc: 'Unlocks SHOOT/DRIBBLE. +5 DRI.' },
      { id: 'm6', name: 'Steady Aim', cost: 1, prereqs: { lane: 0 }, unlocks: ['SHOOT'], effect: { stat: 'SHO', value: 3, duration: 'exit' }, desc: 'Inside lane only. Unlocks SHOOT. +3 SHO.' },
      { id: 'b3', name: 'Precision Focus', cost: 1, prereqs: { minHeat: 5 }, unlocks: ['SHOOT'], effect: { stat: 'SHO', value: 2, duration: 'turn' }, desc: 'Unlocks SHOOT. +2 SHO.' },
      { id: 'b4', name: 'Goal Scan', cost: 1, unlocks: ['SHOOT'], effect: { stat: 'SHO', value: 3, duration: 'next' }, desc: 'Unlocks SHOOT. +3 next action.' },
      { id: 'b5', name: 'Acrobatic Setup', cost: 2, prereqs: { minHeat: 6, ballState: 'AIR' }, unlocks: ['SHOOT'], effect: { stat: 'SHO', value: 5, duration: 'exit' }, desc: 'Requires AIR ball. Unlocks SHOOT. +5 power.' }
    ]
  },
  defending: [
    { id: 'd1', name: 'Tighten', cost: 1, unlocks: ['TACKLE'], effect: { stat: 'CON_DEBUFF', value: -3, duration: 'turn' }, desc: 'Unlocks TACKLE. -3 to Attacker.' },
    { id: 'd2', name: 'Stand Ground', cost: 1, unlocks: ['TACKLE'], effect: { stat: 'REA', value: 3, duration: 'turn' }, desc: 'Unlocks TACKLE. +3 REA.' },
    { id: 'd3', name: 'Screening', cost: 1, prereqs: { minHeat: 4 }, unlocks: ['TACKLE'], effect: { stat: 'REA', value: 2, duration: 'turn' }, desc: 'Unlocks TACKLE. Defensive focus.' },
    { id: 'd4', name: 'Intimidate', cost: 1, unlocks: ['TACKLE'], effect: { stat: 'DRI_DEBUFF', value: -3, duration: 'turn' }, desc: 'Unlocks TACKLE. -3 att stat.' },
    { id: 'd5', name: 'Hard Guard', cost: 2, prereqs: { minHeat: 6 }, unlocks: ['TACKLE'], effect: { stat: 'TAC', value: 5, duration: 'turn' }, desc: 'Max pressure. Unlocks TACKLE.' }
  ]
};

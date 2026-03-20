/**
 * formation.test.js — Unit tests for the cascade rotation engine.
 * Covers all §7 scenarios from the source of truth.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { cascade, mirrorCascade, dribbleTarget, getRole } from '../core/formation.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function kickoffState() {
  return {
    humans: [
      { id: 'huGK', zone: '1B' },
      { id: 'huCB', zone: '2B' },
      { id: 'huRB', zone: '3C' },
      { id: 'huLW', zone: '4A' },
      { id: 'huCF', zone: '5B' },
    ],
    ais: [
      { id: 'aiGK', zone: '6B' },
      { id: 'aiCB', zone: '5B' },
      { id: 'aiRB', zone: '4A' },
      { id: 'aiLW', zone: '3C' },
      { id: 'aiCF', zone: '2B' },
    ],
  };
}

function zoneOf(players, id) {
  return players.find(p => p.id === id)?.zone;
}

// ─── Role mapping ─────────────────────────────────────────────────────────────

describe('getRole', () => {
  it('maps every zone to the correct role', () => {
    expect(getRole('1B')).toBe('GK');
    expect(getRole('2B')).toBe('CB');
    expect(getRole('3A')).toBe('LB');
    expect(getRole('3C')).toBe('RB');
    expect(getRole('4A')).toBe('LW');
    expect(getRole('4C')).toBe('RW');
    expect(getRole('5B')).toBe('CF');
    expect(getRole('6B')).toBe('GK');
  });
});

// ─── Dribble target ────────────────────────────────────────────────────────────

describe('dribbleTarget', () => {
  it('2B → 3A when 3A is free', () => {
    expect(dribbleTarget('2B', ['3C'])).toBe('3A');
  });
  it('2B → 3C when 3A is occupied', () => {
    expect(dribbleTarget('2B', ['3A', '3C'])).toBe('3C');
  });
  it('3A → 4A, 3C → 4C (column preserved)', () => {
    expect(dribbleTarget('3A', [])).toBe('4A');
    expect(dribbleTarget('3C', [])).toBe('4C');
  });
  it('4A and 4C both → 5B (converge to center)', () => {
    expect(dribbleTarget('4A', [])).toBe('5B');
    expect(dribbleTarget('4C', [])).toBe('5B');
  });
  it('5B → 6B (Goal Duel)', () => {
    expect(dribbleTarget('5B', [])).toBe('6B');
  });
});

// ─── §7.1 — huCB (2B) dribbles successfully ───────────────────────────────────

describe('cascade: §7.1 huCB from 2B', () => {
  let result;
  beforeEach(() => { result = cascade(kickoffState(), '2B'); });

  it('huCB advances to 3A', () => expect(zoneOf(result.humans, 'huCB')).toBe('3A'));
  it('huRB drops to 2B',    () => expect(zoneOf(result.humans, 'huRB')).toBe('2B'));
  it('huGK stays at 1B',    () => expect(zoneOf(result.humans, 'huGK')).toBe('1B'));

  it('post-state has 1 human per row (2–5)', () => {
    const zones = result.humans.filter(p => p.id !== 'huGK').map(p => p.zone);
    const rows  = zones.map(z => z[0]);
    expect(new Set(rows).size).toBe(4); // 4 unique rows
  });

  it('post-state has 1 AI per row (2–5)', () => {
    const zones = result.ais.filter(p => p.id !== 'aiGK').map(p => p.zone);
    const rows  = zones.map(z => z[0]);
    expect(new Set(rows).size).toBe(4);
  });

  it('every occupied row has exactly 1 human and 1 AI', () => {
    const humanRows = result.humans.filter(p => p.id !== 'huGK').map(p => parseInt(p.zone[0]));
    const aiRows    = result.ais.filter(p => p.id !== 'aiGK').map(p => parseInt(p.zone[0]));
    humanRows.sort();
    aiRows.sort();
    expect(humanRows).toEqual(aiRows);
  });
});

// ─── §7.2 — huRB (3C) dribbles successfully ───────────────────────────────────

describe('cascade: §7.2 huRB from 3C', () => {
  let result;
  beforeEach(() => { result = cascade(kickoffState(), '3C'); });

  it('huRB advances to 4C',  () => expect(zoneOf(result.humans, 'huRB')).toBe('4C'));
  it('huLW drops to 3A',     () => expect(zoneOf(result.humans, 'huLW')).toBe('3A'));
  it('huCB stays at 2B',     () => expect(zoneOf(result.humans, 'huCB')).toBe('2B'));
  it('huCF stays at 5B',     () => expect(zoneOf(result.humans, 'huCF')).toBe('5B'));

  it('1v1 preserved at every row', () => {
    const humanRows = result.humans.filter(p => p.id !== 'huGK').map(p => parseInt(p.zone[0]));
    const aiRows    = result.ais.filter(p => p.id !== 'aiGK').map(p => parseInt(p.zone[0]));
    humanRows.sort();
    aiRows.sort();
    expect(humanRows).toEqual(aiRows);
  });
});

// ─── §7.3 — huLW (4A) dribbles successfully ───────────────────────────────────

describe('cascade: §7.3 huLW from 4A (same post-state as §7.1)', () => {
  let r71, r73;
  beforeEach(() => {
    r71 = cascade(kickoffState(), '2B');
    r73 = cascade(kickoffState(), '4A');
  });

  it('produces same human row distribution as §7.1', () => {
    const rows71 = r71.humans.map(p => parseInt(p.zone[0])).sort();
    const rows73 = r73.humans.map(p => parseInt(p.zone[0])).sort();
    expect(rows71).toEqual(rows73);
  });

  it('huLW ends at 5B', () => expect(zoneOf(r73.humans, 'huLW')).toBe('5B'));

  it('1v1 preserved at every row', () => {
    const humanRows = r73.humans.filter(p => p.id !== 'huGK').map(p => parseInt(p.zone[0]));
    const aiRows    = r73.ais.filter(p => p.id !== 'aiGK').map(p => parseInt(p.zone[0]));
    humanRows.sort();
    aiRows.sort();
    expect(humanRows).toEqual(aiRows);
  });
});

// ─── §7.4 — huCF (5B) dribbles → Goal Duel ────────────────────────────────────

describe('cascade: §7.4 huCF from 5B (Goal Duel)', () => {
  let result;
  beforeEach(() => { result = cascade(kickoffState(), '5B'); });

  it('huCF advances to 6B',  () => expect(zoneOf(result.humans, 'huCF')).toBe('6B'));
  it('huCB stays at 2B',     () => expect(zoneOf(result.humans, 'huCB')).toBe('2B'));
  it('huRB stays at 3C',     () => expect(zoneOf(result.humans, 'huRB')).toBe('3C'));
  it('huLW stays at 4A',     () => expect(zoneOf(result.humans, 'huLW')).toBe('4A'));
  it('row 5 has no human',   () => {
    const row5 = result.humans.filter(p => p.zone?.startsWith('5'));
    expect(row5).toHaveLength(0);
  });
});

// ─── AI Mirror cascade ─────────────────────────────────────────────────────────

describe('mirrorCascade: AI dribble mirrors human cascade', () => {
  it('AI CF (2B) dribbles toward row 1 — aiGK stays at 6B', () => {
    const result = mirrorCascade(kickoffState(), '2B');
    expect(zoneOf(result.ais, 'aiGK')).toBe('6B');
  });

  it('1v1 preserved after AI cascade', () => {
    const result = mirrorCascade(kickoffState(), '3C'); // aiLW dribbles
    const humanRows = result.humans.filter(p => p.id !== 'huGK').map(p => parseInt(p.zone[0]));
    const aiRows    = result.ais.filter(p => p.id !== 'aiGK').map(p => parseInt(p.zone[0]));
    humanRows.sort();
    aiRows.sort();
    expect(humanRows).toEqual(aiRows);
  });
});

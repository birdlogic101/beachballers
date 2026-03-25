/**
 * duel.test.js — Unit tests for duel resolution and momentum rolls.
 */
import { describe, it, expect } from 'vitest';
import { resolveAction, resolveBlockResolution, rollMomentum, applySignatureSkill, getEffectiveValue } from '../core/duel.js';

describe('resolveAction (tie-break: defender wins on equal)', () => {
  it('attacker strictly greater → attacker wins', () => {
    expect(resolveAction(12, 11)).toBe('attacker');
  });
  it('equal values → defender wins', () => {
    expect(resolveAction(10, 10)).toBe('defender');
  });
});

describe('resolveBlockResolution (Block >= Attacker wins)', () => {
  it('block strictly greater → steal', () => {
    expect(resolveBlockResolution(10, 15)).toBe('steal');
  });
  it('equal values → steal', () => {
    expect(resolveBlockResolution(10, 10)).toBe('steal');
  });
  it('block less → muffled', () => {
    expect(resolveBlockResolution(20, 15)).toBe('muffled');
  });
});

describe('rollMomentum', () => {
  it('always returns a value within [attr, attr + momentum]', () => {
    for (let i = 0; i < 200; i++) {
      const attr = 10, momentum = 5;
      const result = rollMomentum(attr, momentum);
      expect(result).toBeGreaterThanOrEqual(attr);
      expect(result).toBeLessThanOrEqual(attr + momentum);
    }
  });
});

describe('getEffectiveValue', () => {
  const player = {
    stats: { DRI: 10, COM: 8 },
    momentum: 3
  };

  it('adds roll(0, momentum) to the attribute for Gamble actions', () => {
    // Note: getEffectiveValue uses Attribute (10) + Roll(0, 3)
    const val = getEffectiveValue(player, 'DRI', {}, 'dribble', true);
    expect(val).toBeGreaterThanOrEqual(10);
    expect(val).toBeLessThanOrEqual(13);
  });

  it('adds TOTAL momentum to the attribute for Secure actions (Block)', () => {
    // Note: Block = Attribute (8) + Total Momentum (3) = 11
    const val = getEffectiveValue(player, 'COM', {}, 'block', true);
    expect(val).toBe(11);
  });
});

describe('applySignatureSkill', () => {
  const player = {
    sig: { action: 'shoot', effect: { flatBonus: 3 } },
  };
  it('Clinical adds +3 on shoot', () => {
    expect(applySignatureSkill(player, 'shoot', 12)).toBe(15);
  });
});

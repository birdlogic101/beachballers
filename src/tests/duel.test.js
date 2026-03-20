/**
 * duel.test.js — Unit tests for duel resolution and volatility.
 */
import { describe, it, expect } from 'vitest';
import { resolveAction, rollVolatility, applySignatureSkill } from '../core/duel.js';

describe('resolveAction (tie-break: defender wins on equal)', () => {
  it('attacker strictly greater → attacker wins', () => {
    expect(resolveAction(12, 11)).toBe('attacker');
  });
  it('equal values → defender wins', () => {
    expect(resolveAction(10, 10)).toBe('defender');
  });
  it('attacker less → defender wins', () => {
    expect(resolveAction(8, 11)).toBe('defender');
  });
});

describe('rollVolatility', () => {
  it('always returns a value within [base, base + range]', () => {
    for (let i = 0; i < 200; i++) {
      const base = 10, range = 2;
      const result = rollVolatility(base, range);
      expect(result).toBeGreaterThanOrEqual(base);
      expect(result).toBeLessThanOrEqual(base + range);
    }
  });
  it('range 0 always returns exact base', () => {
    for (let i = 0; i < 50; i++) {
      expect(rollVolatility(9, 0)).toBe(9);
    }
  });
});

describe('applySignatureSkill', () => {
  const clinical = {
    sig: { action: 'shoot', effect: { flatBonus: 3 } },
  };
  const noSig = { sig: null };

  it('Clinical adds +3 on shoot', () => {
    expect(applySignatureSkill(clinical, 'shoot', 12)).toBe(15);
  });
  it('Clinical does NOT apply on dribble', () => {
    expect(applySignatureSkill(clinical, 'dribble', 12)).toBe(12);
  });
  it('no sig skill → value unchanged', () => {
    expect(applySignatureSkill(noSig, 'shoot', 10)).toBe(10);
  });
});

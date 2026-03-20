/**
 * pass.test.js — Unit tests for Heat-driven pass targeting.
 */
import { describe, it, expect } from 'vitest';
import { getPassTarget } from '../core/pass.js';

describe('getPassTarget: GK exception', () => {
  it('GK at 1B always passes to 2B regardless of heat', () => {
    expect(getPassTarget(-3, '1B')).toBe('2B');
    expect(getPassTarget(0,  '1B')).toBe('2B');
    expect(getPassTarget(5,  '1B')).toBe('2B');
  });
});

describe('getPassTarget: Heat = 0 → lane switch (same row, opposite column)', () => {
  it('3A → 3C', () => expect(getPassTarget(0, '3A')).toBe('3C'));
  it('3C → 3A', () => expect(getPassTarget(0, '3C')).toBe('3A'));
  it('4A → 4C', () => expect(getPassTarget(0, '4A')).toBe('4C'));
  it('4C → 4A', () => expect(getPassTarget(0, '4C')).toBe('4A'));
  it('2B → 2B (no switch for B column)', () => expect(getPassTarget(0, '2B')).toBe('2B'));
  it('5B → 5B (no switch for B column)', () => expect(getPassTarget(0, '5B')).toBe('5B'));
});

describe('getPassTarget: Heat > 0 → forward pass', () => {
  it('from 3C with heat 1 → 4B',  () => expect(getPassTarget(1, '3C')).toBe('4B'));
  it('from 3C with heat 2 → 5B',  () => expect(getPassTarget(2, '3C')).toBe('5B'));
  it('from 4A with heat 5 → capped at 5B', () => expect(getPassTarget(5, '4A')).toBe('5B'));
  it('from 2B with heat 3 → 5B',  () => expect(getPassTarget(3, '2B')).toBe('5B'));
});

describe('getPassTarget: Heat < 0 → backward pass', () => {
  it('from 4A with heat -1 → 3B', ()  => expect(getPassTarget(-1, '4A')).toBe('3B'));
  it('from 4A with heat -2 → 2B', ()  => expect(getPassTarget(-2, '4A')).toBe('2B'));
  it('from 3C with heat -5 → capped at 2B', () => expect(getPassTarget(-5, '3C')).toBe('2B'));
});

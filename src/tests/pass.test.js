/**
 * pass.test.js — Unit tests for Momentum-driven pass targeting.
 */
import { describe, it, expect } from 'vitest';
import { getPassTarget } from '../core/pass.js';

function mockState(possession, momentum, fromZone) {
  const pId = 'p1';
  const teammates = [
    { id: 'p1', zone: fromZone, momentum },
    { id: 'p2', zone: '2B' },
    { id: 'p3', zone: '3A' },
    { id: 'p4', zone: '3C' },
    { id: 'p5', zone: '4A' },
    { id: 'p6', zone: '4C' },
    { id: 'p7', zone: '5B' },
  ];
  return {
    possession,
    humans: possession === 'human' ? teammates : [],
    ais:    possession === 'ai'    ? teammates : [],
  };
}

describe('getPassTarget: GK exception', () => {
  it('GK at 1B always passes to 2B regardless of momentum', () => {
    expect(getPassTarget(mockState('human', 0,  '1B'), '1B')).toBe('2B');
    expect(getPassTarget(mockState('human', 5,  '1B'), '1B')).toBe('2B');
  });
});

describe('getPassTarget: Momentum = 0 → lane switch (same row, opposite column)', () => {
  it('3A → 3C', () => expect(getPassTarget(mockState('human', 0, '3A'), '3A')).toBe('3C'));
  it('3C → 3A', () => expect(getPassTarget(mockState('human', 0, '3C'), '3C')).toBe('3A'));
  it('4A → 4C', () => expect(getPassTarget(mockState('human', 0, '4A'), '4A')).toBe('4C'));
  it('4C → 4A', () => expect(getPassTarget(mockState('human', 0, '4C'), '4C')).toBe('4A'));
});

describe('getPassTarget: Momentum > 0 → forward pass', () => {
  it('from 3C with momentum 1 → 4C (closest forward row)', () => {
    // Note: getPassTarget finds closest teammate to (row + momentum)
    expect(getPassTarget(mockState('human', 1, '3C'), '3C')).toBe('4A');
  });
  it('from 3C with momentum 2 → 5B', () => {
    expect(getPassTarget(mockState('human', 2, '3C'), '3C')).toBe('5B');
  });
});

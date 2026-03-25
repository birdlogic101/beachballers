/**
 * momentum.test.js — Unit tests for the momentum system.
 */

import { updateMomentum, canPress, canShoot, isDribbleLocked, isPassLocked, MOMENTUM_MIN, MOMENTUM_MAX } from '../core/momentum.js';

describe('updateMomentum', () => {
  it('success adds 1', ()  => expect(updateMomentum(0, 'success')).toBe(1));
  it('failure does not decrease momentum by default', () => expect(updateMomentum(3, 'failure')).toBe(3));
  it('clamps at MOMENTUM_MAX', () => expect(updateMomentum(7, 'success')).toBe(MOMENTUM_MAX));
  it('clamps at MOMENTUM_MIN', () => expect(updateMomentum(0, 'bonus', -1)).toBe(MOMENTUM_MIN));
  it('custom delta applied', () => expect(updateMomentum(3, 'success', 2)).toBe(5));
});

describe('canPress (requires momentum >= 1)', () => {
  it('momentum = 0 → false',                      () => expect(canPress(0)).toBe(false));
  it('momentum = 1 → true',                       () => expect(canPress(1)).toBe(true));
  it('momentum = 5 → true',                       () => expect(canPress(5)).toBe(true));
});

describe('canShoot (zone-based momentum threshold)', () => {
  it('CF zone (5B) requires 2 momentum', () => {
    expect(canShoot(1, '5B')).toBe(false);
    expect(canShoot(2, '5B')).toBe(true);
  });
  it('opponent GK zone (6B) requires 1 momentum', () => {
    expect(canShoot(0, '6B')).toBe(false);
    expect(canShoot(1, '6B')).toBe(true);
  });
});

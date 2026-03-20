/**
 * heat.test.js — Unit tests for the heat system.
 */
import { describe, it, expect } from 'vitest';
import { updateHeat, canPress, canShoot, isDribbleLocked, isPassLocked, HEAT_MIN, HEAT_MAX } from '../core/heat.js';

describe('updateHeat', () => {
  it('success adds 1', ()  => expect(updateHeat(0, 'success')).toBe(1));
  it('failure removes 1',  () => expect(updateHeat(0, 'failure')).toBe(-1));
  it('clamps at HEAT_MAX', () => expect(updateHeat(10, 'success')).toBe(HEAT_MAX));
  it('clamps at HEAT_MIN', () => expect(updateHeat(-5, 'failure')).toBe(HEAT_MIN));
  it('custom delta applied', () => expect(updateHeat(3, 'success', 2)).toBe(5));
});

describe('canPress (requires heat >= 1)', () => {
  it('heat = 0 → false (intentional design)', () => expect(canPress(0)).toBe(false));
  it('heat = -1 → false',                      () => expect(canPress(-1)).toBe(false));
  it('heat = 1 → true',                        () => expect(canPress(1)).toBe(true));
  it('heat = 5 → true',                        () => expect(canPress(5)).toBe(true));
});

describe('canShoot (zone-based heat threshold)', () => {
  it('CF zone (5B) requires 2 heat', () => {
    expect(canShoot(1,  '5B')).toBe(false);
    expect(canShoot(2,  '5B')).toBe(true);
  });
  it('CB zone (2B) requires 5 heat', () => {
    expect(canShoot(4,  '2B')).toBe(false);
    expect(canShoot(5,  '2B')).toBe(true);
  });
  it('GK zone (1B) requires 6 heat', () => {
    expect(canShoot(5,  '1B')).toBe(false);
    expect(canShoot(6,  '1B')).toBe(true);
  });
  it('opponent GK zone (6B) requires 1 heat', () => {
    expect(canShoot(0, '6B')).toBe(false);
    expect(canShoot(1, '6B')).toBe(true);
  });
});

describe('lock rules', () => {
  it('dribble locked in 6B', ()     => expect(isDribbleLocked('6B')).toBe(true));
  it('dribble unlocked elsewhere',  () => expect(isDribbleLocked('5B')).toBe(false));
  it('pass locked in 6B',    ()     => expect(isPassLocked('6B')).toBe(true));
  it('pass unlocked elsewhere',     () => expect(isPassLocked('3C')).toBe(false));
});

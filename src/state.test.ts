import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getEmptyState,
  getRemainingTime,
  formatRemainingTime,
  type TimerState,
} from './state.js';

describe('state', () => {
  describe('getEmptyState', () => {
    it('returns inactive state with empty values', () => {
      const state = getEmptyState();

      expect(state).toEqual({
        active: false,
        startTime: '',
        duration: 0,
        endTime: '',
        daemonPid: null,
      });
    });
  });

  describe('getRemainingTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns null for inactive state', () => {
      const state: TimerState = {
        active: false,
        startTime: '',
        duration: 0,
        endTime: '',
        daemonPid: null,
      };

      expect(getRemainingTime(state)).toBeNull();
    });

    it('returns null when endTime is empty', () => {
      const state: TimerState = {
        active: true,
        startTime: '2024-01-15T10:00:00Z',
        duration: 25,
        endTime: '',
        daemonPid: 1234,
      };

      expect(getRemainingTime(state)).toBeNull();
    });

    it('returns zero when timer has ended', () => {
      vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));

      const state: TimerState = {
        active: true,
        startTime: '2024-01-15T10:00:00Z',
        duration: 25,
        endTime: '2024-01-15T10:25:00Z',
        daemonPid: 1234,
      };

      expect(getRemainingTime(state)).toEqual({ minutes: 0, seconds: 0 });
    });

    it('calculates remaining time correctly', () => {
      vi.setSystemTime(new Date('2024-01-15T10:15:30Z'));

      const state: TimerState = {
        active: true,
        startTime: '2024-01-15T10:00:00Z',
        duration: 25,
        endTime: '2024-01-15T10:25:00Z',
        daemonPid: 1234,
      };

      const remaining = getRemainingTime(state);

      expect(remaining).toEqual({ minutes: 9, seconds: 30 });
    });

    it('handles exact minute boundaries', () => {
      vi.setSystemTime(new Date('2024-01-15T10:20:00Z'));

      const state: TimerState = {
        active: true,
        startTime: '2024-01-15T10:00:00Z',
        duration: 25,
        endTime: '2024-01-15T10:25:00Z',
        daemonPid: 1234,
      };

      const remaining = getRemainingTime(state);

      expect(remaining).toEqual({ minutes: 5, seconds: 0 });
    });
  });

  describe('formatRemainingTime', () => {
    it('formats time with leading zeros', () => {
      expect(formatRemainingTime({ minutes: 5, seconds: 3 })).toBe('05:03');
    });

    it('formats double digit values', () => {
      expect(formatRemainingTime({ minutes: 25, seconds: 45 })).toBe('25:45');
    });

    it('formats zero time', () => {
      expect(formatRemainingTime({ minutes: 0, seconds: 0 })).toBe('00:00');
    });
  });
});

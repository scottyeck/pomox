import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseDurationMs,
  msToDurationMinutes,
  runStartHooks,
  runEndHooks,
} from './daemon.js';

vi.mock('./config.js', () => ({
  loadConfig: vi.fn(),
}));

vi.mock('./state.js', () => ({
  clearState: vi.fn(),
  clearDaemonPid: vi.fn(),
}));

vi.mock('./integrations/index.js', () => ({
  enableFocusMode: vi.fn(),
  disableFocusMode: vi.fn(),
  notifyStart: vi.fn(),
  notifyEnd: vi.fn(),
  killApps: vi.fn(),
  openApps: vi.fn(),
  setFocusStatus: vi.fn(),
  clearStatus: vi.fn(),
  runStartCommands: vi.fn(),
  runEndCommands: vi.fn(),
}));

import { loadConfig } from './config.js';
import { clearState, clearDaemonPid } from './state.js';
import {
  enableFocusMode,
  disableFocusMode,
  notifyStart,
  notifyEnd,
  killApps,
  openApps,
  setFocusStatus,
  clearStatus,
  runStartCommands,
  runEndCommands,
} from './integrations/index.js';

describe('daemon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseDurationMs', () => {
    it('parses valid millisecond values', () => {
      expect(parseDurationMs('1500000')).toBe(1500000);
      expect(parseDurationMs('60000')).toBe(60000);
      expect(parseDurationMs('1')).toBe(1);
    });

    it('returns null for invalid values', () => {
      expect(parseDurationMs('invalid')).toBeNull();
      expect(parseDurationMs('')).toBeNull();
      expect(parseDurationMs('0')).toBeNull();
      expect(parseDurationMs('-1000')).toBeNull();
    });

    it('handles edge cases', () => {
      expect(parseDurationMs('1.5')).toBe(1); // parseInt truncates
      expect(parseDurationMs('1000abc')).toBe(1000); // parseInt stops at non-digit
    });
  });

  describe('msToDurationMinutes', () => {
    it('converts milliseconds to minutes, rounding up', () => {
      expect(msToDurationMinutes(60000)).toBe(1); // exactly 1 minute
      expect(msToDurationMinutes(60001)).toBe(2); // just over 1 minute
      expect(msToDurationMinutes(1500000)).toBe(25); // 25 minutes
      expect(msToDurationMinutes(1499999)).toBe(25); // just under 25 minutes
      expect(msToDurationMinutes(1)).toBe(1); // 1ms rounds up to 1 minute
    });

    it('handles Focusmate session durations', () => {
      // 24 minutes and 30 seconds remaining
      expect(msToDurationMinutes(24.5 * 60 * 1000)).toBe(25);
      // 50 minutes exactly
      expect(msToDurationMinutes(50 * 60 * 1000)).toBe(50);
    });
  });

  describe('runStartHooks', () => {
    it('runs all enabled integrations', async () => {
      vi.mocked(loadConfig).mockReturnValue({
        duration: 25,
        integrations: {
          focusMode: true,
          notifications: true,
          apps: {
            kill: ['Slack', 'Messages'],
            reopen: [],
          },
          slack: {
            workspaces: [{ name: 'test', token: 'token', statusEmoji: ':tomato:', statusText: 'Focusing' }],
          },
          focusmate: { apiKey: '' },
          commands: { onStart: ['echo "start"'], onEnd: [] },
        },
      });

      await runStartHooks(25);

      expect(notifyStart).toHaveBeenCalledWith(25);
      expect(enableFocusMode).toHaveBeenCalled();
      expect(killApps).toHaveBeenCalledWith(['Slack', 'Messages']);
      expect(setFocusStatus).toHaveBeenCalled();
      expect(runStartCommands).toHaveBeenCalledWith(['echo "start"']);
    });

    it('skips disabled integrations', async () => {
      vi.mocked(loadConfig).mockReturnValue({
        duration: 25,
        integrations: {
          focusMode: false,
          notifications: false,
          apps: {
            kill: [],
            reopen: [],
          },
          slack: {
            workspaces: [],
          },
          focusmate: { apiKey: '' },
          commands: { onStart: [], onEnd: [] },
        },
      });

      await runStartHooks(25);

      expect(notifyStart).not.toHaveBeenCalled();
      expect(enableFocusMode).not.toHaveBeenCalled();
      expect(killApps).not.toHaveBeenCalled();
      expect(setFocusStatus).not.toHaveBeenCalled();
      expect(runStartCommands).not.toHaveBeenCalled();
    });

    it('passes duration to notification', async () => {
      vi.mocked(loadConfig).mockReturnValue({
        duration: 25,
        integrations: {
          focusMode: false,
          notifications: true,
          apps: { kill: [], reopen: [] },
          slack: { workspaces: [] },
          focusmate: { apiKey: '' },
          commands: { onStart: [], onEnd: [] },
        },
      });

      await runStartHooks(50);

      expect(notifyStart).toHaveBeenCalledWith(50);
    });
  });

  describe('runEndHooks', () => {
    it('runs all enabled integrations', async () => {
      vi.mocked(loadConfig).mockReturnValue({
        duration: 25,
        integrations: {
          focusMode: true,
          notifications: true,
          apps: {
            kill: [],
            reopen: ['Slack', 'Messages'],
          },
          slack: {
            workspaces: [{ name: 'test', token: 'token', statusEmoji: ':tomato:', statusText: 'Focusing' }],
          },
          focusmate: { apiKey: '' },
          commands: { onStart: [], onEnd: ['say "done"'] },
        },
      });

      await runEndHooks();

      expect(disableFocusMode).toHaveBeenCalled();
      expect(openApps).toHaveBeenCalledWith(['Slack', 'Messages']);
      expect(clearStatus).toHaveBeenCalled();
      expect(runEndCommands).toHaveBeenCalledWith(['say "done"']);
      expect(notifyEnd).toHaveBeenCalled();
      expect(clearState).toHaveBeenCalled();
      expect(clearDaemonPid).toHaveBeenCalled();
    });

    it('skips disabled integrations', async () => {
      vi.mocked(loadConfig).mockReturnValue({
        duration: 25,
        integrations: {
          focusMode: false,
          notifications: false,
          apps: {
            kill: [],
            reopen: [],
          },
          slack: {
            workspaces: [],
          },
          focusmate: { apiKey: '' },
          commands: { onStart: [], onEnd: [] },
        },
      });

      await runEndHooks();

      expect(disableFocusMode).not.toHaveBeenCalled();
      expect(openApps).not.toHaveBeenCalled();
      expect(clearStatus).not.toHaveBeenCalled();
      expect(runEndCommands).not.toHaveBeenCalled();
      expect(notifyEnd).not.toHaveBeenCalled();
      // State should always be cleared
      expect(clearState).toHaveBeenCalled();
      expect(clearDaemonPid).toHaveBeenCalled();
    });

    it('always clears state even if integrations are disabled', async () => {
      vi.mocked(loadConfig).mockReturnValue({
        duration: 25,
        integrations: {
          focusMode: false,
          notifications: false,
          apps: { kill: [], reopen: [] },
          slack: { workspaces: [] },
          focusmate: { apiKey: '' },
          commands: { onStart: [], onEnd: [] },
        },
      });

      await runEndHooks();

      expect(clearState).toHaveBeenCalled();
      expect(clearDaemonPid).toHaveBeenCalled();
    });
  });
});

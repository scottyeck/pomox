import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setSlackStatus,
  setSlackPresence,
  setFocusStatus,
  clearStatus,
} from './slack.js';
import type { SlackWorkspace } from '../config.js';

describe('slack integration', () => {
  const mockWorkspace: SlackWorkspace = {
    name: 'Test Workspace',
    token: 'xoxp-test-token',
    statusEmoji: ':tomato:',
    statusText: 'Focusing',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setSlackStatus', () => {
    it('calls Slack API with correct parameters', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      await setSlackStatus(mockWorkspace, ':coffee:', 'Break time');

      expect(fetch).toHaveBeenCalledWith(
        'https://slack.com/api/users.profile.set',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer xoxp-test-token',
          },
          body: JSON.stringify({
            profile: {
              status_emoji: ':coffee:',
              status_text: 'Break time',
            },
          }),
        }
      );
    });

    it('handles API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: false, error: 'invalid_auth' }),
      } as Response);

      await setSlackStatus(mockWorkspace, ':tomato:', 'Focus');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to set Slack status for Test Workspace: invalid_auth'
      );
    });

    it('handles network errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await setSlackStatus(mockWorkspace, ':tomato:', 'Focus');

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('setSlackPresence', () => {
    it('sets presence to away', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      await setSlackPresence(mockWorkspace, 'away');

      expect(fetch).toHaveBeenCalledWith(
        'https://slack.com/api/users.setPresence',
        expect.objectContaining({
          body: JSON.stringify({ presence: 'away' }),
        })
      );
    });

    it('sets presence to auto', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      await setSlackPresence(mockWorkspace, 'auto');

      expect(fetch).toHaveBeenCalledWith(
        'https://slack.com/api/users.setPresence',
        expect.objectContaining({
          body: JSON.stringify({ presence: 'auto' }),
        })
      );
    });
  });

  describe('setFocusStatus', () => {
    it('sets status and presence for all workspaces', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      const workspaces: SlackWorkspace[] = [
        mockWorkspace,
        { ...mockWorkspace, name: 'Second Workspace', token: 'xoxp-second' },
      ];

      await setFocusStatus(workspaces);

      // 2 workspaces × 2 calls each (status + presence)
      expect(fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('clearStatus', () => {
    it('clears status and sets presence to auto', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      await clearStatus([mockWorkspace]);

      // Check status cleared
      expect(fetch).toHaveBeenCalledWith(
        'https://slack.com/api/users.profile.set',
        expect.objectContaining({
          body: JSON.stringify({
            profile: {
              status_emoji: '',
              status_text: '',
            },
          }),
        })
      );

      // Check presence set to auto
      expect(fetch).toHaveBeenCalledWith(
        'https://slack.com/api/users.setPresence',
        expect.objectContaining({
          body: JSON.stringify({ presence: 'auto' }),
        })
      );
    });
  });
});

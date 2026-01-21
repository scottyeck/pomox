import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getActiveSession, FocusmateError, formatDuration } from './focusmate.js';

describe('focusmate integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('getActiveSession', () => {
    it('throws error when API key is not configured', async () => {
      await expect(getActiveSession({ apiKey: '' })).rejects.toThrow(FocusmateError);
      await expect(getActiveSession({ apiKey: '' })).rejects.toThrow(
        'Focusmate API key not configured'
      );
    });

    it('throws error when API returns 401', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
        })
      );

      await expect(getActiveSession({ apiKey: 'invalid-key' })).rejects.toThrow(
        'Invalid Focusmate API key'
      );
    });

    it('throws error when API returns non-401 error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
        })
      );

      await expect(getActiveSession({ apiKey: 'valid-key' })).rejects.toThrow(
        'Focusmate API error: 500'
      );
    });

    it('throws error when no active session found', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ sessions: [] }),
        })
      );

      await expect(getActiveSession({ apiKey: 'valid-key' })).rejects.toThrow(
        'No active Focusmate session found'
      );
    });

    it('throws error when all sessions are completed', async () => {
      const now = new Date('2024-01-15T10:15:00Z');
      vi.setSystemTime(now);

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              sessions: [
                {
                  sessionId: 'session-1',
                  duration: 1500000, // 25 minutes
                  startTime: '2024-01-15T09:00:00Z', // ended at 9:25
                  users: [{ userId: 'user-1', completed: true }],
                },
              ],
            }),
        })
      );

      await expect(getActiveSession({ apiKey: 'valid-key' })).rejects.toThrow(
        'No active Focusmate session found'
      );
    });

    it('returns active session with correct remaining time', async () => {
      const now = new Date('2024-01-15T10:15:00Z');
      vi.setSystemTime(now);

      const sessionStart = '2024-01-15T10:00:00Z';
      const sessionDuration = 1500000; // 25 minutes

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              sessions: [
                {
                  sessionId: 'active-session',
                  duration: sessionDuration,
                  startTime: sessionStart,
                  users: [{ userId: 'user-1', completed: false }],
                },
              ],
            }),
        })
      );

      const result = await getActiveSession({ apiKey: 'valid-key' });

      expect(result.sessionId).toBe('active-session');
      expect(result.duration).toBe(sessionDuration);
      expect(result.startTime).toEqual(new Date(sessionStart));
      expect(result.endTime).toEqual(new Date('2024-01-15T10:25:00Z'));
      // 10 minutes remaining (10:25 - 10:15 = 10 min = 600000ms)
      expect(result.remainingMs).toBe(600000);
    });

    it('returns correct session when multiple sessions exist', async () => {
      const now = new Date('2024-01-15T10:30:00Z');
      vi.setSystemTime(now);

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              sessions: [
                {
                  sessionId: 'past-session',
                  duration: 1500000, // 25 minutes
                  startTime: '2024-01-15T09:00:00Z', // ended at 9:25
                  users: [{ userId: 'user-1', completed: true }],
                },
                {
                  sessionId: 'active-session',
                  duration: 3000000, // 50 minutes
                  startTime: '2024-01-15T10:00:00Z', // ends at 10:50
                  users: [{ userId: 'user-1', completed: false }],
                },
                {
                  sessionId: 'future-session',
                  duration: 1500000, // 25 minutes
                  startTime: '2024-01-15T11:00:00Z', // starts at 11:00
                  users: [{ userId: 'user-1', completed: false }],
                },
              ],
            }),
        })
      );

      const result = await getActiveSession({ apiKey: 'valid-key' });

      expect(result.sessionId).toBe('active-session');
      // 20 minutes remaining (10:50 - 10:30 = 20 min = 1200000ms)
      expect(result.remainingMs).toBe(1200000);
    });

    it('returns upcoming session starting within 5 minutes', async () => {
      const now = new Date('2024-01-15T09:57:00Z'); // 3 minutes before session
      vi.setSystemTime(now);

      const sessionStart = '2024-01-15T10:00:00Z';
      const sessionDuration = 1500000; // 25 minutes

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              sessions: [
                {
                  sessionId: 'upcoming-session',
                  duration: sessionDuration,
                  startTime: sessionStart,
                  users: [{ userId: 'user-1', completed: false }],
                },
              ],
            }),
        })
      );

      const result = await getActiveSession({ apiKey: 'valid-key' });

      expect(result.sessionId).toBe('upcoming-session');
      expect(result.duration).toBe(sessionDuration);
      expect(result.startTime).toEqual(new Date(sessionStart));
      expect(result.endTime).toEqual(new Date('2024-01-15T10:25:00Z'));
      // 28 minutes remaining (10:25 - 9:57 = 28 min = 1680000ms)
      expect(result.remainingMs).toBe(1680000);
    });

    it('throws error when session is more than 5 minutes away', async () => {
      const now = new Date('2024-01-15T09:50:00Z'); // 10 minutes before session
      vi.setSystemTime(now);

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              sessions: [
                {
                  sessionId: 'future-session',
                  duration: 1500000, // 25 minutes
                  startTime: '2024-01-15T10:00:00Z', // starts in 10 minutes
                  users: [{ userId: 'user-1', completed: false }],
                },
              ],
            }),
        })
      );

      await expect(getActiveSession({ apiKey: 'valid-key' })).rejects.toThrow(
        'No active Focusmate session found'
      );
    });

    it('prefers active session over upcoming session within 5 minutes', async () => {
      const now = new Date('2024-01-15T10:23:00Z'); // 2 min before session ends, 7 min before next starts
      vi.setSystemTime(now);

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              sessions: [
                {
                  sessionId: 'active-session',
                  duration: 1500000, // 25 minutes
                  startTime: '2024-01-15T10:00:00Z', // ends at 10:25
                  users: [{ userId: 'user-1', completed: false }],
                },
                {
                  sessionId: 'upcoming-session',
                  duration: 1500000, // 25 minutes
                  startTime: '2024-01-15T10:25:00Z', // starts in 2 minutes (within 5 min)
                  users: [{ userId: 'user-1', completed: false }],
                },
              ],
            }),
        })
      );

      const result = await getActiveSession({ apiKey: 'valid-key' });

      expect(result.sessionId).toBe('active-session');
      // 2 minutes remaining (10:25 - 10:23 = 2 min = 120000ms)
      expect(result.remainingMs).toBe(120000);
    });

    it('calls API with correct parameters', async () => {
      const now = new Date('2024-01-15T10:00:00Z');
      vi.setSystemTime(now);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ sessions: [] }),
      });
      vi.stubGlobal('fetch', mockFetch);

      try {
        await getActiveSession({ apiKey: 'test-api-key' });
      } catch {
        // Expected to throw
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];

      expect(url).toContain('https://api.focusmate.com/v1/sessions');
      expect(url).toContain('start=');
      expect(url).toContain('end=');
      expect(options.method).toBe('GET');
      expect(options.headers['X-API-KEY']).toBe('test-api-key');
    });
  });

  describe('formatDuration', () => {
    it('formats single minute correctly', () => {
      expect(formatDuration(60000)).toBe('1 minute');
    });

    it('formats multiple minutes correctly', () => {
      expect(formatDuration(1500000)).toBe('25 minutes');
    });

    it('rounds up partial minutes', () => {
      expect(formatDuration(90000)).toBe('2 minutes'); // 1.5 min -> 2 min
      expect(formatDuration(61000)).toBe('2 minutes'); // 1.01 min -> 2 min
    });
  });
});

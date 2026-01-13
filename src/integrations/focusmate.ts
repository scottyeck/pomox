import type { FocusmateConfig } from '../config.js';

const FOCUSMATE_API_BASE = 'https://api.focusmate.com/v1';

interface FocusmateUser {
  userId: string;
  requestedAt: string;
  joinedAt: string | null;
  completed: boolean;
  sessionTitle: string | null;
}

interface FocusmateSession {
  sessionId: string;
  duration: number; // milliseconds
  startTime: string; // ISO8601 UTC
  users: FocusmateUser[];
}

interface SessionsResponse {
  sessions: FocusmateSession[];
}

export interface ActiveSession {
  sessionId: string;
  duration: number; // milliseconds
  startTime: Date;
  endTime: Date;
  remainingMs: number;
}

export class FocusmateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FocusmateError';
  }
}

async function fetchSessions(
  apiKey: string,
  start: Date,
  end: Date
): Promise<FocusmateSession[]> {
  const url = new URL(`${FOCUSMATE_API_BASE}/sessions`);
  url.searchParams.set('start', start.toISOString());
  url.searchParams.set('end', end.toISOString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new FocusmateError('Invalid Focusmate API key');
    }
    throw new FocusmateError(`Focusmate API error: ${response.status}`);
  }

  const data = (await response.json()) as SessionsResponse;
  return data.sessions;
}

export async function getActiveSession(config: FocusmateConfig): Promise<ActiveSession> {
  if (!config.apiKey) {
    throw new FocusmateError(
      'Focusmate API key not configured. Add your API key to ~/.pomox/config.json under integrations.focusmate.apiKey'
    );
  }

  const now = new Date();

  // Fetch sessions from 2 hours ago to 2 hours from now to catch active sessions
  const start = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const sessions = await fetchSessions(config.apiKey, start, end);

  // Find session where now is between startTime and startTime + duration
  for (const session of sessions) {
    const startTime = new Date(session.startTime);
    const endTime = new Date(startTime.getTime() + session.duration);

    if (now >= startTime && now < endTime) {
      const remainingMs = endTime.getTime() - now.getTime();

      return {
        sessionId: session.sessionId,
        duration: session.duration,
        startTime,
        endTime,
        remainingMs,
      };
    }
  }

  throw new FocusmateError('No active Focusmate session found');
}

export function formatDuration(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

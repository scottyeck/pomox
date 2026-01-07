import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { getPomoxDir, ensurePomoxDir } from './config.js';

export interface TimerState {
  active: boolean;
  startTime: string;
  duration: number;
  endTime: string;
  daemonPid: number | null;
}

const STATE_FILE = join(getPomoxDir(), 'state.json');
const PID_FILE = join(getPomoxDir(), 'daemon.pid');

export function getEmptyState(): TimerState {
  return {
    active: false,
    startTime: '',
    duration: 0,
    endTime: '',
    daemonPid: null,
  };
}

export function loadState(): TimerState {
  ensurePomoxDir();

  if (!existsSync(STATE_FILE)) {
    return getEmptyState();
  }

  try {
    const content = readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(content) as TimerState;
  } catch {
    return getEmptyState();
  }
}

export function saveState(state: TimerState): void {
  ensurePomoxDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export function clearState(): void {
  ensurePomoxDir();
  const emptyState = getEmptyState();
  writeFileSync(STATE_FILE, JSON.stringify(emptyState, null, 2));
}

export function saveDaemonPid(pid: number): void {
  ensurePomoxDir();
  writeFileSync(PID_FILE, pid.toString());
}

export function loadDaemonPid(): number | null {
  if (!existsSync(PID_FILE)) {
    return null;
  }

  try {
    const content = readFileSync(PID_FILE, 'utf-8');
    return parseInt(content, 10);
  } catch {
    return null;
  }
}

export function clearDaemonPid(): void {
  if (existsSync(PID_FILE)) {
    unlinkSync(PID_FILE);
  }
}

export function getRemainingTime(state: TimerState): { minutes: number; seconds: number } | null {
  if (!state.active || !state.endTime) {
    return null;
  }

  const now = Date.now();
  const endTime = new Date(state.endTime).getTime();
  const diffMs = endTime - now;

  if (diffMs <= 0) {
    return { minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return { minutes, seconds };
}

export function formatRemainingTime(remaining: { minutes: number; seconds: number }): string {
  const mins = remaining.minutes.toString().padStart(2, '0');
  const secs = remaining.seconds.toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

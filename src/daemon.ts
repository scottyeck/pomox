/**
 * Daemon process for pomox timer.
 * This runs as a detached background process.
 *
 * Usage: node daemon.js <duration_ms>
 */

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

export async function runStartHooks(durationMinutes: number): Promise<void> {
  const config = loadConfig();
  const { integrations } = config;

  // Send notification
  if (integrations.notifications) {
    notifyStart(durationMinutes);
  }

  // Enable Focus Mode
  if (integrations.focusMode) {
    enableFocusMode();
  }

  // Kill apps
  if (integrations.apps.kill.length > 0) {
    killApps(integrations.apps.kill);
  }

  // Set Slack status
  if (integrations.slack.workspaces.length > 0) {
    await setFocusStatus(integrations.slack.workspaces);
  }

  // Run custom start commands
  if (integrations.commands.onStart.length > 0) {
    runStartCommands(integrations.commands.onStart);
  }
}

export async function runEndHooks(): Promise<void> {
  const config = loadConfig();
  const { integrations } = config;

  // Disable Focus Mode
  if (integrations.focusMode) {
    disableFocusMode();
  }

  // Reopen apps
  if (integrations.apps.reopen.length > 0) {
    openApps(integrations.apps.reopen);
  }

  // Clear Slack status
  if (integrations.slack.workspaces.length > 0) {
    await clearStatus(integrations.slack.workspaces);
  }

  // Run custom end commands
  if (integrations.commands.onEnd.length > 0) {
    runEndCommands(integrations.commands.onEnd);
  }

  // Send notification last
  if (integrations.notifications) {
    notifyEnd();
  }

  // Clear state
  clearState();
  clearDaemonPid();
}

export function parseDurationMs(arg: string): number | null {
  const durationMs = parseInt(arg, 10);
  if (isNaN(durationMs) || durationMs <= 0) {
    return null;
  }
  return durationMs;
}

export function msToDurationMinutes(durationMs: number): number {
  return Math.ceil(durationMs / 60000);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const durationMs = parseDurationMs(args[0]);

  if (durationMs === null) {
    console.error('Invalid duration');
    process.exit(1);
  }

  const durationMinutes = msToDurationMinutes(durationMs);

  // Run start hooks
  await runStartHooks(durationMinutes);

  // Wait for the duration
  setTimeout(async () => {
    await runEndHooks();
    process.exit(0);
  }, durationMs);
}

// Only run main when executed directly, not when imported for testing
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error) => {
    console.error('Daemon error:', error);
    process.exit(1);
  });
}

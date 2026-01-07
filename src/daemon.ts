/**
 * Daemon process for pomox timer.
 * This runs as a detached background process.
 *
 * Usage: node daemon.js <duration_minutes>
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
} from './integrations/index.js';

async function runStartHooks(durationMinutes: number): Promise<void> {
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
}

async function runEndHooks(): Promise<void> {
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

  // Send notification last
  if (integrations.notifications) {
    notifyEnd();
  }

  // Clear state
  clearState();
  clearDaemonPid();
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const durationMinutes = parseInt(args[0], 10);

  if (isNaN(durationMinutes) || durationMinutes <= 0) {
    console.error('Invalid duration');
    process.exit(1);
  }

  const durationMs = durationMinutes * 60 * 1000;

  // Run start hooks
  await runStartHooks(durationMinutes);

  // Wait for the duration
  setTimeout(async () => {
    await runEndHooks();
    process.exit(0);
  }, durationMs);
}

main().catch((error) => {
  console.error('Daemon error:', error);
  process.exit(1);
});

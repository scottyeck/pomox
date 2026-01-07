#!/usr/bin/env node

import { Command } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadConfig, saveConfig, getDefaultConfig, getConfigPath, ensurePomoxDir } from './config.js';
import {
  loadState,
  saveState,
  clearState,
  loadDaemonPid,
  saveDaemonPid,
  clearDaemonPid,
  getRemainingTime,
  formatRemainingTime,
} from './state.js';
import { checkShortcutsInstalled, getShortcutNames } from './integrations/focus-mode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('pomox')
  .description('A pomodoro timer for macOS with Focus Mode integration')
  .version('1.0.0');

program
  .command('start')
  .description('Start a pomodoro timer')
  .option('-d, --duration <minutes>', 'Duration in minutes', '25')
  .action(async (options) => {
    const state = loadState();

    if (state.active) {
      const remaining = getRemainingTime(state);
      if (remaining) {
        console.log(`Pomodoro already active - ${formatRemainingTime(remaining)} remaining`);
        console.log('Run "pomox end" to end early.');
      }
      process.exit(1);
    }

    const config = loadConfig();
    const duration = parseInt(options.duration, 10) || config.duration;

    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60 * 1000);

    // Save state before spawning daemon
    const newState = {
      active: true,
      startTime: now.toISOString(),
      duration,
      endTime: endTime.toISOString(),
      daemonPid: null as number | null,
    };
    saveState(newState);

    // Spawn detached daemon process
    const daemonPath = join(__dirname, 'daemon.js');
    const child = spawn(process.execPath, [daemonPath, duration.toString()], {
      detached: true,
      stdio: 'ignore',
    });

    child.unref();

    if (child.pid) {
      saveDaemonPid(child.pid);
      newState.daemonPid = child.pid;
      saveState(newState);
    }

    console.log(`Pomodoro started (${duration} minutes)`);
  });

program
  .command('status')
  .description('Check timer status')
  .action(() => {
    const state = loadState();

    if (!state.active) {
      console.log('Ready');
      return;
    }

    const remaining = getRemainingTime(state);
    if (!remaining) {
      console.log('Ready');
      return;
    }

    if (remaining.minutes === 0 && remaining.seconds === 0) {
      console.log('Completing...');
      return;
    }

    console.log(`${formatRemainingTime(remaining)}`);
  });

program
  .command('end')
  .description('End the current timer early')
  .action(async () => {
    const state = loadState();

    if (!state.active) {
      console.log('No active pomodoro');
      return;
    }

    // Kill the daemon process if running
    const pid = loadDaemonPid();
    if (pid) {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        // Process might already be gone
      }
    }

    // Import and run end hooks directly
    const { disableFocusMode, notifyEnd, openApps, clearStatus } = await import(
      './integrations/index.js'
    );
    const config = loadConfig();
    const { integrations } = config;

    if (integrations.focusMode) {
      disableFocusMode();
    }

    if (integrations.apps.reopen.length > 0) {
      openApps(integrations.apps.reopen);
    }

    if (integrations.slack.workspaces.length > 0) {
      await clearStatus(integrations.slack.workspaces);
    }

    if (integrations.notifications) {
      notifyEnd();
    }

    clearState();
    clearDaemonPid();

    console.log('Pomodoro ended');
  });

program
  .command('setup')
  .description('Configure pomox')
  .action(async () => {
    ensurePomoxDir();

    console.log('Pomox Setup\n');

    // Check for shortcuts
    const shortcutsInstalled = checkShortcutsInstalled();
    const shortcutNames = getShortcutNames();

    if (!shortcutsInstalled) {
      console.log('Focus Mode shortcuts not found.');
      console.log('\nTo enable Focus Mode integration, create two shortcuts in the Shortcuts app:\n');
      console.log(`  1. "${shortcutNames.enable}" - Add action: "Set Focus" -> "Do Not Disturb" -> "Turn On"`);
      console.log(`  2. "${shortcutNames.disable}" - Add action: "Set Focus" -> "Do Not Disturb" -> "Turn Off"`);
      console.log('\nAlternatively, set "focusMode": false in your config to disable this integration.\n');
    } else {
      console.log('Focus Mode shortcuts found.\n');
    }

    // Create default config if it doesn't exist
    const configPath = getConfigPath();
    const config = loadConfig();

    // Save config (creates file if it doesn't exist)
    saveConfig(config);

    console.log(`Configuration saved to: ${configPath}`);
    console.log('\nEdit this file to customize:');
    console.log('  - Default duration');
    console.log('  - Apps to kill/reopen');
    console.log('  - Slack workspaces and tokens');
    console.log('\nExample config structure:');
    console.log(JSON.stringify(getDefaultConfig(), null, 2));
  });

program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    const config = loadConfig();
    const configPath = getConfigPath();

    console.log(`Config file: ${configPath}\n`);
    console.log(JSON.stringify(config, null, 2));
  });

program.parse();

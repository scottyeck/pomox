import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface SlackWorkspace {
  name: string;
  token: string;
  statusEmoji: string;
  statusText: string;
}

export interface Config {
  duration: number;
  integrations: {
    focusMode: boolean;
    notifications: boolean;
    apps: {
      kill: string[];
      reopen: string[];
    };
    slack: {
      workspaces: SlackWorkspace[];
    };
  };
}

const POMOX_DIR = join(homedir(), '.pomox');
const CONFIG_FILE = join(POMOX_DIR, 'config.json');

export function getDefaultConfig(): Config {
  return {
    duration: 25,
    integrations: {
      focusMode: true,
      notifications: true,
      apps: {
        kill: ['Slack', 'Messages'],
        reopen: ['Slack', 'Messages'],
      },
      slack: {
        workspaces: [],
      },
    },
  };
}

export function ensurePomoxDir(): void {
  if (!existsSync(POMOX_DIR)) {
    mkdirSync(POMOX_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensurePomoxDir();

  if (!existsSync(CONFIG_FILE)) {
    return getDefaultConfig();
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content) as Partial<Config>;
    // Merge with defaults to handle missing fields
    return { ...getDefaultConfig(), ...config };
  } catch {
    return getDefaultConfig();
  }
}

export function saveConfig(config: Config): void {
  ensurePomoxDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getPomoxDir(): string {
  return POMOX_DIR;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

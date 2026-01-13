import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDefaultConfig } from './config.js';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDefaultConfig', () => {
    it('returns default configuration', () => {
      const config = getDefaultConfig();

      expect(config.duration).toBe(25);
      expect(config.integrations.focusMode).toBe(true);
      expect(config.integrations.notifications).toBe(true);
      expect(config.integrations.apps.kill).toEqual(['Slack', 'Messages']);
      expect(config.integrations.apps.reopen).toEqual(['Slack', 'Messages']);
      expect(config.integrations.slack.workspaces).toEqual([]);
      expect(config.integrations.focusmate.apiKey).toBe('');
    });
  });

  describe('loadConfig', () => {
    it('returns defaults when config file does not exist', async () => {
      const fs = await import('fs');
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const { loadConfig } = await import('./config.js');
      const config = loadConfig();

      expect(config.duration).toBe(25);
      expect(config.integrations.focusMode).toBe(true);
    });

    it('merges user config with defaults', async () => {
      const fs = await import('fs');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          duration: 50,
          integrations: {
            focusMode: false,
          },
        })
      );

      const { loadConfig } = await import('./config.js');
      const config = loadConfig();

      expect(config.duration).toBe(50);
      expect(config.integrations.focusMode).toBe(false);
      // Defaults should still be present
      expect(config.integrations.notifications).toBe(true);
      expect(config.integrations.focusmate.apiKey).toBe('');
    });

    it('deep merges nested config', async () => {
      const fs = await import('fs');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          integrations: {
            focusmate: {
              apiKey: 'my-api-key',
            },
          },
        })
      );

      const { loadConfig } = await import('./config.js');
      const config = loadConfig();

      // User-provided value
      expect(config.integrations.focusmate.apiKey).toBe('my-api-key');
      // Defaults still present
      expect(config.duration).toBe(25);
      expect(config.integrations.focusMode).toBe(true);
      expect(config.integrations.apps.kill).toEqual(['Slack', 'Messages']);
    });

    it('returns defaults on invalid JSON', async () => {
      const fs = await import('fs');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json {{{');

      const { loadConfig } = await import('./config.js');
      const config = loadConfig();

      expect(config.duration).toBe(25);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { killApps, openApps } from './apps.js';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('apps integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('killApps', () => {
    it('kills each app in the list', () => {
      killApps(['Slack', 'Messages']);

      expect(execSync).toHaveBeenCalledTimes(2);
      expect(execSync).toHaveBeenCalledWith(
        'pkill -9 -f "Contents/MacOS/Slack$"',
        { stdio: 'ignore' }
      );
      expect(execSync).toHaveBeenCalledWith(
        'pkill -9 -f "Contents/MacOS/Messages$"',
        { stdio: 'ignore' }
      );
    });

    it('handles empty app list', () => {
      killApps([]);

      expect(execSync).not.toHaveBeenCalled();
    });

    it('continues if app is not running', () => {
      vi.mocked(execSync)
        .mockImplementationOnce(() => {
          throw new Error('No matching processes');
        })
        .mockImplementationOnce(() => Buffer.from(''));

      killApps(['NotRunning', 'Slack']);

      expect(execSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('openApps', () => {
    it('opens each app in the list', () => {
      openApps(['Slack', 'Messages']);

      expect(execSync).toHaveBeenCalledTimes(2);
      expect(execSync).toHaveBeenCalledWith('open -a "Slack"', { stdio: 'ignore' });
      expect(execSync).toHaveBeenCalledWith('open -a "Messages"', { stdio: 'ignore' });
    });

    it('handles empty app list', () => {
      openApps([]);

      expect(execSync).not.toHaveBeenCalled();
    });

    it('logs error if app fails to open', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('App not found');
      });

      openApps(['NonexistentApp']);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to open NonexistentApp');
    });
  });
});

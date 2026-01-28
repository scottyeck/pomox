import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { runStartCommands, runEndCommands } from './commands.js';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('commands integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runStartCommands', () => {
    it('runs each command in the list', () => {
      runStartCommands(['echo "start"', 'echo "hello"']);

      expect(execSync).toHaveBeenCalledTimes(2);
      expect(execSync).toHaveBeenCalledWith('echo "start"', {
        stdio: 'inherit',
        shell: '/bin/sh',
        timeout: 30000,
      });
      expect(execSync).toHaveBeenCalledWith('echo "hello"', {
        stdio: 'inherit',
        shell: '/bin/sh',
        timeout: 30000,
      });
    });

    it('handles empty command list', () => {
      runStartCommands([]);

      expect(execSync).not.toHaveBeenCalled();
    });

    it('continues if a command fails', () => {
      vi.mocked(execSync)
        .mockImplementationOnce(() => {
          throw new Error('Command failed');
        })
        .mockImplementationOnce(() => Buffer.from(''));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      runStartCommands(['failing-command', 'echo "success"']);

      expect(execSync).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('logs error when command fails', () => {
      const error = new Error('Command failed');
      vi.mocked(execSync).mockImplementation(() => {
        throw error;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      runStartCommands(['bad-command']);

      expect(consoleSpy).toHaveBeenCalledWith('Command failed: bad-command', error);
    });
  });

  describe('runEndCommands', () => {
    it('runs each command in the list', () => {
      runEndCommands(['say "done"', 'echo "finished"']);

      expect(execSync).toHaveBeenCalledTimes(2);
      expect(execSync).toHaveBeenCalledWith('say "done"', {
        stdio: 'inherit',
        shell: '/bin/sh',
        timeout: 30000,
      });
      expect(execSync).toHaveBeenCalledWith('echo "finished"', {
        stdio: 'inherit',
        shell: '/bin/sh',
        timeout: 30000,
      });
    });

    it('handles empty command list', () => {
      runEndCommands([]);

      expect(execSync).not.toHaveBeenCalled();
    });

    it('continues if a command fails', () => {
      vi.mocked(execSync)
        .mockImplementationOnce(() => {
          throw new Error('Command failed');
        })
        .mockImplementationOnce(() => Buffer.from(''));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      runEndCommands(['failing-command', 'echo "success"']);

      expect(execSync).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});

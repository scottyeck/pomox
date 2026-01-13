import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import {
  enableFocusMode,
  disableFocusMode,
  checkShortcutsInstalled,
  getShortcutNames,
} from './focus-mode.js';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('focus-mode integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('enableFocusMode', () => {
    it('runs the enable shortcut', () => {
      enableFocusMode();

      expect(execSync).toHaveBeenCalledWith('shortcuts run "PomoxEnableFocus"', {
        stdio: 'ignore',
      });
    });

    it('logs error when shortcut fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Shortcut not found');
      });

      enableFocusMode();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to enable Focus Mode. Run "pomox setup" to install shortcuts.'
      );
    });
  });

  describe('disableFocusMode', () => {
    it('runs the disable shortcut', () => {
      disableFocusMode();

      expect(execSync).toHaveBeenCalledWith('shortcuts run "PomoxDisableFocus"', {
        stdio: 'ignore',
      });
    });

    it('logs error when shortcut fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Shortcut not found');
      });

      disableFocusMode();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to disable Focus Mode. Run "pomox setup" to install shortcuts.'
      );
    });
  });

  describe('checkShortcutsInstalled', () => {
    it('returns true when both shortcuts exist', () => {
      vi.mocked(execSync).mockReturnValue(
        'PomoxEnableFocus\nPomoxDisableFocus\nOtherShortcut' as unknown as Buffer
      );

      expect(checkShortcutsInstalled()).toBe(true);
    });

    it('returns false when enable shortcut is missing', () => {
      vi.mocked(execSync).mockReturnValue('PomoxDisableFocus\nOtherShortcut' as unknown as Buffer);

      expect(checkShortcutsInstalled()).toBe(false);
    });

    it('returns false when disable shortcut is missing', () => {
      vi.mocked(execSync).mockReturnValue('PomoxEnableFocus\nOtherShortcut' as unknown as Buffer);

      expect(checkShortcutsInstalled()).toBe(false);
    });

    it('returns false when shortcuts command fails', () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Command not found');
      });

      expect(checkShortcutsInstalled()).toBe(false);
    });
  });

  describe('getShortcutNames', () => {
    it('returns correct shortcut names', () => {
      const names = getShortcutNames();

      expect(names).toEqual({
        enable: 'PomoxEnableFocus',
        disable: 'PomoxDisableFocus',
      });
    });
  });
});

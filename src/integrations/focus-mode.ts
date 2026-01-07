import { execSync } from 'child_process';

const ENABLE_SHORTCUT = 'PomoxEnableFocus';
const DISABLE_SHORTCUT = 'PomoxDisableFocus';

export function enableFocusMode(): void {
  try {
    execSync(`shortcuts run "${ENABLE_SHORTCUT}"`, { stdio: 'ignore' });
  } catch (error) {
    console.error('Failed to enable Focus Mode. Run "pomox setup" to install shortcuts.');
  }
}

export function disableFocusMode(): void {
  try {
    execSync(`shortcuts run "${DISABLE_SHORTCUT}"`, { stdio: 'ignore' });
  } catch (error) {
    console.error('Failed to disable Focus Mode. Run "pomox setup" to install shortcuts.');
  }
}

export function checkShortcutsInstalled(): boolean {
  try {
    const result = execSync('shortcuts list', { encoding: 'utf-8' });
    const hasEnable = result.includes(ENABLE_SHORTCUT);
    const hasDisable = result.includes(DISABLE_SHORTCUT);
    return hasEnable && hasDisable;
  } catch {
    return false;
  }
}

export function getShortcutNames(): { enable: string; disable: string } {
  return {
    enable: ENABLE_SHORTCUT,
    disable: DISABLE_SHORTCUT,
  };
}

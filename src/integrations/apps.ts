import { execSync } from 'child_process';

export function killApps(apps: string[]): void {
  for (const app of apps) {
    try {
      // Use pkill with the app name pattern
      execSync(`pkill -9 -f "Contents/MacOS/${app}$"`, { stdio: 'ignore' });
    } catch {
      // App might not be running, ignore error
    }
  }
}

export function openApps(apps: string[]): void {
  for (const app of apps) {
    try {
      execSync(`open -a "${app}"`, { stdio: 'ignore' });
    } catch {
      console.error(`Failed to open ${app}`);
    }
  }
}

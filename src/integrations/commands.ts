import { execSync } from 'child_process';

export function runStartCommands(commands: string[]): void {
  runCommands(commands);
}

export function runEndCommands(commands: string[]): void {
  runCommands(commands);
}

function runCommands(commands: string[]): void {
  for (const command of commands) {
    try {
      execSync(command, { stdio: 'inherit', shell: '/bin/sh', timeout: 30000 });
    } catch (error) {
      console.error(`Command failed: ${command}`, error);
    }
  }
}

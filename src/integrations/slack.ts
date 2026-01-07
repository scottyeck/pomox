import type { SlackWorkspace } from '../config.js';

export async function setSlackStatus(
  workspace: SlackWorkspace,
  emoji: string,
  text: string
): Promise<void> {
  const profile = {
    status_emoji: emoji,
    status_text: text,
  };

  try {
    const response = await fetch('https://slack.com/api/users.profile.set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workspace.token}`,
      },
      body: JSON.stringify({ profile }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error(`Failed to set Slack status for ${workspace.name}: ${data.error}`);
    }
  } catch (error) {
    console.error(`Failed to set Slack status for ${workspace.name}:`, error);
  }
}

export async function setSlackPresence(workspace: SlackWorkspace, presence: 'away' | 'auto'): Promise<void> {
  try {
    const response = await fetch('https://slack.com/api/users.setPresence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${workspace.token}`,
      },
      body: JSON.stringify({ presence }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error(`Failed to set Slack presence for ${workspace.name}: ${data.error}`);
    }
  } catch (error) {
    console.error(`Failed to set Slack presence for ${workspace.name}:`, error);
  }
}

export async function setFocusStatus(workspaces: SlackWorkspace[]): Promise<void> {
  for (const workspace of workspaces) {
    await setSlackStatus(workspace, workspace.statusEmoji, workspace.statusText);
    await setSlackPresence(workspace, 'away');
  }
}

export async function clearStatus(workspaces: SlackWorkspace[]): Promise<void> {
  for (const workspace of workspaces) {
    await setSlackStatus(workspace, '', '');
    await setSlackPresence(workspace, 'auto');
  }
}

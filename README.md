# pomox

A pomodoro timer for macOS that manages distractions for me.

## Why?

- I get distracted by notifications in several applications.
- ...or sometimes just even by the _existence_ of these applications.
- I want these applications to be quit and for their notifications to be disabled.
- I do not want to have to manually re-open these applications or re-enable their notifications. (Ideally I am so focused that I will forget to do so.)

I run `pomox` and a timer starts and side effects fire that:

- Enable _Do Not Disturb_
- Quits distracting apps (Slack, Messages, etc.)
- Sets my Slack status to away

When the timer ends, everything is restored automatically.

## Usage

```bash
pomox start [-d minutes]  # Start timer (default 25)
pomox fm                  # Start timer synced to active Focusmate session
pomox status              # Check remaining time
pomox end                 # End early
pomox setup               # Setup instructions
```

## Setup

### Focus Mode

Create two shortcuts in the macOS Shortcuts app:

1. `PomoxEnableFocus` - Add action: Set Focus → Do Not Disturb → Turn On
2. `PomoxDisableFocus` - Add action: Set Focus → Do Not Disturb → Turn Off

Or set `"focusMode": false` in config to disable.

### Notifications

Should work automatically. If not, check System Settings → Notifications → terminal-notifier is allowed.

### Slack

1. Create app at https://api.slack.com/apps
2. Add User Token Scopes: `users.profile:write`, `users:write`
3. Install to workspace and copy the `xoxp-...` token
4. Add to config (see below)

### Focusmate

Sync your pomox timer with your active [Focusmate](https://www.focusmate.com) session. The timer will automatically match the remaining time in your session.

1. Go to [Focusmate Settings](https://www.focusmate.com/profile/edit-p)
2. Scroll to **Account** and click **Generate API key**
3. Copy the key and add to config (see below)
4. Run `pomox fm` during an active Focusmate session

### Custom Commands

Run arbitrary shell commands when the timer starts and/or ends. Add to config:

```json
{
  "integrations": {
    "commands": {
      "onStart": ["echo 'Focus time!' >> ~/pomodoro.log"],
      "onEnd": ["say 'Pomodoro complete!'"]
    }
  }
}
```

Both are optional. Commands run synchronously with a 30-second timeout.

#### Focusmate Commands

Consider using [`focusm`](https://github.com/scottyeck/focusm) to summon and unmute Focusmate when your session is complete.

```json
{
  "integrations": {
    "commands": {
      "onEnd": ["focusm focus"]
    }
  }
}
```

### Raycast

Script commands are included in `raycast/`. To add:

1. Raycast → Settings → Extensions → Script Commands
2. Click "Add Directories"
3. Select the `raycast` folder from this repo

Note: These scripts assume nvm. YMMV.

## Config

Edit `~/.pomox/config.json`:

```json
{
  "duration": 25,
  "integrations": {
    "focusMode": true,
    "notifications": true,
    "apps": {
      "kill": ["Slack", "Messages"],
      "reopen": ["Slack", "Messages"]
    },
    "slack": {
      "workspaces": [
        { "name": "work", "token": "xoxp-...", "statusEmoji": ":tomato:", "statusText": "Focusing" }
      ]
    },
    "focusmate": {
      "apiKey": "your-api-key"
    },
    "commands": {
      "onStart": [],
      "onEnd": ["say 'Pomodoro complete!'"]
    }
  }
}
```

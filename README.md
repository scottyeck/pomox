# pomox

A pomodoro timer for macOS that manages distractions for me.

## Why?

- I get distracted by notifications in several applications.
- I want notifications to be disabled in these applications.
- I do not want to have to manually re-enable these notifications. (Ideally I am so focused that I will forget to do so.)

I run `pomox` and a timer starts and side effects fire that:

- Enable _Do Not Disturb_
- Quits distracting apps (Slack, Messages, etc.)
- Sets my Slack status to away

When the timer ends, everything is restored automatically.

## Usage

```bash
pomox start [-d minutes]  # Start timer (default 25)
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
    }
  }
}
```

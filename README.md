# pomox

A pomodoro timer for macOS.

## Usage

```bash
pomox start [-d minutes]  # Start timer (default 25)
pomox status              # Check remaining time
pomox end                 # End early
pomox setup               # Setup instructions
```

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

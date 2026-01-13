# Pomox: macOS Menu Bar App Distribution

## Goal
Convert the pomox CLI tool into a distributable macOS menu bar app with .dmg installer for less-technical users.

## Recommended Approach: Electron + menubar package

**Why Electron:**
- ~100% code reuse from existing TypeScript/Node.js codebase
- All existing integrations (Slack, Focusmate, Focus Mode, app control) work unchanged
- Simple .dmg packaging via electron-builder
- Familiar tooling (npm, TypeScript)

**Trade-off:** ~150-200MB bundle size (acceptable for a productivity tool)

---

## Implementation Plan

### Phase 1: Project Structure Setup

New files to create:
```
electron/
├── main.ts           # Main process - timer management, IPC handlers
├── preload.ts        # Expose safe IPC to renderer
└── tray.ts           # Tray menu logic (optional, can be in main.ts)
renderer/
├── index.html        # Menu bar dropdown UI
├── app.ts            # UI logic
└── styles.css        # Styling
assets/
├── icon.icns                 # App icon (1024x1024)
├── trayIconTemplate.png      # Tray icon (22x22, black for auto dark/light)
└── trayIconTemplate@2x.png   # Retina tray icon (44x44)
```

Config files:
- `electron-builder.json` - Build/packaging configuration
- `tsconfig.electron.json` - TypeScript config for Electron code
- `entitlements.mac.plist` - macOS permissions for shell commands

### Phase 2: Dependencies

Add to package.json:
```json
{
  "main": "dist-electron/main.js",
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0"
  },
  "dependencies": {
    "menubar": "^9.4.0"
  }
}
```

### Phase 3: Main Process (`electron/main.ts`)

Key responsibilities:
1. Create menubar instance with tray icon
2. Manage timer via `setInterval` (replaces daemon spawn approach)
3. IPC handlers: `start-timer`, `end-timer`, `get-state`, `get-config`
4. Run integrations when timer starts/ends (reuse existing `src/integrations/*`)
5. Update tray icon/title to show timer status

Critical: Reuse existing modules:
- `src/config.ts` - Config loading
- `src/state.ts` - State persistence
- `src/integrations/*` - All integrations work unchanged

### Phase 4: Preload Script (`electron/preload.ts`)

Expose IPC channels to renderer:
- `pomox.startTimer(duration)`
- `pomox.endTimer()`
- `pomox.getState()`
- `pomox.getConfig()`
- `pomox.onTimerTick(callback)`
- `pomox.onTimerEnded(callback)`

### Phase 5: Renderer UI

Simple dropdown showing:
- Timer display (e.g., "25:00")
- Start/End buttons
- Duration picker
- Focusmate sync button

### Phase 6: Build Configuration

`electron-builder.json`:
- App ID: `com.pomox.app`
- Category: `public.app-category.productivity`
- Target: DMG for x64 and arm64
- `LSUIElement: true` to hide from Dock (menu bar apps don't show in Dock)

### Phase 7: App Icons

Create:
- `icon.icns` - Standard macOS app icon (tomato/timer design)
- `trayIconTemplate.png` - Use "Template" suffix for automatic dark/light mode support

---

## Key Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add Electron deps, build scripts, main entry |
| `src/daemon.ts` | Reference for timer logic to adapt |
| `src/integrations/index.ts` | Import in Electron main process |

---

## Build Commands

```bash
# Development
npm run electron:dev

# Build DMG
npm run dist
# Output: release/Pomox-1.0.0.dmg
```

---

## Notes

1. **CLI preserved**: Existing CLI continues working, shares core code with Electron app
2. **State persistence**: Uses existing `~/.pomox/` directory
3. **Notifications**: Can use Electron's built-in `Notification` API or keep `node-notifier`
4. **Code signing (optional)**: Required for distribution outside App Store - involves Apple Developer account, `codesign`, and `notarytool`

---

## Verification

1. Run `npm run electron:dev` - app should appear in menu bar
2. Click tray icon - dropdown should show
3. Start timer - tray should show countdown, integrations should fire
4. End timer - integrations should clean up, notification should appear
5. Run `npm run dist` - DMG should be created in `release/`
6. Open DMG on fresh Mac - drag to Applications, launch from menu bar

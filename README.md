# TabJump

A minimal Obsidian plugin that switches between the last two active tabs (Alt-Tab behavior).

## Usage

1. Install and enable the plugin
2. Open Settings → Hotkeys → Search "TabJump"
3. Assign a hotkey (e.g., `Ctrl+Tab` or `Ctrl+Space`)
4. Press the hotkey to toggle between your two most recent tabs

## Command

- **Switch to last active tab** (`tabjump:switch`)

## Vimrc Integration

Add to `.obsidian.vimrc`:

```vim
exmap tabjump obcommand tabjump:switch
nmap <Space><Space> :tabjump<CR>
```

## Features

- Minimal (~50 lines)
- Uses modern Obsidian API (no deprecated `activeLeaf`)
- Mobile compatible
- Handles edge cases (closed tabs, split panes)

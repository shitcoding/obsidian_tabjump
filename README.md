# TabJump

A minimal Obsidian plugin that switches between the last two active tabs (Alt-Tab behavior).

## Usage

1. Install and enable the plugin
2. Open Settings → Community Plugins → TabJump (click gear icon)
3. Assign hotkeys directly in the plugin settings, or go to Settings → Hotkeys → Search "TabJump"
4. Use the assigned hotkeys to:
   - Toggle between your two most recent tabs
   - Move the current tab left or right in the tab bar

## Commands

- **Switch to last active tab** (`tabjump:switch`)
- **Move current tab left** (`tabjump:move-tab-left`)
- **Move current tab right** (`tabjump:move-tab-right`)

## Vimrc Integration

Add to `.obsidian.vimrc`:

```vim
" Switch between last two tabs
exmap tabjump obcommand tabjump:switch
nmap <Space><Space> :tabjump<CR>

" Move tab left/right
exmap movetableft obcommand tabjump:move-tab-left
exmap movetabright obcommand tabjump:move-tab-right
nmap M :movetableft<CR>
nmap m :movetabright<CR>
```

## Features

- **Direct hotkey assignment** in plugin settings (no need to navigate to Hotkeys menu)
- **Tab switching** - Toggle between last two active tabs (Alt-Tab behavior)
- **Tab reordering** - Move current tab left or right in the tab bar
- Uses modern Obsidian API (no deprecated `activeLeaf`)
- Mobile compatible
- Handles edge cases (closed tabs, split panes, boundaries)

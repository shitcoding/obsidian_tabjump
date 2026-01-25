import { App, Hotkey, Modifier, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';

// Extend WorkspaceLeaf type to include internal 'id' property
interface WorkspaceLeafExt extends WorkspaceLeaf {
	id: string;
}

export default class TabJumpPlugin extends Plugin {
	private previousLeafId: string | null = null;
	private currentLeafId: string | null = null;

	async onload() {
		// Initialize with current leaf
		const currentLeaf = this.app.workspace.getMostRecentLeaf() as WorkspaceLeafExt | null;
		this.currentLeafId = currentLeaf?.id ?? null;

		// Track leaf changes
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				this.handleLeafChange(leaf);
			})
		);

		// Register command
		this.addCommand({
			id: 'switch',
			name: 'Switch to last active tab',
			callback: () => this.switchToLastTab(),
		});

		// Add settings tab
		this.addSettingTab(new TabJumpSettingTab(this.app, this));
	}

	private handleLeafChange(leaf: WorkspaceLeaf | null): void {
		const leafExt = leaf as WorkspaceLeafExt | null;

		// Guard against null, duplicate events, and same leaf
		if (!leafExt || leafExt.id === this.currentLeafId) {
			return;
		}

		// Shift history
		this.previousLeafId = this.currentLeafId;
		this.currentLeafId = leafExt.id;
	}

	private switchToLastTab(): void {
		if (!this.previousLeafId) {
			return;
		}

		// Find leaf by ID
		let targetLeaf: WorkspaceLeaf | null = null;
		this.app.workspace.iterateAllLeaves((leaf) => {
			if ((leaf as WorkspaceLeafExt).id === this.previousLeafId) {
				targetLeaf = leaf;
			}
		});

		if (!targetLeaf) {
			this.previousLeafId = null;
			return;
		}

		this.app.workspace.setActiveLeaf(targetLeaf, { focus: true });
	}
}

const COMMAND_ID = 'tabjump:switch';

class TabJumpSettingTab extends PluginSettingTab {
	plugin: TabJumpPlugin;
	private isRecording = false;
	private hotkeyDisplay: HTMLElement | null = null;

	constructor(app: App, plugin: TabJumpPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'TabJump' });

		containerEl.createEl('p', {
			text: 'Switch between the last two active tabs with a single hotkey (Alt-Tab behavior for tabs).',
		});

		const setting = new Setting(containerEl)
			.setName('Hotkey')
			.setDesc('Click to set a hotkey for switching tabs');

		const hotkeyContainer = setting.controlEl.createDiv({ cls: 'setting-hotkey' });

		this.hotkeyDisplay = hotkeyContainer.createEl('span', {
			cls: 'hotkey-display',
			text: this.getCurrentHotkeyText(),
		});
		this.hotkeyDisplay.style.cursor = 'pointer';
		this.hotkeyDisplay.style.padding = '4px 8px';
		this.hotkeyDisplay.style.borderRadius = '4px';
		this.hotkeyDisplay.style.border = '1px solid var(--background-modifier-border)';
		this.hotkeyDisplay.style.minWidth = '100px';
		this.hotkeyDisplay.style.display = 'inline-block';
		this.hotkeyDisplay.style.textAlign = 'center';

		this.hotkeyDisplay.addEventListener('click', () => this.startRecording());

		const clearBtn = hotkeyContainer.createEl('span', {
			cls: 'hotkey-clear',
			text: '×',
		});
		clearBtn.style.cursor = 'pointer';
		clearBtn.style.marginLeft = '8px';
		clearBtn.style.padding = '4px 8px';
		clearBtn.style.opacity = '0.7';
		clearBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.clearHotkey();
		});
	}

	private getCurrentHotkeyText(): string {
		// @ts-ignore - accessing internal API
		const customKeys = this.app.hotkeyManager.customKeys;
		const hotkeys: Hotkey[] = customKeys[COMMAND_ID];

		if (hotkeys && hotkeys.length > 0 && hotkeys[0]) {
			return this.hotkeyToString(hotkeys[0]);
		}
		return 'Click to set';
	}

	private hotkeyToString(hotkey: Hotkey): string {
		const parts: string[] = [];
		const isMac = navigator.platform.includes('Mac');

		if (hotkey.modifiers.includes('Mod')) {
			parts.push(isMac ? '⌘' : 'Ctrl');
		}
		if (hotkey.modifiers.includes('Ctrl')) {
			parts.push(isMac ? '⌃' : 'Ctrl');
		}
		if (hotkey.modifiers.includes('Alt')) {
			parts.push(isMac ? '⌥' : 'Alt');
		}
		if (hotkey.modifiers.includes('Shift')) {
			parts.push(isMac ? '⇧' : 'Shift');
		}
		if (hotkey.modifiers.includes('Meta')) {
			parts.push(isMac ? '⌘' : 'Win');
		}

		parts.push(this.formatKeyName(hotkey.key));
		return parts.join(' + ');
	}

	private formatKeyName(key: string): string {
		const keyNames: Record<string, string> = {
			' ': 'Space',
			'Space': 'Space',
			'ArrowUp': '↑',
			'ArrowDown': '↓',
			'ArrowLeft': '←',
			'ArrowRight': '→',
			'Enter': '↵',
			'Backspace': '⌫',
			'Delete': '⌦',
			'Escape': 'Esc',
			'Tab': '⇥',
		};
		return keyNames[key] || key.toUpperCase();
	}

	private startRecording(): void {
		if (this.isRecording || !this.hotkeyDisplay) return;

		this.isRecording = true;
		this.hotkeyDisplay.setText('Press keys...');
		this.hotkeyDisplay.style.background = 'var(--interactive-accent)';
		this.hotkeyDisplay.style.color = 'var(--text-on-accent)';

		const handler = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
				return;
			}

			const modifiers: Modifier[] = [];
			if (e.ctrlKey) modifiers.push(navigator.platform.includes('Mac') ? 'Ctrl' : 'Mod');
			if (e.altKey) modifiers.push('Alt');
			if (e.shiftKey) modifiers.push('Shift');
			if (e.metaKey) modifiers.push(navigator.platform.includes('Mac') ? 'Mod' : 'Meta');

			// Normalize key names for Obsidian
			let key = e.key;
			if (key === ' ') key = 'Space';

			const hotkey: Hotkey = {
				modifiers,
				key,
			};

			this.setHotkey(hotkey);
			this.stopRecording(handler);
		};

		document.addEventListener('keydown', handler, { capture: true });

		const escHandler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				e.stopPropagation();
				this.stopRecording(handler);
				document.removeEventListener('keydown', escHandler, { capture: true });
			}
		};
		document.addEventListener('keydown', escHandler, { capture: true });
	}

	private stopRecording(handler: (e: KeyboardEvent) => void): void {
		this.isRecording = false;
		document.removeEventListener('keydown', handler, { capture: true });

		if (this.hotkeyDisplay) {
			this.hotkeyDisplay.setText(this.getCurrentHotkeyText());
			this.hotkeyDisplay.style.background = '';
			this.hotkeyDisplay.style.color = '';
		}
	}

	private setHotkey(hotkey: Hotkey): void {
		// @ts-ignore - accessing internal API
		this.app.hotkeyManager.setHotkeys(COMMAND_ID, [hotkey]);
		// @ts-ignore - save hotkeys
		this.app.hotkeyManager.save();
	}

	private clearHotkey(): void {
		// @ts-ignore - accessing internal API
		this.app.hotkeyManager.setHotkeys(COMMAND_ID, []);
		// @ts-ignore - save hotkeys
		this.app.hotkeyManager.save();

		if (this.hotkeyDisplay) {
			this.hotkeyDisplay.setText('Click to set');
		}
	}
}

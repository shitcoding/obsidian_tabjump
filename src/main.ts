import { Plugin, WorkspaceLeaf } from 'obsidian';

export default class TabJumpPlugin extends Plugin {
	private previousLeaf: WorkspaceLeaf | null = null;
	private currentLeaf: WorkspaceLeaf | null = null;

	async onload() {
		// Initialize with current leaf
		this.currentLeaf = this.app.workspace.getMostRecentLeaf();

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
	}

	private handleLeafChange(leaf: WorkspaceLeaf | null): void {
		// Guard against null, duplicate events, and same leaf
		if (!leaf || leaf === this.currentLeaf) {
			return;
		}

		// Shift history
		this.previousLeaf = this.currentLeaf;
		this.currentLeaf = leaf;
	}

	private switchToLastTab(): void {
		if (!this.previousLeaf) {
			return;
		}

		// Check if previous leaf still exists in workspace
		const leaves: WorkspaceLeaf[] = [];
		this.app.workspace.iterateAllLeaves((l) => leaves.push(l));

		if (!leaves.includes(this.previousLeaf)) {
			this.previousLeaf = null;
			return;
		}

		this.app.workspace.setActiveLeaf(this.previousLeaf, { focus: true });
	}
}

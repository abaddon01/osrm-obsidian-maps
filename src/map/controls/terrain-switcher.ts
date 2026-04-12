import { setIcon, Menu } from 'obsidian';
import { Map } from 'maplibre-gl';

export class TerrainSwitcherControl {
	private containerEl: HTMLElement;
	private tileSets: Array<{ id: string; name: string; lightTiles: string; darkTiles: string; isTerrain: boolean }>;
	private onSwitch: (tileSetId: string) => void;
	private currentTerrainSetId: string;

	constructor(
		tileSets: Array<{ id: string; name: string; lightTiles: string; darkTiles: string; isTerrain: boolean }>,
		currentTileSetId: string,
		onSwitch: (tileSetId: string) => void
	) {
		this.tileSets = tileSets;
		this.currentTerrainSetId = currentTileSetId;
		this.onSwitch = onSwitch;
		this.containerEl = createDiv('maplibregl-ctrl maplibregl-ctrl-group canvas-control-group mod-raised');
	}

	onAdd(map: Map): HTMLElement {
		const button = this.containerEl.createEl('div', {
			cls: 'canvas-control-item',
			attr: { 'aria-label': 'Switch terrain' }
		});
		setIcon(button, 'mountain');

		button.addEventListener('click', (evt) => {
			evt.stopPropagation();
			const menu = new Menu();

			for (const tileSet of this.tileSets) {
                                if ( tileSet.isTerrain )
				menu.addItem((item) => {
					item
						.setTitle(tileSet.name)
                                                .setIcon('mountain-snow')
						.setChecked(this.currentTerrainSetId === tileSet.id)
						.onClick(() => {
							this.currentTerrainSetId = tileSet.id;
							this.onSwitch(tileSet.id);
						});
				});
			}

			menu.showAtMouseEvent(evt);
		});

		return this.containerEl;
	}

	onRemove(): void {
		if (this.containerEl && this.containerEl.parentNode) {
			this.containerEl.detach();
		}
	}
}


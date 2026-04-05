import { App } from 'obsidian';
import { StyleSpecification } from 'maplibre-gl';
import { transformMapboxStyle } from '../mapbox-transform';

export class StyleManager {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	async getMapStyle(mapTiles: string[], mapTilesDark: string[]): Promise<string | StyleSpecification> {
		const isDark = this.app.isDarkMode();
		const tileUrls = isDark && mapTilesDark.length > 0 ? mapTilesDark : mapTiles;

		// Determine style URL: use custom if provided, otherwise use default style
		let styleUrl: string;
		if (tileUrls.length === 0) {
			// No custom tiles configured, use default
			styleUrl = isDark ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/bright';
		} else if (tileUrls.length === 1 && !this.isTileTemplateUrl(tileUrls[0])) {
			// Single URL that's not a tile template, treat as style URL
			styleUrl = tileUrls[0];
		} else {
			// Multiple URLs or tile template URLs - create custom raster style (skip to bottom)
			styleUrl = '';
		}

		// Fetch style JSON for any style URL (default or custom) to avoid CORS issues
		if (styleUrl) {
			try {
				const response = await fetch(styleUrl);
				if (response.ok) {
					const styleJson = await response.json();
					// Extract access token from URL for Mapbox styles
					const accessTokenMatch = styleUrl.match(/access_token=([^&]+)/);
					const accessToken = accessTokenMatch ? accessTokenMatch[1] : '';
					// Transform mapbox:// protocol URLs to HTTPS URLs if needed
					const transformedStyle = accessToken
						? transformMapboxStyle(styleJson, accessToken)
						: this.addTerrain(styleJson);
                                        
					return transformedStyle as StyleSpecification;
				}
			} catch (error) {
				console.warn('Failed to fetch style JSON, falling back to URL:', error);
			}
			// If fetch fails, fall back to returning the URL directly
			return styleUrl;
		}

		// Create a custom style with the configured tile sources (raster tiles)
		const spec: StyleSpecification = {
			version: 8,
			sources: {},
			layers: [],
		}
		tileUrls.forEach((tileUrl, index) => {
			const sourceId = `custom-tiles-${index}`;
			spec.sources[sourceId] = {
				type: 'raster',
				tiles: [tileUrl],
				tileSize: 256
			};

			spec.layers.push({
				id: `custom-layer-${index}`,
				type: 'raster',
				source: sourceId
			});
		});
                this.addTerrain(spec);
		return spec;
	}

        

        private addTerrain(spec:StyleSpecification):StyleSpecification
        {
            spec.sources['terrainSource']= {
                        type: "raster-dem",
                        tiles: ["https://xyz-mdt.idee.es/1.0.0/raster-dem/{z}/{x}/{y}.png"],
                        tileSize: 256,
                    };
                    spec.sources['hillshadeSource']= {                    
                        type: "raster-dem",
                        tiles: ["https://xyz-mdt.idee.es/1.0.0/raster-dem/{z}/{x}/{y}.png"],
                        tileSize: 256,
                    };
                 spec.terrain={
                    source: "terrainSource",
                    exaggeration: 1.5,
                };
                spec.layers.push(
                    {
                      id: "hills",
                      type: "hillshade",
                      source: "hillshadeSource",
                      layout: { visibility: "visible" },
                      paint: { "hillshade-shadow-color": "#473B24" },
                    }                    
                );
        spec.layers.push({
            id: 'measure-points',
            type: 'circle',
            source: 'geojson',
            paint: {
                'circle-radius': 5,
                'circle-color': '#000'
            },
            filter: ['in', '$type', 'Point']
        });
        spec.layers.push({
            id: 'measure-lines',
            type: 'line',
            source: 'geojson',
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            },
            paint: {
                'line-color': '#000',
                'line-width': 2.5
            },
            filter: ['in', '$type', 'LineString']
        });                   
                return spec;
                
        }

	private isTileTemplateUrl(url: string): boolean {
		// Check if the URL contains tile template placeholders
		return url.includes('{z}') || url.includes('{x}') || url.includes('{y}');
	}
}


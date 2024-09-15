const configs = {
	"scene": {
		"renderer": {
			"size": {
				"width": 840,		// Type: number - Width of the rendering canvas in pixels
                "height": 480       // Type: number - Height of the rendering canvas in pixels
            }
		},
		"lights":  {
            "hemisphereLight": {
                "type": "hemisphere",        // Type: string - Type of light (hemisphere)
                "skyColor": "#ffffff",       // Type: string (hex color) - Color of the sky in the light
                "groundColor": "#333333",    // Type: string (hex color) - Color of the ground in the light
                "intensity": 0.1,            // Type: number - Light intensity (0.0 - 1.0)
                "castShadow": false,         // Type: boolean - Whether this light casts shadows
                "shadow": false              // Type: boolean - Placeholder, as hemisphere lights do not cast shadows
            },
            "ambientLight": {
                "type": "ambient",           // Type: string - Type of light (ambient)
                "color": "#bbbbbb",          // Type: string (hex color) - Color of the ambient light
                "intensity": 0.4,            // Type: number - Light intensity (0.0 - 1.0)
                "castShadow": false,         // Type: boolean - Ambient light does not cast shadows
                "shadow": false              // Type: boolean - Placeholder, ambient lights don't cast shadows
            },
            "spotLight": {
                "type": "spot",              // Type: string - Type of light (spotlight)
                "color": "#bbbbbb",          // Type: string (hex color) - Color of the spotlight
                "intensity": 0.9,            // Type: number - Light intensity (0.0 - 1.0)
                "penumbra": 0,               // Type: number - Softness of the edge of the spotlight (0.0 - 1.0)
                "decay": 0,                  // Type: number - How quickly the light dims over distance
                "distance": 50000,           // Type: number - Maximum range of the light in units
                "position": {
                    "x": -15000,             // Type: number - X position of the spotlight
                    "y": -15000,             // Type: number - Y position of the spotlight
                    "z": 20000               // Type: number - Z position of the spotlight (height)
                },
                "castShadow": true,          // Type: boolean - Whether the spotlight casts shadows
                "shadow": {
                    "mapSize": {
                        "width": 512,        // Type: number - Width of the shadow map
                        "height": 512        // Type: number - Height of the shadow map
                    },
                    "near": 10,              // Type: number - Near clipping plane for shadows
                    "far": 200,              // Type: number - Far clipping plane for shadows
                    "focus": 0.4             // Type: number - Focus factor for shadows (0.0 - 1.0)
                }
            },
            "spotLight1": {
                "type": "spot",              // Type: string - Type of light (spotlight)
                "color": "#dddddd",          // Type: string (hex color) - Color of the spotlight
                "intensity": 0.9,            // Type: number - Light intensity (0.0 - 1.0)
                "penumbra": 0,               // Type: number - Softness of the edge of the spotlight (0.0 - 1.0)
                "decay": 0,                  // Type: number - Light decay over distance
                "distance": 20000,           // Type: number - Maximum range of the light in units
                "position": {
                    "x": -15000,             // Type: number - X position of the spotlight
                    "y": -15000,             // Type: number - Y position of the spotlight
                    "z": 20000               // Type: number - Z position of the spotlight (height)
                },
                "castShadow": false,         // Type: boolean - Whether the spotlight casts shadows
                "shadow": false              // Type: boolean - Placeholder, as this spotlight does not cast shadows
            },
            "spotLight2": {
                "type": "spot",              // Type: string - Type of light (spotlight)
                "color": "#dddddd",          // Type: string (hex color) - Color of the spotlight
                "intensity": 0.9,            // Type: number - Light intensity (0.0 - 1.0)
                "penumbra": 0,               // Type: number - Softness of the edge of the spotlight (0.0 - 1.0)
                "decay": 0,                  // Type: number - Light decay over distance
                "distance": 20000,           // Type: number - Maximum range of the light in units
                "position": {
                    "x": 15000,              // Type: number - X position of the spotlight
                    "y": -15000,             // Type: number - Y position of the spotlight
                    "z": 20000               // Type: number - Z position of the spotlight (height)
                },
                "castShadow": false,         // Type: boolean - Whether the spotlight casts shadows
                "shadow": false              // Type: boolean - Placeholder, as this spotlight does not cast shadows
            },
            "spotLight3": {
                "type": "spot",              // Type: string - Type of light (spotlight)
                "color": "#dddddd",          // Type: string (hex color) - Color of the spotlight
                "intensity": 0.9,            // Type: number - Light intensity (0.0 - 1.0)
                "penumbra": 0,               // Type: number - Softness of the edge of the spotlight (0.0 - 1.0)
                "decay": 0,                  // Type: number - Light decay over distance
                "distance": 20000,           // Type: number - Maximum range of the light in units
                "position": {
                    "x": -15000,             // Type: number - X position of the spotlight
                    "y": 15000,              // Type: number - Y position of the spotlight
                    "z": 20000               // Type: number - Z position of the spotlight (height)
                },
                "castShadow": false,         // Type: boolean - Whether the spotlight casts shadows
                "shadow": false              // Type: boolean - Placeholder, as this spotlight does not cast shadows
            }
        },
		"cameras": {
            "primary": {
                "fov": 75,        // Type: number - Field of view of the camera (in degrees)
                "aspect": 1.333,  // Type: number - Aspect ratio (width/height) of the camera
                "near": 0.01,     // Type: number - Near clipping plane distance
                "far": 10000      // Type: number - Far clipping plane distance
            }
        }
	},
	"ui": {
		"showSelector": true,    // Type: boolean - Whether to show a selector UI component
		"showTooltip": true      // Type: boolean - Whether to show tooltips in the UI
	}
}

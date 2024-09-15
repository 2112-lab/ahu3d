const fan = {
    "componentId": "r:novo.graphics::Fan",    // Type: string - Unique identifier for the component (required)
    "componentName": "Fan",                   // Type: string - Name of the component (required)

    "files": {
        "thumbnail": "Fan.png",               // Type: string - File name of the thumbnail image (not currently used by the module) (optional)
        "model": "Fan.glb"                    // Type: string - File name of the 3D model (in glb format) (required)
    },

    "metadata": {                             // Not required (optional)
        "description": "Large Fan",           // Type: string - Description of the component (optional)
        "category": "Air Distribution",       // Type: string - Category the component belongs to (optional)
        "style": "Large"                      // Type: string - Style of the component (optional)
    },

    "attributes": {                           // Required
        // Type: object - Animates the mesh's targets. Example: Spinning a Fan component's blades
        "setAnimation": {                     
            "action": "rotation",             // Type: string - Type of animation (rotation) (required for animation)
            "key": "speed",                   // Type: string - Key for controlling animation speed (required for animation)
            "value": 1,                       // Type: number - Default animation speed (required for animation)
            "step": 1,                        // Type: number - Step value for adjusting speed (required for animation)
            "min": 0,                         // Type: number - Minimum allowed value for speed (required for animation)
            "max": 10,                        // Type: number - Maximum allowed value for speed (required for animation)
            "targets": ["child002"],          // Type: strings[] - List of target child objects for animation (required for animation)
            "axis": "x"                       // Type: string - Axis of rotation for the animation (required for animation)
        }
    },

    "object": {                               // Required
        "position": { 
            "x": 0,                           // Type: number - X (width) coordinate of the object's position (required)
            "y": 0,                           // Type: number - Y (height) coordinate of the object's position (required)
            "z": 500.000                      // Type: number - Z (depth) coordinate of the object's position (required)
        },
        "rotation": { 
            "x": 0,                           // Type: number - Rotation around the X axis (required)
            "y": 0,                           // Type: number - Rotation around the Y axis (required)
            "z": 0                            // Type: number - Rotation around the Z axis (required)
        },
        "scale": { 
            "x": 1,                           // Type: number - Scale along the X axis (required)
            "y": 1,                           // Type: number - Scale along the Y axis (required)
            "z": 1                            // Type: number - Scale along the Z axis (required)
        },
        "boundingBox": {                      // Required
            "dimensions": {
                "x": 680,                     // Type: number - Bounding box width (X dimension) (required)
                "y": 1000,                    // Type: number - Bounding box height (Y dimension) (required)
                "z": 1000                     // Type: number - Bounding box depth (Z dimension) (required)
            },
            "origin": {
                "x": 0,                       // Type: number - X coordinate of the bounding box origin (required)
                "y": 0,                       // Type: number - Y coordinate of the bounding box origin (required)
                "z": 0                        // Type: number - Z coordinate of the bounding box origin (required)
            }
        }
    },
    // Type: boolean - Whether this is a component. A duct, end, or joint would be "isComponent": false, (required)
    "isComponent": true                        
}

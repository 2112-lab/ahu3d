const damper = {
    "componentId": "r:novo.graphics::Damper",    // Type: string - Unique identifier for the component (required)
    "componentName": "Damper",                   // Type: string - Name of the component (required)
    "files": {
        "thumbnail": "Damper.png",               // Type: string - File name of the thumbnail image (optional)
        "model": "Damper.glb"                    // Type: string - File name of the 3D model (in glb format) (required)
    },
    "metadata": {                                // Not required (optional)
        "description": "Large air vent",         // Type: string - Description of the component (optional)
        "capacity": "500cfm",                    // Type: string - Capacity of the damper in cubic feet per minute (optional)
        "size": "257x64x225",                    // Type: string - Size of the damper (optional)
        "material": "Galvanized Steel"           // Type: string - Material the damper is made of (optional)
    },
    "attributes": {                              // Required
        // Type: object - Sets the transforms of the target objects. Example: Adjusting airflow by transforming on the damper's vent panels
        "setTargetTransforms": {                
            "value": 2,                          // Type: number - Default value for airflow (required)
            "step": 1,                           // Type: number - Step value for adjusting the airflow (required)
            "min": 0,                            // Type: number - Minimum allowed value for airflow (required)
            "max": 4,                            // Type: number - Maximum allowed value for airflow (required)
            "states": [                          // Type: numbers[] - List of state values for the transforms (required)
                0,
                0.3927,
                0.7854,
                1.1781,
                1.5708
            ],
            "targets": [ // Type: strings[] - List of target objects for the transforms (required)
                "child002", 
                "child003", 
                "child004", 
                "child005", 
                "child006"
            ], 
            "axis": "y"                          // Type: string - Axis of transformation (required)
        }
    },
    "object": {                                  // Required
        "position": { 
            "x": 0,                              // Type: number - X (width) coordinate of the object's position (required)
            "y": 0,                              // Type: number - Y (depth) coordinate of the object's position (required)
            "z": 530                             // Type: number - Z (height) coordinate of the object's position (required)
        },
        "rotation": { 
            "x": 0,                              // Type: number - Rotation around the X axis (required)
            "y": 0,                              // Type: number - Rotation around the Y axis (required)
            "z": 0                               // Type: number - Rotation around the Z axis (required)
        },
        "scale": { 
            "x": 1,                              // Type: number - Scale along the X axis (required)
            "y": 1,                              // Type: number - Scale along the Y axis (required)
            "z": 1                               // Type: number - Scale along the Z axis (required)
        },
        "boundingBox": {                         // Required
            "dimensions": {
                "x": 100,                        // Type: number - Bounding box width (X dimension) (required)
                "y": 1072.95,                    // Type: number - Bounding box depth (Y dimension) (required)
                "z": 1000                        // Type: number - Bounding box height (Z dimension) (required)
            },
            "origin": {
                "x": 0,                          // Type: number - X coordinate of the bounding box origin (required)
                "y": -36.5,                      // Type: number - Y coordinate of the bounding box origin (required)
                "z": 0                           // Type: number - Z coordinate of the bounding box origin (required)
            }
        }
    },
    // Type: boolean - Whether this is a component. A duct, end, or joint would be "isComponent": false (required)
    "isComponent": true
}

const genericSensor = {
    "componentId": "r:novo.graphics::GenericSensor",    // Type: string - Unique identifier for the component (required)
    "componentName": "Generic Sensor",                  // Type: string - Name of the component (required)

    "files": {
        "thumbnail": "GenericSensor.png",               // Type: string - File name of the thumbnail image (optional)
        "model": "GenericSensor.glb"                    // Type: string - File name of the 3D model (in glb format) (required)
    },

    "metadata": {                                       // Not required (optional)
        "description": "Generic Sensor",                // Type: string - Description of the component (optional)
        "capacity": "500cfm",                           // Type: string - Capacity of the sensor in cubic feet per minute (optional)
        "size": "257x64x225",                           // Type: string - Size of the sensor (optional)
        "material": "Galvanized Steel"                  // Type: string - Material the sensor is made of (optional)
    },
    
    "attributes": {                                     // Required
        "setInput": {                                   // Type: object - Sets input values for the sensor
            "key": "sensor-reading",                    // Type: string - Key for the sensor input (required if using input)
            "value": 7                                  // Type: number - Default sensor reading (required if using input)
        }
    },
    
    "object": {                                         // Required
        "position": { 
            "x": 0,                                     // Type: number - X (width) coordinate of the object's position (required)
            "y": 0,                                     // Type: number - Y (depth) coordinate of the object's position (required)
            "z": 650                                    // Type: number - Z (height) coordinate of the object's position (required)
        },
        "rotation": { 
            "x": 0,                                     // Type: number - Rotation around the X axis (required)
            "y": 0,                                     // Type: number - Rotation around the Y axis (required)
            "z": 0                                      // Type: number - Rotation around the Z axis (required)
        },
        "scale": { 
            "x": 1,                                     // Type: number - Scale along the X axis (required)
            "y": 1,                                     // Type: number - Scale along the Y axis (required)
            "z": 1                                      // Type: number - Scale along the Z axis (required)
        },
        "boundingBox": {                                // Required
            "dimensions": {
                "x": 120,                               // Type: number - Bounding box width (X dimension) (required)
                "y": 80.5,                              // Type: number - Bounding box depth (Y dimension) (required)
                "z": 400                                // Type: number - Bounding box height (Z dimension) (required)
            },
            "origin": {
                "x": 0,                                 // Type: number - X coordinate of the bounding box origin (required)
                "y": 0,                                 // Type: number - Y coordinate of the bounding box origin (required)
                "z": 70                                 // Type: number - Z coordinate of the bounding box origin (required)
            }
        }
    },
    "isComponent": true,                                // Type: boolean - Whether this is a component (required)
    "componentPosition": "ceiling",                     // Type: string - Position of the component in the scene (required for sensors)
    "componentFacing": "inwards"                        // Type: string - Direction the component is facing (required for sensors)
}

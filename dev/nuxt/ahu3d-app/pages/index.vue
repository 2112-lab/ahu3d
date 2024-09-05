<template>
  <div id="sceneContainer"></div>
</template>

<script>
import { Ahu3D } from '~/../../../';

export default {
  async mounted() {
    // Create an Ahu3D instance.
    const ahu3d = new Ahu3D();

    // Attach a 3d scene to the page, passing an html id an an argument.
    // Example HTML: <div id="sceneContainer"></div>
    ahu3d.attachScene("#sceneContainer");

    // Set your custom configuration for loading component assets.
    const assetConfigs = {
      "assetsPath": "/assets/",
      "componentList": [
        "LinearDuctSliced", 
        "TJointSliced", 
        "LJointSliced",
        "CrossJointSliced", 
        "InsertEndSliced",
        "CapEndSliced", 
        "AirFilter", 
        "AirFlowSensor", 
        "CoolingCoil", 
        "Damper", 
        "Fan", 
        "GenericSensor", 
        "HeatingCoil", 
        "TemperatureSensor"
      ]
    }

    // Load in your component assets into memory, passing in assetConfigs(required) as an argument.
    await ahu3d.loadLibraryFromApp(assetConfigs);

    // Import xeto data and clean it up.
    const mockXeto = this.getMockXeto();
    const cleanedXeto = await ahu3d.preprocessXeto(mockXeto);
    console.log("cleanedXeto:", cleanedXeto);

    const assembly = await ahu3d.calculateAssembly(cleanedXeto);

    // await ahu3d.renderAssembly(assembly);
  },
  methods: {
    getMockXeto() {
      const mockXeto = [
        {
          "graphicLocation": {
            "start": "H8",
            "end": "J8"
          },
          "ducts": [
            "r:novo.graphics::Edge-1",
            "r:novo.graphics::Edge-2",
            "r:novo.graphics::Edge-3",
            "r:novo.graphics::Edge-4",
            "r:novo.graphics::Edge-5",
            "r:novo.graphics::Edge-6"
          ],
          "id": "r:novo.graphics::AHU-3",
          "spec": "r:novo.graphics::AhuGroup",
          "blockStyle": {
            "ductEnds": "none",
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "graphicLocation": {
            "start": "H8",
            "end": "I8"
          },
          "components": [
            "r:novo.graphics::CoolingCoil-2"
          ],
          "id": "r:novo.graphics::Edge-1",
          "spec": "r:novo.graphics::DuctEdge",
          "blockStyle": {
            "ductEnds": "cap",
            "flowDirection": "endToStart",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "graphicLocation": {
            "start": "H8",
            "end": "G8"
          },
          "components": [
            "r:novo.graphics::AirFlowSensor-3"
          ],
          "id": "r:novo.graphics::Edge-2",
          "spec": "r:novo.graphics::DuctEdge",
          "blockStyle": {
            "ductEnds": "cap",
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "graphicLocation": {
            "start": "H8",
            "end": "H9"
          },
          "components": [
            "r:novo.graphics::CoolingCoil-1",
            "r:novo.graphics::AirFlowSensor-2",
            "r:novo.graphics::GenericSensor-1"
          ],
          "id": "r:novo.graphics::Edge-3",
          "spec": "r:novo.graphics::DuctEdge",
          "blockStyle": {
            "ductEnds": "cap",
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "graphicLocation": {
            "start": "H8",
            "end": "H7"
          },
          "components": [
            "r:novo.graphics::HeatingCoil-1",
            "r:novo.graphics::Fan-0",
            "r:novo.graphics::TemperatureSensor-1",
            "r:novo.graphics::GenericSensor-0"
          ],
          "id": "r:novo.graphics::Edge-4",
          "spec": "r:novo.graphics::DuctEdge",
          "blockStyle": {
            "ductEnds": "cap",
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "graphicLocation": {
            "start": "I8",
            "end": "J8"
          },
          "components": [
            "r:novo.graphics::TemperatureSensor-0",
            "r:novo.graphics::AirFlowSensor-1"
          ],
          "id": "r:novo.graphics::Edge-5",
          "spec": "r:novo.graphics::DuctEdge",
          "blockStyle": {
            "ductEnds": "cap",
            "flowDirection": "endToStart",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "graphicLocation": {
            "start": "I8",
            "end": "I9"
          },
          "components": [
            "r:novo.graphics::HeatingCoil-0",
            "r:novo.graphics::CoolingCoil-0",
            "r:novo.graphics::AirFlowSensor-0"
          ],
          "id": "r:novo.graphics::Edge-6",
          "spec": "r:novo.graphics::DuctEdge",
          "blockStyle": {
            "ductEnds": "cap",
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::AirFlowSensor-0",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::AirFlowSensor",
          "blockStyle": {
            "flowDirection": "endToStart",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::CoolingCoil-0",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::CoolingCoil",
          "blockStyle": {
            "flowDirection": "endToStart",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::HeatingCoil-0",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::HeatingCoil",
          "blockStyle": {
            "flowDirection": "endToStart",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::AirFlowSensor-1",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::AirFlowSensor",
          "blockStyle": {
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::TemperatureSensor-0",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::TemperatureSensor",
          "blockStyle": {
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::GenericSensor-0",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::GenericSensor",
          "blockStyle": {
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::TemperatureSensor-1",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::TemperatureSensor",
          "blockStyle": {
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::Fan-0",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::Fan",
          "blockStyle": {
            "flowDirection": "endToStart",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::HeatingCoil-1",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::HeatingCoil",
          "blockStyle": {
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::GenericSensor-1",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::GenericSensor",
          "blockStyle": {
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::AirFlowSensor-2",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::AirFlowSensor",
          "blockStyle": {
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::CoolingCoil-1",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::CoolingCoil",
          "blockStyle": {
            "flowDirection": "endToStart",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::AirFlowSensor-3",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::AirFlowSensor",
          "blockStyle": {
            "flowDirection": "endToStart",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        },
        {
          "id": "r:novo.graphics::CoolingCoil-2",
          "spec": "r:novo.graphics::Component",
          "componentId": "r:novo.graphics::CoolingCoil",
          "blockStyle": {
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 250,
              "endSpace": 250
            }
          }
        }
      ]
      return mockXeto
    },
    async instantiateMockComponents(ahu3d) {
      const airFilter = await ahu3d.loadComponent("AirFilter");
      airFilter.position.y += 1000;

      const airFlowSensor = await ahu3d.loadComponent("AirFlowSensor");
      airFlowSensor.position.y -= 1000;

      const coolingCoil = await ahu3d.loadComponent("CoolingCoil");
      coolingCoil.position.x += 2000;
      coolingCoil.position.y -= 1000;

      const damper = await ahu3d.loadComponent("Damper");
      damper.position.x += 1000;
      damper.position.y += 1000;

      const fan = await ahu3d.loadComponent("Fan");
      fan.position.x -= 1000;
      fan.position.y -= 1000;

      const genericSensor = await ahu3d.loadComponent("GenericSensor");
      genericSensor.position.x += 2000;
      genericSensor.position.y += 1000;    

      const heatingCoil = await ahu3d.loadComponent("HeatingCoil");
      heatingCoil.position.x -= 1000;
      heatingCoil.position.y += 1000;

      const temperatureSensor = await ahu3d.loadComponent("TemperatureSensor");
      temperatureSensor.position.x += 1000;
      temperatureSensor.position.y -= 1000;

      fan.setAnimation(1);
      damper.setTargetTransforms(2);
    }
  }
}
</script>

<style>
  body {
    margin:0;
    background:#111;
  }
</style>

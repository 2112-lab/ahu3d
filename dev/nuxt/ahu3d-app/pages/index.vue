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
      "componentList": ["AirFilter", "AirFlowSensor", "CoolingCoil", "Damper", "Fan", "GenericSensor", "HeatingCoil", "TemperatureSensor" /** Continuing list here **/]
    }

    // Load in your component assets into memory, passing in assetConfigs(required) as an argument.
    await ahu3d.loadLibraryFromApp(assetConfigs);

    // Import xeto data and clean it up.
    const mockXeto = this.getMockXeto();
    const cleanedXeto = await ahu3d.loadXeto(mockXeto);
    console.log("this.cleanedXeto:", cleanedXeto);

    // Instantiate your component meshes into the page's 3d scene.
    this.instantiateMockComponents(ahu3d);
  },
  methods: {
    getMockXeto() {
      const mockXeto = [
        {
          "id": "r:novo.graphics::AHU-1",
          "spec": "r:novo.graphics::AhuGroup",
          "graphicLocation": {
            "start": "A1",
            "end": "B1"
          },
          "ducts": [
            "r:novo.graphics::Edge-1"
          ],
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
          "id": "r:novo.graphics::Edge-1",
          "spec": "r:novo.graphics::DuctEdge",
          "graphicLocation": {
            "start": "A1",
            "end": "B1"
          },
          "components": [
            "r:novo.graphics::Fan-1"
          ],
          "blockStyle": {
            "ductEnds": "insert",
            "flowDirection": "startToEnd",
            "componentPadding": {
              "startSpace": 200,
              "endSpace": 200
            }
          }
        },

        {
          "id": "r:novo.graphics::Fan-1",
          "spec": "r:novo.graphics::AhuComponent",
          "componentId": "r:novo.graphics::Fan",
          "blockStyle": {
            "flowDirection": "endToStart",
            "componentPadding": {
              "startSpace": 300,
              "endSpace": 300
            }
          }
        }
      ];
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

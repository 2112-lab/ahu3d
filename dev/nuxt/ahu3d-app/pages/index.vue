<template>
  <div id="pageWrapper">
    <div id="sceneContainer"></div>

    <div id="buttonContainer">
      <span style="margin-right:6px">Load Xeto Samples:</span>
      <button id="button" type="button" @click="loadMockXeto(0)">1</button>
      <button id="button" type="button" @click="loadMockXeto(1)">2</button>
      <button id="button" type="button" @click="loadMockXeto(2)">3</button>
      <button id="button" type="button" @click="loadMockXeto(3)">4</button>
      <button id="button" type="button" @click="loadMockXeto(4)">5</button>
      <button id="button" type="button" @click="loadMockXeto(5)">6</button>
    </div>
  </div>
</template>

<script>
import { Ahu3D } from '~/../../../';

export default {
  async mounted() {
    if(process.env.NODE_ENV === 'development') {
      const pageWrapper = document.getElementById("pageWrapper");
      if (pageWrapper) {
        pageWrapper.style.background = "#111";
      }
      const buttonContainer = document.getElementById("buttonContainer");
      if (buttonContainer) {
        buttonContainer.style.color = "white";
      }
    }

    // Create an Ahu3D instance.
    this.ahu3d = new Ahu3D(0.667, false, false);

    // Attach a 3d scene to the page, passing an html id an an argument.
    // Example HTML: <div id="sceneContainer"></div>
    this.ahu3d.attachScene("#sceneContainer");

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
    await this.ahu3d.loadLibraryFromApp(assetConfigs);  
  },
  methods: {
    // Load mock xeto data. (For development, not production.)
    async loadMockXeto(index = 0) {
      console.log("loadMockXeto started");
      const mockXeto = this.getMockXeto(index);
      await this.ahu3d.loadXeto(mockXeto);
    },
    getMockXeto(index = 0) {
      const mockXetoArray = [
        require("~/static/mock-data/xeto/instances-xeto-Cross1-3.0.json"), // 0
        require("~/static/mock-data/xeto/instances-xeto-sample-1.json"), // 1
        require("~/static/mock-data/xeto/instances-xeto-sample-2.json"), // 2
        require("~/static/mock-data/xeto/instances-xeto-sample-3.json"), // 3
        require("~/static/mock-data/xeto/instances-xeto-fail-sample.json"), // 4
        require("~/static/mock-data/xeto/instances-xeto-sample-4.json"), // 5
      ];

      return mockXetoArray[index];
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
    background:#333;
  }

  #pageWrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh; /* Full height of the viewport */
    background:#eee;
  }

  #sceneContainer {
    position: relative;
    background: #333; /* Optional background color for visibility */
  }

  #buttonContainer {
    margin-top: 20px; /* Adds some space between the sceneContainer and buttons */
  }
</style>

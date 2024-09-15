<template>
  <v-app>
    <div id="pageWrapper">
      <!-- Title and Subtitle -->
      <div id="titleContainer">
        <h1>Ahu3d Module</h1>
        <h2 style="margin-top:20px;">Parametric Air Handling Unit</h2>
      </div>
  
      <!-- Description -->
      <div id="descriptionContainer">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        <p>Vivamus lacinia odio vitae vestibulum vestibulum.</p>
        <p>Cras vehicula, mi eget feugiat volutpat, ligula erat.</p>
      </div>
  
      <!-- Scene Container -->
      <div id="sceneContainer"></div>
  
      <v-row class="mt-1" style="height:0px;" no-gutters>

        <!-- <v-btn>
          Start
        </v-btn> -->
  
        <!-- <div id="buttonContainer">
          <span style="margin-right:6px">Load Xeto Samples:</span>
          <button id="button" type="button" @click="loadMockXeto(0)">1</button>
          <button id="button" type="button" @click="loadMockXeto(1)">2</button>
          <button id="button" type="button" @click="loadMockXeto(2)">3</button>
          <button id="button" type="button" @click="loadMockXeto(3)">4</button>
          <button id="button" type="button" @click="loadMockXeto(4)">5</button>
          <button id="button" type="button" @click="loadMockXeto(5)">6</button>
        </div>    -->
  
      </v-row>
  
      <footer>
        Apps: 
          <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-api.config3d.net/">API</a>, 
          <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-editor.config3d.net/">Editor</a>, 
          <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-react.config3d.net/">React</a> <span class="mx-4">|</span> 
        Documentation: 
          <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-docs.s3.amazonaws.com/Ahu3D.html">Ahu3D Module</a>,
          <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-docs.s3.amazonaws.com/Module+Configs.pdf">Module Configs</a>,
          <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-docs.s3.amazonaws.com/Component+Library.pdf">Component Library</a>
      </footer>
  
    </div>
  </v-app>
  </template>
  
  <script>
  import { Ahu3D } from '~/../../../';
  
  export default {
    data() {
      return {
        ahu3d: null,
        menu: false, // controls the visibility of the dropdown menu
        selectedOptions: [], // stores selected checkboxes
        options: [],
        sliderValue: 0, // Default value for the slider
        renderedAssembly: [],
        isGridEnabled: true,
        isTooltipEnabled: true,
        displayedAttributeValue: 0,
        mockXetoArray: [
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-1-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-2-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-3-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-4-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-5-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-6-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-7-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-8-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-9-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-10-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-11-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-12-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-13-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-14-Xeto.json"),
          require("~/static/mock-data/xeto/2024-09-13_18-57-41_AHU-15-Xeto.json"),
        ],
      };
    },
    async mounted() {
  
      // Initialize Ahu3D instance
      this.ahu3d = new Ahu3D({
        scene: {
          renderer: {
            size: {
              width: 850,
              height: 480
            }
          }
        }
      });
  
      // Attach 3D scene to the page
      this.ahu3d.attachScene("#sceneContainer");
  
      // A required object for defining component assets path and keys. 
      const assetConfigs = {
        assetsPath: "https://ahu3d-assets.s3.amazonaws.com/assets/", // Remote path that points to the component library of json and glb files.
        componentList: [ // The complete list of keys for all components, ducts, ends, and joints. Include all keys for what you intend to render in assemblies.
          "LinearDuctSliced", "TJointSliced", "LJointSliced", "CrossJointSliced", 
          "InsertEndSliced", "CapEndSliced", "AirFilter", "AirFlowSensor", 
          "CoolingCoil", "Damper", "Fan", "GenericSensor", "HeatingCoil", 
          "TemperatureSensor"
        ]
      };
  
      await this.ahu3d.loadLibrary(assetConfigs); // Loads the s3 assets into memory.

      this.iterateAllXetos();
  
      // const fan = await this.ahu3d.loadComponent("Fan");
      // fan.position.x += 1000;
      // fan.setAttribute(1);
      // fan.setTransparency(0.1);
      
      // const damper = await this.ahu3d.loadComponent("Damper");
      // damper.position.x -= 1000;
      // damper.setAttribute(0);
      
    },
    methods: {
      async iterateAllXetos() {
        for (let i = 0; i < this.mockXetoArray.length; i++) {
          await this.loadMockXeto(i);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay of 2 seconds between iterations
        }
        console.log("Finished Xeto Tests");
      },
      async loadMockXeto(index = 0) {
        const mockXeto = this.getMockXeto(index);
        this.renderedAssembly = await this.ahu3d.loadXeto(mockXeto);
        console.log("this.renderedAssembly:", this.renderedAssembly);
        if(this.renderedAssembly !== null) {
          this.options = [];
          for(const object3d of this.renderedAssembly) {
            if(object3d.userData.component.isComponent) {
              this.options.push({
                text: object3d.userData.component.componentId,
                value: object3d.userData.component.componentId,
                object3d:object3d,
                isSelected: false,
              });
            }
          }
          console.log("this.options:", this.options);
        }
      },
      getMockXeto(index = 0) {
        return this.mockXetoArray[index];
      },
      async instantiateMockComponents(ahu3d) {
        const components = [
          { name: "AirFilter", x: 0, y: 1000 },
          { name: "AirFlowSensor", x: 0, y: -1000 },
          { name: "CoolingCoil", x: 2000, y: -1000 },
          { name: "Damper", x: 1000, y: 1000 },
          { name: "Fan", x: -1000, y: -1000 },
          { name: "GenericSensor", x: 2000, y: 1000 },
          { name: "HeatingCoil", x: -1000, y: 1000 },
          { name: "TemperatureSensor", x: 1000, y: -1000 }
        ];
        
        for (const component of components) {
          const loadedComponent = await ahu3d.loadComponent(component.name);
          loadedComponent.position.x += component.x;
          loadedComponent.position.y += component.y;
        }
  
        const fan = await ahu3d.loadComponent("Fan");
        fan.setAnimation(1);
        
        const damper = await ahu3d.loadComponent("Damper");
        damper.setTargetTransforms(2);
      }
    }
  }
  </script>
  
  <style>
    body {
      margin: 0;
      background: #333;
    }
  
    #pageWrapper {
      display: flex;
      flex-direction: column;
      justify-content: space-between; /* Adjust this to distribute space */
      align-items: center;
      height: 100vh;
      padding-bottom: 40px; /* Add space to avoid overlap with footer */
      box-sizing: border-box; /* Ensure padding is included in height */
      border: 1px solid black;
      background: #eee;
      overflow-y: auto; /* Enable scrolling if content overflows */
    }
  
    #titleContainer {
      text-align: center;
      margin-top:40px;
      margin-bottom:40px;
      line-height: 0.5;
    }
  
    #descriptionContainer {
      text-align: center;
      margin-top: 10px;
      margin-bottom: 20px;
      line-height: 0.3;
    }
  
    #sceneContainer {
      position: relative;
      background: #333;
      border: 1px solid #5555; /* Border around the scene */
    }
  
    #buttonContainer {
      margin-top: 20px;
    }
  
    footer {
      position: absolute;
      padding:4px;
      padding-left:10px;
      left: 0px;
      bottom: 0px;
      border-top:1px solid #5555; 
      width:100%;
    }
  
    #button {
      border:1px solid #5555;
      width:30px;
      height:30px;
    }
  
    .v-input__control{
      height:30px;
      width:500px;
      margin-left:5px;
    }
  </style>
  
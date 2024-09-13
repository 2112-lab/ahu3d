<template>
  <v-app>
    <div id="pageWrapper">
      <!-- Title and Subtitle -->
      <div id="titleContainer">
        <h1>Ahu3d Module</h1>
        <h2 style="margin-top:20px;">Parametric Air Handling Unit</h2>
      </div>

      <v-row no-gutters justify="end">
        <!-- Scene Containers -->
        <div>
          <div id="sceneContainer1"></div>
          <div id="sceneContainer2"></div>
        </div>

        <div class="ml-6">
          <div id="buttonContainer" class="mb-2">
            <span style="margin-right:6px">Display Xeto Samples:</span>
            <button id="button" type="button" @click="displayMockXeto(0)">1</button>
            <button id="button" type="button" @click="displayMockXeto(1)">2</button>
            <button id="button" type="button" @click="displayMockXeto(2)">3</button>
            <button id="button" type="button" @click="displayMockXeto(3)">4</button>
            <button id="button" type="button" @click="displayMockXeto(4)">5</button>
          </div>
          
          <textarea 
            class="jsonDisplay" 
            style="border:2px solid #ccc; overflow:auto; white-space:nowrap; position:relative; z-index:10;" 
            v-model="jsonDisplayData">
          </textarea>
          
          <v-radio-group
            v-model="ahu3dInstanceKey"
            row
            class="mt-0 mb-1"
            :disabled="jsonDisplayData === ''"
          >
            <v-radio
              label="Primary"
              value="ahu3d_primary"
            ></v-radio>
            <v-radio
              label="Secondary"
              value="ahu3d_secondary"
            ></v-radio>
          </v-radio-group>

          <v-btn @click="loadMockXeto" :disabled="jsonDisplayData === ''">
            Load Xeto
          </v-btn> 

        </div>
      </v-row>
  
      <footer>
        Documentation: <a href="https://d7m20j52d3356.cloudfront.net/">Ahu3D</a>
      </footer>
  
    </div>
  </v-app>
  </template>
  
  <script>
  import { Ahu3D } from '~/../../../';
  
  export default {
    data() {
      return {
        menu: false, // controls the visibility of the dropdown menu
        selectedOptions: [], // stores selected checkboxes
        options: [],
        sliderValue: 0, // Default value for the slider
        renderedAssembly: [],
        jsonDisplayData: '',
        ahu3dInstanceKey: 'ahu3d_primary',
      };
    },
    async mounted() {
      this.instantiatePrimaryScene();
      this.instantiateSecondaryScene();
    },
    methods: {
      async instantiatePrimaryScene() {
        // Initialize Ahu3D instance
        this.ahu3d_primary = new Ahu3D({
          scene: {
            renderer: {
              size: {
                width: 725,
                height: 340
              }
            }
          },
          ui: {
            showTooltip: false
          }
        });
    
        // Attach 3D scene to the page
        this.ahu3d_primary.attachScene("#sceneContainer1");
    
        // Load component assets into memory
        const assetConfigs = {
          assetsPath: "https://ahu3d-assets.s3.amazonaws.com/assets/",
          componentList: [
            "LinearDuctSliced", "TJointSliced", "LJointSliced", "CrossJointSliced", 
            "InsertEndSliced", "CapEndSliced", "AirFilter", "AirFlowSensor", 
            "CoolingCoil", "Damper", "Fan", "GenericSensor", "HeatingCoil", 
            "TemperatureSensor"
          ]
        };
    
        await this.ahu3d_primary.loadLibrary(assetConfigs);
      },
      async instantiateSecondaryScene() {
        // Initialize Ahu3D instance
        this.ahu3d_secondary = new Ahu3D({
          scene: {
            renderer: {
              size: {
                width: 725,
                height: 340
              }
            }
          },
          ui: {
            showTooltip: false
          }
        });
    
        // Attach 3D scene to the page
        this.ahu3d_secondary.attachScene("#sceneContainer2");
    
        // Load component assets into memory
        const assetConfigs = {
          assetsPath: "https://ahu3d-assets.s3.amazonaws.com/assets/",
          componentList: [
            "LinearDuctSliced", "TJointSliced", "LJointSliced", "CrossJointSliced", 
            "InsertEndSliced", "CapEndSliced", "AirFilter", "AirFlowSensor", 
            "CoolingCoil", "Damper", "Fan", "GenericSensor", "HeatingCoil", 
            "TemperatureSensor"
          ]
        };
    
        await this.ahu3d_secondary.loadLibrary(assetConfigs);
      },
      displayMockXeto(index = 0) {
        const mockXeto = this.getMockXeto(index);
        this.jsonDisplayData = JSON.stringify(mockXeto, null, 2);
      },
      async loadMockXeto() {

        const jsonDisplayData = JSON.parse(this.jsonDisplayData);
        
        this.renderedAssembly = await this[this.ahu3dInstanceKey].loadXeto(jsonDisplayData);
        console.log("this.renderedAssembly:", this.renderedAssembly);
  
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
  
        
      },
      getMockXeto(index = 0) {
        const mockXetoArray = [
          require("~/static/mock-data/xeto/instances-xeto-Cross1-3.0.json"),
          require("~/static/mock-data/xeto/instances-xeto-sample-1.json"),
          require("~/static/mock-data/xeto/instances-xeto-sample-2.json"),
          require("~/static/mock-data/xeto/instances-xeto-sample-3.json"),
          require("~/static/mock-data/xeto/instances-xeto-sample-4.json"),
        ];
        return mockXetoArray[index];
      },
    }
  }
  </script>
  
  <style>
    body {
      margin: 0;
      background: #333;
    }
  
    #pageWrapper {
      position: relative;
      z-index: 0; /* Ensure it's behind interactive elements */
      display: flex;
      flex-direction: column;
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
  
    #sceneContainer1 {
      margin-top: 20px;
      margin-bottom: 10px;
      background: #333;
      border: 1px solid #5555; /* Border around the scene */
    }

    #sceneContainer2 {
      background: #333;
      border: 1px solid #5555; /* Border around the scene */
    }
  
    #buttonContainer {
      margin-top: 20px;
    }
  
    footer {
      position: absolute;
      padding: 4px;
      padding-left: 10px;
      left: 0px;
      bottom: 0px;
      border-top: 1px solid #5552; 
      width: calc(100% - 10px);
      margin-left: 5px;
      margin-right: 5px;
    }
  
    #button {
      border:1px solid #5555;
      width:30px;
      height:30px;
    }
  
    .v-input__control{
      height:30px;
      width:500px;
    }

    .jsonDisplay {
      width: 370px;
      height: 525px;
      font-family: monospace;
      font-size: 12px;
      resize: none;
    }
    textarea:focus {
        outline: none;
        border: none;
        box-shadow: none;
    }
  </style>
  
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
  
        <div id="buttonContainer">
          <span style="margin-right:6px">Load Xeto Samples:</span>
          <button id="button" type="button" @click="loadMockXeto(0)">1</button>
          <button id="button" type="button" @click="loadMockXeto(1)">2</button>
          <button id="button" type="button" @click="loadMockXeto(2)">3</button>
          <button id="button" type="button" @click="loadMockXeto(3)">4</button>
          <button id="button" type="button" @click="loadMockXeto(4)">5</button>
          <button id="button" type="button" @click="loadMockXeto(5)">6</button>
        </div>
  
        <div class="ml-6 mt-4">
          <v-menu
            v-model="menu"
            :close-on-content-click="false"
            max-width="290"
            offset-y
            top
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                v-on="on"
                dense
                :disabled="renderedAssembly.length === 0 || isTooltipEnabled"
              >
                Select Options
              </v-btn>
            </template>
  
            <v-list dense>
              <v-list-item-group v-for="option in options" :key="option.value">
                <v-list-item>
                  <v-list-item-content>
                    <v-checkbox
                      v-model="option.isSelected"
                      :label="option.text.split('::')[1]"
                      dense
                      @change="updateSelectedOptions"
                    ></v-checkbox>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-group>
            </v-list>
  
          </v-menu>
  
          
        </div>
  
        <div>
          <v-slider
            v-model="sliderValue"
            min="0"
            max="1"
            label="Transparency"
            thumb-label=""
            step="0.1"
            style="width:300px"
            class="ml-6 mb-0 mt-5"
            discrete
            :disabled="selectedOptions.length === 0 || isTooltipEnabled"
            @input="updateTransparencyToSelected"
          ></v-slider>
        </div>
  
        <div class="ml-4 mt-5" :style="(selectedOptions.length !== 1) ? 'color:#0005':'color:#000a'">
          <span>
            Set Attribute:
          </span>
          <v-btn 
            x-small 
            fab 
            class="ml-1 mr-1" 
            style="font-size:24px; padding-bottom:1px" 
            @click="setAttributeOnSelected(-1)"
            :disabled="selectedOptions.length !== 1 || isTooltipEnabled"
          >
            -
          </v-btn>
          <span>{{ displayedAttributeValue }}</span>
          <v-btn 
            x-small 
            fab 
            class="ml-1 mr-1"
            style="font-size:16px; padding-bottom:0px" 
            @click="setAttributeOnSelected(1)"
            :disabled="selectedOptions.length !== 1 || isTooltipEnabled"
          >
            +
          </v-btn>
        </div>     
  
      </v-row>
  
      <v-row no-gutters>
        <v-switch
          v-model="isGridEnabled"
          label="Grid"
          @change="toggleGrid()"
          style="width:90px"
        ></v-switch>
        <v-switch
          v-model="isTooltipEnabled"
          label="Toolbar"
          @change="toggleTooltip()"
          style="width:90px"
        ></v-switch>
      </v-row>
  
      <!-- <div class="mt-3">
        <strong>Selected Options:</strong> {{ selectedOptions }}
      </div> -->
  
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
        ahu3d: null,
        menu: false, // controls the visibility of the dropdown menu
        selectedOptions: [], // stores selected checkboxes
        options: [],
        sliderValue: 0, // Default value for the slider
        renderedAssembly: [],
        isGridEnabled: true,
        isTooltipEnabled: true,
        displayedAttributeValue: 0,
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
      
    },
    methods: {
      toggleGrid() {
        this.ahu3d.toggleGrid();
      },
      toggleTooltip() {
        this.ahu3d.toggleTooltip()
      },
      setAttributeOnSelected(factor) {
        console.log("setAttributeOnSelected:", factor);
  
        for(const option of this.options) {
          if(option.isSelected) {
            const object3d = option.object3d;
  
            const ahuComponentAttributes = object3d.userData.component.attributes;
            const attrKeys = Object.keys(ahuComponentAttributes);
            const methodKey = attrKeys[0];
  
            const min = ahuComponentAttributes[methodKey].min;
            const max = ahuComponentAttributes[methodKey].max;
            const step = ahuComponentAttributes[methodKey].step;
  
            const newValue = ahuComponentAttributes[methodKey].value + (step * factor);
  
            if(newValue >= min && newValue <= max) {
              object3d.setAttribute(newValue);
              this.displayedAttributeValue = newValue;
            }
          }
        }
      },
      displayAttributeValue() {
        console.log("this.options:", this.options);
        for(const option of this.options) {
          console.log("option:", option);
          if(option.isSelected) {
            const ahuComponentAttributes = option.object3d.userData.component.attributes;
            const attrKeys = Object.keys(ahuComponentAttributes);
            const methodKey = attrKeys[0];
  
            this.displayedAttributeValue = ahuComponentAttributes[methodKey].value;
            break;
          }
        }
      },
      updateSelectedOptions() {
        this.selectedOptions = this.options
          .filter(option => option.isSelected)
          .map(option => option.value);
          this.displayAttributeValue();
      },
      updateTransparencyToSelected() {
        for(const option of this.options) {
          if(option.isSelected) {
            const component = option.object3d;
            component.setTransparency(1 - this.sliderValue);
          }
        }
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
  
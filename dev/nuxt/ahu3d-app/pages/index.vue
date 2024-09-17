<template>
  <v-app id="appContainer">
    <div id="pageWrapper">
      <!-- Title and Subtitle -->
      <div id="titleContainer">
        <h1>Ahu3D Module</h1>
      </div>
  
      <!-- Description -->
      <div id="descriptionContainer">
        <p>The ahu3d module provides parametric 3d renderings of air handling units, declared in the Xeto format.</p>
      </div>
  
      <!-- Scene Container -->
      <div id="sceneContainer"></div>
  
    </div>
    <section class="links-section">
        <div style="margin-top: -60px;">
          <h4>Demo Apps</h4>
          <ul>
            <li>
              <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-api.2112-lab.com/">ahu3d-api.2112-lab.com</a>
              - Demo app showcasing API usage, through simple UI.
            </li>
            <li>
              <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-editor.2112-lab.com/">ahu3d-editor.2112-lab.com</a>
              - Demo app showcasing multiple Ahu3d scene instances.
            </li>
            <li>
              <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-public.config3d.xyz/">ahu3d-public.2112-lab.com</a>
              - Demo app showcasing public install and deployment of Ahu3d module.
            </li>
            <li>
              <a target="_blank" rel="noopener noreferrer" href="https://ahu3d-react.2112-lab.com/">ahu3d-react.2112-lab.com</a>
              - Demo apps showcasing React deployment of Ahu3d.
            </li>
          </ul>
        </div>
        <div style="margin-top: 30px;">
          <h4>Documentation</h4>
          <ul>
            <li>
              <a target="_blank" rel="noopener noreferrer" 
                href="https://docs.google.com/document/d/1ioLP9HOlI0DK3IQX0SOHE9oWRklSPPBnmla5xpRQnxE/edit"
              >Ahu3D Installation
              </a>
            </li>
            <li>
              <a target="_blank" rel="noopener noreferrer" 
                href="https://docs.google.com/document/d/1zUB6131M7bpFOJWVdgIbgG64o6BgSs24YJjQHbds5Eo/edit"
              >Ahu3D Usage
              </a>
                
            </li>
            
            <li>
              <a target="_blank" rel="noopener noreferrer" 
                href="https://ahu3d-docs.s3.amazonaws.com/Ahu3D.html"
              >Ahu3D API Documentation</a>
            </li>
            <li>
              <a target="_blank" rel="noopener noreferrer" 
                href="https://docs.google.com/document/d/1wwrTfEMKlB3ui6VUvGnHBAV69nk_kF0E0ROgrb-T7wk/edit?usp=drive_link"
              >Ahu3D Configuration
              </a>
            </li>
            <li>
              <a target="_blank" rel="noopener noreferrer" 
                href="https://docs.google.com/document/d/18p2HH0qPRwzycMW7K7ZT-QQTry8P59faajqZAXVuyHQ/edit#heading=h.45d8lonrbfcv"
              >Ahu3D Component Library
              </a>
            </li>
          </ul>
        </div>
      </section>

      <v-row no-gutters justify="center">
        <footer style="font-size: 13px;">
          PROPERTY OF COGNITIVE DYNAMICS LTD. - ALL RIGHTS RESERVED - 2024.
        </footer>
      </v-row>

      
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

      this.ahu3d.toggleGrid();
  
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
    },
    methods: {
      async iterateAllXetos() {
        let iterateCount = 0;
        let iterateLimit = 500;
        let i = 0;
        while (iterateCount < iterateLimit) {
          await this.loadMockXeto(i);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay of 1 second(s) between iterations
          i++;
          if(i >= this.mockXetoArray.length) {
            i = 0;
          }
          iterateCount++;
        }
        console.log("Finished Xeto Tests");
      },
      async loadMockXeto(index = 0) {
        const mockXeto = this.mockXetoArray[index];
        await this.ahu3d.loadXeto(mockXeto);

        // this.ahu3d.setAttribute("Fan-0", 1);
        // this.ahu3d.setTransparency("Fan-0", 0.5);
      },
    }
  }
  </script>
  
  <style>  
    #pageWrapper {
      display: flex;
      flex-direction: column;
      justify-content: space-between; /* Adjust this to distribute space */
      align-items: center;
      padding-bottom: 40px;
      box-sizing: border-box; /* Ensure padding is included in height */
      overflow-y: auto; /* Enable scrolling if content overflows */
    }
  
    #titleContainer {
      text-align: center;
      margin-top:40px;
      margin-bottom:40px;
      line-height: 1;
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

    .links-section {
      padding:60px;
      gap: 10px;
    }

    .links-section h4 {
      margin-bottom: 5px; /* Space between heading and the list */
    }

    .links-section ul {
      padding: 0;
      margin: 0;
      margin-left:17px;
    }

    .links-section ul li {
      margin-bottom: 5px; /* Space between items */
    }

    .links-section ul li a {
      text-decoration: none; /* Remove underline */
      color: #007bff; /* Optional: style the link */
      display: inline-block; /* Ensures alignment */
      font-weight: bold; /* Make the links stand out */
    }

    .links-section ul li a:hover {
      text-decoration: underline; /* Add underline on hover */
    }

    .links-section ul li {
      font-size: 14px; /* Optional: adjust text size */
      line-height: 1.4; /* Ensure good spacing for text */
    }
  </style>
  
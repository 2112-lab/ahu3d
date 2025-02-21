/**
 * @fileoverview FlowControl module handles the processing and rendering of Air Handling Unit (AHU)
 * data in both 2D and 3D contexts. It manages the conversion of XETO data into visualizable
 * geometry, handles duct systems, joints, and component placement, and coordinates the rendering
 * process across different output modes.
 * 
 * @module FlowControl
 * @requires ./globals
 * @requires ../Numerics/Ducts
 * @requires ../3D/Mesh3D
 * @requires ../3D/Geometry/Joints/Geometry_3D_Joints_Cross
 * @requires ../3D/Geometry/Joints/Geometry_3D_Joints_T
 * @requires ../3D/Geometry/Joints/Geometry_3D_Joints_L
 * @requires ../3D/Geometry/Joints/Geometry_3D_Joints_Colinear
 * @requires ../Numerics/Ends
 * @requires ../2D/Canvas2D
 * @requires ../3D/Geometry/Joints/Geometry_3D_Joints_Utils
 */

import { sharedData } from "./globals.js";
import Ducts from "../Numerics/Ducts.js";
import Mesh3D from "../3D/Mesh3D.js";
import Geometry_3D_Joints_Cross from "../3D/Geometry/Joints/Geometry_3D_Joints_Cross.js";
import Geometry_3D_Joints_T from "../3D/Geometry/Joints/Geometry_3D_Joints_T.js";
import Geometry_3D_Joints_L from "../3D/Geometry/Joints/Geometry_3D_Joints_L.js";
import Geometry_3D_Joints_Colinear from "../3D/Geometry/Joints/Geometry_3D_Joints_Colinear.js";
import Ends from "../Numerics/Ends.js";
import Canvas2D from "../2D/Canvas2D.js";
import { calculateJointCenter } from "../3D/Geometry/Joints/Geometry_3D_Joints_Utils.js";

export default class FlowControl {
    /**
     * Creates an instance of FlowControl.
     * Initializes all necessary geometry handlers and rendering components.
     */
    constructor() {
        // Store for processed XETO data
        this.cleanedXeto = null;
        // Dictionary for managing duct system information
        this.ductsDictionary = null;
        // Initialize all required geometry and rendering handlers
        this.Mesh3D = new Mesh3D();
        this.Geometry_3D_Joints_Cross = new Geometry_3D_Joints_Cross();
        this.Geometry_3D_Joints_T = new Geometry_3D_Joints_T();
        this.Geometry_3D_Joints_L = new Geometry_3D_Joints_L();
        this.Geometry_3D_Joints_Colinear = new Geometry_3D_Joints_Colinear();
        this.Canvas2D = new Canvas2D();
    }

    /**
     * Primary entry point for processing and rendering AHU data.
     * @param {Object} cleanedXeto - Processed XETO data containing AHU specifications
     * @param {string} outputMode - Desired output mode ('numeric', 'only2D', 'full2D', 'only3D', 'full3D', 'all')
     * @returns {Object} Processed AHU object with all computed data
     */
    async runAhu3D(cleanedXeto, outputMode) {
        // Store the cleaned XETO data for processing
        this.cleanedXeto = cleanedXeto;
        this.setAhuObject();

        outputMode = outputMode.toLowerCase();

        // Handle different output modes for rendering and processing
        if (outputMode == "numeric") {
            // Return only numerical data without any rendering
            this.populate3D();
        } 
        else if (outputMode == "only2d") {
            this.populate3D();

            // Process 2D data without rendering
            await this.populate2D();
        } 
        else if (outputMode == "full2d") {
            this.populate3D();
            
            // Process and render 2D visualization
            await this.populate2D();
            this.render2D();
        } 
        else if (outputMode == "only3d") {
            // Process 3D data without rendering
            this.populate3D();
            await this.render3D();
            console.log("this.ahuObject:", JSON.stringify(this.ahuObject["3d"].components.meshes, null, 2));
            return this.ahuObject["3d"].components.meshes;
        } 
        else if (outputMode == "full3d") {
            // Process and render 3D visualization
            this.populate3D();
            await this.render3D();
        } 
        else if (outputMode == "all") {
            // Process and render both 2D and 3D visualizations
            this.populate3D();
            await this.render3D();

            await this.populate2D();
            await this.render2D();
        } 

        return this.ahuObject;
    }

    /**
     * Initializes and structures the main AHU object with all required properties and containers.
     * @returns {Object} Initialized AHU object
     */
    setAhuObject() {
        // Filter and store AHU group data from XETO
        this.ahuGroup = this.cleanedXeto.filter(child => child.spec.includes('AhuGroup'))[0];

        // Initialize main AHU object structure with all required properties
        this.ahuObject = {
            id: "ahu-1",
            defaults: sharedData.moduleConfigs,
            edges: {},
            xeto: this.cleanedXeto,
            xetoDictionary: {
                ahuGroup: this.ahuGroup,
                edges: {},
                components: {}
            },
            associations: {
                ducts: {},
                components: {},
                joints: {},
                ends: {},
                arrows: {},
                labels: {},
            },
            resources: {
                ducts: {},
                components: {},
                joints: {},
                ends: {},
            },
            auxiliary: {
                "3d": {
                    arrows: {},
                    labels: {},
                },
                "2d": {
                }
            },
            "3d": {
                ducts: {
                    meshes: {}
                },
                components: {
                    meshes: {}
                },
                joints: {
                    geometry: {},
                    arcs: []
                },
                ends: {
                    meshes: {}
                },
            },
            "2d": {
                "layers": {
                    "secondary": null,
                    "primary": null,
                },
                "stages": {
                    "secondary": null,
                    "primary": null,
                }
            }
        }

        // Process and organize XETO data into structured format
        this.reformatXetoDict();
        this.defineAssociationsDict();
        this.prepareResources();
        this.populateResources();

        return this.ahuObject;
    }

    /**
     * Reorganizes XETO data into a more accessible dictionary format.
     */
    reformatXetoDict() {
        // Extract duct edges and components from XETO data
        this.ductEdges = this.ahuObject.xeto.filter(child => child.spec.includes('DuctEdge'));
        this.components = this.cleanedXeto.filter(child => child.spec.includes('Component'));

        // Organize duct edges and components into separate dictionaries
        for(const edge of this.ductEdges) {
            // Map each edge to its ID for easy lookup
            this.ahuObject.xetoDictionary.edges[edge.id] = edge;
        }
        for(const component of this.components) {
            // Map each component to its ID for easy lookup
            this.ahuObject.xetoDictionary.components[component.id] = component;
        }
    }

    /**
     * Creates associations between different elements of the AHU system.
     * Handles duct connections, end caps, arrows, and labels.
     */
    defineAssociationsDict() {
        // Get end types from shared data
        const endTypes = sharedData.endTypes;  
        
        // Initialize counters for different element types
        let inserts = 1;
        let caps = 1;
        let arrows = 1;
        let labels = 1;

        // Process each duct edge to establish connections and associations
        for(const edge of this.ductEdges) {
            // Associate components with their respective ducts
            this.ahuObject.associations.ducts[edge.id] = { "components": edge.components }
            this.ahuObject.associations.ducts[edge.id].joints = [];

            // Map components back to their parent ducts
            for(const componentId of edge.components) {
                this.ahuObject.associations.components[componentId] = edge.id;
            }

            // Find intersecting ducts at start and end points
            const edgeLoc = edge.graphicLocation;
            const startIntersections = this.ductEdges.filter(child => 
                edgeLoc.start === child.graphicLocation.start &&
                edge != child ||
                edgeLoc.start === child.graphicLocation.end &&
                edge != child
            );
            const endIntersections = this.ductEdges.filter(child => 
                edgeLoc.end === child.graphicLocation.start &&
                edge != child ||
                edgeLoc.end === child.graphicLocation.end &&
                edge != child
            );

            // Initialize arrays for ends, arrows, and labels
            this.ahuObject.associations.ducts[edge.id]["ends"] = [];
            this.ahuObject.associations.ducts[edge.id]["arrows"] = [];
            this.ahuObject.associations.ducts[edge.id]["labels"] = [];
            
            // Process duct ends if there are no intersections
            if (startIntersections.length == 0 || endIntersections.length == 0) {
                // Handle different types of duct ends (inserts and caps)
                if (endTypes.includes(edge.blockStyle.ductEnds)){
                    if(edge.blockStyle.ductEnds == 'insert') {
                        this.ahuObject.associations.ends[`Insert-${inserts}`] = edge.id;
                        this.ahuObject.associations.ducts[edge.id]["ends"].push(`Insert-${inserts}`);
                        inserts++;
                    }
                    if(edge.blockStyle.ductEnds == 'cap') {
                        this.ahuObject.associations.ends[`Cap-${caps}`] = edge.id;
                        this.ahuObject.associations.ducts[edge.id]["ends"].push(`Cap-${caps}`);
                        caps++;
                    }
                }

                // Process flow direction arrows if enabled
                if(edge.blockStyle.helpers.arrow.display) {
                    this.ahuObject.associations.arrows[`Arrow-${arrows}`] = edge.id;
                    this.ahuObject.associations.ducts[edge.id]["arrows"].push(`Arrow-${arrows}`);
                    this.ahuObject.auxiliary["3d"].arrows[`Arrow-${arrows}`] = {
                        position: {x: 0, y: 0, z: 0},
                        rotation: {x: 0, y: 0, z: 0},
                        side: startIntersections.length == 0 ? "start" : "end",
                        flowDirection: edge.blockStyle.flowDirection,
                    };   
                    arrows++;                     
                }

                // Process text labels if enabled
                if(edge.blockStyle.helpers.text.display) {
                    this.ahuObject.associations.labels[`Label-${labels}`] = edge.id;
                    this.ahuObject.associations.ducts[edge.id]["labels"].push(`Label-${labels}`);
                    this.ahuObject.auxiliary["3d"].labels[`Label-${labels}`] = {
                        position: {x: 0, y: 0, z: 0},
                        rotation: {x: 0, y: 0, z: 0},
                        side: startIntersections.length == 0 ? "start" : "end",
                        flowDirection: edge.blockStyle.flowDirection,
                    };  
                    labels++;
                }
            }
        }
    }

    /**
     * Initializes resource containers for ducts, components, and ends.
     */
    prepareResources() {
        // Get end types from shared data
        const endTypes = sharedData.endTypes;
        this.ductEdges = this.ahuObject.xeto.filter(child => child.spec.includes('DuctEdge'));

        // Process each duct edge to prepare resource containers
        for(const edge of this.ductEdges) {
            // Initialize duct resources
            this.ahuObject.resources.ducts[edge.id] = {};

            // Initialize component resources
            for(const componentId of edge.components) {
                this.ahuObject.resources.components[componentId] = {};
            }

            // Process duct ends if specified
            if (endTypes.includes(edge.blockStyle.ductEnds)){
                const edgeLoc = edge.graphicLocation;

                // Find intersecting ducts at start and end points
                const startIntersections = this.ductEdges.filter(child => 
                    edgeLoc.start === child.graphicLocation.start &&
                    edge != child ||
                    edgeLoc.start === child.graphicLocation.end &&
                    edge != child
                );

                const endIntersections = this.ductEdges.filter(child => 
                    edgeLoc.end === child.graphicLocation.start &&
                    edge != child ||
                    edgeLoc.end === child.graphicLocation.end &&
                    edge != child
                );

                // Initialize counters for different end types
                let inserts = 1;
                let caps = 1;

                // Create end resources where needed
                if (startIntersections.length == 0 || endIntersections.length == 0) {
                    if(edge.blockStyle.ductEnds == 'insert') {
                        this.ahuObject.resources.ends[`Insert-${caps}`] = {};
                        inserts++;
                    }
                    else if(edge.blockStyle.ductEnds == 'cap') {
                        this.ahuObject.resources.ends[`Cap-${caps}`] = {};
                        caps++;
                    }
                }
            }
        }
    }

    /**
     * Populates resources with actual geometry and placement data.
     */
    async populateResources() {
        // Initialize duct system processor
        this.Ducts = new Ducts(
            this.ductsDictionary, 
            this.Mesh3D, 
            this.componentLibrary,
            this.ahuGroup,
            this.sceneHelper, 
            this.ahuObject
        );        

        // Initialize and place duct segments
        this.Ducts.initializeAllDuctSegments(this.ahuObject); 
        await this.Ducts.placeSegments(this.ahuObject);
    }

    /**
     * Prepares 2D visualization data.
     */
    async populate2D() {
        // Create the layers for secondary and primary Konva containers
        this.ahuObject["2d"].layers.secondary = await this.Canvas2D.createLayer(this.ahuObject);
        this.ahuObject["2d"].layers.primary = await this.Canvas2D.createLayer(this.ahuObject);
    }

    /**
     * Renders 2D visualization to specified viewports.
     */
    async render2D() {
        // Render to secondary and primary Konva containers
        this.Canvas2D.drawToViewport(this.ahuObject["2d"].layers.secondary, "secondaryKonvaContainer");
        this.Canvas2D.drawToViewport(this.ahuObject["2d"].layers.primary, "primaryKonvaContainer");        
    }

    /**
     * Processes and prepares 3D geometry for visualization.
     * Creates and positions joint geometry based on duct connections.
     */
    populate3D() {
        // Initialize joint geometry variable
        let jointGeometry = null;

        sharedData.ahuObject = this.ahuObject;

        // Process each joint in the system
        for(const jointKey of Object.keys(this.ahuObject.resources.joints)) {
            const joint = this.ahuObject.resources.joints[jointKey];
            const jointKeys = Object.keys(joint);

            // Handle two-duct joints (L-joints or colinear)
            if(jointKeys.length == 2) {
                // Determine if ducts are parallel (vertical or horizontal)
                let pairDirection = null;
                if(joint.up != null && joint.down != null) {
                    pairDirection = "vertical";
                }
                if(joint.left != null && joint.right != null) {
                    pairDirection = "horizontal";
                }

                // Create appropriate geometry based on duct arrangement
                if(pairDirection) {
                    jointGeometry = this.Geometry_3D_Joints_Colinear.createParallelJoint(joint, pairDirection);
                }
                else {
                    calculateJointCenter(jointKey);
                    jointGeometry = this.Geometry_3D_Joints_L.createLJoint(joint);
                }
            }

            // Handle three-duct T-joints
            if(jointKeys.length == 3) {
                calculateJointCenter(jointKey);
                jointGeometry = this.Geometry_3D_Joints_T.createTJoint(joint);
            }

            // Handle four-duct cross joints
            if(jointKeys.length == 4) {
                calculateJointCenter(jointKey);
                jointGeometry = this.Geometry_3D_Joints_Cross.createCrossJoint(joint);
            }         

            // Store generated geometry if valid
            if(jointKeys.length >= 2) {
                this.ahuObject["3d"].joints.geometry[jointKey] = jointGeometry;             
            }
        }

        // Initialize and create duct end geometry
        this.Ends = new Ends();
        this.Ends.createEnds(this.ahuObject);

        // Position and orient helper elements (arrows, labels)
        this.transformHelpers();
    }

    /**
     * Positions and orients helper elements (arrows and labels) relative to ducts.
     */
    transformHelpers(){
        // Process each duct in the system
        for (const ductKey in this.ahuObject.resources.ducts) {
            const duct = this.ahuObject.resources.ducts[ductKey];

            // Get duct orientation and calculate positioning parameters
            let segmentOrientation = this.ahuObject.xetoDictionary.edges[ductKey].orientation;
            let ductHalfLength = JSON.parse(JSON.stringify(duct.dimensions.x)) / 2;
            let halfWt = sharedData.moduleConfigs.parametricOptions.wallThickness / 2; 
            let arrowLength = sharedData.arrowDimensions.x;
            const endKey = this.ahuObject.associations.ducts[ductKey].ends[0];

            // Position and orient flow direction arrows
            if(this.ahuObject.associations.ducts[ductKey].arrows.length > 0) {
                const arrowKey = this.ahuObject.associations.ducts[ductKey].arrows[0];
                const arrow = this.ahuObject.auxiliary["3d"].arrows[arrowKey];

                // Set initial position based on duct position
                arrow.position = JSON.parse(JSON.stringify(duct.position));
                this.positionHelper(arrow, segmentOrientation, ductHalfLength, halfWt, arrowLength, endKey);

                // Set arrow rotation based on duct orientation and flow direction
                arrow.rotation.y = duct.rotation.y;
                if(arrow.flowDirection == "endToStart") {
                    // Adjust arrow rotation for reverse flow direction
                    if(arrow.rotation.y == 180) {
                        arrow.rotation.y = 0;
                    }
                    else if(arrow.rotation.y == 0) {
                        arrow.rotation.y = 180;
                    }
                    else if(arrow.rotation.y == 90) {
                        arrow.rotation.y = -90;
                    }
                    else if(arrow.rotation.y == -90) {
                        arrow.rotation.y = 90;
                    }
                }
            }

            // Position and orient labels
            if(this.ahuObject.associations.ducts[ductKey].labels.length > 0) {
                const labelKey = this.ahuObject.associations.ducts[ductKey].labels[0];
                const label = this.ahuObject.auxiliary["3d"].labels[labelKey];

                // Set initial position based on duct position
                label.position = JSON.parse(JSON.stringify(duct.position));
                this.positionHelper(label, segmentOrientation, ductHalfLength, halfWt, arrowLength, endKey);

                // Set label rotation to match duct
                label.rotation.y = duct.rotation.y;

                // Apply additional offset for better visibility
                let offset = 150;
                if(segmentOrientation == "north") {
                    label.position.x += offset;
                    label.position.z -= offset;
                }
                else if(segmentOrientation == "south" ) {
                    label.position.x += offset;
                }
                else if(segmentOrientation == "east" ) {
                    label.position.x -= offset * 3;
                    label.position.z += offset;
                }
                else {
                    label.position.x -= offset;
                    label.position.z += offset;
                }
            }
        }
    }

    /**
     * Positions helper elements (arrows/labels) relative to ducts based on orientation.
     * @param {Object} helper - Helper element to position (arrow or label)
     * @param {string} segmentOrientation - Orientation of the duct segment
     * @param {number} ductHalfLength - Half length of the duct
     * @param {number} halfWt - Half of the wall thickness
     * @param {number} arrowLength - Length of arrow helper
     * @param {string} endKey - Identifier for duct end type
     */
    positionHelper(helper, segmentOrientation, ductHalfLength, halfWt, arrowLength, endKey) {
        // Base offset from duct end
        const endOffset = 100;
        ductHalfLength += 150;

        // Position helper at start of duct
        if (helper.side == "start") {
            if (segmentOrientation == 'west') {
                // Adjust position for westward orientation
                helper.position.x += (ductHalfLength * 1) + halfWt;
                helper.position.x += (arrowLength / 2);
                helper.position.x += endOffset;
            } 
            else if (segmentOrientation == 'east') {
                // Adjust position for eastward orientation
                helper.position.x += (ductHalfLength * -1) - halfWt;
                helper.position.x += (arrowLength / -2);
                helper.position.x += endOffset * -1;
            } 
            else if (segmentOrientation == 'north') {
                // Adjust position for northward orientation
                helper.position.z += (ductHalfLength * -1) - halfWt;
                helper.position.z += (arrowLength / -2);
                helper.position.z += endOffset * -1;
            } 
            else if (segmentOrientation == 'south') {
                // Adjust position for southward orientation
                helper.position.z += (ductHalfLength * 1) + halfWt;
                helper.position.z += (arrowLength / 2);
                helper.position.z += endOffset;
            }
        }

        // Position helper at end of duct
        if (helper.side == "end") {
            if (segmentOrientation == 'west') {
                // Adjust position for westward orientation
                helper.position.x += (ductHalfLength * -1) - halfWt;
                helper.position.x += (arrowLength / -2);
                helper.position.x += endOffset * -1;
            } 
            else if (segmentOrientation == 'east') {
                // Adjust position for eastward orientation
                helper.position.x += (ductHalfLength * 1) + halfWt;
                helper.position.x += (arrowLength / 2);
                helper.position.x += endOffset;
            } 
            else if (segmentOrientation == 'north') {
                // Adjust position for northward orientation
                helper.position.z += (ductHalfLength * 1) + halfWt;
                helper.position.z += (arrowLength / 2);
                helper.position.z += endOffset;
            } 
            else if (segmentOrientation == 'south') {
                // Adjust position for southward orientation
                helper.position.z += (ductHalfLength * -1) - halfWt;
                helper.position.z += (arrowLength / -2);
                helper.position.z += endOffset * -1;
            }
        }

        // Apply additional offset based on end type
        let offset = 0;
        if(endKey && endKey.includes("Insert")) {
            offset = 250;
        }
        else if(endKey && endKey.includes("Cap")) {
            offset = 50;
        }

        // Apply final position adjustment based on orientation
        if(segmentOrientation == "north") {
            helper.position.z += offset;
        }
        else if(segmentOrientation == "south" ) {
            helper.position.z -= offset;
        }
        else if(segmentOrientation == "east" ) {
            helper.position.x += offset;
        }
        else {
            helper.position.x -= offset;
        }
    }

    /**
     * Removes temporary metadata from joint definitions.
     * @param {string} key - Joint identifier
     */
    cleanupJointMetadata(key) {
        // Remove temporary properties used during joint creation
        delete this.ahuObject.resources.joints[`Joint-${key}`].key;
        delete this.ahuObject.resources.joints[`Joint-${key}`].pairDirection;
    }

    /**
     * Renders the 3D visualization and adjusts the view.
     */
    async render3D() {
        // Render the 3D scene
        await this.Mesh3D.render3D(this.ahuObject);
        // Adjust camera to fit entire assembly in view
        sharedData.sceneHelper.fitAssemblyIntoView();
    }
}
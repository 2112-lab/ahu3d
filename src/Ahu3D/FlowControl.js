import { sharedData } from "./globals.js";
import Ducts from "../Numerics/Ducts.js";
import Mesh3D from "../3D/Mesh3D.js";
import Geometry_3D_Joints_Cross from "../3D/Geometry/Joints/Geometry_3D_Joints_Cross.js";
import Geometry_3D_Joints_T from "../3D/Geometry/Joints/Geometry_3D_Joints_T.js";
import Geometry_3D_Joints_L from "../3D/Geometry/Joints/Geometry_3D_Joints_L.js";
import Geometry_3D_Joints_Colinear from "../3D/Geometry/Joints/Geometry_3D_Joints_Colinear.js";
import Ends from "../Numerics/Ends.js";
import Canvas2D from "../2D/Canvas2D.js";

export default class FlowControl {

	constructor() {
        this.cleanedXeto = null;
        this.ductsDictionary = null;
        this.Mesh3D = new Mesh3D();
        this.Geometry_3D_Joints_Cross = new Geometry_3D_Joints_Cross();
        this.Geometry_3D_Joints_T = new Geometry_3D_Joints_T();
        this.Geometry_3D_Joints_L = new Geometry_3D_Joints_L();
        this.Geometry_3D_Joints_Colinear = new Geometry_3D_Joints_Colinear();
        this.Canvas2D = new Canvas2D();
    }

	async runAhu3D(cleanedXeto, outputMode) {
        this.cleanedXeto = cleanedXeto;
        this.setAhuObject();

        if (outputMode == "numeric") {
            return this.ahuObject;
        } 
        else if (outputMode == "only2D") {
            this.populate2D();
        } 
        else if (outputMode == "full2D") {
            this.populate2D();
            this.render2D();
        } 
        else if (outputMode == "only3D") {
            this.populate3D();
        } 
        else if (outputMode == "full3D") {
            this.populate3D();
            this.render3D();
        } 
        else if (outputMode == "all") {
            this.populate2D();
            this.populate3D();
            this.render2D();
            this.render3D();
        } 

        return this.ahuObject;
    }

    setAhuObject() {

        this.ahuGroup = this.cleanedXeto.filter(child => child.spec.includes('AhuGroup'))[0];
        console.log("setAhuObject this.cleanedXeto:", this.cleanedXeto);

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
                    meshes: {}
                },
                ends: {
                    meshes: {}
                },
            }
            
        }

        this.reformatXetoDict();
        this.defineAssociationsDict();
        this.prepareResources();
        this.populateResources();

        return this.ahuObject;
    }

    reformatXetoDict() {
        this.ductEdges = this.ahuObject.xeto.filter(child => child.spec.includes('DuctEdge'));
        this.components = this.cleanedXeto.filter(child => child.spec.includes('Component'));

        for(const edge of this.ductEdges) {
            this.ahuObject.xetoDictionary.edges[edge.id] = edge;
        }
        for(const component of this.components) {
            this.ahuObject.xetoDictionary.components[component.id] = component;
        }
    }

    defineAssociationsDict() {
        console.log("populateAssociations started:", this.ahuObject);

        const endTypes = sharedData.endTypes;  
        
        let inserts = 1;
        let caps = 1;

        for(const edge of this.ductEdges) {

            this.ahuObject.associations.ducts[edge.id] = { "components": edge.components }
            this.ahuObject.associations.ducts[edge.id].joints = [];

            for(const componentId of edge.components) {
                this.ahuObject.associations.components[componentId] = edge.id;
            }

            if (endTypes.includes(edge.blockStyle.ductEnds)){
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

                this.ahuObject.associations.ducts[edge.id]["ends"] = [];

                
                if (startIntersections.length == 0 || endIntersections.length == 0) {
                    if(edge.blockStyle.ductEnds == 'insert') {
                        console.log("populateAssociations insert added:", inserts, edge.id);
                        this.ahuObject.associations.ends[`Insert-${inserts}`] = edge.id;
                        this.ahuObject.associations.ducts[edge.id]["ends"].push(`Insert-${inserts}`);
                        inserts++;
                    }
                     if(edge.blockStyle.ductEnds == 'cap') {
                        console.log("populateAssociations cap added:", caps, edge.id);
                        this.ahuObject.associations.ends[`Cap-${caps}`] = edge.id;
                        this.ahuObject.associations.ducts[edge.id]["ends"].push(`Cap-${caps}`);
                        caps++;
                    }
                }
                
            }
        }
    }

    prepareResources() {
        console.log("prepareResources started:", this.ahuObject);

        const endTypes = sharedData.endTypes;
        this.ductEdges = this.ahuObject.xeto.filter(child => child.spec.includes('DuctEdge'));

        for(const edge of this.ductEdges) {
            this.ahuObject.resources.ducts[edge.id] = {};

            for(const componentId of edge.components) {
                this.ahuObject.resources.components[componentId] = {};
            }

            if (endTypes.includes(edge.blockStyle.ductEnds)){
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

                let inserts = 1;
                let caps = 1;
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

    async populateResources() {
        console.log("populateResources started:", this.ahuObject);

        this.Ducts = new Ducts(
            this.ductsDictionary, 
            this.Mesh3D, 
            this.componentLibrary,
            this.ahuGroup,
            this.sceneHelper, 
            this.ahuObject
        );        

        console.log("FlowControl step 1:", this.ahuObject);

        this.Ducts.initializeAllDuctSegments(this.ahuObject); 
        
        console.log("FlowControl step 2:", this.ahuObject);

         await this.Ducts.placeSegments(this.ahuObject);

        console.log("FlowControl step 3:", this.ahuObject);
    }

    populate2D() {

    }

    render2D() {
        this.Canvas2D.drawToViewport(this.ahuObject, "secondaryKonvaContainer");
        this.Canvas2D.drawToViewport(this.ahuObject, "primaryKonvaContainer"); 
    }

    populate3D() {
        console.log("populate3D started:", this.ahuObject);
        let jointGeometry = null;
        for(const key in this.ductsDictionary) {
            const joint = this.ahuObject.resources.joints[`Joint-${key}`];
            if(this.ductsDictionary[key].length == 2) {
                if(joint.pairDirection) {
                    jointGeometry = this.Geometry_3D_Joints_Colinear.createParallelJoint(joint.intersectDucts, joint.pairDirection, joint);
                }
                else {
                    jointGeometry = this.Geometry_3D_Joints_L.createLJoint(joint, joint.intersectDucts, joint.largestGlobalSize);
                }
            }
            if(this.ductsDictionary[key].length == 3) {
                jointGeometry = this.Geometry_3D_Joints_T.createTJoint(joint.intersectDucts, joint.largestGlobalSize, joint);
            }
            if(this.ductsDictionary[key].length == 4) {
                jointGeometry = this.Geometry_3D_Joints_Cross.createCrossJoint(joint.intersectDucts, joint.largestGlobalSize, joint);
            }         

            if(this.ductsDictionary[key].length >= 2) {
                console.log("populate3D key:", key);
                this.ahuObject["3d"].joints.geometry[`Joint-${key}`] = jointGeometry;
                this.ahuObject["3d"].joints.meshes[`Joint-${key}`] = null;

                this.cleanupJointMetadata(key);                
            }
            
        }
        console.log("populate3D finished:", this.ahuObject);

        this.Ends = new Ends();

        this.Ends.createEnds(this.ahuObject);
    }

    cleanupJointMetadata(key) {
        delete this.ahuObject.resources.joints[`Joint-${key}`].intersectDucts;
        delete this.ahuObject.resources.joints[`Joint-${key}`].largestGlobalSize;
        delete this.ahuObject.resources.joints[`Joint-${key}`].key;
        delete this.ahuObject.resources.joints[`Joint-${key}`].pairDirection;
    }

    async render3D() {
        await this.Mesh3D.render3D(this.ahuObject);
        sharedData.sceneHelper.fitAssemblyIntoView();
    }
}

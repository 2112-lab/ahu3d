import Object3DLoader from "./core/Object3DLoader"
import Import from "./core/Import"
import Scene from "./sceneHelper/Scene"

class Ahu3D {

    constructor() {
        this.sceneHelper = new Scene();

        this.imports = new Import();
        this.library = null;

        this.assetConfigs = null;

        this.object3DLoader = new Object3DLoader(this.sceneHelper);
    }

    async loadLibraryFromApp(assetConfigs) {
        this.assetConfigs = assetConfigs;
        this.library = await this.imports.loadLibraryFromApp(assetConfigs);
        return this.library;
    }

    async loadComponent(componentKey) {
        const ahuComponent = await this.object3DLoader.loadComponent(this.assetConfigs, this.library[componentKey]);

        // Attach sceneHelper to the component
        ahuComponent.sceneHelper = this.sceneHelper;

        // Extend Object3D instance.
        this.extendObject3D(ahuComponent);  
        
        // Initialize the ahu component attributes for animations/transforms/etc.
        this.initializeAttributeStates(ahuComponent);

        return ahuComponent;
    }

    extendObject3D(ahuComponent) {
        ahuComponent.setAnimation = function(value){
            this.userData.component.attributes.setAnimation.value = value;
            this.sceneHelper.updateTooltip();
        };
        ahuComponent.setTargetTransforms = function(value){
            const attribute = this.userData.component.attributes.setTargetTransforms;

            if(value >= attribute.min && value <= attribute.max) {
                attribute.value = value;
                this.sceneHelper.updateTooltip();            

                this.traverse((child) => {
                    if (child.isMesh) {
                        if(attribute.targets.includes(child.name)) {
                            child.rotation[attribute['axis']] = attribute.states[attribute.value];
                        }
                    }
                });
            }            
        };
        ahuComponent.setTargetMaterials = function(value){
            const attribute = this.userData.component.attributes.setTargetMaterials;

            if(value >= attribute.min && value <= attribute.max) {
                attribute.value = value;
                this.sceneHelper.updateTooltip();

                this.traverse((child) => {
                    if (child.isMesh) {
                        if(child.name.includes("child")) {
                            for(const i in attribute.states.thresholds) {
                                if(attribute.value >= attribute.states.thresholds[i]['value']) {
                                    if(child.name.includes(attribute.states.thresholds[i].target)) {
                                        child.material.color.setHex(attribute.states.active);
                                    }
                                }
                                else {
                                    if(child.name.includes(attribute.states.thresholds[i].target)) {
                                        child.material.color.setHex(attribute.states.inactive);
                                    }
                                }
                            }
                        }
                    }
                });
            }

        };
        ahuComponent.setInput = function(value){
            const attribute = this.userData.component.attributes.setInput;

            attribute.value = value;
            this.sceneHelper.updateTooltip();
        };
    }

    initializeAttributeStates(ahuComponent) {
        const ahuComponentAttributes = ahuComponent.userData.component.attributes;

        const attrKeys = Object.keys(ahuComponentAttributes);
        const methodKey = attrKeys[0];
        const attributeValue = ahuComponentAttributes[methodKey].value;
        ahuComponent[methodKey](attributeValue);

        this.sceneHelper.ahuComponents.push(ahuComponent);
    }

    attachScene(selectorTag) {
        const container = document.querySelector(selectorTag);
        container.appendChild(this.sceneHelper.renderer.domElement);
    }
}

export default Ahu3D
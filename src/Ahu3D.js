import Object3DLoader from "./Core/Object3DLoader"
import Import from "./Core/Import"
import Scene from "./Scene/Scene"

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
            const attributes = this.userData.component.attributes;

            if(value >= attributes.setTargetTransforms.min && value <= attributes.setTargetTransforms.max) {
                this.userData.component.attributes.setTargetTransforms.value = value;
                this.sceneHelper.updateTooltip();            

                this.traverse((child) => {
                    if (child.isMesh) {
                        if(attributes.setTargetTransforms.targets.includes(child.name)) {
                            child.rotation[attributes.setTargetTransforms['axis']] = attributes.setTargetTransforms.states[attributes.setTargetTransforms.value];
                        }
                    }
                });
            }            
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
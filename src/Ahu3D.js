import Object3DLoader from "./Core/Object3DLoader"
import Import from "./Core/Import"
import Scene from "./Scene/Scene"

class Ahu3D {

    constructor() {
        this.sceneHelper = new Scene();

        this.imports = new Import();
        this.library = null;
        console.log("this.library:", this.library);

        this.object3DLoader = new Object3DLoader(this.sceneHelper);
    }

    loadLibraryFromApp() {
        this.library = this.imports.loadLibraryFromApp();
    }

    async loadComponent(component) {
        const ahuComponent = await this.object3DLoader.loadComponent(component);
        this.sceneHelper.ahuComponents.push(ahuComponent);
        this.sceneHelper.animatedComponents.push(ahuComponent);
    }

    attachScene(selectorTag) {
        const container = document.querySelector(selectorTag);
        container.appendChild(this.sceneHelper.renderer.domElement);
    }
}

export default Ahu3D
import { sharedData } from "../Ahu3D/globals.js";

export function setControllers(ahuObject) {
    console.log("setControllers started:", ahuObject);
    const controllers = ahuObject.xetoDictionary.ahuGroup.blockStyle.controllers;
    for(const i in controllers) {
        ahuObject.resources.controllers[`Controller-${i}`] = controllers[i];
        const asset = controllers[i].type;

        let controller = sharedData.controllers[asset];

        controller.dimensions.x = controller.portSpacing * Math.floor(controllers[i].ports / 2);


        ahuObject.resources.controllers[`Controller-${i}`] = {
            ...ahuObject.resources.controllers[`Controller-${i}`],
            ...controller
        }
    }

    console.log("setControllers controllers:", ahuObject.resources.controllers);
}
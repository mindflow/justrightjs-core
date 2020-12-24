import { ContainerFunctions } from "containerbridge_v1";

export class ApplicationStorage {
    
    static setLocalAttribute(key, value) {
        ContainerFunctions.setLocalAttribute(key,value);
    }

    static getLocalAttribute(key) {
        return ContainerFunctions.getLocalAttribute(key);
    }

    static hasLocalAttribute(key) {
        return ContainerFunctions.hasLocalAttribute(key);
    }

    static removeLocalAttribute(key) {
        return ContainerFunctions.removeLocalAttribute(key);
    }
}
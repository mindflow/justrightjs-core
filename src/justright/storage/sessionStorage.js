import { ContainerFunctions } from "containerbridge_v1";

export class SessionStorage {

    static setSessionAttribute(key, value) {
        ContainerFunctions.setSessionAttribute(key,value);
    }

    static hasSessionAttribute(key) {
        return ContainerFunctions.hasSessionAttribute(key);
    }

    static getSessionAttribute(key) {
        return ContainerFunctions.getSessionAttribute(key);
    }

    static removeSessionAttribute(key) {
        return ContainerFunctions.removeSessionAttribute(key);
    }

}
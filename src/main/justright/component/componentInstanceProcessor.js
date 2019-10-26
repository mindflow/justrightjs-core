import { Logger } from "coreutil_v1";

const LOG = new Logger("ComponentInstanceProcessor");

/**
 * Instance which calls createComponent on components after configProcessor is finished
 */
export class ComponentInstanceProcessor {

    processInstance(instance) {
        if(instance.createComponent) {
            instance.createComponent();
        }
    }

}
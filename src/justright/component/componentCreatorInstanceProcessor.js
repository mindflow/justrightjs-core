import { Logger } from "coreutil_v1";

const LOG = new Logger("ComponentCreatorInstanceProcessor");

/**
 * Instance which calls createComponent on components after configProcessor is finished
 */
export class ComponentCreatorInstanceProcessor {

    processInstance(instance) {
        if(instance.createComponent) {
            instance.createComponent();
        }
    }

}
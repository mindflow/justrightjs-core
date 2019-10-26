import { Logger, Map } from "coreutil_v1";
import { Config } from "mindi_v1";
import { TemplateRegistry } from "./templateRegistry.js";

const LOG = new Logger("TemplatePostConfig");

/**
 * To be added to mindi as a singleton. Will scan through all configured classes that have a TEMPLATE_URL and COMPONENT_NAME
 * static getter and will asyncronously load them. Returns a promise which resolves when all templates are loaded
 */
export class TemplatesLoader {


    /**
     * 
     * @param {TemplateRegistry} templateRegistry 
     */
    constructor(templateRegistry) {
        this.templateRegistry = templateRegistry;
    }

    /**
     * 
     * @param {Config} config 
     * @returns {Promise}
     */
    load(config) {
        let templateMap = new Map();
        config.getConfigElements().forEach((key, entry, parent) => {
            if(entry.getClassReference().TEMPLATE_URL && entry.getClassReference().COMPONENT_NAME) {
                templateMap.set(entry.getClassReference().COMPONENT_NAME, entry.getClassReference().TEMPLATE_URL);
            }
            return true;
        }, this); 
        return this.templateRegistry.getTemplatesLoadedPromise(templateMap);
    }

}
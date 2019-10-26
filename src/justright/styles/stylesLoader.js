import { Logger, Map } from "coreutil_v1";
import { Config } from "mindi_v1";
import { StylesRegistry } from "./stylesRegistry.js";

const LOG = new Logger("StylesLoader");

/**
 * To be added to mindi as a singleton. Will scan through all configured classes that have a STYLES_URL and COMPONENT_NAME
 * static getter and will asyncronously load them. Returns a promise which resolves when all styles are loaded
 */
export class StylesLoader {


    /**
     * 
     * @param {StylesRegistry} stylesRegistry 
     */
    constructor(stylesRegistry) {
        this.stylesRegistry = stylesRegistry;
    }

    /**
     * 
     * @param {Config} config 
     * @returns {Promise}
     */
    load(config) {
        let stylesMap = new Map();
        config.getConfigElements().forEach((key, entry, parent) => {
            if(entry.getClassReference().STYLES_URL && entry.getClassReference().COMPONENT_NAME) {
                stylesMap.set(entry.getClassReference().COMPONENT_NAME, entry.getClassReference().STYLES_URL);
            }
            return true;
        }, this); 
        return this.stylesRegistry.getStylesLoadedPromise(stylesMap);
    }

}
import { Logger } from "coreutil_v1";
import { Config, InjectionPoint, TypeConfig } from "mindi_v1";
import { StylesRegistry } from "../styles/stylesRegistry.js";
import { TemplateRegistry } from "../template/templateRegistry.js";
import { TemplatesLoader } from "../template/templatesLoader.js";
import { StylesLoader } from "../styles/stylesLoader.js";

const LOG = new Logger("ComponentConfigProcessor")

/**
 * Mindi config processor which loads all templates and styles for all configured components
 * and then calls any existing componentLoaded function on each component
 */
export class ComponentConfigProcessor {

    constructor() {

        /**
         * @type {TemplateRegistry}
         */
        this.templateRegistry = InjectionPoint.instance(TemplateRegistry);

        /**
         * @type {StylesRegistry}
         */
        this.stylesRegistry = InjectionPoint.instance(StylesRegistry);

    }

    /**
     * 
     */
    postConfig(){
        this.templatesLoader = new TemplatesLoader(this.templateRegistry);
        this.stylesLoader = new StylesLoader(this.stylesRegistry);
    }

    /**
     * 
     * @param {Config} config
     * @returns {Promise}
     */
    processConfig(config, unconfiguredConfigEntries) {

        return Promise.all(
            [ 
                this.templatesLoader.load(unconfiguredConfigEntries), 
                this.stylesLoader.load(unconfiguredConfigEntries) 
            ]
        );
    }

}
import { Logger } from "coreutil_v1"
import { MindiConfig, MindiInjector } from "mindi_v1";
import { ModuleLoader } from "./moduleLoader.js";

const LOG = new Logger("ModuleLoader");

export class DiModuleLoader extends ModuleLoader {

    /**
     * 
     * @param {MindiConfig} config
     * @param {RegExp} matchPath 
     * @param {String} rootPath 
     * @param {String} modulePath 
     * @param {Array} requiredScopeArray 
     */
    constructor(config, matchPath, rootPath, modulePath, requiredScopeArray = []) {
        super(matchPath, rootPath, modulePath, requiredScopeArray);

        /** @type {MindiConfig} */
        this.config = config;
    }

    load(rootPath) {
        const parent = this;
        if (!parent.defaultInstance) {
            parent.importModule().then(() => {
                parent.defaultInstance.load(rootPath);
            });
        } else {
            parent.defaultInstance.load(rootPath);
        }
    }

    /**
     * 
     * @param {ModuleLoader} moduleLoader
     * @returns {Promise}
     */
    importModule() {
        const parent = this;
        return new Promise((resolve, reject) => {
            return super.importModule().then(() => {
                this.config.addAllTypeConfig(parent.defaultInstance.typeConfigList);
                this.config.finalize().then(() => {
                    MindiInjector.inject(parent.defaultInstance, this.config);
                    resolve();
                });
            });
        });
    }
}
import { ArrayUtils, Logger } from "coreutil_v1"
import { MindiConfig, MindiInjector } from "mindi_v1";
import { ModuleLoader } from "./moduleLoader.js";
import { LoaderInterceptor } from "./loaderInterceptor.js"
import { Module } from "../module.js";

const LOG = new Logger("DiModuleLoader");

export class DiModuleLoader extends ModuleLoader {

    /**
     * 
     * @param {String} modulePath 
     * @param {object} trailMap 
     * @param {MindiConfig} config
     * @param {Array<LoaderInterceptor>} loaderInterceptors
     */
    constructor(modulePath, trailMap, config, loaderInterceptors = []) {
        super(modulePath, trailMap, loaderInterceptors);

        /** @type {MindiConfig} */
        this.config = config;
    }

    /**
     * 
     * @returns {Promise<Module>}
     */
    async load() {
        try {
            const module = await this.importModule();
            await this.interceptorsPass();
            return await MindiInjector.inject(module, this.config);
        } catch(reason) {
            LOG.warn("Module loader failed " + reason);
            throw reason;
        }
    }


    /**
     * 
     * @param {ModuleLoader} moduleLoader
     * @returns {Promise}
     */
    async importModule() {
        try {
            const module = await super.importModule();
            this.config.addAllTypeConfig(module.typeConfigArray);
            await this.config.finalize();
            const workingConfig = this.config;
            await ArrayUtils.promiseChain(this.loaderInterceptors, (loaderInterceptor) => {
                return MindiInjector.inject(loaderInterceptor, workingConfig);
            });
            return module;
        } catch(error) {
            throw error;
        }
    }
}
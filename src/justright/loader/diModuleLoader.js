import { List, Logger } from "coreutil_v1"
import { MindiConfig, MindiInjector } from "mindi_v1";
import { ModuleLoader } from "./moduleLoader.js";
import { LoaderInterceptor } from "./loaderInterceptor.js"
import { Main } from "../main.js";

const LOG = new Logger("DiModuleLoader");

export class DiModuleLoader extends ModuleLoader {

    /**
     * 
     * @param {MindiConfig} config
     * @param {RegExp} matchPath 
     * @param {String} modulePath 
     * @param {Array<LoaderInterceptor>} loaderInterceptors
     */
    constructor(config, matchPath, modulePath, loaderInterceptors = []) {
        super(matchPath, modulePath, loaderInterceptors);

        /** @type {MindiConfig} */
        this.config = config;
    }

    /**
     * 
     * @returns {Promise<Main>}
     */
    async load() {
        try {
            const main = await this.importModule();
            await this.interceptorsPass();
            return await MindiInjector.inject(main, this.config);
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
            const main = await super.importModule();
            this.config.addAllTypeConfig(main.typeConfigList);
            await this.config.finalize();
            await new List(this.loaderInterceptors).promiseChain((loaderInterceptor) => {
                return MindiInjector.inject(loaderInterceptor, this.config);
            });
            return main;
        } catch(error) {
            reject(error);
            return null;
        }
    }
}
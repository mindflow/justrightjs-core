import { List, Logger } from "coreutil_v1"
import { MindiConfig, MindiInjector } from "mindi_v1";
import { ModuleLoader } from "./moduleLoader.js";
import { LoaderInterceptor } from "./loaderInterceptor.js"

const LOG = new Logger("DiModuleLoader");

export class DiModuleLoader extends ModuleLoader {

    /**
     * 
     * @param {MindiConfig} config
     * @param {RegExp} matchPath 
     * @param {String} rootPath 
     * @param {String} modulePath 
     * @param {Array<LoaderInterceptor>} loaderInterceptors
     */
    constructor(config, matchPath, rootPath, modulePath, loaderInterceptors = []) {
        super(matchPath, rootPath, modulePath, loaderInterceptors);

        /** @type {MindiConfig} */
        this.config = config;
    }

    /**
     * 
     * @param {string} rootPath 
     */
    load(rootPath) {
        if (!this.defaultInstance) {
            this.importModule().then(() => {
                this.proceed(rootPath);
            });
        } else {
            this.proceed(rootPath);
        }
    }

    /**
     * 
     * @param {DiModuleLoader} parent 
     * @param {string} rootPath 
     * @returns 
     */
     proceed(rootPath) {
        if (!this.filtersPass()) {
            return;
        }
        this.defaultInstance.load(rootPath);
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
                    new List(this.loaderInterceptors).promiseChain((loaderInterceptor) => {
                        return MindiInjector.inject(loaderInterceptor, this.config);
                    }).then(() => {
                        MindiInjector.inject(parent.defaultInstance, this.config).then(() => {
                            resolve();
                        });
                    });
                });
            });
        });
    }
}
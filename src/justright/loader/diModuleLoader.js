import { List, Logger } from "coreutil_v1"
import { MindiConfig, MindiInjector } from "mindi_v1";
import { ModuleLoader } from "./moduleLoader.js";
import { LoaderInterceptor } from "./loaderInterceptor.js"
import { History } from "../navigation/history.js";

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


    go() {
        this.download().then(() => {
            this.filtersPass().then(() => {
                this.defaultInstance.go();
            }).catch((reason) => {
                LOG.warn("Filter rejected " + reason);
            });
        });
    }

    handle() {
        this.download().then(() => {
            this.filtersPass().then(() => {
                this.defaultInstance.handle();
            }).catch((reason) => {
                LOG.warn("Filter rejected " + reason);
            });
        });
    }

    download() {
        if (!this.defaultInstance) {
            return this.importModule();
        }
        return Promise.resolve();
    }

    /**
     * 
     * @param {ModuleLoader} moduleLoader
     * @returns {Promise}
     */
    importModule() {
        return new Promise((resolve, reject) => {
            return super.importModule().then(() => {
                this.config.addAllTypeConfig(this.defaultInstance.typeConfigList);
                this.config.finalize().then(() => {
                    new List(this.loaderInterceptors).promiseChain((loaderInterceptor) => {
                        return MindiInjector.inject(loaderInterceptor, this.config);
                    }).then(() => {
                        MindiInjector.inject(this.defaultInstance, this.config).then(() => {
                            resolve();
                        });
                    });
                });
            });
        });
    }
}
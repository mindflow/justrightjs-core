import { Logger, StringUtils } from "coreutil_v1"
import { Url } from "../util/url.js";
import { LoaderInterceptor } from "./loaderInterceptor.js"

const LOG = new Logger("ModuleLoader");

export class ModuleLoader {

    /**
     * 
     * @param {string} matchPath 
     * @param {String} modulePath 
     * @param {Array<LoaderInterceptor>} loaderInterceptors
     */
    constructor(matchPath, modulePath, loaderInterceptors = []) {
        
        /**
         * @type {string}
         */
        this.matchPath = matchPath;

        /**
         * @type {String}
         */
        this.modulePath = modulePath;

        /**
         * @type {Array<LoaderInterceptor>}
         */
        this.loaderInterceptors = loaderInterceptors;

    }

    /**
     * Matches if the configured matchUrl starts with the provided url or
     * if the configured matchUrl is null
     * 
     * @param {Url} url 
     * @returns 
     */
    matches(url){
        if (!this.matchPath) {
            return true;
        }
        if (!url) {
            LOG.error("Url is null");
            return false;
        }
        return StringUtils.nonNullEquals(this.matchPath, url.path);
    }

    /**
     * 
     * @returns {Promise<Main>}
     */
    async load() {
        try {
            const main = await this.importModule();
            await this.interceptorsPass();
            return main;
        } catch(reason) {
            LOG.warn("Filter rejected " + reason);
            return null;
        }
    }

    /**
     * 
     * @returns {Promise}
     */
    interceptorsPass() {
        const interceptors = this.loaderInterceptors;
        if (interceptors && interceptors.length > 0) {
            let interceptorPromiseChain = interceptors[0].process();
            for (let i = 1; i < interceptors.length; i++) {
                interceptorPromiseChain = interceptorPromiseChain.then(interceptors[i]);
            }
            return interceptorPromiseChain;
        }
        return Promise.resolve();
    }

    async importModule() {
        try {
            const module = await import(this.modulePath);
            return new module.default();
        } catch(reason)  {
            throw reason;
        }
    }

}
import { Logger } from "coreutil_v1"
import { History } from "../navigation/history.js";
import { LoaderInterceptor } from "./loaderInterceptor.js"

const LOG = new Logger("ModuleLoader");

export class ModuleLoader {

    /**
     * 
     * @param {RegExp} matchPath 
     * @param {String} modulePath 
     * @param {Array<LoaderInterceptor>} loaderInterceptors
     */
    constructor(matchPath, modulePath, loaderInterceptors = []) {
        
        /**
         * @type {RegExp}
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

        /**
         * @type {Object}
         */
        this.defaultInstance = null;

        /**
         * @type {String}
         */
        this.requestedPath = null;
    }

    authorized(){ 
        if (this.requiredScopeArray.length == 0) {
            return true;
        }
        return false;
    }

    matches(){ 
        const url = History.getUrl();
        return this.matchPath.test(url.getPath());
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

    filtersPass() {
        const interceptors = this.loaderInterceptors;
        if (interceptors && interceptors.length > 0) {
            let filterPromiseChain = interceptors[0].process();
            for (let i = 1; i < interceptors.length; i++) {
                filterPromiseChain = filterPromiseChain.then(interceptors[i]);
            }
            return filterPromiseChain;
        }
        return Promise.resolve();
    }

    importModule() {
        return new Promise((resolve, reject) => {
            if (null != this.defaultInstance) {
                resolve();
                return;
            }
            import(this.modulePath).then((module) => {
                this.defaultInstance = new module.default();
                resolve();
            }).catch((reason) => {
                reject(reason);
            });
        });
    }

    /**
     * 
     * @returns Object
     */
    defaultInstance() {
        return this.defaultInstance;
    }

}
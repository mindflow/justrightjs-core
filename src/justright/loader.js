import { Logger } from "coreutil_v1"
import { History } from "./navigation/history.js";

const LOG = new Logger("Loader");

export class Loader {

    constructor(rootPath, modulePath) {
        this.rootPath = rootPath;
        this.modulePath = modulePath;
        this.defaultInstance = null;
    }

    matches(){ 
        if (null == this.rootPath) {
            return true;
        }
        const url = History.getUrl();
        return url.getPathList().size() > 0 && "/" +  url.getPath(0) === this.rootPath;
    }

    importModule() {
        const instancePromise = new Promise((resolve, reject) => {
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
        return instancePromise;
    }

    defaultInstance() {
        return this.defaultInstance;
    }

}
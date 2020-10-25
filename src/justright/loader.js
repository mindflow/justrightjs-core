import { Logger } from "coreutil_v1"
import { History } from "./navigation/history.js";

const LOG = new Logger("Loader");

export class Loader {

    constructor(rootPath, modulePath) {
        this.rootPath = rootPath;
        this.modulePath = modulePath;
    }

    matches(){ 
        if (null == this.rootPath) {
            return true;
        }
        const url = History.getUrl();
        return url.getPathList().size() > 0 && "/" +  url.getPath(0) === this.rootPath;
    }

    loadModule() {
        return import(this.modulePath);
    }

}
import { History } from "./history/history.js";
import { ModuleRunner } from "./moduleRunner.js";
import { Url } from "./util/url.js";

/** @type {ModuleRunner} */
let theModuleRunner = null;

export class Navigation {

    /**
     * @param {ModuleRunner} moduleRunnerParam
     */
    static set moduleRunner(moduleRunnerParam) { theModuleRunner = moduleRunnerParam }

    /**
     * 
     * @param {string} path 
     */
    static go(path) {
        const url = History.getUrl();
        url.determinePath(path);
        History.pushUrl(url);
        theModuleRunner.runModule(url);
    }

}
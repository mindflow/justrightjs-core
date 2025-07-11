import { ModuleRunner } from "./moduleRunner.js";
import { Navigation } from "./navigation/navigation.js";

let activeModuleRunner = null;

export class ActiveModuleRunner {

    constructor() {

        /** @type {ModuleRunner} */
        this.moduleRunner = null;
    }

    /**
     * 
     * @returns {ActiveModuleRunner}
     */
    static instance() {
        if (!activeModuleRunner) {
            activeModuleRunner = new ActiveModuleRunner();
        }
        return activeModuleRunner;
    }

    /**
     * 
     * @param {ModuleRunner} newModuleRunner 
     */
    set(newModuleRunner) {
        this.moduleRunner = newModuleRunner;
    }

    /**
     * Load anchor without renavigating browser
     * @param {string} anchor 
     */
     async load(anchor) {
        const url = Navigation.instance().loadAnchor(anchor);
        return await this.moduleRunner.runModule(url);
    }
}
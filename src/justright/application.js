import { List, Logger } from  "coreutil_v1";
import { MindiInjector, MindiConfig, InstancePostConfigTrigger, ConfigAccessor } from "mindi_v1";
import { ComponentConfigProcessor } from "./component/componentConfigProcessor.js";
import { ModuleLoader } from "./loader/moduleLoader.js";
import { TemplateRegistry } from "./template/templateRegistry.js";
import { StylesRegistry } from "./styles/stylesRegistry.js";
import { Config } from "./config.js";

const LOG = new Logger("Application");

export class Application {

    constructor() {

        /** @type {List} */
        this.workerList = new List();

        /** @type {List} */
        this.moduleLoaderList = new List();

        /** @type {MindiConfig} */
        this.config = new MindiConfig();

        /** @type {List} */
        this.runningWorkers = new List();

        this.config
            .addAllTypeConfig(Config.getInstance().getTypeConfigList())
            .addAllConfigProcessor(new List([ ComponentConfigProcessor ]))
            .addAllInstanceProcessor(new List([ InstancePostConfigTrigger ]));
    }

    addAllTypeConfig(typeConfigList) {
        this.config.addAllTypeConfig(typeConfigList);
    }

    run() {
        this.getMatchingModuleLoader().load();
        this.startWorkers();
    }

    executeMatchingModule() {
        this.getMatchingModuleLoader().defaultInstance.load();
    }

    startWorkers() {
        if (this.runningWorkers.size() > 0) {
            return;
        }
        this.workerList.forEach((value,parent) => {
            const instance = new value();
            MindiInjector.inject(instance, this.config);
            this.runningWorkers.add(instance);
            return true;
        }, this);
    }

    /**
     * @returns {ModuleLoader}
     */
    getMatchingModuleLoader() {
        let foundModuleLoader = null;
        this.moduleLoaderList.forEach((value,parent) => {
            if (value.matches()) {
                foundModuleLoader = value;
                return false;
            }
            return true;
        }, this);
        return foundModuleLoader;
    }

    /**
     * Enable global access to dependency injection config
     */
    windowDiConfig() {
        window.diConfig = () => {
            LOG.info(this.config.configEntries);
        }
    }

    /**
     * Enable global access to template registry
     */
    windowTemplateRegistry() {
        window.templateRegistry = () => {
            LOG.info(ConfigAccessor.instanceHolder(TemplateRegistry.name, this.config).instance);
        }
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            LOG.info(ConfigAccessor.instanceHolder(StylesRegistry.name, this.config).instance);
        }
    }

}
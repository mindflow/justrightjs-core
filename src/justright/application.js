import { List, Logger } from  "coreutil_v1";
import { MindiInjector, MindiConfig, InstancePostConfigTrigger, ConfigAccessor } from "mindi_v1";
import { ComponentConfigProcessor } from "./component/componentConfigProcessor.js";
import { Site } from "./site.js";
import { Loader } from "./loader.js";
import { TemplateRegistry } from "./template/templateRegistry.js";
import { StylesRegistry } from "./styles/stylesRegistry.js";
import { Config } from "./config.js";

const LOG = new Logger("Application");

const SHARED_INSTANCE_PROCESSORS_LIST = new List([ InstancePostConfigTrigger ]);
const SHARED_CONFIG_PROCESSORS_LIST = new List([ ComponentConfigProcessor ]);
const CONFIG = new MindiConfig();

export class Application {

    /** 
     * @param {Site} site
     */
    constructor(site) {

        this.site = site;
        this.runningWorkers = new List();
        this.instansiatedLoaders = new List();

        /** @type {Loader} */
        const loader = this.getMatchingLoader();

        /** @type {Promise} */
        const modulePromise = loader.loadModule();

        CONFIG
            .addAllTypeConfig(Config.getInstance().getTypeConfigList())
            .addAllTypeConfig(site.typeConfigList)
            .addAllConfigProcessor(SHARED_CONFIG_PROCESSORS_LIST)
            .addAllInstanceProcessor(SHARED_INSTANCE_PROCESSORS_LIST);

        modulePromise.then((module) => {
            const mainObject = new module.default();
            CONFIG.addAllTypeConfig(mainObject.typeConfigList);
            CONFIG.finalize().then(() => {
                
                // Let mindi load the loader
                MindiInjector.inject(mainObject, CONFIG);
    
                this.instansiatedLoaders.add(mainObject);
                this.startWorkers();
            });
        });
    }

    startWorkers() {
        if (this.runningWorkers.size() > 0) {
            return;
        }
        this.site.workers.forEach((value,parent) => {
            const instance = new value();
            MindiInjector.inject(instance, CONFIG);
            this.runningWorkers.add(instance);
            return true;
        }, this);
    }

    getExistingInstasiatedLoader() {
        let loader = null;
        this.instansiatedLoaders.forEach((value,parent) => {
            if (value.matches()) {
                loader = value;
                return false;
            }
            return true;
        }, this);
        return loader;
    }

    getMatchingLoader() {
        let loader = null;
        this.site.loaderList.forEach((value,parent) => {
            if (value.matches()) {
                loader = value;
                return false;
            }
            return true;
        }, this);
        return loader;
    }

    /**
     * Enable global access to dependency injection config
     */
    windowDiConfig() {
        window.diConfig = () => {
            LOG.info(CONFIG.configEntries);
        }
    }

    /**
     * Enable global access to template registry
     */
    windowTemplateRegistry() {
        window.templateRegistry = () => {
            LOG.info(ConfigAccessor.instanceHolder(TemplateRegistry.name, CONFIG).getInstance());
        }
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            LOG.info(ConfigAccessor.instanceHolder(StylesRegistry.name, CONFIG).getInstance());
        }
    }

}







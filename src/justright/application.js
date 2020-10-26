import { List, Logger } from  "coreutil_v1";
import { MindiInjector, MindiConfig, InstancePostConfigTrigger, ConfigAccessor } from "mindi_v1";
import { ComponentConfigProcessor } from "./component/componentConfigProcessor.js";
import { Site } from "./site.js";
import { Loader } from "./loader.js";
import { TemplateRegistry } from "./template/templateRegistry.js";
import { StylesRegistry } from "./styles/stylesRegistry.js";
import { Config } from "./config.js";

const LOG = new Logger("Application");

let APPLICATION_INSTANCE = null;

export class Application {

    static create(site) { APPLICATION_INSTANCE = new Application(site); }
    static get instance() { return APPLICATION_INSTANCE; }

    /** 
     * @param {Site} site
     */
    constructor(site) {

        /** @type {Site} */
        this.site = site;

        /** @type {List} */
        this.instanceProcessors = new List([ InstancePostConfigTrigger ]);

        /** @type {List} */
        this.configProcessors = new List([ ComponentConfigProcessor ]);

        /** @type {MindiConfig} */
        this.config = new MindiConfig();

        /** @type {List} */
        this.runningWorkers = new List();

        /** @type {List} */
        this.instansiatedLoaders = new List();

        /** @type {Loader} */
        const loader = this.getMatchingLoader();

        this.config
            .addAllTypeConfig(Config.getInstance().getTypeConfigList())
            .addAllTypeConfig(this.site.typeConfigList)
            .addAllConfigProcessor(this.configProcessors)
            .addAllInstanceProcessor(this.instanceProcessors);

        this.runLoader(loader);
    }

    runLoader(loader) {
        loader.importModule().then((module) => {
            this.config.addAllTypeConfig(loader.defaultInstance.typeConfigList);
            this.config.finalize().then(() => {
                
                // Let mindi load the loader
                MindiInjector.inject(loader.defaultInstance, this.config);
    
                this.instansiatedLoaders.add(loader.defaultInstance);
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
            MindiInjector.inject(instance, this.config);
            this.runningWorkers.add(instance);
            return true;
        }, this);
    }

    getExistingInstasiatedLoader() {
        let foundLoader = null;
        this.instansiatedLoaders.forEach((value,parent) => {
            if (value.matches()) {
                foundLoader = value;
                return false;
            }
            return true;
        }, this);
        return foundLoader;
    }

    getMatchingLoader() {
        let foundLoader = null;
        this.site.loaderList.forEach((value,parent) => {
            if (value.matches()) {
                foundLoader = value;
                return false;
            }
            return true;
        }, this);
        return foundLoader;
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
            LOG.info(ConfigAccessor.instanceHolder(TemplateRegistry.name, this.config).getInstance());
        }
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            LOG.info(ConfigAccessor.instanceHolder(StylesRegistry.name, this.config).getInstance());
        }
    }

}
import { MindiInjector, MindiConfig, InstancePostConfigTrigger, ConfigAccessor, SingletonConfig, PrototypeConfig } from "mindi_v1";
import { List, Logger, ObjectFunction, StringUtils } from  "coreutil_v1";
import { ContainerUrl } from "containerbridge_v1";
import { ComponentConfigProcessor } from "./component/componentConfigProcessor.js";
import { TemplateRegistry } from "./template/templateRegistry.js";
import { StylesRegistry } from "./styles/stylesRegistry.js";
import { Config } from "./config.js";
import { Event } from "./event/event.js";
import { History } from "./navigation/history.js";
import { DiModuleLoader } from "./loader/diModuleLoader.js";
import { Url } from "./util/url.js";
import { ModuleRunner } from "./moduleRunner.js";
import { Main } from "./main.js";
import { ActiveModuleRunner } from "./activeModuleRunner.js";

const LOG = new Logger("Application");

export class Application extends ModuleRunner {

    constructor() {

        super();

        /** @type {List} */
        this.workerList = new List();

        /** @type {List<DiModuleLoader>} */
        this.moduleLoaderList = new List();

        /** @type {MindiConfig} */
        this.config = new MindiConfig();

        /** @type {List} */
        this.runningWorkers = new List();

        /** @type {Main} */
        this.activeMain = null;

        this.defaultConfig = Config.getInstance().getTypeConfigList();

        this.defaultConfigProcessors = new List([ ComponentConfigProcessor ]);

        this.defaultInstanceProcessors = new List([ InstancePostConfigTrigger ])

        this.customConfig = new List();

    }

    /**
     * 
     * @param {List<SingletonConfig | PrototypeConfig>} typeConfigList 
     */
    set customTypeConfig(typeConfigList) {
        this.customConfig = typeConfigList;
    }

    run() {
        LOG.info("Running Application");
        this.config
            .addAllTypeConfig(this.defaultConfig)
            .addAllTypeConfig(this.customConfig)
            .addAllConfigProcessor(this.defaultConfigProcessors)
            .addAllInstanceProcessor(this.defaultInstanceProcessors);
        ActiveModuleRunner.instance().set(this);
        ContainerUrl.addUserNavigateListener(
            new ObjectFunction(this, this.update),
            Event
        );
        this.runModule(History.currentUrl()).then(() => {
            this.startWorkers();
        });
    }

    /**
     * 
     * @param {Event} event
     */
    update(event) {
        const url = History.currentUrl();
        if (this.activeMain && StringUtils.nonNullEquals(this.activeMain.path, url.path)) {
            this.activeMain.update(url);
            return;
        }
        this.runModule(url);
    }

    /**
     * 
     * @param {Url} url 
     * @returns 
     */
    runModule(url) {
        return this.getMatchingModuleLoader(url).load().then((main) => {
            this.activeMain = main;
            main.load(url, null);
        }).catch((error) => {
            LOG.error(error);
        });
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
     * @param {Url} url
     * @returns {DiModuleLoader}
     */
    getMatchingModuleLoader(url) {
        let foundModuleLoader = null;
        this.moduleLoaderList.forEach((value, parent) => {
            if (value.matches(url)) {
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
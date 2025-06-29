import { MindiInjector, MindiConfig, InstancePostConfigTrigger, ConfigAccessor, SingletonConfig, PrototypeConfig } from "mindi_v1";
import { List, Logger, Method, StringUtils } from  "coreutil_v1";
import { ContainerUrl } from "containerbridge_v1";
import { ComponentConfigProcessor } from "./component/componentConfigProcessor.js";
import { TemplateRegistry } from "./template/templateRegistry.js";
import { StylesRegistry } from "./styles/stylesRegistry.js";
import { Event } from "./event/event.js";
import { History } from "./navigation/history.js";
import { DiModuleLoader } from "./loader/diModuleLoader.js";
import { Url } from "./util/url.js";
import { ModuleRunner } from "./moduleRunner.js";
import { Main } from "./main.js";
import { ActiveModuleRunner } from "./activeModuleRunner.js";
import { ConfiguredFunction } from "./config/configuredFunction.js";
import { ElementMapper } from "./element/elementMapper.js";
import { StateManager } from "./state/stateManager.js";
import { UniqueIdRegistry } from "./component/uniqueIdRegistry.js";
import { ComponentFactory } from "./component/componentFactory.js";

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

        ConfiguredFunction.configure("wrapEvent", (parameter) => { return new Event(parameter); });

        ConfiguredFunction.configure("mapElement", (parameter) => { return ElementMapper.map(parameter); });

        this.defaultConfig = new List([
            SingletonConfig.unnamed(TemplateRegistry),
            SingletonConfig.unnamed(StylesRegistry),
            SingletonConfig.unnamed(UniqueIdRegistry),
            SingletonConfig.unnamed(ComponentFactory),
            PrototypeConfig.unnamed(StateManager)]);

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

    async run() {
        LOG.info("Running Application");
        this.config
            .addAllTypeConfig(this.defaultConfig)
            .addAllTypeConfig(this.customConfig)
            .addAllConfigProcessor(this.defaultConfigProcessors)
            .addAllInstanceProcessor(this.defaultInstanceProcessors);
        ActiveModuleRunner.instance().set(this);
        ContainerUrl.addUserNavigateListener(
            new Method(this, this.update),
            Event
        );
        const main = await this.runModule(History.currentUrl());
        this.startWorkers();
        return main;
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
    async runModule(url) {
        try {
            const main = await this.getMatchingModuleLoader(url).load();
            this.activeMain = main;
            main.load(url, null);
            return main;
        } catch(error) {
            LOG.error(error);
            return null;
        }
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
            const typeConfig = ConfigAccessor.typeConfigByName(TemplateRegistry.name, this.config);
            LOG.info(typeConfig.instanceHolder().instance);
        }
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            const typeConfig = ConfigAccessor.typeConfigByName(StylesRegistry.name, this.config);
            LOG.info(typeConfig.instanceHolder().instance);
        }
    }

}
import { MindiInjector,
    MindiConfig,
    InstancePostConfigTrigger,
    ConfigAccessor,
    SingletonConfig,
    PrototypeConfig, 
    Config } from "mindi_v1";
import { ArrayUtils, Logger, Method, StringUtils } from  "coreutil_v1";
import { ContainerEvent, ContainerUrl } from "containerbridge_v1";
import { ComponentConfigProcessor } from "./component/componentConfigProcessor.js";
import { TemplateRegistry } from "./template/templateRegistry.js";
import { StylesRegistry } from "./styles/stylesRegistry.js";
import { History } from "./navigation/history.js";
import { DiModuleLoader } from "./loader/diModuleLoader.js";
import { Url } from "./util/url.js";
import { ModuleRunner } from "./moduleRunner.js";
import { Module } from "./module.js";
import { ActiveModuleRunner } from "./activeModuleRunner.js";
import { StateManager } from "./state/stateManager.js";
import { UniqueIdRegistry } from "./component/uniqueIdRegistry.js";
import { TemplateComponentFactory } from "./component/templateComponentFactory.js";
import { ModuleLoader } from "./loader/moduleLoader.js";
import { TrailProcessor } from "./navigation/trailProcessor.js";
import { InlineComponentFactory } from "./component/inlineComponentFactory.js";

const LOG = new Logger("Application");

export class Application extends ModuleRunner {

    /**
     * 
     * @param {Array<ModuleLoader>} moduleLoaderArray 
     * @param {Config} config 
     * @param {Array} workerArray 
     */
    constructor(moduleLoaderArray, config = new MindiConfig(), workerArray = new Array()) {

        super();

        /** @type {Array<ModuleLoader>} */
        this.moduleLoaderArray = moduleLoaderArray;

        /** @type {MindiConfig} */
        this.config = config;

        /** @type {Array} */
        this.workerArray = workerArray;

        /** @type {Array} */
        this.runningWorkers = new Array();

        /** @type {Module} */
        this.activeModule = null;

        this.defaultConfig = [
            SingletonConfig.unnamed(TemplateRegistry),
            SingletonConfig.unnamed(StylesRegistry),
            SingletonConfig.unnamed(UniqueIdRegistry),
            SingletonConfig.unnamed(TemplateComponentFactory),
            SingletonConfig.unnamed(InlineComponentFactory),
            PrototypeConfig.unnamed(StateManager)
        ];

        this.defaultConfigProcessors = [ ComponentConfigProcessor ];

        this.defaultInstanceProcessors = [ InstancePostConfigTrigger ];

    }

    async run() {
        LOG.info("Running Application");
        this.config
            .addAllTypeConfig(this.defaultConfig)
            .addAllConfigProcessor(this.defaultConfigProcessors)
            .addAllInstanceProcessor(this.defaultInstanceProcessors);
        ActiveModuleRunner.instance().set(this);
        ContainerUrl.addUserNavigateListener(new Method(this.update, this));
        const module = await this.runModule(History.currentUrl());
        this.startWorkers();
        return module;
    }

    /**
     * 
     * @param {ContainerEvent} event
     */
    update(event) {
        const url = History.currentUrl();

        if (this.activeModule && StringUtils.startsWith(url.anchor, this.activeModule.trailMap.trail)) {
            TrailProcessor.triggerFunctionsAlongAnchor(url, this.activeModule, this.activeModule.trailMap);
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
            const moduleLoader = this.getMatchingModuleLoader(url);
            this.activeModule = await moduleLoader.load();
            this.activeModule.url = url;
            this.activeModule.trailMap = moduleLoader.trailMap;
            this.activeModule.load();
            return this.activeModule;
        } catch(error) {
            LOG.error(error);
            return null;
        }
    }

    startWorkers() {
        if (this.runningWorkers.length > 0) {
            return;
        }
        const config = this.config;
        const runningWorkers = this.runningWorkers;
        this.workerArray.forEach((value) => {
            const instance = new value();
            MindiInjector.inject(instance, config);
            ArrayUtils.add(runningWorkers, instance);
        });
    }

    /**
     * @param {Url} url
     * @returns {DiModuleLoader}
     */
    getMatchingModuleLoader(url) {
        let foundModuleLoader = null;
        this.moduleLoaderArray.forEach((value) => {
            if (!foundModuleLoader && value.matches(url)) {
                foundModuleLoader = value;
            }
        });
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
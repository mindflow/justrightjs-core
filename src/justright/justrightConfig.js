import { Logger } from "coreutil_v1"
import { MindiConfig, SingletonConfig } from "mindi_v1"
import { TemplateRegistry } from "./template/templateRegistry.js";
import { EventRegistry } from "./event/eventRegistry.js";
import { UniqueIdRegistry } from "./component/uniqueIdRegistry.js";
import { ComponentFactory } from "./component/componentFactory.js";
import { State } from "./navigation/state.js";
import { StylesRegistry } from "./styles/stylesRegistry.js";

const LOG = new Logger("JustrightConfig");

export class JustrightConfig {

    static getInstance() {
        return justrightConfig;
    }

    constructor() {
        this.config = new MindiConfig()
            .addTypeConfig(SingletonConfig.unnamed(TemplateRegistry))
            .addTypeConfig(SingletonConfig.unnamed(StylesRegistry))
            .addTypeConfig(SingletonConfig.unnamed(EventRegistry))
            .addTypeConfig(SingletonConfig.unnamed(UniqueIdRegistry))
            .addTypeConfig(SingletonConfig.unnamed(ComponentFactory))
            .addTypeConfig(SingletonConfig.unnamed(State))
    }

    getConfig() {
        return this.config;
    }

}

const justrightConfig = new JustrightConfig();
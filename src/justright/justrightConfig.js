import { Config } from "mindi_v1";
import { TemplateRegistry } from "./template/templateRegistry.js";
import { EventRegistry } from "./event/eventRegistry.js";
import { UniqueIdRegistry } from "./component/uniqueIdRegistry.js";
import { ComponentFactory } from "./component/componentFactory.js";
import { State } from "./navigation/state.js";
import { StylesRegistry } from "./styles/stylesRegistry.js";

export class JustrightConfig {

    static getInstance() {
        if(justrightConfig === null) {
            justrightConfig = new JustrightConfig();
        }
        return justrightConfig;
    }

    constructor() {
        this.config = new Config()
            .addSingleton(TemplateRegistry)
            .addSingleton(StylesRegistry)
            .addSingleton(EventRegistry)
            .addSingleton(UniqueIdRegistry)
            .addSingleton(ComponentFactory)
            .addSingleton(State)
    }

    getConfig() {
        return this.config;
    }

}

var justrightConfig = null;
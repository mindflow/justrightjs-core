import { Logger, List } from "coreutil_v1"
import { SingletonConfig } from "mindi_v1"
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
        this.typeConfigList = new List()
            .add(SingletonConfig.unnamed(TemplateRegistry))
            .add(SingletonConfig.unnamed(StylesRegistry))
            .add(SingletonConfig.unnamed(EventRegistry))
            .add(SingletonConfig.unnamed(UniqueIdRegistry))
            .add(SingletonConfig.unnamed(ComponentFactory))
            .add(SingletonConfig.unnamed(State));
    }

    getTypeConfigList() {
        return this.typeConfigList;
    }

}

const justrightConfig = new JustrightConfig();
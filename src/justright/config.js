import { Logger, List } from "coreutil_v1"
import { SingletonConfig, PrototypeConfig } from "mindi_v1"
import { TemplateRegistry } from "./template/templateRegistry.js";
import { EventRegistry } from "./event/eventRegistry.js";
import { UniqueIdRegistry } from "./component/uniqueIdRegistry.js";
import { ComponentFactory } from "./component/componentFactory.js";
import { State } from "./navigation/state.js";
import { StylesRegistry } from "./styles/stylesRegistry.js";

const LOG = new Logger("Config");

export class Config {

    static getInstance() {
        return justrightConfig;
    }

    constructor() {
        this.typeConfigList = new List([
            SingletonConfig.unnamed(TemplateRegistry),
            SingletonConfig.unnamed(StylesRegistry),
            SingletonConfig.unnamed(UniqueIdRegistry),
            SingletonConfig.unnamed(ComponentFactory),
            SingletonConfig.unnamed(State),
            PrototypeConfig.unnamed(EventRegistry)]);
        }

    getTypeConfigList() {
        return this.typeConfigList;
    }

}

const justrightConfig = new Config();
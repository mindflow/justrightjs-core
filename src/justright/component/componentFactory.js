import { Component } from "./component";
import { UniqueIdRegistry } from "./uniqueIdRegistry";
import { ElementRegistrator } from "./elementRegistrator";
import { EventRegistry } from "../event/eventRegistry";
import { TemplateRegistry } from "../template/templateRegistry";
import { DomTree } from "xmlparser_v1";
import { Logger } from "coreutil_v1";
import { StylesRegistry } from "../styles/stylesRegistry";
import { CanvasStyles } from "../canvas/canvasStyles";

const LOG = new Logger("ComponentFactory");

export class ComponentFactory {

    constructor() {

        /** @type {EventRegistry} */
        this.eventRegistry = EventRegistry;

        /** @type {StylesRegistry} */
        this.stylesRegistry = StylesRegistry;

        /** @type {TemplateRegistry} */
        this.templateRegistry = TemplateRegistry;

        /** @type {UniqueIdRegistry} */
        this.uniqueIdRegistry = UniqueIdRegistry;
    }

    /**
     * 
     * @param {string} name represents the template and the styles name if the style for that name is available
     */
    create(name){
        var template = this.templateRegistry.get(name);
        if(!template) {
            LOG.error(this.templateRegistry);
            throw "No template was found with name " + name;

        }
        var elementRegistrator = new ElementRegistrator(this.eventRegistry, this.uniqueIdRegistry, componentCounter++);
        new DomTree(template.getTemplateSource(),elementRegistrator).load();

        this.mountStyles(name);

        return new Component(elementRegistrator.getComponentIndex(), elementRegistrator.getRootElement(), elementRegistrator.getElementMap());
    }

    mountStyles(name) {
        if(this.stylesRegistry.contains(name)) {
            CanvasStyles.setStyle(name, this.stylesRegistry.get(name));
        }
    }

}

var componentCounter = 0;
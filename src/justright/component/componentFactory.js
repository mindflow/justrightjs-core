import { InjectionPoint } from "mindi_v1";
import { DomTree } from "xmlparser_v1";
import { Logger } from "coreutil_v1";
import { Component } from "./component.js";
import { UniqueIdRegistry } from "./uniqueIdRegistry.js";
import { ElementRegistrator } from "./elementRegistrator.js";
import { TemplateRegistry } from "../template/templateRegistry.js";
import { StylesRegistry } from "../styles/stylesRegistry.js";
import { CanvasStyles } from "../canvas/canvasStyles.js";

const LOG = new Logger("ComponentFactory");

export class ComponentFactory {

    constructor() {

        /** @type {StylesRegistry} */
        this.stylesRegistry = InjectionPoint.instance(StylesRegistry);

        /** @type {TemplateRegistry} */
        this.templateRegistry = InjectionPoint.instance(TemplateRegistry);

        /** @type {UniqueIdRegistry} */
        this.uniqueIdRegistry = InjectionPoint.instance(UniqueIdRegistry);
    }

    /**
     * 
     * @param {string} name represents the template and the styles name if the style for that name is available
     */
    create(name){
        var template = this.templateRegistry.get(name);
        if(!template) {
            LOG.error(this.templateRegistry);
            console.trace();
            throw "No template was found with name " + name;

        }
        var elementRegistrator = new ElementRegistrator(this.uniqueIdRegistry, componentCounter++);
        new DomTree(template.getTemplateSource(),elementRegistrator).load();

        this.mountStyles(name);

        return new Component(elementRegistrator.componentIndex, elementRegistrator.rootElement, elementRegistrator.getElementMap());
    }

    mountStyles(name) {
        if(this.stylesRegistry.contains(name)) {
            CanvasStyles.setStyle(name, this.stylesRegistry.get(name));
        }
    }

}

var componentCounter = 0;
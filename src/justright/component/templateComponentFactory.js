import { InjectionPoint } from "mindi_v1";
import { DomTree } from "xmlparser_v1";
import { Logger } from "coreutil_v1";
import { Component } from "./component.js";
import { UniqueIdRegistry } from "./uniqueIdRegistry.js";
import { ElementRegistrator } from "./elementRegistrator.js";
import { TemplateRegistry } from "../template/templateRegistry.js";
import { StylesRegistry } from "../styles/stylesRegistry.js";
import { CanvasStyles } from "../canvas/canvasStyles.js";
import { ComponentFactory } from "./componentFactory.js";

const LOG = new Logger("TemplateComponentFactory");

export class TemplateComponentFactory extends ComponentFactory{

    constructor() {

        super();

        /** @type {StylesRegistry} */
        this.stylesRegistry = InjectionPoint.instance(StylesRegistry);

        /** @type {TemplateRegistry} */
        this.templateRegistry = InjectionPoint.instance(TemplateRegistry);

        /** @type {UniqueIdRegistry} */
        this.uniqueIdRegistry = InjectionPoint.instance(UniqueIdRegistry);
    }

    /**
     * 
     * @param {function} classType represents the template and the styles name if the style for that name is available
     */
    create(classType){
        const template = this.templateRegistry.get(classType.name);
        if(!template) {
            LOG.error(this.templateRegistry);
            console.trace();
            throw new Error("No template was found with name " + classType.name);

        }
        const elementRegistrator = new ElementRegistrator(this.uniqueIdRegistry, templateComponentCounter++);
        new DomTree(template.getTemplateSource(), elementRegistrator).load();

        this.mountStyles(classType.name);

        return new Component(elementRegistrator.componentIndex, elementRegistrator.rootElement, elementRegistrator.getElementMap());
    }

    mountStyles(name) {
        if (this.stylesRegistry.contains(name)) {
            CanvasStyles.setStyle(name, this.stylesRegistry.get(name));
        }
    }

}

let templateComponentCounter = 0;
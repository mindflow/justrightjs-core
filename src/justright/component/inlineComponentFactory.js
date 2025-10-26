import { InjectionPoint } from "mindi_v1";
import { Component } from "react";
import { StylesRegistry } from "../styles/stylesRegistry";
import { ComponentFactory } from "./componentFactory";
import { UniqueIdRegistry } from "./uniqueIdRegistry";
import { CanvasStyles } from "../canvas/canvasStyles";
import { Component } from "../component/component";
import { ElementRegistrator } from "./elementRegistrator";

export class InlineComponentFactory extends ComponentFactory {

    constructor() {
        super();

        /** @type {StylesRegistry} */
        this.stylesRegistry = InjectionPoint.instance(StylesRegistry);

        /** @type {UniqueIdRegistry} */
        this.uniqueIdRegistry = InjectionPoint.instance(UniqueIdRegistry);
    }

    /**
     * 
     * @param {function} classType represents the inline component class
     */
    create(classType){
        if (!classType.getComponentElement || !classType.getComponentStylesheet) {
            throw new Error("Inline component class must implement static methods getComponentElement() and getComponentStylesheet()");
        }
        let element = classType.getComponentElement();

        let elementRegistrator = new ElementRegistrator(this.uniqueIdRegistry, inlineComponentCounter++);

        let elementMap = this.uniqueIdRegistry.registerElementAndChildren(element);

        let stylesheet = classType.getComponentStylesheet();
        this.mountStyles(classType.name, stylesheet);
        
        return new Component(0, element, elementMap);
    }

    /**
     * 
     * @param {String} name 
     * @param {String} stylesheet 
     */
    mountStyles(name, stylesheet) {
        if (this.stylesRegistry.contains(stylesheet)) {
            CanvasStyles.setStyle(name, stylesheet);
        }
    }

}

let inlineComponentCounter = 0;
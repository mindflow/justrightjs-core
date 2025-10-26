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
        const element = classType.getComponentElement();

        const elementRegistrator = new ElementRegistrator(this.uniqueIdRegistry, inlineComponentCounter++);
``
        const stylesheet = classType.getComponentStylesheet();
        CanvasStyles.setStyle(classType.name, stylesheet);
        
        return new Component(elementRegistrator.componentIndex, elementRegistrator.rootElement, elementRegistrator.getElementMap());
    }

}

let inlineComponentCounter = 0;
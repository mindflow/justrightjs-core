import { InjectionPoint } from "mindi_v1";
import { StylesRegistry } from "../styles/stylesRegistry";
import { ComponentFactory } from "./componentFactory";
import { UniqueIdRegistry } from "./uniqueIdRegistry";
import { CanvasStyles } from "../canvas/canvasStyles";
import { Component } from "../component/component";
import { StylesheetBuilder } from "../styles/stylesheetBuilder";
import { ComponentBuilder } from "../component/componentBuilder";

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
        if (!classType.buildComponent || !classType.buildStylesheet) {
            throw new Error("Inline component class must implement static methods buildComponent() and buildStylesheet()");
        }

        /** @type {Component} */
        const component = classType.buildComponent(ComponentBuilder.create(this.uniqueIdRegistry));

        /** @type {String} */
        const stylesheet = classType.buildStylesheet(StylesheetBuilder.create());

        CanvasStyles.setStyle(classType.name, stylesheet);
        
        return component;
    }

}
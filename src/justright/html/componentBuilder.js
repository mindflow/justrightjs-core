import { Component } from "../component/component";
import { UniqueIdRegistry } from "../component/uniqueIdRegistry";
import { BaseElement } from "../element/baseElement";
import { HTML } from "./html";

export class ComponentBuilder {

    /**
     * 
     * @param {UniqueIdRegistry} idRegistry
     * @param {String} tag 
     * @param {String[]} attributeArray
     * @returns {ComponentBuilder}
     */
    static create(idRegistry, tag, ...attributeArray) {
        return new ComponentBuilder(idRegistry, tag, ...attributeArray);
    }

    /**
     * @param {String} tag 
     * @param {String[]} attributeArray 
     * @param {UniqueIdRegistry} idRegistry
     */
    constructor(idRegistry, tag, ...attributeArray) {

        /** @type {UniqueIdRegistry} */
        this.idRegistry = idRegistry;

        /** @type {Map<String, BaseElement>} */
        this.elementMap = new Map();

        /** @type {BaseElement} */
        this.root = ComponentBuilder.tag(idRegistry, this.elementMap, tag, ...attributeArray);

        /** @type {BaseElement} */
        this.lastAdded = this.root;

        /** @type {BaseElement} */
        this.context = this.root;

        /** @type {BaseElement[]} */
        this.trail = [];

    }

    /**
     * 
     * @param {UniqueIdRegistry} idRegistry
     * @param {Map<String, BaseElement>} elementMap
     * @param {String} tag 
     * @param {String[]} attributeArray 
     * @returns {BaseElement}
     */
    static tag(idRegistry, elementMap, tag, ...attributeArray) {

        /** @type {BaseElement} */
        const element = HTML.custom(tag);

        attributeArray.forEach(attr => {
            let key = attr;
            let val = "";
            if (attr.indexOf(":") !== -1) {
                let indexOfColon = attr.indexOf(":");
                key = attr.substring(0, indexOfColon);
                val = attr.substring(indexOfColon + 1);
                if ("id" === key) {
                    elementMap.set(val, element);
                    val = idRegistry.idAttributeWithSuffix(attr.substring(indexOfColon + 1));
                }
            }
            element.setAttributeValue(key, val);

        });
        return element;
    }

    /**
     * 
     * @param {String} tagName 
     * @param  {String[]} attributeArray
     * @returns {ComponentBuilder}
     */
    add(tagName, ...attributeArray) {
        const element = ComponentBuilder.tag(this.idRegistry, this.elementMap, tagName, ...attributeArray);
        this.context.addChild(element);
        this.lastAdded = element;
        return this;
    }

    open() {
        this.trail.push(this.context);
        this.context = this.lastAdded;
        return this;
    }

    close() {
        if (this.trail.length === 0) {
            throw new Error("HtmlBuilder: No open element context to close.");
        }
        this.context = this.trail.pop();
        this.lastAdded = this.context;
        return this;
    }

    build() {
        return new Component(componentBuilderCounter++, this.root, this.elementMap);
    }
}

let componentBuilderCounter = 0;
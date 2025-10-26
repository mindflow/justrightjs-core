import { BaseElement } from "../element/baseElement";
import { HTML } from "./html";

export class HtmlBuilder {

    /**
     * 
     * @param {String} tag 
     * @param {String[]} attributeArray 
     * @returns {HtmlBuilder}
     */
    static create(tag, attributeArray) {
        return new HtmlBuilder(tag, attributeArray);
    }

    /**
     * @param {String} tag 
     * @param {String[]} attributeArray 
     */
    constructor(tag, attributeArray) {
        /** @type {BaseElement} */
        this.root = HtmlBuilder.tag(tag, attributeArray);

        /** @type {BaseElement} */
        this.lastAdded = this.root;

        /** @type {BaseElement} */
        this.context = this.root;

        /** @type {BaseElement[]} */
        this.trail = [];

    }

    /**
     * 
     * @param {String} tag 
     * @param {String[]} attributeArray 
     * @returns {BaseElement}
     */
    static tag(tag, attributeArray = []) {

        /** @type {BaseElement} */
        const element = HTML.custom(tag);

        attributeArray.forEach(attr => {
            let key = attr;
            let val = "";
            if (attr.indexOf(":") !== -1) {
                let indexOfColon = attr.indexOf(":");
                key = attr.substring(0, indexOfColon);
                val = attr.substring(indexOfColon + 1);
            }
            element.setAttributeValue(key, val);

        });
        return element;
    }

    /**
     * 
     * @param {String} tagName 
     * @param  {String[]} attributeArray
     * @returns {HtmlBuilder}
     */
    add(tagName, attributeArray = []) {
        const element = HtmlBuilder.tag(tagName, attributeArray);
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
        return this.root;
    }
}
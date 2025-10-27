import { StyleClass } from "./styleClass";
import { Stylesheet } from "./stylesheet";

export class StylesheetBuilder {

    /**
     * 
     * @returns {StylesheetBuilder}
     */
    static create() {
        return new StylesheetBuilder();
    }

    constructor() {

        /** @type {StyleClass} */
        this.context = null;

        /** @type {StyleClass[]} */
        this.styleClassArray = [];

    }

    /**
     * 
     * @param {String} styleClassName 
     * @returns {StylesheetBuilder}
     */
    add(styleClassName) {
        const element = new StyleClass(styleClassName);
        this.styleClassArray.push(element);
        this.context = element;
        return this;
    }

    /**
     * 
     * @param {String} property 
     * @param {String|Number} value 
     * @returns {StylesheetBuilder}
     */
    set(property, value) {
        this.context.withAttribute(property, value);
        return this;
    }

    build() {
        let stylesString = "";
        this.styleClassArray.forEach(styleClass => {
            stylesString += styleClass.toString() + "\n";
        });
        return new Stylesheet(stylesString);
    }

}
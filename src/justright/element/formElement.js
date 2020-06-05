/* jshint esversion: 6 */

import {XmlElement} from "xmlparser_v1";
import { BaseElement } from "./baseElement.js";

export class FormElement extends BaseElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    /**
     * Get the value of the inputs name
     *
     * @return {string}
     */
    getName() {
        return this.element.name;
    }

    /**
     * Set the value of inputs name
     *
     * @param {string} value
     */
    setName(value) {
        this.element.name = value;
    }

    submit() {
        return this.element.submit();
    }

}

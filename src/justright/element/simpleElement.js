/* jshint esversion: 6 */

import { XmlElement } from "xmlparser_v1";
import { BaseElement } from "./baseElement.js";

export class SimpleElement extends BaseElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    get innerHTML(){
        return this.element.innerHTML;
    }

    set innerHTML(value){
        this.element.innerHTML = value;
    }

    focus() {
        this.element.focus();
    }

}

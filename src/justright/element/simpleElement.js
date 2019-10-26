/* jshint esversion: 6 */

import {XmlElement} from "xmlparser_v1";
import {AbstractInputElement} from "./abstractInputElement.js";
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

    getInnerHTML(){
        return this.element.innerHTML;
    }

    setInnerHTML(value){
        this.element.innerHTML = value;
    }

}

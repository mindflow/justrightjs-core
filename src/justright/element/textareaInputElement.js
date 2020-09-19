/* jshint esversion: 6 */

import {XmlElement} from "xmlparser_v1";
import {AbstractInputElement} from "./abstractInputElement.js";
import { BaseElement } from "./baseElement.js";

export class TextareaInputElement extends AbstractInputElement{

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

    addChild(input) {
        super.addChild(input);
        this.value = this.getInnerHTML();
    }

    prependChild(input) {
        super.prependChild(input);
        this.value = this.getInnerHTML();
    }

}
/* jshint esversion: 6 */

import {XmlElement} from "xmlparser_v1";
import {AbstractInputElement} from "./abstractInputElement.js";
import { BaseElement } from "./baseElement.js";

export class TextInputElement extends AbstractInputElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

}

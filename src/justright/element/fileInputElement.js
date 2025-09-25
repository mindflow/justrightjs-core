import {XmlElement} from "xmlparser_v1";
import {AbstractInputElement} from "./abstractInputElement.js";
import { BaseElement } from "./baseElement.js";

export class FileInputElement extends AbstractInputElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    async focus() {
        LOG.WARN("File input elements cannot be focused directly due to browser security restrictions.");
        this.element.focus();
    }

}

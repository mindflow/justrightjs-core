import { XmlCdata } from "xmlparser_v1";
import { BaseElement } from "./baseElement.js";
import { ContainerBridge } from "../bridge/containerBridge.js";

export class TextnodeElement {

    /**
     * Constructor
     *
     * @param {XmlCdata} value 
     * @param {BaseElement} parent 
     */
    constructor(value, parent) {
        if(value instanceof XmlCdata) {
            this.element = this.createFromXmlCdata(value, parent);
        }
        if(typeof value === "string"){
            this.element = ContainerBridge.createTextNode(value);
        }
    }

    /**
     * 
     * @param {XmlCdata} cdataElement 
     * @param {BaseElement} parentElement 
     */
    createFromXmlCdata(cdataElement, parentElement) {
        let element = document.createTextNode(cdataElement.value);
        if(parentElement !== null && parentElement.getMappedElement() !== null) {
            parentElement.getMappedElement().appendChild(element);
        }
        return element;
    }

    set value(value) {
        this.element = value;
    }

    get value() {
        return this.element;
    }

    getMappedElement() {
        return this.element;
    }

}

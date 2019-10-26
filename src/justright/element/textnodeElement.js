import {XmlCdata} from "xmlparser_v1";
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

    createFromXmlCdata(cdataElement, parentElement) {
        let element = document.createTextNode(cdataElement.getValue());
        if(parentElement !== null && parentElement.getMappedElement() !== null) {
            parentElement.getMappedElement().appendChild(element);
        }
        return element;
    }

    setValue(value) {
        this.element = value;
    }

    getValue() {
        return this.element;
    }

    getMappedElement() {
        return this.element;
    }

}

import { ContainerElement } from "containerbridge_v1";
import { XmlElement } from "xmlparser_v1";
import { BaseElement } from "../element/baseElement";

export class ElementUtils {


    static createContainerElement(value, parent) {
        if(value instanceof XmlElement) {
            return ElementUtils.createFromXmlElement(value, parent);
        }
        if(typeof value === "string"){
            return ContainerElement.createElement(value);
        }
        if(ContainerElement.isUIElement(value)){
            return value;
        }
        LOG.error("Unrecognized value for Element");
        LOG.error(value);
        return null;
    }

    /**
     * Creates a browser Element from the XmlElement
     *
     * @param {XmlElement} xmlElement
     * @param {BaseElement} parentElement
     * @return {HTMLElement}
     */
     static createFromXmlElement(xmlElement, parentElement) {
        let element = null;
        if(xmlElement.namespace){
            element = ContainerElement.createElementNS(xmlElement.namespaceUri, xmlElement.fullName);
        }else{
            element = ContainerElement.createElement(xmlElement.name);
        }
        if(parentElement && parentElement.mappedElement !== null) {
            ContainerElement.appendChild(parentElement.mappedElement, element);
        }
        xmlElement.attributes.forEach((attributeKey, attribute) => {
            ContainerElement.setAttribute(element, attributeKey, attribute.value);
            return true;
        });
        return element;
    }

}
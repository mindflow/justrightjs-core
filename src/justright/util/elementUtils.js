import { ContainerElement } from "containerbridge_v1";
import { Logger } from "coreutil_v1";
import { XmlElement } from "xmlparser_v1";
import { MappedHtmlElement } from "../element/mappedHtmlElement";

const LOG = new Logger("ElementUtils");

export class ElementUtils {


    /**
     * 
     * @param {any} value 
     * @param {MappedHtmlElement} parent 
     * @returns 
     */
    static createContainerElement(value, parent) {
        if (value instanceof XmlElement) {
            return ElementUtils.createFromXmlElement(value, parent);
        }
        if (typeof value === "string") {
            return ContainerElement.createElement(value);
        }
        if (ContainerElement.isUIElement(value)) {
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
     * @param {MappedHtmlElement} parentElement
     * @return {HTMLElement}
     */
    static createFromXmlElement(xmlElement, parentElement) {
        let element = null;
        if (xmlElement.namespace) {
            element = ContainerElement.createElementNS(xmlElement.namespaceUri, xmlElement.fullName);
        } else {
            element = ContainerElement.createElement(xmlElement.name);
        }
        if (parentElement && parentElement.mappedElement !== null) {
            ContainerElement.appendChild(parentElement.mappedElement, element);
        }
        xmlElement.attributes.forEach((attributeKey, attribute) => {
            ContainerElement.setAttribute(element, attributeKey, attribute.value);
            return true;
        });
        return element;
    }

}
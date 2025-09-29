import { ContainerElementUtils } from "containerbridge_v1";
import { Logger } from "coreutil_v1";
import { XmlElement } from "xmlparser_v1";
import { MappedContainerElement } from "../element/mappedContainerElement";

const LOG = new Logger("ElementUtils");

export class ElementUtils {


    /**
     * 
     * @param {any} value 
     * @param {MappedContainerElement} parent 
     * @returns 
     */
    static createContainerElement(value, parent) {
        if (value instanceof XmlElement) {
            return ElementUtils.createFromXmlElement(value, parent);
        }
        if (typeof value === "string") {
            return ContainerElementUtils.createElement(value);
        }
        if (ContainerElementUtils.isUIElement(value)) {
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
     * @param {MappedContainerElement} parentElement
     * @return {HTMLElement}
     */
    static createFromXmlElement(xmlElement, parentElement) {
        let element = null;
        if (xmlElement.namespace) {
            element = ContainerElementUtils.createElementNS(xmlElement.namespaceUri, xmlElement.fullName);
        } else {
            element = ContainerElementUtils.createElement(xmlElement.name);
        }
        if (parentElement && parentElement.containerElement !== null) {
            ContainerElementUtils.appendChild(parentElement.containerElement, element);
        }
        xmlElement.attributes.forEach((attributeKey, attribute) => {
            ContainerElementUtils.setAttributeValue(element, attributeKey, attribute.value);
            return true;
        });
        return element;
    }

}
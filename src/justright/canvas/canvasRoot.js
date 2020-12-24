import { ContainerFunctions } from "containerbridge_v1";
import { BaseElement } from "../element/baseElement";

export class CanvasRoot {

    static replaceComponent(id, component) {
        var bodyElement = ContainerFunctions.getElementById(id);
        bodyElement.parentNode.replaceChild(component.rootElement.mappedElement, bodyElement);
    }

    static setComponent(id, component) {
        var bodyElement = ContainerFunctions.getElementById(id);
        bodyElement.innerHTML = '';
        bodyElement.appendChild(component.rootElement.mappedElement, bodyElement);
    }

    static addChildComponent(id, component) {
        var bodyElement = ContainerFunctions.getElementById(id);
        bodyElement.appendChild(component.rootElement.mappedElement);
    }

    static addChildElement(id, element) {
        var bodyElement = ContainerFunctions.getElementById(id);
        bodyElement.appendChild(element.mappedElement);
    }

    static removeElement(id) {
        ContainerFunctions.removeElement(id);
    }

    /** 
     * @param {BaseElement} element
     */
    static addHeaderElement(element) {
        ContainerFunctions.addHeaderElement(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static addBodyElement(element) {
        ContainerFunctions.addBodyElement(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependHeaderElement(element) {
        ContainerFunctions.prependHeaderElement(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependBodyElement(element) {
        ContainerFunctions.prependBodyElement(element.mappedElement);
    }
}
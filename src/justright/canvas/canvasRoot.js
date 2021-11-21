import { ContainerElement, ContainerWindow } from "containerbridge_v1";
import { ObjectFunction } from "coreutil_v1";
import { BaseElement } from "../element/baseElement.js";
import { Event } from "../event/event.js";

export class CanvasRoot {

    static shouldSwallowNextFocusEscape = false;

    static replaceComponent(id, component) {
        var bodyElement = ContainerElement.getElementById(id);
        bodyElement.parentNode.replaceChild(component.rootElement.mappedElement, bodyElement);
    }

    static setComponent(id, component) {
        var bodyElement = ContainerElement.getElementById(id);
        bodyElement.innerHTML = '';
        bodyElement.appendChild(component.rootElement.mappedElement, bodyElement);
    }

    static addChildComponent(id, component) {
        var bodyElement = ContainerElement.getElementById(id);
        bodyElement.appendChild(component.rootElement.mappedElement);
    }

    static addChildElement(id, element) {
        var bodyElement = ContainerElement.getElementById(id);
        bodyElement.appendChild(element.mappedElement);
    }

    static removeElement(id) {
        ContainerElement.removeElement(id);
    }

    /** 
     * @param {BaseElement} element
     */
    static addHeaderElement(element) {
        ContainerElement.appendRootMetaChild(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static addBodyElement(element) {
        ContainerElement.appendRootUiChild(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependHeaderElement(element) {
        ContainerElement.prependElement("head", element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependBodyElement(element) {
        ContainerElement.prependElement("body", element.mappedElement);
    }

    /** 
     * @param {ObjectFunction} listener
     * @param {BaseElement} element
     */
    static listenToFocusEscape(listener, element) {
        
        const callIfNotContains = new ObjectFunction(null, (event) => {
            if (ContainerElement.contains(element.element, event.getTarget().element)) {
                return;
            }
            if (CanvasRoot.shouldSwallowNextFocusEscape) {
                return;
            }
            listener.call(event);
        });
        ContainerWindow.addEventListener("click", callIfNotContains, Event);
    }

    static swallowFocusEscape(forMilliseconds) {
        CanvasRoot.shouldSwallowNextFocusEscape = true;
        setTimeout(() => {
            CanvasRoot.shouldSwallowNextFocusEscape = false;
        }, forMilliseconds);
    }
}
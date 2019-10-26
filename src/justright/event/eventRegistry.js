/* jshint esversion: 6 */

import {List,Map,ObjectFunction, Logger} from "coreutil_v1";
import {Event} from "./event.js";
import { BaseElement } from "../element/baseElement.js";

const LOG = new Logger("EventRegistry");

export class EventRegistry {

    constructor() {
        this.listeners = new Map();
        this.beforeListeners = new Map();
        this.afterListeners = new Map();
    }

    /**
     * 
     * @param {BaseElement} element the element which is the source of the event and which can be attached to
     * @param {string} eventType the event type as it is defined by the containing trigger (example "onclick")
     * @param {string} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {string} componentIndex unique id of the component which owns the element
     */
    attach(element, eventType, eventName, componentIndex) {
        var uniqueEventName = eventName + "_" + componentIndex;
        var theEventRegistry = this;
        element.attachEvent(eventType, function(event) { theEventRegistry.trigger(uniqueEventName, eventName, event); });
    }

    /**
     * 
     * @param {string} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {ObjectFunction} listener the object which owns the handler function
     * @param {string} uniqueIndex a unique index for the event
     */
    listen(eventName, objectFunction, uniqueIndex) {
        eventName = eventName + "_" + uniqueIndex;
        if(!this.listeners.exists(eventName)){
            this.listeners.set(eventName,new List());
        }
        this.listeners.get(eventName).add(objectFunction);
    }

    listenBefore(eventName,handlerObject,handlerFunction) {
        if(!this.beforeListeners.exists(eventName)) {
            this.beforeListeners.set(eventName,new List());
        }
        var objectFunction = new ObjectFunction(handlerObject,handlerFunction);
        this.beforeListeners.get(eventName).add(objectFunction);
    }

    listenAfter(eventName,handlerObject,handlerFunction) {
        if(!this.afterListeners.exists(eventName)){
            this.afterListeners.set(eventName,new List());
        }
        this.afterListeners.get(eventName).add(new ObjectFunction(handlerObject,handlerFunction));
    }

    trigger(suffixedEventName, eventName, event) {
        this.handleBefore(eventName, event);
        if(this.listeners.exists(suffixedEventName)) {
            var currentListeners = new List();
            this.listeners.get(suffixedEventName).forEach(function(value, parent){
                currentListeners.add(value);
                return true;
            },this);
            currentListeners.forEach(function(value, parent){
                value.call(new Event(event));
                return true;
            },this);
        }
        this.handleAfter(eventName, event);
    }

    handleBefore(eventName, event) {
        this.handleGlobal(this.beforeListeners,eventName, event);
    }

    handleAfter(eventName, event) {
        this.handleGlobal(this.afterListeners,eventName, event);
    }

    handleGlobal(listeners, eventName, event) {
        if(listeners.exists(eventName)) {
            var currentListeners = new List();
            listeners.get(eventName).forEach(function(value,parent){
                currentListeners.add(value);
                return true;
            },this);
            currentListeners.forEach(function(value,parent){
                value.call(new Event(event));
                return true;
            },this);
        }
    }
}

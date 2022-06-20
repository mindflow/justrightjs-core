import { Method, Map, List } from "coreutil_v1";
import { Event } from "./event.js";

/**
 * EventManager
 */
export class EventManager {


    /**
     * 
     */
    constructor() {
        /** @type Map<List<Method>> */
        this.listenerMap = new Map();
    }

    /**
     * 
     * @param {string} eventType 
     * @param {Method} listener 
     * @returns {EventManager}
     */
    listenTo(eventType, listener) {
        if (!this.listenerMap.contains(eventType)) {
            this.listenerMap.set(eventType, new List());
        }
        this.listenerMap.get(eventType).add(listener);
        return this;
    }

    /**
     * 
     * @param {string} eventType 
     * @param {Array|any} parameter 
     */
    trigger(eventType, parameter) {
        if (!this.listenerMap.contains(eventType)) {
            return;
        }
        this.listenerMap.get(eventType).forEach((listener, parent) => {
            listener.call(parameter);
            return true;
        });
    }

}
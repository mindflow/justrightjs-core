import { List, StringUtils } from "coreutil_v1";
import { TrailNode } from "./trailNode.js";
import { History } from "./history.js";

export class TrailProcessor {

    /**
     * 
     * @param {any} object 
     * @param {TrailNode} node 
     * @param {Url} url 
     */
    static load(object, node, url) {
        const trail = TrailProcessor.processNode(object, node, url);

        const currentUrl = History.currentUrl();
        currentUrl.setBookmark(null);
        History.replaceUrl(currentUrl, currentUrl.toString(), trail);
        
        trail.forEach((value) => {
            currentUrl.setBookmark(value);
            History.pushUrl(currentUrl, currentUrl.toString(), trail);
            return true;
        }, this);
    }

    /**
     * 
     * @param {any} object 
     * @param {TrailNode} node 
     * @param {Url} url 
     */
     static update(object, node, url) {
        TrailProcessor.processNode(object, node, url);
    }

    /**
     * 
     * @param {any} object 
     * @param {TrailNode} parentNode 
     * @param {Url} url 
     * @param {List<String>} trailStops
     * @returns {List<String>}
     */
    static processNode(object, parentNode, url, trailStops = new List()) {
        let currentObject = object;

        if (parentNode.property) {
            currentObject = object[parentNode.property];
        }

        if (StringUtils.startsWith(url.bookmark, TrailProcessor.toStartsWith(parentNode.path))) {
            // Add value.path to history
            trailStops.add(parentNode.path);
            if (parentNode.waypoint) {
                parentNode.waypoint.call(currentObject);
            }
        }
        if (StringUtils.nonNullEquals(url.bookmark, parentNode.path)) {
            // Add value.path to history
            trailStops.add(parentNode.path);
            if (parentNode.destination) {
                parentNode.destination.call(currentObject);
            }
        }

        if (parentNode.next) {
            parentNode.next.forEach((childNode) => {
                trailStops = TrailProcessor.processNode(currentObject, childNode, url, trailStops);
            });
        }

        return trailStops;
    }

    static toStartsWith(path) {
        if (null == path) {
            return "/";
        }
        if (StringUtils.nonNullEquals(path, "/")) {
            return "/";
        }
        return path + "/";
    }

}
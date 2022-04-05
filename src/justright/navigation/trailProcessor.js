import { List, StringUtils } from "coreutil_v1";
import { TrailNode } from "./trailNode.js";
import { History } from "./history.js";
import { UrlBuilder } from "../util/urlBuilder.js";

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
        const urlBuilder = UrlBuilder.builder().withAllOfUrl(currentUrl);
        const newUrl = urlBuilder.withBookmark(null).build();
        History.replaceUrl(newUrl, newUrl.toString(), trail);
        
        trail.forEach((value) => {
            const newUrl = urlBuilder.withBookmark(value).build();
            History.pushUrl(newUrl, newUrl.toString(), trail);
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

        if (StringUtils.startsWith(url.bookmark, TrailProcessor.toStartsWith(parentNode.trail))) {
            trailStops.add(parentNode.trail);
            if (parentNode.waypoint) {
                parentNode.waypoint.call(currentObject);
            }
        }
        if (StringUtils.nonNullEquals(url.bookmark, parentNode.trail)) {
            trailStops.add(parentNode.trail);
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

    static toStartsWith(trail) {
        if (null == trail) {
            return "/";
        }
        if (StringUtils.nonNullEquals(trail, "/")) {
            return "/";
        }
        return trail + "/";
    }

}
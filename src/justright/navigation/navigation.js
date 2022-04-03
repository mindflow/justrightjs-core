import { History } from "./history.js";
import { Url } from "../util/url.js";

let navigatoion = null;

export class Navigation {

    constructor() {

    }

    static instance() {
        if (!navigatoion) {
            navigatoion = new Navigation();
        }
        return navigatoion;
    }

    /**
     * Navigate browser to new url
     * @param {Url} url 
     */
    go(url) {
        ContainerUrl.go(url.toString());
    }

    /**
     * Navigate browser back
     */
    back() {
        ContainerUrl.back();
    }

    /**
     * Load path without renavigating browser
     * @param {string} path
     * @returns {Url}
     */
    load(path) {
        const url = History.currentUrl();
        url.determinePath(path);
        History.pushUrl(url);
        return url;
    }

}
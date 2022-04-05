import { History } from "./history.js";
import { Url } from "../util/url.js";
import { ContainerUrl } from "containerbridge_v1";
import { UrlBuilder } from "../util/urlBuilder.js";

let navigatoion = null;

export class Navigation {

    constructor() {

    }

    /**
     * 
     * @returns {Navigation}
     */
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
        const newUrl = UrlBuilder.builder().withRootOfUrl(url).withPath(path).build();
        History.pushUrl(newUrl);
        return newUrl;
    }

}
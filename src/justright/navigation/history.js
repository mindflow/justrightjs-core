import { ContainerBridge } from "bridge_v1";
import { Url } from "../util/url";

export class History {

    static replaceUrl(url, title, stateObject) {
        ContainerBridge.replaceUrl(url.toString(), title, stateObject);
    }

    static pushUrl(url, title, stateObject) {
        ContainerBridge.pushUrl(url.toString(), title, stateObject);
    }

    static getUrl() {
        return new Url(ContainerBridge.currentUrl());
    }

    static loadUrl(url) {
        ContainerBridge.loadUrl(url.toString());
    }
}
import { ContainerUrl } from "containerbridge_v1";
import { Url } from "../util/url";

export class History {

    static replaceUrl(url, title, stateObject) {
        ContainerUrl.replaceUrl(url.toString(), title, stateObject);
    }

    static pushUrl(url, title, stateObject) {
        ContainerUrl.pushUrl(url.toString(), title, stateObject);
    }

    static getUrl() {
        return new Url(ContainerUrl.currentUrl());
    }

    static loadUrl(url) {
        ContainerUrl.loadUrl(url.toString());
    }
}
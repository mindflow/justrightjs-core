import { ContainerFunctions } from "containerbridge_v1";
import { Url } from "../util/url";

export class History {

    static replaceUrl(url, title, stateObject) {
        ContainerFunctions.replaceUrl(url.toString(), title, stateObject);
    }

    static pushUrl(url, title, stateObject) {
        ContainerFunctions.pushUrl(url.toString(), title, stateObject);
    }

    static getUrl() {
        return new Url(ContainerFunctions.currentUrl());
    }

    static loadUrl(url) {
        ContainerFunctions.loadUrl(url.toString());
    }
}
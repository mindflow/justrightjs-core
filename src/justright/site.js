import { List } from "coreutil_v1"

export class Site {

    constructor() {

        /** @type {List} */
        this.typeConfigList = new List();
        
        /** @type {List} */
        this.workers = new List();

        /** @type {List} */
        this.loaderList = new List();
    }

}
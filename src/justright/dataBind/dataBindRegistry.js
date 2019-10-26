import { List } from "coreutil_v1";
import { AbstractDataBinding } from "./abstractDataBinding.js";

export class DataBindRegistry {

    constructor() {
        this.dataBindingList = new List();
    }

    static getInstance() {
        return inputs;
    }

    /**
     * 
     * @param {AbstractDataBinding} dataBinding 
     */
    add(dataBinding) {
        this.dataBindingList.add(dataBinding);
    }

    pullAll() {
        this.dataBindingList.forEach((mapping) => {
            mapping.pull();
            return true;
        }, this);
    }

    pushAll() {
        this.dataBindingList.forEach((mapping) => {
            mapping.push();
            return true;
        }, this);
    }
}

var inputs = new DataBindRegistry();

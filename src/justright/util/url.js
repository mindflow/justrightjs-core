import { StringUtils } from "coreutil_v1";

export class Url{

    /**
     * 
     * @param {String} protocol 
     * @param {String} host 
     * @param {String} port 
     * @param {Array<String>} pathValueArray 
     * @param {Map<String, Array<String>>} queryParamMap
     * @param {String} anchor 
     */
    constructor(protocol, host, port = null, pathValueArray = null, queryParamMap = null, anchor = null){

        /** @type {String} */
        this.protocolString = protocol;

        /** @type {String} */
        this.hostString = host;

        /** @type {String} */
        this.portString = port;

        /** @type {Array<String>} */
        this.pathValueArray = pathValueArray;

        /** @type {Map<String, Array<String>>} */
        this.queryParamMap = queryParamMap;

        /** @type {String} */
        this.anchorString = anchor;
        
        if (!this.pathValueArray) {
            this.pathValueArray = new Array();
        }
        if (!this.queryParamMap) {
            this.queryParamMap = new Map();
        }
    }

    get protocol(){
        return this.protocolString;
    }

    get host(){
        return this.hostString;
    }

    get port(){
        return this.portString;
    }

    get pathsList(){
        return this.pathValueList;
    }

    get anchor(){
        return this.anchorString;
    }

    get parameterMap() {
        return this.parameterValueMap;
    }

    getPathPart(index){
        return this.pathValueList.get(index);
    }

    replacePathValue(from, to){
        let i = 0;
        while (i < this.pathValueArray.length) {
            if (StringUtils.nonNullEquals(from, this.pathValueArray[i])) {
                this.pathValueArray[i] = to;
                return this;
            }
            i ++;
        }
        return this;
    }

    get path(){
        let path = "/";
        let first = true;
        this.pathValueList.forEach((value => {
            if (!first) {
                path = path + "/";
            }
            path = path + value;
            first = false;
        }), this);
        return path;
    }

    toString(){
        var value = "";
        if(this.protocol !== null){
            value = value + this.protocol + "//";
        }
        if(this.host !== null){
            value = value + this.host;
        }
        if(this.port !== null){
            value = value + ":" + this.port;
        }

        this.pathValueArray.forEach((pathPart) => {
            value = value + "/" + pathPart;
        });

        if(this.queryParamMap.size > 0){
            const queryParamStrings = new Array();
            this.queryParamMap.forEach((valueArray, key) => {
                valueArray.forEach((value) => {
                    if (value !== null) {
                        queryParamStrings.push(key + "=" + value);
                    } else {
                        queryParamStrings.push(key);
                    }
                    return true;
                });
            });
            if (queryParamStrings.length > 0) {
                value = value + "?" + queryParamStrings.join("&");
            }
        }

        if(this.anchor !== null) {
            value = value + "#" + this.anchor;
        }
        return value;
    }

}

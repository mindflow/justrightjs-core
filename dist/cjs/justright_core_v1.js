'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var containerbridge_v1 = require('containerbridge_v1');
var coreutil_v1 = require('coreutil_v1');
var mindi_v1 = require('mindi_v1');
var xmlparser_v1 = require('xmlparser_v1');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

class ModuleRunner {

    /**
     * 
     * @param {Url} url 
     * @returns 
     */
     runModule(url) {
     }

}

class Url{

    /**
     * 
     * @param {String} protocol 
     * @param {String} host 
     * @param {String} port 
     * @param {List} pathValueList 
     * @param {Map} parameterValueMap 
     * @param {String} bookmark 
     */
    constructor(protocol, host, port, pathValueList, parameterValueMap, bookmark){

        /** @type {String} */
        this.protocolString = protocol;

        /** @type {String} */
        this.hostString = host;

        /** @type {String} */
        this.portString = port;

        /** @type {List} */
        this.pathValueList = pathValueList;

        /** @type {Map} */
        this.parameterValueMap = parameterValueMap;

        /** @type {String} */
        this.bookmarkString = bookmark;
        
        if (!this.pathValueList) {
            this.pathValueList = new coreutil_v1.List();
        }
        if (!this.parameterValueMap) {
            this.parameterValueMap = new coreutil_v1.Map();
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

    get bookmark(){
        return this.bookmarkString;
    }

    get parameterMap() {
        return this.parameterValueMap;
    }

    getPathPart(index){
        return this.pathValueList.get(index);
    }

    replacePathValue(from, to){
        let i = 0;
        while (i < this.pathValueList.size()) {
            if (coreutil_v1.StringUtils.nonNullEquals(from, this.pathValueList.get(i))) {
                this.pathValueList.set(i, to);
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

    getParameter(key) {
        return this.parameterMap.get(key);
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

        this.pathValueList.forEach(function(pathPart,parent){
            value = value + "/" + pathPart;
            return true;
        },this);

        var firstParameter = true;

        this.parameterMap.forEach(function(parameterKey,parameterValue,parent){
            if(firstParameter){
                firstParameter=false;
                value = value + "?";
            }else {
                value = value + "&";
            }
            value = value + encodeURI(parameterKey) + "=" + encodeURI(parameterValue);
        },this);

        if(this.bookmark !== null) {
            value = value + "#" + this.bookmark;
        }
        return value;
    }

}

class UrlUtils {

    /**
     * Parse string to url
     * @param {string} urlString 
     * @returns {Url}
     */
    static parse(urlString) {
        
        let remaining = { "string" : urlString };

        if (urlString === null) { return null; }

        const protocol =      UrlUtils.determineProtocol(remaining);
        const hostAndPort =   UrlUtils.determineHostAndPort(remaining);
        const host =          UrlUtils.extractHost(hostAndPort);
        const port =          UrlUtils.extractPort(hostAndPort);
        const pathsList =     UrlUtils.determinePath(remaining);
        const parametersMap = UrlUtils.determineParameters(remaining);
        const bookmark =      UrlUtils.determineBookmark(remaining);

        return new Url(protocol, host, port, pathsList, parametersMap, bookmark);
    }

    static determineProtocol(remaining){
        let value = remaining["string"];

        if (!value) {
            return null;
        }

        let protocol = value;

        if (value.indexOf("//") === -1){
            // No '//' to indicate protocol 
            return null;
        }

        let parts = value.split("//");
        if(parts[0].indexOf("/") !== -1){
            // slash should not be in protocol
            return null;
        }

        protocol = parts[0];
        if (parts.length == 1){
            remaining["string"] = null;
        } else {
            remaining["string"] = value.replace(parts[0] + "//", "");
        }

        return protocol;
    }

    static determineHostAndPort(remaining){
        let value = remaining["string"];

        if (!value) {
            return null;
        }

        let hostAndPort = value;
        let remainingString = null;

        if (hostAndPort.indexOf("/") !== -1) {
            // Host comes before the first '/'
            hostAndPort = hostAndPort.split("/")[0];
            remainingString = value.replace(hostAndPort + "/", "");
        }

        remaining["string"] = remainingString;
        return hostAndPort;
    }

    static extractHost(hostAndPort){
        if (!hostAndPort) {
            return null;
        }
        if(hostAndPort.indexOf(":") === -1){
            return hostAndPort;
        }
        return hostAndPort.split(":")[0];
    }

    static extractPort(hostAndPort){
        if (!hostAndPort) {
            return null;
        }
        if(hostAndPort.indexOf(":") === -1){
            return null;
        }
        return hostAndPort.split(":")[1];
    }

    static determinePath(remaining){
        let value = remaining["string"];

        if (!value) {
            return new coreutil_v1.List();
        }

        let path = value;

        if (path.indexOf("?") !== -1){
            let parts = path.split("?");
            if (parts.length > 1) {
                remaining["string"] = path.substring(path.indexOf("?"));
            }
            path = parts[0];

        } else if (path.indexOf("#") !== -1){
            let parts = path.split("#");
            if (parts.length > 1) {
                remaining["string"] = path.substring(path.indexOf("#"));
            }
            path = parts[0];

        } else {
            remaining["string"] = null;
        }

        if (path.startsWith("/")) {
            path = value.substring(1);
        }

        const rawPathPartList = new coreutil_v1.List(path.split("/"));

        const pathValueList = new coreutil_v1.List();
        rawPathPartList.forEach((value) => {
            pathValueList.add(decodeURI(value));
            return true;
        }, this);

        return pathValueList;
    }

    static determineParameters(remaining){
        const value = remaining["string"];

        if (!value) {
            return new coreutil_v1.Map();
        }

        let parameters = value;

        if(parameters.indexOf("?") === -1) {
            return new coreutil_v1.Map();
        }
        parameters = parameters.substring(parameters.indexOf("?")+1);
        if(parameters.indexOf("#") !== -1) {
            remaining["string"] = parameters.substring(parameters.indexOf("#"));
            parameters = parameters.substring(0,parameters.indexOf("#"));
        } else {
            remaining["string"] = null;
        }

        const parameterPartList = new coreutil_v1.List(parameters.split("&"));
        const parameterMap = new coreutil_v1.Map();
        parameterPartList.forEach((value) => {
            let keyValue = value.split("=");
            if(keyValue.length >= 2){
                parameterMap.set(decodeURI(keyValue[0]),decodeURI(keyValue[1]));
            }
            return true;
        }, this);

        return parameterMap;
    }

    static determineBookmark(remaining){
        let value = remaining["string"];

        if (!value) {
            remaining["string"] = null;
            return null;
        }

        let bookmark = value;
        if(value.indexOf("#") !== -1) {
            bookmark = value.substring(value.indexOf("#")+1);
            remaining["string"] = null;
        }
        return bookmark;
    }


}

class History {

    static replaceUrl(url, title, stateObject) {
        containerbridge_v1.ContainerUrl.replaceUrl(url.toString(), title, stateObject);
    }

    static pushUrl(url, title, stateObject) {
        containerbridge_v1.ContainerUrl.pushUrl(url.toString(), title, stateObject);
    }

    static currentUrl() {
        return UrlUtils.parse(containerbridge_v1.ContainerUrl.currentUrl());
    }

}

class UrlBuilder {

    constructor() {
        this.protocol = null;
        this.host = null;
        this.port = null;
        this.pathsList = new coreutil_v1.List();
        this.parametersMap = new coreutil_v1.Map();
        this.bookmark = null;
    }

    /**
     * 
     * @returns {UrlBuilder}
     */
    static builder() {
        return new UrlBuilder();
    }

    /**
     * 
     * @param {string} url 
     * @returns {UrlBuilder}
     */
     withUrl(url) {
        this.withAllOfUrl(UrlUtils.parse(url));
        return this;
    }

    /**
     * 
     * @param {Url} url 
     * @returns {UrlBuilder}
     */
     withRootOfUrl(url) {
        this.protocol = url.protocol;
        this.port = url.port;
        this.host = url.host;
        return this;
    }

    /**
     * 
     * @param {Url} url 
     * @returns {UrlBuilder}
     */
     withPathOfUrl(url) {
        this.withRootOfUrl(url);
        this.pathsList = url.pathsList;
        return this;
    }

    /**
     * 
     * @param {Url} url 
     * @returns {UrlBuilder}
     */
    withAllOfUrl(url) {
        this.withPathOfUrl(url);
        this.parametersMap = url.parameterMap;
        this.bookmark = url.bookmark;
        return this;
    }

    /**
     * 
     * @param {string} protocol 
     * @returns {UrlBuilder}
     */
    withProtocol(protocol) {
        this.protocol = UrlUtils.determinePath({ "string" : protocol });
        return this;
    }

    /**
     * 
     * @param {string} host 
     * @returns {UrlBuilder}
     */
    withHost(host) {
        this.host = UrlUtils.determinePath({ "string" : host });
        return this;
    }

    /**
     * 
     * @param {string} path 
     * @returns {UrlBuilder}
     */
    withPath(path) {
        this.pathsList = UrlUtils.determinePath({ "string" : path });
        return this;
    }

    /**
     * 
     * @param {string} parameters 
     * @returns {UrlBuilder}
     */
    withParameters(parameters) {
        this.parametersMap = UrlUtils.determinePath({ "string" : parameters });
        return this;
    }

    /**
     * 
     * @param {string} bookmark 
     * @returns {UrlBuilder}
     */
    withBookmark(bookmark) {
        this.bookmark = UrlUtils.determineBookmark({ "string" : bookmark });
        return this;
    }

    build() {
        return new Url(this.protocol, this.host, this.port, this.pathsList, this.parametersMap, this.bookmark);
    }
}

let navigatoion = null;

class Navigation {

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
        containerbridge_v1.ContainerUrl.go(url.toString());
    }

    /**
     * Navigate browser back
     */
    back() {
        containerbridge_v1.ContainerUrl.back();
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

let activeModuleRunner = null;

class ActiveModuleRunner {

    constructor() {

        /** @type {ModuleRunner} */
        this.moduleRunner = null;
    }

    /**
     * 
     * @returns {ActiveModuleRunner}
     */
    static instance() {
        if (!activeModuleRunner) {
            activeModuleRunner = new ActiveModuleRunner();
        }
        return activeModuleRunner;
    }

    /**
     * 
     * @param {ModuleRunner} newModuleRunner 
     */
    set(newModuleRunner) {
        this.moduleRunner = newModuleRunner;
    }

    /**
     * Load path without renavigating browser
     * @param {string} path 
     */
     async load(path) {
        const url = Navigation.instance().load(path);
        return await this.moduleRunner.runModule(url);
    }
}

class Client {

    /**
     * 
     * @param {string} url 
     * @returns {Promise<Response>}
     */
    static get(url, connectionTimeout = 4000, responseTimeout = 4000, authorization = null){
        let headers = Client.getHeader(authorization);
        var params =  {
            headers: headers,
            method: 'GET',
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow' // manual, *follow, error
        };
        return containerbridge_v1.ContainerHttpClient.fetch(url.toString(),params, connectionTimeout, responseTimeout);
    }

    /**
     * 
     * @param {string} url 
     * @param {string} data
     * @returns {Promise<Response>}
     */
    static post(url, data, connectionTimeout = 4000, responseTimeout = 4000, authorization = null){
        let headers = Client.getHeader(authorization);
        var params =  {
            body: JSON.stringify(data), // must match 'Content-Type' header
            headers: headers,
            method: "POST",
            mode: "cors", // no-cors, cors, *same-origin
            redirect: "follow", // manual, *follow, error
        };
        return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, connectionTimeout, responseTimeout);
    }

    /**
     * 
     * @param {string} url 
     * @param {string} data
     * @returns {Promise<Response>}
     */
    static put(url, data, connectionTimeout = 4000, responseTimeout = 4000, authorization = null){
        let headers = Client.getHeader(authorization);
        var params =  {
            body: JSON.stringify(data), // must match 'Content-Type' header
            method: 'PUT', 
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow', // manual, *follow, error
            headers: headers
        };
        return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, connectionTimeout, responseTimeout);
    }

    /**
     * 
     * @param {string} url 
     * @param {string} data
     * @returns {Promise<Response>}
     */
    static patch(url, data, connectionTimeout = 4000, responseTimeout = 4000, authorization = null){
        let headers = Client.getHeader(authorization);
        var params =  {
            body: JSON.stringify(data), // must match 'Content-Type' header
            method: 'PATCH', 
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow', // manual, *follow, error
            headers: headers
        };
        return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, connectionTimeout, responseTimeout);
    }

    /**
     * 
     * @param {string} url
     * @returns {Promise<Response>}
     */
    static delete(url, connectionTimeout = 4000, responseTimeout = 4000){
        var params =  {
            method: 'DELETE',
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow' // manual, *follow, error
        };
        return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, connectionTimeout, responseTimeout);
    }

    static getHeader(authorization = null) {
        let headers = {
            "user-agent": "Mozilla/4.0 MDN Example",
            "content-type": "application/json"
        };
        if (authorization) {
            headers = {
                "user-agent": "Mozilla/4.0 MDN Example",
                "content-type": "application/json",
                "Authorization": authorization
            };
        }
        return headers;
    }
}

class Styles{

    /**
     * 
     * @param {string} stylesSource 
     */
    constructor(stylesSource){

        /** @type {string} */
        this.stylesSource = stylesSource;
    }

    /**
     * @returns {string}
     */
    getStylesSource(){
        return this.stylesSource;
    }

}

/* jshint esversion: 6 */

const LOG$9 = new coreutil_v1.Logger("StylesRegistry");

class StylesRegistry {

    constructor(){
        /** @type {Map} */
        this.stylesMap = new coreutil_v1.Map();

        /** @type {Map} */
        this.stylesUrlMap = new coreutil_v1.Map();

        /** @type {integer} */
        this.stylesQueueSize = 0;

        /** @type {Method} */
        this.callback = null;
    }

    /**
     * 
     * @param {string} name 
     * @param {Styles} styles 
     * @param {Url} url 
     */
    set(name,styles,url){
        if(url !== undefined && url !== null) {
            this.stylesUrlMap.set(name, url);
        }
        this.stylesMap.set(name, styles);
    }

    /**
     * 
     * @param {string} name 
     */
    get(name){
        return this.stylesMap.get(name);
    }

    /**
     * 
     * @param {string} name 
     */
    contains(name){
        return this.stylesMap.contains(name);
    }

    /**
     * 
     * @param {Method} callback 
     */
    done(callback){
        this.callback = callback;
        this.doCallback(this);
    }

    /**
     * 
     * @param {StylesRegistry} registry 
     */
    doCallback(registry){
        if(tmo.callback !== null && registry.callback !== undefined  && registry.stylesQueueSize === registry.stylesMap.size()){
            var tempCallback = registry.callback;
            registry.callback = null;
            tempCallback.call();
        }
    }

    /**
     * 
     * @param {string} name 
     * @param {Url} url 
     */
     async load(name, url) {
        this.stylesQueueSize ++;
        const response = await Client.get(url);
        if(!response.ok){
            throw "Unable to load styles for " + name + " at " + url;
        }
        const text = await response.text();
        this.set(name, new Styles(text), url);
        this.doCallback(this);
        return null;
    }

    async getStylesLoadedPromise(nameUrlMap) {
        
        if(!nameUrlMap || nameUrlMap.size() == 0) {
            return null;
        }
        let loadPromises = [];
        nameUrlMap.forEach((key, value, parent) => {
            if (this.contains(key)){
                return true;
            }
            try {
                loadPromises.push(this.privateLoad(key, UrlUtils.parse(value)));
            } catch(reason) {
                throw reason;
            }
            return true;
        }, this);
        return await Promise.all(loadPromises);
    }

    /**
     * 
     * @param {string} name 
     * @param {Url} url 
     */
    async privateLoad(name, url) {
        LOG$9.info("Loading styles " + name + " at " + url.toString());

        const response = await Client.get(url);
        if(!response.ok){
            throw "Unable to load styles for " + name + " at " + url;
        }
        const text = await response.text();
        const styles = new Styles(text);
        this.set(name, styles, url);
        return styles;
    }
}

/* jshint esversion: 6 */

class Template{

    /**
     * 
     * @param {string} templateSource 
     */
    constructor(templateSource){

        /** @type {string} */
        this.templateSource = templateSource;
    }

    /**
     * @returns {string}
     */
    getTemplateSource(){
        return this.templateSource;
    }

}

/* jshint esversion: 6 */

const LOG$8 = new coreutil_v1.Logger("TemplateRegistry");

class TemplateRegistry {

    constructor(){
        /** @type {Map} */
        this.templateMap = new coreutil_v1.Map();

        /** @type {Map} */
        this.templateUrlMap = new coreutil_v1.Map();

        /** @type {integer} */
        this.templateQueueSize = 0;

        /** @type {Method} */
        this.callback = null;

        /** @type {string} */
        this.languagePrefix = null;
    }

    /**
     * 
     * @param {string} languagePrefix 
     */
    setLanguagePrefix(languagePrefix) {
        this.languagePrefix = languagePrefix;
    }

    /**
     * 
     * @param {string} name 
     * @param {Template} template 
     * @param {Url} url 
     */
    set(name,template,url){
        if(url !== undefined && url !== null) {
            this.templateUrlMap.set(name, url);
        }
        this.templateMap.set(name, template);
    }

    /**
     * 
     * @param {string} name 
     */
    get(name){
        return this.templateMap.get(name);
    }

    /**
     * 
     * @param {string} name 
     */
    contains(name){
        return this.templateMap.contains(name);
    }

    /**
     * 
     * @param {Method} callback 
     */
    done(callback){
        this.callback = callback;
        this.doCallback(this);
    }

    /**
     * 
     * @param {TemplateRegistry} registry 
     */
    doCallback(registry){
        if(tmo.callback !== null && registry.callback !== undefined  && registry.templateQueueSize === registry.templateMap.size()){
            var tempCallback = registry.callback;
            registry.callback = null;
            tempCallback.call();
        }
    }

    /**
     * 
     * @param {string} name 
     * @param {Url} url 
     */
    async load(name, url) {
        if(this.languagePrefix !== null) {
            url.pathsList.setLast(
                this.languagePrefix + "." +
                url.pathsList.getLast()
            );
        }
        this.templateQueueSize ++;
        const response = await Client.get(url);
        if(!response.ok){
            throw "Unable to load template for " + name + " at " + url;
        }
        const text = await response.text();
        this.set(name,new Template(text),url);
        this.doCallback(this);
    }

    async getTemplatesLoadedPromise(nameUrlMap) {
        
        if(!nameUrlMap || nameUrlMap.size() == 0) {
            return null;
        }
        let loadPromises = [];
        nameUrlMap.forEach((key, value, parent) => {
            if (this.contains(key)){
                return true;
            }
            try {
                loadPromises.push(this.privateLoad(key, UrlUtils.parse(value)));
            } catch(reason) {
                throw reason;
            }
            return true;
        }, this);
        return await Promise.all(loadPromises);
    }

    /**
     * 
     * @param {string} name 
     * @param {Url} url 
     */
    async privateLoad(name, url) {
        if(this.languagePrefix !== null) {
            url.pathsList.setLast(
                this.languagePrefix + "." +
                url.pathsList.getLast()
            );
        }
        LOG$8.info("Loading template " + name + " at " + url.toString());
        const response = await Client.get(url);
        if(!response.ok){
            throw "Unable to load template for " + name + " at " + url;
        }
        const text = await response.text();
        const template = new Template(text);
        this.set(name, template, url);
        return template;
    }
}

new coreutil_v1.Logger("TemplatePostConfig");

/**
 * To be added to mindi as a singleton. Will scan through all configured classes that have a TEMPLATE_URL and COMPONENT_NAME
 * static getter and will asyncronously load them. Returns a promise which resolves when all templates are loaded
 */
class TemplatesLoader {


    /**
     * 
     * @param {TemplateRegistry} templateRegistry 
     */
    constructor(templateRegistry) {
        this.templateRegistry = templateRegistry;
    }

    /**
     * 
     * @param {Map} configEntries
     * @returns {Promise}
     */
    load(configEntries) {
        let templateMap = new coreutil_v1.Map();
        configEntries.forEach((key, configEntry, parent) => {
            if(configEntry.classReference.TEMPLATE_URL && configEntry.classReference.COMPONENT_NAME) {
                templateMap.set(configEntry.classReference.COMPONENT_NAME, configEntry.classReference.TEMPLATE_URL);
            }
            return true;
        }, this); 
        return this.templateRegistry.getTemplatesLoadedPromise(templateMap);
    }

}

new coreutil_v1.Logger("StylesLoader");

/**
 * To be added to mindi as a singleton. Will scan through all configured classes that have a STYLES_URL and COMPONENT_NAME
 * static getter and will asyncronously load them. Returns a promise which resolves when all styles are loaded
 */
class StylesLoader {


    /**
     * 
     * @param {StylesRegistry} stylesRegistry 
     */
    constructor(stylesRegistry) {
        this.stylesRegistry = stylesRegistry;
    }

    /**
     * 
     * @param {Map} configEntries
     * @returns {Promise}
     */
    load(configEntries) {
        let stylesMap = new coreutil_v1.Map();
        configEntries.forEach((key, configEntry, parent) => {
            if(configEntry.classReference.STYLES_URL && configEntry.classReference.COMPONENT_NAME) {
                stylesMap.set(configEntry.classReference.COMPONENT_NAME, configEntry.classReference.STYLES_URL);
            }
            return true;
        }, this); 
        return this.stylesRegistry.getStylesLoadedPromise(stylesMap);
    }

}

new coreutil_v1.Logger("ComponentConfigProcessor");

/**
 * Mindi config processor which loads all templates and styles for all configured components
 * and then calls any existing componentLoaded function on each component
 */
class ComponentConfigProcessor {

    constructor() {

        /**
         * @type {TemplateRegistry}
         */
        this.templateRegistry = mindi_v1.InjectionPoint.instance(TemplateRegistry);

        /**
         * @type {StylesRegistry}
         */
        this.stylesRegistry = mindi_v1.InjectionPoint.instance(StylesRegistry);

    }

    /**
     * 
     */
    postConfig(){
        this.templatesLoader = new TemplatesLoader(this.templateRegistry);
        this.stylesLoader = new StylesLoader(this.stylesRegistry);
    }

    /**
     * 
     * @param {Config} config
     * @returns {Promise}
     */
    processConfig(config, unconfiguredConfigEntries) {

        return Promise.all(
            [ 
                this.templatesLoader.load(unconfiguredConfigEntries), 
                this.stylesLoader.load(unconfiguredConfigEntries) 
            ]
        );
    }

}

class UniqueIdRegistry {

    idAttributeWithSuffix (id) {
        if(idNames.contains(id)) {
            var number = idNames.get(id);
            idNames.set(id,number+1);
            return id + "-" + number;
        }
        idNames.set(id,1);
        return id;
    }

}

var idNames = new coreutil_v1.Map();

class Attribute {

    constructor(attribute) {
        this.attribute = attribute;
    }

    get value() {
        return this.attribute.value;
    }

    get name() {
        return this.attribute.name;
    }

    get namespace() {
        return this.attribute.name;
    }
}

/** @type {Map} */
let configuredFunctionMap = new coreutil_v1.Map();

class ConfiguredFunction {

    /**
     * @param {function} theFunction
     */
    static configure(name, theFunction) {
        configuredFunctionMap.set(name, theFunction);
    }

    static execute(name, parameter) {
        return configuredFunctionMap.get(name).call(null, parameter);
    }

}

class MappedHtmlElement {

    constructor() {
        this.element = null;
    }

    /**
     * @returns {HTMLElement}
     */
    get mappedElement() {
        return this.element;
    }

    /**
     * @param element {HTMLElement}
     */
    set mappedElement(element) {
        this.element = element;
    }

}

const LOG$7 = new coreutil_v1.Logger("ElementUtils");

class ElementUtils {


    /**
     * 
     * @param {any} value 
     * @param {MappedHtmlElement} parent 
     * @returns 
     */
    static createContainerElement(value, parent) {
        if (value instanceof xmlparser_v1.XmlElement) {
            return ElementUtils.createFromXmlElement(value, parent);
        }
        if (typeof value === "string") {
            return containerbridge_v1.ContainerElement.createElement(value);
        }
        if (containerbridge_v1.ContainerElement.isUIElement(value)) {
            return value;
        }
        LOG$7.error("Unrecognized value for Element");
        LOG$7.error(value);
        return null;
    }

    /**
     * Creates a browser Element from the XmlElement
     *
     * @param {XmlElement} xmlElement
     * @param {MappedHtmlElement} parentElement
     * @return {HTMLElement}
     */
    static createFromXmlElement(xmlElement, parentElement) {
        let element = null;
        if (xmlElement.namespace) {
            element = containerbridge_v1.ContainerElement.createElementNS(xmlElement.namespaceUri, xmlElement.fullName);
        } else {
            element = containerbridge_v1.ContainerElement.createElement(xmlElement.name);
        }
        if (parentElement && parentElement.mappedElement !== null) {
            containerbridge_v1.ContainerElement.appendChild(parentElement.mappedElement, element);
        }
        xmlElement.attributes.forEach((attributeKey, attribute) => {
            containerbridge_v1.ContainerElement.setAttribute(element, attributeKey, attribute.value);
            return true;
        });
        return element;
    }

}

new coreutil_v1.Logger("BaseElement");

/**
 * A base class for enclosing an HTMLElement
 */
class BaseElement extends MappedHtmlElement {

    /**
     * Constructor
     *
     * @param {XmlElement|string|any} value Value to be converted to Container UI Element (HTMLElement in the case of Web Browser)
     * @param {BaseElement} parent the parent BaseElement
     */
    constructor(value, parent) {
        super();
        this.attributeMap = null;
        this.eventsAttached = new coreutil_v1.List();
        super.mappedElement = ElementUtils.createContainerElement(value, parent);
    }

    loadAttributes() {
        if (super.mappedElement.attributes === null || super.mappedElement.attributes === undefined) {
            this.attributeMap = new coreutil_v1.Map();
            return;
        }
        if (this.attributeMap === null || this.attributeMap === undefined) {
            this.attributeMap = new coreutil_v1.Map();
            for (var i = 0; i < super.mappedElement.attributes.length; i++) {
                this.attributeMap.set(super.mappedElement.attributes[i].name,new Attribute(super.mappedElement.attributes[i]));
            }
        }
    }

    listenTo(eventType, listener, capture) {
        containerbridge_v1.ContainerElement.addEventListener(super.mappedElement, eventType, (event) => {
            listener.call(ConfiguredFunction.execute("wrapEvent", event));
        }, capture);
        return this;
    }

    get fullName() {
        return super.mappedElement.tagName;
    }

    get top() {
        return super.mappedElement.getBoundingClientRect().top;
    }

    get bottom() {
        return super.mappedElement.getBoundingClientRect().bottom;
    }

    get left() {
        return super.mappedElement.getBoundingClientRect().left;
    }

    get right() {
        return super.mappedElement.getBoundingClientRect().right;
    }

    get width() {
        return super.mappedElement.offsetWidth;
    }

    get height() {
        return super.mappedElement.offsetHeight;
    }

    get attributes() {
        this.loadAttributes();
        return this.attributeMap;
    }

    setAttributeValue(key,value) {
        containerbridge_v1.ContainerElement.setAttribute(super.mappedElement, key,value);
    }

    getAttributeValue(key) {
        return containerbridge_v1.ContainerElement.getAttribute(super.mappedElement, key);
    }

    containsAttribute(key) {
        return super.mappedElement.hasAttribute(key);
    }

    removeAttribute(key) {
        super.mappedElement.removeAttribute(key);
    }

    setStyle(key,value) {
        super.mappedElement.style[key] = value;
    }

    getStyle(key) {
        return super.mappedElement.style[key];
    }

    removeStyle(key) {
        super.mappedElement.style[key] = null;
    }

    set(input) {
        if(!super.mappedElement.parentNode){
            console.error("The element has no parent, can not swap it for value");
            return;
        }
        if(input.mappedElement) {
            super.mappedElement.parentNode.replaceChild(input.mappedElement, super.mappedElement);
            return;
        }
        if(input && input.rootElement) {
            super.mappedElement.parentNode.replaceChild(input.rootElement.mappedElement, super.mappedElement);
            super.mappedElement = input.rootElement.mappedElement;
            return;
        }
        if(typeof input == "string") {
            super.mappedElement.parentNode.replaceChild(containerbridge_v1.ContainerElement.createTextNode(input), super.mappedElement);
            return;
        }
        if(input instanceof Text) {
            super.mappedElement.parentNode.replaceChild(input, super.mappedElement);
            return;
        }
        if(input instanceof Element) {
            super.mappedElement.parentNode.replaceChild(input, super.mappedElement);
            return;
        }
    }

    isMounted() {
        if(super.mappedElement.parentNode) {
            return true;
        }
        return false;
    }

    remove() {
        if (super.mappedElement.parentNode) {
            super.mappedElement.parentNode.removeChild(super.mappedElement);
        }
    }

    clear() {
        while (super.mappedElement.firstChild) {
            super.mappedElement.removeChild(super.mappedElement.firstChild);
        }
    }

    setChild(input) {
        this.clear();
        this.addChild(input);
    }

    addChild(input) {
        if (input.mappedElement !== undefined && input.mappedElement !== null){
            super.mappedElement.appendChild(input.mappedElement);
            return;
        }
        if (input && input.rootElement) {
            super.mappedElement.appendChild(input.rootElement.mappedElement);
            return;
        }
        if (typeof input == "string") {
            super.mappedElement.appendChild(containerbridge_v1.ContainerElement.createTextNode(input));
            return;
        }
        if (input instanceof Text) {
            super.mappedElement.appendChild(input);
            return;
        }
        if (input instanceof Element) {
            super.mappedElement.appendChild(input);
            return;
        }
    }

    prependChild(input) {
        if(super.mappedElement.firstChild === null) {
            this.addChild(input);
        }
        if (input.mappedElement !== undefined && input.mappedElement !== null) {
            super.mappedElement.insertBefore(input.mappedElement, super.mappedElement.firstChild);
            return;
        }
        if (input && input.rootElement) {
            super.mappedElement.insertBefore(input.rootElement.mappedElement, super.mappedElement.firstChild);
            return;
        }
        if (typeof input == "string") {
            super.mappedElement.insertBefore(containerbridge_v1.ContainerElement.createTextNode(input), super.mappedElement.firstChild);
            return;
        }
        if (input instanceof Text) {
            super.mappedElement.insertBefore(input, super.mappedElement.firstChild);
            return;
        }
        if (input instanceof Element) {
            super.mappedElement.insertBefore(input, super.mappedElement.firstChild);
            return;
        }
    }
}

/* jshint esversion: 6 */

class Component {

    /**
     * 
     * @param {number} componentIndex 
     * @param {BaseElement} rootElement 
     * @param {Map} elementMap 
     */
    constructor(componentIndex, rootElement, elementMap) {
        this.componentIndex = componentIndex;
        this.elementMap = elementMap;
        this.rootElement = rootElement;
    }

    remove() {
        this.rootElement.remove();
    }

    /**
     * 
     * @param {string} id 
     * @returns {BaseElement}
     */
    get(id) {
        return this.elementMap.get(id);
    }

    /**
     * 
     * @param {string} id 
     * @param {BaseElement}
     * @returns {BaseElement}
     */
    set (id, value) {
        this.elementMap.get(id).set(value);
        return this.elementMap.get(id);
    }

    /**
     * 
     * @param {string} id 
     * @returns {BaseElement}
     */
    clearChildren(id){
        this.elementMap.get(id).clear();
        return this.elementMap.get(id);
    }

    /**
     * 
     * @param {string} id 
     * @param {BaseElement}
     * @returns {BaseElement}
     */
    setChild (id, value) {
        this.elementMap.get(id).setChild(value);
        return this.elementMap.get(id);
    }

    /**
     * 
     * @param {string} id 
     * @param {BaseElement}
     * @returns {BaseElement}
     */
    addChild (id, value) {
        this.elementMap.get(id).addChild(value);
        return this.elementMap.get(id);
    }

    /**
     * 
     * @param {string} id 
     * @param {BaseElement}
     * @returns {BaseElement}
     */
    prependChild (id, value) {
        this.elementMap.get(id).prependChild(value);
        return this.elementMap.get(id);
    }

}

new coreutil_v1.Logger("AbstractInputElement");

/**
 * Shared properties of input elements
 */
class AbstractInputElement extends BaseElement{

    /**
     * Constructor
     *
     * @param {XmlElement} value
     * @param {BaseElement} parent
     */
    constructor(value, parent) {
        super(value, parent);
    }

    /**
     * Get the value of the inputs name
     *
     * @return {string}
     */
    get name() {
        return this.element.name;
    }

    /**
     * Set the value of inputs name
     *
     * @param {string} value
     */
    set name(value) {
        this.element.name = value;
    }

    /**
     * Returns the value given any processing rules
     */
    get value(){
        return this.backingValue;
    }

    set value(value){
        this.element.value = value;
        this.element.dispatchEvent(new InputEvent('change'));
    }

    /**
     * Returns the source value
     */
    get backingValue(){
        return this.element.value;
    }

    focus() {
        this.element.focus();
    }

    selectAll() {
        this.element.select();
    }

    enable() {
        this.element.disabled = false;
    }

    disable() {
        this.element.disabled = true;
    }
}

/* jshint esversion: 6 */

class RadioInputElement extends AbstractInputElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    set checked(value){
        this.element.checked = value;
    }

    isChecked(){
        return this.element.checked;
    }

    get value() {
        return this.isChecked();
    }

    set value(value) {
        this.element.checked = (value === true || value === "true");
    }
}

/* jshint esversion: 6 */

class CheckboxInputElement extends AbstractInputElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    set checked(value){
        this.element.checked = value;
    }

    isChecked(){
        return this.element.checked;
    }

    get value() {
        return this.isChecked();
    }

    set value(value) {
        this.element.checked = (value === true || value === "true");
    }
}

/* jshint esversion: 6 */

class TextInputElement extends AbstractInputElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

}

/* jshint esversion: 6 */

class TextareaInputElement extends AbstractInputElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    get innerHTML(){
        return this.element.innerHTML;
    }

    set innerHTML(value){
        this.element.innerHTML = value;
    }

    addChild(input) {
        super.addChild(input);
        this.value = this.innerHTML;
    }

    prependChild(input) {
        super.prependChild(input);
        this.value = this.innerHTML;
    }

}

class TextnodeElement {

    /**
     * Constructor
     *
     * @param {XmlCdata} value 
     * @param {BaseElement} parent 
     */
    constructor(value, parent) {
        if(value instanceof xmlparser_v1.XmlCdata) {
            this.element = this.createFromXmlCdata(value, parent);
        }
        if(typeof value === "string"){
            this.element = containerbridge_v1.ContainerElement.createTextNode(value);
        }
    }

    /**
     * 
     * @param {XmlCdata} cdataElement 
     * @param {BaseElement} parentElement 
     */
    createFromXmlCdata(cdataElement, parentElement) {
        let element = document.createTextNode(cdataElement.value);
        if(parentElement !== null && parentElement.mappedElement !== null) {
            containerbridge_v1.ContainerElement.appendChild(parentElement.mappedElement, element);
        }
        return element;
    }

    set value(value) {
        this.element = value;
    }

    get value() {
        return this.element;
    }

    get mappedElement() {
        return this.element;
    }

}

/* jshint esversion: 6 */

class SimpleElement extends BaseElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    get innerHTML(){
        return this.element.innerHTML;
    }

    set innerHTML(value){
        this.element.innerHTML = value;
    }

}

/* jshint esversion: 6 */

class FormElement extends BaseElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    /**
     * Get the value of the inputs name
     *
     * @return {string}
     */
    get name() {
        return this.element.name;
    }

    /**
     * Set the value of inputs name
     *
     * @param {string} value
     */
    set name(value) {
        this.element.name = value;
    }

    submit() {
        return this.element.submit();
    }

}

class VideoElement extends BaseElement {

    /**
     * Constructor
     *
     * @param {XmlElement} value 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    get mappedElement() {
        return this.element;
    }

    play() {
        this.element.play();
    }

    mute() {
        this.element.muted = true;
    }

    unmute() {
        this.element.muted = false;
    }

}

/* jshint esversion: 6 */

class ElementMapper {

    /**
     * Constructor
     * 
     * @param {any} input 
     * @param {BaseElement} parent 
     */
    static map(input, parent) {
        if (ElementMapper.mapsToRadio(input)){     return new RadioInputElement(input, parent); }
        if (ElementMapper.mapsToCheckbox(input)){  return new CheckboxInputElement(input, parent); }
        if (ElementMapper.mapsToSubmit(input)){    return new TextInputElement(input, parent); }
        if (ElementMapper.mapsToForm(input)){      return new FormElement(input, parent); }
        if (ElementMapper.mapsToTextarea(input)){  return new TextareaInputElement(input, parent); }
        if (ElementMapper.mapsToText(input)){      return new TextInputElement(input, parent); }
        if (ElementMapper.mapsToVideo(input)){     return new VideoElement(input, parent); }
        if (ElementMapper.mapsToTextnode(input)){  return new TextnodeElement(input, parent); }
        if (ElementMapper.mapsToSimple(input)){    return new SimpleElement(input, parent); }
        console.log("Mapping to simple by default " + input);
        return new SimpleElement(input, parent);
    }

    static mapsToRadio(input){
        return (input instanceof HTMLInputElement && input.type === "radio") ||
            (input instanceof xmlparser_v1.XmlElement && input.name === "input" && input.getAttribute("type") && input.getAttribute("type").value === "radio");
    }

    static mapsToCheckbox(input){
        return (input instanceof HTMLInputElement && input.type === "checkbox") ||
            (input instanceof xmlparser_v1.XmlElement && input.name === "input" && input.getAttribute("type") && input.getAttribute("type").value === "checkbox");
    }

    static mapsToSubmit(input){
        return (input instanceof HTMLInputElement && input.type === "submit") ||
            (input instanceof xmlparser_v1.XmlElement && input.name === "input" && input.getAttribute("type") && input.getAttribute("type").value === "submit");
    }

    static mapsToForm(input){
        return (input instanceof HTMLFormElement) ||
            (input instanceof xmlparser_v1.XmlElement && input.name === "form");
    }

    static mapsToText(input){
        if (input instanceof HTMLInputElement) {
            if (input.type === "text") { return true; }
            if (input.type === "number") { return true; }
            if (input.type === "password") { return true; }
            if (input.type === "email") { return true; }
            if (input.type === "date") { return true; }
            if (input.type === "time") { return true; }
        }
        if(input instanceof xmlparser_v1.XmlElement && input.name === "input") {
            if(!input.getAttribute("type")) { return true; }
            if(input.getAttribute("type").value === "text") { return true; }
            if(input.getAttribute("type").value === "number") { return true; }
            if(input.getAttribute("type").value === "password") { return true; }
            if(input.getAttribute("type").value === "email") { return true; }
            if(input.getAttribute("type").value === "date") { return true; }
            if(input.getAttribute("type").value === "time") { return true; }
        }
        return false;
    }

    static mapsToTextnode(input){
        return (input instanceof Node && input.nodeType === "TEXT_NODE") ||
            (input instanceof xmlparser_v1.XmlCdata);
    }

    static mapsToVideo(input){
        return (input instanceof HTMLVideoElement) ||
            (input instanceof xmlparser_v1.XmlElement && input.name === "video");
    }

    static mapsToTextarea(input){
        return (input instanceof HTMLTextAreaElement) ||
            (input instanceof xmlparser_v1.XmlElement && input.name === "textarea");
    }

    static mapsToSimple(input){
        return (input instanceof HTMLElement) ||
            (input instanceof xmlparser_v1.XmlElement);
    }
}

/**
 * Collects information when elements are created and finds the root element, creates map of elements 
 */
class ElementRegistrator {

    constructor(uniqueIdRegistry, componentIndex) {
        this.componentIndex = componentIndex;

        /** @type {Map} */
        this.uniqueIdRegistry = uniqueIdRegistry;

        /** @type {BaseElement} */
        this.rootElement = null;

        this.elementMap = new coreutil_v1.Map();
    }

    getElementMap() {
        return this.elementMap;
    }

    /**
     * Listens to elements being created, and takes inn the created XmlElement and its parent XmlElement
     * 
     * @param {XmlElement} xmlElement 
     * @param {BaseElement} parentWrapper 
     */
    elementCreated (xmlElement, parentWrapper) {
        const element = ElementMapper.map(xmlElement, parentWrapper);

        this.addToElementIdMap(element);

        if(this.rootElement === null && element !== null) {
            this.rootElement = element;
        }

        return element;
    }

    addToElementIdMap(element) {
        if(element === null || element === undefined || !(element instanceof BaseElement)) {
            return;
        }
        var id = null;
        if(element.containsAttribute("id")) {
            id = element.getAttributeValue("id");
            element.setAttributeValue("id",this.uniqueIdRegistry.idAttributeWithSuffix(id));
        }

        if(id !== null) {
            this.elementMap.set(id,element);
        }
    }
}

/* jshint esversion: 6 */

class Event{

    constructor(event){
        this.event = event;
        if (this.event.type.toLowerCase() == "dragstart"){
            this.event.dataTransfer.setData('text/plain', null);
        }
    }

    stopPropagation(){
        this.event.stopPropagation();
    }

    preventDefault(){
        this.event.preventDefault();
    }

    /**
     * The distance between the event and the edge x coordinate of the containing object
     */
    get offsetX(){
        return this.event.offsetX;
    }

    /**
     * The distance between the event and the edge y coordinate of the containing object
     */
    get offsetY(){
        return this.event.offsetY;
    }

    /**
     * The mouse x coordinate of the event relative to the client window view
     */
    get clientX(){
        return this.event.clientX;
    }

    /**
     * The mouse y coordinate of the event relative to the client window view
     */
    get clientY(){
        return this.event.clientY;
    }

    /**
     * 
     * @returns {SimpleElement}
     */
    get target(){
        if (this.event && this.event.target) {
            return ConfiguredFunction.execute("mapElement", this.event.target);
        }
    }

    /**
     * 
     * @returns {SimpleElement}
     */
    get relatedTarget(){
        if (this.event && this.event.relatedTarget) {
            return ConfiguredFunction.execute("mapElement", this.event.relatedTarget);
        }
        return null;
    }

    /**
     * 
     * @returns {string}
     */
     getRelatedTargetAttribute(attributeName){
        if (this.event.relatedTarget) {
            return ConfiguredFunction.execute("mapElement", this.event.relatedTarget).getAttributeValue(attributeName);
        }
        return null;
    }

    get targetValue(){
        if(this.target) { 
            return this.target.value;
        }
        return null;
    }

    get keyCode() {
        return this.event.keyCode;
    }

    isKeyCode(code) {
        return this.event.keyCode === code;
    }

}

class CanvasRoot {

    static shouldSwallowNextFocusEscape = false;

    static mouseDownElement = null;

    static focusEscapeEventRequested = false;

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static replaceComponent(id, component) {
        const bodyElement = containerbridge_v1.ContainerElement.getElementById(id);
        bodyElement.parentNode.replaceChild(component.rootElement.mappedElement, bodyElement);
    }

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static setComponent(id, component) {
        const bodyElement = containerbridge_v1.ContainerElement.getElementById(id);
        bodyElement.innerHTML = '';
        bodyElement.appendChild(component.rootElement.mappedElement, bodyElement);
    }

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static addChildComponent(id, component) {
        const bodyElement = containerbridge_v1.ContainerElement.getElementById(id);
        bodyElement.appendChild(component.rootElement.mappedElement);
    }

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static addChildElement(id, element) {
        const bodyElement = containerbridge_v1.ContainerElement.getElementById(id);
        bodyElement.appendChild(element.mappedElement);
    }

    /**
     * 
     * @param {String} id 
     */
    static removeElement(id) {
        containerbridge_v1.ContainerElement.removeElement(id);
    }

    /** 
     * @param {BaseElement} element
     */
    static addHeaderElement(element) {
        containerbridge_v1.ContainerElement.appendRootMetaChild(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static addBodyElement(element) {
        containerbridge_v1.ContainerElement.appendRootUiChild(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependHeaderElement(element) {
        containerbridge_v1.ContainerElement.prependElement("head", element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependBodyElement(element) {
        containerbridge_v1.ContainerElement.prependElement("body", element.mappedElement);
    }

    /** 
     * Remember to swallowFocusEscape for initial triggering events
     * which are external to focusRoot
     * 
     * @param {Method} listener
     * @param {BaseElement} focusRoot
     */
    static listenToFocusEscape(listener, focusRoot) {
        
        /* Hack: Because we don't have a way of knowing in the click event which element was in focus when mousedown occured */
        if (!CanvasRoot.focusEscapeEventRequested) {
            const updateMouseDownElement = new coreutil_v1.Method(null, (event) => {
                CanvasRoot.mouseDownElement = event.target;
            });
            containerbridge_v1.ContainerWindow.addEventListener("mousedown", updateMouseDownElement, Event);
            CanvasRoot.focusEscapeEventRequested = true;
        }

        const callIfNotContains = new coreutil_v1.Method(null, (event) => {
            if (!CanvasRoot.mouseDownElement) {
                CanvasRoot.mouseDownElement = event.target;
            }
            if (containerbridge_v1.ContainerElement.contains(focusRoot.element, CanvasRoot.mouseDownElement.element)) {
                return;
            }
            if (CanvasRoot.shouldSwallowNextFocusEscape) {
                return;
            }
            listener.call(event);
        });
        containerbridge_v1.ContainerWindow.addEventListener("click", callIfNotContains, Event);
    }

    /**
     * When an element is congigured to be hidden by FocusEscape,
     * and was shown by an event triggered from an external element,
     * then FocusEscape gets triggered right after the element is
     * shown. Therefore this function allows this event to be 
     * swallowed to avoid this behavior
     * 
     * @param {number} forMilliseconds 
     */
    static swallowFocusEscape(forMilliseconds) {
        CanvasRoot.shouldSwallowNextFocusEscape = true;
        setTimeout(() => {
            CanvasRoot.shouldSwallowNextFocusEscape = false;
        }, forMilliseconds);
    }
}

/* jshint esversion: 6 */

class HTML{

    static custom(elementName){
        var xmlElement = new xmlparser_v1.XmlElement(elementName);
        return ElementMapper.map(xmlElement);
    }

    static applyStyles(element, classValue, styleValue){
        if(classValue){
            element.setAttributeValue("class", classValue);
        }
        if(styleValue){
            element.setAttributeValue("style", styleValue);
        }
    }

    static a(value, href, classValue, styleValue){
        var element = HTML.custom("a");
        element.addChild(value);
        element.setAttributeValue("href",href);
        HTML.applyStyles(element, classValue, styleValue);
        return element;
    }

    static i(value, classValue, styleValue){
        var element = HTML.custom("i");
        element.addChild(value);
        HTML.applyStyles(element, classValue, styleValue);
        return element;
    }
}

const LOG$6 = new coreutil_v1.Logger("CanvasStyles");

const styles = new coreutil_v1.Map();
const styleOwners = new coreutil_v1.Map();
const enabledStyles = new coreutil_v1.List();

class CanvasStyles {

    static setStyle(name, source) {
        if(styles.contains(name)) {
            styles.get(name).setChild(new TextnodeElement(source.getStylesSource()));
        } else {
            /** @type {BaseElement} */
            let styleElement = HTML.custom("style");
            styleElement.setAttributeValue("id",name);
            styleElement.setChild(new TextnodeElement(source.getStylesSource()));
            styles.set(name, styleElement);
        }
    }

    static removeStyle(name) {
        if(enabledStyles.contains(name)) {
            enabledStyles.remove(name);
            CanvasRoot.removeElement(name);
        }
        if(styles.contains(name)) {
            styles.remove(name);
        }
    }

    static disableStyle(name, ownerId = 0) {
        CanvasStyles.removeStyleOwner(name, ownerId);
        if(CanvasStyles.hasStyleOwner(name)) {
            return;
        }
        if(!styles.contains(name)) {
            LOG$6.error("Style does not exist: " + name);
            return;
        }
        if(enabledStyles.contains(name)) {
            enabledStyles.remove(name);
            CanvasRoot.removeElement(name);
        }
    }

    static enableStyle(name, ownerId = 0) {
        CanvasStyles.addStyleOwner(name, ownerId);
        if(!styles.contains(name)) {
            LOG$6.error("Style does not exist: " + name);
            return;
        }
        if(!enabledStyles.contains(name)) {
            enabledStyles.add(name);
            CanvasRoot.addHeaderElement(styles.get(name));
        }
    }

    static addStyleOwner(name, ownerId) {
        if(!styleOwners.contains(name)) {
            styleOwners.set(name, new coreutil_v1.List());
        }
        if(!styleOwners.get(name).contains(ownerId)) {
            styleOwners.get(name).add(ownerId);
        }
    }

    static removeStyleOwner(name, ownerId) {
        if(!styleOwners.contains(name)) {
            return;
        }
        styleOwners.get(name).remove(ownerId);
    }

    static hasStyleOwner(name) {
        if(!styleOwners.contains(name)) {
            return false;
        }
        return styleOwners.get(name).size() > 0;
    }
}

const LOG$5 = new coreutil_v1.Logger("ComponentFactory");

class ComponentFactory {

    constructor() {

        /** @type {StylesRegistry} */
        this.stylesRegistry = mindi_v1.InjectionPoint.instance(StylesRegistry);

        /** @type {TemplateRegistry} */
        this.templateRegistry = mindi_v1.InjectionPoint.instance(TemplateRegistry);

        /** @type {UniqueIdRegistry} */
        this.uniqueIdRegistry = mindi_v1.InjectionPoint.instance(UniqueIdRegistry);
    }

    /**
     * 
     * @param {string} name represents the template and the styles name if the style for that name is available
     */
    create(name){
        var template = this.templateRegistry.get(name);
        if(!template) {
            LOG$5.error(this.templateRegistry);
            throw "No template was found with name " + name;

        }
        var elementRegistrator = new ElementRegistrator(this.uniqueIdRegistry, componentCounter++);
        new xmlparser_v1.DomTree(template.getTemplateSource(),elementRegistrator).load();

        this.mountStyles(name);

        return new Component(elementRegistrator.componentIndex, elementRegistrator.rootElement, elementRegistrator.getElementMap());
    }

    mountStyles(name) {
        if(this.stylesRegistry.contains(name)) {
            CanvasStyles.setStyle(name, this.stylesRegistry.get(name));
        }
    }

}

var componentCounter = 0;

/**
 * StateManager
 * 
 * @template T
 */
class StateManager {

    constructor() {
        /** @type {Map<String, any>} */
        this.objectMap = new Map();

        /** @type {Map<String, Array<Method>} */
        this.listeners = new Map();
    }

    /**
     * 
     * @param {Method} listener 
     */
    react(listener) {
        const anyKey = "__ANY__";
        if (!this.listeners.has(anyKey)) {
            this.listeners.set(anyKey, new Array());
        }
        this.listeners.get(anyKey).push(listener);
    }

    /**
     * 
     * @param {string} key 
     * @param {Method} listener 
     */
    reactTo(key, listener) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Array());
        }
        this.listeners.get(key).push(listener);
    }

    /**
     * Update the state
     * 
     * @param {string} key 
     * @param {T} object 
     */
    async update(object, key = "__DEFAULT__") {
        if (Array.isArray(object)) {
            for (let i = 0; i < object.length; i++) {
                object[i] = this.createProxy(object[i], key, this);
            }
        }
        object = this.createProxy(object, key, this);
        this.objectMap.set(key, object);
        this.signalStateChange(object, key);
        return object;
    }

    signalStateChange(object, key) {
        if (this.listeners.has(key)) {
            for (let listener of this.listeners.get(key)) {
                listener.call([object]);
            }
        }

        const anyKey = "__ANY__";
        if (key != anyKey && this.listeners.has(anyKey)) {
            for (let listener of this.listeners.get(anyKey)) {
                listener.call([object]);
            }
        }
    }

    createProxy(object, key, stateManager) {
        return new Proxy(object, {
            set: (target, prop, value) => {
                const success = (target[prop] = value);
                stateManager.signalStateChange(target, key);
                return success === value;
            }
        });
    }

}

new coreutil_v1.Logger("Config");

class Config {

    static getInstance() {
        return justrightConfig;
    }

    constructor() {
        this.typeConfigList = new coreutil_v1.List([
            mindi_v1.SingletonConfig.unnamed(TemplateRegistry),
            mindi_v1.SingletonConfig.unnamed(StylesRegistry),
            mindi_v1.SingletonConfig.unnamed(UniqueIdRegistry),
            mindi_v1.SingletonConfig.unnamed(ComponentFactory),
            mindi_v1.PrototypeConfig.unnamed(StateManager)]);
        }

    getTypeConfigList() {
        return this.typeConfigList;
    }

}

const justrightConfig = new Config();

const LOG$4 = new coreutil_v1.Logger("LoaderInterceptor");

class LoaderInterceptor {

    /**
     * @returns {Boolean}
     */
    process() {
        LOG$4.info("Unimplemented Loader Interceptor breaks by default");
        return false;
    }

}

const LOG$3 = new coreutil_v1.Logger("ModuleLoader");

class ModuleLoader {

    /**
     * 
     * @param {string} matchPath 
     * @param {String} modulePath 
     * @param {Array<LoaderInterceptor>} loaderInterceptors
     */
    constructor(matchPath, modulePath, loaderInterceptors = []) {
        
        /**
         * @type {string}
         */
        this.matchPath = matchPath;

        /**
         * @type {String}
         */
        this.modulePath = modulePath;

        /**
         * @type {Array<LoaderInterceptor>}
         */
        this.loaderInterceptors = loaderInterceptors;

    }

    /**
     * Matches if the configured matchUrl starts with the provided url or
     * if the configured matchUrl is null
     * 
     * @param {Url} url 
     * @returns 
     */
    matches(url){
        if (!this.matchPath) {
            return true;
        }
        if (!url) {
            LOG$3.error("Url is null");
            return false;
        }
        return coreutil_v1.StringUtils.nonNullEquals(this.matchPath, url.path);
    }

    /**
     * 
     * @returns {Promise<Main>}
     */
    async load() {
        try {
            const main = await this.importModule();
            await this.interceptorsPass();
            return main;
        } catch(reason) {
            LOG$3.warn("Filter rejected " + reason);
            return null;
        }
    }

    /**
     * 
     * @returns {Promise}
     */
    interceptorsPass() {
        const interceptors = this.loaderInterceptors;
        if (interceptors && interceptors.length > 0) {
            let interceptorPromiseChain = interceptors[0].process();
            for (let i = 1; i < interceptors.length; i++) {
                interceptorPromiseChain = interceptorPromiseChain.then(interceptors[i]);
            }
            return interceptorPromiseChain;
        }
        return Promise.resolve();
    }

    async importModule() {
        try {
            const module = await (function (t) { return Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require(t)); }); })(this.modulePath);
            return new module.default();
        } catch(reason)  {
            throw reason;
        }
    }

}

class Main {

    /**
     * 
     * @param {Url} url 
     */
    load(url) {
        throw "Main class must implement load(url)";
    }

    update() {
        throw "Main class must implement update()";
    }

    /**
     * @returns {string}
     */
    get path() {
        throw "Main class must implement get path()";
    }

}

const LOG$2 = new coreutil_v1.Logger("DiModuleLoader");

class DiModuleLoader extends ModuleLoader {

    /**
     * 
     * @param {MindiConfig} config
     * @param {RegExp} matchPath 
     * @param {String} modulePath 
     * @param {Array<LoaderInterceptor>} loaderInterceptors
     */
    constructor(config, matchPath, modulePath, loaderInterceptors = []) {
        super(matchPath, modulePath, loaderInterceptors);

        /** @type {MindiConfig} */
        this.config = config;
    }

    /**
     * 
     * @returns {Promise<Main>}
     */
    async load() {
        try {
            const main = await this.importModule();
            await this.interceptorsPass();
            return await mindi_v1.MindiInjector.inject(main, this.config);
        } catch(reason) {
            LOG$2.warn("Module loader failed " + reason);
            throw reason;
        }
    }


    /**
     * 
     * @param {ModuleLoader} moduleLoader
     * @returns {Promise}
     */
    async importModule() {
        try {
            const main = await super.importModule();
            this.config.addAllTypeConfig(main.typeConfigList);
            await this.config.finalize();
            await new coreutil_v1.List(this.loaderInterceptors).promiseChain((loaderInterceptor) => {
                return mindi_v1.MindiInjector.inject(loaderInterceptor, this.config);
            });
            return main;
        } catch(error) {
            throw error;
        }
    }
}

const LOG$1 = new coreutil_v1.Logger("Application");

class Application extends ModuleRunner {

    constructor() {

        super();

        /** @type {List} */
        this.workerList = new coreutil_v1.List();

        /** @type {List<DiModuleLoader>} */
        this.moduleLoaderList = new coreutil_v1.List();

        /** @type {MindiConfig} */
        this.config = new mindi_v1.MindiConfig();

        /** @type {List} */
        this.runningWorkers = new coreutil_v1.List();

        /** @type {Main} */
        this.activeMain = null;

        ConfiguredFunction.configure("wrapEvent", (parameter) => { return new Event(parameter); });

        ConfiguredFunction.configure("mapElement", (parameter) => { return ElementMapper.map(parameter); });

        this.defaultConfig = Config.getInstance().getTypeConfigList();

        this.defaultConfigProcessors = new coreutil_v1.List([ ComponentConfigProcessor ]);

        this.defaultInstanceProcessors = new coreutil_v1.List([ mindi_v1.InstancePostConfigTrigger ]);

        this.customConfig = new coreutil_v1.List();

    }

    /**
     * 
     * @param {List<SingletonConfig | PrototypeConfig>} typeConfigList 
     */
    set customTypeConfig(typeConfigList) {
        this.customConfig = typeConfigList;
    }

    async run() {
        LOG$1.info("Running Application");
        this.config
            .addAllTypeConfig(this.defaultConfig)
            .addAllTypeConfig(this.customConfig)
            .addAllConfigProcessor(this.defaultConfigProcessors)
            .addAllInstanceProcessor(this.defaultInstanceProcessors);
        ActiveModuleRunner.instance().set(this);
        containerbridge_v1.ContainerUrl.addUserNavigateListener(
            new coreutil_v1.Method(this, this.update),
            Event
        );
        const main = await this.runModule(History.currentUrl());
        this.startWorkers();
        return main;
    }

    /**
     * 
     * @param {Event} event
     */
    update(event) {
        const url = History.currentUrl();
        if (this.activeMain && coreutil_v1.StringUtils.nonNullEquals(this.activeMain.path, url.path)) {
            this.activeMain.update(url);
            return;
        }
        this.runModule(url);
    }

    /**
     * 
     * @param {Url} url 
     * @returns 
     */
    async runModule(url) {
        try {
            const main = await this.getMatchingModuleLoader(url).load();
            this.activeMain = main;
            main.load(url, null);
            return main;
        } catch(error) {
            LOG$1.error(error);
            return null;
        }
    }

    startWorkers() {
        if (this.runningWorkers.size() > 0) {
            return;
        }
        this.workerList.forEach((value,parent) => {
            const instance = new value();
            mindi_v1.MindiInjector.inject(instance, this.config);
            this.runningWorkers.add(instance);
            return true;
        }, this);
    }

    /**
     * @param {Url} url
     * @returns {DiModuleLoader}
     */
    getMatchingModuleLoader(url) {
        let foundModuleLoader = null;
        this.moduleLoaderList.forEach((value, parent) => {
            if (value.matches(url)) {
                foundModuleLoader = value;
                return false;
            }
            return true;
        }, this);
        return foundModuleLoader;
    }

    /**
     * Enable global access to dependency injection config
     */
    windowDiConfig() {
        window.diConfig = () => {
            LOG$1.info(this.config.configEntries);
        };
    }

    /**
     * Enable global access to template registry
     */
    windowTemplateRegistry() {
        window.templateRegistry = () => {
            LOG$1.info(mindi_v1.ConfigAccessor.instanceHolder(TemplateRegistry.name, this.config).instance);
        };
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            LOG$1.info(mindi_v1.ConfigAccessor.instanceHolder(StylesRegistry.name, this.config).instance);
        };
    }

}

new coreutil_v1.Logger("InputElementDataBinding");

class InputElementDataBinding {

    constructor(model, validator) {
        this.model = model;
        this.validator = validator;
        this.pullers = new coreutil_v1.List();
        this.pushers = new coreutil_v1.List();
    }

    static link(model, validator) {
        return new InputElementDataBinding(model, validator);
    }

    /**
     * 
     * @param {AbstractInputElement} field 
     */
    and(field) {
        return this.to(field);
    }

    /**
     * 
     * @param {AbstractInputElement} field 
     */
    to(field) {
        const puller = () => {
            let modelValue = coreutil_v1.PropertyAccessor.getValue(this.model, field.name);
            if (modelValue !== field.value) {
                coreutil_v1.PropertyAccessor.setValue(this.model, field.name, field.value);
            }
            if (this.validator && this.validator.validate){
                this.validator.validate(field.value);
            }
        };
        field.listenTo("change", new coreutil_v1.Method(this, puller));
        field.listenTo("keyup", new coreutil_v1.Method(this, puller));
        puller.call();

        const pusher = () => {
            var modelValue = coreutil_v1.PropertyAccessor.getValue(this.model, field.name);
            if (modelValue !== field.value) {
                field.value = modelValue;
            }
            if (this.validator && this.validator.validateSilent && field.value){
                this.validator.validateSilent(field.value);
            }
        };

        let changedFunctionName = "__changed_" + field.name.replace(".","_");
        if (!this.model[changedFunctionName]) {
            this.model[changedFunctionName] = () => {
                this.push();
            };
        }

        this.pullers.add(puller);
        this.pushers.add(pusher);

        return this;
    }

    pull() {
        this.pullers.forEach((value, parent) => {
            value.call(parent);
            return true;
        }, this);
    }

    push() {
        this.pushers.forEach((value, parent) => {
            value.call(parent);
            return true;
        }, this);
    }
}

class ProxyObjectFactory {

    /**
     * Creates a proxy for an object which allows databinding from the object to the form element
     * 
     * @template T
     * @param {T} object 
     * @returns {T}
     */
    static createProxyObject(object) {
        return new Proxy(object, {
            set: (target, prop, value) => {
                let success = (target[prop] = value);

                let changedFunctionName = "__changed_" + prop;
                let changedFunction = target[changedFunctionName];
                if(changedFunction && typeof changedFunction === "function") {
                    let boundChangedFunction = changedFunction.bind(target);
                    boundChangedFunction();
                }
                return success === value;
            }
        });
    }
}

/**
 * Object Function which is called if the filter function returns true
 */
class EventFilteredMethod extends coreutil_v1.Method {

    /**
     * Contructor
     * @param {Method} method 
     * @param {function} theFilter 
     */
    constructor(method, filter){
        this.method = method;
        this.filter = filter;
    }

    call(params){
        if(this.filter && this.filter.call(this,params)) {
            this.method.call(params);
        }
    }

}

/**
 * EventManager
 */
class EventManager {


    /**
     * 
     */
    constructor() {
        /** @type Map<List<Method>> */
        this.listenerMap = new coreutil_v1.Map();
    }

    /**
     * 
     * @param {string} eventType 
     * @param {Method} listener 
     * @returns {EventManager}
     */
    listenTo(eventType, listener) {
        if (!this.listenerMap.contains(eventType)) {
            this.listenerMap.set(eventType, new coreutil_v1.List());
        }
        this.listenerMap.get(eventType).add(listener);
        return this;
    }

    /**
     * 
     * @param {string} eventType 
     * @param {Array|any} parameter 
     */
    async trigger(eventType, parameter) {
        if (!this.listenerMap.contains(eventType)) {
            return;
        }
        let resultArray = [];
        this.listenerMap.get(eventType).forEach((listener, parent) => {
            resultArray.push(listener.call(parameter));
            return true;
        });
        return Promise.all(resultArray);
    }

}

class CSS {
    
    /**
     * @type {BaseElement}
     */
    static from(baseElement) {
        return new CSS(baseElement);
    }

    /**
     * 
     * @param {BaseElement} baseElement 
     */
    constructor(baseElement) {
        /** @type {BaseElement} */
        this.baseElement = baseElement;
    }

    clear() {
        this.baseElement.setAttributeValue("class", "");
        return this;
    }

    /**
     * 
     * @param {String} cssClass 
     */
    toggle(cssClass) {
        let currentClass = this.baseElement.getAttributeValue("class");
        let currentClassArray = coreutil_v1.StringUtils.toArray(currentClass, " ");
        let currentClassList = new coreutil_v1.List(currentClassArray);
        
        if (currentClassList.contains(cssClass)) {
            currentClassList.remove(cssClass);
        } else {
            currentClassList.add(cssClass);
        }
        
        this.baseElement.setAttributeValue("class", coreutil_v1.ArrayUtils.toString(currentClassList.getArray(), " "));
        return this;
    }

    /**
     * 
     * @param {String} cssClass 
     */
    enable(cssClass) {
        let currentClass = this.baseElement.getAttributeValue("class");
        let currentClassArray = coreutil_v1.StringUtils.toArray(currentClass, " ");
        let currentClassList = new coreutil_v1.List(currentClassArray);
        
        if (!currentClassList.contains(cssClass)) {
            currentClassList.add(cssClass);
        }
        
        this.baseElement.setAttributeValue("class", coreutil_v1.ArrayUtils.toString(currentClassList.getArray(), " "));
        return this;
    }

    /**
     * 
     * @param {String} cssClass 
     */
    disable(cssClass) {
        let currentClass = this.baseElement.getAttributeValue("class");
        let currentClassArray = coreutil_v1.StringUtils.toArray(currentClass, " ");
        let currentClassList = new coreutil_v1.List(currentClassArray);
        
        if (currentClassList.contains(cssClass)) {
            currentClassList.remove(cssClass);
        }

        this.baseElement.setAttributeValue("class", coreutil_v1.ArrayUtils.toString(currentClassList.getArray(), " "));
        return this;
    }

    /**
     * 
     * @param {String} cssClassRemovalPrefix 
     * @param {String} cssClass
     */
    replace(cssClassRemovalPrefix, cssClass) {
        let currentClass = this.baseElement.getAttributeValue("class");
        let currentClassArray = coreutil_v1.StringUtils.toArray(currentClass, " ");
        let currentClassList = new coreutil_v1.List(currentClassArray);
        let toRemoveArray = [];

        if (!coreutil_v1.StringUtils.isBlank(cssClassRemovalPrefix)) {
            currentClassList.forEach((value) => {
                if (value.startsWith(cssClassRemovalPrefix)) {
                    toRemoveArray.push(value);
                }
                return true;
            }, this);
        }

        toRemoveArray.forEach((toRemoveValue) => {
            currentClassList.remove(toRemoveValue);
        });

        currentClassList.add(cssClass);
        this.baseElement.setAttributeValue("class", coreutil_v1.ArrayUtils.toString(currentClassList.getArray(), " "));
        return this;
    }

    

}

class Style {
    
    /**
     * @type {BaseElement}
     */
    static from(baseElement) {
        return new Style(baseElement);
    }

    /**
     * 
     * @param {BaseElement} baseElement 
     */
    constructor(baseElement) {
        /** @type {BaseElement} */
        this.baseElement = baseElement;
    }

    clear() {
        this.baseElement.setAttributeValue("style", "");
        return this;
    }

    /**
     * 
     * @param {String} styleName 
     */
    remove(styleName) {
        const currentStyleMap = this.srylesAsMap(this.baseElement.getAttributeValue("style"));
        if (currentStyleMap.contains(styleName)) {
            currentStyleMap.remove(styleName);
        }
        this.baseElement.setAttributeValue("style", coreutil_v1.MapUtils.toString(currentStyleMap, ":", ";"));
        return this;
    }

    /**
     * 
     * @param {String} styleName 
     * @param {String} styleValue 
     */
    set(styleName, styleValue) {
        const currentStyleMap = this.srylesAsMap(this.baseElement.getAttributeValue("style"));
        currentStyleMap.set(styleName, styleValue);
        this.baseElement.setAttributeValue("style", coreutil_v1.MapUtils.toString(currentStyleMap, ":", ";"));
        return this;
    }

    /**
     * 
     * @param {String} styleName 
     * @param {String} styleValue 
     */
     is(styleName, styleValue) {
        const currentStyleMap = this.srylesAsMap(this.baseElement.getAttributeValue("style"));
        return coreutil_v1.StringUtils.nonNullEquals(currentStyleMap.get(styleName), styleValue);
    }
    
    /**
     * 
     * @param {String} styleName 
     */
     exists(styleName) {
        const currentStyleMap = this.srylesAsMap(this.baseElement.getAttributeValue("style"));
        return currentStyleMap.contains(styleName);
    }

    srylesAsMap(styles) {
        if (!styles || styles.indexOf(":") === -1) {
            return new coreutil_v1.Map();
        }

        const currentStyleMap = new coreutil_v1.Map();

        const currentStylePairList = new coreutil_v1.List(coreutil_v1.StringUtils.toArray(styles, ";"));
        currentStylePairList.forEach((value, parent) => {
            if (!value || value.indexOf(":") === -1) {
                return;
            }
            const resolvedKey = value.split(":")[0].trim();
            const resolvedValue = value.split(":")[1].trim();
            currentStyleMap.set(resolvedKey, resolvedValue);
            return true;
        }, this);
        return currentStyleMap;
    }

}

class TrailNode {

    constructor() {

        /** @type {string} */
        this.trail = null;

        /** @type {property} */
        this.property = null;

        /** @type {function} */
        this.waypoint = null;

        /** @type {function} */
        this.destination = null;

        /** @type {Array<TrailNode>} */
        this.next = null;
    }

}

class TrailProcessor {

    /**
     * Finds the all matching functions based on the trail in the url
     * and calls those functions. Also ensures that the list
     * of trail stops are added to the history
     * 
     * @param {Url} url 
     * @param {any} callingObject 
     * @param {TrailNode} node 
     */
    static navigateAllStops(url, callingObject, node) {
        const trailStops = TrailProcessor.callMatchingFunctionFromUrl(url, callingObject, node);
        if (!trailStops || 0 === trailStops.size()) {
            return;
        }

        const urlBuilder = UrlBuilder.builder().withAllOfUrl(History.currentUrl());
        const stepUrl = urlBuilder.withBookmark(null).build();
        History.replaceUrl(stepUrl, stepUrl.toString(), null);
        
        trailStops.forEach((value) => {
            const stepUrl = urlBuilder.withBookmark(value).build();
            History.pushUrl(stepUrl, stepUrl.toString(), value);
            return true;
        }, this);
    }

    /**
     * Finds the matching function based on the trail in the url
     * and calls that function.
     * 
     * @param {Url} url 
     * @param {any} callingObject 
     * @param {TrailNode} node 
     */
    static navigateNextStop(url, callingObject, node) {
        TrailProcessor.callMatchingFunctionFromUrl(url, callingObject, node);
    }

    /**
     * Finds the trail stop which matches the function and records it in the history
     * 
     * @param {function} theFunction 
     * @param {any} callingObject 
     * @param {TrailNode} node 
     */
    static findNextStop(theFunction, callingObject, node) {

        const currentUrl = History.currentUrl();

        const matchingNode = TrailProcessor.getNodeByFunction(node, theFunction);

        if (!matchingNode) { 
            return Promise.resolve();
        }

        const executedFunctionPromise = matchingNode.destination.call(callingObject);

        if (!coreutil_v1.StringUtils.nonNullEquals(currentUrl.bookmark, matchingNode.trail)) {
            const urlBuilder = UrlBuilder.builder().withAllOfUrl(currentUrl);
            if (coreutil_v1.StringUtils.isBlank(currentUrl.bookmark)) {
                const stepUrl = urlBuilder.withBookmark("/").build();
                History.pushUrl(stepUrl, stepUrl.toString(), null);
            }

            const stepUrl = urlBuilder.withBookmark(matchingNode.trail).build();
            History.pushUrl(stepUrl, stepUrl.toString(), null);
        }

        return executedFunctionPromise;
    }

    /**
     * Finds the trail stop which matches the function and replaces current url with it
     * 
     * @param {function} theFunction 
     * @param {any} callingObject 
     * @param {TrailNode} node 
     */
     static replaceCurrentStop(theFunction, callingObject, node) {

        const currentUrl = History.currentUrl();

        const matchingNode = TrailProcessor.getNodeByFunction(node, theFunction);

        if (!matchingNode) { 
            return Promise.resolve();
        }

        const executedFunctionPromise = matchingNode.destination.call(callingObject);

        if (!coreutil_v1.StringUtils.nonNullEquals(currentUrl.bookmark, matchingNode.trail)) {
            const urlBuilder = UrlBuilder.builder().withAllOfUrl(currentUrl);
            const stepUrl = urlBuilder.withBookmark(matchingNode.trail).build();
            History.replaceUrl(stepUrl, stepUrl.toString(), null);
        }

        return executedFunctionPromise;
    }

    /**
     * 
     * @param {TrailNode} node 
     * @param {string} theFunction 
     * @returns 
     */
    static getNodeByFunction(node, theFunction) {

        if (theFunction === node.destination) {
            return node;
        }

        if (node.next) {
            let matchingNode = null;
            node.next.forEach((childNode) => {
                if (!matchingNode) {
                    matchingNode = TrailProcessor.getNodeByFunction(childNode, theFunction);
                }
            });
            if (matchingNode) {
                return matchingNode;
            }
        }

        return null;
    }

    /**
     * 
     * @param {Url} url 
     * @param {any} object 
     * @param {TrailNode} node 
     * @param {List<String>} trailStops
     * @returns {List<String>}
     */
    static callMatchingFunctionFromUrl(url, currentObject, node, trailStops = new coreutil_v1.List()) {

        if (node.property) {
            currentObject = currentObject[node.property];
        }

        if (coreutil_v1.StringUtils.startsWith(url.bookmark, TrailProcessor.toStartsWith(node.trail))) {
            trailStops.add(node.trail);
            if (node.waypoint) {
                node.waypoint.call(currentObject);
            }
        }

        if (coreutil_v1.StringUtils.nonNullEquals(url.bookmark, node.trail)) {
            trailStops.add(node.trail);
            if (node.destination) {
                node.destination.call(currentObject);
            }
        }

        if (node.next) {
            node.next.forEach((childNode) => {
                trailStops = TrailProcessor.callMatchingFunctionFromUrl(url, currentObject, childNode, trailStops);
            });
        }

        return trailStops;
    }

    static toStartsWith(trail) {

        if (null == trail) {
            return "/";
        }

        if (coreutil_v1.StringUtils.nonNullEquals(trail, "/")) {
            return "/";
        }

        return trail + "/";
    }

}

new coreutil_v1.Logger("HttpCallBuilder");

class HttpCallBuilder {

    /**
     * 
     * @param {string} url 
     */
    constructor(url) {

        /** @type {String} */
        this.url = url;

        /** @type {String} */
        this.authorization = null;


        /** @type {Map} */
        this.successMappingMap = new coreutil_v1.Map();

        /** @type {Map} */
        this.failMappingMap = new coreutil_v1.Map();

        /** @type {function} */
        this.errorMappingFunction = (error) => { return error; };


        /** @type {number} */
        this.connectionTimeoutValue = 4000;

        /** @type {number} */
        this.responseTimeoutValue = 4000;
    }

    /**
     * 
     * @param {string} url 
     * @returns {HttpCallBuilder}
     */
    static newInstance(url) {
        return new HttpCallBuilder(url);
    }

    /**
     * 
     * @param {Number} code 
     * @param {function} mapperFunction mapper function to pass the result object to
     */
    successMapping(code, mapperFunction = () => { return null; }) {
        this.successMappingMap.set(code, mapperFunction);
        return this;
    }

    /**
     * 
     * @param {Number} code 
     * @param {function} mapperFunction mapper function to pass the result object to
     */
    failMapping(code, mapperFunction = () => { return null; }) {
        this.failMappingMap.set(code, mapperFunction);
        return this;
    }

    /**
     * 
     * @param {function} mapperFunction mapper function to pass the result object to
     */
    errorMapping(mapperFunction) {
        this.errorMappingFunction = mapperFunction;
        return this;
    }

    /**
     * 
     * @param {string} authorization 
     */
    authorizationHeader(authorization) {
        if (!coreutil_v1.StringUtils.isBlank(authorization)) {
            this.authorization = "Bearer " + authorization;
        }
        return this;
    }

    connectionTimeout(connectionTimeoutValue) {
        this.connectionTimeoutValue = connectionTimeoutValue;
    }

    responseTimeout(responseTimeoutValue) {
        this.responseTimeoutValue = responseTimeoutValue;
    }

    /**
     * @returns {Promise}
     */
    async get() {
        const response = Client.get(this.url, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization);
        return this.asTypeMappedPromise(response);
    }

    /**
     * @returns {Promise}
     */
    async post(payload) {
        const resposne = await Client.post(this.url, payload, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization);
        return this.asTypeMappedPromise(resposne);
    }

    /**
     * @returns {Promise}
     */
    async put(payload) {
        const response = await Client.put(this.url, payload, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization);
        return this.asTypeMappedPromise(response);
    }

    /**
     * @returns {Promise}
     */
    async patch(payload) {
        const response = await Client.patch(this.url, payload, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization);
        return this.asTypeMappedPromise(response);
    }

    /**
     * @returns {Promise}
     */
    async delete() {
        const response = await Client.delete(this.url, this.connectionTimeoutValue, this.responseTimeoutValue);
        return this.asTypeMappedPromise(response);
    }

    /**
     * 
     * @param {Promise} fetchPromise 
     */
    async asTypeMappedPromise(fetchPromise) {
        try {
            const fetchResponse = await fetchPromise;
            return await this.handleFetchResponse(fetchResponse);
        } catch(error) {
            // API did not execute
            throw this.errorMappingFunction(error);
        }
    }

    /**
     * 
     * @param {Response} fetchResponse 
     * @param {function} resolve 
     * @param {function} reject 
     */
    async handleFetchResponse(fetchResponse) {
        const successResponseMapper = this.successMappingMap.get(fetchResponse.status);
        const failResponseMapper = this.failMappingMap.get(fetchResponse.status);

        // Empty response
        if (204 === fetchResponse.status || fetchResponse.headers.get("Content-Length") === "0") {
            if (successResponseMapper) {
                return successResponseMapper(null); 
            }
            if(failResponseMapper) {
                throw failResponseMapper(null);
            }
            throw new Error("Missing mapper for return status: " + fetchResponse.status);
        }

        // Assuming json response      
        try {  
            const responseJson = await fetchResponse.json();
            if (successResponseMapper) { 
                return successResponseMapper(responseJson);
            }
            if (failResponseMapper) {
                throw failResponseMapper(responseJson);
            }
            throw this.errorMappingFunction(responseJson);
        } catch(error) {
            // Response did not provide json
            throw this.errorMappingFunction(error);
        }
    }

}

const LOG = new coreutil_v1.Logger("AbstractValidator");

class AbstractValidator {

    /**
     * @param {boolean} isCurrentlyValid
     */
    constructor(currentlyValid = false, enabled = true) {
        this.validListenerList = new coreutil_v1.List();
        this.invalidListenerList = new coreutil_v1.List();
        this.currentlyValid = currentlyValid;
        this.enabled = enabled;
    }

    enable() {
        this.enabled = true;
        if (this.isValid()) {
            this.valid();
        } else {
            this.invalid();
        }
    }

    disable() {
        let wasValid = this.currentlyValid;
        // Fake valid
        this.valid();
        this.enabled = false;
        this.currentlyValid = wasValid;
    }

    isValid() {
        if (!this.enabled) {
            return true;
        }
        return this.currentlyValid;
    }

	valid() {
        if (!this.enabled) {
            return;
        }
        this.currentlyValid = true;
        if(!this.validListenerList) {
            LOG.warn("No validation listeners");
            return;
        }
        this.validListenerList.forEach((value, parent) => {
            value.call();
            return true;
        }, this);
	}

	invalid() {
        if (!this.enabled) {
            return;
        }
        this.currentlyValid = false;
        if(!this.invalidListenerList) {
            LOG.warn("No invalidation listeners");
            return;
        }
        this.invalidListenerList.forEach((value, parent) => {
            value.call();
            return true;
        }, this);
	}

	validSilent() {
        this.currentlyValid = true;
	}

	invalidSilent() {
        this.currentlyValid = false;
	}

	/**
	 * 
	 * @param {Method} validListener 
	 */
	withValidListener(validListener) {
		this.validListenerList.add(validListener);
		return this;
	}

	/**
	 * 
	 * @param {Method} invalidListener 
	 */
	withInvalidListener(invalidListener) {
		this.invalidListenerList.add(invalidListener);
		return this;
	}

}

class AndValidatorSet extends AbstractValidator {

    constructor(isValidFromStart = false) {
        super(isValidFromStart);
        this.validatorList = new coreutil_v1.List();
    }

    /**
     * @param {AbstractValidator} validator
     */
    withValidator(validator) {
        validator.withValidListener(new coreutil_v1.Method(this, this.oneValid));
        validator.withInvalidListener(new coreutil_v1.Method(this, this.oneInvalid));
        this.validatorList.add(validator);
        return this;
    }

    /**
     * One validator said it was valid
     */
    oneValid() {
        let foundInvalid = false;
        this.validatorList.forEach((value,parent) => {
            if(!value.isValid()) {
                foundInvalid = true;
                return false;
            }
            return true;
        }, this);
        if(!foundInvalid) {
            super.valid();
        } else {
            super.invalid();
        }
    }

    /**
     * One validator said it was invalid
     */
    oneInvalid() {
        super.invalid();
    }
}

class RegexValidator extends AbstractValidator {

    constructor(mandatory = false, iscurrentlyValid = false, regex = "(.*)") {
		super(iscurrentlyValid);
		this.mandatory = mandatory;
        this.regex = regex;
    }

	validate(value){
		if (value && typeof value === "string" && value.match(this.regex)){
	    	this.valid();
		} else {
			if(!value && !this.mandatory) {
				this.valid();
			} else {
				this.invalid();
			}
		}
	}

	validateSilent(value){
		if (value && typeof value === "string" && value.match(this.regex)){
	    	this.validSilent();
		} else {
			if(!value && !this.mandatory) {
				this.validSilent();
			} else {
				this.invalidSilent();
			}
		}
	}

}

class EmailValidator extends RegexValidator {

    static get EMAIL_FORMAT() { return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; }

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, EmailValidator.EMAIL_FORMAT);
    }

}

class EqualsFunctionResultValidator extends AbstractValidator {

	/**
	 * 
	 * @param {boolean} mandatory 
	 * @param {boolean} iscurrentlyValid 
	 * @param {Method} comparedValueFunction 
	 */
    constructor(mandatory = false, iscurrentlyValid = false, comparedValueFunction = null) {
		super(iscurrentlyValid);

		/** @type {boolean} */
		this.mandatory = mandatory;

		/** @type {Method} */
		this.comparedValueFunction = comparedValueFunction;
	}

	validate(value){
		if (!value && this.mandatory) {
			this.invalid();
		} else if(value === this.comparedValueFunction.call()){
	    	this.valid();
		} else {
			this.invalid();
		}
	}

	validateSilent(value){
		if (!value && this.mandatory) {
			this.invalidSilent();
		} else if(value === this.comparedValueFunction.call()){
	    	this.validSilent();
		} else {
			this.invalidSilent();
		}
	}

}

class EqualsPropertyValidator extends AbstractValidator {

	/**
	 * 
	 * @param {boolean} mandatory 
	 * @param {boolean} iscurrentlyValid 
	 * @param {Method} comparedValueFunction 
	 */
    constructor(mandatory = false, iscurrentlyValid = false, model = null, attributeName = null) {
		super(iscurrentlyValid);

		/** @type {boolean} */
		this.mandatory = mandatory;

		/** @type {object} */
        this.model = model;
        
        /** @type {string} */
        this.attributeName = attributeName;
	}

	validate(value){
		if (!value && this.mandatory) {
			this.invalid();
		} else if(value === coreutil_v1.PropertyAccessor.getValue(this.model, this.attributeName)){
	    	this.valid();
		} else {
			this.invalid();
		}
	}

	validateSilent(value){
		if (!value && this.mandatory) {
			this.invalidSilent();
		} else if(value === coreutil_v1.PropertyAccessor.getValue(this.model, this.attributeName)){
	    	this.validSilent();
		} else {
			this.invalidSilent();
		}
	}

}

class EqualsStringValidator extends AbstractValidator {

	/**
	 * 
	 * @param {boolean} mandatory 
	 * @param {boolean} iscurrentlyValid 
	 * @param {Method} comparedValueFunction 
	 */
    constructor(mandatory = false, iscurrentlyValid = false, controlValue = null) {
		super(iscurrentlyValid);

		/** @type {boolean} */
		this.mandatory = mandatory;

        /** @type {string} */
        this.controlValue = controlValue;
	}

	validate(value){
		if (!value && this.mandatory) {
			this.invalid();
		} else if(value === controlValue){
	    	this.valid();
		} else {
			this.invalid();
		}
	}

	validateSilent(value){
		if (!value && this.mandatory) {
			this.invalidSilent();
		} else if(value === controlValue){
	    	this.validSilent();
		} else {
			this.invalidSilent();
		}
	}

}

class NumberValidator extends RegexValidator {

    static get PHONE_FORMAT() { return /^\d*$/; }

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, NumberValidator.PHONE_FORMAT);
    }

}

class OrValidatorSet extends AbstractValidator {
    
    constructor(isValidFromStart = false) {
        super(isValidFromStart);
        this.validatorList = new coreutil_v1.List();
    }

    /**
     * @param {AbstractValidator} validator
     */
    withValidator(validator) {
        validator.withValidListener(new coreutil_v1.Method(this, this.oneValid));
        validator.withInvalidListener(new coreutil_v1.Method(this, this.oneInvalid));
        this.validatorList.add(validator);
        return this;
    }

    /**
     * One validator said it was valid
     */
    oneValid() {
        super.valid();
    }

    /**
     * One validator said it was invalid
     */
    oneInvalid() {
        let foundValid = false;
        this.validatorList.forEach((value,parent) => {
            if(value.isValid()) {
                foundValid = true;
                return false;
            }
            return true;
        }, this);
        if(foundValid) {
            super.valid();
        } else {
            super.invalid();
        }
    }

}

const PASSWORD_FORMAT = /^(?=.*[A-Za-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

class PasswordValidator extends RegexValidator {

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, PASSWORD_FORMAT);
    }

}

class PhoneValidator extends RegexValidator {

    static get PHONE_FORMAT() { return /^\+[0-9]{2}\s?([0-9]\s?)*$/; }

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, PhoneValidator.PHONE_FORMAT);
    }

}

class RequiredValidator extends AbstractValidator {

	constructor(currentlyValid = false, enabled = true) {
		super(currentlyValid, enabled);
	}

	validate(value){
		if(value === ""){
	    	this.invalid();
		} else {
			this.valid();
		}
	}

	validateSilent(value){
		if(value === ""){
	    	this.invalidSilent();
		} else {
			this.validSilent();
		}
	}

}

exports.AbstractInputElement = AbstractInputElement;
exports.AbstractValidator = AbstractValidator;
exports.ActiveModuleRunner = ActiveModuleRunner;
exports.AndValidatorSet = AndValidatorSet;
exports.Application = Application;
exports.Attribute = Attribute;
exports.BaseElement = BaseElement;
exports.CSS = CSS;
exports.CanvasRoot = CanvasRoot;
exports.CanvasStyles = CanvasStyles;
exports.CheckboxInputElement = CheckboxInputElement;
exports.Client = Client;
exports.Component = Component;
exports.ComponentConfigProcessor = ComponentConfigProcessor;
exports.ComponentFactory = ComponentFactory;
exports.Config = Config;
exports.ConfiguredFunction = ConfiguredFunction;
exports.DiModuleLoader = DiModuleLoader;
exports.ElementMapper = ElementMapper;
exports.ElementRegistrator = ElementRegistrator;
exports.ElementUtils = ElementUtils;
exports.EmailValidator = EmailValidator;
exports.EqualsFunctionResultValidator = EqualsFunctionResultValidator;
exports.EqualsPropertyValidator = EqualsPropertyValidator;
exports.EqualsStringValidator = EqualsStringValidator;
exports.Event = Event;
exports.EventFilteredMethod = EventFilteredMethod;
exports.EventManager = EventManager;
exports.FormElement = FormElement;
exports.HTML = HTML;
exports.History = History;
exports.HttpCallBuilder = HttpCallBuilder;
exports.InputElementDataBinding = InputElementDataBinding;
exports.LoaderInterceptor = LoaderInterceptor;
exports.Main = Main;
exports.MappedHtmlElement = MappedHtmlElement;
exports.ModuleLoader = ModuleLoader;
exports.ModuleRunner = ModuleRunner;
exports.Navigation = Navigation;
exports.NumberValidator = NumberValidator;
exports.OrValidatorSet = OrValidatorSet;
exports.PasswordValidator = PasswordValidator;
exports.PhoneValidator = PhoneValidator;
exports.ProxyObjectFactory = ProxyObjectFactory;
exports.RadioInputElement = RadioInputElement;
exports.RegexValidator = RegexValidator;
exports.RequiredValidator = RequiredValidator;
exports.SimpleElement = SimpleElement;
exports.StateManager = StateManager;
exports.Style = Style;
exports.Styles = Styles;
exports.StylesLoader = StylesLoader;
exports.StylesRegistry = StylesRegistry;
exports.Template = Template;
exports.TemplateRegistry = TemplateRegistry;
exports.TemplatesLoader = TemplatesLoader;
exports.TextInputElement = TextInputElement;
exports.TextareaInputElement = TextareaInputElement;
exports.TextnodeElement = TextnodeElement;
exports.TrailNode = TrailNode;
exports.TrailProcessor = TrailProcessor;
exports.UniqueIdRegistry = UniqueIdRegistry;
exports.Url = Url;
exports.UrlBuilder = UrlBuilder;
exports.UrlUtils = UrlUtils;
exports.VideoElement = VideoElement;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvbW9kdWxlUnVubmVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL3VybC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC91cmxVdGlscy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi9oaXN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL3VybEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L25hdmlnYXRpb24vbmF2aWdhdGlvbi5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvYWN0aXZlTW9kdWxlUnVubmVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jbGllbnQvY2xpZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVzLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC90ZW1wbGF0ZS90ZW1wbGF0ZXNMb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNMb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRDb25maWdQcm9jZXNzb3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC91bmlxdWVJZFJlZ2lzdHJ5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2F0dHJpYnV0ZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29uZmlnL2NvbmZpZ3VyZWRGdW5jdGlvbi5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9tYXBwZWRIdG1sRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9lbGVtZW50VXRpbHMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvYmFzZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvYWJzdHJhY3RJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvcmFkaW9JbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvY2hlY2tib3hJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdGV4dElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0YXJlYUlucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0bm9kZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvc2ltcGxlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9mb3JtRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC92aWRlb0VsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvZWxlbWVudE1hcHBlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2VsZW1lbnRSZWdpc3RyYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZXZlbnQvZXZlbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNSb290LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9odG1sL2h0bWwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNTdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdGF0ZS9zdGF0ZU1hbmFnZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbmZpZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbG9hZGVyL2xvYWRlckludGVyY2VwdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbW9kdWxlTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9tYWluLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvZGlNb2R1bGVMb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2FwcGxpY2F0aW9uLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9kYXRhQmluZC9pbnB1dEVsZW1lbnREYXRhQmluZGluZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZGF0YUJpbmQvcHJveHlPYmplY3RGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudEZpbHRlcmVkTWV0aG9kLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudE1hbmFnZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2h0bWwvY3NzLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9odG1sL3N0eWxlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9uYXZpZ2F0aW9uL3RyYWlsTm9kZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi90cmFpbFByb2Nlc3Nvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9odHRwQ2FsbEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9hYnN0cmFjdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2FuZFZhbGlkYXRvclNldC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlZ2V4VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZW1haWxWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNGdW5jdGlvblJlc3VsdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VxdWFsc1Byb3BlcnR5VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzU3RyaW5nVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvbnVtYmVyVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3Ivb3JWYWxpZGF0b3JTZXQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9wYXNzd29yZFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bob25lbFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlcXVpcmVkVmFsaWRhdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBNb2R1bGVSdW5uZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICAgcnVuTW9kdWxlKHVybCkge1xuICAgICB9XG5cbn0iLCJpbXBvcnQge0xpc3QsIE1hcCwgU3RyaW5nVXRpbHN9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgVXJse1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBob3N0IFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwb3J0IFxuICAgICAqIEBwYXJhbSB7TGlzdH0gcGF0aFZhbHVlTGlzdCBcbiAgICAgKiBAcGFyYW0ge01hcH0gcGFyYW1ldGVyVmFsdWVNYXAgXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGJvb2ttYXJrIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByb3RvY29sLCBob3N0LCBwb3J0LCBwYXRoVmFsdWVMaXN0LCBwYXJhbWV0ZXJWYWx1ZU1hcCwgYm9va21hcmspe1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xuICAgICAgICB0aGlzLnByb3RvY29sU3RyaW5nID0gcHJvdG9jb2w7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMuaG9zdFN0cmluZyA9IGhvc3Q7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMucG9ydFN0cmluZyA9IHBvcnQ7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xuICAgICAgICB0aGlzLnBhdGhWYWx1ZUxpc3QgPSBwYXRoVmFsdWVMaXN0O1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnBhcmFtZXRlclZhbHVlTWFwID0gcGFyYW1ldGVyVmFsdWVNYXA7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMuYm9va21hcmtTdHJpbmcgPSBib29rbWFyaztcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5wYXRoVmFsdWVMaXN0KSB7XG4gICAgICAgICAgICB0aGlzLnBhdGhWYWx1ZUxpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5wYXJhbWV0ZXJWYWx1ZU1hcCkge1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJWYWx1ZU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBwcm90b2NvbCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wcm90b2NvbFN0cmluZztcbiAgICB9XG5cbiAgICBnZXQgaG9zdCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ob3N0U3RyaW5nO1xuICAgIH1cblxuICAgIGdldCBwb3J0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBvcnRTdHJpbmc7XG4gICAgfVxuXG4gICAgZ2V0IHBhdGhzTGlzdCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wYXRoVmFsdWVMaXN0O1xuICAgIH1cblxuICAgIGdldCBib29rbWFyaygpe1xuICAgICAgICByZXR1cm4gdGhpcy5ib29rbWFya1N0cmluZztcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1ldGVyTWFwKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJhbWV0ZXJWYWx1ZU1hcDtcbiAgICB9XG5cbiAgICBnZXRQYXRoUGFydChpbmRleCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhWYWx1ZUxpc3QuZ2V0KGluZGV4KTtcbiAgICB9XG5cbiAgICByZXBsYWNlUGF0aFZhbHVlKGZyb20sIHRvKXtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMucGF0aFZhbHVlTGlzdC5zaXplKCkpIHtcbiAgICAgICAgICAgIGlmIChTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKGZyb20sIHRoaXMucGF0aFZhbHVlTGlzdC5nZXQoaSkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoVmFsdWVMaXN0LnNldChpLCB0byk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpICsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBwYXRoKCl7XG4gICAgICAgIGxldCBwYXRoID0gXCIvXCI7XG4gICAgICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgICAgIHRoaXMucGF0aFZhbHVlTGlzdC5mb3JFYWNoKCh2YWx1ZSA9PiB7XG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGggKyBcIi9cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXRoICsgdmFsdWU7XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9KSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIGdldFBhcmFtZXRlcihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyTWFwLmdldChrZXkpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHZhciB2YWx1ZSA9IFwiXCI7XG4gICAgICAgIGlmKHRoaXMucHJvdG9jb2wgIT09IG51bGwpe1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIHRoaXMucHJvdG9jb2wgKyBcIi8vXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5ob3N0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyB0aGlzLmhvc3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5wb3J0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIjpcIiArIHRoaXMucG9ydDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGF0aFZhbHVlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHBhdGhQYXJ0LHBhcmVudCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCIvXCIgKyBwYXRoUGFydDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgIHZhciBmaXJzdFBhcmFtZXRlciA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAuZm9yRWFjaChmdW5jdGlvbihwYXJhbWV0ZXJLZXkscGFyYW1ldGVyVmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIGlmKGZpcnN0UGFyYW1ldGVyKXtcbiAgICAgICAgICAgICAgICBmaXJzdFBhcmFtZXRlcj1mYWxzZTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI/XCI7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCImXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgZW5jb2RlVVJJKHBhcmFtZXRlcktleSkgKyBcIj1cIiArIGVuY29kZVVSSShwYXJhbWV0ZXJWYWx1ZSk7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgaWYodGhpcy5ib29rbWFyayAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIFwiI1wiICsgdGhpcy5ib29rbWFyaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBMaXN0LCBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuL3VybC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVXJsVXRpbHMge1xuXG4gICAgLyoqXG4gICAgICogUGFyc2Ugc3RyaW5nIHRvIHVybFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmxTdHJpbmcgXG4gICAgICogQHJldHVybnMge1VybH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2UodXJsU3RyaW5nKSB7XG4gICAgICAgIFxuICAgICAgICBsZXQgcmVtYWluaW5nID0geyBcInN0cmluZ1wiIDogdXJsU3RyaW5nIH07XG5cbiAgICAgICAgaWYgKHVybFN0cmluZyA9PT0gbnVsbCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgICAgIGNvbnN0IHByb3RvY29sID0gICAgICBVcmxVdGlscy5kZXRlcm1pbmVQcm90b2NvbChyZW1haW5pbmcpO1xuICAgICAgICBjb25zdCBob3N0QW5kUG9ydCA9ICAgVXJsVXRpbHMuZGV0ZXJtaW5lSG9zdEFuZFBvcnQocmVtYWluaW5nKTtcbiAgICAgICAgY29uc3QgaG9zdCA9ICAgICAgICAgIFVybFV0aWxzLmV4dHJhY3RIb3N0KGhvc3RBbmRQb3J0KTtcbiAgICAgICAgY29uc3QgcG9ydCA9ICAgICAgICAgIFVybFV0aWxzLmV4dHJhY3RQb3J0KGhvc3RBbmRQb3J0KTtcbiAgICAgICAgY29uc3QgcGF0aHNMaXN0ID0gICAgIFVybFV0aWxzLmRldGVybWluZVBhdGgocmVtYWluaW5nKTtcbiAgICAgICAgY29uc3QgcGFyYW1ldGVyc01hcCA9IFVybFV0aWxzLmRldGVybWluZVBhcmFtZXRlcnMocmVtYWluaW5nKTtcbiAgICAgICAgY29uc3QgYm9va21hcmsgPSAgICAgIFVybFV0aWxzLmRldGVybWluZUJvb2ttYXJrKHJlbWFpbmluZyk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBVcmwocHJvdG9jb2wsIGhvc3QsIHBvcnQsIHBhdGhzTGlzdCwgcGFyYW1ldGVyc01hcCwgYm9va21hcmspO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVQcm90b2NvbChyZW1haW5pbmcpe1xuICAgICAgICBsZXQgdmFsdWUgPSByZW1haW5pbmdbXCJzdHJpbmdcIl07XG5cbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcHJvdG9jb2wgPSB2YWx1ZTtcblxuICAgICAgICBpZiAodmFsdWUuaW5kZXhPZihcIi8vXCIpID09PSAtMSl7XG4gICAgICAgICAgICAvLyBObyAnLy8nIHRvIGluZGljYXRlIHByb3RvY29sIFxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFydHMgPSB2YWx1ZS5zcGxpdChcIi8vXCIpO1xuICAgICAgICBpZihwYXJ0c1swXS5pbmRleE9mKFwiL1wiKSAhPT0gLTEpe1xuICAgICAgICAgICAgLy8gc2xhc2ggc2hvdWxkIG5vdCBiZSBpbiBwcm90b2NvbFxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90b2NvbCA9IHBhcnRzWzBdO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoID09IDEpe1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IHZhbHVlLnJlcGxhY2UocGFydHNbMF0gKyBcIi8vXCIsIFwiXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb3RvY29sO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVIb3N0QW5kUG9ydChyZW1haW5pbmcpe1xuICAgICAgICBsZXQgdmFsdWUgPSByZW1haW5pbmdbXCJzdHJpbmdcIl07XG5cbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaG9zdEFuZFBvcnQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IHJlbWFpbmluZ1N0cmluZyA9IG51bGw7XG5cbiAgICAgICAgaWYgKGhvc3RBbmRQb3J0LmluZGV4T2YoXCIvXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgLy8gSG9zdCBjb21lcyBiZWZvcmUgdGhlIGZpcnN0ICcvJ1xuICAgICAgICAgICAgaG9zdEFuZFBvcnQgPSBob3N0QW5kUG9ydC5zcGxpdChcIi9cIilbMF07XG4gICAgICAgICAgICByZW1haW5pbmdTdHJpbmcgPSB2YWx1ZS5yZXBsYWNlKGhvc3RBbmRQb3J0ICsgXCIvXCIsIFwiXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gcmVtYWluaW5nU3RyaW5nO1xuICAgICAgICByZXR1cm4gaG9zdEFuZFBvcnQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGV4dHJhY3RIb3N0KGhvc3RBbmRQb3J0KXtcbiAgICAgICAgaWYgKCFob3N0QW5kUG9ydCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaG9zdEFuZFBvcnQuaW5kZXhPZihcIjpcIikgPT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiBob3N0QW5kUG9ydDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaG9zdEFuZFBvcnQuc3BsaXQoXCI6XCIpWzBdO1xuICAgIH1cblxuICAgIHN0YXRpYyBleHRyYWN0UG9ydChob3N0QW5kUG9ydCl7XG4gICAgICAgIGlmICghaG9zdEFuZFBvcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhvc3RBbmRQb3J0LmluZGV4T2YoXCI6XCIpID09PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaG9zdEFuZFBvcnQuc3BsaXQoXCI6XCIpWzFdO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVQYXRoKHJlbWFpbmluZyl7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJlbWFpbmluZ1tcInN0cmluZ1wiXTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IExpc3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXRoID0gdmFsdWU7XG5cbiAgICAgICAgaWYgKHBhdGguaW5kZXhPZihcIj9cIikgIT09IC0xKXtcbiAgICAgICAgICAgIGxldCBwYXJ0cyA9IHBhdGguc3BsaXQoXCI/XCIpO1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBwYXRoLnN1YnN0cmluZyhwYXRoLmluZGV4T2YoXCI/XCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXJ0c1swXTtcblxuICAgICAgICB9IGVsc2UgaWYgKHBhdGguaW5kZXhPZihcIiNcIikgIT09IC0xKXtcbiAgICAgICAgICAgIGxldCBwYXJ0cyA9IHBhdGguc3BsaXQoXCIjXCIpO1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBwYXRoLnN1YnN0cmluZyhwYXRoLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXJ0c1swXTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXRoLnN0YXJ0c1dpdGgoXCIvXCIpKSB7XG4gICAgICAgICAgICBwYXRoID0gdmFsdWUuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmF3UGF0aFBhcnRMaXN0ID0gbmV3IExpc3QocGF0aC5zcGxpdChcIi9cIikpO1xuXG4gICAgICAgIGNvbnN0IHBhdGhWYWx1ZUxpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICByYXdQYXRoUGFydExpc3QuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHBhdGhWYWx1ZUxpc3QuYWRkKGRlY29kZVVSSSh2YWx1ZSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBwYXRoVmFsdWVMaXN0O1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVQYXJhbWV0ZXJzKHJlbWFpbmluZyl7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmVtYWluaW5nW1wic3RyaW5nXCJdO1xuXG4gICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWFwKCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyYW1ldGVycyA9IHZhbHVlO1xuXG4gICAgICAgIGlmKHBhcmFtZXRlcnMuaW5kZXhPZihcIj9cIikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hcCgpO1xuICAgICAgICB9XG4gICAgICAgIHBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzLnN1YnN0cmluZyhwYXJhbWV0ZXJzLmluZGV4T2YoXCI/XCIpKzEpO1xuICAgICAgICBpZihwYXJhbWV0ZXJzLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gcGFyYW1ldGVycy5zdWJzdHJpbmcocGFyYW1ldGVycy5pbmRleE9mKFwiI1wiKSk7XG4gICAgICAgICAgICBwYXJhbWV0ZXJzID0gcGFyYW1ldGVycy5zdWJzdHJpbmcoMCxwYXJhbWV0ZXJzLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJhbWV0ZXJQYXJ0TGlzdCA9IG5ldyBMaXN0KHBhcmFtZXRlcnMuc3BsaXQoXCImXCIpKTtcbiAgICAgICAgY29uc3QgcGFyYW1ldGVyTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICBwYXJhbWV0ZXJQYXJ0TGlzdC5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGtleVZhbHVlID0gdmFsdWUuc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgaWYoa2V5VmFsdWUubGVuZ3RoID49IDIpe1xuICAgICAgICAgICAgICAgIHBhcmFtZXRlck1hcC5zZXQoZGVjb2RlVVJJKGtleVZhbHVlWzBdKSxkZWNvZGVVUkkoa2V5VmFsdWVbMV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gcGFyYW1ldGVyTWFwO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVCb29rbWFyayhyZW1haW5pbmcpe1xuICAgICAgICBsZXQgdmFsdWUgPSByZW1haW5pbmdbXCJzdHJpbmdcIl07XG5cbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGJvb2ttYXJrID0gdmFsdWU7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgYm9va21hcmsgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikrMSk7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBib29rbWFyaztcbiAgICB9XG5cblxufSIsImltcG9ydCB7IENvbnRhaW5lclVybCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IFVybFV0aWxzIH0gZnJvbSBcIi4uL3V0aWwvdXJsVXRpbHMuanNcIjtcblxuZXhwb3J0IGNsYXNzIEhpc3Rvcnkge1xuXG4gICAgc3RhdGljIHJlcGxhY2VVcmwodXJsLCB0aXRsZSwgc3RhdGVPYmplY3QpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLnJlcGxhY2VVcmwodXJsLnRvU3RyaW5nKCksIHRpdGxlLCBzdGF0ZU9iamVjdCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHB1c2hVcmwodXJsLCB0aXRsZSwgc3RhdGVPYmplY3QpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLnB1c2hVcmwodXJsLnRvU3RyaW5nKCksIHRpdGxlLCBzdGF0ZU9iamVjdCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGN1cnJlbnRVcmwoKSB7XG4gICAgICAgIHJldHVybiBVcmxVdGlscy5wYXJzZShDb250YWluZXJVcmwuY3VycmVudFVybCgpKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMaXN0LCBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuL3VybC5qc1wiO1xuaW1wb3J0IHsgVXJsVXRpbHMgfSBmcm9tIFwiLi91cmxVdGlscy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVXJsQnVpbGRlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaG9zdCA9IG51bGw7XG4gICAgICAgIHRoaXMucG9ydCA9IG51bGw7XG4gICAgICAgIHRoaXMucGF0aHNMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmJvb2ttYXJrID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICBzdGF0aWMgYnVpbGRlcigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVcmxCdWlsZGVyKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICAgd2l0aFVybCh1cmwpIHtcbiAgICAgICAgdGhpcy53aXRoQWxsT2ZVcmwoVXJsVXRpbHMucGFyc2UodXJsKSlcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICAgd2l0aFJvb3RPZlVybCh1cmwpIHtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IHVybC5wcm90b2NvbDtcbiAgICAgICAgdGhpcy5wb3J0ID0gdXJsLnBvcnQ7XG4gICAgICAgIHRoaXMuaG9zdCA9IHVybC5ob3N0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgICB3aXRoUGF0aE9mVXJsKHVybCkge1xuICAgICAgICB0aGlzLndpdGhSb290T2ZVcmwodXJsKTtcbiAgICAgICAgdGhpcy5wYXRoc0xpc3QgPSB1cmwucGF0aHNMaXN0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhBbGxPZlVybCh1cmwpIHtcbiAgICAgICAgdGhpcy53aXRoUGF0aE9mVXJsKHVybCk7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyc01hcCA9IHVybC5wYXJhbWV0ZXJNYXA7XG4gICAgICAgIHRoaXMuYm9va21hcmsgPSB1cmwuYm9va21hcms7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcm90b2NvbCBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICB3aXRoUHJvdG9jb2wocHJvdG9jb2wpIHtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IFVybFV0aWxzLmRldGVybWluZVBhdGgoeyBcInN0cmluZ1wiIDogcHJvdG9jb2wgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBob3N0IFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhIb3N0KGhvc3QpIHtcbiAgICAgICAgdGhpcy5ob3N0ID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aCh7IFwic3RyaW5nXCIgOiBob3N0IH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICB3aXRoUGF0aChwYXRoKSB7XG4gICAgICAgIHRoaXMucGF0aHNMaXN0ID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aCh7IFwic3RyaW5nXCIgOiBwYXRoIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1ldGVycyBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICB3aXRoUGFyYW1ldGVycyhwYXJhbWV0ZXJzKSB7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyc01hcCA9IFVybFV0aWxzLmRldGVybWluZVBhdGgoeyBcInN0cmluZ1wiIDogcGFyYW1ldGVycyB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJvb2ttYXJrIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhCb29rbWFyayhib29rbWFyaykge1xuICAgICAgICB0aGlzLmJvb2ttYXJrID0gVXJsVXRpbHMuZGV0ZXJtaW5lQm9va21hcmsoeyBcInN0cmluZ1wiIDogYm9va21hcmsgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGJ1aWxkKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVybCh0aGlzLnByb3RvY29sLCB0aGlzLmhvc3QsIHRoaXMucG9ydCwgdGhpcy5wYXRoc0xpc3QsIHRoaXMucGFyYW1ldGVyc01hcCwgdGhpcy5ib29rbWFyayk7XG4gICAgfVxufSIsImltcG9ydCB7IEhpc3RvcnkgfSBmcm9tIFwiLi9oaXN0b3J5LmpzXCI7XG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcbmltcG9ydCB7IENvbnRhaW5lclVybCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IFVybEJ1aWxkZXIgfSBmcm9tIFwiLi4vdXRpbC91cmxCdWlsZGVyLmpzXCI7XG5cbmxldCBuYXZpZ2F0b2lvbiA9IG51bGw7XG5cbmV4cG9ydCBjbGFzcyBOYXZpZ2F0aW9uIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge05hdmlnYXRpb259XG4gICAgICovXG4gICAgc3RhdGljIGluc3RhbmNlKCkge1xuICAgICAgICBpZiAoIW5hdmlnYXRvaW9uKSB7XG4gICAgICAgICAgICBuYXZpZ2F0b2lvbiA9IG5ldyBOYXZpZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hdmlnYXRvaW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5hdmlnYXRlIGJyb3dzZXIgdG8gbmV3IHVybFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgZ28odXJsKSB7XG4gICAgICAgIENvbnRhaW5lclVybC5nbyh1cmwudG9TdHJpbmcoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTmF2aWdhdGUgYnJvd3NlciBiYWNrXG4gICAgICovXG4gICAgYmFjaygpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLmJhY2soKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHBhdGggd2l0aG91dCByZW5hdmlnYXRpbmcgYnJvd3NlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gICAgICogQHJldHVybnMge1VybH1cbiAgICAgKi9cbiAgICBsb2FkKHBhdGgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gSGlzdG9yeS5jdXJyZW50VXJsKCk7XG4gICAgICAgIGNvbnN0IG5ld1VybCA9IFVybEJ1aWxkZXIuYnVpbGRlcigpLndpdGhSb290T2ZVcmwodXJsKS53aXRoUGF0aChwYXRoKS5idWlsZCgpO1xuICAgICAgICBIaXN0b3J5LnB1c2hVcmwobmV3VXJsKTtcbiAgICAgICAgcmV0dXJuIG5ld1VybDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBNb2R1bGVSdW5uZXIgfSBmcm9tIFwiLi9tb2R1bGVSdW5uZXIuanNcIjtcbmltcG9ydCB7IE5hdmlnYXRpb24gfSBmcm9tIFwiLi9uYXZpZ2F0aW9uL25hdmlnYXRpb24uanNcIjtcblxubGV0IGFjdGl2ZU1vZHVsZVJ1bm5lciA9IG51bGw7XG5cbmV4cG9ydCBjbGFzcyBBY3RpdmVNb2R1bGVSdW5uZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNb2R1bGVSdW5uZXJ9ICovXG4gICAgICAgIHRoaXMubW9kdWxlUnVubmVyID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7QWN0aXZlTW9kdWxlUnVubmVyfVxuICAgICAqL1xuICAgIHN0YXRpYyBpbnN0YW5jZSgpIHtcbiAgICAgICAgaWYgKCFhY3RpdmVNb2R1bGVSdW5uZXIpIHtcbiAgICAgICAgICAgIGFjdGl2ZU1vZHVsZVJ1bm5lciA9IG5ldyBBY3RpdmVNb2R1bGVSdW5uZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aXZlTW9kdWxlUnVubmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TW9kdWxlUnVubmVyfSBuZXdNb2R1bGVSdW5uZXIgXG4gICAgICovXG4gICAgc2V0KG5ld01vZHVsZVJ1bm5lcikge1xuICAgICAgICB0aGlzLm1vZHVsZVJ1bm5lciA9IG5ld01vZHVsZVJ1bm5lcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHBhdGggd2l0aG91dCByZW5hdmlnYXRpbmcgYnJvd3NlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFxuICAgICAqL1xuICAgICBhc3luYyBsb2FkKHBhdGgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gTmF2aWdhdGlvbi5pbnN0YW5jZSgpLmxvYWQocGF0aCk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm1vZHVsZVJ1bm5lci5ydW5Nb2R1bGUodXJsKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgQ29udGFpbmVySHR0cENsaWVudCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcblxuZXhwb3J0IGNsYXNzIENsaWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0KHVybCwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgcG9zdCh1cmwsIGRhdGEsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCwgYXV0aG9yaXphdGlvbiA9IG51bGwpe1xuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiBcImZvbGxvd1wiLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgcHV0KHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsIFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JywgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XG4gICAgICovXG4gICAgc3RhdGljIHBhdGNoKHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BBVENIJywgXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZGVsZXRlKHVybCwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwKXtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldEhlYWRlcihhdXRob3JpemF0aW9uID0gbnVsbCkge1xuICAgICAgICBsZXQgaGVhZGVycyA9IHtcbiAgICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBcIk1vemlsbGEvNC4wIE1ETiBFeGFtcGxlXCIsXG4gICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICB9O1xuICAgICAgICBpZiAoYXV0aG9yaXphdGlvbikge1xuICAgICAgICAgICAgaGVhZGVycyA9IHtcbiAgICAgICAgICAgICAgICBcInVzZXItYWdlbnRcIjogXCJNb3ppbGxhLzQuMCBNRE4gRXhhbXBsZVwiLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBhdXRob3JpemF0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhlYWRlcnM7XG4gICAgfVxufSIsImV4cG9ydCBjbGFzcyBTdHlsZXN7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3R5bGVzU291cmNlIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHN0eWxlc1NvdXJjZSl7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzU291cmNlID0gc3R5bGVzU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0U3R5bGVzU291cmNlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc1NvdXJjZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgTWFwLCBMb2dnZXIsIE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgVXJsVXRpbHMgfSBmcm9tIFwiLi4vdXRpbC91cmxVdGlscy5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzIH0gZnJvbSBcIi4vc3R5bGVzLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJTdHlsZXNSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIFN0eWxlc1JlZ2lzdHJ5IHtcblxuICAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnN0eWxlc01hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy5zdHlsZXNVcmxNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xuICAgICAgICB0aGlzLnN0eWxlc1F1ZXVlU2l6ZSA9IDA7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNZXRob2R9ICovXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7U3R5bGVzfSBzdHlsZXMgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBzZXQobmFtZSxzdHlsZXMsdXJsKXtcbiAgICAgICAgaWYodXJsICE9PSB1bmRlZmluZWQgJiYgdXJsICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnN0eWxlc1VybE1hcC5zZXQobmFtZSwgdXJsKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0eWxlc01hcC5zZXQobmFtZSwgc3R5bGVzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKi9cbiAgICBnZXQobmFtZSl7XG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc01hcC5nZXQobmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICovXG4gICAgY29udGFpbnMobmFtZSl7XG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc01hcC5jb250YWlucyhuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgZG9uZShjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3R5bGVzUmVnaXN0cnl9IHJlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGRvQ2FsbGJhY2socmVnaXN0cnkpe1xuICAgICAgICBpZih0bW8uY2FsbGJhY2sgIT09IG51bGwgJiYgcmVnaXN0cnkuY2FsbGJhY2sgIT09IHVuZGVmaW5lZCAgJiYgcmVnaXN0cnkuc3R5bGVzUXVldWVTaXplID09PSByZWdpc3RyeS5zdHlsZXNNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBDYWxsYmFjay5jYWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgICBhc3luYyBsb2FkKG5hbWUsIHVybCkge1xuICAgICAgICB0aGlzLnN0eWxlc1F1ZXVlU2l6ZSArKztcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBDbGllbnQuZ2V0KHVybCk7XG4gICAgICAgIGlmKCFyZXNwb25zZS5vayl7XG4gICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHN0eWxlcyBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgdGhpcy5zZXQobmFtZSwgbmV3IFN0eWxlcyh0ZXh0KSwgdXJsKTtcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRTdHlsZXNMb2FkZWRQcm9taXNlKG5hbWVVcmxNYXApIHtcbiAgICAgICAgXG4gICAgICAgIGlmKCFuYW1lVXJsTWFwIHx8IG5hbWVVcmxNYXAuc2l6ZSgpID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsb2FkUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgbmFtZVVybE1hcC5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnRhaW5zKGtleSkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsb2FkUHJvbWlzZXMucHVzaCh0aGlzLnByaXZhdGVMb2FkKGtleSwgVXJsVXRpbHMucGFyc2UodmFsdWUpKSk7XG4gICAgICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKGxvYWRQcm9taXNlcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBhc3luYyBwcml2YXRlTG9hZChuYW1lLCB1cmwpIHtcbiAgICAgICAgTE9HLmluZm8oXCJMb2FkaW5nIHN0eWxlcyBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybC50b1N0cmluZygpKTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IENsaWVudC5nZXQodXJsKTtcbiAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcbiAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgc3R5bGVzIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICBjb25zdCBzdHlsZXMgPSBuZXcgU3R5bGVzKHRleHQpO1xuICAgICAgICB0aGlzLnNldChuYW1lLCBzdHlsZXMsIHVybCk7XG4gICAgICAgIHJldHVybiBzdHlsZXM7XG4gICAgfVxufSIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRle1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRlbXBsYXRlU291cmNlIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRlbXBsYXRlU291cmNlKXtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVNvdXJjZSA9IHRlbXBsYXRlU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0VGVtcGxhdGVTb3VyY2UoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVTb3VyY2U7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TWFwLCBMb2dnZXIsIE1ldGhvZH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1RlbXBsYXRlfSBmcm9tIFwiLi90ZW1wbGF0ZS5qc1wiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgVXJsVXRpbHMgfSBmcm9tIFwiLi4vdXRpbC91cmxVdGlscy5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiVGVtcGxhdGVSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlUXVldWVTaXplID0gMDtcblxuICAgICAgICAvKiogQHR5cGUge01ldGhvZH0gKi9cbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVByZWZpeCBcbiAgICAgKi9cbiAgICBzZXRMYW5ndWFnZVByZWZpeChsYW5ndWFnZVByZWZpeCkge1xuICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ID0gbGFuZ3VhZ2VQcmVmaXg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZX0gdGVtcGxhdGUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBzZXQobmFtZSx0ZW1wbGF0ZSx1cmwpe1xuICAgICAgICBpZih1cmwgIT09IHVuZGVmaW5lZCAmJiB1cmwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAuc2V0KG5hbWUsIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50ZW1wbGF0ZU1hcC5zZXQobmFtZSwgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGdldChuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVNYXAuZ2V0KG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGNvbnRhaW5zKG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZU1hcC5jb250YWlucyhuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgZG9uZShjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGVSZWdpc3RyeX0gcmVnaXN0cnkgXG4gICAgICovXG4gICAgZG9DYWxsYmFjayhyZWdpc3RyeSl7XG4gICAgICAgIGlmKHRtby5jYWxsYmFjayAhPT0gbnVsbCAmJiByZWdpc3RyeS5jYWxsYmFjayAhPT0gdW5kZWZpbmVkICAmJiByZWdpc3RyeS50ZW1wbGF0ZVF1ZXVlU2l6ZSA9PT0gcmVnaXN0cnkudGVtcGxhdGVNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBDYWxsYmFjay5jYWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGFzeW5jIGxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIGlmKHRoaXMubGFuZ3VhZ2VQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVybC5wYXRoc0xpc3Quc2V0TGFzdChcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ICsgXCIuXCIgK1xuICAgICAgICAgICAgICAgIHVybC5wYXRoc0xpc3QuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGVtcGxhdGVRdWV1ZVNpemUgKys7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LmdldCh1cmwpO1xuICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgVGVtcGxhdGUodGV4dCksdXJsKTtcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIGFzeW5jIGdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UobmFtZVVybE1hcCkge1xuICAgICAgICBcbiAgICAgICAgaWYoIW5hbWVVcmxNYXAgfHwgbmFtZVVybE1hcC5zaXplKCkgPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvYWRQcm9taXNlcyA9IFtdO1xuICAgICAgICBuYW1lVXJsTWFwLmZvckVhY2goKGtleSwgdmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbnMoa2V5KSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxvYWRQcm9taXNlcy5wdXNoKHRoaXMucHJpdmF0ZUxvYWQoa2V5LCBVcmxVdGlscy5wYXJzZSh2YWx1ZSkpKTtcbiAgICAgICAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwobG9hZFByb21pc2VzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGFzeW5jIHByaXZhdGVMb2FkKG5hbWUsIHVybCkge1xuICAgICAgICBpZih0aGlzLmxhbmd1YWdlUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1cmwucGF0aHNMaXN0LnNldExhc3QoXG4gICAgICAgICAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCArIFwiLlwiICtcbiAgICAgICAgICAgICAgICB1cmwucGF0aHNMaXN0LmdldExhc3QoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBMT0cuaW5mbyhcIkxvYWRpbmcgdGVtcGxhdGUgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmwudG9TdHJpbmcoKSk7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LmdldCh1cmwpO1xuICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUodGV4dCk7XG4gICAgICAgIHRoaXMuc2V0KG5hbWUsIHRlbXBsYXRlLCB1cmwpO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxufSIsImltcG9ydCB7IExvZ2dlciwgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb25maWcsIFR5cGVDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJUZW1wbGF0ZVBvc3RDb25maWdcIik7XG5cbi8qKlxuICogVG8gYmUgYWRkZWQgdG8gbWluZGkgYXMgYSBzaW5nbGV0b24uIFdpbGwgc2NhbiB0aHJvdWdoIGFsbCBjb25maWd1cmVkIGNsYXNzZXMgdGhhdCBoYXZlIGEgVEVNUExBVEVfVVJMIGFuZCBDT01QT05FTlRfTkFNRVxuICogc3RhdGljIGdldHRlciBhbmQgd2lsbCBhc3luY3Jvbm91c2x5IGxvYWQgdGhlbS4gUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiBhbGwgdGVtcGxhdGVzIGFyZSBsb2FkZWRcbiAqL1xuZXhwb3J0IGNsYXNzIFRlbXBsYXRlc0xvYWRlciB7XG5cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGVSZWdpc3RyeX0gdGVtcGxhdGVSZWdpc3RyeSBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZVJlZ2lzdHJ5KSB7XG4gICAgICAgIHRoaXMudGVtcGxhdGVSZWdpc3RyeSA9IHRlbXBsYXRlUmVnaXN0cnk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNYXB9IGNvbmZpZ0VudHJpZXNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBsb2FkKGNvbmZpZ0VudHJpZXMpIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICBjb25maWdFbnRyaWVzLmZvckVhY2goKGtleSwgY29uZmlnRW50cnksIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgaWYoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuVEVNUExBVEVfVVJMICYmIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVNYXAuc2V0KGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FLCBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5URU1QTEFURV9VUkwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpOyBcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVSZWdpc3RyeS5nZXRUZW1wbGF0ZXNMb2FkZWRQcm9taXNlKHRlbXBsYXRlTWFwKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMb2dnZXIsIE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXNSZWdpc3RyeS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiU3R5bGVzTG9hZGVyXCIpO1xuXG4vKipcbiAqIFRvIGJlIGFkZGVkIHRvIG1pbmRpIGFzIGEgc2luZ2xldG9uLiBXaWxsIHNjYW4gdGhyb3VnaCBhbGwgY29uZmlndXJlZCBjbGFzc2VzIHRoYXQgaGF2ZSBhIFNUWUxFU19VUkwgYW5kIENPTVBPTkVOVF9OQU1FXG4gKiBzdGF0aWMgZ2V0dGVyIGFuZCB3aWxsIGFzeW5jcm9ub3VzbHkgbG9hZCB0aGVtLiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIGFsbCBzdHlsZXMgYXJlIGxvYWRlZFxuICovXG5leHBvcnQgY2xhc3MgU3R5bGVzTG9hZGVyIHtcblxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHlsZXNSZWdpc3RyeX0gc3R5bGVzUmVnaXN0cnkgXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc3R5bGVzUmVnaXN0cnkpIHtcbiAgICAgICAgdGhpcy5zdHlsZXNSZWdpc3RyeSA9IHN0eWxlc1JlZ2lzdHJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBjb25maWdFbnRyaWVzXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgbG9hZChjb25maWdFbnRyaWVzKSB7XG4gICAgICAgIGxldCBzdHlsZXNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIGNvbmZpZ0VudHJpZXMuZm9yRWFjaCgoa2V5LCBjb25maWdFbnRyeSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICBpZihjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5TVFlMRVNfVVJMICYmIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FKSB7XG4gICAgICAgICAgICAgICAgc3R5bGVzTWFwLnNldChjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSwgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuU1RZTEVTX1VSTCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7IFxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNSZWdpc3RyeS5nZXRTdHlsZXNMb2FkZWRQcm9taXNlKHN0eWxlc01hcCk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb25maWcsIEluamVjdGlvblBvaW50LCBUeXBlQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgVGVtcGxhdGVzTG9hZGVyIH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzTG9hZGVyIH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNMb2FkZXIuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbXBvbmVudENvbmZpZ1Byb2Nlc3NvclwiKVxuXG4vKipcbiAqIE1pbmRpIGNvbmZpZyBwcm9jZXNzb3Igd2hpY2ggbG9hZHMgYWxsIHRlbXBsYXRlcyBhbmQgc3R5bGVzIGZvciBhbGwgY29uZmlndXJlZCBjb21wb25lbnRzXG4gKiBhbmQgdGhlbiBjYWxscyBhbnkgZXhpc3RpbmcgY29tcG9uZW50TG9hZGVkIGZ1bmN0aW9uIG9uIGVhY2ggY29tcG9uZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRDb25maWdQcm9jZXNzb3Ige1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtUZW1wbGF0ZVJlZ2lzdHJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoVGVtcGxhdGVSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtTdHlsZXNSZWdpc3RyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBwb3N0Q29uZmlnKCl7XG4gICAgICAgIHRoaXMudGVtcGxhdGVzTG9hZGVyID0gbmV3IFRlbXBsYXRlc0xvYWRlcih0aGlzLnRlbXBsYXRlUmVnaXN0cnkpO1xuICAgICAgICB0aGlzLnN0eWxlc0xvYWRlciA9IG5ldyBTdHlsZXNMb2FkZXIodGhpcy5zdHlsZXNSZWdpc3RyeSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtDb25maWd9IGNvbmZpZ1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIHByb2Nlc3NDb25maWcoY29uZmlnLCB1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSB7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgICAgICAgICAgWyBcbiAgICAgICAgICAgICAgICB0aGlzLnRlbXBsYXRlc0xvYWRlci5sb2FkKHVuY29uZmlndXJlZENvbmZpZ0VudHJpZXMpLCBcbiAgICAgICAgICAgICAgICB0aGlzLnN0eWxlc0xvYWRlci5sb2FkKHVuY29uZmlndXJlZENvbmZpZ0VudHJpZXMpIFxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuICAgIH1cblxufSIsImltcG9ydCB7IE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgVW5pcXVlSWRSZWdpc3RyeSB7XG5cbiAgICBpZEF0dHJpYnV0ZVdpdGhTdWZmaXggKGlkKSB7XG4gICAgICAgIGlmKGlkTmFtZXMuY29udGFpbnMoaWQpKSB7XG4gICAgICAgICAgICB2YXIgbnVtYmVyID0gaWROYW1lcy5nZXQoaWQpO1xuICAgICAgICAgICAgaWROYW1lcy5zZXQoaWQsbnVtYmVyKzEpO1xuICAgICAgICAgICAgcmV0dXJuIGlkICsgXCItXCIgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWROYW1lcy5zZXQoaWQsMSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbn1cblxudmFyIGlkTmFtZXMgPSBuZXcgTWFwKCk7IiwiZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdHRyaWJ1dGUpIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGUgPSBhdHRyaWJ1dGU7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGUudmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS5uYW1lO1xuICAgIH1cblxuICAgIGdldCBuYW1lc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS5uYW1lO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuLyoqIEB0eXBlIHtNYXB9ICovXG5sZXQgY29uZmlndXJlZEZ1bmN0aW9uTWFwID0gbmV3IE1hcCgpO1xuXG5leHBvcnQgY2xhc3MgQ29uZmlndXJlZEZ1bmN0aW9uIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRoZUZ1bmN0aW9uXG4gICAgICovXG4gICAgc3RhdGljIGNvbmZpZ3VyZShuYW1lLCB0aGVGdW5jdGlvbikge1xuICAgICAgICBjb25maWd1cmVkRnVuY3Rpb25NYXAuc2V0KG5hbWUsIHRoZUZ1bmN0aW9uKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZXhlY3V0ZShuYW1lLCBwYXJhbWV0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyZWRGdW5jdGlvbk1hcC5nZXQobmFtZSkuY2FsbChudWxsLCBwYXJhbWV0ZXIpO1xuICAgIH1cblxufSIsImV4cG9ydCBjbGFzcyBNYXBwZWRIdG1sRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgZ2V0IG1hcHBlZEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGVsZW1lbnQge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHNldCBtYXBwZWRFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBDb250YWluZXJFbGVtZW50IH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTWFwcGVkSHRtbEVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9tYXBwZWRIdG1sRWxlbWVudFwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRWxlbWVudFV0aWxzXCIpO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudFV0aWxzIHtcblxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHthbnl9IHZhbHVlIFxuICAgICAqIEBwYXJhbSB7TWFwcGVkSHRtbEVsZW1lbnR9IHBhcmVudCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlQ29udGFpbmVyRWxlbWVudCh2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFhtbEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBFbGVtZW50VXRpbHMuY3JlYXRlRnJvbVhtbEVsZW1lbnQodmFsdWUsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIENvbnRhaW5lckVsZW1lbnQuY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKENvbnRhaW5lckVsZW1lbnQuaXNVSUVsZW1lbnQodmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgTE9HLmVycm9yKFwiVW5yZWNvZ25pemVkIHZhbHVlIGZvciBFbGVtZW50XCIpO1xuICAgICAgICBMT0cuZXJyb3IodmFsdWUpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYnJvd3NlciBFbGVtZW50IGZyb20gdGhlIFhtbEVsZW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0geG1sRWxlbWVudFxuICAgICAqIEBwYXJhbSB7TWFwcGVkSHRtbEVsZW1lbnR9IHBhcmVudEVsZW1lbnRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlRnJvbVhtbEVsZW1lbnQoeG1sRWxlbWVudCwgcGFyZW50RWxlbWVudCkge1xuICAgICAgICBsZXQgZWxlbWVudCA9IG51bGw7XG4gICAgICAgIGlmICh4bWxFbGVtZW50Lm5hbWVzcGFjZSkge1xuICAgICAgICAgICAgZWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuY3JlYXRlRWxlbWVudE5TKHhtbEVsZW1lbnQubmFtZXNwYWNlVXJpLCB4bWxFbGVtZW50LmZ1bGxOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmNyZWF0ZUVsZW1lbnQoeG1sRWxlbWVudC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFyZW50RWxlbWVudCAmJiBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuYXBwZW5kQ2hpbGQocGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50LCBlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICB4bWxFbGVtZW50LmF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cmlidXRlS2V5LCBhdHRyaWJ1dGUpID0+IHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuc2V0QXR0cmlidXRlKGVsZW1lbnQsIGF0dHJpYnV0ZUtleSwgYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IE1hcCwgTG9nZ2VyLCBMaXN0IH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb250YWluZXJFbGVtZW50IH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgQXR0cmlidXRlIH0gZnJvbSBcIi4vYXR0cmlidXRlLmpzXCI7XG5pbXBvcnQgeyBDb25maWd1cmVkRnVuY3Rpb24gfSBmcm9tIFwiLi4vY29uZmlnL2NvbmZpZ3VyZWRGdW5jdGlvbi5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudFV0aWxzIH0gZnJvbSBcIi4uL3V0aWwvZWxlbWVudFV0aWxzLmpzXCI7XG5pbXBvcnQgeyBNYXBwZWRIdG1sRWxlbWVudCB9IGZyb20gXCIuL21hcHBlZEh0bWxFbGVtZW50LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJCYXNlRWxlbWVudFwiKTtcblxuLyoqXG4gKiBBIGJhc2UgY2xhc3MgZm9yIGVuY2xvc2luZyBhbiBIVE1MRWxlbWVudFxuICovXG5leHBvcnQgY2xhc3MgQmFzZUVsZW1lbnQgZXh0ZW5kcyBNYXBwZWRIdG1sRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fHN0cmluZ3xhbnl9IHZhbHVlIFZhbHVlIHRvIGJlIGNvbnZlcnRlZCB0byBDb250YWluZXIgVUkgRWxlbWVudCAoSFRNTEVsZW1lbnQgaW4gdGhlIGNhc2Ugb2YgV2ViIEJyb3dzZXIpXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IHRoZSBwYXJlbnQgQmFzZUVsZW1lbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbnVsbDtcbiAgICAgICAgdGhpcy5ldmVudHNBdHRhY2hlZCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQgPSBFbGVtZW50VXRpbHMuY3JlYXRlQ29udGFpbmVyRWxlbWVudCh2YWx1ZSwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBsb2FkQXR0cmlidXRlcygpIHtcbiAgICAgICAgaWYgKHN1cGVyLm1hcHBlZEVsZW1lbnQuYXR0cmlidXRlcyA9PT0gbnVsbCB8fCBzdXBlci5tYXBwZWRFbGVtZW50LmF0dHJpYnV0ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYXR0cmlidXRlTWFwID09PSBudWxsIHx8IHRoaXMuYXR0cmlidXRlTWFwID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdXBlci5tYXBwZWRFbGVtZW50LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcC5zZXQoc3VwZXIubWFwcGVkRWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5hbWUsbmV3IEF0dHJpYnV0ZShzdXBlci5tYXBwZWRFbGVtZW50LmF0dHJpYnV0ZXNbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxpc3RlblRvKGV2ZW50VHlwZSwgbGlzdGVuZXIsIGNhcHR1cmUpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHN1cGVyLm1hcHBlZEVsZW1lbnQsIGV2ZW50VHlwZSwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBsaXN0ZW5lci5jYWxsKENvbmZpZ3VyZWRGdW5jdGlvbi5leGVjdXRlKFwid3JhcEV2ZW50XCIsIGV2ZW50KSk7XG4gICAgICAgIH0sIGNhcHR1cmUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgZnVsbE5hbWUoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50LnRhZ05hbWU7XG4gICAgfVxuXG4gICAgZ2V0IHRvcCgpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm1hcHBlZEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICAgIH1cblxuICAgIGdldCBib3R0b20oKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbTtcbiAgICB9XG5cbiAgICBnZXQgbGVmdCgpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm1hcHBlZEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdDtcbiAgICB9XG5cbiAgICBnZXQgcmlnaHQoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0O1xuICAgIH1cblxuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm1hcHBlZEVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm1hcHBlZEVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIGdldCBhdHRyaWJ1dGVzKCkge1xuICAgICAgICB0aGlzLmxvYWRBdHRyaWJ1dGVzKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZU1hcDtcbiAgICB9XG5cbiAgICBzZXRBdHRyaWJ1dGVWYWx1ZShrZXksdmFsdWUpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5zZXRBdHRyaWJ1dGUoc3VwZXIubWFwcGVkRWxlbWVudCwga2V5LHZhbHVlKTtcbiAgICB9XG5cbiAgICBnZXRBdHRyaWJ1dGVWYWx1ZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckVsZW1lbnQuZ2V0QXR0cmlidXRlKHN1cGVyLm1hcHBlZEVsZW1lbnQsIGtleSk7XG4gICAgfVxuXG4gICAgY29udGFpbnNBdHRyaWJ1dGUoa2V5KSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50Lmhhc0F0dHJpYnV0ZShrZXkpO1xuICAgIH1cblxuICAgIHJlbW92ZUF0dHJpYnV0ZShrZXkpIHtcbiAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICB9XG5cbiAgICBzZXRTdHlsZShrZXksdmFsdWUpIHtcbiAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5zdHlsZVtrZXldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0U3R5bGUoa2V5KSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50LnN0eWxlW2tleV07XG4gICAgfVxuXG4gICAgcmVtb3ZlU3R5bGUoa2V5KSB7XG4gICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQuc3R5bGVba2V5XSA9IG51bGw7XG4gICAgfVxuXG4gICAgc2V0KGlucHV0KSB7XG4gICAgICAgIGlmKCFzdXBlci5tYXBwZWRFbGVtZW50LnBhcmVudE5vZGUpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlRoZSBlbGVtZW50IGhhcyBubyBwYXJlbnQsIGNhbiBub3Qgc3dhcCBpdCBmb3IgdmFsdWVcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQubWFwcGVkRWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dC5tYXBwZWRFbGVtZW50LCBzdXBlci5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBzdXBlci5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQgPSBpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiBpbnB1dCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBzdXBlci5tYXBwZWRFbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKENvbnRhaW5lckVsZW1lbnQuY3JlYXRlVGV4dE5vZGUoaW5wdXQpLCBzdXBlci5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQsIHN1cGVyLm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dCwgc3VwZXIubWFwcGVkRWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc01vdW50ZWQoKSB7XG4gICAgICAgIGlmKHN1cGVyLm1hcHBlZEVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgaWYgKHN1cGVyLm1hcHBlZEVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN1cGVyLm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHdoaWxlIChzdXBlci5tYXBwZWRFbGVtZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQucmVtb3ZlQ2hpbGQoc3VwZXIubWFwcGVkRWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldENoaWxkKGlucHV0KSB7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChpbnB1dCk7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXQubWFwcGVkRWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0ICYmIGlucHV0LnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBzdXBlci5tYXBwZWRFbGVtZW50LmFwcGVuZENoaWxkKGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5hcHBlbmRDaGlsZChDb250YWluZXJFbGVtZW50LmNyZWF0ZVRleHROb2RlKGlucHV0KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYoc3VwZXIubWFwcGVkRWxlbWVudC5maXJzdENoaWxkID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gdW5kZWZpbmVkICYmIGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGlucHV0Lm1hcHBlZEVsZW1lbnQsIHN1cGVyLm1hcHBlZEVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0ICYmIGlucHV0LnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBzdXBlci5tYXBwZWRFbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBzdXBlci5tYXBwZWRFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5pbnNlcnRCZWZvcmUoQ29udGFpbmVyRWxlbWVudC5jcmVhdGVUZXh0Tm9kZShpbnB1dCksIHN1cGVyLm1hcHBlZEVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsIHN1cGVyLm1hcHBlZEVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsIHN1cGVyLm1hcHBlZEVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnRcIjtcblxuLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb21wb25lbnRJbmRleCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSByb290RWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge01hcH0gZWxlbWVudE1hcCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb21wb25lbnRJbmRleCwgcm9vdEVsZW1lbnQsIGVsZW1lbnRNYXApIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGV4O1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAgPSBlbGVtZW50TWFwO1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKCkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgZ2V0KGlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc2V0IChpZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuc2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgY2xlYXJDaGlsZHJlbihpZCl7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLmNsZWFyKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc2V0Q2hpbGQgKGlkLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5zZXRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgYWRkQ2hpbGQgKGlkLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5hZGRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgcHJlcGVuZENoaWxkIChpZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkucHJlcGVuZENoaWxkKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQWJzdHJhY3RJbnB1dEVsZW1lbnRcIik7XG5cbi8qKlxuICogU2hhcmVkIHByb3BlcnRpZXMgb2YgaW5wdXQgZWxlbWVudHNcbiAqL1xuZXhwb3J0IGNsYXNzIEFic3RyYWN0SW5wdXRFbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIodmFsdWUsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmFsdWUgb2YgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldCBuYW1lKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmFsdWUgZ2l2ZW4gYW55IHByb2Nlc3NpbmcgcnVsZXNcbiAgICAgKi9cbiAgICBnZXQgdmFsdWUoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFja2luZ1ZhbHVlO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgSW5wdXRFdmVudCgnY2hhbmdlJykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNvdXJjZSB2YWx1ZVxuICAgICAqL1xuICAgIGdldCBiYWNraW5nVmFsdWUoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9XG5cbiAgICBmb2N1cygpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgc2VsZWN0QWxsKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2VsZWN0KCk7XG4gICAgfVxuXG4gICAgZW5hYmxlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBkaXNhYmxlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0SW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFJhZGlvSW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBzZXQgY2hlY2tlZCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaXNDaGVja2VkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuY2hlY2tlZDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzQ2hlY2tlZCgpO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9ICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gXCJ0cnVlXCIpO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0SW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIENoZWNrYm94SW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBzZXQgY2hlY2tlZCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaXNDaGVja2VkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuY2hlY2tlZDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzQ2hlY2tlZCgpO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9ICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gXCJ0cnVlXCIpO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dElucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtBYnN0cmFjdElucHV0RWxlbWVudH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHRhcmVhSW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBnZXQgaW5uZXJIVE1MKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIHNldCBpbm5lckhUTUwodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgc3VwZXIuYWRkQ2hpbGQoaW5wdXQpO1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgcHJlcGVuZENoaWxkKGlucHV0KSB7XG4gICAgICAgIHN1cGVyLnByZXBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmlubmVySFRNTDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBYbWxDZGF0YSB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IENvbnRhaW5lckVsZW1lbnQgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0bm9kZUVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sQ2RhdGF9IHZhbHVlIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIGlmKHZhbHVlIGluc3RhbmNlb2YgWG1sQ2RhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuY3JlYXRlRnJvbVhtbENkYXRhKHZhbHVlLCBwYXJlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7WG1sQ2RhdGF9IGNkYXRhRWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRFbGVtZW50IFxuICAgICAqL1xuICAgIGNyZWF0ZUZyb21YbWxDZGF0YShjZGF0YUVsZW1lbnQsIHBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjZGF0YUVsZW1lbnQudmFsdWUpO1xuICAgICAgICBpZihwYXJlbnRFbGVtZW50ICE9PSBudWxsICYmIHBhcmVudEVsZW1lbnQubWFwcGVkRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgQ29udGFpbmVyRWxlbWVudC5hcHBlbmRDaGlsZChwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG4gICAgZ2V0IG1hcHBlZEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBTaW1wbGVFbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBnZXQgaW5uZXJIVE1MKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIHNldCBpbm5lckhUTUwodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBGb3JtRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmFsdWUgb2YgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldCBuYW1lKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdmFsdWU7XG4gICAgfVxuXG4gICAgc3VibWl0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnN1Ym1pdCgpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVmlkZW9FbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gdmFsdWUgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIGdldCBtYXBwZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIHBsYXkoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5wbGF5KCk7XG4gICAgfVxuXG4gICAgbXV0ZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm11dGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1bm11dGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5tdXRlZCA9IGZhbHNlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxDZGF0YSxYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgUmFkaW9JbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9yYWRpb0lucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQ2hlY2tib3hJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9jaGVja2JveElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgVGV4dElucHV0RWxlbWVudCB9IGZyb20gXCIuL3RleHRJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFRleHRhcmVhSW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vdGV4dGFyZWFJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFRleHRub2RlRWxlbWVudCB9IGZyb20gXCIuL3RleHRub2RlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgU2ltcGxlRWxlbWVudCB9IGZyb20gXCIuL3NpbXBsZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEZvcm1FbGVtZW50IH0gZnJvbSBcIi4vZm9ybUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFZpZGVvRWxlbWVudCB9IGZyb20gXCIuL3ZpZGVvRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudE1hcHBlciB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7YW55fSBpbnB1dCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgc3RhdGljIG1hcChpbnB1dCwgcGFyZW50KSB7XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1JhZGlvKGlucHV0KSl7ICAgICByZXR1cm4gbmV3IFJhZGlvSW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb0NoZWNrYm94KGlucHV0KSl7ICByZXR1cm4gbmV3IENoZWNrYm94SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1N1Ym1pdChpbnB1dCkpeyAgICByZXR1cm4gbmV3IFRleHRJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvRm9ybShpbnB1dCkpeyAgICAgIHJldHVybiBuZXcgRm9ybUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVGV4dGFyZWEoaW5wdXQpKXsgIHJldHVybiBuZXcgVGV4dGFyZWFJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVGV4dChpbnB1dCkpeyAgICAgIHJldHVybiBuZXcgVGV4dElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9WaWRlbyhpbnB1dCkpeyAgICAgcmV0dXJuIG5ldyBWaWRlb0VsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVGV4dG5vZGUoaW5wdXQpKXsgIHJldHVybiBuZXcgVGV4dG5vZGVFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1NpbXBsZShpbnB1dCkpeyAgICByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgY29uc29sZS5sb2coXCJNYXBwaW5nIHRvIHNpbXBsZSBieSBkZWZhdWx0IFwiICsgaW5wdXQpO1xuICAgICAgICByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1JhZGlvKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJyYWRpb1wiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInJhZGlvXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9DaGVja2JveChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwiY2hlY2tib3hcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJjaGVja2JveFwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvU3VibWl0KGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJzdWJtaXRcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJzdWJtaXRcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb0Zvcm0oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImZvcm1cIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1RleHQoaW5wdXQpe1xuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJ0ZXh0XCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcIm51bWJlclwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJlbWFpbFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJkYXRlXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIpIHtcbiAgICAgICAgICAgIGlmKCFpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRleHRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJudW1iZXJcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcImVtYWlsXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiZGF0ZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dG5vZGUoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgTm9kZSAmJiBpbnB1dC5ub2RlVHlwZSA9PT0gXCJURVhUX05PREVcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbENkYXRhKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVmlkZW8oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJ2aWRlb1wiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dGFyZWEoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJ0ZXh0YXJlYVwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvU2ltcGxlKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgRWxlbWVudE1hcHBlciB9IGZyb20gXCIuLi9lbGVtZW50L2VsZW1lbnRNYXBwZXIuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnQuanNcIjtcblxuLyoqXG4gKiBDb2xsZWN0cyBpbmZvcm1hdGlvbiB3aGVuIGVsZW1lbnRzIGFyZSBjcmVhdGVkIGFuZCBmaW5kcyB0aGUgcm9vdCBlbGVtZW50LCBjcmVhdGVzIG1hcCBvZiBlbGVtZW50cyBcbiAqL1xuZXhwb3J0IGNsYXNzIEVsZW1lbnRSZWdpc3RyYXRvciB7XG5cbiAgICBjb25zdHJ1Y3Rvcih1bmlxdWVJZFJlZ2lzdHJ5LCBjb21wb25lbnRJbmRleCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kZXg7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IHVuaXF1ZUlkUmVnaXN0cnk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50TWFwID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGdldEVsZW1lbnRNYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGlzdGVucyB0byBlbGVtZW50cyBiZWluZyBjcmVhdGVkLCBhbmQgdGFrZXMgaW5uIHRoZSBjcmVhdGVkIFhtbEVsZW1lbnQgYW5kIGl0cyBwYXJlbnQgWG1sRWxlbWVudFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0geG1sRWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRXcmFwcGVyIFxuICAgICAqL1xuICAgIGVsZW1lbnRDcmVhdGVkICh4bWxFbGVtZW50LCBwYXJlbnRXcmFwcGVyKSB7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBFbGVtZW50TWFwcGVyLm1hcCh4bWxFbGVtZW50LCBwYXJlbnRXcmFwcGVyKTtcblxuICAgICAgICB0aGlzLmFkZFRvRWxlbWVudElkTWFwKGVsZW1lbnQpO1xuXG4gICAgICAgIGlmKHRoaXMucm9vdEVsZW1lbnQgPT09IG51bGwgJiYgZWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG5cbiAgICBhZGRUb0VsZW1lbnRJZE1hcChlbGVtZW50KSB7XG4gICAgICAgIGlmKGVsZW1lbnQgPT09IG51bGwgfHwgZWxlbWVudCA9PT0gdW5kZWZpbmVkIHx8ICEoZWxlbWVudCBpbnN0YW5jZW9mIEJhc2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpZCA9IG51bGw7XG4gICAgICAgIGlmKGVsZW1lbnQuY29udGFpbnNBdHRyaWJ1dGUoXCJpZFwiKSkge1xuICAgICAgICAgICAgaWQgPSBlbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwiaWRcIik7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiaWRcIix0aGlzLnVuaXF1ZUlkUmVnaXN0cnkuaWRBdHRyaWJ1dGVXaXRoU3VmZml4KGlkKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihpZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50TWFwLnNldChpZCxlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn0iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IENvbmZpZ3VyZWRGdW5jdGlvbiB9IGZyb20gXCIuLi9jb25maWcvY29uZmlndXJlZEZ1bmN0aW9uLmpzXCI7XG5pbXBvcnQgeyBTaW1wbGVFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvc2ltcGxlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnR7XG5cbiAgICBjb25zdHJ1Y3RvcihldmVudCl7XG4gICAgICAgIHRoaXMuZXZlbnQgPSBldmVudDtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQudHlwZS50b0xvd2VyQ2FzZSgpID09IFwiZHJhZ3N0YXJ0XCIpe1xuICAgICAgICAgICAgdGhpcy5ldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsIG51bGwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RvcFByb3BhZ2F0aW9uKCl7XG4gICAgICAgIHRoaXMuZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgcHJldmVudERlZmF1bHQoKXtcbiAgICAgICAgdGhpcy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBldmVudCBhbmQgdGhlIGVkZ2UgeCBjb29yZGluYXRlIG9mIHRoZSBjb250YWluaW5nIG9iamVjdFxuICAgICAqL1xuICAgIGdldCBvZmZzZXRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Lm9mZnNldFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGV2ZW50IGFuZCB0aGUgZWRnZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNvbnRhaW5pbmcgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0IG9mZnNldFkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQub2Zmc2V0WTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbW91c2UgeCBjb29yZGluYXRlIG9mIHRoZSBldmVudCByZWxhdGl2ZSB0byB0aGUgY2xpZW50IHdpbmRvdyB2aWV3XG4gICAgICovXG4gICAgZ2V0IGNsaWVudFgoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQuY2xpZW50WDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbW91c2UgeSBjb29yZGluYXRlIG9mIHRoZSBldmVudCByZWxhdGl2ZSB0byB0aGUgY2xpZW50IHdpbmRvdyB2aWV3XG4gICAgICovXG4gICAgZ2V0IGNsaWVudFkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQuY2xpZW50WTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7U2ltcGxlRWxlbWVudH1cbiAgICAgKi9cbiAgICBnZXQgdGFyZ2V0KCl7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50ICYmIHRoaXMuZXZlbnQudGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gQ29uZmlndXJlZEZ1bmN0aW9uLmV4ZWN1dGUoXCJtYXBFbGVtZW50XCIsIHRoaXMuZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtTaW1wbGVFbGVtZW50fVxuICAgICAqL1xuICAgIGdldCByZWxhdGVkVGFyZ2V0KCl7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50ICYmIHRoaXMuZXZlbnQucmVsYXRlZFRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIENvbmZpZ3VyZWRGdW5jdGlvbi5leGVjdXRlKFwibWFwRWxlbWVudFwiLCB0aGlzLmV2ZW50LnJlbGF0ZWRUYXJnZXQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgIGdldFJlbGF0ZWRUYXJnZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSl7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50LnJlbGF0ZWRUYXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBDb25maWd1cmVkRnVuY3Rpb24uZXhlY3V0ZShcIm1hcEVsZW1lbnRcIiwgdGhpcy5ldmVudC5yZWxhdGVkVGFyZ2V0KS5nZXRBdHRyaWJ1dGVWYWx1ZShhdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBnZXQgdGFyZ2V0VmFsdWUoKXtcbiAgICAgICAgaWYodGhpcy50YXJnZXQpIHsgXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50YXJnZXQudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IGtleUNvZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmtleUNvZGU7XG4gICAgfVxuXG4gICAgaXNLZXlDb2RlKGNvZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQua2V5Q29kZSA9PT0gY29kZTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IENvbnRhaW5lckVsZW1lbnQsIENvbnRhaW5lcldpbmRvdyB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uL2NvbXBvbmVudC9jb21wb25lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEV2ZW50IH0gZnJvbSBcIi4uL2V2ZW50L2V2ZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBDYW52YXNSb290IHtcblxuICAgIHN0YXRpYyBzaG91bGRTd2FsbG93TmV4dEZvY3VzRXNjYXBlID0gZmFsc2U7XG5cbiAgICBzdGF0aWMgbW91c2VEb3duRWxlbWVudCA9IG51bGw7XG5cbiAgICBzdGF0aWMgZm9jdXNFc2NhcGVFdmVudFJlcXVlc3RlZCA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIFxuICAgICAqIEBwYXJhbSB7Q29tcG9uZW50fSBjb21wb25lbnQgXG4gICAgICovXG4gICAgc3RhdGljIHJlcGxhY2VDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xuICAgICAgICBjb25zdCBib2R5RWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBib2R5RWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjb21wb25lbnQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCwgYm9keUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0NvbXBvbmVudH0gY29tcG9uZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyBzZXRDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xuICAgICAgICBjb25zdCBib2R5RWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBib2R5RWxlbWVudC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIGJvZHlFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtDb21wb25lbnR9IGNvbXBvbmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgYWRkQ2hpbGRDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xuICAgICAgICBjb25zdCBib2R5RWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBib2R5RWxlbWVudC5hcHBlbmRDaGlsZChjb21wb25lbnQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIFxuICAgICAqIEBwYXJhbSB7Q29tcG9uZW50fSBjb21wb25lbnQgXG4gICAgICovXG4gICAgc3RhdGljIGFkZENoaWxkRWxlbWVudChpZCwgZWxlbWVudCkge1xuICAgICAgICBjb25zdCBib2R5RWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBib2R5RWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVtb3ZlRWxlbWVudChpZCkge1xuICAgICAgICBDb250YWluZXJFbGVtZW50LnJlbW92ZUVsZW1lbnQoaWQpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XG4gICAgICovXG4gICAgc3RhdGljIGFkZEhlYWRlckVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBDb250YWluZXJFbGVtZW50LmFwcGVuZFJvb3RNZXRhQ2hpbGQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKiogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxuICAgICAqL1xuICAgIHN0YXRpYyBhZGRCb2R5RWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQuYXBwZW5kUm9vdFVpQ2hpbGQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKiogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxuICAgICAqL1xuICAgIHN0YXRpYyBwcmVwZW5kSGVhZGVyRWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQucHJlcGVuZEVsZW1lbnQoXCJoZWFkXCIsIGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgcHJlcGVuZEJvZHlFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5wcmVwZW5kRWxlbWVudChcImJvZHlcIiwgZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKiogXG4gICAgICogUmVtZW1iZXIgdG8gc3dhbGxvd0ZvY3VzRXNjYXBlIGZvciBpbml0aWFsIHRyaWdnZXJpbmcgZXZlbnRzXG4gICAgICogd2hpY2ggYXJlIGV4dGVybmFsIHRvIGZvY3VzUm9vdFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWV0aG9kfSBsaXN0ZW5lclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGZvY3VzUm9vdFxuICAgICAqL1xuICAgIHN0YXRpYyBsaXN0ZW5Ub0ZvY3VzRXNjYXBlKGxpc3RlbmVyLCBmb2N1c1Jvb3QpIHtcbiAgICAgICAgXG4gICAgICAgIC8qIEhhY2s6IEJlY2F1c2Ugd2UgZG9uJ3QgaGF2ZSBhIHdheSBvZiBrbm93aW5nIGluIHRoZSBjbGljayBldmVudCB3aGljaCBlbGVtZW50IHdhcyBpbiBmb2N1cyB3aGVuIG1vdXNlZG93biBvY2N1cmVkICovXG4gICAgICAgIGlmICghQ2FudmFzUm9vdC5mb2N1c0VzY2FwZUV2ZW50UmVxdWVzdGVkKSB7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVNb3VzZURvd25FbGVtZW50ID0gbmV3IE1ldGhvZChudWxsLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBDYW52YXNSb290Lm1vdXNlRG93bkVsZW1lbnQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIENvbnRhaW5lcldpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHVwZGF0ZU1vdXNlRG93bkVsZW1lbnQsIEV2ZW50KTtcbiAgICAgICAgICAgIENhbnZhc1Jvb3QuZm9jdXNFc2NhcGVFdmVudFJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjYWxsSWZOb3RDb250YWlucyA9IG5ldyBNZXRob2QobnVsbCwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoIUNhbnZhc1Jvb3QubW91c2VEb3duRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIENhbnZhc1Jvb3QubW91c2VEb3duRWxlbWVudCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChDb250YWluZXJFbGVtZW50LmNvbnRhaW5zKGZvY3VzUm9vdC5lbGVtZW50LCBDYW52YXNSb290Lm1vdXNlRG93bkVsZW1lbnQuZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoQ2FudmFzUm9vdC5zaG91bGRTd2FsbG93TmV4dEZvY3VzRXNjYXBlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGlzdGVuZXIuY2FsbChldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICBDb250YWluZXJXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxJZk5vdENvbnRhaW5zLCBFdmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2hlbiBhbiBlbGVtZW50IGlzIGNvbmdpZ3VyZWQgdG8gYmUgaGlkZGVuIGJ5IEZvY3VzRXNjYXBlLFxuICAgICAqIGFuZCB3YXMgc2hvd24gYnkgYW4gZXZlbnQgdHJpZ2dlcmVkIGZyb20gYW4gZXh0ZXJuYWwgZWxlbWVudCxcbiAgICAgKiB0aGVuIEZvY3VzRXNjYXBlIGdldHMgdHJpZ2dlcmVkIHJpZ2h0IGFmdGVyIHRoZSBlbGVtZW50IGlzXG4gICAgICogc2hvd24uIFRoZXJlZm9yZSB0aGlzIGZ1bmN0aW9uIGFsbG93cyB0aGlzIGV2ZW50IHRvIGJlIFxuICAgICAqIHN3YWxsb3dlZCB0byBhdm9pZCB0aGlzIGJlaGF2aW9yXG4gICAgICogXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGZvck1pbGxpc2Vjb25kcyBcbiAgICAgKi9cbiAgICBzdGF0aWMgc3dhbGxvd0ZvY3VzRXNjYXBlKGZvck1pbGxpc2Vjb25kcykge1xuICAgICAgICBDYW52YXNSb290LnNob3VsZFN3YWxsb3dOZXh0Rm9jdXNFc2NhcGUgPSB0cnVlO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIENhbnZhc1Jvb3Quc2hvdWxkU3dhbGxvd05leHRGb2N1c0VzY2FwZSA9IGZhbHNlO1xuICAgICAgICB9LCBmb3JNaWxsaXNlY29uZHMpO1xuICAgIH1cbn0iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtFbGVtZW50TWFwcGVyfSBmcm9tIFwiLi4vZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBIVE1Me1xuXG4gICAgc3RhdGljIGN1c3RvbShlbGVtZW50TmFtZSl7XG4gICAgICAgIHZhciB4bWxFbGVtZW50ID0gbmV3IFhtbEVsZW1lbnQoZWxlbWVudE5hbWUpO1xuICAgICAgICByZXR1cm4gRWxlbWVudE1hcHBlci5tYXAoeG1sRWxlbWVudCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFwcGx5U3R5bGVzKGVsZW1lbnQsIGNsYXNzVmFsdWUsIHN0eWxlVmFsdWUpe1xuICAgICAgICBpZihjbGFzc1ZhbHVlKXtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJjbGFzc1wiLCBjbGFzc1ZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihzdHlsZVZhbHVlKXtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJzdHlsZVwiLCBzdHlsZVZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBhKHZhbHVlLCBocmVmLCBjbGFzc1ZhbHVlLCBzdHlsZVZhbHVlKXtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIVE1MLmN1c3RvbShcImFcIik7XG4gICAgICAgIGVsZW1lbnQuYWRkQ2hpbGQodmFsdWUpO1xuICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiaHJlZlwiLGhyZWYpO1xuICAgICAgICBIVE1MLmFwcGx5U3R5bGVzKGVsZW1lbnQsIGNsYXNzVmFsdWUsIHN0eWxlVmFsdWUpO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG5cbiAgICBzdGF0aWMgaSh2YWx1ZSwgY2xhc3NWYWx1ZSwgc3R5bGVWYWx1ZSl7XG4gICAgICAgIHZhciBlbGVtZW50ID0gSFRNTC5jdXN0b20oXCJpXCIpO1xuICAgICAgICBlbGVtZW50LmFkZENoaWxkKHZhbHVlKTtcbiAgICAgICAgSFRNTC5hcHBseVN0eWxlcyhlbGVtZW50LCBjbGFzc1ZhbHVlLCBzdHlsZVZhbHVlKTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgTWFwLCBMaXN0LCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENhbnZhc1Jvb3QgfSBmcm9tIFwiLi9jYW52YXNSb290LmpzXCI7XG5pbXBvcnQgeyBIVE1MIH0gZnJvbSBcIi4uL2h0bWwvaHRtbC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgVGV4dG5vZGVFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvdGV4dG5vZGVFbGVtZW50LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDYW52YXNTdHlsZXNcIik7XG5cbmNvbnN0IHN0eWxlcyA9IG5ldyBNYXAoKTtcbmNvbnN0IHN0eWxlT3duZXJzID0gbmV3IE1hcCgpO1xuY29uc3QgZW5hYmxlZFN0eWxlcyA9IG5ldyBMaXN0KCk7XG5cbmV4cG9ydCBjbGFzcyBDYW52YXNTdHlsZXMge1xuXG4gICAgc3RhdGljIHNldFN0eWxlKG5hbWUsIHNvdXJjZSkge1xuICAgICAgICBpZihzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHN0eWxlcy5nZXQobmFtZSkuc2V0Q2hpbGQobmV3IFRleHRub2RlRWxlbWVudChzb3VyY2UuZ2V0U3R5bGVzU291cmNlKCkpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8qKiBAdHlwZSB7QmFzZUVsZW1lbnR9ICovXG4gICAgICAgICAgICBsZXQgc3R5bGVFbGVtZW50ID0gSFRNTC5jdXN0b20oXCJzdHlsZVwiKTtcbiAgICAgICAgICAgIHN0eWxlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIsbmFtZSk7XG4gICAgICAgICAgICBzdHlsZUVsZW1lbnQuc2V0Q2hpbGQobmV3IFRleHRub2RlRWxlbWVudChzb3VyY2UuZ2V0U3R5bGVzU291cmNlKCkpKTtcbiAgICAgICAgICAgIHN0eWxlcy5zZXQobmFtZSwgc3R5bGVFbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyByZW1vdmVTdHlsZShuYW1lKSB7XG4gICAgICAgIGlmKGVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMucmVtb3ZlKG5hbWUpO1xuICAgICAgICAgICAgQ2FudmFzUm9vdC5yZW1vdmVFbGVtZW50KG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgc3R5bGVzLnJlbW92ZShuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBkaXNhYmxlU3R5bGUobmFtZSwgb3duZXJJZCA9IDApIHtcbiAgICAgICAgQ2FudmFzU3R5bGVzLnJlbW92ZVN0eWxlT3duZXIobmFtZSwgb3duZXJJZCk7XG4gICAgICAgIGlmKENhbnZhc1N0eWxlcy5oYXNTdHlsZU93bmVyKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoIXN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgTE9HLmVycm9yKFwiU3R5bGUgZG9lcyBub3QgZXhpc3Q6IFwiICsgbmFtZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5yZW1vdmUobmFtZSk7XG4gICAgICAgICAgICBDYW52YXNSb290LnJlbW92ZUVsZW1lbnQobmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZW5hYmxlU3R5bGUobmFtZSwgb3duZXJJZCA9IDApIHtcbiAgICAgICAgQ2FudmFzU3R5bGVzLmFkZFN0eWxlT3duZXIobmFtZSwgb3duZXJJZCk7XG4gICAgICAgIGlmKCFzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihcIlN0eWxlIGRvZXMgbm90IGV4aXN0OiBcIiArIG5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLmFkZChuYW1lKTtcbiAgICAgICAgICAgIENhbnZhc1Jvb3QuYWRkSGVhZGVyRWxlbWVudChzdHlsZXMuZ2V0KG5hbWUpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBhZGRTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpIHtcbiAgICAgICAgaWYoIXN0eWxlT3duZXJzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBzdHlsZU93bmVycy5zZXQobmFtZSwgbmV3IExpc3QoKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoIXN0eWxlT3duZXJzLmdldChuYW1lKS5jb250YWlucyhvd25lcklkKSkge1xuICAgICAgICAgICAgc3R5bGVPd25lcnMuZ2V0KG5hbWUpLmFkZChvd25lcklkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyByZW1vdmVTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpIHtcbiAgICAgICAgaWYoIXN0eWxlT3duZXJzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3R5bGVPd25lcnMuZ2V0KG5hbWUpLnJlbW92ZShvd25lcklkKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgaGFzU3R5bGVPd25lcihuYW1lKSB7XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHlsZU93bmVycy5nZXQobmFtZSkuc2l6ZSgpID4gMDtcbiAgICB9XG59IiwiaW1wb3J0IHsgSW5qZWN0aW9uUG9pbnQgfSBmcm9tIFwibWluZGlfdjFcIjtcbmltcG9ydCB7IERvbVRyZWUgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudC5qc1wiO1xuaW1wb3J0IHsgVW5pcXVlSWRSZWdpc3RyeSB9IGZyb20gXCIuL3VuaXF1ZUlkUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRSZWdpc3RyYXRvciB9IGZyb20gXCIuL2VsZW1lbnRSZWdpc3RyYXRvci5qc1wiO1xuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IENhbnZhc1N0eWxlcyB9IGZyb20gXCIuLi9jYW52YXMvY2FudmFzU3R5bGVzLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDb21wb25lbnRGYWN0b3J5XCIpO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvKiogQHR5cGUge1N0eWxlc1JlZ2lzdHJ5fSAqL1xuICAgICAgICB0aGlzLnN0eWxlc1JlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoU3R5bGVzUmVnaXN0cnkpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoVGVtcGxhdGVSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtVbmlxdWVJZFJlZ2lzdHJ5fSAqL1xuICAgICAgICB0aGlzLnVuaXF1ZUlkUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShVbmlxdWVJZFJlZ2lzdHJ5KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSByZXByZXNlbnRzIHRoZSB0ZW1wbGF0ZSBhbmQgdGhlIHN0eWxlcyBuYW1lIGlmIHRoZSBzdHlsZSBmb3IgdGhhdCBuYW1lIGlzIGF2YWlsYWJsZVxuICAgICAqL1xuICAgIGNyZWF0ZShuYW1lKXtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldChuYW1lKTtcbiAgICAgICAgaWYoIXRlbXBsYXRlKSB7XG4gICAgICAgICAgICBMT0cuZXJyb3IodGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5KTtcbiAgICAgICAgICAgIHRocm93IFwiTm8gdGVtcGxhdGUgd2FzIGZvdW5kIHdpdGggbmFtZSBcIiArIG5hbWU7XG5cbiAgICAgICAgfVxuICAgICAgICB2YXIgZWxlbWVudFJlZ2lzdHJhdG9yID0gbmV3IEVsZW1lbnRSZWdpc3RyYXRvcih0aGlzLnVuaXF1ZUlkUmVnaXN0cnksIGNvbXBvbmVudENvdW50ZXIrKyk7XG4gICAgICAgIG5ldyBEb21UcmVlKHRlbXBsYXRlLmdldFRlbXBsYXRlU291cmNlKCksZWxlbWVudFJlZ2lzdHJhdG9yKS5sb2FkKCk7XG5cbiAgICAgICAgdGhpcy5tb3VudFN0eWxlcyhuYW1lKTtcblxuICAgICAgICByZXR1cm4gbmV3IENvbXBvbmVudChlbGVtZW50UmVnaXN0cmF0b3IuY29tcG9uZW50SW5kZXgsIGVsZW1lbnRSZWdpc3RyYXRvci5yb290RWxlbWVudCwgZWxlbWVudFJlZ2lzdHJhdG9yLmdldEVsZW1lbnRNYXAoKSk7XG4gICAgfVxuXG4gICAgbW91bnRTdHlsZXMobmFtZSkge1xuICAgICAgICBpZih0aGlzLnN0eWxlc1JlZ2lzdHJ5LmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBDYW52YXNTdHlsZXMuc2V0U3R5bGUobmFtZSwgdGhpcy5zdHlsZXNSZWdpc3RyeS5nZXQobmFtZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cbnZhciBjb21wb25lbnRDb3VudGVyID0gMDsiLCJpbXBvcnQgeyBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuLyoqXG4gKiBTdGF0ZU1hbmFnZXJcbiAqIFxuICogQHRlbXBsYXRlIFRcbiAqL1xuZXhwb3J0IGNsYXNzIFN0YXRlTWFuYWdlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXA8U3RyaW5nLCBhbnk+fSAqL1xuICAgICAgICB0aGlzLm9iamVjdE1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcDxTdHJpbmcsIEFycmF5PE1ldGhvZD59ICovXG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWV0aG9kfSBsaXN0ZW5lciBcbiAgICAgKi9cbiAgICByZWFjdChsaXN0ZW5lcikge1xuICAgICAgICBjb25zdCBhbnlLZXkgPSBcIl9fQU5ZX19cIjtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5oYXMoYW55S2V5KSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc2V0KGFueUtleSwgbmV3IEFycmF5KCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChhbnlLZXkpLnB1c2gobGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgXG4gICAgICogQHBhcmFtIHtNZXRob2R9IGxpc3RlbmVyIFxuICAgICAqL1xuICAgIHJlYWN0VG8oa2V5LCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMubGlzdGVuZXJzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zZXQoa2V5LCBuZXcgQXJyYXkoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuZ2V0KGtleSkucHVzaChsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIHRoZSBzdGF0ZVxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgXG4gICAgICogQHBhcmFtIHtUfSBvYmplY3QgXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlKG9iamVjdCwga2V5ID0gXCJfX0RFRkFVTFRfX1wiKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0W2ldID0gdGhpcy5jcmVhdGVQcm94eShvYmplY3RbaV0sIGtleSwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb2JqZWN0ID0gdGhpcy5jcmVhdGVQcm94eShvYmplY3QsIGtleSwgdGhpcyk7XG4gICAgICAgIHRoaXMub2JqZWN0TWFwLnNldChrZXksIG9iamVjdCk7XG4gICAgICAgIHRoaXMuc2lnbmFsU3RhdGVDaGFuZ2Uob2JqZWN0LCBrZXkpO1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cblxuICAgIHNpZ25hbFN0YXRlQ2hhbmdlKG9iamVjdCwga2V5KSB7XG4gICAgICAgIGlmICh0aGlzLmxpc3RlbmVycy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuZ2V0KGtleSkpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5jYWxsKFtvYmplY3RdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFueUtleSA9IFwiX19BTllfX1wiO1xuICAgICAgICBpZiAoa2V5ICE9IGFueUtleSAmJiB0aGlzLmxpc3RlbmVycy5oYXMoYW55S2V5KSkge1xuICAgICAgICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuZ2V0KGFueUtleSkpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5jYWxsKFtvYmplY3RdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNyZWF0ZVByb3h5KG9iamVjdCwga2V5LCBzdGF0ZU1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eShvYmplY3QsIHtcbiAgICAgICAgICAgIHNldDogKHRhcmdldCwgcHJvcCwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gKHRhcmdldFtwcm9wXSA9IHZhbHVlKTtcbiAgICAgICAgICAgICAgICBzdGF0ZU1hbmFnZXIuc2lnbmFsU3RhdGVDaGFuZ2UodGFyZ2V0LCBrZXkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzID09PSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTG9nZ2VyLCBMaXN0IH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcbmltcG9ydCB7IFByb3RvdHlwZUNvbmZpZywgU2luZ2xldG9uQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCJcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBVbmlxdWVJZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vY29tcG9uZW50L3VuaXF1ZUlkUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IENvbXBvbmVudEZhY3RvcnkgfSBmcm9tIFwiLi9jb21wb25lbnQvY29tcG9uZW50RmFjdG9yeS5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFN0YXRlTWFuYWdlciB9IGZyb20gXCIuL3N0YXRlL3N0YXRlTWFuYWdlci5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29uZmlnXCIpO1xuXG5leHBvcnQgY2xhc3MgQ29uZmlnIHtcblxuICAgIHN0YXRpYyBnZXRJbnN0YW5jZSgpIHtcbiAgICAgICAgcmV0dXJuIGp1c3RyaWdodENvbmZpZztcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy50eXBlQ29uZmlnTGlzdCA9IG5ldyBMaXN0KFtcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKFRlbXBsYXRlUmVnaXN0cnkpLFxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoU3R5bGVzUmVnaXN0cnkpLFxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVW5pcXVlSWRSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChDb21wb25lbnRGYWN0b3J5KSxcbiAgICAgICAgICAgIFByb3RvdHlwZUNvbmZpZy51bm5hbWVkKFN0YXRlTWFuYWdlcildKTtcbiAgICAgICAgfVxuXG4gICAgZ2V0VHlwZUNvbmZpZ0xpc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVDb25maWdMaXN0O1xuICAgIH1cblxufVxuXG5jb25zdCBqdXN0cmlnaHRDb25maWcgPSBuZXcgQ29uZmlnKCk7IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkxvYWRlckludGVyY2VwdG9yXCIpO1xuXG5leHBvcnQgY2xhc3MgTG9hZGVySW50ZXJjZXB0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAgICovXG4gICAgcHJvY2VzcygpIHtcbiAgICAgICAgTE9HLmluZm8oXCJVbmltcGxlbWVudGVkIExvYWRlciBJbnRlcmNlcHRvciBicmVha3MgYnkgZGVmYXVsdFwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxufSIsImltcG9ydCB7IExvZ2dlciwgU3RyaW5nVXRpbHMgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XG5pbXBvcnQgeyBMb2FkZXJJbnRlcmNlcHRvciB9IGZyb20gXCIuL2xvYWRlckludGVyY2VwdG9yLmpzXCJcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIk1vZHVsZUxvYWRlclwiKTtcblxuZXhwb3J0IGNsYXNzIE1vZHVsZUxvYWRlciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWF0Y2hQYXRoIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGVQYXRoIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8TG9hZGVySW50ZXJjZXB0b3I+fSBsb2FkZXJJbnRlcmNlcHRvcnNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihtYXRjaFBhdGgsIG1vZHVsZVBhdGgsIGxvYWRlckludGVyY2VwdG9ycyA9IFtdKSB7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubWF0Y2hQYXRoID0gbWF0Y2hQYXRoO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tb2R1bGVQYXRoID0gbW9kdWxlUGF0aDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge0FycmF5PExvYWRlckludGVyY2VwdG9yPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubG9hZGVySW50ZXJjZXB0b3JzID0gbG9hZGVySW50ZXJjZXB0b3JzO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWF0Y2hlcyBpZiB0aGUgY29uZmlndXJlZCBtYXRjaFVybCBzdGFydHMgd2l0aCB0aGUgcHJvdmlkZWQgdXJsIG9yXG4gICAgICogaWYgdGhlIGNvbmZpZ3VyZWQgbWF0Y2hVcmwgaXMgbnVsbFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgbWF0Y2hlcyh1cmwpe1xuICAgICAgICBpZiAoIXRoaXMubWF0Y2hQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgTE9HLmVycm9yKFwiVXJsIGlzIG51bGxcIik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFN0cmluZ1V0aWxzLm5vbk51bGxFcXVhbHModGhpcy5tYXRjaFBhdGgsIHVybC5wYXRoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNYWluPn1cbiAgICAgKi9cbiAgICBhc3luYyBsb2FkKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbWFpbiA9IGF3YWl0IHRoaXMuaW1wb3J0TW9kdWxlKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmludGVyY2VwdG9yc1Bhc3MoKTtcbiAgICAgICAgICAgIHJldHVybiBtYWluO1xuICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgTE9HLndhcm4oXCJGaWx0ZXIgcmVqZWN0ZWQgXCIgKyByZWFzb24pO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBpbnRlcmNlcHRvcnNQYXNzKCkge1xuICAgICAgICBjb25zdCBpbnRlcmNlcHRvcnMgPSB0aGlzLmxvYWRlckludGVyY2VwdG9ycztcbiAgICAgICAgaWYgKGludGVyY2VwdG9ycyAmJiBpbnRlcmNlcHRvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGV0IGludGVyY2VwdG9yUHJvbWlzZUNoYWluID0gaW50ZXJjZXB0b3JzWzBdLnByb2Nlc3MoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgaW50ZXJjZXB0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJjZXB0b3JQcm9taXNlQ2hhaW4gPSBpbnRlcmNlcHRvclByb21pc2VDaGFpbi50aGVuKGludGVyY2VwdG9yc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW50ZXJjZXB0b3JQcm9taXNlQ2hhaW47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIGFzeW5jIGltcG9ydE1vZHVsZSgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9IGF3YWl0IGltcG9ydCh0aGlzLm1vZHVsZVBhdGgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBtb2R1bGUuZGVmYXVsdCgpO1xuICAgICAgICB9IGNhdGNoKHJlYXNvbikgIHtcbiAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IFVybCB9IGZyb20gXCIuL3V0aWwvdXJsXCI7XG5cbmV4cG9ydCBjbGFzcyBNYWluIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgbG9hZCh1cmwpIHtcbiAgICAgICAgdGhyb3cgXCJNYWluIGNsYXNzIG11c3QgaW1wbGVtZW50IGxvYWQodXJsKVwiO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdGhyb3cgXCJNYWluIGNsYXNzIG11c3QgaW1wbGVtZW50IHVwZGF0ZSgpXCI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgcGF0aCgpIHtcbiAgICAgICAgdGhyb3cgXCJNYWluIGNsYXNzIG11c3QgaW1wbGVtZW50IGdldCBwYXRoKClcIjtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMaXN0LCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxuaW1wb3J0IHsgTWluZGlDb25maWcsIE1pbmRpSW5qZWN0b3IgfSBmcm9tIFwibWluZGlfdjFcIjtcbmltcG9ydCB7IE1vZHVsZUxvYWRlciB9IGZyb20gXCIuL21vZHVsZUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgTG9hZGVySW50ZXJjZXB0b3IgfSBmcm9tIFwiLi9sb2FkZXJJbnRlcmNlcHRvci5qc1wiXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL21haW4uanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkRpTW9kdWxlTG9hZGVyXCIpO1xuXG5leHBvcnQgY2xhc3MgRGlNb2R1bGVMb2FkZXIgZXh0ZW5kcyBNb2R1bGVMb2FkZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNaW5kaUNvbmZpZ30gY29uZmlnXG4gICAgICogQHBhcmFtIHtSZWdFeHB9IG1hdGNoUGF0aCBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbW9kdWxlUGF0aCBcbiAgICAgKiBAcGFyYW0ge0FycmF5PExvYWRlckludGVyY2VwdG9yPn0gbG9hZGVySW50ZXJjZXB0b3JzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBtYXRjaFBhdGgsIG1vZHVsZVBhdGgsIGxvYWRlckludGVyY2VwdG9ycyA9IFtdKSB7XG4gICAgICAgIHN1cGVyKG1hdGNoUGF0aCwgbW9kdWxlUGF0aCwgbG9hZGVySW50ZXJjZXB0b3JzKTtcblxuICAgICAgICAvKiogQHR5cGUge01pbmRpQ29uZmlnfSAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNYWluPn1cbiAgICAgKi9cbiAgICBhc3luYyBsb2FkKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbWFpbiA9IGF3YWl0IHRoaXMuaW1wb3J0TW9kdWxlKCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmludGVyY2VwdG9yc1Bhc3MoKTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBNaW5kaUluamVjdG9yLmluamVjdChtYWluLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgICAgICBMT0cud2FybihcIk1vZHVsZSBsb2FkZXIgZmFpbGVkIFwiICsgcmVhc29uKTtcbiAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNb2R1bGVMb2FkZXJ9IG1vZHVsZUxvYWRlclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGFzeW5jIGltcG9ydE1vZHVsZSgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG1haW4gPSBhd2FpdCBzdXBlci5pbXBvcnRNb2R1bGUoKTtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmFkZEFsbFR5cGVDb25maWcobWFpbi50eXBlQ29uZmlnTGlzdCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5maW5hbGl6ZSgpO1xuICAgICAgICAgICAgYXdhaXQgbmV3IExpc3QodGhpcy5sb2FkZXJJbnRlcmNlcHRvcnMpLnByb21pc2VDaGFpbigobG9hZGVySW50ZXJjZXB0b3IpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWluZGlJbmplY3Rvci5pbmplY3QobG9hZGVySW50ZXJjZXB0b3IsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG1haW47XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxufSIsImltcG9ydCB7IE1pbmRpSW5qZWN0b3IsIE1pbmRpQ29uZmlnLCBJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyLCBDb25maWdBY2Nlc3NvciwgU2luZ2xldG9uQ29uZmlnLCBQcm90b3R5cGVDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcbmltcG9ydCB7IExpc3QsIExvZ2dlciwgTWV0aG9kLCBTdHJpbmdVdGlscyB9IGZyb20gIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENvbnRhaW5lclVybCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IENvbXBvbmVudENvbmZpZ1Byb2Nlc3NvciB9IGZyb20gXCIuL2NvbXBvbmVudC9jb21wb25lbnRDb25maWdQcm9jZXNzb3IuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuL3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnLmpzXCI7XG5pbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuL2V2ZW50L2V2ZW50LmpzXCI7XG5pbXBvcnQgeyBIaXN0b3J5IH0gZnJvbSBcIi4vbmF2aWdhdGlvbi9oaXN0b3J5LmpzXCI7XG5pbXBvcnQgeyBEaU1vZHVsZUxvYWRlciB9IGZyb20gXCIuL2xvYWRlci9kaU1vZHVsZUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4vdXRpbC91cmwuanNcIjtcbmltcG9ydCB7IE1vZHVsZVJ1bm5lciB9IGZyb20gXCIuL21vZHVsZVJ1bm5lci5qc1wiO1xuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuL21haW4uanNcIjtcbmltcG9ydCB7IEFjdGl2ZU1vZHVsZVJ1bm5lciB9IGZyb20gXCIuL2FjdGl2ZU1vZHVsZVJ1bm5lci5qc1wiO1xuaW1wb3J0IHsgQ29uZmlndXJlZEZ1bmN0aW9uIH0gZnJvbSBcIi4vY29uZmlnL2NvbmZpZ3VyZWRGdW5jdGlvbi5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudE1hcHBlciB9IGZyb20gXCIuL2VsZW1lbnQvZWxlbWVudE1hcHBlci5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQXBwbGljYXRpb25cIik7XG5cbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbiBleHRlbmRzIE1vZHVsZVJ1bm5lciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TGlzdH0gKi9cbiAgICAgICAgdGhpcy53b3JrZXJMaXN0ID0gbmV3IExpc3QoKTtcblxuICAgICAgICAvKiogQHR5cGUge0xpc3Q8RGlNb2R1bGVMb2FkZXI+fSAqL1xuICAgICAgICB0aGlzLm1vZHVsZUxvYWRlckxpc3QgPSBuZXcgTGlzdCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWluZGlDb25maWd9ICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gbmV3IE1pbmRpQ29uZmlnKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xuICAgICAgICB0aGlzLnJ1bm5pbmdXb3JrZXJzID0gbmV3IExpc3QoKTtcblxuICAgICAgICAvKiogQHR5cGUge01haW59ICovXG4gICAgICAgIHRoaXMuYWN0aXZlTWFpbiA9IG51bGw7XG5cbiAgICAgICAgQ29uZmlndXJlZEZ1bmN0aW9uLmNvbmZpZ3VyZShcIndyYXBFdmVudFwiLCAocGFyYW1ldGVyKSA9PiB7IHJldHVybiBuZXcgRXZlbnQocGFyYW1ldGVyKTsgfSk7XG5cbiAgICAgICAgQ29uZmlndXJlZEZ1bmN0aW9uLmNvbmZpZ3VyZShcIm1hcEVsZW1lbnRcIiwgKHBhcmFtZXRlcikgPT4geyByZXR1cm4gRWxlbWVudE1hcHBlci5tYXAocGFyYW1ldGVyKTsgfSk7XG5cbiAgICAgICAgdGhpcy5kZWZhdWx0Q29uZmlnID0gQ29uZmlnLmdldEluc3RhbmNlKCkuZ2V0VHlwZUNvbmZpZ0xpc3QoKTtcblxuICAgICAgICB0aGlzLmRlZmF1bHRDb25maWdQcm9jZXNzb3JzID0gbmV3IExpc3QoWyBDb21wb25lbnRDb25maWdQcm9jZXNzb3IgXSk7XG5cbiAgICAgICAgdGhpcy5kZWZhdWx0SW5zdGFuY2VQcm9jZXNzb3JzID0gbmV3IExpc3QoWyBJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyIF0pXG5cbiAgICAgICAgdGhpcy5jdXN0b21Db25maWcgPSBuZXcgTGlzdCgpO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtMaXN0PFNpbmdsZXRvbkNvbmZpZyB8IFByb3RvdHlwZUNvbmZpZz59IHR5cGVDb25maWdMaXN0IFxuICAgICAqL1xuICAgIHNldCBjdXN0b21UeXBlQ29uZmlnKHR5cGVDb25maWdMaXN0KSB7XG4gICAgICAgIHRoaXMuY3VzdG9tQ29uZmlnID0gdHlwZUNvbmZpZ0xpc3Q7XG4gICAgfVxuXG4gICAgYXN5bmMgcnVuKCkge1xuICAgICAgICBMT0cuaW5mbyhcIlJ1bm5pbmcgQXBwbGljYXRpb25cIik7XG4gICAgICAgIHRoaXMuY29uZmlnXG4gICAgICAgICAgICAuYWRkQWxsVHlwZUNvbmZpZyh0aGlzLmRlZmF1bHRDb25maWcpXG4gICAgICAgICAgICAuYWRkQWxsVHlwZUNvbmZpZyh0aGlzLmN1c3RvbUNvbmZpZylcbiAgICAgICAgICAgIC5hZGRBbGxDb25maWdQcm9jZXNzb3IodGhpcy5kZWZhdWx0Q29uZmlnUHJvY2Vzc29ycylcbiAgICAgICAgICAgIC5hZGRBbGxJbnN0YW5jZVByb2Nlc3Nvcih0aGlzLmRlZmF1bHRJbnN0YW5jZVByb2Nlc3NvcnMpO1xuICAgICAgICBBY3RpdmVNb2R1bGVSdW5uZXIuaW5zdGFuY2UoKS5zZXQodGhpcyk7XG4gICAgICAgIENvbnRhaW5lclVybC5hZGRVc2VyTmF2aWdhdGVMaXN0ZW5lcihcbiAgICAgICAgICAgIG5ldyBNZXRob2QodGhpcywgdGhpcy51cGRhdGUpLFxuICAgICAgICAgICAgRXZlbnRcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgbWFpbiA9IGF3YWl0IHRoaXMucnVuTW9kdWxlKEhpc3RvcnkuY3VycmVudFVybCgpKTtcbiAgICAgICAgdGhpcy5zdGFydFdvcmtlcnMoKTtcbiAgICAgICAgcmV0dXJuIG1haW47XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKi9cbiAgICB1cGRhdGUoZXZlbnQpIHtcbiAgICAgICAgY29uc3QgdXJsID0gSGlzdG9yeS5jdXJyZW50VXJsKCk7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZU1haW4gJiYgU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyh0aGlzLmFjdGl2ZU1haW4ucGF0aCwgdXJsLnBhdGgpKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZU1haW4udXBkYXRlKHVybCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ydW5Nb2R1bGUodXJsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGFzeW5jIHJ1bk1vZHVsZSh1cmwpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG1haW4gPSBhd2FpdCB0aGlzLmdldE1hdGNoaW5nTW9kdWxlTG9hZGVyKHVybCkubG9hZCgpO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVNYWluID0gbWFpbjtcbiAgICAgICAgICAgIG1haW4ubG9hZCh1cmwsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuIG1haW47XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXJ0V29ya2VycygpIHtcbiAgICAgICAgaWYgKHRoaXMucnVubmluZ1dvcmtlcnMuc2l6ZSgpID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMud29ya2VyTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IHZhbHVlKCk7XG4gICAgICAgICAgICBNaW5kaUluamVjdG9yLmluamVjdChpbnN0YW5jZSwgdGhpcy5jb25maWcpO1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nV29ya2Vycy5hZGQoaW5zdGFuY2UpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmxcbiAgICAgKiBAcmV0dXJucyB7RGlNb2R1bGVMb2FkZXJ9XG4gICAgICovXG4gICAgZ2V0TWF0Y2hpbmdNb2R1bGVMb2FkZXIodXJsKSB7XG4gICAgICAgIGxldCBmb3VuZE1vZHVsZUxvYWRlciA9IG51bGw7XG4gICAgICAgIHRoaXMubW9kdWxlTG9hZGVyTGlzdC5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAodmFsdWUubWF0Y2hlcyh1cmwpKSB7XG4gICAgICAgICAgICAgICAgZm91bmRNb2R1bGVMb2FkZXIgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBmb3VuZE1vZHVsZUxvYWRlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byBkZXBlbmRlbmN5IGluamVjdGlvbiBjb25maWdcbiAgICAgKi9cbiAgICB3aW5kb3dEaUNvbmZpZygpIHtcbiAgICAgICAgd2luZG93LmRpQ29uZmlnID0gKCkgPT4ge1xuICAgICAgICAgICAgTE9HLmluZm8odGhpcy5jb25maWcuY29uZmlnRW50cmllcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byB0ZW1wbGF0ZSByZWdpc3RyeVxuICAgICAqL1xuICAgIHdpbmRvd1RlbXBsYXRlUmVnaXN0cnkoKSB7XG4gICAgICAgIHdpbmRvdy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gKCkgPT4ge1xuICAgICAgICAgICAgTE9HLmluZm8oQ29uZmlnQWNjZXNzb3IuaW5zdGFuY2VIb2xkZXIoVGVtcGxhdGVSZWdpc3RyeS5uYW1lLCB0aGlzLmNvbmZpZykuaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW5hYmxlIGdsb2JhbCBhY2Nlc3MgdG8gc3R5bGUgcmVnaXN0cnlcbiAgICAgKi9cbiAgICB3aW5kb3dTdHlsZVJlZ2lzdHJ5KCkge1xuICAgICAgICB3aW5kb3cuc3R5bGVSZWdpc3RyeSA9ICgpID0+IHtcbiAgICAgICAgICAgIExPRy5pbmZvKENvbmZpZ0FjY2Vzc29yLmluc3RhbmNlSG9sZGVyKFN0eWxlc1JlZ2lzdHJ5Lm5hbWUsIHRoaXMuY29uZmlnKS5pbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBQcm9wZXJ0eUFjY2Vzc29yLCBMaXN0LCBMb2dnZXIsIE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudFwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSW5wdXRFbGVtZW50RGF0YUJpbmRpbmdcIik7XG5cbmV4cG9ydCBjbGFzcyBJbnB1dEVsZW1lbnREYXRhQmluZGluZyB7XG5cbiAgICBjb25zdHJ1Y3Rvcihtb2RlbCwgdmFsaWRhdG9yKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy52YWxpZGF0b3IgPSB2YWxpZGF0b3I7XG4gICAgICAgIHRoaXMucHVsbGVycyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMucHVzaGVycyA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGxpbmsobW9kZWwsIHZhbGlkYXRvcikge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0RWxlbWVudERhdGFCaW5kaW5nKG1vZGVsLCB2YWxpZGF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZpZWxkIFxuICAgICAqL1xuICAgIGFuZChmaWVsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50byhmaWVsZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdElucHV0RWxlbWVudH0gZmllbGQgXG4gICAgICovXG4gICAgdG8oZmllbGQpIHtcbiAgICAgICAgY29uc3QgcHVsbGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgbGV0IG1vZGVsVmFsdWUgPSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUpO1xuICAgICAgICAgICAgaWYgKG1vZGVsVmFsdWUgIT09IGZpZWxkLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgUHJvcGVydHlBY2Nlc3Nvci5zZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lLCBmaWVsZC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlKGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZmllbGQubGlzdGVuVG8oXCJjaGFuZ2VcIiwgbmV3IE1ldGhvZCh0aGlzLCBwdWxsZXIpKTtcbiAgICAgICAgZmllbGQubGlzdGVuVG8oXCJrZXl1cFwiLCBuZXcgTWV0aG9kKHRoaXMsIHB1bGxlcikpO1xuICAgICAgICBwdWxsZXIuY2FsbCgpO1xuXG4gICAgICAgIGNvbnN0IHB1c2hlciA9ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBtb2RlbFZhbHVlID0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lKTtcbiAgICAgICAgICAgIGlmIChtb2RlbFZhbHVlICE9PSBmaWVsZC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGZpZWxkLnZhbHVlID0gbW9kZWxWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnZhbGlkYXRvciAmJiB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZVNpbGVudCAmJiBmaWVsZC52YWx1ZSl7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0b3IudmFsaWRhdGVTaWxlbnQoZmllbGQudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBjaGFuZ2VkRnVuY3Rpb25OYW1lID0gXCJfX2NoYW5nZWRfXCIgKyBmaWVsZC5uYW1lLnJlcGxhY2UoXCIuXCIsXCJfXCIpO1xuICAgICAgICBpZiAoIXRoaXMubW9kZWxbY2hhbmdlZEZ1bmN0aW9uTmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMubW9kZWxbY2hhbmdlZEZ1bmN0aW9uTmFtZV0gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnB1bGxlcnMuYWRkKHB1bGxlcik7XG4gICAgICAgIHRoaXMucHVzaGVycy5hZGQocHVzaGVyKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBwdWxsKCkge1xuICAgICAgICB0aGlzLnB1bGxlcnMuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbChwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIHB1c2goKSB7XG4gICAgICAgIHRoaXMucHVzaGVycy5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFByb3h5T2JqZWN0RmFjdG9yeSB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgcHJveHkgZm9yIGFuIG9iamVjdCB3aGljaCBhbGxvd3MgZGF0YWJpbmRpbmcgZnJvbSB0aGUgb2JqZWN0IHRvIHRoZSBmb3JtIGVsZW1lbnRcbiAgICAgKiBcbiAgICAgKiBAdGVtcGxhdGUgVFxuICAgICAqIEBwYXJhbSB7VH0gb2JqZWN0IFxuICAgICAqIEByZXR1cm5zIHtUfVxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVQcm94eU9iamVjdChvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eShvYmplY3QsIHtcbiAgICAgICAgICAgIHNldDogKHRhcmdldCwgcHJvcCwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgc3VjY2VzcyA9ICh0YXJnZXRbcHJvcF0gPSB2YWx1ZSk7XG5cbiAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uTmFtZSA9IFwiX19jaGFuZ2VkX1wiICsgcHJvcDtcbiAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uID0gdGFyZ2V0W2NoYW5nZWRGdW5jdGlvbk5hbWVdO1xuICAgICAgICAgICAgICAgIGlmKGNoYW5nZWRGdW5jdGlvbiAmJiB0eXBlb2YgY2hhbmdlZEZ1bmN0aW9uID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJvdW5kQ2hhbmdlZEZ1bmN0aW9uID0gY2hhbmdlZEZ1bmN0aW9uLmJpbmQodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgYm91bmRDaGFuZ2VkRnVuY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MgPT09IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59IiwiaW1wb3J0IHsgTWV0aG9kIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbi8qKlxuICogT2JqZWN0IEZ1bmN0aW9uIHdoaWNoIGlzIGNhbGxlZCBpZiB0aGUgZmlsdGVyIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZVxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRGaWx0ZXJlZE1ldGhvZCBleHRlbmRzIE1ldGhvZCB7XG5cbiAgICAvKipcbiAgICAgKiBDb250cnVjdG9yXG4gICAgICogQHBhcmFtIHtNZXRob2R9IG1ldGhvZCBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSB0aGVGaWx0ZXIgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWV0aG9kLCBmaWx0ZXIpe1xuICAgICAgICB0aGlzLm1ldGhvZCA9IG1ldGhvZDtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgfVxuXG4gICAgY2FsbChwYXJhbXMpe1xuICAgICAgICBpZih0aGlzLmZpbHRlciAmJiB0aGlzLmZpbHRlci5jYWxsKHRoaXMscGFyYW1zKSkge1xuICAgICAgICAgICAgdGhpcy5tZXRob2QuY2FsbChwYXJhbXMpO1xuICAgICAgICB9XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTWV0aG9kLCBNYXAsIExpc3QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuLyoqXG4gKiBFdmVudE1hbmFnZXJcbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50TWFuYWdlciB7XG5cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvKiogQHR5cGUgTWFwPExpc3Q8TWV0aG9kPj4gKi9cbiAgICAgICAgdGhpcy5saXN0ZW5lck1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIFxuICAgICAqIEBwYXJhbSB7TWV0aG9kfSBsaXN0ZW5lciBcbiAgICAgKiBAcmV0dXJucyB7RXZlbnRNYW5hZ2VyfVxuICAgICAqL1xuICAgIGxpc3RlblRvKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVyTWFwLmNvbnRhaW5zKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJNYXAuc2V0KGV2ZW50VHlwZSwgbmV3IExpc3QoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lck1hcC5nZXQoZXZlbnRUeXBlKS5hZGQobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIFxuICAgICAqIEBwYXJhbSB7QXJyYXl8YW55fSBwYXJhbWV0ZXIgXG4gICAgICovXG4gICAgYXN5bmMgdHJpZ2dlcihldmVudFR5cGUsIHBhcmFtZXRlcikge1xuICAgICAgICBpZiAoIXRoaXMubGlzdGVuZXJNYXAuY29udGFpbnMoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXN1bHRBcnJheSA9IFtdO1xuICAgICAgICB0aGlzLmxpc3RlbmVyTWFwLmdldChldmVudFR5cGUpLmZvckVhY2goKGxpc3RlbmVyLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdEFycmF5LnB1c2gobGlzdGVuZXIuY2FsbChwYXJhbWV0ZXIpKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJlc3VsdEFycmF5KTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBBcnJheVV0aWxzLCBMaXN0LCBTdHJpbmdVdGlscyB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudFwiO1xuXG5leHBvcnQgY2xhc3MgQ1NTIHtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGZyb20oYmFzZUVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDU1MoYmFzZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGJhc2VFbGVtZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGJhc2VFbGVtZW50KSB7XG4gICAgICAgIC8qKiBAdHlwZSB7QmFzZUVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQgPSBiYXNlRWxlbWVudDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIFwiXCIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgXG4gICAgICovXG4gICAgdG9nZ2xlKGNzc0NsYXNzKSB7XG4gICAgICAgIGxldCBjdXJyZW50Q2xhc3MgPSB0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwiY2xhc3NcIik7XG4gICAgICAgIGxldCBjdXJyZW50Q2xhc3NBcnJheSA9IFN0cmluZ1V0aWxzLnRvQXJyYXkoY3VycmVudENsYXNzLCBcIiBcIik7XG4gICAgICAgIGxldCBjdXJyZW50Q2xhc3NMaXN0ID0gbmV3IExpc3QoY3VycmVudENsYXNzQXJyYXkpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGN1cnJlbnRDbGFzc0xpc3QuY29udGFpbnMoY3NzQ2xhc3MpKSB7XG4gICAgICAgICAgICBjdXJyZW50Q2xhc3NMaXN0LnJlbW92ZShjc3NDbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50Q2xhc3NMaXN0LmFkZChjc3NDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJjbGFzc1wiLCBBcnJheVV0aWxzLnRvU3RyaW5nKGN1cnJlbnRDbGFzc0xpc3QuZ2V0QXJyYXkoKSwgXCIgXCIpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIFxuICAgICAqL1xuICAgIGVuYWJsZShjc3NDbGFzcykge1xuICAgICAgICBsZXQgY3VycmVudENsYXNzID0gdGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzQXJyYXkgPSBTdHJpbmdVdGlscy50b0FycmF5KGN1cnJlbnRDbGFzcywgXCIgXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzTGlzdCA9IG5ldyBMaXN0KGN1cnJlbnRDbGFzc0FycmF5KTtcbiAgICAgICAgXG4gICAgICAgIGlmICghY3VycmVudENsYXNzTGlzdC5jb250YWlucyhjc3NDbGFzcykpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIEFycmF5VXRpbHMudG9TdHJpbmcoY3VycmVudENsYXNzTGlzdC5nZXRBcnJheSgpLCBcIiBcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgXG4gICAgICovXG4gICAgZGlzYWJsZShjc3NDbGFzcykge1xuICAgICAgICBsZXQgY3VycmVudENsYXNzID0gdGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzQXJyYXkgPSBTdHJpbmdVdGlscy50b0FycmF5KGN1cnJlbnRDbGFzcywgXCIgXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzTGlzdCA9IG5ldyBMaXN0KGN1cnJlbnRDbGFzc0FycmF5KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChjdXJyZW50Q2xhc3NMaXN0LmNvbnRhaW5zKGNzc0NsYXNzKSkge1xuICAgICAgICAgICAgY3VycmVudENsYXNzTGlzdC5yZW1vdmUoY3NzQ2xhc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIEFycmF5VXRpbHMudG9TdHJpbmcoY3VycmVudENsYXNzTGlzdC5nZXRBcnJheSgpLCBcIiBcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3NSZW1vdmFsUHJlZml4IFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjc3NDbGFzc1xuICAgICAqL1xuICAgIHJlcGxhY2UoY3NzQ2xhc3NSZW1vdmFsUHJlZml4LCBjc3NDbGFzcykge1xuICAgICAgICBsZXQgY3VycmVudENsYXNzID0gdGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzQXJyYXkgPSBTdHJpbmdVdGlscy50b0FycmF5KGN1cnJlbnRDbGFzcywgXCIgXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzTGlzdCA9IG5ldyBMaXN0KGN1cnJlbnRDbGFzc0FycmF5KTtcbiAgICAgICAgbGV0IHRvUmVtb3ZlQXJyYXkgPSBbXTtcblxuICAgICAgICBpZiAoIVN0cmluZ1V0aWxzLmlzQmxhbmsoY3NzQ2xhc3NSZW1vdmFsUHJlZml4KSkge1xuICAgICAgICAgICAgY3VycmVudENsYXNzTGlzdC5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKGNzc0NsYXNzUmVtb3ZhbFByZWZpeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9SZW1vdmVBcnJheS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvUmVtb3ZlQXJyYXkuZm9yRWFjaCgodG9SZW1vdmVWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgY3VycmVudENsYXNzTGlzdC5yZW1vdmUodG9SZW1vdmVWYWx1ZSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY3VycmVudENsYXNzTGlzdC5hZGQoY3NzQ2xhc3MpO1xuICAgICAgICB0aGlzLmJhc2VFbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiY2xhc3NcIiwgQXJyYXlVdGlscy50b1N0cmluZyhjdXJyZW50Q2xhc3NMaXN0LmdldEFycmF5KCksIFwiIFwiKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIFxuXG59IiwiaW1wb3J0IHsgTGlzdCwgTWFwLCBNYXBVdGlscywgU3RyaW5nVXRpbHMgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnRcIjtcblxuZXhwb3J0IGNsYXNzIFN0eWxlIHtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGZyb20oYmFzZUVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHlsZShiYXNlRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gYmFzZUVsZW1lbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoYmFzZUVsZW1lbnQpIHtcbiAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudCA9IGJhc2VFbGVtZW50O1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmJhc2VFbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIiwgXCJcIik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHlsZU5hbWUgXG4gICAgICovXG4gICAgcmVtb3ZlKHN0eWxlTmFtZSkge1xuICAgICAgICBjb25zdCBjdXJyZW50U3R5bGVNYXAgPSB0aGlzLnNyeWxlc0FzTWFwKHRoaXMuYmFzZUVsZW1lbnQuZ2V0QXR0cmlidXRlVmFsdWUoXCJzdHlsZVwiKSk7XG4gICAgICAgIGlmIChjdXJyZW50U3R5bGVNYXAuY29udGFpbnMoc3R5bGVOYW1lKSkge1xuICAgICAgICAgICAgY3VycmVudFN0eWxlTWFwLnJlbW92ZShzdHlsZU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJzdHlsZVwiLCBNYXBVdGlscy50b1N0cmluZyhjdXJyZW50U3R5bGVNYXAsIFwiOlwiLCBcIjtcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVOYW1lIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHlsZVZhbHVlIFxuICAgICAqL1xuICAgIHNldChzdHlsZU5hbWUsIHN0eWxlVmFsdWUpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlTWFwID0gdGhpcy5zcnlsZXNBc01hcCh0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIikpO1xuICAgICAgICBjdXJyZW50U3R5bGVNYXAuc2V0KHN0eWxlTmFtZSwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJzdHlsZVwiLCBNYXBVdGlscy50b1N0cmluZyhjdXJyZW50U3R5bGVNYXAsIFwiOlwiLCBcIjtcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVOYW1lIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHlsZVZhbHVlIFxuICAgICAqL1xuICAgICBpcyhzdHlsZU5hbWUsIHN0eWxlVmFsdWUpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlTWFwID0gdGhpcy5zcnlsZXNBc01hcCh0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIikpO1xuICAgICAgICByZXR1cm4gU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyhjdXJyZW50U3R5bGVNYXAuZ2V0KHN0eWxlTmFtZSksIHN0eWxlVmFsdWUpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVOYW1lIFxuICAgICAqL1xuICAgICBleGlzdHMoc3R5bGVOYW1lKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTdHlsZU1hcCA9IHRoaXMuc3J5bGVzQXNNYXAodGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcInN0eWxlXCIpKTtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRTdHlsZU1hcC5jb250YWlucyhzdHlsZU5hbWUpO1xuICAgIH1cblxuICAgIHNyeWxlc0FzTWFwKHN0eWxlcykge1xuICAgICAgICBpZiAoIXN0eWxlcyB8fCBzdHlsZXMuaW5kZXhPZihcIjpcIikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTdHlsZVBhaXJMaXN0ID0gbmV3IExpc3QoU3RyaW5nVXRpbHMudG9BcnJheShzdHlsZXMsIFwiO1wiKSk7XG4gICAgICAgIGN1cnJlbnRTdHlsZVBhaXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUgfHwgdmFsdWUuaW5kZXhPZihcIjpcIikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWRLZXkgPSB2YWx1ZS5zcGxpdChcIjpcIilbMF0udHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWRWYWx1ZSA9IHZhbHVlLnNwbGl0KFwiOlwiKVsxXS50cmltKCk7XG4gICAgICAgICAgICBjdXJyZW50U3R5bGVNYXAuc2V0KHJlc29sdmVkS2V5LCByZXNvbHZlZFZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRTdHlsZU1hcDtcbiAgICB9XG5cbn0iLCJleHBvcnQgY2xhc3MgVHJhaWxOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLnRyYWlsID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge3Byb3BlcnR5fSAqL1xuICAgICAgICB0aGlzLnByb3BlcnR5ID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge2Z1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLndheXBvaW50ID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge2Z1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge0FycmF5PFRyYWlsTm9kZT59ICovXG4gICAgICAgIHRoaXMubmV4dCA9IG51bGw7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTGlzdCwgU3RyaW5nVXRpbHMgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFRyYWlsTm9kZSB9IGZyb20gXCIuL3RyYWlsTm9kZS5qc1wiO1xuaW1wb3J0IHsgSGlzdG9yeSB9IGZyb20gXCIuL2hpc3RvcnkuanNcIjtcbmltcG9ydCB7IFVybEJ1aWxkZXIgfSBmcm9tIFwiLi4vdXRpbC91cmxCdWlsZGVyLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUcmFpbFByb2Nlc3NvciB7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyB0aGUgYWxsIG1hdGNoaW5nIGZ1bmN0aW9ucyBiYXNlZCBvbiB0aGUgdHJhaWwgaW4gdGhlIHVybFxuICAgICAqIGFuZCBjYWxscyB0aG9zZSBmdW5jdGlvbnMuIEFsc28gZW5zdXJlcyB0aGF0IHRoZSBsaXN0XG4gICAgICogb2YgdHJhaWwgc3RvcHMgYXJlIGFkZGVkIHRvIHRoZSBoaXN0b3J5XG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcGFyYW0ge2FueX0gY2FsbGluZ09iamVjdCBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKi9cbiAgICBzdGF0aWMgbmF2aWdhdGVBbGxTdG9wcyh1cmwsIGNhbGxpbmdPYmplY3QsIG5vZGUpIHtcbiAgICAgICAgY29uc3QgdHJhaWxTdG9wcyA9IFRyYWlsUHJvY2Vzc29yLmNhbGxNYXRjaGluZ0Z1bmN0aW9uRnJvbVVybCh1cmwsIGNhbGxpbmdPYmplY3QsIG5vZGUpO1xuICAgICAgICBpZiAoIXRyYWlsU3RvcHMgfHwgMCA9PT0gdHJhaWxTdG9wcy5zaXplKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVybEJ1aWxkZXIgPSBVcmxCdWlsZGVyLmJ1aWxkZXIoKS53aXRoQWxsT2ZVcmwoSGlzdG9yeS5jdXJyZW50VXJsKCkpO1xuICAgICAgICBjb25zdCBzdGVwVXJsID0gdXJsQnVpbGRlci53aXRoQm9va21hcmsobnVsbCkuYnVpbGQoKTtcbiAgICAgICAgSGlzdG9yeS5yZXBsYWNlVXJsKHN0ZXBVcmwsIHN0ZXBVcmwudG9TdHJpbmcoKSwgbnVsbCk7XG4gICAgICAgIFxuICAgICAgICB0cmFpbFN0b3BzLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdGVwVXJsID0gdXJsQnVpbGRlci53aXRoQm9va21hcmsodmFsdWUpLmJ1aWxkKCk7XG4gICAgICAgICAgICBIaXN0b3J5LnB1c2hVcmwoc3RlcFVybCwgc3RlcFVybC50b1N0cmluZygpLCB2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIG1hdGNoaW5nIGZ1bmN0aW9uIGJhc2VkIG9uIHRoZSB0cmFpbCBpbiB0aGUgdXJsXG4gICAgICogYW5kIGNhbGxzIHRoYXQgZnVuY3Rpb24uXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcGFyYW0ge2FueX0gY2FsbGluZ09iamVjdCBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKi9cbiAgICBzdGF0aWMgbmF2aWdhdGVOZXh0U3RvcCh1cmwsIGNhbGxpbmdPYmplY3QsIG5vZGUpIHtcbiAgICAgICAgVHJhaWxQcm9jZXNzb3IuY2FsbE1hdGNoaW5nRnVuY3Rpb25Gcm9tVXJsKHVybCwgY2FsbGluZ09iamVjdCwgbm9kZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIHRyYWlsIHN0b3Agd2hpY2ggbWF0Y2hlcyB0aGUgZnVuY3Rpb24gYW5kIHJlY29yZHMgaXQgaW4gdGhlIGhpc3RvcnlcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSB0aGVGdW5jdGlvbiBcbiAgICAgKiBAcGFyYW0ge2FueX0gY2FsbGluZ09iamVjdCBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKi9cbiAgICBzdGF0aWMgZmluZE5leHRTdG9wKHRoZUZ1bmN0aW9uLCBjYWxsaW5nT2JqZWN0LCBub2RlKSB7XG5cbiAgICAgICAgY29uc3QgY3VycmVudFVybCA9IEhpc3RvcnkuY3VycmVudFVybCgpO1xuXG4gICAgICAgIGNvbnN0IG1hdGNoaW5nTm9kZSA9IFRyYWlsUHJvY2Vzc29yLmdldE5vZGVCeUZ1bmN0aW9uKG5vZGUsIHRoZUZ1bmN0aW9uKTtcblxuICAgICAgICBpZiAoIW1hdGNoaW5nTm9kZSkgeyBcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV4ZWN1dGVkRnVuY3Rpb25Qcm9taXNlID0gbWF0Y2hpbmdOb2RlLmRlc3RpbmF0aW9uLmNhbGwoY2FsbGluZ09iamVjdCk7XG5cbiAgICAgICAgaWYgKCFTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKGN1cnJlbnRVcmwuYm9va21hcmssIG1hdGNoaW5nTm9kZS50cmFpbCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVybEJ1aWxkZXIgPSBVcmxCdWlsZGVyLmJ1aWxkZXIoKS53aXRoQWxsT2ZVcmwoY3VycmVudFVybCk7XG4gICAgICAgICAgICBpZiAoU3RyaW5nVXRpbHMuaXNCbGFuayhjdXJyZW50VXJsLmJvb2ttYXJrKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0ZXBVcmwgPSB1cmxCdWlsZGVyLndpdGhCb29rbWFyayhcIi9cIikuYnVpbGQoKTtcbiAgICAgICAgICAgICAgICBIaXN0b3J5LnB1c2hVcmwoc3RlcFVybCwgc3RlcFVybC50b1N0cmluZygpLCBudWxsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc3RlcFVybCA9IHVybEJ1aWxkZXIud2l0aEJvb2ttYXJrKG1hdGNoaW5nTm9kZS50cmFpbCkuYnVpbGQoKTtcbiAgICAgICAgICAgIEhpc3RvcnkucHVzaFVybChzdGVwVXJsLCBzdGVwVXJsLnRvU3RyaW5nKCksIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4ZWN1dGVkRnVuY3Rpb25Qcm9taXNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSB0cmFpbCBzdG9wIHdoaWNoIG1hdGNoZXMgdGhlIGZ1bmN0aW9uIGFuZCByZXBsYWNlcyBjdXJyZW50IHVybCB3aXRoIGl0XG4gICAgICogXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gdGhlRnVuY3Rpb24gXG4gICAgICogQHBhcmFtIHthbnl9IGNhbGxpbmdPYmplY3QgXG4gICAgICogQHBhcmFtIHtUcmFpbE5vZGV9IG5vZGUgXG4gICAgICovXG4gICAgIHN0YXRpYyByZXBsYWNlQ3VycmVudFN0b3AodGhlRnVuY3Rpb24sIGNhbGxpbmdPYmplY3QsIG5vZGUpIHtcblxuICAgICAgICBjb25zdCBjdXJyZW50VXJsID0gSGlzdG9yeS5jdXJyZW50VXJsKCk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdOb2RlID0gVHJhaWxQcm9jZXNzb3IuZ2V0Tm9kZUJ5RnVuY3Rpb24obm9kZSwgdGhlRnVuY3Rpb24pO1xuXG4gICAgICAgIGlmICghbWF0Y2hpbmdOb2RlKSB7IFxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhlY3V0ZWRGdW5jdGlvblByb21pc2UgPSBtYXRjaGluZ05vZGUuZGVzdGluYXRpb24uY2FsbChjYWxsaW5nT2JqZWN0KTtcblxuICAgICAgICBpZiAoIVN0cmluZ1V0aWxzLm5vbk51bGxFcXVhbHMoY3VycmVudFVybC5ib29rbWFyaywgbWF0Y2hpbmdOb2RlLnRyYWlsKSkge1xuICAgICAgICAgICAgY29uc3QgdXJsQnVpbGRlciA9IFVybEJ1aWxkZXIuYnVpbGRlcigpLndpdGhBbGxPZlVybChjdXJyZW50VXJsKTtcbiAgICAgICAgICAgIGNvbnN0IHN0ZXBVcmwgPSB1cmxCdWlsZGVyLndpdGhCb29rbWFyayhtYXRjaGluZ05vZGUudHJhaWwpLmJ1aWxkKCk7XG4gICAgICAgICAgICBIaXN0b3J5LnJlcGxhY2VVcmwoc3RlcFVybCwgc3RlcFVybC50b1N0cmluZygpLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleGVjdXRlZEZ1bmN0aW9uUHJvbWlzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGhlRnVuY3Rpb24gXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgc3RhdGljIGdldE5vZGVCeUZ1bmN0aW9uKG5vZGUsIHRoZUZ1bmN0aW9uKSB7XG5cbiAgICAgICAgaWYgKHRoZUZ1bmN0aW9uID09PSBub2RlLmRlc3RpbmF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLm5leHQpIHtcbiAgICAgICAgICAgIGxldCBtYXRjaGluZ05vZGUgPSBudWxsO1xuICAgICAgICAgICAgbm9kZS5uZXh0LmZvckVhY2goKGNoaWxkTm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghbWF0Y2hpbmdOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nTm9kZSA9IFRyYWlsUHJvY2Vzc29yLmdldE5vZGVCeUZ1bmN0aW9uKGNoaWxkTm9kZSwgdGhlRnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKG1hdGNoaW5nTm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaGluZ05vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEBwYXJhbSB7YW55fSBvYmplY3QgXG4gICAgICogQHBhcmFtIHtUcmFpbE5vZGV9IG5vZGUgXG4gICAgICogQHBhcmFtIHtMaXN0PFN0cmluZz59IHRyYWlsU3RvcHNcbiAgICAgKiBAcmV0dXJucyB7TGlzdDxTdHJpbmc+fVxuICAgICAqL1xuICAgIHN0YXRpYyBjYWxsTWF0Y2hpbmdGdW5jdGlvbkZyb21VcmwodXJsLCBjdXJyZW50T2JqZWN0LCBub2RlLCB0cmFpbFN0b3BzID0gbmV3IExpc3QoKSkge1xuXG4gICAgICAgIGlmIChub2RlLnByb3BlcnR5KSB7XG4gICAgICAgICAgICBjdXJyZW50T2JqZWN0ID0gY3VycmVudE9iamVjdFtub2RlLnByb3BlcnR5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChTdHJpbmdVdGlscy5zdGFydHNXaXRoKHVybC5ib29rbWFyaywgVHJhaWxQcm9jZXNzb3IudG9TdGFydHNXaXRoKG5vZGUudHJhaWwpKSkge1xuICAgICAgICAgICAgdHJhaWxTdG9wcy5hZGQobm9kZS50cmFpbCk7XG4gICAgICAgICAgICBpZiAobm9kZS53YXlwb2ludCkge1xuICAgICAgICAgICAgICAgIG5vZGUud2F5cG9pbnQuY2FsbChjdXJyZW50T2JqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKHVybC5ib29rbWFyaywgbm9kZS50cmFpbCkpIHtcbiAgICAgICAgICAgIHRyYWlsU3RvcHMuYWRkKG5vZGUudHJhaWwpO1xuICAgICAgICAgICAgaWYgKG5vZGUuZGVzdGluYXRpb24pIHtcbiAgICAgICAgICAgICAgICBub2RlLmRlc3RpbmF0aW9uLmNhbGwoY3VycmVudE9iamVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5uZXh0KSB7XG4gICAgICAgICAgICBub2RlLm5leHQuZm9yRWFjaCgoY2hpbGROb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJhaWxTdG9wcyA9IFRyYWlsUHJvY2Vzc29yLmNhbGxNYXRjaGluZ0Z1bmN0aW9uRnJvbVVybCh1cmwsIGN1cnJlbnRPYmplY3QsIGNoaWxkTm9kZSwgdHJhaWxTdG9wcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cmFpbFN0b3BzO1xuICAgIH1cblxuICAgIHN0YXRpYyB0b1N0YXJ0c1dpdGgodHJhaWwpIHtcblxuICAgICAgICBpZiAobnVsbCA9PSB0cmFpbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiL1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFN0cmluZ1V0aWxzLm5vbk51bGxFcXVhbHModHJhaWwsIFwiL1wiKSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiL1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRyYWlsICsgXCIvXCI7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTWFwLCBMb2dnZXIsIFN0cmluZ1V0aWxzIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xuXG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJIdHRwQ2FsbEJ1aWxkZXJcIik7XG5cbmV4cG9ydCBjbGFzcyBIdHRwQ2FsbEJ1aWxkZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih1cmwpIHtcblxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMuYXV0aG9yaXphdGlvbiA9IG51bGw7XG5cblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy5zdWNjZXNzTWFwcGluZ01hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy5mYWlsTWFwcGluZ01hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge2Z1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLmVycm9yTWFwcGluZ0Z1bmN0aW9uID0gKGVycm9yKSA9PiB7IHJldHVybiBlcnJvcjsgfTtcblxuXG4gICAgICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUgPSA0MDAwO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICAgICAgICB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlID0gNDAwMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEByZXR1cm5zIHtIdHRwQ2FsbEJ1aWxkZXJ9XG4gICAgICovXG4gICAgc3RhdGljIG5ld0luc3RhbmNlKHVybCkge1xuICAgICAgICByZXR1cm4gbmV3IEh0dHBDYWxsQnVpbGRlcih1cmwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1hcHBlckZ1bmN0aW9uIG1hcHBlciBmdW5jdGlvbiB0byBwYXNzIHRoZSByZXN1bHQgb2JqZWN0IHRvXG4gICAgICovXG4gICAgc3VjY2Vzc01hcHBpbmcoY29kZSwgbWFwcGVyRnVuY3Rpb24gPSAoKSA9PiB7IHJldHVybiBudWxsOyB9KSB7XG4gICAgICAgIHRoaXMuc3VjY2Vzc01hcHBpbmdNYXAuc2V0KGNvZGUsIG1hcHBlckZ1bmN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGNvZGUgXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cbiAgICAgKi9cbiAgICBmYWlsTWFwcGluZyhjb2RlLCBtYXBwZXJGdW5jdGlvbiA9ICgpID0+IHsgcmV0dXJuIG51bGw7IH0pIHtcbiAgICAgICAgdGhpcy5mYWlsTWFwcGluZ01hcC5zZXQoY29kZSwgbWFwcGVyRnVuY3Rpb24pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtYXBwZXJGdW5jdGlvbiBtYXBwZXIgZnVuY3Rpb24gdG8gcGFzcyB0aGUgcmVzdWx0IG9iamVjdCB0b1xuICAgICAqL1xuICAgIGVycm9yTWFwcGluZyhtYXBwZXJGdW5jdGlvbikge1xuICAgICAgICB0aGlzLmVycm9yTWFwcGluZ0Z1bmN0aW9uID0gbWFwcGVyRnVuY3Rpb247XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpemF0aW9uIFxuICAgICAqL1xuICAgIGF1dGhvcml6YXRpb25IZWFkZXIoYXV0aG9yaXphdGlvbikge1xuICAgICAgICBpZiAoIVN0cmluZ1V0aWxzLmlzQmxhbmsoYXV0aG9yaXphdGlvbikpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0aG9yaXphdGlvbiA9IFwiQmVhcmVyIFwiICsgYXV0aG9yaXphdGlvbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25uZWN0aW9uVGltZW91dChjb25uZWN0aW9uVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSA9IGNvbm5lY3Rpb25UaW1lb3V0VmFsdWU7XG4gICAgfVxuXG4gICAgcmVzcG9uc2VUaW1lb3V0KHJlc3BvbnNlVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUgPSByZXNwb25zZVRpbWVvdXRWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBhc3luYyBnZXQoKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gQ2xpZW50LmdldCh0aGlzLnVybCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pO1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBhc3luYyBwb3N0KHBheWxvYWQpIHtcbiAgICAgICAgY29uc3QgcmVzcG9zbmUgPSBhd2FpdCBDbGllbnQucG9zdCh0aGlzLnVybCwgcGF5bG9hZCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pO1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3Bvc25lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBhc3luYyBwdXQocGF5bG9hZCkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IENsaWVudC5wdXQodGhpcy51cmwsIHBheWxvYWQsIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSwgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSwgdGhpcy5hdXRob3JpemF0aW9uKVxuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBhc3luYyBwYXRjaChwYXlsb2FkKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LnBhdGNoKHRoaXMudXJsLCBwYXlsb2FkLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbik7XG4gICAgICAgIHJldHVybiB0aGlzLmFzVHlwZU1hcHBlZFByb21pc2UocmVzcG9uc2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZSgpIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBDbGllbnQuZGVsZXRlKHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1Byb21pc2V9IGZldGNoUHJvbWlzZSBcbiAgICAgKi9cbiAgICBhc3luYyBhc1R5cGVNYXBwZWRQcm9taXNlKGZldGNoUHJvbWlzZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZmV0Y2hSZXNwb25zZSA9IGF3YWl0IGZldGNoUHJvbWlzZTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUZldGNoUmVzcG9uc2UoZmV0Y2hSZXNwb25zZSk7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIEFQSSBkaWQgbm90IGV4ZWN1dGVcbiAgICAgICAgICAgIHRocm93IHRoaXMuZXJyb3JNYXBwaW5nRnVuY3Rpb24oZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtSZXNwb25zZX0gZmV0Y2hSZXNwb25zZSBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlamVjdCBcbiAgICAgKi9cbiAgICBhc3luYyBoYW5kbGVGZXRjaFJlc3BvbnNlKGZldGNoUmVzcG9uc2UpIHtcbiAgICAgICAgY29uc3Qgc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyID0gdGhpcy5zdWNjZXNzTWFwcGluZ01hcC5nZXQoZmV0Y2hSZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICBjb25zdCBmYWlsUmVzcG9uc2VNYXBwZXIgPSB0aGlzLmZhaWxNYXBwaW5nTWFwLmdldChmZXRjaFJlc3BvbnNlLnN0YXR1cyk7XG5cbiAgICAgICAgLy8gRW1wdHkgcmVzcG9uc2VcbiAgICAgICAgaWYgKDIwNCA9PT0gZmV0Y2hSZXNwb25zZS5zdGF0dXMgfHwgZmV0Y2hSZXNwb25zZS5oZWFkZXJzLmdldChcIkNvbnRlbnQtTGVuZ3RoXCIpID09PSBcIjBcIikge1xuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NSZXNwb25zZU1hcHBlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzUmVzcG9uc2VNYXBwZXIobnVsbCk7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZmFpbFJlc3BvbnNlTWFwcGVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZmFpbFJlc3BvbnNlTWFwcGVyKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBtYXBwZXIgZm9yIHJldHVybiBzdGF0dXM6IFwiICsgZmV0Y2hSZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzdW1pbmcganNvbiByZXNwb25zZSAgICAgIFxuICAgICAgICB0cnkgeyAgXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZUpzb24gPSBhd2FpdCBmZXRjaFJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgIGlmIChzdWNjZXNzUmVzcG9uc2VNYXBwZXIpIHsgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3NSZXNwb25zZU1hcHBlcihyZXNwb25zZUpzb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZhaWxSZXNwb25zZU1hcHBlcikge1xuICAgICAgICAgICAgICAgIHRocm93IGZhaWxSZXNwb25zZU1hcHBlcihyZXNwb25zZUpzb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihyZXNwb25zZUpzb24pO1xuICAgICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBSZXNwb25zZSBkaWQgbm90IHByb3ZpZGUganNvblxuICAgICAgICAgICAgdGhyb3cgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMaXN0LCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkFic3RyYWN0VmFsaWRhdG9yXCIpO1xuXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0N1cnJlbnRseVZhbGlkXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgZW5hYmxlZCA9IHRydWUpIHtcbiAgICAgICAgdGhpcy52YWxpZExpc3RlbmVyTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMuaW52YWxpZExpc3RlbmVyTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBjdXJyZW50bHlWYWxpZDtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gZW5hYmxlZDtcbiAgICB9XG5cbiAgICBlbmFibGUoKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgdGhpcy52YWxpZCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbnZhbGlkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkaXNhYmxlKCkge1xuICAgICAgICBsZXQgd2FzVmFsaWQgPSB0aGlzLmN1cnJlbnRseVZhbGlkO1xuICAgICAgICAvLyBGYWtlIHZhbGlkXG4gICAgICAgIHRoaXMudmFsaWQoKTtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB3YXNWYWxpZDtcbiAgICB9XG5cbiAgICBpc1ZhbGlkKCkge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudGx5VmFsaWQ7XG4gICAgfVxuXG5cdHZhbGlkKCkge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB0cnVlO1xuICAgICAgICBpZighdGhpcy52YWxpZExpc3RlbmVyTGlzdCkge1xuICAgICAgICAgICAgTE9HLndhcm4oXCJObyB2YWxpZGF0aW9uIGxpc3RlbmVyc1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZhbGlkTGlzdGVuZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcblx0fVxuXG5cdGludmFsaWQoKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IGZhbHNlO1xuICAgICAgICBpZighdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0KSB7XG4gICAgICAgICAgICBMT0cud2FybihcIk5vIGludmFsaWRhdGlvbiBsaXN0ZW5lcnNcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcblx0fVxuXG5cdHZhbGlkU2lsZW50KCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gdHJ1ZTtcblx0fVxuXG5cdGludmFsaWRTaWxlbnQoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBmYWxzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIHtNZXRob2R9IHZhbGlkTGlzdGVuZXIgXG5cdCAqL1xuXHR3aXRoVmFsaWRMaXN0ZW5lcih2YWxpZExpc3RlbmVyKSB7XG5cdFx0dGhpcy52YWxpZExpc3RlbmVyTGlzdC5hZGQodmFsaWRMaXN0ZW5lcik7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7TWV0aG9kfSBpbnZhbGlkTGlzdGVuZXIgXG5cdCAqL1xuXHR3aXRoSW52YWxpZExpc3RlbmVyKGludmFsaWRMaXN0ZW5lcikge1xuXHRcdHRoaXMuaW52YWxpZExpc3RlbmVyTGlzdC5hZGQoaW52YWxpZExpc3RlbmVyKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59XG4iLCJpbXBvcnQgeyBMaXN0LCBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSAnLi9hYnN0cmFjdFZhbGlkYXRvci5qcyc7XG5cbmV4cG9ydCBjbGFzcyBBbmRWYWxpZGF0b3JTZXQgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cbiAgICBjb25zdHJ1Y3Rvcihpc1ZhbGlkRnJvbVN0YXJ0ID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIoaXNWYWxpZEZyb21TdGFydCk7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdFZhbGlkYXRvcn0gdmFsaWRhdG9yXG4gICAgICovXG4gICAgd2l0aFZhbGlkYXRvcih2YWxpZGF0b3IpIHtcbiAgICAgICAgdmFsaWRhdG9yLndpdGhWYWxpZExpc3RlbmVyKG5ldyBNZXRob2QodGhpcywgdGhpcy5vbmVWYWxpZCkpO1xuICAgICAgICB2YWxpZGF0b3Iud2l0aEludmFsaWRMaXN0ZW5lcihuZXcgTWV0aG9kKHRoaXMsIHRoaXMub25lSW52YWxpZCkpO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuYWRkKHZhbGlkYXRvcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgdmFsaWRcbiAgICAgKi9cbiAgICBvbmVWYWxpZCgpIHtcbiAgICAgICAgbGV0IGZvdW5kSW52YWxpZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XG4gICAgICAgICAgICBpZighdmFsdWUuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICAgICAgZm91bmRJbnZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGlmKCFmb3VuZEludmFsaWQpIHtcbiAgICAgICAgICAgIHN1cGVyLnZhbGlkKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdXBlci5pbnZhbGlkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbmUgdmFsaWRhdG9yIHNhaWQgaXQgd2FzIGludmFsaWRcbiAgICAgKi9cbiAgICBvbmVJbnZhbGlkKCkge1xuICAgICAgICBzdXBlci5pbnZhbGlkKCk7XG4gICAgfVxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcblxuZXhwb3J0IGNsYXNzIFJlZ2V4VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgcmVnZXggPSBcIiguKilcIikge1xuXHRcdHN1cGVyKGlzY3VycmVudGx5VmFsaWQpO1xuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xuICAgICAgICB0aGlzLnJlZ2V4ID0gcmVnZXg7XG4gICAgfVxuXG5cdHZhbGlkYXRlKHZhbHVlKXtcblx0XHRpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLm1hdGNoKHRoaXMucmVnZXgpKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZighdmFsdWUgJiYgIXRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHRcdHRoaXMudmFsaWQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLm1hdGNoKHRoaXMucmVnZXgpKXtcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZighdmFsdWUgJiYgIXRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHRcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG59XG4iLCJpbXBvcnQgeyBSZWdleFZhbGlkYXRvciB9IGZyb20gXCIuL3JlZ2V4VmFsaWRhdG9yLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBFbWFpbFZhbGlkYXRvciBleHRlbmRzIFJlZ2V4VmFsaWRhdG9yIHtcblxuICAgIHN0YXRpYyBnZXQgRU1BSUxfRk9STUFUKCkgeyByZXR1cm4gL15cXHcrKFtcXC4tXT9cXHcrKSpAXFx3KyhbXFwuLV0/XFx3KykqKFxcLlxcd3syLDN9KSskLzsgfVxuXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIEVtYWlsVmFsaWRhdG9yLkVNQUlMX0ZPUk1BVCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgeyBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIEVxdWFsc0Z1bmN0aW9uUmVzdWx0VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG5cdC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcblx0ICogQHBhcmFtIHtNZXRob2R9IGNvbXBhcmVkVmFsdWVGdW5jdGlvbiBcblx0ICovXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgY29tcGFyZWRWYWx1ZUZ1bmN0aW9uID0gbnVsbCkge1xuXHRcdHN1cGVyKGlzY3VycmVudGx5VmFsaWQpO1xuXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xuXG5cdFx0LyoqIEB0eXBlIHtNZXRob2R9ICovXG5cdFx0dGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24gPSBjb21wYXJlZFZhbHVlRnVuY3Rpb247XG5cdH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSB0aGlzLmNvbXBhcmVkVmFsdWVGdW5jdGlvbi5jYWxsKCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uLmNhbGwoKSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fVxuXHR9XG5cbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgeyBNZXRob2QsIFByb3BlcnR5QWNjZXNzb3IgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIEVxdWFsc1Byb3BlcnR5VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG5cdC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcblx0ICogQHBhcmFtIHtNZXRob2R9IGNvbXBhcmVkVmFsdWVGdW5jdGlvbiBcblx0ICovXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgbW9kZWwgPSBudWxsLCBhdHRyaWJ1dGVOYW1lID0gbnVsbCkge1xuXHRcdHN1cGVyKGlzY3VycmVudGx5VmFsaWQpO1xuXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xuXG5cdFx0LyoqIEB0eXBlIHtvYmplY3R9ICovXG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGVOYW1lO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCB0aGlzLmF0dHJpYnV0ZU5hbWUpKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIHRoaXMuYXR0cmlidXRlTmFtZSkpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHsgTWV0aG9kLCBQcm9wZXJ0eUFjY2Vzc29yIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBFcXVhbHNTdHJpbmdWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxuXHQgKiBAcGFyYW0ge01ldGhvZH0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxuXHQgKi9cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBjb250cm9sVmFsdWUgPSBudWxsKSB7XG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XG5cblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gY29udHJvbFZhbHVlO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gY29udHJvbFZhbHVlKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59IiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xuXG5cbmV4cG9ydCBjbGFzcyBOdW1iZXJWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XG5cbiAgICBzdGF0aWMgZ2V0IFBIT05FX0ZPUk1BVCgpIHsgcmV0dXJuIC9eXFxkKiQvOyB9XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgTnVtYmVyVmFsaWRhdG9yLlBIT05FX0ZPUk1BVCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBMaXN0LCBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSAnLi9hYnN0cmFjdFZhbGlkYXRvci5qcydcblxuZXhwb3J0IGNsYXNzIE9yVmFsaWRhdG9yU2V0IGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKGlzVmFsaWRGcm9tU3RhcnQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0ID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0VmFsaWRhdG9yfSB2YWxpZGF0b3JcbiAgICAgKi9cbiAgICB3aXRoVmFsaWRhdG9yKHZhbGlkYXRvcikge1xuICAgICAgICB2YWxpZGF0b3Iud2l0aFZhbGlkTGlzdGVuZXIobmV3IE1ldGhvZCh0aGlzLCB0aGlzLm9uZVZhbGlkKSk7XG4gICAgICAgIHZhbGlkYXRvci53aXRoSW52YWxpZExpc3RlbmVyKG5ldyBNZXRob2QodGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxuICAgICAqL1xuICAgIG9uZVZhbGlkKCkge1xuICAgICAgICBzdXBlci52YWxpZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxuICAgICAqL1xuICAgIG9uZUludmFsaWQoKSB7XG4gICAgICAgIGxldCBmb3VuZFZhbGlkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmKHZhbHVlLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIGZvdW5kVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgaWYoZm91bmRWYWxpZCkge1xuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuY29uc3QgUEFTU1dPUkRfRk9STUFUID0gL14oPz0uKltBLVphLXpdKSg/PS4qP1swLTldKSg/PS4qP1sjPyFAJCVeJiotXSkuezgsfSQvO1xuXG5leHBvcnQgY2xhc3MgUGFzc3dvcmRWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgUEFTU1dPUkRfRk9STUFUKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuZXhwb3J0IGNsYXNzIFBob25lVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xuXG4gICAgc3RhdGljIGdldCBQSE9ORV9GT1JNQVQoKSB7IHJldHVybiAvXlxcK1swLTldezJ9XFxzPyhbMC05XVxccz8pKiQvOyB9XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgUGhvbmVWYWxpZGF0b3IuUEhPTkVfRk9STUFUKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcblxuZXhwb3J0IGNsYXNzIFJlcXVpcmVkVmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG5cdGNvbnN0cnVjdG9yKGN1cnJlbnRseVZhbGlkID0gZmFsc2UsIGVuYWJsZWQgPSB0cnVlKSB7XG5cdFx0c3VwZXIoY3VycmVudGx5VmFsaWQsIGVuYWJsZWQpO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmKHZhbHVlID09PSBcIlwiKXtcblx0ICAgIFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYodmFsdWUgPT09IFwiXCIpe1xuXHQgICAgXHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59XG4iXSwibmFtZXMiOlsiTGlzdCIsIk1hcCIsIlN0cmluZ1V0aWxzIiwiQ29udGFpbmVyVXJsIiwiQ29udGFpbmVySHR0cENsaWVudCIsIkxPRyIsIkxvZ2dlciIsIkluamVjdGlvblBvaW50IiwiWG1sRWxlbWVudCIsIkNvbnRhaW5lckVsZW1lbnQiLCJYbWxDZGF0YSIsIk1ldGhvZCIsIkNvbnRhaW5lcldpbmRvdyIsIkRvbVRyZWUiLCJTaW5nbGV0b25Db25maWciLCJQcm90b3R5cGVDb25maWciLCJNaW5kaUluamVjdG9yIiwiTWluZGlDb25maWciLCJJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyIiwiQ29uZmlnQWNjZXNzb3IiLCJQcm9w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

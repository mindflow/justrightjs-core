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

const LOG$b = new coreutil_v1.Logger("StylesRegistry");

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
        LOG$b.info("Loading styles " + name + " at " + url.toString());

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

const LOG$a = new coreutil_v1.Logger("TemplateRegistry");

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
        LOG$a.info("Loading template " + name + " at " + url.toString());
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

const LOG$9 = new coreutil_v1.Logger("ElementUtils");

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
        LOG$9.error("Unrecognized value for Element");
        LOG$9.error(value);
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

const LOG$8 = new coreutil_v1.Logger("BaseElement");

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
        LOG$8.warn("No valid input to set the element");
        LOG$8.warn(input);
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
        LOG$8.warn("No valid input to add the element");
        LOG$8.warn(input);
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
        LOG$8.warn("No valid input to prepend the element");
        LOG$8.warn(input);
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

const LOG$7 = new coreutil_v1.Logger("CanvasStyles");

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
            LOG$7.error("Style does not exist: " + name);
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
            LOG$7.error("Style does not exist: " + name);
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

const LOG$6 = new coreutil_v1.Logger("ComponentFactory");

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
            LOG$6.error(this.templateRegistry);
            console.trace();
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
                if (target[prop] === value) {
                    return true;
                }
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

const LOG$5 = new coreutil_v1.Logger("LoaderInterceptor");

class LoaderInterceptor {

    /**
     * @returns {Boolean}
     */
    process() {
        LOG$5.info("Unimplemented Loader Interceptor breaks by default");
        return false;
    }

}

const LOG$4 = new coreutil_v1.Logger("ModuleLoader");

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
            LOG$4.error("Url is null");
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
            LOG$4.warn("Filter rejected " + reason);
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

const LOG$3 = new coreutil_v1.Logger("DiModuleLoader");

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
            LOG$3.warn("Module loader failed " + reason);
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

const LOG$2 = new coreutil_v1.Logger("Application");

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
        LOG$2.info("Running Application");
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
            LOG$2.error(error);
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
            LOG$2.info(this.config.configEntries);
        };
    }

    /**
     * Enable global access to template registry
     */
    windowTemplateRegistry() {
        window.templateRegistry = () => {
            LOG$2.info(mindi_v1.ConfigAccessor.instanceHolder(TemplateRegistry.name, this.config).instance);
        };
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            LOG$2.info(mindi_v1.ConfigAccessor.instanceHolder(StylesRegistry.name, this.config).instance);
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

const LOG$1 = new coreutil_v1.Logger("EventManager");

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
        if (!eventType) {
            LOG$1.error("Event type is undefined");
            return;
        }
        if (!this.listenerMap.contains(eventType)) {
            return;
        }
        let resultArray = [];
        this.listenerMap.get(eventType).forEach((listener, parent) => {
            resultArray.push(listener.call(parameter));
            return true;
        });
        if (resultArray.length === 1) {
            return resultArray[0];
        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvbW9kdWxlUnVubmVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL3VybC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC91cmxVdGlscy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi9oaXN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL3VybEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L25hdmlnYXRpb24vbmF2aWdhdGlvbi5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvYWN0aXZlTW9kdWxlUnVubmVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jbGllbnQvY2xpZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVzLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC90ZW1wbGF0ZS90ZW1wbGF0ZXNMb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNMb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRDb25maWdQcm9jZXNzb3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC91bmlxdWVJZFJlZ2lzdHJ5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2F0dHJpYnV0ZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29uZmlnL2NvbmZpZ3VyZWRGdW5jdGlvbi5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9tYXBwZWRIdG1sRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9lbGVtZW50VXRpbHMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvYmFzZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvYWJzdHJhY3RJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvcmFkaW9JbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvY2hlY2tib3hJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdGV4dElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0YXJlYUlucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0bm9kZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvc2ltcGxlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9mb3JtRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC92aWRlb0VsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvZWxlbWVudE1hcHBlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2VsZW1lbnRSZWdpc3RyYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZXZlbnQvZXZlbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNSb290LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9odG1sL2h0bWwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNTdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdGF0ZS9zdGF0ZU1hbmFnZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbmZpZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbG9hZGVyL2xvYWRlckludGVyY2VwdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbW9kdWxlTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9tYWluLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvZGlNb2R1bGVMb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2FwcGxpY2F0aW9uLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9kYXRhQmluZC9pbnB1dEVsZW1lbnREYXRhQmluZGluZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZGF0YUJpbmQvcHJveHlPYmplY3RGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudEZpbHRlcmVkTWV0aG9kLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudE1hbmFnZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2h0bWwvY3NzLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9odG1sL3N0eWxlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9uYXZpZ2F0aW9uL3RyYWlsTm9kZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi90cmFpbFByb2Nlc3Nvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9odHRwQ2FsbEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9hYnN0cmFjdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlZ2V4VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZW1haWxWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9hbmRWYWxpZGF0b3JTZXQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNQcm9wZXJ0eVZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VxdWFsc0Z1bmN0aW9uUmVzdWx0VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzU3RyaW5nVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvbnVtYmVyVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3Ivb3JWYWxpZGF0b3JTZXQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9wYXNzd29yZFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bob25lbFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlcXVpcmVkVmFsaWRhdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBNb2R1bGVSdW5uZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICAgcnVuTW9kdWxlKHVybCkge1xuICAgICB9XG5cbn0iLCJpbXBvcnQge0xpc3QsIE1hcCwgU3RyaW5nVXRpbHN9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgVXJse1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBob3N0IFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwb3J0IFxuICAgICAqIEBwYXJhbSB7TGlzdH0gcGF0aFZhbHVlTGlzdCBcbiAgICAgKiBAcGFyYW0ge01hcH0gcGFyYW1ldGVyVmFsdWVNYXAgXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGJvb2ttYXJrIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByb3RvY29sLCBob3N0LCBwb3J0LCBwYXRoVmFsdWVMaXN0LCBwYXJhbWV0ZXJWYWx1ZU1hcCwgYm9va21hcmspe1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xuICAgICAgICB0aGlzLnByb3RvY29sU3RyaW5nID0gcHJvdG9jb2w7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMuaG9zdFN0cmluZyA9IGhvc3Q7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMucG9ydFN0cmluZyA9IHBvcnQ7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xuICAgICAgICB0aGlzLnBhdGhWYWx1ZUxpc3QgPSBwYXRoVmFsdWVMaXN0O1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnBhcmFtZXRlclZhbHVlTWFwID0gcGFyYW1ldGVyVmFsdWVNYXA7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMuYm9va21hcmtTdHJpbmcgPSBib29rbWFyaztcbiAgICAgICAgXG4gICAgICAgIGlmICghdGhpcy5wYXRoVmFsdWVMaXN0KSB7XG4gICAgICAgICAgICB0aGlzLnBhdGhWYWx1ZUxpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5wYXJhbWV0ZXJWYWx1ZU1hcCkge1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJWYWx1ZU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldCBwcm90b2NvbCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wcm90b2NvbFN0cmluZztcbiAgICB9XG5cbiAgICBnZXQgaG9zdCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ob3N0U3RyaW5nO1xuICAgIH1cblxuICAgIGdldCBwb3J0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBvcnRTdHJpbmc7XG4gICAgfVxuXG4gICAgZ2V0IHBhdGhzTGlzdCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wYXRoVmFsdWVMaXN0O1xuICAgIH1cblxuICAgIGdldCBib29rbWFyaygpe1xuICAgICAgICByZXR1cm4gdGhpcy5ib29rbWFya1N0cmluZztcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1ldGVyTWFwKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJhbWV0ZXJWYWx1ZU1hcDtcbiAgICB9XG5cbiAgICBnZXRQYXRoUGFydChpbmRleCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhWYWx1ZUxpc3QuZ2V0KGluZGV4KTtcbiAgICB9XG5cbiAgICByZXBsYWNlUGF0aFZhbHVlKGZyb20sIHRvKXtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMucGF0aFZhbHVlTGlzdC5zaXplKCkpIHtcbiAgICAgICAgICAgIGlmIChTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKGZyb20sIHRoaXMucGF0aFZhbHVlTGlzdC5nZXQoaSkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoVmFsdWVMaXN0LnNldChpLCB0byk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpICsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBwYXRoKCl7XG4gICAgICAgIGxldCBwYXRoID0gXCIvXCI7XG4gICAgICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgICAgIHRoaXMucGF0aFZhbHVlTGlzdC5mb3JFYWNoKCh2YWx1ZSA9PiB7XG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGggKyBcIi9cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXRoICsgdmFsdWU7XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9KSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIGdldFBhcmFtZXRlcihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyTWFwLmdldChrZXkpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHZhciB2YWx1ZSA9IFwiXCI7XG4gICAgICAgIGlmKHRoaXMucHJvdG9jb2wgIT09IG51bGwpe1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIHRoaXMucHJvdG9jb2wgKyBcIi8vXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5ob3N0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyB0aGlzLmhvc3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5wb3J0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIjpcIiArIHRoaXMucG9ydDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGF0aFZhbHVlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHBhdGhQYXJ0LHBhcmVudCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCIvXCIgKyBwYXRoUGFydDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgIHZhciBmaXJzdFBhcmFtZXRlciA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAuZm9yRWFjaChmdW5jdGlvbihwYXJhbWV0ZXJLZXkscGFyYW1ldGVyVmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIGlmKGZpcnN0UGFyYW1ldGVyKXtcbiAgICAgICAgICAgICAgICBmaXJzdFBhcmFtZXRlcj1mYWxzZTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI/XCI7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCImXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgZW5jb2RlVVJJKHBhcmFtZXRlcktleSkgKyBcIj1cIiArIGVuY29kZVVSSShwYXJhbWV0ZXJWYWx1ZSk7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgaWYodGhpcy5ib29rbWFyayAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIFwiI1wiICsgdGhpcy5ib29rbWFyaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBMaXN0LCBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuL3VybC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVXJsVXRpbHMge1xuXG4gICAgLyoqXG4gICAgICogUGFyc2Ugc3RyaW5nIHRvIHVybFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmxTdHJpbmcgXG4gICAgICogQHJldHVybnMge1VybH1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2UodXJsU3RyaW5nKSB7XG4gICAgICAgIFxuICAgICAgICBsZXQgcmVtYWluaW5nID0geyBcInN0cmluZ1wiIDogdXJsU3RyaW5nIH07XG5cbiAgICAgICAgaWYgKHVybFN0cmluZyA9PT0gbnVsbCkgeyByZXR1cm4gbnVsbDsgfVxuXG4gICAgICAgIGNvbnN0IHByb3RvY29sID0gICAgICBVcmxVdGlscy5kZXRlcm1pbmVQcm90b2NvbChyZW1haW5pbmcpO1xuICAgICAgICBjb25zdCBob3N0QW5kUG9ydCA9ICAgVXJsVXRpbHMuZGV0ZXJtaW5lSG9zdEFuZFBvcnQocmVtYWluaW5nKTtcbiAgICAgICAgY29uc3QgaG9zdCA9ICAgICAgICAgIFVybFV0aWxzLmV4dHJhY3RIb3N0KGhvc3RBbmRQb3J0KTtcbiAgICAgICAgY29uc3QgcG9ydCA9ICAgICAgICAgIFVybFV0aWxzLmV4dHJhY3RQb3J0KGhvc3RBbmRQb3J0KTtcbiAgICAgICAgY29uc3QgcGF0aHNMaXN0ID0gICAgIFVybFV0aWxzLmRldGVybWluZVBhdGgocmVtYWluaW5nKTtcbiAgICAgICAgY29uc3QgcGFyYW1ldGVyc01hcCA9IFVybFV0aWxzLmRldGVybWluZVBhcmFtZXRlcnMocmVtYWluaW5nKTtcbiAgICAgICAgY29uc3QgYm9va21hcmsgPSAgICAgIFVybFV0aWxzLmRldGVybWluZUJvb2ttYXJrKHJlbWFpbmluZyk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBVcmwocHJvdG9jb2wsIGhvc3QsIHBvcnQsIHBhdGhzTGlzdCwgcGFyYW1ldGVyc01hcCwgYm9va21hcmspO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVQcm90b2NvbChyZW1haW5pbmcpe1xuICAgICAgICBsZXQgdmFsdWUgPSByZW1haW5pbmdbXCJzdHJpbmdcIl07XG5cbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcHJvdG9jb2wgPSB2YWx1ZTtcblxuICAgICAgICBpZiAodmFsdWUuaW5kZXhPZihcIi8vXCIpID09PSAtMSl7XG4gICAgICAgICAgICAvLyBObyAnLy8nIHRvIGluZGljYXRlIHByb3RvY29sIFxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFydHMgPSB2YWx1ZS5zcGxpdChcIi8vXCIpO1xuICAgICAgICBpZihwYXJ0c1swXS5pbmRleE9mKFwiL1wiKSAhPT0gLTEpe1xuICAgICAgICAgICAgLy8gc2xhc2ggc2hvdWxkIG5vdCBiZSBpbiBwcm90b2NvbFxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBwcm90b2NvbCA9IHBhcnRzWzBdO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoID09IDEpe1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IHZhbHVlLnJlcGxhY2UocGFydHNbMF0gKyBcIi8vXCIsIFwiXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb3RvY29sO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVIb3N0QW5kUG9ydChyZW1haW5pbmcpe1xuICAgICAgICBsZXQgdmFsdWUgPSByZW1haW5pbmdbXCJzdHJpbmdcIl07XG5cbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaG9zdEFuZFBvcnQgPSB2YWx1ZTtcbiAgICAgICAgbGV0IHJlbWFpbmluZ1N0cmluZyA9IG51bGw7XG5cbiAgICAgICAgaWYgKGhvc3RBbmRQb3J0LmluZGV4T2YoXCIvXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgLy8gSG9zdCBjb21lcyBiZWZvcmUgdGhlIGZpcnN0ICcvJ1xuICAgICAgICAgICAgaG9zdEFuZFBvcnQgPSBob3N0QW5kUG9ydC5zcGxpdChcIi9cIilbMF07XG4gICAgICAgICAgICByZW1haW5pbmdTdHJpbmcgPSB2YWx1ZS5yZXBsYWNlKGhvc3RBbmRQb3J0ICsgXCIvXCIsIFwiXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gcmVtYWluaW5nU3RyaW5nO1xuICAgICAgICByZXR1cm4gaG9zdEFuZFBvcnQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGV4dHJhY3RIb3N0KGhvc3RBbmRQb3J0KXtcbiAgICAgICAgaWYgKCFob3N0QW5kUG9ydCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaG9zdEFuZFBvcnQuaW5kZXhPZihcIjpcIikgPT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiBob3N0QW5kUG9ydDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaG9zdEFuZFBvcnQuc3BsaXQoXCI6XCIpWzBdO1xuICAgIH1cblxuICAgIHN0YXRpYyBleHRyYWN0UG9ydChob3N0QW5kUG9ydCl7XG4gICAgICAgIGlmICghaG9zdEFuZFBvcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmKGhvc3RBbmRQb3J0LmluZGV4T2YoXCI6XCIpID09PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaG9zdEFuZFBvcnQuc3BsaXQoXCI6XCIpWzFdO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVQYXRoKHJlbWFpbmluZyl7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJlbWFpbmluZ1tcInN0cmluZ1wiXTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IExpc3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXRoID0gdmFsdWU7XG5cbiAgICAgICAgaWYgKHBhdGguaW5kZXhPZihcIj9cIikgIT09IC0xKXtcbiAgICAgICAgICAgIGxldCBwYXJ0cyA9IHBhdGguc3BsaXQoXCI/XCIpO1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBwYXRoLnN1YnN0cmluZyhwYXRoLmluZGV4T2YoXCI/XCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXJ0c1swXTtcblxuICAgICAgICB9IGVsc2UgaWYgKHBhdGguaW5kZXhPZihcIiNcIikgIT09IC0xKXtcbiAgICAgICAgICAgIGxldCBwYXJ0cyA9IHBhdGguc3BsaXQoXCIjXCIpO1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBwYXRoLnN1YnN0cmluZyhwYXRoLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXJ0c1swXTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYXRoLnN0YXJ0c1dpdGgoXCIvXCIpKSB7XG4gICAgICAgICAgICBwYXRoID0gdmFsdWUuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmF3UGF0aFBhcnRMaXN0ID0gbmV3IExpc3QocGF0aC5zcGxpdChcIi9cIikpO1xuXG4gICAgICAgIGNvbnN0IHBhdGhWYWx1ZUxpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICByYXdQYXRoUGFydExpc3QuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHBhdGhWYWx1ZUxpc3QuYWRkKGRlY29kZVVSSSh2YWx1ZSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBwYXRoVmFsdWVMaXN0O1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVQYXJhbWV0ZXJzKHJlbWFpbmluZyl7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcmVtYWluaW5nW1wic3RyaW5nXCJdO1xuXG4gICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWFwKCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFyYW1ldGVycyA9IHZhbHVlO1xuXG4gICAgICAgIGlmKHBhcmFtZXRlcnMuaW5kZXhPZihcIj9cIikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hcCgpO1xuICAgICAgICB9XG4gICAgICAgIHBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzLnN1YnN0cmluZyhwYXJhbWV0ZXJzLmluZGV4T2YoXCI/XCIpKzEpO1xuICAgICAgICBpZihwYXJhbWV0ZXJzLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gcGFyYW1ldGVycy5zdWJzdHJpbmcocGFyYW1ldGVycy5pbmRleE9mKFwiI1wiKSk7XG4gICAgICAgICAgICBwYXJhbWV0ZXJzID0gcGFyYW1ldGVycy5zdWJzdHJpbmcoMCxwYXJhbWV0ZXJzLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYXJhbWV0ZXJQYXJ0TGlzdCA9IG5ldyBMaXN0KHBhcmFtZXRlcnMuc3BsaXQoXCImXCIpKTtcbiAgICAgICAgY29uc3QgcGFyYW1ldGVyTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICBwYXJhbWV0ZXJQYXJ0TGlzdC5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgbGV0IGtleVZhbHVlID0gdmFsdWUuc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgaWYoa2V5VmFsdWUubGVuZ3RoID49IDIpe1xuICAgICAgICAgICAgICAgIHBhcmFtZXRlck1hcC5zZXQoZGVjb2RlVVJJKGtleVZhbHVlWzBdKSxkZWNvZGVVUkkoa2V5VmFsdWVbMV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICByZXR1cm4gcGFyYW1ldGVyTWFwO1xuICAgIH1cblxuICAgIHN0YXRpYyBkZXRlcm1pbmVCb29rbWFyayhyZW1haW5pbmcpe1xuICAgICAgICBsZXQgdmFsdWUgPSByZW1haW5pbmdbXCJzdHJpbmdcIl07XG5cbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gbnVsbDtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGJvb2ttYXJrID0gdmFsdWU7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgYm9va21hcmsgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikrMSk7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBib29rbWFyaztcbiAgICB9XG5cblxufSIsImltcG9ydCB7IENvbnRhaW5lclVybCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IFVybFV0aWxzIH0gZnJvbSBcIi4uL3V0aWwvdXJsVXRpbHMuanNcIjtcblxuZXhwb3J0IGNsYXNzIEhpc3Rvcnkge1xuXG4gICAgc3RhdGljIHJlcGxhY2VVcmwodXJsLCB0aXRsZSwgc3RhdGVPYmplY3QpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLnJlcGxhY2VVcmwodXJsLnRvU3RyaW5nKCksIHRpdGxlLCBzdGF0ZU9iamVjdCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHB1c2hVcmwodXJsLCB0aXRsZSwgc3RhdGVPYmplY3QpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLnB1c2hVcmwodXJsLnRvU3RyaW5nKCksIHRpdGxlLCBzdGF0ZU9iamVjdCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGN1cnJlbnRVcmwoKSB7XG4gICAgICAgIHJldHVybiBVcmxVdGlscy5wYXJzZShDb250YWluZXJVcmwuY3VycmVudFVybCgpKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMaXN0LCBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuL3VybC5qc1wiO1xuaW1wb3J0IHsgVXJsVXRpbHMgfSBmcm9tIFwiLi91cmxVdGlscy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVXJsQnVpbGRlciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaG9zdCA9IG51bGw7XG4gICAgICAgIHRoaXMucG9ydCA9IG51bGw7XG4gICAgICAgIHRoaXMucGF0aHNMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmJvb2ttYXJrID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICBzdGF0aWMgYnVpbGRlcigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVcmxCdWlsZGVyKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICAgd2l0aFVybCh1cmwpIHtcbiAgICAgICAgdGhpcy53aXRoQWxsT2ZVcmwoVXJsVXRpbHMucGFyc2UodXJsKSlcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICAgd2l0aFJvb3RPZlVybCh1cmwpIHtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IHVybC5wcm90b2NvbDtcbiAgICAgICAgdGhpcy5wb3J0ID0gdXJsLnBvcnQ7XG4gICAgICAgIHRoaXMuaG9zdCA9IHVybC5ob3N0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgICB3aXRoUGF0aE9mVXJsKHVybCkge1xuICAgICAgICB0aGlzLndpdGhSb290T2ZVcmwodXJsKTtcbiAgICAgICAgdGhpcy5wYXRoc0xpc3QgPSB1cmwucGF0aHNMaXN0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhBbGxPZlVybCh1cmwpIHtcbiAgICAgICAgdGhpcy53aXRoUGF0aE9mVXJsKHVybCk7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyc01hcCA9IHVybC5wYXJhbWV0ZXJNYXA7XG4gICAgICAgIHRoaXMuYm9va21hcmsgPSB1cmwuYm9va21hcms7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwcm90b2NvbCBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICB3aXRoUHJvdG9jb2wocHJvdG9jb2wpIHtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IFVybFV0aWxzLmRldGVybWluZVBhdGgoeyBcInN0cmluZ1wiIDogcHJvdG9jb2wgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBob3N0IFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhIb3N0KGhvc3QpIHtcbiAgICAgICAgdGhpcy5ob3N0ID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aCh7IFwic3RyaW5nXCIgOiBob3N0IH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICB3aXRoUGF0aChwYXRoKSB7XG4gICAgICAgIHRoaXMucGF0aHNMaXN0ID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aCh7IFwic3RyaW5nXCIgOiBwYXRoIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1ldGVycyBcbiAgICAgKiBAcmV0dXJucyB7VXJsQnVpbGRlcn1cbiAgICAgKi9cbiAgICB3aXRoUGFyYW1ldGVycyhwYXJhbWV0ZXJzKSB7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyc01hcCA9IFVybFV0aWxzLmRldGVybWluZVBhdGgoeyBcInN0cmluZ1wiIDogcGFyYW1ldGVycyB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGJvb2ttYXJrIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhCb29rbWFyayhib29rbWFyaykge1xuICAgICAgICB0aGlzLmJvb2ttYXJrID0gVXJsVXRpbHMuZGV0ZXJtaW5lQm9va21hcmsoeyBcInN0cmluZ1wiIDogYm9va21hcmsgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGJ1aWxkKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVybCh0aGlzLnByb3RvY29sLCB0aGlzLmhvc3QsIHRoaXMucG9ydCwgdGhpcy5wYXRoc0xpc3QsIHRoaXMucGFyYW1ldGVyc01hcCwgdGhpcy5ib29rbWFyayk7XG4gICAgfVxufSIsImltcG9ydCB7IEhpc3RvcnkgfSBmcm9tIFwiLi9oaXN0b3J5LmpzXCI7XG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcbmltcG9ydCB7IENvbnRhaW5lclVybCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IFVybEJ1aWxkZXIgfSBmcm9tIFwiLi4vdXRpbC91cmxCdWlsZGVyLmpzXCI7XG5cbmxldCBuYXZpZ2F0b2lvbiA9IG51bGw7XG5cbmV4cG9ydCBjbGFzcyBOYXZpZ2F0aW9uIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge05hdmlnYXRpb259XG4gICAgICovXG4gICAgc3RhdGljIGluc3RhbmNlKCkge1xuICAgICAgICBpZiAoIW5hdmlnYXRvaW9uKSB7XG4gICAgICAgICAgICBuYXZpZ2F0b2lvbiA9IG5ldyBOYXZpZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hdmlnYXRvaW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5hdmlnYXRlIGJyb3dzZXIgdG8gbmV3IHVybFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgZ28odXJsKSB7XG4gICAgICAgIENvbnRhaW5lclVybC5nbyh1cmwudG9TdHJpbmcoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTmF2aWdhdGUgYnJvd3NlciBiYWNrXG4gICAgICovXG4gICAgYmFjaygpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLmJhY2soKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHBhdGggd2l0aG91dCByZW5hdmlnYXRpbmcgYnJvd3NlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gICAgICogQHJldHVybnMge1VybH1cbiAgICAgKi9cbiAgICBsb2FkKHBhdGgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gSGlzdG9yeS5jdXJyZW50VXJsKCk7XG4gICAgICAgIGNvbnN0IG5ld1VybCA9IFVybEJ1aWxkZXIuYnVpbGRlcigpLndpdGhSb290T2ZVcmwodXJsKS53aXRoUGF0aChwYXRoKS5idWlsZCgpO1xuICAgICAgICBIaXN0b3J5LnB1c2hVcmwobmV3VXJsKTtcbiAgICAgICAgcmV0dXJuIG5ld1VybDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBNb2R1bGVSdW5uZXIgfSBmcm9tIFwiLi9tb2R1bGVSdW5uZXIuanNcIjtcbmltcG9ydCB7IE5hdmlnYXRpb24gfSBmcm9tIFwiLi9uYXZpZ2F0aW9uL25hdmlnYXRpb24uanNcIjtcblxubGV0IGFjdGl2ZU1vZHVsZVJ1bm5lciA9IG51bGw7XG5cbmV4cG9ydCBjbGFzcyBBY3RpdmVNb2R1bGVSdW5uZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNb2R1bGVSdW5uZXJ9ICovXG4gICAgICAgIHRoaXMubW9kdWxlUnVubmVyID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7QWN0aXZlTW9kdWxlUnVubmVyfVxuICAgICAqL1xuICAgIHN0YXRpYyBpbnN0YW5jZSgpIHtcbiAgICAgICAgaWYgKCFhY3RpdmVNb2R1bGVSdW5uZXIpIHtcbiAgICAgICAgICAgIGFjdGl2ZU1vZHVsZVJ1bm5lciA9IG5ldyBBY3RpdmVNb2R1bGVSdW5uZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aXZlTW9kdWxlUnVubmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TW9kdWxlUnVubmVyfSBuZXdNb2R1bGVSdW5uZXIgXG4gICAgICovXG4gICAgc2V0KG5ld01vZHVsZVJ1bm5lcikge1xuICAgICAgICB0aGlzLm1vZHVsZVJ1bm5lciA9IG5ld01vZHVsZVJ1bm5lcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHBhdGggd2l0aG91dCByZW5hdmlnYXRpbmcgYnJvd3NlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFxuICAgICAqL1xuICAgICBhc3luYyBsb2FkKHBhdGgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gTmF2aWdhdGlvbi5pbnN0YW5jZSgpLmxvYWQocGF0aCk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm1vZHVsZVJ1bm5lci5ydW5Nb2R1bGUodXJsKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgQ29udGFpbmVySHR0cENsaWVudCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcblxuZXhwb3J0IGNsYXNzIENsaWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0KHVybCwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgcG9zdCh1cmwsIGRhdGEsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCwgYXV0aG9yaXphdGlvbiA9IG51bGwpe1xuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiBcImZvbGxvd1wiLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgcHV0KHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsIFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JywgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XG4gICAgICovXG4gICAgc3RhdGljIHBhdGNoKHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BBVENIJywgXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZGVsZXRlKHVybCwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwKXtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldEhlYWRlcihhdXRob3JpemF0aW9uID0gbnVsbCkge1xuICAgICAgICBsZXQgaGVhZGVycyA9IHtcbiAgICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBcIk1vemlsbGEvNC4wIE1ETiBFeGFtcGxlXCIsXG4gICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICB9O1xuICAgICAgICBpZiAoYXV0aG9yaXphdGlvbikge1xuICAgICAgICAgICAgaGVhZGVycyA9IHtcbiAgICAgICAgICAgICAgICBcInVzZXItYWdlbnRcIjogXCJNb3ppbGxhLzQuMCBNRE4gRXhhbXBsZVwiLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBhdXRob3JpemF0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhlYWRlcnM7XG4gICAgfVxufSIsImV4cG9ydCBjbGFzcyBTdHlsZXN7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3R5bGVzU291cmNlIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHN0eWxlc1NvdXJjZSl7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzU291cmNlID0gc3R5bGVzU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0U3R5bGVzU291cmNlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc1NvdXJjZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgTWFwLCBMb2dnZXIsIE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgVXJsVXRpbHMgfSBmcm9tIFwiLi4vdXRpbC91cmxVdGlscy5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzIH0gZnJvbSBcIi4vc3R5bGVzLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJTdHlsZXNSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIFN0eWxlc1JlZ2lzdHJ5IHtcblxuICAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnN0eWxlc01hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy5zdHlsZXNVcmxNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xuICAgICAgICB0aGlzLnN0eWxlc1F1ZXVlU2l6ZSA9IDA7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNZXRob2R9ICovXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7U3R5bGVzfSBzdHlsZXMgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBzZXQobmFtZSxzdHlsZXMsdXJsKXtcbiAgICAgICAgaWYodXJsICE9PSB1bmRlZmluZWQgJiYgdXJsICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnN0eWxlc1VybE1hcC5zZXQobmFtZSwgdXJsKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnN0eWxlc01hcC5zZXQobmFtZSwgc3R5bGVzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKi9cbiAgICBnZXQobmFtZSl7XG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc01hcC5nZXQobmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICovXG4gICAgY29udGFpbnMobmFtZSl7XG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc01hcC5jb250YWlucyhuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgZG9uZShjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3R5bGVzUmVnaXN0cnl9IHJlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGRvQ2FsbGJhY2socmVnaXN0cnkpe1xuICAgICAgICBpZih0bW8uY2FsbGJhY2sgIT09IG51bGwgJiYgcmVnaXN0cnkuY2FsbGJhY2sgIT09IHVuZGVmaW5lZCAgJiYgcmVnaXN0cnkuc3R5bGVzUXVldWVTaXplID09PSByZWdpc3RyeS5zdHlsZXNNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBDYWxsYmFjay5jYWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgICBhc3luYyBsb2FkKG5hbWUsIHVybCkge1xuICAgICAgICB0aGlzLnN0eWxlc1F1ZXVlU2l6ZSArKztcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBDbGllbnQuZ2V0KHVybCk7XG4gICAgICAgIGlmKCFyZXNwb25zZS5vayl7XG4gICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHN0eWxlcyBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgdGhpcy5zZXQobmFtZSwgbmV3IFN0eWxlcyh0ZXh0KSwgdXJsKTtcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRTdHlsZXNMb2FkZWRQcm9taXNlKG5hbWVVcmxNYXApIHtcbiAgICAgICAgXG4gICAgICAgIGlmKCFuYW1lVXJsTWFwIHx8IG5hbWVVcmxNYXAuc2l6ZSgpID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGxldCBsb2FkUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgbmFtZVVybE1hcC5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnRhaW5zKGtleSkpe1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsb2FkUHJvbWlzZXMucHVzaCh0aGlzLnByaXZhdGVMb2FkKGtleSwgVXJsVXRpbHMucGFyc2UodmFsdWUpKSk7XG4gICAgICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKGxvYWRQcm9taXNlcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBhc3luYyBwcml2YXRlTG9hZChuYW1lLCB1cmwpIHtcbiAgICAgICAgTE9HLmluZm8oXCJMb2FkaW5nIHN0eWxlcyBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybC50b1N0cmluZygpKTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IENsaWVudC5nZXQodXJsKTtcbiAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcbiAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgc3R5bGVzIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICBjb25zdCBzdHlsZXMgPSBuZXcgU3R5bGVzKHRleHQpO1xuICAgICAgICB0aGlzLnNldChuYW1lLCBzdHlsZXMsIHVybCk7XG4gICAgICAgIHJldHVybiBzdHlsZXM7XG4gICAgfVxufSIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRle1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRlbXBsYXRlU291cmNlIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRlbXBsYXRlU291cmNlKXtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVNvdXJjZSA9IHRlbXBsYXRlU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0VGVtcGxhdGVTb3VyY2UoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVTb3VyY2U7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TWFwLCBMb2dnZXIsIE1ldGhvZH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1RlbXBsYXRlfSBmcm9tIFwiLi90ZW1wbGF0ZS5qc1wiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgVXJsVXRpbHMgfSBmcm9tIFwiLi4vdXRpbC91cmxVdGlscy5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiVGVtcGxhdGVSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlUXVldWVTaXplID0gMDtcblxuICAgICAgICAvKiogQHR5cGUge01ldGhvZH0gKi9cbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVByZWZpeCBcbiAgICAgKi9cbiAgICBzZXRMYW5ndWFnZVByZWZpeChsYW5ndWFnZVByZWZpeCkge1xuICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ID0gbGFuZ3VhZ2VQcmVmaXg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZX0gdGVtcGxhdGUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBzZXQobmFtZSx0ZW1wbGF0ZSx1cmwpe1xuICAgICAgICBpZih1cmwgIT09IHVuZGVmaW5lZCAmJiB1cmwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAuc2V0KG5hbWUsIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50ZW1wbGF0ZU1hcC5zZXQobmFtZSwgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGdldChuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVNYXAuZ2V0KG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGNvbnRhaW5zKG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZU1hcC5jb250YWlucyhuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgZG9uZShjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGVSZWdpc3RyeX0gcmVnaXN0cnkgXG4gICAgICovXG4gICAgZG9DYWxsYmFjayhyZWdpc3RyeSl7XG4gICAgICAgIGlmKHRtby5jYWxsYmFjayAhPT0gbnVsbCAmJiByZWdpc3RyeS5jYWxsYmFjayAhPT0gdW5kZWZpbmVkICAmJiByZWdpc3RyeS50ZW1wbGF0ZVF1ZXVlU2l6ZSA9PT0gcmVnaXN0cnkudGVtcGxhdGVNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBDYWxsYmFjay5jYWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGFzeW5jIGxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIGlmKHRoaXMubGFuZ3VhZ2VQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVybC5wYXRoc0xpc3Quc2V0TGFzdChcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ICsgXCIuXCIgK1xuICAgICAgICAgICAgICAgIHVybC5wYXRoc0xpc3QuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGVtcGxhdGVRdWV1ZVNpemUgKys7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LmdldCh1cmwpO1xuICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgVGVtcGxhdGUodGV4dCksdXJsKTtcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIGFzeW5jIGdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UobmFtZVVybE1hcCkge1xuICAgICAgICBcbiAgICAgICAgaWYoIW5hbWVVcmxNYXAgfHwgbmFtZVVybE1hcC5zaXplKCkgPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvYWRQcm9taXNlcyA9IFtdO1xuICAgICAgICBuYW1lVXJsTWFwLmZvckVhY2goKGtleSwgdmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuY29udGFpbnMoa2V5KSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxvYWRQcm9taXNlcy5wdXNoKHRoaXMucHJpdmF0ZUxvYWQoa2V5LCBVcmxVdGlscy5wYXJzZSh2YWx1ZSkpKTtcbiAgICAgICAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwobG9hZFByb21pc2VzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGFzeW5jIHByaXZhdGVMb2FkKG5hbWUsIHVybCkge1xuICAgICAgICBpZih0aGlzLmxhbmd1YWdlUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1cmwucGF0aHNMaXN0LnNldExhc3QoXG4gICAgICAgICAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCArIFwiLlwiICtcbiAgICAgICAgICAgICAgICB1cmwucGF0aHNMaXN0LmdldExhc3QoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBMT0cuaW5mbyhcIkxvYWRpbmcgdGVtcGxhdGUgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmwudG9TdHJpbmcoKSk7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LmdldCh1cmwpO1xuICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUodGV4dCk7XG4gICAgICAgIHRoaXMuc2V0KG5hbWUsIHRlbXBsYXRlLCB1cmwpO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxufSIsImltcG9ydCB7IExvZ2dlciwgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb25maWcsIFR5cGVDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJUZW1wbGF0ZVBvc3RDb25maWdcIik7XG5cbi8qKlxuICogVG8gYmUgYWRkZWQgdG8gbWluZGkgYXMgYSBzaW5nbGV0b24uIFdpbGwgc2NhbiB0aHJvdWdoIGFsbCBjb25maWd1cmVkIGNsYXNzZXMgdGhhdCBoYXZlIGEgVEVNUExBVEVfVVJMIGFuZCBDT01QT05FTlRfTkFNRVxuICogc3RhdGljIGdldHRlciBhbmQgd2lsbCBhc3luY3Jvbm91c2x5IGxvYWQgdGhlbS4gUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiBhbGwgdGVtcGxhdGVzIGFyZSBsb2FkZWRcbiAqL1xuZXhwb3J0IGNsYXNzIFRlbXBsYXRlc0xvYWRlciB7XG5cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGVSZWdpc3RyeX0gdGVtcGxhdGVSZWdpc3RyeSBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZVJlZ2lzdHJ5KSB7XG4gICAgICAgIHRoaXMudGVtcGxhdGVSZWdpc3RyeSA9IHRlbXBsYXRlUmVnaXN0cnk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNYXB9IGNvbmZpZ0VudHJpZXNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBsb2FkKGNvbmZpZ0VudHJpZXMpIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICBjb25maWdFbnRyaWVzLmZvckVhY2goKGtleSwgY29uZmlnRW50cnksIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgaWYoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuVEVNUExBVEVfVVJMICYmIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FKSB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVNYXAuc2V0KGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FLCBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5URU1QTEFURV9VUkwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpOyBcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVSZWdpc3RyeS5nZXRUZW1wbGF0ZXNMb2FkZWRQcm9taXNlKHRlbXBsYXRlTWFwKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMb2dnZXIsIE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXNSZWdpc3RyeS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiU3R5bGVzTG9hZGVyXCIpO1xuXG4vKipcbiAqIFRvIGJlIGFkZGVkIHRvIG1pbmRpIGFzIGEgc2luZ2xldG9uLiBXaWxsIHNjYW4gdGhyb3VnaCBhbGwgY29uZmlndXJlZCBjbGFzc2VzIHRoYXQgaGF2ZSBhIFNUWUxFU19VUkwgYW5kIENPTVBPTkVOVF9OQU1FXG4gKiBzdGF0aWMgZ2V0dGVyIGFuZCB3aWxsIGFzeW5jcm9ub3VzbHkgbG9hZCB0aGVtLiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIGFsbCBzdHlsZXMgYXJlIGxvYWRlZFxuICovXG5leHBvcnQgY2xhc3MgU3R5bGVzTG9hZGVyIHtcblxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHlsZXNSZWdpc3RyeX0gc3R5bGVzUmVnaXN0cnkgXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc3R5bGVzUmVnaXN0cnkpIHtcbiAgICAgICAgdGhpcy5zdHlsZXNSZWdpc3RyeSA9IHN0eWxlc1JlZ2lzdHJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBjb25maWdFbnRyaWVzXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgbG9hZChjb25maWdFbnRyaWVzKSB7XG4gICAgICAgIGxldCBzdHlsZXNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIGNvbmZpZ0VudHJpZXMuZm9yRWFjaCgoa2V5LCBjb25maWdFbnRyeSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICBpZihjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5TVFlMRVNfVVJMICYmIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FKSB7XG4gICAgICAgICAgICAgICAgc3R5bGVzTWFwLnNldChjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSwgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuU1RZTEVTX1VSTCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7IFxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNSZWdpc3RyeS5nZXRTdHlsZXNMb2FkZWRQcm9taXNlKHN0eWxlc01hcCk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb25maWcsIEluamVjdGlvblBvaW50LCBUeXBlQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgVGVtcGxhdGVzTG9hZGVyIH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzTG9hZGVyIH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNMb2FkZXIuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbXBvbmVudENvbmZpZ1Byb2Nlc3NvclwiKVxuXG4vKipcbiAqIE1pbmRpIGNvbmZpZyBwcm9jZXNzb3Igd2hpY2ggbG9hZHMgYWxsIHRlbXBsYXRlcyBhbmQgc3R5bGVzIGZvciBhbGwgY29uZmlndXJlZCBjb21wb25lbnRzXG4gKiBhbmQgdGhlbiBjYWxscyBhbnkgZXhpc3RpbmcgY29tcG9uZW50TG9hZGVkIGZ1bmN0aW9uIG9uIGVhY2ggY29tcG9uZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRDb25maWdQcm9jZXNzb3Ige1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtUZW1wbGF0ZVJlZ2lzdHJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoVGVtcGxhdGVSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtTdHlsZXNSZWdpc3RyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBwb3N0Q29uZmlnKCl7XG4gICAgICAgIHRoaXMudGVtcGxhdGVzTG9hZGVyID0gbmV3IFRlbXBsYXRlc0xvYWRlcih0aGlzLnRlbXBsYXRlUmVnaXN0cnkpO1xuICAgICAgICB0aGlzLnN0eWxlc0xvYWRlciA9IG5ldyBTdHlsZXNMb2FkZXIodGhpcy5zdHlsZXNSZWdpc3RyeSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtDb25maWd9IGNvbmZpZ1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIHByb2Nlc3NDb25maWcoY29uZmlnLCB1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSB7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgICAgICAgICAgWyBcbiAgICAgICAgICAgICAgICB0aGlzLnRlbXBsYXRlc0xvYWRlci5sb2FkKHVuY29uZmlndXJlZENvbmZpZ0VudHJpZXMpLCBcbiAgICAgICAgICAgICAgICB0aGlzLnN0eWxlc0xvYWRlci5sb2FkKHVuY29uZmlndXJlZENvbmZpZ0VudHJpZXMpIFxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuICAgIH1cblxufSIsImltcG9ydCB7IE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgVW5pcXVlSWRSZWdpc3RyeSB7XG5cbiAgICBpZEF0dHJpYnV0ZVdpdGhTdWZmaXggKGlkKSB7XG4gICAgICAgIGlmKGlkTmFtZXMuY29udGFpbnMoaWQpKSB7XG4gICAgICAgICAgICB2YXIgbnVtYmVyID0gaWROYW1lcy5nZXQoaWQpO1xuICAgICAgICAgICAgaWROYW1lcy5zZXQoaWQsbnVtYmVyKzEpO1xuICAgICAgICAgICAgcmV0dXJuIGlkICsgXCItXCIgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWROYW1lcy5zZXQoaWQsMSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbn1cblxudmFyIGlkTmFtZXMgPSBuZXcgTWFwKCk7IiwiZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihhdHRyaWJ1dGUpIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGUgPSBhdHRyaWJ1dGU7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGUudmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS5uYW1lO1xuICAgIH1cblxuICAgIGdldCBuYW1lc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS5uYW1lO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuLyoqIEB0eXBlIHtNYXB9ICovXG5sZXQgY29uZmlndXJlZEZ1bmN0aW9uTWFwID0gbmV3IE1hcCgpO1xuXG5leHBvcnQgY2xhc3MgQ29uZmlndXJlZEZ1bmN0aW9uIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRoZUZ1bmN0aW9uXG4gICAgICovXG4gICAgc3RhdGljIGNvbmZpZ3VyZShuYW1lLCB0aGVGdW5jdGlvbikge1xuICAgICAgICBjb25maWd1cmVkRnVuY3Rpb25NYXAuc2V0KG5hbWUsIHRoZUZ1bmN0aW9uKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZXhlY3V0ZShuYW1lLCBwYXJhbWV0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZ3VyZWRGdW5jdGlvbk1hcC5nZXQobmFtZSkuY2FsbChudWxsLCBwYXJhbWV0ZXIpO1xuICAgIH1cblxufSIsImV4cG9ydCBjbGFzcyBNYXBwZWRIdG1sRWxlbWVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgZ2V0IG1hcHBlZEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGVsZW1lbnQge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIHNldCBtYXBwZWRFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBDb250YWluZXJFbGVtZW50IH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTWFwcGVkSHRtbEVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9tYXBwZWRIdG1sRWxlbWVudFwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRWxlbWVudFV0aWxzXCIpO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudFV0aWxzIHtcblxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHthbnl9IHZhbHVlIFxuICAgICAqIEBwYXJhbSB7TWFwcGVkSHRtbEVsZW1lbnR9IHBhcmVudCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlQ29udGFpbmVyRWxlbWVudCh2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFhtbEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBFbGVtZW50VXRpbHMuY3JlYXRlRnJvbVhtbEVsZW1lbnQodmFsdWUsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIENvbnRhaW5lckVsZW1lbnQuY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKENvbnRhaW5lckVsZW1lbnQuaXNVSUVsZW1lbnQodmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgTE9HLmVycm9yKFwiVW5yZWNvZ25pemVkIHZhbHVlIGZvciBFbGVtZW50XCIpO1xuICAgICAgICBMT0cuZXJyb3IodmFsdWUpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYnJvd3NlciBFbGVtZW50IGZyb20gdGhlIFhtbEVsZW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0geG1sRWxlbWVudFxuICAgICAqIEBwYXJhbSB7TWFwcGVkSHRtbEVsZW1lbnR9IHBhcmVudEVsZW1lbnRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlRnJvbVhtbEVsZW1lbnQoeG1sRWxlbWVudCwgcGFyZW50RWxlbWVudCkge1xuICAgICAgICBsZXQgZWxlbWVudCA9IG51bGw7XG4gICAgICAgIGlmICh4bWxFbGVtZW50Lm5hbWVzcGFjZSkge1xuICAgICAgICAgICAgZWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuY3JlYXRlRWxlbWVudE5TKHhtbEVsZW1lbnQubmFtZXNwYWNlVXJpLCB4bWxFbGVtZW50LmZ1bGxOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmNyZWF0ZUVsZW1lbnQoeG1sRWxlbWVudC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFyZW50RWxlbWVudCAmJiBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuYXBwZW5kQ2hpbGQocGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50LCBlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICB4bWxFbGVtZW50LmF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cmlidXRlS2V5LCBhdHRyaWJ1dGUpID0+IHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuc2V0QXR0cmlidXRlKGVsZW1lbnQsIGF0dHJpYnV0ZUtleSwgYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IE1hcCwgTG9nZ2VyLCBMaXN0IH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb250YWluZXJFbGVtZW50IH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgQXR0cmlidXRlIH0gZnJvbSBcIi4vYXR0cmlidXRlLmpzXCI7XG5pbXBvcnQgeyBDb25maWd1cmVkRnVuY3Rpb24gfSBmcm9tIFwiLi4vY29uZmlnL2NvbmZpZ3VyZWRGdW5jdGlvbi5qc1wiO1xuaW1wb3J0IHsgRWxlbWVudFV0aWxzIH0gZnJvbSBcIi4uL3V0aWwvZWxlbWVudFV0aWxzLmpzXCI7XG5pbXBvcnQgeyBNYXBwZWRIdG1sRWxlbWVudCB9IGZyb20gXCIuL21hcHBlZEh0bWxFbGVtZW50LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJCYXNlRWxlbWVudFwiKTtcblxuLyoqXG4gKiBBIGJhc2UgY2xhc3MgZm9yIGVuY2xvc2luZyBhbiBIVE1MRWxlbWVudFxuICovXG5leHBvcnQgY2xhc3MgQmFzZUVsZW1lbnQgZXh0ZW5kcyBNYXBwZWRIdG1sRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fHN0cmluZ3xhbnl9IHZhbHVlIFZhbHVlIHRvIGJlIGNvbnZlcnRlZCB0byBDb250YWluZXIgVUkgRWxlbWVudCAoSFRNTEVsZW1lbnQgaW4gdGhlIGNhc2Ugb2YgV2ViIEJyb3dzZXIpXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IHRoZSBwYXJlbnQgQmFzZUVsZW1lbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbnVsbDtcbiAgICAgICAgdGhpcy5ldmVudHNBdHRhY2hlZCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQgPSBFbGVtZW50VXRpbHMuY3JlYXRlQ29udGFpbmVyRWxlbWVudCh2YWx1ZSwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBsb2FkQXR0cmlidXRlcygpIHtcbiAgICAgICAgaWYgKHN1cGVyLm1hcHBlZEVsZW1lbnQuYXR0cmlidXRlcyA9PT0gbnVsbCB8fCBzdXBlci5tYXBwZWRFbGVtZW50LmF0dHJpYnV0ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYXR0cmlidXRlTWFwID09PSBudWxsIHx8IHRoaXMuYXR0cmlidXRlTWFwID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdXBlci5tYXBwZWRFbGVtZW50LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcC5zZXQoc3VwZXIubWFwcGVkRWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5hbWUsbmV3IEF0dHJpYnV0ZShzdXBlci5tYXBwZWRFbGVtZW50LmF0dHJpYnV0ZXNbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxpc3RlblRvKGV2ZW50VHlwZSwgbGlzdGVuZXIsIGNhcHR1cmUpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHN1cGVyLm1hcHBlZEVsZW1lbnQsIGV2ZW50VHlwZSwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBsaXN0ZW5lci5jYWxsKENvbmZpZ3VyZWRGdW5jdGlvbi5leGVjdXRlKFwid3JhcEV2ZW50XCIsIGV2ZW50KSk7XG4gICAgICAgIH0sIGNhcHR1cmUpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBnZXQgZnVsbE5hbWUoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50LnRhZ05hbWU7XG4gICAgfVxuXG4gICAgZ2V0IHRvcCgpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm1hcHBlZEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICAgIH1cblxuICAgIGdldCBib3R0b20oKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbTtcbiAgICB9XG5cbiAgICBnZXQgbGVmdCgpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm1hcHBlZEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdDtcbiAgICB9XG5cbiAgICBnZXQgcmlnaHQoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0O1xuICAgIH1cblxuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm1hcHBlZEVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm1hcHBlZEVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIGdldCBhdHRyaWJ1dGVzKCkge1xuICAgICAgICB0aGlzLmxvYWRBdHRyaWJ1dGVzKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZU1hcDtcbiAgICB9XG5cbiAgICBzZXRBdHRyaWJ1dGVWYWx1ZShrZXksdmFsdWUpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5zZXRBdHRyaWJ1dGUoc3VwZXIubWFwcGVkRWxlbWVudCwga2V5LHZhbHVlKTtcbiAgICB9XG5cbiAgICBnZXRBdHRyaWJ1dGVWYWx1ZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckVsZW1lbnQuZ2V0QXR0cmlidXRlKHN1cGVyLm1hcHBlZEVsZW1lbnQsIGtleSk7XG4gICAgfVxuXG4gICAgY29udGFpbnNBdHRyaWJ1dGUoa2V5KSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50Lmhhc0F0dHJpYnV0ZShrZXkpO1xuICAgIH1cblxuICAgIHJlbW92ZUF0dHJpYnV0ZShrZXkpIHtcbiAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICB9XG5cbiAgICBzZXRTdHlsZShrZXksdmFsdWUpIHtcbiAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5zdHlsZVtrZXldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0U3R5bGUoa2V5KSB7XG4gICAgICAgIHJldHVybiBzdXBlci5tYXBwZWRFbGVtZW50LnN0eWxlW2tleV07XG4gICAgfVxuXG4gICAgcmVtb3ZlU3R5bGUoa2V5KSB7XG4gICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQuc3R5bGVba2V5XSA9IG51bGw7XG4gICAgfVxuXG4gICAgc2V0KGlucHV0KSB7XG4gICAgICAgIGlmKCFzdXBlci5tYXBwZWRFbGVtZW50LnBhcmVudE5vZGUpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlRoZSBlbGVtZW50IGhhcyBubyBwYXJlbnQsIGNhbiBub3Qgc3dhcCBpdCBmb3IgdmFsdWVcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQubWFwcGVkRWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dC5tYXBwZWRFbGVtZW50LCBzdXBlci5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBzdXBlci5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQgPSBpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiBpbnB1dCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBzdXBlci5tYXBwZWRFbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKENvbnRhaW5lckVsZW1lbnQuY3JlYXRlVGV4dE5vZGUoaW5wdXQpLCBzdXBlci5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQsIHN1cGVyLm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dCwgc3VwZXIubWFwcGVkRWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgTE9HLndhcm4oXCJObyB2YWxpZCBpbnB1dCB0byBzZXQgdGhlIGVsZW1lbnRcIik7XG4gICAgICAgIExPRy53YXJuKGlucHV0KTtcbiAgICB9XG5cbiAgICBpc01vdW50ZWQoKSB7XG4gICAgICAgIGlmKHN1cGVyLm1hcHBlZEVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgaWYgKHN1cGVyLm1hcHBlZEVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN1cGVyLm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHdoaWxlIChzdXBlci5tYXBwZWRFbGVtZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQucmVtb3ZlQ2hpbGQoc3VwZXIubWFwcGVkRWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldENoaWxkKGlucHV0KSB7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChpbnB1dCk7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXQubWFwcGVkRWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0ICYmIGlucHV0LnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBzdXBlci5tYXBwZWRFbGVtZW50LmFwcGVuZENoaWxkKGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5hcHBlbmRDaGlsZChDb250YWluZXJFbGVtZW50LmNyZWF0ZVRleHROb2RlKGlucHV0KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgTE9HLndhcm4oXCJObyB2YWxpZCBpbnB1dCB0byBhZGQgdGhlIGVsZW1lbnRcIik7XG4gICAgICAgIExPRy53YXJuKGlucHV0KTtcbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYoc3VwZXIubWFwcGVkRWxlbWVudC5maXJzdENoaWxkID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gdW5kZWZpbmVkICYmIGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHN1cGVyLm1hcHBlZEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGlucHV0Lm1hcHBlZEVsZW1lbnQsIHN1cGVyLm1hcHBlZEVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0ICYmIGlucHV0LnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBzdXBlci5tYXBwZWRFbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBzdXBlci5tYXBwZWRFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5pbnNlcnRCZWZvcmUoQ29udGFpbmVyRWxlbWVudC5jcmVhdGVUZXh0Tm9kZShpbnB1dCksIHN1cGVyLm1hcHBlZEVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsIHN1cGVyLm1hcHBlZEVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgc3VwZXIubWFwcGVkRWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsIHN1cGVyLm1hcHBlZEVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgTE9HLndhcm4oXCJObyB2YWxpZCBpbnB1dCB0byBwcmVwZW5kIHRoZSBlbGVtZW50XCIpO1xuICAgICAgICBMT0cud2FybihpbnB1dCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XG5cbi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudCB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY29tcG9uZW50SW5kZXggXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcm9vdEVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtNYXB9IGVsZW1lbnRNYXAgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29tcG9uZW50SW5kZXgsIHJvb3RFbGVtZW50LCBlbGVtZW50TWFwKSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50SW5kZXggPSBjb21wb25lbnRJbmRleDtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwID0gZWxlbWVudE1hcDtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IHJvb3RFbGVtZW50O1xuICAgIH1cblxuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudC5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHJldHVybnMge0Jhc2VFbGVtZW50fVxuICAgICAqL1xuICAgIGdldChpZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwLmdldChpZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9XG4gICAgICogQHJldHVybnMge0Jhc2VFbGVtZW50fVxuICAgICAqL1xuICAgIHNldCAoaWQsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLnNldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHJldHVybnMge0Jhc2VFbGVtZW50fVxuICAgICAqL1xuICAgIGNsZWFyQ2hpbGRyZW4oaWQpe1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5jbGVhcigpO1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwLmdldChpZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9XG4gICAgICogQHJldHVybnMge0Jhc2VFbGVtZW50fVxuICAgICAqL1xuICAgIHNldENoaWxkIChpZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuc2V0Q2hpbGQodmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwLmdldChpZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9XG4gICAgICogQHJldHVybnMge0Jhc2VFbGVtZW50fVxuICAgICAqL1xuICAgIGFkZENoaWxkIChpZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuYWRkQ2hpbGQodmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwLmdldChpZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9XG4gICAgICogQHJldHVybnMge0Jhc2VFbGVtZW50fVxuICAgICAqL1xuICAgIHByZXBlbmRDaGlsZCAoaWQsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLnByZXBlbmRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkFic3RyYWN0SW5wdXRFbGVtZW50XCIpO1xuXG4vKipcbiAqIFNoYXJlZCBwcm9wZXJ0aWVzIG9mIGlucHV0IGVsZW1lbnRzXG4gKi9cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdElucHV0RWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gdmFsdWVcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKHZhbHVlLCBwYXJlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQgbmFtZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHZhbHVlIGdpdmVuIGFueSBwcm9jZXNzaW5nIHJ1bGVzXG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmJhY2tpbmdWYWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IElucHV0RXZlbnQoJ2NoYW5nZScpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzb3VyY2UgdmFsdWVcbiAgICAgKi9cbiAgICBnZXQgYmFja2luZ1ZhbHVlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWU7XG4gICAgfVxuXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICAgIH1cblxuICAgIHNlbGVjdEFsbCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNlbGVjdCgpO1xuICAgIH1cblxuICAgIGVuYWJsZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZGlzYWJsZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdElucHV0RWxlbWVudCB9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBSYWRpb0lucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc2V0IGNoZWNrZWQodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlzQ2hlY2tlZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNoZWNrZWQ7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0NoZWNrZWQoKTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IFwidHJ1ZVwiKTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdElucHV0RWxlbWVudCB9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBDaGVja2JveElucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc2V0IGNoZWNrZWQodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlzQ2hlY2tlZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNoZWNrZWQ7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0NoZWNrZWQoKTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IFwidHJ1ZVwiKTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtBYnN0cmFjdElucHV0RWxlbWVudH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHRJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0YXJlYUlucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgZ2V0IGlubmVySFRNTCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBzZXQgaW5uZXJIVE1MKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGFkZENoaWxkKGlucHV0KSB7XG4gICAgICAgIHN1cGVyLmFkZENoaWxkKGlucHV0KTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIHByZXBlbmRDaGlsZChpbnB1dCkge1xuICAgICAgICBzdXBlci5wcmVwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5pbm5lckhUTUw7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgWG1sQ2RhdGEgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBDb250YWluZXJFbGVtZW50IH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dG5vZGVFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbENkYXRhfSB2YWx1ZSBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodmFsdWUsIHBhcmVudCkge1xuICAgICAgICBpZih2YWx1ZSBpbnN0YW5jZW9mIFhtbENkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLmNyZWF0ZUZyb21YbWxDZGF0YSh2YWx1ZSwgcGFyZW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZih0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpe1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1htbENkYXRhfSBjZGF0YUVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50RWxlbWVudCBcbiAgICAgKi9cbiAgICBjcmVhdGVGcm9tWG1sQ2RhdGEoY2RhdGFFbGVtZW50LCBwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY2RhdGFFbGVtZW50LnZhbHVlKTtcbiAgICAgICAgaWYocGFyZW50RWxlbWVudCAhPT0gbnVsbCAmJiBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuYXBwZW5kQ2hpbGQocGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50LCBlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIGdldCBtYXBwZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgU2ltcGxlRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgZ2V0IGlubmVySFRNTCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBzZXQgaW5uZXJIVE1MKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRm9ybUVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQgbmFtZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIHN1Ym1pdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5zdWJtaXQoKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFZpZGVvRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHZhbHVlIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBwbGF5KCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQucGxheSgpO1xuICAgIH1cblxuICAgIG11dGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5tdXRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdW5tdXRlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQubXV0ZWQgPSBmYWxzZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sQ2RhdGEsWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IFJhZGlvSW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vcmFkaW9JbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IENoZWNrYm94SW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vY2hlY2tib3hJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFRleHRJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi90ZXh0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBUZXh0YXJlYUlucHV0RWxlbWVudCB9IGZyb20gXCIuL3RleHRhcmVhSW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBUZXh0bm9kZUVsZW1lbnQgfSBmcm9tIFwiLi90ZXh0bm9kZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFNpbXBsZUVsZW1lbnQgfSBmcm9tIFwiLi9zaW1wbGVFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBGb3JtRWxlbWVudCB9IGZyb20gXCIuL2Zvcm1FbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBWaWRlb0VsZW1lbnQgfSBmcm9tIFwiLi92aWRlb0VsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnRNYXBwZXIge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2FueX0gaW5wdXQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyBtYXAoaW5wdXQsIHBhcmVudCkge1xuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9SYWRpbyhpbnB1dCkpeyAgICAgcmV0dXJuIG5ldyBSYWRpb0lucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9DaGVja2JveChpbnB1dCkpeyAgcmV0dXJuIG5ldyBDaGVja2JveElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9TdWJtaXQoaW5wdXQpKXsgICAgcmV0dXJuIG5ldyBUZXh0SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb0Zvcm0oaW5wdXQpKXsgICAgICByZXR1cm4gbmV3IEZvcm1FbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHRhcmVhKGlucHV0KSl7ICByZXR1cm4gbmV3IFRleHRhcmVhSW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHQoaW5wdXQpKXsgICAgICByZXR1cm4gbmV3IFRleHRJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVmlkZW8oaW5wdXQpKXsgICAgIHJldHVybiBuZXcgVmlkZW9FbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHRub2RlKGlucHV0KSl7ICByZXR1cm4gbmV3IFRleHRub2RlRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9TaW1wbGUoaW5wdXQpKXsgICAgcmV0dXJuIG5ldyBTaW1wbGVFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTWFwcGluZyB0byBzaW1wbGUgYnkgZGVmYXVsdCBcIiArIGlucHV0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaW1wbGVFbGVtZW50KGlucHV0LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9SYWRpbyhpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwicmFkaW9cIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJyYWRpb1wiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvQ2hlY2tib3goaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCAmJiBpbnB1dC50eXBlID09PSBcImNoZWNrYm94XCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIiAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiY2hlY2tib3hcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1N1Ym1pdChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwic3VibWl0XCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIiAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwic3VibWl0XCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9Gb3JtKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxGb3JtRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJmb3JtXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0KGlucHV0KXtcbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwidGV4dFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJudW1iZXJcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwicGFzc3dvcmRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwiZW1haWxcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwiZGF0ZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJ0aW1lXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiKSB7XG4gICAgICAgICAgICBpZighaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJ0ZXh0XCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwibnVtYmVyXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwicGFzc3dvcmRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJlbWFpbFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcImRhdGVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJ0aW1lXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1RleHRub2RlKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIE5vZGUgJiYgaW5wdXQubm9kZVR5cGUgPT09IFwiVEVYVF9OT0RFXCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxDZGF0YSk7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1ZpZGVvKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxWaWRlb0VsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwidmlkZW9cIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1RleHRhcmVhKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwidGV4dGFyZWFcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1NpbXBsZShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEVsZW1lbnRNYXBwZXIgfSBmcm9tIFwiLi4vZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50LmpzXCI7XG5cbi8qKlxuICogQ29sbGVjdHMgaW5mb3JtYXRpb24gd2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBhbmQgZmluZHMgdGhlIHJvb3QgZWxlbWVudCwgY3JlYXRlcyBtYXAgb2YgZWxlbWVudHMgXG4gKi9cbmV4cG9ydCBjbGFzcyBFbGVtZW50UmVnaXN0cmF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IodW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50SW5kZXgpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGV4O1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnVuaXF1ZUlkUmVnaXN0cnkgPSB1bmlxdWVJZFJlZ2lzdHJ5O1xuXG4gICAgICAgIC8qKiBAdHlwZSB7QmFzZUVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudE1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXRFbGVtZW50TWFwKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExpc3RlbnMgdG8gZWxlbWVudHMgYmVpbmcgY3JlYXRlZCwgYW5kIHRha2VzIGlubiB0aGUgY3JlYXRlZCBYbWxFbGVtZW50IGFuZCBpdHMgcGFyZW50IFhtbEVsZW1lbnRcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHhtbEVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50V3JhcHBlciBcbiAgICAgKi9cbiAgICBlbGVtZW50Q3JlYXRlZCAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcikge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gRWxlbWVudE1hcHBlci5tYXAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcik7XG5cbiAgICAgICAgdGhpcy5hZGRUb0VsZW1lbnRJZE1hcChlbGVtZW50KTtcblxuICAgICAgICBpZih0aGlzLnJvb3RFbGVtZW50ID09PSBudWxsICYmIGVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgYWRkVG9FbGVtZW50SWRNYXAoZWxlbWVudCkge1xuICAgICAgICBpZihlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaWQgPSBudWxsO1xuICAgICAgICBpZihlbGVtZW50LmNvbnRhaW5zQXR0cmlidXRlKFwiaWRcIikpIHtcbiAgICAgICAgICAgIGlkID0gZWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIpO1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIsdGhpcy51bmlxdWVJZFJlZ2lzdHJ5LmlkQXR0cmlidXRlV2l0aFN1ZmZpeChpZCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoaWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudE1hcC5zZXQoaWQsZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBDb25maWd1cmVkRnVuY3Rpb24gfSBmcm9tIFwiLi4vY29uZmlnL2NvbmZpZ3VyZWRGdW5jdGlvbi5qc1wiO1xuaW1wb3J0IHsgU2ltcGxlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L3NpbXBsZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50e1xuXG4gICAgY29uc3RydWN0b3IoZXZlbnQpe1xuICAgICAgICB0aGlzLmV2ZW50ID0gZXZlbnQ7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSBcImRyYWdzdGFydFwiKXtcbiAgICAgICAgICAgIHRoaXMuZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoJ3RleHQvcGxhaW4nLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3BQcm9wYWdhdGlvbigpe1xuICAgICAgICB0aGlzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHByZXZlbnREZWZhdWx0KCl7XG4gICAgICAgIHRoaXMuZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgZXZlbnQgYW5kIHRoZSBlZGdlIHggY29vcmRpbmF0ZSBvZiB0aGUgY29udGFpbmluZyBvYmplY3RcbiAgICAgKi9cbiAgICBnZXQgb2Zmc2V0WCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5vZmZzZXRYO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBldmVudCBhbmQgdGhlIGVkZ2UgeSBjb29yZGluYXRlIG9mIHRoZSBjb250YWluaW5nIG9iamVjdFxuICAgICAqL1xuICAgIGdldCBvZmZzZXRZKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Lm9mZnNldFk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1vdXNlIHggY29vcmRpbmF0ZSBvZiB0aGUgZXZlbnQgcmVsYXRpdmUgdG8gdGhlIGNsaWVudCB3aW5kb3cgdmlld1xuICAgICAqL1xuICAgIGdldCBjbGllbnRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmNsaWVudFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1vdXNlIHkgY29vcmRpbmF0ZSBvZiB0aGUgZXZlbnQgcmVsYXRpdmUgdG8gdGhlIGNsaWVudCB3aW5kb3cgdmlld1xuICAgICAqL1xuICAgIGdldCBjbGllbnRZKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmNsaWVudFk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1NpbXBsZUVsZW1lbnR9XG4gICAgICovXG4gICAgZ2V0IHRhcmdldCgpe1xuICAgICAgICBpZiAodGhpcy5ldmVudCAmJiB0aGlzLmV2ZW50LnRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIENvbmZpZ3VyZWRGdW5jdGlvbi5leGVjdXRlKFwibWFwRWxlbWVudFwiLCB0aGlzLmV2ZW50LnRhcmdldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7U2ltcGxlRWxlbWVudH1cbiAgICAgKi9cbiAgICBnZXQgcmVsYXRlZFRhcmdldCgpe1xuICAgICAgICBpZiAodGhpcy5ldmVudCAmJiB0aGlzLmV2ZW50LnJlbGF0ZWRUYXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBDb25maWd1cmVkRnVuY3Rpb24uZXhlY3V0ZShcIm1hcEVsZW1lbnRcIiwgdGhpcy5ldmVudC5yZWxhdGVkVGFyZ2V0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgICBnZXRSZWxhdGVkVGFyZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpe1xuICAgICAgICBpZiAodGhpcy5ldmVudC5yZWxhdGVkVGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gQ29uZmlndXJlZEZ1bmN0aW9uLmV4ZWN1dGUoXCJtYXBFbGVtZW50XCIsIHRoaXMuZXZlbnQucmVsYXRlZFRhcmdldCkuZ2V0QXR0cmlidXRlVmFsdWUoYXR0cmlidXRlTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IHRhcmdldFZhbHVlKCl7XG4gICAgICAgIGlmKHRoaXMudGFyZ2V0KSB7IFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGFyZ2V0LnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGdldCBrZXlDb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5rZXlDb2RlO1xuICAgIH1cblxuICAgIGlzS2V5Q29kZShjb2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmtleUNvZGUgPT09IGNvZGU7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBDb250YWluZXJFbGVtZW50LCBDb250YWluZXJXaW5kb3cgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi9jb21wb25lbnQvY29tcG9uZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuLi9ldmVudC9ldmVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2FudmFzUm9vdCB7XG5cbiAgICBzdGF0aWMgc2hvdWxkU3dhbGxvd05leHRGb2N1c0VzY2FwZSA9IGZhbHNlO1xuXG4gICAgc3RhdGljIG1vdXNlRG93bkVsZW1lbnQgPSBudWxsO1xuXG4gICAgc3RhdGljIGZvY3VzRXNjYXBlRXZlbnRSZXF1ZXN0ZWQgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0NvbXBvbmVudH0gY29tcG9uZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyByZXBsYWNlQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIGJvZHlFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtDb21wb25lbnR9IGNvbXBvbmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgc2V0Q29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBib2R5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIFxuICAgICAqIEBwYXJhbSB7Q29tcG9uZW50fSBjb21wb25lbnQgXG4gICAgICovXG4gICAgc3RhdGljIGFkZENoaWxkQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0NvbXBvbmVudH0gY29tcG9uZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyBhZGRDaGlsZEVsZW1lbnQoaWQsIGVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICovXG4gICAgc3RhdGljIHJlbW92ZUVsZW1lbnQoaWQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5yZW1vdmVFbGVtZW50KGlkKTtcbiAgICB9XG5cbiAgICAvKiogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxuICAgICAqL1xuICAgIHN0YXRpYyBhZGRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5hcHBlbmRSb290TWV0YUNoaWxkKGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgYWRkQm9keUVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBDb250YWluZXJFbGVtZW50LmFwcGVuZFJvb3RVaUNoaWxkKGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgcHJlcGVuZEhlYWRlckVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBDb250YWluZXJFbGVtZW50LnByZXBlbmRFbGVtZW50KFwiaGVhZFwiLCBlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XG4gICAgICovXG4gICAgc3RhdGljIHByZXBlbmRCb2R5RWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQucHJlcGVuZEVsZW1lbnQoXCJib2R5XCIsIGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIFJlbWVtYmVyIHRvIHN3YWxsb3dGb2N1c0VzY2FwZSBmb3IgaW5pdGlhbCB0cmlnZ2VyaW5nIGV2ZW50c1xuICAgICAqIHdoaWNoIGFyZSBleHRlcm5hbCB0byBmb2N1c1Jvb3RcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gbGlzdGVuZXJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBmb2N1c1Jvb3RcbiAgICAgKi9cbiAgICBzdGF0aWMgbGlzdGVuVG9Gb2N1c0VzY2FwZShsaXN0ZW5lciwgZm9jdXNSb290KSB7XG4gICAgICAgIFxuICAgICAgICAvKiBIYWNrOiBCZWNhdXNlIHdlIGRvbid0IGhhdmUgYSB3YXkgb2Yga25vd2luZyBpbiB0aGUgY2xpY2sgZXZlbnQgd2hpY2ggZWxlbWVudCB3YXMgaW4gZm9jdXMgd2hlbiBtb3VzZWRvd24gb2NjdXJlZCAqL1xuICAgICAgICBpZiAoIUNhbnZhc1Jvb3QuZm9jdXNFc2NhcGVFdmVudFJlcXVlc3RlZCkge1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlTW91c2VEb3duRWxlbWVudCA9IG5ldyBNZXRob2QobnVsbCwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgQ2FudmFzUm9vdC5tb3VzZURvd25FbGVtZW50ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBDb250YWluZXJXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB1cGRhdGVNb3VzZURvd25FbGVtZW50LCBFdmVudCk7XG4gICAgICAgICAgICBDYW52YXNSb290LmZvY3VzRXNjYXBlRXZlbnRSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2FsbElmTm90Q29udGFpbnMgPSBuZXcgTWV0aG9kKG51bGwsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFDYW52YXNSb290Lm1vdXNlRG93bkVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICBDYW52YXNSb290Lm1vdXNlRG93bkVsZW1lbnQgPSBldmVudC50YXJnZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoQ29udGFpbmVyRWxlbWVudC5jb250YWlucyhmb2N1c1Jvb3QuZWxlbWVudCwgQ2FudmFzUm9vdC5tb3VzZURvd25FbGVtZW50LmVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKENhbnZhc1Jvb3Quc2hvdWxkU3dhbGxvd05leHRGb2N1c0VzY2FwZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxpc3RlbmVyLmNhbGwoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgQ29udGFpbmVyV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsSWZOb3RDb250YWlucywgRXZlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdoZW4gYW4gZWxlbWVudCBpcyBjb25naWd1cmVkIHRvIGJlIGhpZGRlbiBieSBGb2N1c0VzY2FwZSxcbiAgICAgKiBhbmQgd2FzIHNob3duIGJ5IGFuIGV2ZW50IHRyaWdnZXJlZCBmcm9tIGFuIGV4dGVybmFsIGVsZW1lbnQsXG4gICAgICogdGhlbiBGb2N1c0VzY2FwZSBnZXRzIHRyaWdnZXJlZCByaWdodCBhZnRlciB0aGUgZWxlbWVudCBpc1xuICAgICAqIHNob3duLiBUaGVyZWZvcmUgdGhpcyBmdW5jdGlvbiBhbGxvd3MgdGhpcyBldmVudCB0byBiZSBcbiAgICAgKiBzd2FsbG93ZWQgdG8gYXZvaWQgdGhpcyBiZWhhdmlvclxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmb3JNaWxsaXNlY29uZHMgXG4gICAgICovXG4gICAgc3RhdGljIHN3YWxsb3dGb2N1c0VzY2FwZShmb3JNaWxsaXNlY29uZHMpIHtcbiAgICAgICAgQ2FudmFzUm9vdC5zaG91bGRTd2FsbG93TmV4dEZvY3VzRXNjYXBlID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBDYW52YXNSb290LnNob3VsZFN3YWxsb3dOZXh0Rm9jdXNFc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgfSwgZm9yTWlsbGlzZWNvbmRzKTtcbiAgICB9XG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7RWxlbWVudE1hcHBlcn0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgSFRNTHtcblxuICAgIHN0YXRpYyBjdXN0b20oZWxlbWVudE5hbWUpe1xuICAgICAgICB2YXIgeG1sRWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnROYW1lKTtcbiAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHhtbEVsZW1lbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBhcHBseVN0eWxlcyhlbGVtZW50LCBjbGFzc1ZhbHVlLCBzdHlsZVZhbHVlKXtcbiAgICAgICAgaWYoY2xhc3NWYWx1ZSl7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiY2xhc3NcIiwgY2xhc3NWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3R5bGVWYWx1ZSl7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIiwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYSh2YWx1ZSwgaHJlZiwgY2xhc3NWYWx1ZSwgc3R5bGVWYWx1ZSl7XG4gICAgICAgIHZhciBlbGVtZW50ID0gSFRNTC5jdXN0b20oXCJhXCIpO1xuICAgICAgICBlbGVtZW50LmFkZENoaWxkKHZhbHVlKTtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImhyZWZcIixocmVmKTtcbiAgICAgICAgSFRNTC5hcHBseVN0eWxlcyhlbGVtZW50LCBjbGFzc1ZhbHVlLCBzdHlsZVZhbHVlKTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGkodmFsdWUsIGNsYXNzVmFsdWUsIHN0eWxlVmFsdWUpe1xuICAgICAgICB2YXIgZWxlbWVudCA9IEhUTUwuY3VzdG9tKFwiaVwiKTtcbiAgICAgICAgZWxlbWVudC5hZGRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIEhUTUwuYXBwbHlTdHlsZXMoZWxlbWVudCwgY2xhc3NWYWx1ZSwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IE1hcCwgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDYW52YXNSb290IH0gZnJvbSBcIi4vY2FudmFzUm9vdC5qc1wiO1xuaW1wb3J0IHsgSFRNTCB9IGZyb20gXCIuLi9odG1sL2h0bWwuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFRleHRub2RlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L3RleHRub2RlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ2FudmFzU3R5bGVzXCIpO1xuXG5jb25zdCBzdHlsZXMgPSBuZXcgTWFwKCk7XG5jb25zdCBzdHlsZU93bmVycyA9IG5ldyBNYXAoKTtcbmNvbnN0IGVuYWJsZWRTdHlsZXMgPSBuZXcgTGlzdCgpO1xuXG5leHBvcnQgY2xhc3MgQ2FudmFzU3R5bGVzIHtcblxuICAgIHN0YXRpYyBzZXRTdHlsZShuYW1lLCBzb3VyY2UpIHtcbiAgICAgICAgaWYoc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBzdHlsZXMuZ2V0KG5hbWUpLnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xuICAgICAgICAgICAgbGV0IHN0eWxlRWxlbWVudCA9IEhUTUwuY3VzdG9tKFwic3R5bGVcIik7XG4gICAgICAgICAgICBzdHlsZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiLG5hbWUpO1xuICAgICAgICAgICAgc3R5bGVFbGVtZW50LnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XG4gICAgICAgICAgICBzdHlsZXMuc2V0KG5hbWUsIHN0eWxlRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlU3R5bGUobmFtZSkge1xuICAgICAgICBpZihlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLnJlbW92ZShuYW1lKTtcbiAgICAgICAgICAgIENhbnZhc1Jvb3QucmVtb3ZlRWxlbWVudChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZihzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHN0eWxlcy5yZW1vdmUobmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZGlzYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XG4gICAgICAgIENhbnZhc1N0eWxlcy5yZW1vdmVTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xuICAgICAgICBpZihDYW52YXNTdHlsZXMuaGFzU3R5bGVPd25lcihuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihcIlN0eWxlIGRvZXMgbm90IGV4aXN0OiBcIiArIG5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMucmVtb3ZlKG5hbWUpO1xuICAgICAgICAgICAgQ2FudmFzUm9vdC5yZW1vdmVFbGVtZW50KG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGVuYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XG4gICAgICAgIENhbnZhc1N0eWxlcy5hZGRTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xuICAgICAgICBpZighc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJTdHlsZSBkb2VzIG5vdCBleGlzdDogXCIgKyBuYW1lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZighZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5hZGQobmFtZSk7XG4gICAgICAgICAgICBDYW52YXNSb290LmFkZEhlYWRlckVsZW1lbnQoc3R5bGVzLmdldChuYW1lKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYWRkU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgc3R5bGVPd25lcnMuc2V0KG5hbWUsIG5ldyBMaXN0KCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5nZXQobmFtZSkuY29udGFpbnMob3duZXJJZCkpIHtcbiAgICAgICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5hZGQob3duZXJJZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5yZW1vdmUob3duZXJJZCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGhhc1N0eWxlT3duZXIobmFtZSkge1xuICAgICAgICBpZighc3R5bGVPd25lcnMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3R5bGVPd25lcnMuZ2V0KG5hbWUpLnNpemUoKSA+IDA7XG4gICAgfVxufSIsImltcG9ydCB7IEluamVjdGlvblBvaW50IH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBEb21UcmVlIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnQuanNcIjtcbmltcG9ydCB7IFVuaXF1ZUlkUmVnaXN0cnkgfSBmcm9tIFwiLi91bmlxdWVJZFJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50UmVnaXN0cmF0b3IgfSBmcm9tIFwiLi9lbGVtZW50UmVnaXN0cmF0b3IuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBDYW52YXNTdHlsZXMgfSBmcm9tIFwiLi4vY2FudmFzL2NhbnZhc1N0eWxlcy5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29tcG9uZW50RmFjdG9yeVwiKTtcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnkge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHlsZXNSZWdpc3RyeX0gKi9cbiAgICAgICAgdGhpcy5zdHlsZXNSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFN0eWxlc1JlZ2lzdHJ5KTtcblxuICAgICAgICAvKiogQHR5cGUge1RlbXBsYXRlUmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFRlbXBsYXRlUmVnaXN0cnkpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7VW5pcXVlSWRSZWdpc3RyeX0gKi9cbiAgICAgICAgdGhpcy51bmlxdWVJZFJlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoVW5pcXVlSWRSZWdpc3RyeSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgcmVwcmVzZW50cyB0aGUgdGVtcGxhdGUgYW5kIHRoZSBzdHlsZXMgbmFtZSBpZiB0aGUgc3R5bGUgZm9yIHRoYXQgbmFtZSBpcyBhdmFpbGFibGVcbiAgICAgKi9cbiAgICBjcmVhdGUobmFtZSl7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGVSZWdpc3RyeS5nZXQobmFtZSk7XG4gICAgICAgIGlmKCF0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgTE9HLmVycm9yKHRoaXMudGVtcGxhdGVSZWdpc3RyeSk7XG4gICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgICAgICB0aHJvdyBcIk5vIHRlbXBsYXRlIHdhcyBmb3VuZCB3aXRoIG5hbWUgXCIgKyBuYW1lO1xuXG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVsZW1lbnRSZWdpc3RyYXRvciA9IG5ldyBFbGVtZW50UmVnaXN0cmF0b3IodGhpcy51bmlxdWVJZFJlZ2lzdHJ5LCBjb21wb25lbnRDb3VudGVyKyspO1xuICAgICAgICBuZXcgRG9tVHJlZSh0ZW1wbGF0ZS5nZXRUZW1wbGF0ZVNvdXJjZSgpLGVsZW1lbnRSZWdpc3RyYXRvcikubG9hZCgpO1xuXG4gICAgICAgIHRoaXMubW91bnRTdHlsZXMobmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnQoZWxlbWVudFJlZ2lzdHJhdG9yLmNvbXBvbmVudEluZGV4LCBlbGVtZW50UmVnaXN0cmF0b3Iucm9vdEVsZW1lbnQsIGVsZW1lbnRSZWdpc3RyYXRvci5nZXRFbGVtZW50TWFwKCkpO1xuICAgIH1cblxuICAgIG1vdW50U3R5bGVzKG5hbWUpIHtcbiAgICAgICAgaWYodGhpcy5zdHlsZXNSZWdpc3RyeS5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgQ2FudmFzU3R5bGVzLnNldFN0eWxlKG5hbWUsIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0KG5hbWUpKTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG52YXIgY29tcG9uZW50Q291bnRlciA9IDA7IiwiaW1wb3J0IHsgTWV0aG9kIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbi8qKlxuICogU3RhdGVNYW5hZ2VyXG4gKiBcbiAqIEB0ZW1wbGF0ZSBUXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGF0ZU1hbmFnZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8qKiBAdHlwZSB7TWFwPFN0cmluZywgYW55Pn0gKi9cbiAgICAgICAgdGhpcy5vYmplY3RNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXA8U3RyaW5nLCBBcnJheTxNZXRob2Q+fSAqL1xuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gbGlzdGVuZXIgXG4gICAgICovXG4gICAgcmVhY3QobGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3QgYW55S2V5ID0gXCJfX0FOWV9fXCI7XG4gICAgICAgIGlmICghdGhpcy5saXN0ZW5lcnMuaGFzKGFueUtleSkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnNldChhbnlLZXksIG5ldyBBcnJheSgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RlbmVycy5nZXQoYW55S2V5KS5wdXNoKGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFxuICAgICAqIEBwYXJhbSB7TWV0aG9kfSBsaXN0ZW5lciBcbiAgICAgKi9cbiAgICByZWFjdFRvKGtleSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc2V0KGtleSwgbmV3IEFycmF5KCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChrZXkpLnB1c2gobGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSB0aGUgc3RhdGVcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFxuICAgICAqIEBwYXJhbSB7VH0gb2JqZWN0IFxuICAgICAqL1xuICAgIGFzeW5jIHVwZGF0ZShvYmplY3QsIGtleSA9IFwiX19ERUZBVUxUX19cIikge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvYmplY3QpKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9iamVjdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIG9iamVjdFtpXSA9IHRoaXMuY3JlYXRlUHJveHkob2JqZWN0W2ldLCBrZXksIHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG9iamVjdCA9IHRoaXMuY3JlYXRlUHJveHkob2JqZWN0LCBrZXksIHRoaXMpO1xuICAgICAgICB0aGlzLm9iamVjdE1hcC5zZXQoa2V5LCBvYmplY3QpO1xuICAgICAgICB0aGlzLnNpZ25hbFN0YXRlQ2hhbmdlKG9iamVjdCwga2V5KTtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9XG5cbiAgICBzaWduYWxTdGF0ZUNoYW5nZShvYmplY3QsIGtleSkge1xuICAgICAgICBpZiAodGhpcy5saXN0ZW5lcnMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLmdldChrZXkpKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuY2FsbChbb2JqZWN0XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhbnlLZXkgPSBcIl9fQU5ZX19cIjtcbiAgICAgICAgaWYgKGtleSAhPSBhbnlLZXkgJiYgdGhpcy5saXN0ZW5lcnMuaGFzKGFueUtleSkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLmdldChhbnlLZXkpKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuY2FsbChbb2JqZWN0XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjcmVhdGVQcm94eShvYmplY3QsIGtleSwgc3RhdGVNYW5hZ2VyKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkob2JqZWN0LCB7XG4gICAgICAgICAgICBzZXQ6ICh0YXJnZXQsIHByb3AsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFtwcm9wXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAodGFyZ2V0W3Byb3BdID0gdmFsdWUpO1xuICAgICAgICAgICAgICAgIHN0YXRlTWFuYWdlci5zaWduYWxTdGF0ZUNoYW5nZSh0YXJnZXQsIGtleSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MgPT09IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMb2dnZXIsIExpc3QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxuaW1wb3J0IHsgUHJvdG90eXBlQ29uZmlnLCBTaW5nbGV0b25Db25maWcgfSBmcm9tIFwibWluZGlfdjFcIlxuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFVuaXF1ZUlkUmVnaXN0cnkgfSBmcm9tIFwiLi9jb21wb25lbnQvdW5pcXVlSWRSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgQ29tcG9uZW50RmFjdG9yeSB9IGZyb20gXCIuL2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuL3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgU3RhdGVNYW5hZ2VyIH0gZnJvbSBcIi4vc3RhdGUvc3RhdGVNYW5hZ2VyLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDb25maWdcIik7XG5cbmV4cG9ydCBjbGFzcyBDb25maWcge1xuXG4gICAgc3RhdGljIGdldEluc3RhbmNlKCkge1xuICAgICAgICByZXR1cm4ganVzdHJpZ2h0Q29uZmlnO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnR5cGVDb25maWdMaXN0ID0gbmV3IExpc3QoW1xuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVGVtcGxhdGVSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChTdHlsZXNSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChVbmlxdWVJZFJlZ2lzdHJ5KSxcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKENvbXBvbmVudEZhY3RvcnkpLFxuICAgICAgICAgICAgUHJvdG90eXBlQ29uZmlnLnVubmFtZWQoU3RhdGVNYW5hZ2VyKV0pO1xuICAgICAgICB9XG5cbiAgICBnZXRUeXBlQ29uZmlnTGlzdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudHlwZUNvbmZpZ0xpc3Q7XG4gICAgfVxuXG59XG5cbmNvbnN0IGp1c3RyaWdodENvbmZpZyA9IG5ldyBDb25maWcoKTsiLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiTG9hZGVySW50ZXJjZXB0b3JcIik7XG5cbmV4cG9ydCBjbGFzcyBMb2FkZXJJbnRlcmNlcHRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBwcm9jZXNzKCkge1xuICAgICAgICBMT0cuaW5mbyhcIlVuaW1wbGVtZW50ZWQgTG9hZGVyIEludGVyY2VwdG9yIGJyZWFrcyBieSBkZWZhdWx0XCIpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTG9nZ2VyLCBTdHJpbmdVdGlscyB9IGZyb20gXCJjb3JldXRpbF92MVwiXG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcbmltcG9ydCB7IExvYWRlckludGVyY2VwdG9yIH0gZnJvbSBcIi4vbG9hZGVySW50ZXJjZXB0b3IuanNcIlxuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiTW9kdWxlTG9hZGVyXCIpO1xuXG5leHBvcnQgY2xhc3MgTW9kdWxlTG9hZGVyIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtYXRjaFBhdGggXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1vZHVsZVBhdGggXG4gICAgICogQHBhcmFtIHtBcnJheTxMb2FkZXJJbnRlcmNlcHRvcj59IGxvYWRlckludGVyY2VwdG9yc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1hdGNoUGF0aCwgbW9kdWxlUGF0aCwgbG9hZGVySW50ZXJjZXB0b3JzID0gW10pIHtcbiAgICAgICAgXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tYXRjaFBhdGggPSBtYXRjaFBhdGg7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1vZHVsZVBhdGggPSBtb2R1bGVQYXRoO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7QXJyYXk8TG9hZGVySW50ZXJjZXB0b3I+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5sb2FkZXJJbnRlcmNlcHRvcnMgPSBsb2FkZXJJbnRlcmNlcHRvcnM7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYXRjaGVzIGlmIHRoZSBjb25maWd1cmVkIG1hdGNoVXJsIHN0YXJ0cyB3aXRoIHRoZSBwcm92aWRlZCB1cmwgb3JcbiAgICAgKiBpZiB0aGUgY29uZmlndXJlZCBtYXRjaFVybCBpcyBudWxsXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBtYXRjaGVzKHVybCl7XG4gICAgICAgIGlmICghdGhpcy5tYXRjaFBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdXJsKSB7XG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJVcmwgaXMgbnVsbFwiKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyh0aGlzLm1hdGNoUGF0aCwgdXJsLnBhdGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPE1haW4+fVxuICAgICAqL1xuICAgIGFzeW5jIGxvYWQoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBtYWluID0gYXdhaXQgdGhpcy5pbXBvcnRNb2R1bGUoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW50ZXJjZXB0b3JzUGFzcygpO1xuICAgICAgICAgICAgcmV0dXJuIG1haW47XG4gICAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgICAgICBMT0cud2FybihcIkZpbHRlciByZWplY3RlZCBcIiArIHJlYXNvbik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGludGVyY2VwdG9yc1Bhc3MoKSB7XG4gICAgICAgIGNvbnN0IGludGVyY2VwdG9ycyA9IHRoaXMubG9hZGVySW50ZXJjZXB0b3JzO1xuICAgICAgICBpZiAoaW50ZXJjZXB0b3JzICYmIGludGVyY2VwdG9ycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBsZXQgaW50ZXJjZXB0b3JQcm9taXNlQ2hhaW4gPSBpbnRlcmNlcHRvcnNbMF0ucHJvY2VzcygpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBpbnRlcmNlcHRvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpbnRlcmNlcHRvclByb21pc2VDaGFpbiA9IGludGVyY2VwdG9yUHJvbWlzZUNoYWluLnRoZW4oaW50ZXJjZXB0b3JzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbnRlcmNlcHRvclByb21pc2VDaGFpbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgaW1wb3J0TW9kdWxlKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gYXdhaXQgaW1wb3J0KHRoaXMubW9kdWxlUGF0aCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG1vZHVsZS5kZWZhdWx0KCk7XG4gICAgICAgIH0gY2F0Y2gocmVhc29uKSAge1xuICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICB9XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4vdXRpbC91cmxcIjtcblxuZXhwb3J0IGNsYXNzIE1haW4ge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBsb2FkKHVybCkge1xuICAgICAgICB0aHJvdyBcIk1haW4gY2xhc3MgbXVzdCBpbXBsZW1lbnQgbG9hZCh1cmwpXCI7XG4gICAgfVxuXG4gICAgdXBkYXRlKCkge1xuICAgICAgICB0aHJvdyBcIk1haW4gY2xhc3MgbXVzdCBpbXBsZW1lbnQgdXBkYXRlKClcIjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBwYXRoKCkge1xuICAgICAgICB0aHJvdyBcIk1haW4gY2xhc3MgbXVzdCBpbXBsZW1lbnQgZ2V0IHBhdGgoKVwiO1xuICAgIH1cblxufSIsImltcG9ydCB7IExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiXG5pbXBvcnQgeyBNaW5kaUNvbmZpZywgTWluZGlJbmplY3RvciB9IGZyb20gXCJtaW5kaV92MVwiO1xuaW1wb3J0IHsgTW9kdWxlTG9hZGVyIH0gZnJvbSBcIi4vbW9kdWxlTG9hZGVyLmpzXCI7XG5pbXBvcnQgeyBMb2FkZXJJbnRlcmNlcHRvciB9IGZyb20gXCIuL2xvYWRlckludGVyY2VwdG9yLmpzXCJcbmltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi4vbWFpbi5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRGlNb2R1bGVMb2FkZXJcIik7XG5cbmV4cG9ydCBjbGFzcyBEaU1vZHVsZUxvYWRlciBleHRlbmRzIE1vZHVsZUxvYWRlciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01pbmRpQ29uZmlnfSBjb25maWdcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gbWF0Y2hQYXRoIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGVQYXRoIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8TG9hZGVySW50ZXJjZXB0b3I+fSBsb2FkZXJJbnRlcmNlcHRvcnNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIG1hdGNoUGF0aCwgbW9kdWxlUGF0aCwgbG9hZGVySW50ZXJjZXB0b3JzID0gW10pIHtcbiAgICAgICAgc3VwZXIobWF0Y2hQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJJbnRlcmNlcHRvcnMpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWluZGlDb25maWd9ICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPE1haW4+fVxuICAgICAqL1xuICAgIGFzeW5jIGxvYWQoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBtYWluID0gYXdhaXQgdGhpcy5pbXBvcnRNb2R1bGUoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW50ZXJjZXB0b3JzUGFzcygpO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IE1pbmRpSW5qZWN0b3IuaW5qZWN0KG1haW4sIHRoaXMuY29uZmlnKTtcbiAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgIExPRy53YXJuKFwiTW9kdWxlIGxvYWRlciBmYWlsZWQgXCIgKyByZWFzb24pO1xuICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01vZHVsZUxvYWRlcn0gbW9kdWxlTG9hZGVyXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgYXN5bmMgaW1wb3J0TW9kdWxlKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbWFpbiA9IGF3YWl0IHN1cGVyLmltcG9ydE1vZHVsZSgpO1xuICAgICAgICAgICAgdGhpcy5jb25maWcuYWRkQWxsVHlwZUNvbmZpZyhtYWluLnR5cGVDb25maWdMaXN0KTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29uZmlnLmZpbmFsaXplKCk7XG4gICAgICAgICAgICBhd2FpdCBuZXcgTGlzdCh0aGlzLmxvYWRlckludGVyY2VwdG9ycykucHJvbWlzZUNoYWluKChsb2FkZXJJbnRlcmNlcHRvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBNaW5kaUluamVjdG9yLmluamVjdChsb2FkZXJJbnRlcmNlcHRvciwgdGhpcy5jb25maWcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gbWFpbjtcbiAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG59IiwiaW1wb3J0IHsgTWluZGlJbmplY3RvciwgTWluZGlDb25maWcsIEluc3RhbmNlUG9zdENvbmZpZ1RyaWdnZXIsIENvbmZpZ0FjY2Vzc29yLCBTaW5nbGV0b25Db25maWcsIFByb3RvdHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xuaW1wb3J0IHsgTGlzdCwgTG9nZ2VyLCBNZXRob2QsIFN0cmluZ1V0aWxzIH0gZnJvbSAgXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ29udGFpbmVyVXJsIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgQ29tcG9uZW50Q29uZmlnUHJvY2Vzc29yIH0gZnJvbSBcIi4vY29tcG9uZW50L2NvbXBvbmVudENvbmZpZ1Byb2Nlc3Nvci5qc1wiO1xuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBDb25maWcgfSBmcm9tIFwiLi9jb25maWcuanNcIjtcbmltcG9ydCB7IEV2ZW50IH0gZnJvbSBcIi4vZXZlbnQvZXZlbnQuanNcIjtcbmltcG9ydCB7IEhpc3RvcnkgfSBmcm9tIFwiLi9uYXZpZ2F0aW9uL2hpc3RvcnkuanNcIjtcbmltcG9ydCB7IERpTW9kdWxlTG9hZGVyIH0gZnJvbSBcIi4vbG9hZGVyL2RpTW9kdWxlTG9hZGVyLmpzXCI7XG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgTW9kdWxlUnVubmVyIH0gZnJvbSBcIi4vbW9kdWxlUnVubmVyLmpzXCI7XG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4vbWFpbi5qc1wiO1xuaW1wb3J0IHsgQWN0aXZlTW9kdWxlUnVubmVyIH0gZnJvbSBcIi4vYWN0aXZlTW9kdWxlUnVubmVyLmpzXCI7XG5pbXBvcnQgeyBDb25maWd1cmVkRnVuY3Rpb24gfSBmcm9tIFwiLi9jb25maWcvY29uZmlndXJlZEZ1bmN0aW9uLmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50TWFwcGVyIH0gZnJvbSBcIi4vZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJBcHBsaWNhdGlvblwiKTtcblxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uIGV4dGVuZHMgTW9kdWxlUnVubmVyIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xuICAgICAgICB0aGlzLndvcmtlckxpc3QgPSBuZXcgTGlzdCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TGlzdDxEaU1vZHVsZUxvYWRlcj59ICovXG4gICAgICAgIHRoaXMubW9kdWxlTG9hZGVyTGlzdCA9IG5ldyBMaXN0KCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNaW5kaUNvbmZpZ30gKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSBuZXcgTWluZGlDb25maWcoKTtcblxuICAgICAgICAvKiogQHR5cGUge0xpc3R9ICovXG4gICAgICAgIHRoaXMucnVubmluZ1dvcmtlcnMgPSBuZXcgTGlzdCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFpbn0gKi9cbiAgICAgICAgdGhpcy5hY3RpdmVNYWluID0gbnVsbDtcblxuICAgICAgICBDb25maWd1cmVkRnVuY3Rpb24uY29uZmlndXJlKFwid3JhcEV2ZW50XCIsIChwYXJhbWV0ZXIpID0+IHsgcmV0dXJuIG5ldyBFdmVudChwYXJhbWV0ZXIpOyB9KTtcblxuICAgICAgICBDb25maWd1cmVkRnVuY3Rpb24uY29uZmlndXJlKFwibWFwRWxlbWVudFwiLCAocGFyYW1ldGVyKSA9PiB7IHJldHVybiBFbGVtZW50TWFwcGVyLm1hcChwYXJhbWV0ZXIpOyB9KTtcblxuICAgICAgICB0aGlzLmRlZmF1bHRDb25maWcgPSBDb25maWcuZ2V0SW5zdGFuY2UoKS5nZXRUeXBlQ29uZmlnTGlzdCgpO1xuXG4gICAgICAgIHRoaXMuZGVmYXVsdENvbmZpZ1Byb2Nlc3NvcnMgPSBuZXcgTGlzdChbIENvbXBvbmVudENvbmZpZ1Byb2Nlc3NvciBdKTtcblxuICAgICAgICB0aGlzLmRlZmF1bHRJbnN0YW5jZVByb2Nlc3NvcnMgPSBuZXcgTGlzdChbIEluc3RhbmNlUG9zdENvbmZpZ1RyaWdnZXIgXSlcblxuICAgICAgICB0aGlzLmN1c3RvbUNvbmZpZyA9IG5ldyBMaXN0KCk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0xpc3Q8U2luZ2xldG9uQ29uZmlnIHwgUHJvdG90eXBlQ29uZmlnPn0gdHlwZUNvbmZpZ0xpc3QgXG4gICAgICovXG4gICAgc2V0IGN1c3RvbVR5cGVDb25maWcodHlwZUNvbmZpZ0xpc3QpIHtcbiAgICAgICAgdGhpcy5jdXN0b21Db25maWcgPSB0eXBlQ29uZmlnTGlzdDtcbiAgICB9XG5cbiAgICBhc3luYyBydW4oKSB7XG4gICAgICAgIExPRy5pbmZvKFwiUnVubmluZyBBcHBsaWNhdGlvblwiKTtcbiAgICAgICAgdGhpcy5jb25maWdcbiAgICAgICAgICAgIC5hZGRBbGxUeXBlQ29uZmlnKHRoaXMuZGVmYXVsdENvbmZpZylcbiAgICAgICAgICAgIC5hZGRBbGxUeXBlQ29uZmlnKHRoaXMuY3VzdG9tQ29uZmlnKVxuICAgICAgICAgICAgLmFkZEFsbENvbmZpZ1Byb2Nlc3Nvcih0aGlzLmRlZmF1bHRDb25maWdQcm9jZXNzb3JzKVxuICAgICAgICAgICAgLmFkZEFsbEluc3RhbmNlUHJvY2Vzc29yKHRoaXMuZGVmYXVsdEluc3RhbmNlUHJvY2Vzc29ycyk7XG4gICAgICAgIEFjdGl2ZU1vZHVsZVJ1bm5lci5pbnN0YW5jZSgpLnNldCh0aGlzKTtcbiAgICAgICAgQ29udGFpbmVyVXJsLmFkZFVzZXJOYXZpZ2F0ZUxpc3RlbmVyKFxuICAgICAgICAgICAgbmV3IE1ldGhvZCh0aGlzLCB0aGlzLnVwZGF0ZSksXG4gICAgICAgICAgICBFdmVudFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBtYWluID0gYXdhaXQgdGhpcy5ydW5Nb2R1bGUoSGlzdG9yeS5jdXJyZW50VXJsKCkpO1xuICAgICAgICB0aGlzLnN0YXJ0V29ya2VycygpO1xuICAgICAgICByZXR1cm4gbWFpbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqL1xuICAgIHVwZGF0ZShldmVudCkge1xuICAgICAgICBjb25zdCB1cmwgPSBIaXN0b3J5LmN1cnJlbnRVcmwoKTtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlTWFpbiAmJiBTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKHRoaXMuYWN0aXZlTWFpbi5wYXRoLCB1cmwucGF0aCkpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlTWFpbi51cGRhdGUodXJsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJ1bk1vZHVsZSh1cmwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcnVuTW9kdWxlKHVybCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbWFpbiA9IGF3YWl0IHRoaXMuZ2V0TWF0Y2hpbmdNb2R1bGVMb2FkZXIodXJsKS5sb2FkKCk7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZU1haW4gPSBtYWluO1xuICAgICAgICAgICAgbWFpbi5sb2FkKHVybCwgbnVsbCk7XG4gICAgICAgICAgICByZXR1cm4gbWFpbjtcbiAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgTE9HLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhcnRXb3JrZXJzKCkge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nV29ya2Vycy5zaXplKCkgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53b3JrZXJMaXN0LmZvckVhY2goKHZhbHVlLHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgdmFsdWUoKTtcbiAgICAgICAgICAgIE1pbmRpSW5qZWN0b3IuaW5qZWN0KGluc3RhbmNlLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmdXb3JrZXJzLmFkZChpbnN0YW5jZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtVcmx9IHVybFxuICAgICAqIEByZXR1cm5zIHtEaU1vZHVsZUxvYWRlcn1cbiAgICAgKi9cbiAgICBnZXRNYXRjaGluZ01vZHVsZUxvYWRlcih1cmwpIHtcbiAgICAgICAgbGV0IGZvdW5kTW9kdWxlTG9hZGVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5tb2R1bGVMb2FkZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaGVzKHVybCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZE1vZHVsZUxvYWRlciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGZvdW5kTW9kdWxlTG9hZGVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBnbG9iYWwgYWNjZXNzIHRvIGRlcGVuZGVuY3kgaW5qZWN0aW9uIGNvbmZpZ1xuICAgICAqL1xuICAgIHdpbmRvd0RpQ29uZmlnKCkge1xuICAgICAgICB3aW5kb3cuZGlDb25maWcgPSAoKSA9PiB7XG4gICAgICAgICAgICBMT0cuaW5mbyh0aGlzLmNvbmZpZy5jb25maWdFbnRyaWVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBnbG9iYWwgYWNjZXNzIHRvIHRlbXBsYXRlIHJlZ2lzdHJ5XG4gICAgICovXG4gICAgd2luZG93VGVtcGxhdGVSZWdpc3RyeSgpIHtcbiAgICAgICAgd2luZG93LnRlbXBsYXRlUmVnaXN0cnkgPSAoKSA9PiB7XG4gICAgICAgICAgICBMT0cuaW5mbyhDb25maWdBY2Nlc3Nvci5pbnN0YW5jZUhvbGRlcihUZW1wbGF0ZVJlZ2lzdHJ5Lm5hbWUsIHRoaXMuY29uZmlnKS5pbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byBzdHlsZSByZWdpc3RyeVxuICAgICAqL1xuICAgIHdpbmRvd1N0eWxlUmVnaXN0cnkoKSB7XG4gICAgICAgIHdpbmRvdy5zdHlsZVJlZ2lzdHJ5ID0gKCkgPT4ge1xuICAgICAgICAgICAgTE9HLmluZm8oQ29uZmlnQWNjZXNzb3IuaW5zdGFuY2VIb2xkZXIoU3R5bGVzUmVnaXN0cnkubmFtZSwgdGhpcy5jb25maWcpLmluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IFByb3BlcnR5QWNjZXNzb3IsIExpc3QsIExvZ2dlciwgTWV0aG9kIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdElucHV0RWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Fic3RyYWN0SW5wdXRFbGVtZW50XCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJJbnB1dEVsZW1lbnREYXRhQmluZGluZ1wiKTtcblxuZXhwb3J0IGNsYXNzIElucHV0RWxlbWVudERhdGFCaW5kaW5nIHtcblxuICAgIGNvbnN0cnVjdG9yKG1vZGVsLCB2YWxpZGF0b3IpIHtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLnZhbGlkYXRvciA9IHZhbGlkYXRvcjtcbiAgICAgICAgdGhpcy5wdWxsZXJzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5wdXNoZXJzID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbGluayhtb2RlbCwgdmFsaWRhdG9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXRFbGVtZW50RGF0YUJpbmRpbmcobW9kZWwsIHZhbGlkYXRvcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdElucHV0RWxlbWVudH0gZmllbGQgXG4gICAgICovXG4gICAgYW5kKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvKGZpZWxkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmaWVsZCBcbiAgICAgKi9cbiAgICB0byhmaWVsZCkge1xuICAgICAgICBjb25zdCBwdWxsZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbW9kZWxWYWx1ZSA9IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgZmllbGQubmFtZSk7XG4gICAgICAgICAgICBpZiAobW9kZWxWYWx1ZSAhPT0gZmllbGQudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBQcm9wZXJ0eUFjY2Vzc29yLnNldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUsIGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnZhbGlkYXRvciAmJiB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZSl7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0b3IudmFsaWRhdGUoZmllbGQudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBmaWVsZC5saXN0ZW5UbyhcImNoYW5nZVwiLCBuZXcgTWV0aG9kKHRoaXMsIHB1bGxlcikpO1xuICAgICAgICBmaWVsZC5saXN0ZW5UbyhcImtleXVwXCIsIG5ldyBNZXRob2QodGhpcywgcHVsbGVyKSk7XG4gICAgICAgIHB1bGxlci5jYWxsKCk7XG5cbiAgICAgICAgY29uc3QgcHVzaGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgdmFyIG1vZGVsVmFsdWUgPSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUpO1xuICAgICAgICAgICAgaWYgKG1vZGVsVmFsdWUgIT09IGZpZWxkLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgZmllbGQudmFsdWUgPSBtb2RlbFZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMudmFsaWRhdG9yICYmIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlU2lsZW50ICYmIGZpZWxkLnZhbHVlKXtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZVNpbGVudChmaWVsZC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbk5hbWUgPSBcIl9fY2hhbmdlZF9cIiArIGZpZWxkLm5hbWUucmVwbGFjZShcIi5cIixcIl9cIik7XG4gICAgICAgIGlmICghdGhpcy5tb2RlbFtjaGFuZ2VkRnVuY3Rpb25OYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5tb2RlbFtjaGFuZ2VkRnVuY3Rpb25OYW1lXSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHVsbGVycy5hZGQocHVsbGVyKTtcbiAgICAgICAgdGhpcy5wdXNoZXJzLmFkZChwdXNoZXIpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHB1bGwoKSB7XG4gICAgICAgIHRoaXMucHVsbGVycy5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgcHVzaCgpIHtcbiAgICAgICAgdGhpcy5wdXNoZXJzLmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG59XG4iLCJleHBvcnQgY2xhc3MgUHJveHlPYmplY3RGYWN0b3J5IHtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBwcm94eSBmb3IgYW4gb2JqZWN0IHdoaWNoIGFsbG93cyBkYXRhYmluZGluZyBmcm9tIHRoZSBvYmplY3QgdG8gdGhlIGZvcm0gZWxlbWVudFxuICAgICAqIFxuICAgICAqIEB0ZW1wbGF0ZSBUXG4gICAgICogQHBhcmFtIHtUfSBvYmplY3QgXG4gICAgICogQHJldHVybnMge1R9XG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZVByb3h5T2JqZWN0KG9iamVjdCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb3h5KG9iamVjdCwge1xuICAgICAgICAgICAgc2V0OiAodGFyZ2V0LCBwcm9wLCB2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBzdWNjZXNzID0gKHRhcmdldFtwcm9wXSA9IHZhbHVlKTtcblxuICAgICAgICAgICAgICAgIGxldCBjaGFuZ2VkRnVuY3Rpb25OYW1lID0gXCJfX2NoYW5nZWRfXCIgKyBwcm9wO1xuICAgICAgICAgICAgICAgIGxldCBjaGFuZ2VkRnVuY3Rpb24gPSB0YXJnZXRbY2hhbmdlZEZ1bmN0aW9uTmFtZV07XG4gICAgICAgICAgICAgICAgaWYoY2hhbmdlZEZ1bmN0aW9uICYmIHR5cGVvZiBjaGFuZ2VkRnVuY3Rpb24gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBsZXQgYm91bmRDaGFuZ2VkRnVuY3Rpb24gPSBjaGFuZ2VkRnVuY3Rpb24uYmluZCh0YXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICBib3VuZENoYW5nZWRGdW5jdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VzcyA9PT0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuLyoqXG4gKiBPYmplY3QgRnVuY3Rpb24gd2hpY2ggaXMgY2FsbGVkIGlmIHRoZSBmaWx0ZXIgZnVuY3Rpb24gcmV0dXJucyB0cnVlXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEZpbHRlcmVkTWV0aG9kIGV4dGVuZHMgTWV0aG9kIHtcblxuICAgIC8qKlxuICAgICAqIENvbnRydWN0b3JcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gbWV0aG9kIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRoZUZpbHRlciBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihtZXRob2QsIGZpbHRlcil7XG4gICAgICAgIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICAgICAgICB0aGlzLmZpbHRlciA9IGZpbHRlcjtcbiAgICB9XG5cbiAgICBjYWxsKHBhcmFtcyl7XG4gICAgICAgIGlmKHRoaXMuZmlsdGVyICYmIHRoaXMuZmlsdGVyLmNhbGwodGhpcyxwYXJhbXMpKSB7XG4gICAgICAgICAgICB0aGlzLm1ldGhvZC5jYWxsKHBhcmFtcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBNZXRob2QsIE1hcCwgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJFdmVudE1hbmFnZXJcIik7XG5cbi8qKlxuICogRXZlbnRNYW5hZ2VyXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudE1hbmFnZXIge1xuXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLyoqIEB0eXBlIE1hcDxMaXN0PE1ldGhvZD4+ICovXG4gICAgICAgIHRoaXMubGlzdGVuZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gbGlzdGVuZXIgXG4gICAgICogQHJldHVybnMge0V2ZW50TWFuYWdlcn1cbiAgICAgKi9cbiAgICBsaXN0ZW5UbyhldmVudFR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5saXN0ZW5lck1hcC5jb250YWlucyhldmVudFR5cGUpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyTWFwLnNldChldmVudFR5cGUsIG5ldyBMaXN0KCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdGVuZXJNYXAuZ2V0KGV2ZW50VHlwZSkuYWRkKGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBcbiAgICAgKiBAcGFyYW0ge0FycmF5fGFueX0gcGFyYW1ldGVyIFxuICAgICAqL1xuICAgIGFzeW5jIHRyaWdnZXIoZXZlbnRUeXBlLCBwYXJhbWV0ZXIpIHtcbiAgICAgICAgaWYgKCFldmVudFR5cGUpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihcIkV2ZW50IHR5cGUgaXMgdW5kZWZpbmVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5saXN0ZW5lck1hcC5jb250YWlucyhldmVudFR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdEFycmF5ID0gW107XG4gICAgICAgIHRoaXMubGlzdGVuZXJNYXAuZ2V0KGV2ZW50VHlwZSkuZm9yRWFjaCgobGlzdGVuZXIsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgcmVzdWx0QXJyYXkucHVzaChsaXN0ZW5lci5jYWxsKHBhcmFtZXRlcikpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAocmVzdWx0QXJyYXkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0QXJyYXlbMF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHJlc3VsdEFycmF5KTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBBcnJheVV0aWxzLCBMaXN0LCBTdHJpbmdVdGlscyB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudFwiO1xuXG5leHBvcnQgY2xhc3MgQ1NTIHtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGZyb20oYmFzZUVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDU1MoYmFzZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGJhc2VFbGVtZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGJhc2VFbGVtZW50KSB7XG4gICAgICAgIC8qKiBAdHlwZSB7QmFzZUVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQgPSBiYXNlRWxlbWVudDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIFwiXCIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgXG4gICAgICovXG4gICAgdG9nZ2xlKGNzc0NsYXNzKSB7XG4gICAgICAgIGxldCBjdXJyZW50Q2xhc3MgPSB0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwiY2xhc3NcIik7XG4gICAgICAgIGxldCBjdXJyZW50Q2xhc3NBcnJheSA9IFN0cmluZ1V0aWxzLnRvQXJyYXkoY3VycmVudENsYXNzLCBcIiBcIik7XG4gICAgICAgIGxldCBjdXJyZW50Q2xhc3NMaXN0ID0gbmV3IExpc3QoY3VycmVudENsYXNzQXJyYXkpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGN1cnJlbnRDbGFzc0xpc3QuY29udGFpbnMoY3NzQ2xhc3MpKSB7XG4gICAgICAgICAgICBjdXJyZW50Q2xhc3NMaXN0LnJlbW92ZShjc3NDbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50Q2xhc3NMaXN0LmFkZChjc3NDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJjbGFzc1wiLCBBcnJheVV0aWxzLnRvU3RyaW5nKGN1cnJlbnRDbGFzc0xpc3QuZ2V0QXJyYXkoKSwgXCIgXCIpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIFxuICAgICAqL1xuICAgIGVuYWJsZShjc3NDbGFzcykge1xuICAgICAgICBsZXQgY3VycmVudENsYXNzID0gdGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzQXJyYXkgPSBTdHJpbmdVdGlscy50b0FycmF5KGN1cnJlbnRDbGFzcywgXCIgXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzTGlzdCA9IG5ldyBMaXN0KGN1cnJlbnRDbGFzc0FycmF5KTtcbiAgICAgICAgXG4gICAgICAgIGlmICghY3VycmVudENsYXNzTGlzdC5jb250YWlucyhjc3NDbGFzcykpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIEFycmF5VXRpbHMudG9TdHJpbmcoY3VycmVudENsYXNzTGlzdC5nZXRBcnJheSgpLCBcIiBcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgXG4gICAgICovXG4gICAgZGlzYWJsZShjc3NDbGFzcykge1xuICAgICAgICBsZXQgY3VycmVudENsYXNzID0gdGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzQXJyYXkgPSBTdHJpbmdVdGlscy50b0FycmF5KGN1cnJlbnRDbGFzcywgXCIgXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzTGlzdCA9IG5ldyBMaXN0KGN1cnJlbnRDbGFzc0FycmF5KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChjdXJyZW50Q2xhc3NMaXN0LmNvbnRhaW5zKGNzc0NsYXNzKSkge1xuICAgICAgICAgICAgY3VycmVudENsYXNzTGlzdC5yZW1vdmUoY3NzQ2xhc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIEFycmF5VXRpbHMudG9TdHJpbmcoY3VycmVudENsYXNzTGlzdC5nZXRBcnJheSgpLCBcIiBcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3NSZW1vdmFsUHJlZml4IFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjc3NDbGFzc1xuICAgICAqL1xuICAgIHJlcGxhY2UoY3NzQ2xhc3NSZW1vdmFsUHJlZml4LCBjc3NDbGFzcykge1xuICAgICAgICBsZXQgY3VycmVudENsYXNzID0gdGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzQXJyYXkgPSBTdHJpbmdVdGlscy50b0FycmF5KGN1cnJlbnRDbGFzcywgXCIgXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzTGlzdCA9IG5ldyBMaXN0KGN1cnJlbnRDbGFzc0FycmF5KTtcbiAgICAgICAgbGV0IHRvUmVtb3ZlQXJyYXkgPSBbXTtcblxuICAgICAgICBpZiAoIVN0cmluZ1V0aWxzLmlzQmxhbmsoY3NzQ2xhc3NSZW1vdmFsUHJlZml4KSkge1xuICAgICAgICAgICAgY3VycmVudENsYXNzTGlzdC5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKGNzc0NsYXNzUmVtb3ZhbFByZWZpeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9SZW1vdmVBcnJheS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvUmVtb3ZlQXJyYXkuZm9yRWFjaCgodG9SZW1vdmVWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgY3VycmVudENsYXNzTGlzdC5yZW1vdmUodG9SZW1vdmVWYWx1ZSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY3VycmVudENsYXNzTGlzdC5hZGQoY3NzQ2xhc3MpO1xuICAgICAgICB0aGlzLmJhc2VFbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiY2xhc3NcIiwgQXJyYXlVdGlscy50b1N0cmluZyhjdXJyZW50Q2xhc3NMaXN0LmdldEFycmF5KCksIFwiIFwiKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIFxuXG59IiwiaW1wb3J0IHsgTGlzdCwgTWFwLCBNYXBVdGlscywgU3RyaW5nVXRpbHMgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnRcIjtcblxuZXhwb3J0IGNsYXNzIFN0eWxlIHtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGZyb20oYmFzZUVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHlsZShiYXNlRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gYmFzZUVsZW1lbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoYmFzZUVsZW1lbnQpIHtcbiAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudCA9IGJhc2VFbGVtZW50O1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmJhc2VFbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIiwgXCJcIik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHlsZU5hbWUgXG4gICAgICovXG4gICAgcmVtb3ZlKHN0eWxlTmFtZSkge1xuICAgICAgICBjb25zdCBjdXJyZW50U3R5bGVNYXAgPSB0aGlzLnNyeWxlc0FzTWFwKHRoaXMuYmFzZUVsZW1lbnQuZ2V0QXR0cmlidXRlVmFsdWUoXCJzdHlsZVwiKSk7XG4gICAgICAgIGlmIChjdXJyZW50U3R5bGVNYXAuY29udGFpbnMoc3R5bGVOYW1lKSkge1xuICAgICAgICAgICAgY3VycmVudFN0eWxlTWFwLnJlbW92ZShzdHlsZU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJzdHlsZVwiLCBNYXBVdGlscy50b1N0cmluZyhjdXJyZW50U3R5bGVNYXAsIFwiOlwiLCBcIjtcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVOYW1lIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHlsZVZhbHVlIFxuICAgICAqL1xuICAgIHNldChzdHlsZU5hbWUsIHN0eWxlVmFsdWUpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlTWFwID0gdGhpcy5zcnlsZXNBc01hcCh0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIikpO1xuICAgICAgICBjdXJyZW50U3R5bGVNYXAuc2V0KHN0eWxlTmFtZSwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJzdHlsZVwiLCBNYXBVdGlscy50b1N0cmluZyhjdXJyZW50U3R5bGVNYXAsIFwiOlwiLCBcIjtcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVOYW1lIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHlsZVZhbHVlIFxuICAgICAqL1xuICAgICBpcyhzdHlsZU5hbWUsIHN0eWxlVmFsdWUpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlTWFwID0gdGhpcy5zcnlsZXNBc01hcCh0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIikpO1xuICAgICAgICByZXR1cm4gU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyhjdXJyZW50U3R5bGVNYXAuZ2V0KHN0eWxlTmFtZSksIHN0eWxlVmFsdWUpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVOYW1lIFxuICAgICAqL1xuICAgICBleGlzdHMoc3R5bGVOYW1lKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTdHlsZU1hcCA9IHRoaXMuc3J5bGVzQXNNYXAodGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcInN0eWxlXCIpKTtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRTdHlsZU1hcC5jb250YWlucyhzdHlsZU5hbWUpO1xuICAgIH1cblxuICAgIHNyeWxlc0FzTWFwKHN0eWxlcykge1xuICAgICAgICBpZiAoIXN0eWxlcyB8fCBzdHlsZXMuaW5kZXhPZihcIjpcIikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRTdHlsZVBhaXJMaXN0ID0gbmV3IExpc3QoU3RyaW5nVXRpbHMudG9BcnJheShzdHlsZXMsIFwiO1wiKSk7XG4gICAgICAgIGN1cnJlbnRTdHlsZVBhaXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICghdmFsdWUgfHwgdmFsdWUuaW5kZXhPZihcIjpcIikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWRLZXkgPSB2YWx1ZS5zcGxpdChcIjpcIilbMF0udHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWRWYWx1ZSA9IHZhbHVlLnNwbGl0KFwiOlwiKVsxXS50cmltKCk7XG4gICAgICAgICAgICBjdXJyZW50U3R5bGVNYXAuc2V0KHJlc29sdmVkS2V5LCByZXNvbHZlZFZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGN1cnJlbnRTdHlsZU1hcDtcbiAgICB9XG5cbn0iLCJleHBvcnQgY2xhc3MgVHJhaWxOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLnRyYWlsID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge3Byb3BlcnR5fSAqL1xuICAgICAgICB0aGlzLnByb3BlcnR5ID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge2Z1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLndheXBvaW50ID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge2Z1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge0FycmF5PFRyYWlsTm9kZT59ICovXG4gICAgICAgIHRoaXMubmV4dCA9IG51bGw7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTGlzdCwgU3RyaW5nVXRpbHMgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFRyYWlsTm9kZSB9IGZyb20gXCIuL3RyYWlsTm9kZS5qc1wiO1xuaW1wb3J0IHsgSGlzdG9yeSB9IGZyb20gXCIuL2hpc3RvcnkuanNcIjtcbmltcG9ydCB7IFVybEJ1aWxkZXIgfSBmcm9tIFwiLi4vdXRpbC91cmxCdWlsZGVyLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUcmFpbFByb2Nlc3NvciB7XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyB0aGUgYWxsIG1hdGNoaW5nIGZ1bmN0aW9ucyBiYXNlZCBvbiB0aGUgdHJhaWwgaW4gdGhlIHVybFxuICAgICAqIGFuZCBjYWxscyB0aG9zZSBmdW5jdGlvbnMuIEFsc28gZW5zdXJlcyB0aGF0IHRoZSBsaXN0XG4gICAgICogb2YgdHJhaWwgc3RvcHMgYXJlIGFkZGVkIHRvIHRoZSBoaXN0b3J5XG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcGFyYW0ge2FueX0gY2FsbGluZ09iamVjdCBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKi9cbiAgICBzdGF0aWMgbmF2aWdhdGVBbGxTdG9wcyh1cmwsIGNhbGxpbmdPYmplY3QsIG5vZGUpIHtcbiAgICAgICAgY29uc3QgdHJhaWxTdG9wcyA9IFRyYWlsUHJvY2Vzc29yLmNhbGxNYXRjaGluZ0Z1bmN0aW9uRnJvbVVybCh1cmwsIGNhbGxpbmdPYmplY3QsIG5vZGUpO1xuICAgICAgICBpZiAoIXRyYWlsU3RvcHMgfHwgMCA9PT0gdHJhaWxTdG9wcy5zaXplKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVybEJ1aWxkZXIgPSBVcmxCdWlsZGVyLmJ1aWxkZXIoKS53aXRoQWxsT2ZVcmwoSGlzdG9yeS5jdXJyZW50VXJsKCkpO1xuICAgICAgICBjb25zdCBzdGVwVXJsID0gdXJsQnVpbGRlci53aXRoQm9va21hcmsobnVsbCkuYnVpbGQoKTtcbiAgICAgICAgSGlzdG9yeS5yZXBsYWNlVXJsKHN0ZXBVcmwsIHN0ZXBVcmwudG9TdHJpbmcoKSwgbnVsbCk7XG4gICAgICAgIFxuICAgICAgICB0cmFpbFN0b3BzLmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdGVwVXJsID0gdXJsQnVpbGRlci53aXRoQm9va21hcmsodmFsdWUpLmJ1aWxkKCk7XG4gICAgICAgICAgICBIaXN0b3J5LnB1c2hVcmwoc3RlcFVybCwgc3RlcFVybC50b1N0cmluZygpLCB2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIG1hdGNoaW5nIGZ1bmN0aW9uIGJhc2VkIG9uIHRoZSB0cmFpbCBpbiB0aGUgdXJsXG4gICAgICogYW5kIGNhbGxzIHRoYXQgZnVuY3Rpb24uXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcGFyYW0ge2FueX0gY2FsbGluZ09iamVjdCBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKi9cbiAgICBzdGF0aWMgbmF2aWdhdGVOZXh0U3RvcCh1cmwsIGNhbGxpbmdPYmplY3QsIG5vZGUpIHtcbiAgICAgICAgVHJhaWxQcm9jZXNzb3IuY2FsbE1hdGNoaW5nRnVuY3Rpb25Gcm9tVXJsKHVybCwgY2FsbGluZ09iamVjdCwgbm9kZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIHRyYWlsIHN0b3Agd2hpY2ggbWF0Y2hlcyB0aGUgZnVuY3Rpb24gYW5kIHJlY29yZHMgaXQgaW4gdGhlIGhpc3RvcnlcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSB0aGVGdW5jdGlvbiBcbiAgICAgKiBAcGFyYW0ge2FueX0gY2FsbGluZ09iamVjdCBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKi9cbiAgICBzdGF0aWMgZmluZE5leHRTdG9wKHRoZUZ1bmN0aW9uLCBjYWxsaW5nT2JqZWN0LCBub2RlKSB7XG5cbiAgICAgICAgY29uc3QgY3VycmVudFVybCA9IEhpc3RvcnkuY3VycmVudFVybCgpO1xuXG4gICAgICAgIGNvbnN0IG1hdGNoaW5nTm9kZSA9IFRyYWlsUHJvY2Vzc29yLmdldE5vZGVCeUZ1bmN0aW9uKG5vZGUsIHRoZUZ1bmN0aW9uKTtcblxuICAgICAgICBpZiAoIW1hdGNoaW5nTm9kZSkgeyBcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGV4ZWN1dGVkRnVuY3Rpb25Qcm9taXNlID0gbWF0Y2hpbmdOb2RlLmRlc3RpbmF0aW9uLmNhbGwoY2FsbGluZ09iamVjdCk7XG5cbiAgICAgICAgaWYgKCFTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKGN1cnJlbnRVcmwuYm9va21hcmssIG1hdGNoaW5nTm9kZS50cmFpbCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVybEJ1aWxkZXIgPSBVcmxCdWlsZGVyLmJ1aWxkZXIoKS53aXRoQWxsT2ZVcmwoY3VycmVudFVybCk7XG4gICAgICAgICAgICBpZiAoU3RyaW5nVXRpbHMuaXNCbGFuayhjdXJyZW50VXJsLmJvb2ttYXJrKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0ZXBVcmwgPSB1cmxCdWlsZGVyLndpdGhCb29rbWFyayhcIi9cIikuYnVpbGQoKTtcbiAgICAgICAgICAgICAgICBIaXN0b3J5LnB1c2hVcmwoc3RlcFVybCwgc3RlcFVybC50b1N0cmluZygpLCBudWxsKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc3RlcFVybCA9IHVybEJ1aWxkZXIud2l0aEJvb2ttYXJrKG1hdGNoaW5nTm9kZS50cmFpbCkuYnVpbGQoKTtcbiAgICAgICAgICAgIEhpc3RvcnkucHVzaFVybChzdGVwVXJsLCBzdGVwVXJsLnRvU3RyaW5nKCksIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4ZWN1dGVkRnVuY3Rpb25Qcm9taXNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSB0cmFpbCBzdG9wIHdoaWNoIG1hdGNoZXMgdGhlIGZ1bmN0aW9uIGFuZCByZXBsYWNlcyBjdXJyZW50IHVybCB3aXRoIGl0XG4gICAgICogXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gdGhlRnVuY3Rpb24gXG4gICAgICogQHBhcmFtIHthbnl9IGNhbGxpbmdPYmplY3QgXG4gICAgICogQHBhcmFtIHtUcmFpbE5vZGV9IG5vZGUgXG4gICAgICovXG4gICAgIHN0YXRpYyByZXBsYWNlQ3VycmVudFN0b3AodGhlRnVuY3Rpb24sIGNhbGxpbmdPYmplY3QsIG5vZGUpIHtcblxuICAgICAgICBjb25zdCBjdXJyZW50VXJsID0gSGlzdG9yeS5jdXJyZW50VXJsKCk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdOb2RlID0gVHJhaWxQcm9jZXNzb3IuZ2V0Tm9kZUJ5RnVuY3Rpb24obm9kZSwgdGhlRnVuY3Rpb24pO1xuXG4gICAgICAgIGlmICghbWF0Y2hpbmdOb2RlKSB7IFxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhlY3V0ZWRGdW5jdGlvblByb21pc2UgPSBtYXRjaGluZ05vZGUuZGVzdGluYXRpb24uY2FsbChjYWxsaW5nT2JqZWN0KTtcblxuICAgICAgICBpZiAoIVN0cmluZ1V0aWxzLm5vbk51bGxFcXVhbHMoY3VycmVudFVybC5ib29rbWFyaywgbWF0Y2hpbmdOb2RlLnRyYWlsKSkge1xuICAgICAgICAgICAgY29uc3QgdXJsQnVpbGRlciA9IFVybEJ1aWxkZXIuYnVpbGRlcigpLndpdGhBbGxPZlVybChjdXJyZW50VXJsKTtcbiAgICAgICAgICAgIGNvbnN0IHN0ZXBVcmwgPSB1cmxCdWlsZGVyLndpdGhCb29rbWFyayhtYXRjaGluZ05vZGUudHJhaWwpLmJ1aWxkKCk7XG4gICAgICAgICAgICBIaXN0b3J5LnJlcGxhY2VVcmwoc3RlcFVybCwgc3RlcFVybC50b1N0cmluZygpLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBleGVjdXRlZEZ1bmN0aW9uUHJvbWlzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGhlRnVuY3Rpb24gXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgc3RhdGljIGdldE5vZGVCeUZ1bmN0aW9uKG5vZGUsIHRoZUZ1bmN0aW9uKSB7XG5cbiAgICAgICAgaWYgKHRoZUZ1bmN0aW9uID09PSBub2RlLmRlc3RpbmF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLm5leHQpIHtcbiAgICAgICAgICAgIGxldCBtYXRjaGluZ05vZGUgPSBudWxsO1xuICAgICAgICAgICAgbm9kZS5uZXh0LmZvckVhY2goKGNoaWxkTm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghbWF0Y2hpbmdOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nTm9kZSA9IFRyYWlsUHJvY2Vzc29yLmdldE5vZGVCeUZ1bmN0aW9uKGNoaWxkTm9kZSwgdGhlRnVuY3Rpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKG1hdGNoaW5nTm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRjaGluZ05vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEBwYXJhbSB7YW55fSBvYmplY3QgXG4gICAgICogQHBhcmFtIHtUcmFpbE5vZGV9IG5vZGUgXG4gICAgICogQHBhcmFtIHtMaXN0PFN0cmluZz59IHRyYWlsU3RvcHNcbiAgICAgKiBAcmV0dXJucyB7TGlzdDxTdHJpbmc+fVxuICAgICAqL1xuICAgIHN0YXRpYyBjYWxsTWF0Y2hpbmdGdW5jdGlvbkZyb21VcmwodXJsLCBjdXJyZW50T2JqZWN0LCBub2RlLCB0cmFpbFN0b3BzID0gbmV3IExpc3QoKSkge1xuXG4gICAgICAgIGlmIChub2RlLnByb3BlcnR5KSB7XG4gICAgICAgICAgICBjdXJyZW50T2JqZWN0ID0gY3VycmVudE9iamVjdFtub2RlLnByb3BlcnR5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChTdHJpbmdVdGlscy5zdGFydHNXaXRoKHVybC5ib29rbWFyaywgVHJhaWxQcm9jZXNzb3IudG9TdGFydHNXaXRoKG5vZGUudHJhaWwpKSkge1xuICAgICAgICAgICAgdHJhaWxTdG9wcy5hZGQobm9kZS50cmFpbCk7XG4gICAgICAgICAgICBpZiAobm9kZS53YXlwb2ludCkge1xuICAgICAgICAgICAgICAgIG5vZGUud2F5cG9pbnQuY2FsbChjdXJyZW50T2JqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKHVybC5ib29rbWFyaywgbm9kZS50cmFpbCkpIHtcbiAgICAgICAgICAgIHRyYWlsU3RvcHMuYWRkKG5vZGUudHJhaWwpO1xuICAgICAgICAgICAgaWYgKG5vZGUuZGVzdGluYXRpb24pIHtcbiAgICAgICAgICAgICAgICBub2RlLmRlc3RpbmF0aW9uLmNhbGwoY3VycmVudE9iamVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9kZS5uZXh0KSB7XG4gICAgICAgICAgICBub2RlLm5leHQuZm9yRWFjaCgoY2hpbGROb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgdHJhaWxTdG9wcyA9IFRyYWlsUHJvY2Vzc29yLmNhbGxNYXRjaGluZ0Z1bmN0aW9uRnJvbVVybCh1cmwsIGN1cnJlbnRPYmplY3QsIGNoaWxkTm9kZSwgdHJhaWxTdG9wcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cmFpbFN0b3BzO1xuICAgIH1cblxuICAgIHN0YXRpYyB0b1N0YXJ0c1dpdGgodHJhaWwpIHtcblxuICAgICAgICBpZiAobnVsbCA9PSB0cmFpbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiL1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFN0cmluZ1V0aWxzLm5vbk51bGxFcXVhbHModHJhaWwsIFwiL1wiKSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiL1wiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRyYWlsICsgXCIvXCI7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTWFwLCBMb2dnZXIsIFN0cmluZ1V0aWxzIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xuXG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJIdHRwQ2FsbEJ1aWxkZXJcIik7XG5cbmV4cG9ydCBjbGFzcyBIdHRwQ2FsbEJ1aWxkZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih1cmwpIHtcblxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMuYXV0aG9yaXphdGlvbiA9IG51bGw7XG5cblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy5zdWNjZXNzTWFwcGluZ01hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy5mYWlsTWFwcGluZ01hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge2Z1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLmVycm9yTWFwcGluZ0Z1bmN0aW9uID0gKGVycm9yKSA9PiB7IHJldHVybiBlcnJvcjsgfTtcblxuXG4gICAgICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUgPSA0MDAwO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xuICAgICAgICB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlID0gNDAwMDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEByZXR1cm5zIHtIdHRwQ2FsbEJ1aWxkZXJ9XG4gICAgICovXG4gICAgc3RhdGljIG5ld0luc3RhbmNlKHVybCkge1xuICAgICAgICByZXR1cm4gbmV3IEh0dHBDYWxsQnVpbGRlcih1cmwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1hcHBlckZ1bmN0aW9uIG1hcHBlciBmdW5jdGlvbiB0byBwYXNzIHRoZSByZXN1bHQgb2JqZWN0IHRvXG4gICAgICovXG4gICAgc3VjY2Vzc01hcHBpbmcoY29kZSwgbWFwcGVyRnVuY3Rpb24gPSAoKSA9PiB7IHJldHVybiBudWxsOyB9KSB7XG4gICAgICAgIHRoaXMuc3VjY2Vzc01hcHBpbmdNYXAuc2V0KGNvZGUsIG1hcHBlckZ1bmN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGNvZGUgXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cbiAgICAgKi9cbiAgICBmYWlsTWFwcGluZyhjb2RlLCBtYXBwZXJGdW5jdGlvbiA9ICgpID0+IHsgcmV0dXJuIG51bGw7IH0pIHtcbiAgICAgICAgdGhpcy5mYWlsTWFwcGluZ01hcC5zZXQoY29kZSwgbWFwcGVyRnVuY3Rpb24pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtYXBwZXJGdW5jdGlvbiBtYXBwZXIgZnVuY3Rpb24gdG8gcGFzcyB0aGUgcmVzdWx0IG9iamVjdCB0b1xuICAgICAqL1xuICAgIGVycm9yTWFwcGluZyhtYXBwZXJGdW5jdGlvbikge1xuICAgICAgICB0aGlzLmVycm9yTWFwcGluZ0Z1bmN0aW9uID0gbWFwcGVyRnVuY3Rpb247XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpemF0aW9uIFxuICAgICAqL1xuICAgIGF1dGhvcml6YXRpb25IZWFkZXIoYXV0aG9yaXphdGlvbikge1xuICAgICAgICBpZiAoIVN0cmluZ1V0aWxzLmlzQmxhbmsoYXV0aG9yaXphdGlvbikpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0aG9yaXphdGlvbiA9IFwiQmVhcmVyIFwiICsgYXV0aG9yaXphdGlvbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25uZWN0aW9uVGltZW91dChjb25uZWN0aW9uVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSA9IGNvbm5lY3Rpb25UaW1lb3V0VmFsdWU7XG4gICAgfVxuXG4gICAgcmVzcG9uc2VUaW1lb3V0KHJlc3BvbnNlVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUgPSByZXNwb25zZVRpbWVvdXRWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBhc3luYyBnZXQoKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gQ2xpZW50LmdldCh0aGlzLnVybCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pO1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBhc3luYyBwb3N0KHBheWxvYWQpIHtcbiAgICAgICAgY29uc3QgcmVzcG9zbmUgPSBhd2FpdCBDbGllbnQucG9zdCh0aGlzLnVybCwgcGF5bG9hZCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pO1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3Bvc25lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBhc3luYyBwdXQocGF5bG9hZCkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IENsaWVudC5wdXQodGhpcy51cmwsIHBheWxvYWQsIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSwgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSwgdGhpcy5hdXRob3JpemF0aW9uKVxuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBhc3luYyBwYXRjaChwYXlsb2FkKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LnBhdGNoKHRoaXMudXJsLCBwYXlsb2FkLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbik7XG4gICAgICAgIHJldHVybiB0aGlzLmFzVHlwZU1hcHBlZFByb21pc2UocmVzcG9uc2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGFzeW5jIGRlbGV0ZSgpIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBDbGllbnQuZGVsZXRlKHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1Byb21pc2V9IGZldGNoUHJvbWlzZSBcbiAgICAgKi9cbiAgICBhc3luYyBhc1R5cGVNYXBwZWRQcm9taXNlKGZldGNoUHJvbWlzZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZmV0Y2hSZXNwb25zZSA9IGF3YWl0IGZldGNoUHJvbWlzZTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUZldGNoUmVzcG9uc2UoZmV0Y2hSZXNwb25zZSk7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIEFQSSBkaWQgbm90IGV4ZWN1dGVcbiAgICAgICAgICAgIHRocm93IHRoaXMuZXJyb3JNYXBwaW5nRnVuY3Rpb24oZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtSZXNwb25zZX0gZmV0Y2hSZXNwb25zZSBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlamVjdCBcbiAgICAgKi9cbiAgICBhc3luYyBoYW5kbGVGZXRjaFJlc3BvbnNlKGZldGNoUmVzcG9uc2UpIHtcbiAgICAgICAgY29uc3Qgc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyID0gdGhpcy5zdWNjZXNzTWFwcGluZ01hcC5nZXQoZmV0Y2hSZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICBjb25zdCBmYWlsUmVzcG9uc2VNYXBwZXIgPSB0aGlzLmZhaWxNYXBwaW5nTWFwLmdldChmZXRjaFJlc3BvbnNlLnN0YXR1cyk7XG5cbiAgICAgICAgLy8gRW1wdHkgcmVzcG9uc2VcbiAgICAgICAgaWYgKDIwNCA9PT0gZmV0Y2hSZXNwb25zZS5zdGF0dXMgfHwgZmV0Y2hSZXNwb25zZS5oZWFkZXJzLmdldChcIkNvbnRlbnQtTGVuZ3RoXCIpID09PSBcIjBcIikge1xuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NSZXNwb25zZU1hcHBlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzUmVzcG9uc2VNYXBwZXIobnVsbCk7IFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZmFpbFJlc3BvbnNlTWFwcGVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZmFpbFJlc3BvbnNlTWFwcGVyKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyBtYXBwZXIgZm9yIHJldHVybiBzdGF0dXM6IFwiICsgZmV0Y2hSZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzdW1pbmcganNvbiByZXNwb25zZSAgICAgIFxuICAgICAgICB0cnkgeyAgXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZUpzb24gPSBhd2FpdCBmZXRjaFJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgIGlmIChzdWNjZXNzUmVzcG9uc2VNYXBwZXIpIHsgXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3NSZXNwb25zZU1hcHBlcihyZXNwb25zZUpzb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZhaWxSZXNwb25zZU1hcHBlcikge1xuICAgICAgICAgICAgICAgIHRocm93IGZhaWxSZXNwb25zZU1hcHBlcihyZXNwb25zZUpzb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhyb3cgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihyZXNwb25zZUpzb24pO1xuICAgICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBSZXNwb25zZSBkaWQgbm90IHByb3ZpZGUganNvblxuICAgICAgICAgICAgdGhyb3cgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMaXN0LCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkFic3RyYWN0VmFsaWRhdG9yXCIpO1xuXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0N1cnJlbnRseVZhbGlkXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgZW5hYmxlZCA9IHRydWUpIHtcbiAgICAgICAgdGhpcy52YWxpZExpc3RlbmVyTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMuaW52YWxpZExpc3RlbmVyTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBjdXJyZW50bHlWYWxpZDtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gZW5hYmxlZDtcbiAgICB9XG5cbiAgICBlbmFibGUoKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgdGhpcy52YWxpZCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbnZhbGlkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkaXNhYmxlKCkge1xuICAgICAgICBsZXQgd2FzVmFsaWQgPSB0aGlzLmN1cnJlbnRseVZhbGlkO1xuICAgICAgICAvLyBGYWtlIHZhbGlkXG4gICAgICAgIHRoaXMudmFsaWQoKTtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB3YXNWYWxpZDtcbiAgICB9XG5cbiAgICBpc1ZhbGlkKCkge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudGx5VmFsaWQ7XG4gICAgfVxuXG5cdHZhbGlkKCkge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB0cnVlO1xuICAgICAgICBpZighdGhpcy52YWxpZExpc3RlbmVyTGlzdCkge1xuICAgICAgICAgICAgTE9HLndhcm4oXCJObyB2YWxpZGF0aW9uIGxpc3RlbmVyc1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnZhbGlkTGlzdGVuZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcblx0fVxuXG5cdGludmFsaWQoKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IGZhbHNlO1xuICAgICAgICBpZighdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0KSB7XG4gICAgICAgICAgICBMT0cud2FybihcIk5vIGludmFsaWRhdGlvbiBsaXN0ZW5lcnNcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcblx0fVxuXG5cdHZhbGlkU2lsZW50KCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gdHJ1ZTtcblx0fVxuXG5cdGludmFsaWRTaWxlbnQoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBmYWxzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIHtNZXRob2R9IHZhbGlkTGlzdGVuZXIgXG5cdCAqL1xuXHR3aXRoVmFsaWRMaXN0ZW5lcih2YWxpZExpc3RlbmVyKSB7XG5cdFx0dGhpcy52YWxpZExpc3RlbmVyTGlzdC5hZGQodmFsaWRMaXN0ZW5lcik7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7TWV0aG9kfSBpbnZhbGlkTGlzdGVuZXIgXG5cdCAqL1xuXHR3aXRoSW52YWxpZExpc3RlbmVyKGludmFsaWRMaXN0ZW5lcikge1xuXHRcdHRoaXMuaW52YWxpZExpc3RlbmVyTGlzdC5hZGQoaW52YWxpZExpc3RlbmVyKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59XG4iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBSZWdleFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIHJlZ2V4ID0gXCIoLiopXCIpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcbiAgICAgICAgdGhpcy5yZWdleCA9IHJlZ2V4O1xuICAgIH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS5tYXRjaCh0aGlzLnJlZ2V4KSl7XG5cdCAgICBcdHRoaXMudmFsaWQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIXZhbHVlICYmICF0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0XHR0aGlzLnZhbGlkKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS5tYXRjaCh0aGlzLnJlZ2V4KSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIXZhbHVlICYmICF0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0XHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxufVxuIiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRW1haWxWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XG5cbiAgICBzdGF0aWMgZ2V0IEVNQUlMX0ZPUk1BVCgpIHsgcmV0dXJuIC9eXFx3KyhbXFwuLV0/XFx3KykqQFxcdysoW1xcLi1dP1xcdyspKihcXC5cXHd7MiwzfSkrJC87IH1cblxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIobWFuZGF0b3J5LCBpc2N1cnJlbnRseVZhbGlkLCBFbWFpbFZhbGlkYXRvci5FTUFJTF9GT1JNQVQpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgTGlzdCwgTWV0aG9kIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3RWYWxpZGF0b3IuanMnO1xuXG5leHBvcnQgY2xhc3MgQW5kVmFsaWRhdG9yU2V0IGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IoaXNWYWxpZEZyb21TdGFydCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKGlzVmFsaWRGcm9tU3RhcnQpO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QgPSBuZXcgTGlzdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RWYWxpZGF0b3J9IHZhbGlkYXRvclxuICAgICAqL1xuICAgIHdpdGhWYWxpZGF0b3IodmFsaWRhdG9yKSB7XG4gICAgICAgIHZhbGlkYXRvci53aXRoVmFsaWRMaXN0ZW5lcihuZXcgTWV0aG9kKHRoaXMsIHRoaXMub25lVmFsaWQpKTtcbiAgICAgICAgdmFsaWRhdG9yLndpdGhJbnZhbGlkTGlzdGVuZXIobmV3IE1ldGhvZCh0aGlzLCB0aGlzLm9uZUludmFsaWQpKTtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0LmFkZCh2YWxpZGF0b3IpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbmUgdmFsaWRhdG9yIHNhaWQgaXQgd2FzIHZhbGlkXG4gICAgICovXG4gICAgb25lVmFsaWQoKSB7XG4gICAgICAgIGxldCBmb3VuZEludmFsaWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0LmZvckVhY2goKHZhbHVlLHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgaWYoIXZhbHVlLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIGZvdW5kSW52YWxpZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICBpZighZm91bmRJbnZhbGlkKSB7XG4gICAgICAgICAgICBzdXBlci52YWxpZCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3VwZXIuaW52YWxpZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyBpbnZhbGlkXG4gICAgICovXG4gICAgb25lSW52YWxpZCgpIHtcbiAgICAgICAgc3VwZXIuaW52YWxpZCgpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgeyBNZXRob2QsIFByb3BlcnR5QWNjZXNzb3IgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIEVxdWFsc1Byb3BlcnR5VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG5cdC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcblx0ICogQHBhcmFtIHtNZXRob2R9IGNvbXBhcmVkVmFsdWVGdW5jdGlvbiBcblx0ICovXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgbW9kZWwgPSBudWxsLCBhdHRyaWJ1dGVOYW1lID0gbnVsbCkge1xuXHRcdHN1cGVyKGlzY3VycmVudGx5VmFsaWQpO1xuXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xuXG5cdFx0LyoqIEB0eXBlIHtvYmplY3R9ICovXG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGVOYW1lO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCB0aGlzLmF0dHJpYnV0ZU5hbWUpKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIHRoaXMuYXR0cmlidXRlTmFtZSkpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHsgTWV0aG9kIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBFcXVhbHNGdW5jdGlvblJlc3VsdFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gbWFuZGF0b3J5IFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGlzY3VycmVudGx5VmFsaWQgXG5cdCAqIEBwYXJhbSB7TWV0aG9kfSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXG5cdCAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIGNvbXBhcmVkVmFsdWVGdW5jdGlvbiA9IG51bGwpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcblxuXHRcdC8qKiBAdHlwZSB7TWV0aG9kfSAqL1xuXHRcdHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uID0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gdGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24uY2FsbCgpKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSB0aGlzLmNvbXBhcmVkVmFsdWVGdW5jdGlvbi5jYWxsKCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHsgTWV0aG9kLCBQcm9wZXJ0eUFjY2Vzc29yIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBFcXVhbHNTdHJpbmdWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxuXHQgKiBAcGFyYW0ge01ldGhvZH0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxuXHQgKi9cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBjb250cm9sVmFsdWUgPSBudWxsKSB7XG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XG5cblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gY29udHJvbFZhbHVlO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gY29udHJvbFZhbHVlKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59IiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xuXG5cbmV4cG9ydCBjbGFzcyBOdW1iZXJWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XG5cbiAgICBzdGF0aWMgZ2V0IFBIT05FX0ZPUk1BVCgpIHsgcmV0dXJuIC9eXFxkKiQvOyB9XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgTnVtYmVyVmFsaWRhdG9yLlBIT05FX0ZPUk1BVCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBMaXN0LCBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSAnLi9hYnN0cmFjdFZhbGlkYXRvci5qcydcblxuZXhwb3J0IGNsYXNzIE9yVmFsaWRhdG9yU2V0IGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKGlzVmFsaWRGcm9tU3RhcnQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0ID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0VmFsaWRhdG9yfSB2YWxpZGF0b3JcbiAgICAgKi9cbiAgICB3aXRoVmFsaWRhdG9yKHZhbGlkYXRvcikge1xuICAgICAgICB2YWxpZGF0b3Iud2l0aFZhbGlkTGlzdGVuZXIobmV3IE1ldGhvZCh0aGlzLCB0aGlzLm9uZVZhbGlkKSk7XG4gICAgICAgIHZhbGlkYXRvci53aXRoSW52YWxpZExpc3RlbmVyKG5ldyBNZXRob2QodGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxuICAgICAqL1xuICAgIG9uZVZhbGlkKCkge1xuICAgICAgICBzdXBlci52YWxpZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxuICAgICAqL1xuICAgIG9uZUludmFsaWQoKSB7XG4gICAgICAgIGxldCBmb3VuZFZhbGlkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmKHZhbHVlLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIGZvdW5kVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgaWYoZm91bmRWYWxpZCkge1xuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuY29uc3QgUEFTU1dPUkRfRk9STUFUID0gL14oPz0uKltBLVphLXpdKSg/PS4qP1swLTldKSg/PS4qP1sjPyFAJCVeJiotXSkuezgsfSQvO1xuXG5leHBvcnQgY2xhc3MgUGFzc3dvcmRWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgUEFTU1dPUkRfRk9STUFUKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuZXhwb3J0IGNsYXNzIFBob25lVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xuXG4gICAgc3RhdGljIGdldCBQSE9ORV9GT1JNQVQoKSB7IHJldHVybiAvXlxcK1swLTldezJ9XFxzPyhbMC05XVxccz8pKiQvOyB9XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgUGhvbmVWYWxpZGF0b3IuUEhPTkVfRk9STUFUKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcblxuZXhwb3J0IGNsYXNzIFJlcXVpcmVkVmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG5cdGNvbnN0cnVjdG9yKGN1cnJlbnRseVZhbGlkID0gZmFsc2UsIGVuYWJsZWQgPSB0cnVlKSB7XG5cdFx0c3VwZXIoY3VycmVudGx5VmFsaWQsIGVuYWJsZWQpO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmKHZhbHVlID09PSBcIlwiKXtcblx0ICAgIFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYodmFsdWUgPT09IFwiXCIpe1xuXHQgICAgXHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59XG4iXSwibmFtZXMiOlsiTGlzdCIsIk1hcCIsIlN0cmluZ1V0aWxzIiwiQ29udGFpbmVyVXJsIiwiQ29udGFpbmVySHR0cENsaWVudCIsIkxPRyIsIkxvZ2dlciIsIkluamVjdGlvblBvaW50IiwiWG1sRWxlbWVudCIsIkNvbnRhaW5lckVsZW1lbnQiLCJYbWxDZGF0YSIsIk1ldGhvZCIsIkNvbnRhaW5lcldpbmRvdyIsIkRvbVRyZWUiLCJTaW5nbGV0b25Db25maWciLCJQcm90b3R5cGVDb25maWciLCJNaW5kaUluamVjdG9yIiwiTWluZGlDb25maWciLCJJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyIiwiQ29uZmlnQWNjZXNzb3IiLCJQcm9wZXJ0eUFjY2Vzc29yIiwiQXJyYXlVdGlscyIsIk1hcFV0aWxzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBTyxNQUFNLFlBQVksQ0FBQztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLLFNBQVMsQ0FBQyxHQUFHLEVBQUU7QUFDcEIsTUFBTTtBQUNOO0FBQ0E7O0FDUk8sTUFBTSxHQUFHO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFX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

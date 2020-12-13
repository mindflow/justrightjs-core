'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopNamespace(e) {
    if (e && e.__esModule) { return e; } else {
        var n = {};
        if (e) {
            Object.keys(e).forEach(function (k) {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            });
        }
        n['default'] = e;
        return n;
    }
}

var coreutil_v1 = require('coreutil_v1');
var mindi_v1 = require('mindi_v1');
var xmlparser_v1 = require('xmlparser_v1');

const LOG = new coreutil_v1.Logger("ContainerBridge");

class ContainerBridge {

    /**
     * 
     * @param {String} urlString 
     */
    static loadUrl(urlString) {
        window.location = urlString;
    }

     /**
     * 
     * @param {Object} stateObject 
     * @param {String} title 
     * @param {String} urlString 
     */
    static replaceUrl(urlString, title, stateObject) {
        window.history.replaceState(stateObject, title, urlString);
    }

    /**
     * 
     * @param {Object} stateObject 
     * @param {String} title 
     * @param {String} urlString 
     */
    static pushUrl(urlString, title, stateObject) {
        window.history.pushState(stateObject, title, urlString);
    }

    /**
     * @returns {String}
     */
    static currentUrl() {
        return window.location.href;
    }

    /**
     * 
     * @param {string} id 
     */
    static getElementById(id) {
        return document.getElementById(id);
    }

    /**
     * 
     * @param {string} valeu 
     */
    static createTextNode(value) {
        return document.createTextNode(value)
    }

    /**
     * 
     * @param {string} name 
     */
    static createElement(name) {
        return document.createElement(name)
    }

    /**
     * 
     * @param {string} nameSpace 
     * @param {string} name 
     */
    static createElementNS(nameSpace, name) {
        return document.createElementNS(nameSpace, name);
    }

    /**
     * 
     * @param {string} url 
     * @param {object} params 
     */
    static fetch(url, params, connectionTimeout = 1000, responseTimeout = 4000) {
        return ContainerBridge.timeout(connectionTimeout, window.fetch(url, params));
    }

    // Storage bridge

    static setSessionAttribute(key, value) {
        window.sessionStorage.setItem(key,value);
    }

    static removeSessionAttribute(key) {
        window.sessionStorage.removeItem(key);
    }

    static getSessionAttribute(key) {
        return window.sessionStorage.getItem(key);
    }

    static hasSessionAttribute(key) {
        return window.sessionStorage.getItem(key) !== null;
    }

    static setLocalAttribute(key, value) {
        window.localStorage.setItem(key,value);
    }

    static removeLocalAttribute(key) {
        window.localStorage.removeItem(key);
    }

    static hasLocalAttribute(key) {
        return window.localStorage.getItem(key) !== null;
    }

    static getLocalAttribute(key) {
        return window.localStorage.getItem(key);
    }

    static removeElement(id) {
        const element = document.getElementById(id);
        element.parentNode.removeChild(element);
    }

    static addHeaderElement(element) {
        const header = document.getElementsByTagName("head")[0];
        header.append(element);
    }

    static addBodyElement(element) {
        const body = document.getElementsByTagName("body")[0];
        body.append(element);
    }

    static prependHeaderElement(element) {
        const header = document.getElementsByTagName("head")[0];
        header.prepend(element);
    }

    static prependBodyElement(element) {
        const body = document.getElementsByTagName("body")[0];
        body.prepend(element);
    }

    static timeout(milliseconds, promise) {
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            reject(new Error("timeout"));
          }, milliseconds);
          promise.then(resolve, reject);
        });
      }

}

class Client {

    /**
     * 
     * @param {string} url 
     * @returns {Promise<Response>}
     */
    static get(url, connectionTimeout = 4000, responseTimeout = 4000){
        var params =  {
            method: 'GET',
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow' // manual, *follow, error
        };
        return ContainerBridge.fetch(url.toString(),params, connectionTimeout, responseTimeout);
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
        return ContainerBridge.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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
        return ContainerBridge.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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
        return ContainerBridge.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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
        return ContainerBridge.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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

class Url{

    constructor(value){
        this.protocol = null;
        this.host = null;
        this.port = null;
        this.pathList = new coreutil_v1.List();
        this.parameterMap = new coreutil_v1.Map();
        this.bookmark = null;
        if(value === null){
            return;
        }
        var remaining = this.determineProtocol(value);
        if(remaining === null){
            return;
        }
        if(this.protocol !== null){
            remaining = this.determineHost(remaining);
        }
        if(remaining === null){
            return;
        }
        if(this.host !== null){
            remaining = this.determinePort(remaining);
        }
        if(remaining === null){
            return;
        }
        remaining = this.determinePath(remaining);
        if(remaining === null){
            return;
        }
        remaining = this.determineParameters(remaining);
        if(remaining === null) {
            return
        }
        this.determineBookmark(remaining);
    }

    getProtocol(){
        return this.protocol;
    }

    getHost(){
        return this.host;
    }

    getPort(){
        return this.port;
    }

    getPathList(){
        return this.pathList;
    }

    getPathPart(index){
        return this.pathList.get(index);
    }

    getPath(){
        let path = "/";
        let first = true;
        this.pathList.forEach((value => {
            if (!first) {
                path = path + "/";
            }
            path = path + value;
            first = false;
        }),this);
        return path;
    }

    clearPathList(){
        this.pathList = new coreutil_v1.List();
    }

    getParameterMap(){
        return this.parameterMap;
    }

    clearParameterMAp(){
        this.parameterMap = new coreutil_v1.Map();
    }

    getParameter(key){
        return this.parameterMap.get(key);
    }

    setParameter(key,value){
        this.parameterMap.set(key,value);
    }

    setBookmark(bookmark){
        this.bookmark = bookmark;
    }

    setPath(value) {
        this.determinePath(value);
    }

    setQueryString(value) {
        this.parameterMap = this.determineParameters(value);
    }

    getBookmark(){
        return this.bookmark;
    }

    determineProtocol(value){
        if(value.indexOf("//") === -1){
            return value;
        }
        var parts = value.split("//");
        if(parts[0].indexOf("/") !== -1){
            return value;
        }
        this.protocol = parts[0];
        if(parts.length==1){
            return null;
        }
        return value.replace(parts[0] + "//","");
    }

    determineHost(value){
        var parts = value.split("/");
        var hostPart = parts[0];
        if(hostPart.indexOf(":") !== -1){
            hostPart = hostPart.split(":")[0];
        }
        this.host = hostPart;
        if(parts.length > 1){
            return value.replace(hostPart,"");
        }
        return null;
    }

    determinePort(value){
        if(!value.startsWith(":")){
            return value;
        }
        var portPart = value.split("/")[0].substring(1);
        this.port = portPart;
        return value.replace(":" + portPart,"");
    }

    determinePath(value){
        var remaining = value;
        if(value.indexOf("?") !== -1){
            var parts = value.split("?");
            if(parts.length > 1){
                remaining = value.substring(value.indexOf("?"));
            }
            value = parts[0];
        } else if(value.indexOf("#") !== -1){
            var parts = value.split("#");
            if(parts.length > 1){
                remaining = value.substring(value.indexOf("#"));
            }
            value = parts[0];
        }
        if(value.startsWith("/")){
            value = value.substring(1);
        }
        var pathParts = new coreutil_v1.List(value.split("/"));
        this.pathList = new coreutil_v1.List();
        pathParts.forEach(function(value,parent){
            parent.pathList.add(decodeURI(value));
            return true;
        },this);
        return remaining;
    }

    determineParameters(value){
        var remaining = value;
        if(value.indexOf("?") === -1) {
            return value;
        }
        value = value.substring(value.indexOf("?")+1);
        if(value.indexOf("#") !== -1) {
            remaining = value.substring(value.indexOf("#"));
            value = value.substring(0,value.indexOf("#"));
        }
        var partList = new coreutil_v1.List(value.split("&"));
        var parameterMap = new coreutil_v1.Map();
        partList.forEach(function(value,parent){
            var keyValue = value.split("=");
            if(keyValue.length >= 2){
                parameterMap.set(decodeURI(keyValue[0]),decodeURI(keyValue[1]));
            }
            return true;
        },this);
        this.parameterMap = parameterMap;
        return remaining;
    }

    determineBookmark(value){
        if(value.indexOf("#") !== -1) {
            this.bookmark = value.substring(value.indexOf("#")+1);
        }
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

        this.pathList.forEach(function(pathPart,parent){
            value = value + "/" + pathPart;
            return true;
        },this);

        var firstParameter = true;
        this.parameterMap.forEach(function(parameterKey,parameterValue,parent){
            if(firstParameter){
                firstParameter=false;
                value = value + "?";
            }else{
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

const LOG$1 = new coreutil_v1.Logger("StylesRegistry");

class StylesRegistry {

    constructor(){
        /** @type {Map} */
        this.stylesMap = new coreutil_v1.Map();

        /** @type {Map} */
        this.stylesUrlMap = new coreutil_v1.Map();

        /** @type {integer} */
        this.stylesQueueSize = 0;

        /** @type {ObjectFunction} */
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
     * @param {ObjectFunction} callback 
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
     load(name, url) {
        this.stylesQueueSize ++;
        return new Promise((resolve) => {
            Client.get(url).then((response) => {
                if(!response.ok){
                    throw "Unable to load styles for " + name + " at " + url;
                }
                response.text().then((text) => {
                    this.set(name,new Styles(text),url);
                    this.doCallback(this);
                    resolve();
                });
            });
        });

    }

    /**
     * 
     * @param {Map} nameUrlMap 
     */
    getStylesLoadedPromise(nameUrlMap) {
        
        return new Promise((resolve,reject) => {
            var loaded = 0;
            if(!nameUrlMap || nameUrlMap.size() == 0) {
                resolve();
                return;
            }
            nameUrlMap.forEach((key, value, parent) => {
                if(this.contains(key)){
                    loaded ++;
                    if(loaded == nameUrlMap.size()){
                        resolve();
                        // Break loop
                        return false;
                    }
                    return true;
                }
                this.privateLoad(key, new Url(value))

                    .then(() => {
                        loaded ++;
                        if(loaded == nameUrlMap.size()){
                            resolve();
                            // Break loop
                            return false;
                        }
                    })

                    .catch((reason) => {
                        reject(reason);
                        // Break loop
                        return false;
                    });
                return true;
            },this);
        });
    }

    /**
     * 
     * @param {string} name 
     * @param {Url} url 
     */
    privateLoad(name, url) {
        LOG$1.info("Loading styles " + name + " at " + url.toString());

        return new Promise((resolve) => {
            Client.get(url).then((response) => {
                if(!response.ok){
                    throw "Unable to load styles for " + name + " at " + url;
                }
                response.text().then((text) => {
                    this.set(name,new Styles(text),url);
                    resolve();
                });
            });
        });
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

const LOG$2 = new coreutil_v1.Logger("TemplateRegistry");

class TemplateRegistry {

    constructor(){
        /** @type {Map} */
        this.templateMap = new coreutil_v1.Map();

        /** @type {Map} */
        this.templateUrlMap = new coreutil_v1.Map();

        /** @type {integer} */
        this.templateQueueSize = 0;

        /** @type {ObjectFunction} */
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
     * @param {ObjectFunction} callback 
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
    load(name, url) {
        if(this.languagePrefix !== null) {
            url.getPathList().setLast(
                this.languagePrefix + "." +
                url.getPathList().getLast()
            );
        }
        this.templateQueueSize ++;
        return new Promise((resolve) => {
            Client.get(url).then((response) => {
                if(!response.ok){
                    throw "Unable to load template for " + name + " at " + url;
                }
                response.text().then((text) => {
                    this.set(name,new Template(text),url);
                    this.doCallback(this);
                    resolve();
                });
            });
        });
    }

    /**
     * 
     * @param {Map} nameUrlMap 
     */
    getTemplatesLoadedPromise(nameUrlMap) {

        return new Promise((resolve,reject) => {
            var loaded = 0;
            if(!nameUrlMap || nameUrlMap.size() == 0) {
                resolve();
                return;
            }
            nameUrlMap.forEach((key, value, parent) => {
                if(this.contains(key)){
                    loaded ++;
                    if(loaded == nameUrlMap.size()){
                        resolve();
                        // Break loop
                        return false;
                    }
                    return true;
                }
                this.privateLoad(key, new Url(value))

                    .then(() => {
                        loaded ++;
                        if(loaded == nameUrlMap.size()){
                            resolve();
                            // Break loop
                            return false;
                        }
                    })

                    .catch((reason) => {
                        reject(reason);
                        // Break loop
                        return false;
                    });
                return true;
            },this);
        });
    }

    /**
     * 
     * @param {string} name 
     * @param {Url} url 
     */
    privateLoad(name, url) {
        if(this.languagePrefix !== null) {
            url.getPathList().setLast(
                this.languagePrefix + "." +
                url.getPathList().getLast()
            );
        }
        LOG$2.info("Loading template " + name + " at " + url.toString());
        return new Promise((resolse) => {
            Client.get(url).then((response) => {
                if(!response.ok){
                    throw "Unable to load template for " + name + " at " + url;
                }
                response.text().then((text) => {
                    this.set(name,new Template(text),url);
                    resolse();
                });
            });
        });
    }
}

const LOG$3 = new coreutil_v1.Logger("TemplatePostConfig");

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

const LOG$4 = new coreutil_v1.Logger("StylesLoader");

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

const LOG$5 = new coreutil_v1.Logger("ComponentConfigProcessor");

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

class History {

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

const LOG$6 = new coreutil_v1.Logger("LoaderFilter");

class LoaderFilter {

    /**
     * @returns {Boolean}
     */
    process() {
        LOG$6.info("Inumplemented Loader Filter breaks by default");
        return false;
    }

}

const LOG$7 = new coreutil_v1.Logger("ModuleLoader");

class ModuleLoader {

    /**
     * 
     * @param {RegExp} matchPath 
     * @param {String} rootPath 
     * @param {String} modulePath 
     * @param {Array<LoaderFilter>} loaderFilters 
     */
    constructor(matchPath, rootPath, modulePath, loaderFilters = []) {
        
        /**
         * @type {RegExp}
         */
        this.matchPath = matchPath;

        /**
         * @type {String}
         */
        this.rootPath = rootPath;

        /**
         * @type {String}
         */
        this.modulePath = modulePath;

        /**
         * @type {Array<LoaderFilter>}
         */
        this.loaderFilters = loaderFilters;

        /**
         * @type {Object}
         */
        this.defaultInstance = null;

        /**
         * @type {String}
         */
        this.requestedPath = null;
    }

    authorized(){ 
        if (this.requiredScopeArray.length == 0) {
            return true;
        }
        return false;
    }

    matches(){ 
        const url = History.getUrl();
        return this.matchPath.test(url.getPath());
    }

    load(rootPath) {
        if (!this.filtersPass()) {
            return;
        }
        const parent = this;
        if (!parent.defaultInstance) {
            parent.importModule().then(() => {
                parent.defaultInstance.load(rootPath);
            });
        } else {
            parent.defaultInstance.load(rootPath);
        }
    }

    filtersPass() {
        let pass = true;
        if (this.loaderFilters) {
            this.loaderFilters.forEach((element) => {
                if(!element.process()) {
                    pass = false;
                }
            });
        }
        return pass;
    }

    importModule() {
        return new Promise((resolve, reject) => {
            if (null != this.defaultInstance) {
                resolve();
                return;
            }
            new Promise(function (resolve) { resolve(_interopNamespace(require(this.modulePath))); }).then((module) => {
                this.defaultInstance = new module.default();
                resolve();
            }).catch((reason) => {
                reject(reason);
            });
        });
    }

    defaultInstance() {
        return this.defaultInstance;
    }

}

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

/* jshint esversion: 6 */

const LOG$8 = new coreutil_v1.Logger("BaseElement");

/**
 * A base class for enclosing an HTMLElement
 */
class BaseElement {

    /**
     * Constructor
     *
     * @param {XmlElement|string|HTMLElement} value
     * @param {BaseElement} parent
     */
    constructor(value, parent) {
        
        /** @type {HTMLElement} */
        this.element = null;
        this.attributeMap = null;
        this.eventsAttached = new coreutil_v1.List();
        
        if(value instanceof xmlparser_v1.XmlElement) {
            this.element = this.createFromXmlElement(value, parent);
            return;
        }
        if(typeof value === "string"){
            this.element = ContainerBridge.createElement(value);
            return;
        }
        if(value instanceof HTMLElement){
            this.element = value;
            return;
        }
        LOG$8.error("Unrecognized value for Element");
        LOG$8.error(value);
    }

    loadAttributes() {
        if(this.element.attributes === null || this.element.attributes === undefined) {
            this.attributeMap = new coreutil_v1.Map();
            return;
        }
        if(this.attributeMap === null || this.attributeMap === undefined) {
            this.attributeMap = new coreutil_v1.Map();
            for (var i = 0; i < this.element.attributes.length; i++) {
                this.attributeMap.set(this.element.attributes[i].name,new Attribute(this.element.attributes[i]));
            }
        }
    }

    /**
     * Creates a browser Element from the XmlElement
     *
     * @param {XmlElement} xmlElement
     * @param {BaseElement} parentElement
     * @return {HTMLElement}
     */
    createFromXmlElement(xmlElement, parentElement) {
        let element = null;
        if(xmlElement.namespace){
            element = ContainerBridge.createElementNS(xmlElement.namespaceUri,xmlElement.fullName);
        }else{
            element = ContainerBridge.createElement(xmlElement.name);
        }
        if(parentElement && parentElement.mappedElement !== null) {
            parentElement.mappedElement.appendChild(element);
        }
        xmlElement.attributes.forEach(function(attributeKey,attribute){
            element.setAttribute(attributeKey,attribute.value);
            return true;
        });
        return element;
    }

    /**
     * Attach a function to an event in the enclosed element if none allready exists
     *
     * @param {string} eventType
     * @param {function} functionParam
     */
    attachEvent(eventType, functionParam) {
        if(!this.eventsAttached.contains(eventType)) {
            if(eventType.startsWith("on")) {
                eventType = eventType.substr(2);
            }
            this.element.addEventListener(eventType, functionParam);
            this.eventsAttached.add(eventType);
        } else {
            LOG$8.warn("Event '" + eventType + "' allready attached for " + this.element.name);
        }
    }

    /**
     * Get the enclosed element
     *
     * @return {HTMLElement}
     */
    get mappedElement() {
        return this.element;
    }

    get fullName() {
        return this.element.tagName;
    }

    get top() {
        return this.element.getBoundingClientRect().top;
    }

    get bottom() {
        return this.element.getBoundingClientRect().bottom;
    }

    get left() {
        return this.element.getBoundingClientRect().left;
    }

    get right() {
        return this.element.getBoundingClientRect().right;
    }

    get width() {
        return this.element.offsetWidth;
    }

    get height() {
        return this.element.offsetHeight;
    }

    get attributes() {
        this.loadAttributes();
        return this.attributeMap;
    }

    setAttributeValue(key,value) {
        this.element.setAttribute(key,value);
    }

    getAttributeValue(key) {
        return this.element.getAttribute(key);
    }

    containsAttribute(key) {
        return this.element.hasAttribute(key);
    }

    removeAttribute(key) {
        this.element.removeAttribute(key);
    }

    setStyle(key,value) {
        this.element.style[key] = value;
    }

    getStyle(key) {
        return this.element.style[key];
    }

    removeStyle(key) {
        this.element.style[key] = null;
    }

    set(input) {
        if(this.element.parentNode === null){
            console.error("The element has no parent, can not swap it for value");
            return;
        }
        if(input.mappedElement) {
            this.element.parentNode.replaceChild(input.mappedElement, this.element);
            return;
        }
        if(input && input.rootElement !== null) {
            this.element.parentNode.replaceChild(input.rootElement.mappedElement, this.element);
            this.element = input.rootElement.mappedElement;
            return;
        }
        if(typeof input == "string") {
            this.element.parentNode.replaceChild(ContainerBridge.createTextNode(input), this.element);
            return;
        }
        if(input instanceof Text) {
            this.element.parentNode.replaceChild(input, this.element);
            return;
        }
        if(input instanceof Element) {
            this.element.parentNode.replaceChild(input, this.element);
            return;
        }
    }

    isMounted() {
        if(this.element.parentNode) {
            return true;
        }
        return false;
    }

    remove() {
        this.element.parentNode.removeChild(this.element);
    }

    clear() {
        while (this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }
    }

    setChild(input) {
        this.clear();
        this.addChild(input);
    }

    addChild(input) {
        if (input.mappedElement !== undefined && input.mappedElement !== null){
            this.element.appendChild(input.mappedElement);
            return;
        }
        if (input && input.rootElement) {
            this.element.appendChild(input.rootElement.mappedElement);
            return;
        }
        if (typeof input == "string") {
            this.element.appendChild(ContainerBridge.createTextNode(input));
            return;
        }
        if (input instanceof Text) {
            this.element.appendChild(input);
            return;
        }
        if (input instanceof Element) {
            this.element.appendChild(input);
            return;
        }
    }

    prependChild(input) {
        if(this.element.firstChild === null) {
            this.addChild(input);
        }
        if (input.mappedElement !== undefined && input.mappedElement !== null) {
            this.element.insertBefore(input.mappedElement,this.element.firstChild);
            return;
        }
        if (input && input.rootElement) {
            this.element.insertBefore(input.rootElement.mappedElement,this.element.firstChild);
            return;
        }
        if (typeof input == "string") {
            this.element.insertBefore(ContainerBridge.createTextNode(input),this.element.firstChild);
            return;
        }
        if (input instanceof Text) {
            this.element.insertBefore(input,this.element.firstChild);
            return;
        }
        if (input instanceof Element) {
            this.element.insertBefore(input,this.element.firstChild);
            return;
        }
    }
}

const LOG$9 = new coreutil_v1.Logger("AbstractInputElement");

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
            this.element = ContainerBridge.createTextNode(value);
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
            parentElement.mappedElement.appendChild(element);
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
        if (ElementMapper.mapsToRadio(input)){ return new RadioInputElement(input, parent); }
        if (ElementMapper.mapsToCheckbox(input)){ return new CheckboxInputElement(input, parent); }
        if (ElementMapper.mapsToSubmit(input)){ return new TextInputElement(input, parent); }
        if (ElementMapper.mapsToForm(input)){ return new FormElement(input, parent); }
        if (ElementMapper.mapsToTextarea(input)){ return new TextareaInputElement(input, parent); }
        if (ElementMapper.mapsToText(input)){ return new TextInputElement(input, parent); }
        if (ElementMapper.mapsToVideo(input)){ return new VideoElement(input, parent); }
        if (ElementMapper.mapsToTextnode(input)){ return new TextnodeElement(input, parent); }
        if (ElementMapper.mapsToSimple(input)){ return new SimpleElement(input, parent); }
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
            if (input.type === "password") { return true; }
            if (input.type === "email") { return true; }
            if (input.type === "date") { return true; }
            if (input.type === "time") { return true; }
        }
        if(input instanceof xmlparser_v1.XmlElement && input.name === "input") {
            if(!input.getAttribute("type")) { return true; }
            if(input.getAttribute("type").value === "text") { return true; }
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

/* jshint esversion: 6 */

class Event{

    constructor(event){
        this.event = event;
        if(this.event.type.toLowerCase() == "dragstart"){
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
    getOffsetX(){
        return this.event.offsetX;
    }

    /**
     * The distance between the event and the edge y coordinate of the containing object
     */
    getOffsetY(){
        return this.event.offsetY;
    }

    /**
     * The mouse x coordinate of the event relative to the client window view
     */
    getClientX(){
        return this.event.clientX;
    }

    /**
     * The mouse y coordinate of the event relative to the client window view
     */
    getClientY(){
        return this.event.clientY;
    }

    getTarget(){
        return ElementMapper.map(this.event.target);
    }

    getKeyCode() {
        return this.event.keyCode;
    }

    isKeyCode(code) {
        return this.event.keyCode === code;
    }

}

/* jshint esversion: 6 */

const LOG$a = new coreutil_v1.Logger("EventRegistry");

class EventRegistry {

    constructor() {
        this.listeners = new coreutil_v1.Map();
        this.beforeListeners = new coreutil_v1.Map();
        this.afterListeners = new coreutil_v1.Map();
    }

    /**
     * Connects elements with the event registry so that events triggered on the element gets distributed to all listeners
     * 
     * @param {BaseElement} element the element which is the source of the event and which can be attached to
     * @param {string} eventType the event type as it is defined by the containing trigger (example "onclick")
     * @param {string} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {string} componentIndex unique id of the component which owns the element
     */
    attach(element, eventType, eventName, componentIndex) {
        const uniqueEventName = eventName + "_" + componentIndex;
        const theEventRegistry = this;
        element.attachEvent(eventType, function(event) { theEventRegistry.trigger(uniqueEventName, eventName, event); });
    }

    /**
     * 
     * @param {string} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {ObjectFunction} listener the object which owns the handler function
     * @param {string} uniqueIndex a unique index for the event
     */
    listen(eventName, listener, uniqueIndex) {
        const uniqueEventName = eventName + "_" + uniqueIndex;
        this.initMap(this.listeners, uniqueEventName);
        /** @type {Map} */
        const listenerMap = this.listeners.get(uniqueEventName);
        listenerMap.set(listener.getObject().constructor.name, listener);
    }

    /**
     * 
     * @param {string} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {ObjectFunction} listener the object which owns the handler function
     */
    listenBefore(eventName, listener) {
        this.initMap(this.beforeListeners, eventName);
        /** @type {Map} */
        const listenerMap = this.beforeListeners.get(eventName);
        listenerMap.set(listener.getObject().constructor.name, listener);
    }

    /**
     * 
     * @param {string} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {ObjectFunction} listener the object which owns the handler function
     */
    listenAfter(eventName, listener) {
        this.initMap(this.afterListeners, eventName);
        /** @type {Map} */
        const listenerMap = this.afterListeners.get(eventName);
        listenerMap.set(listener.getObject().constructor.name, listener);
    }

    /**
     * 
     * @param {Map} map 
     * @param {string} key 
     */
    initMap(map, key) {
        if (!map.exists(key)) {
            map.set(key,new coreutil_v1.Map());
        }
    }

    trigger(suffixedEventName, eventName, event) {
        this.handleBefore(eventName, event);
        if (this.listeners.exists(suffixedEventName)) {
            this.listeners.get(suffixedEventName).forEach((key, value, parent) => {
                value.call(new Event(event));
                return true;
            }, this);
        }
        this.handleAfter(eventName, event);
    }

    handleBefore(eventName, event) {
        this.handleGlobal(this.beforeListeners, eventName, event);
    }

    handleAfter(eventName, event) {
        this.handleGlobal(this.afterListeners, eventName, event);
    }

    handleGlobal(listeners, eventName, event) {
        if(listeners.exists(eventName)) {
            listeners.get(eventName).forEach((key, value, parent) => {
                value.call(new Event(event));
                return true;
            }, this);
        }
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
     * @returns {BaseElement}
     */
    get(id) {
        return this.elementMap.get(id);
    }

    set (id, value) {
        this.elementMap.get(id).set(value);
    }

    clearChildren(id){
        this.elementMap.get(id).clear();
    }

    setChild (id, value) {
        this.elementMap.get(id).setChild(value);
    }

    addChild (id, value) {
        this.elementMap.get(id).addChild(value);
    }

    prependChild (id, value) {
        this.elementMap.get(id).prependChild(value);
    }

}

/**
 * Collects information when elements are created and finds the root element, creates map of elements 
 * and registers events in the eventRegistry
 */
class ElementRegistrator {

    constructor(eventRegistry, uniqueIdRegistry, componentIndex) {
        this.componentIndex = componentIndex;

        /** @type {Map} */
        this.uniqueIdRegistry = uniqueIdRegistry;

        /** @type {EventRegistry} */
        this.eventRegistry = eventRegistry;

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
        var element = ElementMapper.map(xmlElement, parentWrapper);

        this.addToElementIdMap(element);
        this.registerElementEvents(element);

        if(this.rootElement === null && element !== null) {
            this.rootElement = element;
        }

        return element;
    }

    registerElementEvents(element){
        if(element === null || element === undefined || !(element instanceof BaseElement)) {
            return;
        }
        var eventRegistry = this.eventRegistry;
        var componentIndex = this.componentIndex;
        element.attributes.forEach(function (attributeKey,attribute,parent){
            if(attribute !== null && attribute !== undefined && attribute.value.startsWith("//event:")) {
                var eventName = attribute.value;
                var eventType = attribute.name;
                eventRegistry.attach(element,eventType,eventName,componentIndex);
            }
            return true;         
        },this);
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

class CanvasRoot {

    static replaceComponent(id, component) {
        var bodyElement = ContainerBridge.getElementById(id);
        bodyElement.parentNode.replaceChild(component.rootElement.mappedElement, bodyElement);
    }

    static setComponent(id, component) {
        var bodyElement = ContainerBridge.getElementById(id);
        bodyElement.innerHTML = '';
        bodyElement.appendChild(component.rootElement.mappedElement, bodyElement);
    }

    static addChildComponent(id, component) {
        var bodyElement = ContainerBridge.getElementById(id);
        bodyElement.appendChild(component.rootElement.mappedElement);
    }

    static addChildElement(id, element) {
        var bodyElement = ContainerBridge.getElementById(id);
        bodyElement.appendChild(element.mappedElement);
    }

    static removeElement(id) {
        ContainerBridge.removeElement(id);
    }

    /** 
     * @param {BaseElement} element
     */
    static addHeaderElement(element) {
        ContainerBridge.addHeaderElement(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static addBodyElement(element) {
        ContainerBridge.addBodyElement(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependHeaderElement(element) {
        ContainerBridge.prependHeaderElement(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependBodyElement(element) {
        ContainerBridge.prependBodyElement(element.mappedElement);
    }
}

/* jshint esversion: 6 */

class HTML{

    static custom(elementName){
        var xmlElement = new xmlparser_v1.XmlElement(elementName);
        return ElementMapper.map(xmlElement);
    }

    static applyStyles(element,classValue,styleValue){
        if(classValue !== null){
            element.setAttributeValue("class",classValue);
        }
        if(styleValue !== null){
            element.setAttributeValue("style",styleValue);
        }
    }

    static a(name,href,classValue,styleValue){
        var element = HTML.custom("a");
        element.addChild(name);
        element.setAttributeValue("href",href);
        HTML.applyStyles(element,classValue,styleValue);
        return element;
    }
}

const LOG$b = new coreutil_v1.Logger("CanvasStyles");

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
            LOG$b.error("Style does not exist: " + name);
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
            LOG$b.error("Style does not exist: " + name);
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

const LOG$c = new coreutil_v1.Logger("ComponentFactory");

class ComponentFactory {

    constructor() {

        /** @type {EventRegistry} */
        this.eventRegistry = mindi_v1.InjectionPoint.instance(EventRegistry);

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
            LOG$c.error(this.templateRegistry);
            throw "No template was found with name " + name;

        }
        var elementRegistrator = new ElementRegistrator(this.eventRegistry, this.uniqueIdRegistry, componentCounter++);
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

const LOG$d = new coreutil_v1.Logger("Config");

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
            mindi_v1.PrototypeConfig.unnamed(EventRegistry)]);
        }

    getTypeConfigList() {
        return this.typeConfigList;
    }

}

const justrightConfig = new Config();

const LOG$e = new coreutil_v1.Logger("Application");

class Application {

    constructor() {

        /** @type {List} */
        this.workerList = new coreutil_v1.List();

        /** @type {List} */
        this.moduleLoaderList = new coreutil_v1.List();

        /** @type {MindiConfig} */
        this.config = new mindi_v1.MindiConfig();

        /** @type {List} */
        this.runningWorkers = new coreutil_v1.List();

        this.config
            .addAllTypeConfig(Config.getInstance().getTypeConfigList())
            .addAllConfigProcessor(new coreutil_v1.List([ ComponentConfigProcessor ]))
            .addAllInstanceProcessor(new coreutil_v1.List([ mindi_v1.InstancePostConfigTrigger ]));
    }

    addAllTypeConfig(typeConfigList) {
        this.config.addAllTypeConfig(typeConfigList);
    }

    run() {
        this.getMatchingModuleLoader().load();
        this.startWorkers();
    }

    executeMatchingModule() {
        this.getMatchingModuleLoader().defaultInstance.load();
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
     * @returns {ModuleLoader}
     */
    getMatchingModuleLoader() {
        let foundModuleLoader = null;
        this.moduleLoaderList.forEach((value,parent) => {
            if (value.matches()) {
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
            LOG$e.info(this.config.configEntries);
        };
    }

    /**
     * Enable global access to template registry
     */
    windowTemplateRegistry() {
        window.templateRegistry = () => {
            LOG$e.info(mindi_v1.ConfigAccessor.instanceHolder(TemplateRegistry.name, this.config).instance);
        };
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            LOG$e.info(mindi_v1.ConfigAccessor.instanceHolder(StylesRegistry.name, this.config).instance);
        };
    }

}

const LOG$f = new coreutil_v1.Logger("InputElementDataBinding");

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
        field.attachEvent("onchange", puller);
        field.attachEvent("onkeyup", puller);
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
     * @param {Object} object 
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

class EventFilteredObjectFunction extends coreutil_v1.ObjectFunction {

    /**
     * Contructor
     * @param {ObjectFunction} objectFunction 
     * @param {function} theFilter 
     */
    constructor(objectFunction, filter){
        this.objectFunction = objectFunction;
        this.filter = filter;
    }

    call(params){
        if(this.filter && this.filter.call(this,params)) {
            this.objectFunction.call(params);
        }
    }

}

const LOG$g = new coreutil_v1.Logger("DiModuleLoader");

class DiModuleLoader extends ModuleLoader {

    /**
     * 
     * @param {MindiConfig} config
     * @param {RegExp} matchPath 
     * @param {String} rootPath 
     * @param {String} modulePath 
     * @param {Array<LoaderFilter>} loaderFilters 
     */
    constructor(config, matchPath, rootPath, modulePath, loaderFilters = []) {
        super(matchPath, rootPath, modulePath, loaderFilters);

        /** @type {MindiConfig} */
        this.config = config;
    }

    load(rootPath) {
        const parent = this;
        if (!parent.filtersPass()) {
            return;
        }
        if (!parent.defaultInstance) {
            parent.importModule().then(() => {
                parent.defaultInstance.load(rootPath);
            });
        } else {
            parent.defaultInstance.load(rootPath);
        }
    }

    /**
     * 
     * @param {ModuleLoader} moduleLoader
     * @returns {Promise}
     */
    importModule() {
        const parent = this;
        return new Promise((resolve, reject) => {
            return super.importModule().then(() => {
                this.config.addAllTypeConfig(parent.defaultInstance.typeConfigList);
                this.config.finalize().then(() => {
                    mindi_v1.MindiInjector.inject(parent.defaultInstance, this.config);
                    resolve();
                });
            });
        });
    }
}

class ApplicationStorage {
    
    static setLocalAttribute(key, value) {
        ContainerBridge.setLocalAttribute(key,value);
    }

    static getLocalAttribute(key) {
        return ContainerBridge.getLocalAttribute(key);
    }

    static hasLocalAttribute(key) {
        return ContainerBridge.hasLocalAttribute(key);
    }

    static removeLocalAttribute(key) {
        return ContainerBridge.removeLocalAttribute(key);
    }
}

class SessionStorage {

    static setSessionAttribute(key, value) {
        ContainerBridge.setSessionAttribute(key,value);
    }

    static hasSessionAttribute(key) {
        return ContainerBridge.hasSessionAttribute(key);
    }

    static getSessionAttribute(key) {
        return ContainerBridge.getSessionAttribute(key);
    }

    static removeSessionAttribute(key) {
        return ContainerBridge.removeSessionAttribute(key);
    }

}

class HttpResponseHandler {

    /**
     * 
     * @param {number} code 
     * @param {ObjectFunction} objectFunction 
     * @param {function} mapperFunction 
     */
    constructor(code, objectFunction, mapperFunction) {
        this.code = code;
        this.objectFunction = objectFunction;
        this.mapperFunction = mapperFunction;
    }

}

const LOG$h = new coreutil_v1.Logger("HttpCallBuilder");

class HttpCallBuilder {

    /**
     * 
     * @param {string} url 
     * @param {object} parameter 
     */
    constructor(url, paramter) {

        /** @type {String} */
        this.url = url;

        /** @type {Object} */
        this.paramter = paramter;

        /** @type {Map} */
        this.httpCallbackMap = new coreutil_v1.Map();

        /** @type {ObjectFunction} */
        this.errorCallback = null;

        /** @type {number} */
        this.connectionTimeoutValue = 4000;

        /** @type {number} */
        this.responseTimeoutValue = 4000;

        /** @type {function} */
        this.errorMapperFunction = null;

        /** @type {String} */
        this.authorization = null;
    }

    /**
     * 
     * @param {Client} client 
     * @param {string} url 
     * @param {object} parameter 
     * @returns {HttpCallBuilder}
     */
    static newInstance(client, url, parameter) {
        return new HttpCallBuilder(client, url, parameter);
    }

    /**
     * 
     * @param {Number} code 
     * @param {object} object 
     * @param {function} callback 
     * @param {function} mapperFunction mapper function to pass the result object to
     */
    responseMapping(code, object, callback, mapperFunction) {
        this.httpCallbackMap.set(code, new HttpResponseHandler(code, new coreutil_v1.ObjectFunction(object, callback), mapperFunction));
        return this;
    }

    /**
     * 
     * @param {object} object 
     * @param {function} callback 
     * @param {function} errorMapperFunction mapper function to pass the result object to
     */
    errorMapping(object, callback, errorMapperFunction = null) {
        if(object && callback) {
            if (errorMapperFunction) {
                this.errorMapperFunction = errorMapperFunction;
            }
            this.errorCallback = new coreutil_v1.ObjectFunction(object, callback);
        }
        return this;
    }

    /**
     * 
     * @param {string} authorization 
     */
    authorizationHeader(authorization) {
        this.authorization = "Bearer " + authorization;
        return this;
    }

    connectionTimeout(connectionTimeoutValue) {
        this.connectionTimeoutValue = connectionTimeoutValue;
    }

    responseTimeout(responseTimeoutValue) {
        this.responseTimeoutValue = responseTimeoutValue;
    }

    get() {
        Client.get(this.url, this.connectionTimeoutValue, this.responseTimeoutValue).then((response) => {
            this.processResponse(response);
        }, (error) => {
            this.processError(error);
        });
    }

    post() {
        Client.post(this.url, this.paramter, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization).then((response) => {
            this.processResponse(response);
        }, (error) => {
            this.processError(error);
        });
    }

    put() {
        Client.put(this.url, this.paramter, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization).then((response) => {
            this.processResponse(response);
        }, (error) => {
            this.processError(error);
        });
    }

    patch() {
        Client.patch(this.url, this.paramter, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization).then((response) => {
            this.processResponse(response);
        }, (error) => {
            this.processError(error);
        });
    }

    delete() {
        Client.delete(this.url, this.connectionTimeoutValue, this.responseTimeoutValue).then((response) => {
            this.processResponse(response);
        }, (error) => {
            this.processError(error);
        });
    }

    processError(error) {
        LOG$h.error(error);
        if(this.errorCallback) {
            if(this.errorMapperFunction) {
                error = this.errorMapperFunction.call(this, error);
            }
            this.errorCallback.call(error);
        }
    }

    /**
     * 
     * @param {Response} response 
     */
    processResponse(response) {
        /** @type {HttpResponseHandler} */
        var responseHandler = this.httpCallbackMap.get(response.status);
        if(responseHandler) {
            if(responseHandler.mapperFunction) {
                response.json().then(
                    (object) => {
                        var mapperFunction = responseHandler.mapperFunction;
                        if(mapperFunction) {
                            responseHandler.objectFunction.call(mapperFunction(object));
                        } else {
                            responseHandler.objectFunction.call(object);
                        }
                    },
                    (failReason) => {

                    }
                );
            } else {
                responseHandler.objectFunction.call();
            }
        }
    }
}

const LOG$i = new coreutil_v1.Logger("AbstractValidator");

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
            LOG$i.warn("No validation listeners");
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
            LOG$i.warn("No invalidation listeners");
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
	 * @param {ObjectFunction} validListener 
	 */
	withValidListener(validListener) {
		this.validListenerList.add(validListener);
		return this;
	}

	/**
	 * 
	 * @param {ObjectFunction} invalidListener 
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
        validator.withValidListener(new coreutil_v1.ObjectFunction(this, this.oneValid));
        validator.withInvalidListener(new coreutil_v1.ObjectFunction(this, this.oneInvalid));
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

const EMAIL_FORMAT = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

class EmailValidator extends RegexValidator {

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, EMAIL_FORMAT);
    }

}

class EqualsFunctionResultValidator extends AbstractValidator {

	/**
	 * 
	 * @param {boolean} mandatory 
	 * @param {boolean} iscurrentlyValid 
	 * @param {ObjectFunction} comparedValueFunction 
	 */
    constructor(mandatory = false, iscurrentlyValid = false, comparedValueFunction = null) {
		super(iscurrentlyValid);

		/** @type {boolean} */
		this.mandatory = mandatory;

		/** @type {ObjectFunction} */
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
	 * @param {ObjectFunction} comparedValueFunction 
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
	 * @param {ObjectFunction} comparedValueFunction 
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

class OrValidatorSet extends AbstractValidator {
    
    constructor(isValidFromStart = false) {
        super(isValidFromStart);
        this.validatorList = new coreutil_v1.List();
    }

    /**
     * @param {AbstractValidator} validator
     */
    withValidator(validator) {
        validator.withValidListener(new coreutil_v1.ObjectFunction(this, this.oneValid));
        validator.withInvalidListener(new coreutil_v1.ObjectFunction(this, this.oneInvalid));
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

const PHONE_FORMAT = /^\+[0-9]{2}\s?([0-9]\s?)*$/;

class PhoneValidator extends RegexValidator {

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, PHONE_FORMAT);
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
exports.AndValidatorSet = AndValidatorSet;
exports.Application = Application;
exports.ApplicationStorage = ApplicationStorage;
exports.Attribute = Attribute;
exports.BaseElement = BaseElement;
exports.CanvasRoot = CanvasRoot;
exports.CanvasStyles = CanvasStyles;
exports.CheckboxInputElement = CheckboxInputElement;
exports.Client = Client;
exports.Component = Component;
exports.ComponentConfigProcessor = ComponentConfigProcessor;
exports.ComponentFactory = ComponentFactory;
exports.Config = Config;
exports.ContainerBridge = ContainerBridge;
exports.DiModuleLoader = DiModuleLoader;
exports.ElementMapper = ElementMapper;
exports.ElementRegistrator = ElementRegistrator;
exports.EmailValidator = EmailValidator;
exports.EqualsFunctionResultValidator = EqualsFunctionResultValidator;
exports.EqualsPropertyValidator = EqualsPropertyValidator;
exports.EqualsStringValidator = EqualsStringValidator;
exports.Event = Event;
exports.EventFilteredObjectFunction = EventFilteredObjectFunction;
exports.EventRegistry = EventRegistry;
exports.FormElement = FormElement;
exports.HTML = HTML;
exports.History = History;
exports.HttpCallBuilder = HttpCallBuilder;
exports.HttpResponseHandler = HttpResponseHandler;
exports.InputElementDataBinding = InputElementDataBinding;
exports.LoaderFilter = LoaderFilter;
exports.ModuleLoader = ModuleLoader;
exports.OrValidatorSet = OrValidatorSet;
exports.PasswordValidator = PasswordValidator;
exports.PhoneValidator = PhoneValidator;
exports.ProxyObjectFactory = ProxyObjectFactory;
exports.RadioInputElement = RadioInputElement;
exports.RegexValidator = RegexValidator;
exports.RequiredValidator = RequiredValidator;
exports.SessionStorage = SessionStorage;
exports.SimpleElement = SimpleElement;
exports.Styles = Styles;
exports.StylesLoader = StylesLoader;
exports.StylesRegistry = StylesRegistry;
exports.Template = Template;
exports.TemplateRegistry = TemplateRegistry;
exports.TemplatesLoader = TemplatesLoader;
exports.TextInputElement = TextInputElement;
exports.TextareaInputElement = TextareaInputElement;
exports.TextnodeElement = TextnodeElement;
exports.UniqueIdRegistry = UniqueIdRegistry;
exports.Url = Url;
exports.VideoElement = VideoElement;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvYnJpZGdlL2NvbnRhaW5lckJyaWRnZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2xpZW50L2NsaWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC91cmwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdGVtcGxhdGUvdGVtcGxhdGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3R5bGVzL3N0eWxlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudENvbmZpZ1Byb2Nlc3Nvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi9oaXN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbG9hZGVyRmlsdGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbW9kdWxlTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2F0dHJpYnV0ZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9iYXNlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9yYWRpb0lucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9jaGVja2JveElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRhcmVhSW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRub2RlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9zaW1wbGVFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2Zvcm1FbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3ZpZGVvRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZXZlbnQvZXZlbnRSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L3VuaXF1ZUlkUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9lbGVtZW50UmVnaXN0cmF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNSb290LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9odG1sL2h0bWwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNTdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb25maWcuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2FwcGxpY2F0aW9uLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9kYXRhQmluZC9pbnB1dEVsZW1lbnREYXRhQmluZGluZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZGF0YUJpbmQvcHJveHlPYmplY3RGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudEZpbHRlcmVkT2JqZWN0RnVuY3Rpb24uanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2xvYWRlci9kaU1vZHVsZUxvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3RvcmFnZS9hcHBsaWNhdGlvblN0b3JhZ2UuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0b3JhZ2Uvc2Vzc2lvblN0b3JhZ2UuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3V0aWwvaHR0cFJlc3BvbnNlSGFuZGxlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9odHRwQ2FsbEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9hYnN0cmFjdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2FuZFZhbGlkYXRvclNldC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlZ2V4VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZW1haWxWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNGdW5jdGlvblJlc3VsdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VxdWFsc1Byb3BlcnR5VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzU3RyaW5nVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3Ivb3JWYWxpZGF0b3JTZXQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9wYXNzd29yZFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bob25lbFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlcXVpcmVkVmFsaWRhdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbnRhaW5lckJyaWRnZVwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb250YWluZXJCcmlkZ2Uge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsU3RyaW5nIFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbG9hZFVybCh1cmxTdHJpbmcpIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB1cmxTdHJpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVPYmplY3QgXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGl0bGUgXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsU3RyaW5nIFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcmVwbGFjZVVybCh1cmxTdHJpbmcsIHRpdGxlLCBzdGF0ZU9iamVjdCkge1xyXG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZShzdGF0ZU9iamVjdCwgdGl0bGUsIHVybFN0cmluZyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZU9iamVjdCBcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0aXRsZSBcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmxTdHJpbmcgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwdXNoVXJsKHVybFN0cmluZywgdGl0bGUsIHN0YXRlT2JqZWN0KSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKHN0YXRlT2JqZWN0LCB0aXRsZSwgdXJsU3RyaW5nKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjdXJyZW50VXJsKCkge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZ2V0RWxlbWVudEJ5SWQoaWQpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsZXUgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSkge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjcmVhdGVFbGVtZW50KG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZVNwYWNlIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjcmVhdGVFbGVtZW50TlMobmFtZVNwYWNlLCBuYW1lKSB7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lU3BhY2UsIG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGZldGNoKHVybCwgcGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCA9IDEwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDApIHtcclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLnRpbWVvdXQoY29ubmVjdGlvblRpbWVvdXQsIHdpbmRvdy5mZXRjaCh1cmwsIHBhcmFtcykpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0b3JhZ2UgYnJpZGdlXHJcblxyXG4gICAgc3RhdGljIHNldFNlc3Npb25BdHRyaWJ1dGUoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHdpbmRvdy5zZXNzaW9uU3RvcmFnZS5zZXRJdGVtKGtleSx2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZVNlc3Npb25BdHRyaWJ1dGUoa2V5KSB7XHJcbiAgICAgICAgd2luZG93LnNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0U2Vzc2lvbkF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93LnNlc3Npb25TdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaGFzU2Vzc2lvbkF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93LnNlc3Npb25TdG9yYWdlLmdldEl0ZW0oa2V5KSAhPT0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgc2V0TG9jYWxBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVMb2NhbEF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaGFzTG9jYWxBdHRyaWJ1dGUoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpICE9PSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRMb2NhbEF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZUVsZW1lbnQoaWQpIHtcclxuICAgICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYWRkSGVhZGVyRWxlbWVudChlbGVtZW50KSB7XHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdO1xyXG4gICAgICAgIGhlYWRlci5hcHBlbmQoZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFkZEJvZHlFbGVtZW50KGVsZW1lbnQpIHtcclxuICAgICAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJib2R5XCIpWzBdO1xyXG4gICAgICAgIGJvZHkuYXBwZW5kKGVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBwcmVwZW5kSGVhZGVyRWxlbWVudChlbGVtZW50KSB7XHJcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdO1xyXG4gICAgICAgIGhlYWRlci5wcmVwZW5kKGVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBwcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF07XHJcbiAgICAgICAgYm9keS5wcmVwZW5kKGVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyB0aW1lb3V0KG1pbGxpc2Vjb25kcywgcHJvbWlzZSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJ0aW1lb3V0XCIpKVxyXG4gICAgICAgICAgfSwgbWlsbGlzZWNvbmRzKVxyXG4gICAgICAgICAgcHJvbWlzZS50aGVuKHJlc29sdmUsIHJlamVjdClcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxufSIsImltcG9ydCB7IENvbnRhaW5lckJyaWRnZSB9IGZyb20gXCIuLi9icmlkZ2UvY29udGFpbmVyQnJpZGdlXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2xpZW50IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGdldCh1cmwsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCl7XHJcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXHJcbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuZmV0Y2godXJsLnRvU3RyaW5nKCkscGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwb3N0KHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XHJcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xyXG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVycyxcclxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxyXG4gICAgICAgICAgICByZWRpcmVjdDogXCJmb2xsb3dcIiwgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHB1dCh1cmwsIGRhdGEsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCwgYXV0aG9yaXphdGlvbiA9IG51bGwpe1xyXG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcclxuICAgICAgICB2YXIgcGFyYW1zID0gIHtcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXHJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsIFxyXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxyXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHBhdGNoKHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XHJcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xyXG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcclxuICAgICAgICAgICAgbWV0aG9kOiAnUEFUQ0gnLCBcclxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cclxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZGVsZXRlKHVybCwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwKXtcclxuICAgICAgICB2YXIgcGFyYW1zID0gIHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcclxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cclxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24gPSBudWxsKSB7XHJcbiAgICAgICAgbGV0IGhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBcIk1vemlsbGEvNC4wIE1ETiBFeGFtcGxlXCIsXHJcbiAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAoYXV0aG9yaXphdGlvbikge1xyXG4gICAgICAgICAgICBoZWFkZXJzID0ge1xyXG4gICAgICAgICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFwiTW96aWxsYS80LjAgTUROIEV4YW1wbGVcIixcclxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgICAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGF1dGhvcml6YXRpb25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaGVhZGVycztcclxuICAgIH1cclxufSIsImltcG9ydCB7TGlzdCxNYXB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgVXJse1xuXG4gICAgY29uc3RydWN0b3IodmFsdWUpe1xuICAgICAgICB0aGlzLnByb3RvY29sID0gbnVsbDtcbiAgICAgICAgdGhpcy5ob3N0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3J0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmJvb2ttYXJrID0gbnVsbDtcbiAgICAgICAgaWYodmFsdWUgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZVByb3RvY29sKHZhbHVlKTtcbiAgICAgICAgaWYocmVtYWluaW5nID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLnByb3RvY29sICE9PSBudWxsKXtcbiAgICAgICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lSG9zdChyZW1haW5pbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5ob3N0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUG9ydChyZW1haW5pbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVtYWluaW5nID0gdGhpcy5kZXRlcm1pbmVQYXRoKHJlbWFpbmluZyk7XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVtYWluaW5nID0gdGhpcy5kZXRlcm1pbmVQYXJhbWV0ZXJzKHJlbWFpbmluZyk7XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZXRlcm1pbmVCb29rbWFyayhyZW1haW5pbmcpO1xuICAgIH1cblxuICAgIGdldFByb3RvY29sKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3RvY29sO1xuICAgIH1cblxuICAgIGdldEhvc3QoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuaG9zdDtcbiAgICB9XG5cbiAgICBnZXRQb3J0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBvcnQ7XG4gICAgfVxuXG4gICAgZ2V0UGF0aExpc3QoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aExpc3Q7XG4gICAgfVxuXG4gICAgZ2V0UGF0aFBhcnQoaW5kZXgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wYXRoTGlzdC5nZXQoaW5kZXgpO1xuICAgIH1cblxuICAgIGdldFBhdGgoKXtcbiAgICAgICAgbGV0IHBhdGggPSBcIi9cIjtcbiAgICAgICAgbGV0IGZpcnN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wYXRoTGlzdC5mb3JFYWNoKCh2YWx1ZSA9PiB7XG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGggKyBcIi9cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXRoICsgdmFsdWU7XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9KSx0aGlzKTtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuXG4gICAgY2xlYXJQYXRoTGlzdCgpe1xuICAgICAgICB0aGlzLnBhdGhMaXN0ID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICBnZXRQYXJhbWV0ZXJNYXAoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyTWFwO1xuICAgIH1cblxuICAgIGNsZWFyUGFyYW1ldGVyTUFwKCl7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyTWFwID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGdldFBhcmFtZXRlcihrZXkpe1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJhbWV0ZXJNYXAuZ2V0KGtleSk7XG4gICAgfVxuXG4gICAgc2V0UGFyYW1ldGVyKGtleSx2YWx1ZSl7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyTWFwLnNldChrZXksdmFsdWUpO1xuICAgIH1cblxuICAgIHNldEJvb2ttYXJrKGJvb2ttYXJrKXtcbiAgICAgICAgdGhpcy5ib29rbWFyayA9IGJvb2ttYXJrO1xuICAgIH1cblxuICAgIHNldFBhdGgodmFsdWUpIHtcbiAgICAgICAgdGhpcy5kZXRlcm1pbmVQYXRoKHZhbHVlKTtcbiAgICB9XG5cbiAgICBzZXRRdWVyeVN0cmluZyh2YWx1ZSkge1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IHRoaXMuZGV0ZXJtaW5lUGFyYW1ldGVycyh2YWx1ZSk7XG4gICAgfVxuXG4gICAgZ2V0Qm9va21hcmsoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYm9va21hcms7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUHJvdG9jb2wodmFsdWUpe1xuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiLy9cIikgPT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIi8vXCIpO1xuICAgICAgICBpZihwYXJ0c1swXS5pbmRleE9mKFwiL1wiKSAhPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJvdG9jb2wgPSBwYXJ0c1swXTtcbiAgICAgICAgaWYocGFydHMubGVuZ3RoPT0xKXtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKHBhcnRzWzBdICsgXCIvL1wiLFwiXCIpO1xuICAgIH1cblxuICAgIGRldGVybWluZUhvc3QodmFsdWUpe1xuICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIi9cIik7XG4gICAgICAgIHZhciBob3N0UGFydCA9IHBhcnRzWzBdO1xuICAgICAgICBpZihob3N0UGFydC5pbmRleE9mKFwiOlwiKSAhPT0gLTEpe1xuICAgICAgICAgICAgaG9zdFBhcnQgPSBob3N0UGFydC5zcGxpdChcIjpcIilbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ob3N0ID0gaG9zdFBhcnQ7XG4gICAgICAgIGlmKHBhcnRzLmxlbmd0aCA+IDEpe1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoaG9zdFBhcnQsXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUG9ydCh2YWx1ZSl7XG4gICAgICAgIGlmKCF2YWx1ZS5zdGFydHNXaXRoKFwiOlwiKSl7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBvcnRQYXJ0ID0gdmFsdWUuc3BsaXQoXCIvXCIpWzBdLnN1YnN0cmluZygxKTtcbiAgICAgICAgdGhpcy5wb3J0ID0gcG9ydFBhcnQ7XG4gICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKFwiOlwiICsgcG9ydFBhcnQsXCJcIik7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUGF0aCh2YWx1ZSl7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB2YWx1ZTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIj9cIikgIT09IC0xKXtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHZhbHVlLnNwbGl0KFwiP1wiKTtcbiAgICAgICAgICAgIGlmKHBhcnRzLmxlbmd0aCA+IDEpe1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZyA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiP1wiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnRzWzBdO1xuICAgICAgICB9IGVsc2UgaWYodmFsdWUuaW5kZXhPZihcIiNcIikgIT09IC0xKXtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHZhbHVlLnNwbGl0KFwiI1wiKTtcbiAgICAgICAgICAgIGlmKHBhcnRzLmxlbmd0aCA+IDEpe1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZyA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiI1wiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnRzWzBdO1xuICAgICAgICB9XG4gICAgICAgIGlmKHZhbHVlLnN0YXJ0c1dpdGgoXCIvXCIpKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXRoUGFydHMgPSBuZXcgTGlzdCh2YWx1ZS5zcGxpdChcIi9cIikpO1xuICAgICAgICB0aGlzLnBhdGhMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgcGF0aFBhcnRzLmZvckVhY2goZnVuY3Rpb24odmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIHBhcmVudC5wYXRoTGlzdC5hZGQoZGVjb2RlVVJJKHZhbHVlKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgcmV0dXJuIHJlbWFpbmluZztcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVQYXJhbWV0ZXJzKHZhbHVlKXtcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IHZhbHVlO1xuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiP1wiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiP1wiKSsxKTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIiNcIikgIT09IC0xKSB7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcoMCx2YWx1ZS5pbmRleE9mKFwiI1wiKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnRMaXN0ID0gbmV3IExpc3QodmFsdWUuc3BsaXQoXCImXCIpKTtcbiAgICAgICAgdmFyIHBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgcGFydExpc3QuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgdmFyIGtleVZhbHVlID0gdmFsdWUuc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgaWYoa2V5VmFsdWUubGVuZ3RoID49IDIpe1xuICAgICAgICAgICAgICAgIHBhcmFtZXRlck1hcC5zZXQoZGVjb2RlVVJJKGtleVZhbHVlWzBdKSxkZWNvZGVVUkkoa2V5VmFsdWVbMV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LHRoaXMpO1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IHBhcmFtZXRlck1hcDtcbiAgICAgICAgcmV0dXJuIHJlbWFpbmluZztcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVCb29rbWFyayh2YWx1ZSl7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5ib29rbWFyayA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiI1wiKSsxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHZhciB2YWx1ZSA9IFwiXCI7XG4gICAgICAgIGlmKHRoaXMucHJvdG9jb2wgIT09IG51bGwpe1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIHRoaXMucHJvdG9jb2wgKyBcIi8vXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5ob3N0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyB0aGlzLmhvc3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5wb3J0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIjpcIiArIHRoaXMucG9ydDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGF0aExpc3QuZm9yRWFjaChmdW5jdGlvbihwYXRoUGFydCxwYXJlbnQpe1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIFwiL1wiICsgcGF0aFBhcnQ7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSx0aGlzKTtcblxuICAgICAgICB2YXIgZmlyc3RQYXJhbWV0ZXIgPSB0cnVlO1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcC5mb3JFYWNoKGZ1bmN0aW9uKHBhcmFtZXRlcktleSxwYXJhbWV0ZXJWYWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgaWYoZmlyc3RQYXJhbWV0ZXIpe1xuICAgICAgICAgICAgICAgIGZpcnN0UGFyYW1ldGVyPWZhbHNlO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIj9cIjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIiZcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBlbmNvZGVVUkkocGFyYW1ldGVyS2V5KSArIFwiPVwiICsgZW5jb2RlVVJJKHBhcmFtZXRlclZhbHVlKTtcbiAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgaWYodGhpcy5ib29rbWFyayAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIFwiI1wiICsgdGhpcy5ib29rbWFyaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG59XG4iLCJleHBvcnQgY2xhc3MgU3R5bGVze1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3R5bGVzU291cmNlIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihzdHlsZXNTb3VyY2Upe1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLnN0eWxlc1NvdXJjZSA9IHN0eWxlc1NvdXJjZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldFN0eWxlc1NvdXJjZSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc1NvdXJjZTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHtNYXAsIExvZ2dlciwgT2JqZWN0RnVuY3Rpb259IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xyXG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcclxuaW1wb3J0IHsgU3R5bGVzIH0gZnJvbSBcIi4vc3R5bGVzLmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiU3R5bGVzUmVnaXN0cnlcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgU3R5bGVzUmVnaXN0cnkge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXHJcbiAgICAgICAgdGhpcy5zdHlsZXNNYXAgPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzVXJsTWFwID0gbmV3IE1hcCgpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge2ludGVnZXJ9ICovXHJcbiAgICAgICAgdGhpcy5zdHlsZXNRdWV1ZVNpemUgPSAwO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xyXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqIEBwYXJhbSB7U3R5bGVzfSBzdHlsZXMgXHJcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxyXG4gICAgICovXHJcbiAgICBzZXQobmFtZSxzdHlsZXMsdXJsKXtcclxuICAgICAgICBpZih1cmwgIT09IHVuZGVmaW5lZCAmJiB1cmwgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5zdHlsZXNVcmxNYXAuc2V0KG5hbWUsIHVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3R5bGVzTWFwLnNldChuYW1lLCBzdHlsZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqL1xyXG4gICAgZ2V0KG5hbWUpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc01hcC5nZXQobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxyXG4gICAgICovXHJcbiAgICBjb250YWlucyhuYW1lKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNNYXAuY29udGFpbnMobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGNhbGxiYWNrIFxyXG4gICAgICovXHJcbiAgICBkb25lKGNhbGxiYWNrKXtcclxuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1N0eWxlc1JlZ2lzdHJ5fSByZWdpc3RyeSBcclxuICAgICAqL1xyXG4gICAgZG9DYWxsYmFjayhyZWdpc3RyeSl7XHJcbiAgICAgICAgaWYodG1vLmNhbGxiYWNrICE9PSBudWxsICYmIHJlZ2lzdHJ5LmNhbGxiYWNrICE9PSB1bmRlZmluZWQgICYmIHJlZ2lzdHJ5LnN0eWxlc1F1ZXVlU2l6ZSA9PT0gcmVnaXN0cnkuc3R5bGVzTWFwLnNpemUoKSl7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcclxuICAgICAgICAgICAgcmVnaXN0cnkuY2FsbGJhY2sgPSBudWxsO1xyXG4gICAgICAgICAgICB0ZW1wQ2FsbGJhY2suY2FsbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxyXG4gICAgICovXHJcbiAgICAgbG9hZChuYW1lLCB1cmwpIHtcclxuICAgICAgICB0aGlzLnN0eWxlc1F1ZXVlU2l6ZSArKztcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgc3R5bGVzIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgU3R5bGVzKHRleHQpLHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7TWFwfSBuYW1lVXJsTWFwIFxyXG4gICAgICovXHJcbiAgICBnZXRTdHlsZXNMb2FkZWRQcm9taXNlKG5hbWVVcmxNYXApIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBsb2FkZWQgPSAwO1xyXG4gICAgICAgICAgICBpZighbmFtZVVybE1hcCB8fCBuYW1lVXJsTWFwLnNpemUoKSA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbmFtZVVybE1hcC5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuY29udGFpbnMoa2V5KSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkICsrO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcml2YXRlTG9hZChrZXksIG5ldyBVcmwodmFsdWUpKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobG9hZGVkID09IG5hbWVVcmxNYXAuc2l6ZSgpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgocmVhc29uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZWFzb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9LHRoaXMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGVMb2FkKG5hbWUsIHVybCkge1xyXG4gICAgICAgIExPRy5pbmZvKFwiTG9hZGluZyBzdHlsZXMgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmwudG9TdHJpbmcoKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5vayl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCBzdHlsZXMgZm9yIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UudGV4dCgpLnRoZW4oKHRleHQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChuYW1lLG5ldyBTdHlsZXModGV4dCksdXJsKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZXtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZW1wbGF0ZVNvdXJjZSBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZVNvdXJjZSl7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVTb3VyY2UgPSB0ZW1wbGF0ZVNvdXJjZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldFRlbXBsYXRlU291cmNlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlU291cmNlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge01hcCwgTG9nZ2VyLCBPYmplY3RGdW5jdGlvbn0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1RlbXBsYXRlfSBmcm9tIFwiLi90ZW1wbGF0ZS5qc1wiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiVGVtcGxhdGVSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlUXVldWVTaXplID0gMDtcblxuICAgICAgICAvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlUHJlZml4IFxuICAgICAqL1xuICAgIHNldExhbmd1YWdlUHJlZml4KGxhbmd1YWdlUHJlZml4KSB7XG4gICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggPSBsYW5ndWFnZVByZWZpeDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1RlbXBsYXRlfSB0ZW1wbGF0ZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIHNldChuYW1lLHRlbXBsYXRlLHVybCl7XG4gICAgICAgIGlmKHVybCAhPT0gdW5kZWZpbmVkICYmIHVybCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZVVybE1hcC5zZXQobmFtZSwgdXJsKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRlbXBsYXRlTWFwLnNldChuYW1lLCB0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICovXG4gICAgZ2V0KG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZU1hcC5nZXQobmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICovXG4gICAgY29udGFpbnMobmFtZSl7XG4gICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlTWFwLmNvbnRhaW5zKG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGNhbGxiYWNrIFxuICAgICAqL1xuICAgIGRvbmUoY2FsbGJhY2spe1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1RlbXBsYXRlUmVnaXN0cnl9IHJlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGRvQ2FsbGJhY2socmVnaXN0cnkpe1xuICAgICAgICBpZih0bW8uY2FsbGJhY2sgIT09IG51bGwgJiYgcmVnaXN0cnkuY2FsbGJhY2sgIT09IHVuZGVmaW5lZCAgJiYgcmVnaXN0cnkudGVtcGxhdGVRdWV1ZVNpemUgPT09IHJlZ2lzdHJ5LnRlbXBsYXRlTWFwLnNpemUoKSl7XG4gICAgICAgICAgICB2YXIgdGVtcENhbGxiYWNrID0gcmVnaXN0cnkuY2FsbGJhY2s7XG4gICAgICAgICAgICByZWdpc3RyeS5jYWxsYmFjayA9IG51bGw7XG4gICAgICAgICAgICB0ZW1wQ2FsbGJhY2suY2FsbCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBsb2FkKG5hbWUsIHVybCkge1xuICAgICAgICBpZih0aGlzLmxhbmd1YWdlUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1cmwuZ2V0UGF0aExpc3QoKS5zZXRMYXN0KFxuICAgICAgICAgICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggKyBcIi5cIiArXG4gICAgICAgICAgICAgICAgdXJsLmdldFBhdGhMaXN0KCkuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGVtcGxhdGVRdWV1ZVNpemUgKys7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFRlbXBsYXRlKHRleHQpLHVybCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBuYW1lVXJsTWFwIFxuICAgICAqL1xuICAgIGdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UobmFtZVVybE1hcCkge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpID0+IHtcbiAgICAgICAgICAgIHZhciBsb2FkZWQgPSAwO1xuICAgICAgICAgICAgaWYoIW5hbWVVcmxNYXAgfHwgbmFtZVVybE1hcC5zaXplKCkgPT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuYW1lVXJsTWFwLmZvckVhY2goKGtleSwgdmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuY29udGFpbnMoa2V5KSl7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcbiAgICAgICAgICAgICAgICAgICAgaWYobG9hZGVkID09IG5hbWVVcmxNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wcml2YXRlTG9hZChrZXksIG5ldyBVcmwodmFsdWUpKVxuXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChyZWFzb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sdGhpcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgcHJpdmF0ZUxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIGlmKHRoaXMubGFuZ3VhZ2VQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVybC5nZXRQYXRoTGlzdCgpLnNldExhc3QoXG4gICAgICAgICAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCArIFwiLlwiICtcbiAgICAgICAgICAgICAgICB1cmwuZ2V0UGF0aExpc3QoKS5nZXRMYXN0KClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgTE9HLmluZm8oXCJMb2FkaW5nIHRlbXBsYXRlIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsLnRvU3RyaW5nKCkpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sc2UpID0+IHtcbiAgICAgICAgICAgIENsaWVudC5nZXQodXJsKS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5vayl7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgdGVtcGxhdGUgZm9yIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNwb25zZS50ZXh0KCkudGhlbigodGV4dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChuYW1lLG5ldyBUZW1wbGF0ZSh0ZXh0KSx1cmwpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufSIsImltcG9ydCB7IExvZ2dlciwgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IENvbmZpZywgVHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4vdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlRlbXBsYXRlUG9zdENvbmZpZ1wiKTtcclxuXHJcbi8qKlxyXG4gKiBUbyBiZSBhZGRlZCB0byBtaW5kaSBhcyBhIHNpbmdsZXRvbi4gV2lsbCBzY2FuIHRocm91Z2ggYWxsIGNvbmZpZ3VyZWQgY2xhc3NlcyB0aGF0IGhhdmUgYSBURU1QTEFURV9VUkwgYW5kIENPTVBPTkVOVF9OQU1FXHJcbiAqIHN0YXRpYyBnZXR0ZXIgYW5kIHdpbGwgYXN5bmNyb25vdXNseSBsb2FkIHRoZW0uIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gYWxsIHRlbXBsYXRlcyBhcmUgbG9hZGVkXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVzTG9hZGVyIHtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGVSZWdpc3RyeX0gdGVtcGxhdGVSZWdpc3RyeSBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IodGVtcGxhdGVSZWdpc3RyeSkge1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGVSZWdpc3RyeSA9IHRlbXBsYXRlUmVnaXN0cnk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7TWFwfSBjb25maWdFbnRyaWVzXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgbG9hZChjb25maWdFbnRyaWVzKSB7XHJcbiAgICAgICAgbGV0IHRlbXBsYXRlTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIGNvbmZpZ0VudHJpZXMuZm9yRWFjaCgoa2V5LCBjb25maWdFbnRyeSwgcGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlRFTVBMQVRFX1VSTCAmJiBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSkge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVNYXAuc2V0KGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FLCBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5URU1QTEFURV9VUkwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpOyBcclxuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UodGVtcGxhdGVNYXApO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IExvZ2dlciwgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IENvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xyXG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiU3R5bGVzTG9hZGVyXCIpO1xyXG5cclxuLyoqXHJcbiAqIFRvIGJlIGFkZGVkIHRvIG1pbmRpIGFzIGEgc2luZ2xldG9uLiBXaWxsIHNjYW4gdGhyb3VnaCBhbGwgY29uZmlndXJlZCBjbGFzc2VzIHRoYXQgaGF2ZSBhIFNUWUxFU19VUkwgYW5kIENPTVBPTkVOVF9OQU1FXHJcbiAqIHN0YXRpYyBnZXR0ZXIgYW5kIHdpbGwgYXN5bmNyb25vdXNseSBsb2FkIHRoZW0uIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gYWxsIHN0eWxlcyBhcmUgbG9hZGVkXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU3R5bGVzTG9hZGVyIHtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7U3R5bGVzUmVnaXN0cnl9IHN0eWxlc1JlZ2lzdHJ5IFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihzdHlsZXNSZWdpc3RyeSkge1xyXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBzdHlsZXNSZWdpc3RyeTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtNYXB9IGNvbmZpZ0VudHJpZXNcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBsb2FkKGNvbmZpZ0VudHJpZXMpIHtcclxuICAgICAgICBsZXQgc3R5bGVzTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIGNvbmZpZ0VudHJpZXMuZm9yRWFjaCgoa2V5LCBjb25maWdFbnRyeSwgcGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlNUWUxFU19VUkwgJiYgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUpIHtcclxuICAgICAgICAgICAgICAgIHN0eWxlc01hcC5zZXQoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUsIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlNUWUxFU19VUkwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpOyBcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNSZWdpc3RyeS5nZXRTdHlsZXNMb2FkZWRQcm9taXNlKHN0eWxlc01hcCk7XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IENvbmZpZywgSW5qZWN0aW9uUG9pbnQsIFR5cGVDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcclxuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZXNMb2FkZXIgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVzTG9hZGVyLmpzXCI7XHJcbmltcG9ydCB7IFN0eWxlc0xvYWRlciB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzTG9hZGVyLmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29tcG9uZW50Q29uZmlnUHJvY2Vzc29yXCIpXHJcblxyXG4vKipcclxuICogTWluZGkgY29uZmlnIHByb2Nlc3NvciB3aGljaCBsb2FkcyBhbGwgdGVtcGxhdGVzIGFuZCBzdHlsZXMgZm9yIGFsbCBjb25maWd1cmVkIGNvbXBvbmVudHNcclxuICogYW5kIHRoZW4gY2FsbHMgYW55IGV4aXN0aW5nIGNvbXBvbmVudExvYWRlZCBmdW5jdGlvbiBvbiBlYWNoIGNvbXBvbmVudFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIENvbXBvbmVudENvbmZpZ1Byb2Nlc3NvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEB0eXBlIHtUZW1wbGF0ZVJlZ2lzdHJ5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGVSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFRlbXBsYXRlUmVnaXN0cnkpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7U3R5bGVzUmVnaXN0cnl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy5zdHlsZXNSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFN0eWxlc1JlZ2lzdHJ5KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqL1xyXG4gICAgcG9zdENvbmZpZygpe1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGVzTG9hZGVyID0gbmV3IFRlbXBsYXRlc0xvYWRlcih0aGlzLnRlbXBsYXRlUmVnaXN0cnkpO1xyXG4gICAgICAgIHRoaXMuc3R5bGVzTG9hZGVyID0gbmV3IFN0eWxlc0xvYWRlcih0aGlzLnN0eWxlc1JlZ2lzdHJ5KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtDb25maWd9IGNvbmZpZ1xyXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICAgKi9cclxuICAgIHByb2Nlc3NDb25maWcoY29uZmlnLCB1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSB7XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChcclxuICAgICAgICAgICAgWyBcclxuICAgICAgICAgICAgICAgIHRoaXMudGVtcGxhdGVzTG9hZGVyLmxvYWQodW5jb25maWd1cmVkQ29uZmlnRW50cmllcyksIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHlsZXNMb2FkZXIubG9hZCh1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSBcclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgQ29udGFpbmVyQnJpZGdlIH0gZnJvbSBcIi4uL2JyaWRnZS9jb250YWluZXJCcmlkZ2VcIjtcclxuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSGlzdG9yeSB7XHJcblxyXG4gICAgc3RhdGljIHJlcGxhY2VVcmwodXJsLCB0aXRsZSwgc3RhdGVPYmplY3QpIHtcclxuICAgICAgICBDb250YWluZXJCcmlkZ2UucmVwbGFjZVVybCh1cmwudG9TdHJpbmcoKSwgdGl0bGUsIHN0YXRlT2JqZWN0KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcHVzaFVybCh1cmwsIHRpdGxlLCBzdGF0ZU9iamVjdCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5wdXNoVXJsKHVybC50b1N0cmluZygpLCB0aXRsZSwgc3RhdGVPYmplY3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRVcmwoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBVcmwoQ29udGFpbmVyQnJpZGdlLmN1cnJlbnRVcmwoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGxvYWRVcmwodXJsKSB7XHJcbiAgICAgICAgQ29udGFpbmVyQnJpZGdlLmxvYWRVcmwodXJsLnRvU3RyaW5nKCkpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJMb2FkZXJGaWx0ZXJcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgTG9hZGVyRmlsdGVyIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufVxyXG4gICAgICovXHJcbiAgICBwcm9jZXNzKCkge1xyXG4gICAgICAgIExPRy5pbmZvKFwiSW51bXBsZW1lbnRlZCBMb2FkZXIgRmlsdGVyIGJyZWFrcyBieSBkZWZhdWx0XCIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxyXG5pbXBvcnQgeyBIaXN0b3J5IH0gZnJvbSBcIi4uL25hdmlnYXRpb24vaGlzdG9yeS5qc1wiO1xyXG5pbXBvcnQgeyBMb2FkZXJGaWx0ZXIgfSBmcm9tIFwiLi9sb2FkZXJGaWx0ZXIuanNcIjtcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJNb2R1bGVMb2FkZXJcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgTW9kdWxlTG9hZGVyIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtSZWdFeHB9IG1hdGNoUGF0aCBcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb290UGF0aCBcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGVQYXRoIFxyXG4gICAgICogQHBhcmFtIHtBcnJheTxMb2FkZXJGaWx0ZXI+fSBsb2FkZXJGaWx0ZXJzIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihtYXRjaFBhdGgsIHJvb3RQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJGaWx0ZXJzID0gW10pIHtcclxuICAgICAgICBcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7UmVnRXhwfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubWF0Y2hQYXRoID0gbWF0Y2hQYXRoO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucm9vdFBhdGggPSByb290UGF0aDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm1vZHVsZVBhdGggPSBtb2R1bGVQYXRoO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7QXJyYXk8TG9hZGVyRmlsdGVyPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmxvYWRlckZpbHRlcnMgPSBsb2FkZXJGaWx0ZXJzO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdEluc3RhbmNlID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJlcXVlc3RlZFBhdGggPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGF1dGhvcml6ZWQoKXsgXHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWlyZWRTY29wZUFycmF5Lmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgbWF0Y2hlcygpeyBcclxuICAgICAgICBjb25zdCB1cmwgPSBIaXN0b3J5LmdldFVybCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hdGNoUGF0aC50ZXN0KHVybC5nZXRQYXRoKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGxvYWQocm9vdFBhdGgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZmlsdGVyc1Bhc3MoKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgaWYgKCFwYXJlbnQuZGVmYXVsdEluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5pbXBvcnRNb2R1bGUoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5kZWZhdWx0SW5zdGFuY2UubG9hZChyb290UGF0aCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5kZWZhdWx0SW5zdGFuY2UubG9hZChyb290UGF0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZpbHRlcnNQYXNzKCkge1xyXG4gICAgICAgIGxldCBwYXNzID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5sb2FkZXJGaWx0ZXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZGVyRmlsdGVycy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZighZWxlbWVudC5wcm9jZXNzKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwYXNzO1xyXG4gICAgfVxyXG5cclxuICAgIGltcG9ydE1vZHVsZSgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobnVsbCAhPSB0aGlzLmRlZmF1bHRJbnN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGltcG9ydCh0aGlzLm1vZHVsZVBhdGgpLnRoZW4oKG1vZHVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0SW5zdGFuY2UgPSBuZXcgbW9kdWxlLmRlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKHJlYXNvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlYXNvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGRlZmF1bHRJbnN0YW5jZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZWZhdWx0SW5zdGFuY2U7XHJcbiAgICB9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXR0cmlidXRlKSB7XHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGUgPSBhdHRyaWJ1dGU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHZhbHVlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS52YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbmFtZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGUubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbmFtZXNwYWNlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS5uYW1lO1xyXG4gICAgfVxyXG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTWFwLCBMb2dnZXIsIExpc3QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEF0dHJpYnV0ZSB9IGZyb20gXCIuL2F0dHJpYnV0ZS5qc1wiO1xuaW1wb3J0IHsgQ29udGFpbmVyQnJpZGdlIH0gZnJvbSBcIi4uL2JyaWRnZS9jb250YWluZXJCcmlkZ2UuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkJhc2VFbGVtZW50XCIpO1xuXG4vKipcbiAqIEEgYmFzZSBjbGFzcyBmb3IgZW5jbG9zaW5nIGFuIEhUTUxFbGVtZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fHN0cmluZ3xIVE1MRWxlbWVudH0gdmFsdWVcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIFxuICAgICAgICAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG51bGw7XG4gICAgICAgIHRoaXMuZXZlbnRzQXR0YWNoZWQgPSBuZXcgTGlzdCgpO1xuICAgICAgICBcbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBYbWxFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLmNyZWF0ZUZyb21YbWxFbGVtZW50KHZhbHVlLCBwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCl7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBMT0cuZXJyb3IoXCJVbnJlY29nbml6ZWQgdmFsdWUgZm9yIEVsZW1lbnRcIik7XG4gICAgICAgIExPRy5lcnJvcih2YWx1ZSk7XG4gICAgfVxuXG4gICAgbG9hZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIGlmKHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzID09PSBudWxsIHx8IHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuYXR0cmlidXRlTWFwID09PSBudWxsIHx8IHRoaXMuYXR0cmlidXRlTWFwID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnQuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwLnNldCh0aGlzLmVsZW1lbnQuYXR0cmlidXRlc1tpXS5uYW1lLG5ldyBBdHRyaWJ1dGUodGhpcy5lbGVtZW50LmF0dHJpYnV0ZXNbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBicm93c2VyIEVsZW1lbnQgZnJvbSB0aGUgWG1sRWxlbWVudFxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB4bWxFbGVtZW50XG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50RWxlbWVudFxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIGNyZWF0ZUZyb21YbWxFbGVtZW50KHhtbEVsZW1lbnQsIHBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBudWxsO1xuICAgICAgICBpZih4bWxFbGVtZW50Lm5hbWVzcGFjZSl7XG4gICAgICAgICAgICBlbGVtZW50ID0gQ29udGFpbmVyQnJpZGdlLmNyZWF0ZUVsZW1lbnROUyh4bWxFbGVtZW50Lm5hbWVzcGFjZVVyaSx4bWxFbGVtZW50LmZ1bGxOYW1lKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlbGVtZW50ID0gQ29udGFpbmVyQnJpZGdlLmNyZWF0ZUVsZW1lbnQoeG1sRWxlbWVudC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZihwYXJlbnRFbGVtZW50ICYmIHBhcmVudEVsZW1lbnQubWFwcGVkRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHhtbEVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGF0dHJpYnV0ZUtleSxhdHRyaWJ1dGUpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlS2V5LGF0dHJpYnV0ZS52YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBhIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IGluIHRoZSBlbmNsb3NlZCBlbGVtZW50IGlmIG5vbmUgYWxscmVhZHkgZXhpc3RzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZnVuY3Rpb25QYXJhbVxuICAgICAqL1xuICAgIGF0dGFjaEV2ZW50KGV2ZW50VHlwZSwgZnVuY3Rpb25QYXJhbSkge1xuICAgICAgICBpZighdGhpcy5ldmVudHNBdHRhY2hlZC5jb250YWlucyhldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBpZihldmVudFR5cGUuc3RhcnRzV2l0aChcIm9uXCIpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRUeXBlID0gZXZlbnRUeXBlLnN1YnN0cigyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZnVuY3Rpb25QYXJhbSk7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c0F0dGFjaGVkLmFkZChldmVudFR5cGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTE9HLndhcm4oXCJFdmVudCAnXCIgKyBldmVudFR5cGUgKyBcIicgYWxscmVhZHkgYXR0YWNoZWQgZm9yIFwiICsgdGhpcy5lbGVtZW50Lm5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBlbmNsb3NlZCBlbGVtZW50XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXQgZnVsbE5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudGFnTmFtZTtcbiAgICB9XG5cbiAgICBnZXQgdG9wKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICB9XG5cbiAgICBnZXQgYm90dG9tKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbTtcbiAgICB9XG5cbiAgICBnZXQgbGVmdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xuICAgIH1cblxuICAgIGdldCByaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5yaWdodDtcbiAgICB9XG5cbiAgICBnZXQgd2lkdGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgZ2V0IGF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHRoaXMubG9hZEF0dHJpYnV0ZXMoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlTWFwO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZVZhbHVlKGtleSx2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSx2YWx1ZSk7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlVmFsdWUoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlKGtleSk7XG4gICAgfVxuXG4gICAgY29udGFpbnNBdHRyaWJ1dGUoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaGFzQXR0cmlidXRlKGtleSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlQXR0cmlidXRlKGtleSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgfVxuXG4gICAgc2V0U3R5bGUoa2V5LHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVtrZXldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0U3R5bGUoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc3R5bGVba2V5XTtcbiAgICB9XG5cbiAgICByZW1vdmVTdHlsZShrZXkpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlW2tleV0gPSBudWxsO1xuICAgIH1cblxuICAgIHNldChpbnB1dCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSA9PT0gbnVsbCl7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVGhlIGVsZW1lbnQgaGFzIG5vIHBhcmVudCwgY2FuIG5vdCBzd2FwIGl0IGZvciB2YWx1ZVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dC5tYXBwZWRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQubWFwcGVkRWxlbWVudCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiBpbnB1dCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoQ29udGFpbmVyQnJpZGdlLmNyZWF0ZVRleHROb2RlKGlucHV0KSwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzTW91bnRlZCgpIHtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZW1vdmUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldENoaWxkKGlucHV0KSB7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChpbnB1dCk7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dC5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgJiYgaW5wdXQucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChDb250YWluZXJCcmlkZ2UuY3JlYXRlVGV4dE5vZGUoaW5wdXQpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSB1bmRlZmluZWQgJiYgaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dC5tYXBwZWRFbGVtZW50LHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgJiYgaW5wdXQucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKENvbnRhaW5lckJyaWRnZS5jcmVhdGVUZXh0Tm9kZShpbnB1dCksdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJBYnN0cmFjdElucHV0RWxlbWVudFwiKTtcblxuLyoqXG4gKiBTaGFyZWQgcHJvcGVydGllcyBvZiBpbnB1dCBlbGVtZW50c1xuICovXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RJbnB1dEVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHZhbHVlXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50XG4gICAgICovXG4gICAgY29uc3RydWN0b3IodmFsdWUsIHBhcmVudCkge1xuICAgICAgICBzdXBlcih2YWx1ZSwgcGFyZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHZhbHVlIG9mIHRoZSBpbnB1dHMgbmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm5hbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB2YWx1ZSBvZiBpbnB1dHMgbmFtZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgc2V0IG5hbWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBnaXZlbiBhbnkgcHJvY2Vzc2luZyBydWxlc1xuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5iYWNraW5nVmFsdWU7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBJbnB1dEV2ZW50KCdjaGFuZ2UnKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc291cmNlIHZhbHVlXG4gICAgICovXG4gICAgZ2V0IGJhY2tpbmdWYWx1ZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cblxuICAgIGZvY3VzKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBzZWxlY3RBbGwoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZWxlY3QoKTtcbiAgICB9XG5cbiAgICBlbmFibGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGRpc2FibGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5kaXNhYmxlZCA9IHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgUmFkaW9JbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHNldCBjaGVja2VkKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpc0NoZWNrZWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jaGVja2VkO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDaGVja2VkKCk7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBcInRydWVcIik7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2hlY2tib3hJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHNldCBjaGVja2VkKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpc0NoZWNrZWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jaGVja2VkO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDaGVja2VkKCk7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBcInRydWVcIik7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0SW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dGFyZWFJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIGdldCBpbm5lckhUTUwoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgc2V0IGlubmVySFRNTCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChpbnB1dCkge1xuICAgICAgICBzdXBlci5hZGRDaGlsZChpbnB1dCk7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgc3VwZXIucHJlcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuaW5uZXJIVE1MO1xuICAgIH1cblxufSIsImltcG9ydCB7IFhtbENkYXRhIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQ29udGFpbmVyQnJpZGdlIH0gZnJvbSBcIi4uL2JyaWRnZS9jb250YWluZXJCcmlkZ2UuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHRub2RlRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxDZGF0YX0gdmFsdWUgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBYbWxDZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gdGhpcy5jcmVhdGVGcm9tWG1sQ2RhdGEodmFsdWUsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IENvbnRhaW5lckJyaWRnZS5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1htbENkYXRhfSBjZGF0YUVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50RWxlbWVudCBcbiAgICAgKi9cbiAgICBjcmVhdGVGcm9tWG1sQ2RhdGEoY2RhdGFFbGVtZW50LCBwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY2RhdGFFbGVtZW50LnZhbHVlKTtcbiAgICAgICAgaWYocGFyZW50RWxlbWVudCAhPT0gbnVsbCAmJiBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHBhcmVudEVsZW1lbnQubWFwcGVkRWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIGdldCBtYXBwZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgU2ltcGxlRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgZ2V0IGlubmVySFRNTCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBzZXQgaW5uZXJIVE1MKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcclxuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZvcm1FbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3RvclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XHJcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGlucHV0cyBuYW1lXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXQgbmFtZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGlucHV0cyBuYW1lXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXHJcbiAgICAgKi9cclxuICAgIHNldCBuYW1lKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJtaXQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5zdWJtaXQoKTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFZpZGVvRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnN0cnVjdG9yXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB2YWx1ZSBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XHJcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXkoKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnBsYXkoKTtcclxuICAgIH1cclxuXHJcbiAgICBtdXRlKCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5tdXRlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdW5tdXRlKCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5tdXRlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sQ2RhdGEsWG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtSYWRpb0lucHV0RWxlbWVudH0gZnJvbSBcIi4vcmFkaW9JbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7Q2hlY2tib3hJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2NoZWNrYm94SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RleHRJbnB1dEVsZW1lbnR9IGZyb20gXCIuL3RleHRJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7VGV4dGFyZWFJbnB1dEVsZW1lbnR9IGZyb20gXCIuL3RleHRhcmVhSW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RleHRub2RlRWxlbWVudH0gZnJvbSBcIi4vdGV4dG5vZGVFbGVtZW50LmpzXCI7XG5pbXBvcnQge1NpbXBsZUVsZW1lbnR9IGZyb20gXCIuL3NpbXBsZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEZvcm1FbGVtZW50IH0gZnJvbSBcIi4vZm9ybUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFZpZGVvRWxlbWVudCB9IGZyb20gXCIuL3ZpZGVvRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudE1hcHBlciB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7YW55fSBpbnB1dCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgc3RhdGljIG1hcChpbnB1dCwgcGFyZW50KSB7XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1JhZGlvKGlucHV0KSl7IHJldHVybiBuZXcgUmFkaW9JbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvQ2hlY2tib3goaW5wdXQpKXsgcmV0dXJuIG5ldyBDaGVja2JveElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9TdWJtaXQoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb0Zvcm0oaW5wdXQpKXsgcmV0dXJuIG5ldyBGb3JtRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0YXJlYShpbnB1dCkpeyByZXR1cm4gbmV3IFRleHRhcmVhSW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHQoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1ZpZGVvKGlucHV0KSl7IHJldHVybiBuZXcgVmlkZW9FbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHRub2RlKGlucHV0KSl7IHJldHVybiBuZXcgVGV4dG5vZGVFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1NpbXBsZShpbnB1dCkpeyByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgY29uc29sZS5sb2coXCJNYXBwaW5nIHRvIHNpbXBsZSBieSBkZWZhdWx0IFwiICsgaW5wdXQpO1xuICAgICAgICByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1JhZGlvKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJyYWRpb1wiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInJhZGlvXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9DaGVja2JveChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwiY2hlY2tib3hcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJjaGVja2JveFwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvU3VibWl0KGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJzdWJtaXRcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJzdWJtaXRcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb0Zvcm0oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImZvcm1cIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1RleHQoaW5wdXQpe1xuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJ0ZXh0XCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInBhc3N3b3JkXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcImVtYWlsXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcImRhdGVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwidGltZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIikge1xuICAgICAgICAgICAgaWYoIWlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwidGV4dFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInBhc3N3b3JkXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiZW1haWxcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJkYXRlXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwidGltZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0bm9kZShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBOb2RlICYmIGlucHV0Lm5vZGVUeXBlID09PSBcIlRFWFRfTk9ERVwiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sQ2RhdGEpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9WaWRlbyhpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MVmlkZW9FbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcInZpZGVvXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0YXJlYShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcInRleHRhcmVhXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9TaW1wbGUoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50KTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IEVsZW1lbnRNYXBwZXIgfSBmcm9tIFwiLi4vZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudHtcblxuICAgIGNvbnN0cnVjdG9yKGV2ZW50KXtcbiAgICAgICAgdGhpcy5ldmVudCA9IGV2ZW50O1xuICAgICAgICBpZih0aGlzLmV2ZW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSBcImRyYWdzdGFydFwiKXtcbiAgICAgICAgICAgIHRoaXMuZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoJ3RleHQvcGxhaW4nLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3BQcm9wYWdhdGlvbigpe1xuICAgICAgICB0aGlzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHByZXZlbnREZWZhdWx0KCl7XG4gICAgICAgIHRoaXMuZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgZXZlbnQgYW5kIHRoZSBlZGdlIHggY29vcmRpbmF0ZSBvZiB0aGUgY29udGFpbmluZyBvYmplY3RcbiAgICAgKi9cbiAgICBnZXRPZmZzZXRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Lm9mZnNldFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGV2ZW50IGFuZCB0aGUgZWRnZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNvbnRhaW5pbmcgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0T2Zmc2V0WSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5vZmZzZXRZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtb3VzZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGV2ZW50IHJlbGF0aXZlIHRvIHRoZSBjbGllbnQgd2luZG93IHZpZXdcbiAgICAgKi9cbiAgICBnZXRDbGllbnRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmNsaWVudFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1vdXNlIHkgY29vcmRpbmF0ZSBvZiB0aGUgZXZlbnQgcmVsYXRpdmUgdG8gdGhlIGNsaWVudCB3aW5kb3cgdmlld1xuICAgICAqL1xuICAgIGdldENsaWVudFkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQuY2xpZW50WTtcbiAgICB9XG5cbiAgICBnZXRUYXJnZXQoKXtcbiAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHRoaXMuZXZlbnQudGFyZ2V0KTtcbiAgICB9XG5cbiAgICBnZXRLZXlDb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5rZXlDb2RlO1xuICAgIH1cblxuICAgIGlzS2V5Q29kZShjb2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmtleUNvZGUgPT09IGNvZGU7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IE1hcCwgT2JqZWN0RnVuY3Rpb24sIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi9ldmVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRXZlbnRSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIEV2ZW50UmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmJlZm9yZUxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5hZnRlckxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb25uZWN0cyBlbGVtZW50cyB3aXRoIHRoZSBldmVudCByZWdpc3RyeSBzbyB0aGF0IGV2ZW50cyB0cmlnZ2VyZWQgb24gdGhlIGVsZW1lbnQgZ2V0cyBkaXN0cmlidXRlZCB0byBhbGwgbGlzdGVuZXJzXG4gICAgICogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudCB0aGUgZWxlbWVudCB3aGljaCBpcyB0aGUgc291cmNlIG9mIHRoZSBldmVudCBhbmQgd2hpY2ggY2FuIGJlIGF0dGFjaGVkIHRvXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSB0aGUgZXZlbnQgdHlwZSBhcyBpdCBpcyBkZWZpbmVkIGJ5IHRoZSBjb250YWluaW5nIHRyaWdnZXIgKGV4YW1wbGUgXCJvbmNsaWNrXCIpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSB0aGUgZXZlbnQgbmFtZSBhcyBpdCB3aWxsIGJlIHJlZmVycmVkIHRvIGluIHRoZSBFdmVudFJlZ2lzdHJ5IChleGFtcGxlIFwiLy9ldmVudDpjbGlja2VkXCIpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbXBvbmVudEluZGV4IHVuaXF1ZSBpZCBvZiB0aGUgY29tcG9uZW50IHdoaWNoIG93bnMgdGhlIGVsZW1lbnRcbiAgICAgKi9cbiAgICBhdHRhY2goZWxlbWVudCwgZXZlbnRUeXBlLCBldmVudE5hbWUsIGNvbXBvbmVudEluZGV4KSB7XG4gICAgICAgIGNvbnN0IHVuaXF1ZUV2ZW50TmFtZSA9IGV2ZW50TmFtZSArIFwiX1wiICsgY29tcG9uZW50SW5kZXg7XG4gICAgICAgIGNvbnN0IHRoZUV2ZW50UmVnaXN0cnkgPSB0aGlzO1xuICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHsgdGhlRXZlbnRSZWdpc3RyeS50cmlnZ2VyKHVuaXF1ZUV2ZW50TmFtZSwgZXZlbnROYW1lLCBldmVudCk7IH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgdGhlIGV2ZW50IG5hbWUgYXMgaXQgd2lsbCBiZSByZWZlcnJlZCB0byBpbiB0aGUgRXZlbnRSZWdpc3RyeSAoZXhhbXBsZSBcIi8vZXZlbnQ6Y2xpY2tlZFwiKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGxpc3RlbmVyIHRoZSBvYmplY3Qgd2hpY2ggb3ducyB0aGUgaGFuZGxlciBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1bmlxdWVJbmRleCBhIHVuaXF1ZSBpbmRleCBmb3IgdGhlIGV2ZW50XG4gICAgICovXG4gICAgbGlzdGVuKGV2ZW50TmFtZSwgbGlzdGVuZXIsIHVuaXF1ZUluZGV4KSB7XG4gICAgICAgIGNvbnN0IHVuaXF1ZUV2ZW50TmFtZSA9IGV2ZW50TmFtZSArIFwiX1wiICsgdW5pcXVlSW5kZXg7XG4gICAgICAgIHRoaXMuaW5pdE1hcCh0aGlzLmxpc3RlbmVycywgdW5pcXVlRXZlbnROYW1lKTtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIGNvbnN0IGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lcnMuZ2V0KHVuaXF1ZUV2ZW50TmFtZSk7XG4gICAgICAgIGxpc3RlbmVyTWFwLnNldChsaXN0ZW5lci5nZXRPYmplY3QoKS5jb25zdHJ1Y3Rvci5uYW1lLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSB0aGUgZXZlbnQgbmFtZSBhcyBpdCB3aWxsIGJlIHJlZmVycmVkIHRvIGluIHRoZSBFdmVudFJlZ2lzdHJ5IChleGFtcGxlIFwiLy9ldmVudDpjbGlja2VkXCIpXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gbGlzdGVuZXIgdGhlIG9iamVjdCB3aGljaCBvd25zIHRoZSBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICovXG4gICAgbGlzdGVuQmVmb3JlKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5pbml0TWFwKHRoaXMuYmVmb3JlTGlzdGVuZXJzLCBldmVudE5hbWUpO1xuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgY29uc3QgbGlzdGVuZXJNYXAgPSB0aGlzLmJlZm9yZUxpc3RlbmVycy5nZXQoZXZlbnROYW1lKTtcbiAgICAgICAgbGlzdGVuZXJNYXAuc2V0KGxpc3RlbmVyLmdldE9iamVjdCgpLmNvbnN0cnVjdG9yLm5hbWUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIHRoZSBldmVudCBuYW1lIGFzIGl0IHdpbGwgYmUgcmVmZXJyZWQgdG8gaW4gdGhlIEV2ZW50UmVnaXN0cnkgKGV4YW1wbGUgXCIvL2V2ZW50OmNsaWNrZWRcIilcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBsaXN0ZW5lciB0aGUgb2JqZWN0IHdoaWNoIG93bnMgdGhlIGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBsaXN0ZW5BZnRlcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuaW5pdE1hcCh0aGlzLmFmdGVyTGlzdGVuZXJzLCBldmVudE5hbWUpO1xuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgY29uc3QgbGlzdGVuZXJNYXAgPSB0aGlzLmFmdGVyTGlzdGVuZXJzLmdldChldmVudE5hbWUpO1xuICAgICAgICBsaXN0ZW5lck1hcC5zZXQobGlzdGVuZXIuZ2V0T2JqZWN0KCkuY29uc3RydWN0b3IubmFtZSwgbGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBtYXAgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBcbiAgICAgKi9cbiAgICBpbml0TWFwKG1hcCwga2V5KSB7XG4gICAgICAgIGlmICghbWFwLmV4aXN0cyhrZXkpKSB7XG4gICAgICAgICAgICBtYXAuc2V0KGtleSxuZXcgTWFwKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJpZ2dlcihzdWZmaXhlZEV2ZW50TmFtZSwgZXZlbnROYW1lLCBldmVudCkge1xuICAgICAgICB0aGlzLmhhbmRsZUJlZm9yZShldmVudE5hbWUsIGV2ZW50KTtcbiAgICAgICAgaWYgKHRoaXMubGlzdGVuZXJzLmV4aXN0cyhzdWZmaXhlZEV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChzdWZmaXhlZEV2ZW50TmFtZSkuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWUuY2FsbChuZXcgRXZlbnQoZXZlbnQpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGFuZGxlQWZ0ZXIoZXZlbnROYW1lLCBldmVudCk7XG4gICAgfVxuXG4gICAgaGFuZGxlQmVmb3JlKGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVHbG9iYWwodGhpcy5iZWZvcmVMaXN0ZW5lcnMsIGV2ZW50TmFtZSwgZXZlbnQpO1xuICAgIH1cblxuICAgIGhhbmRsZUFmdGVyKGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVHbG9iYWwodGhpcy5hZnRlckxpc3RlbmVycywgZXZlbnROYW1lLCBldmVudCk7XG4gICAgfVxuXG4gICAgaGFuZGxlR2xvYmFsKGxpc3RlbmVycywgZXZlbnROYW1lLCBldmVudCkge1xuICAgICAgICBpZihsaXN0ZW5lcnMuZXhpc3RzKGV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy5nZXQoZXZlbnROYW1lKS5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICB2YWx1ZS5jYWxsKG5ldyBFdmVudChldmVudCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBVbmlxdWVJZFJlZ2lzdHJ5IHtcclxuXHJcbiAgICBpZEF0dHJpYnV0ZVdpdGhTdWZmaXggKGlkKSB7XHJcbiAgICAgICAgaWYoaWROYW1lcy5jb250YWlucyhpZCkpIHtcclxuICAgICAgICAgICAgdmFyIG51bWJlciA9IGlkTmFtZXMuZ2V0KGlkKTtcclxuICAgICAgICAgICAgaWROYW1lcy5zZXQoaWQsbnVtYmVyKzEpO1xyXG4gICAgICAgICAgICByZXR1cm4gaWQgKyBcIi1cIiArIG51bWJlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWROYW1lcy5zZXQoaWQsMSk7XHJcbiAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxudmFyIGlkTmFtZXMgPSBuZXcgTWFwKCk7IiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnRcIjtcclxuXHJcbi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wb25lbnQge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY29tcG9uZW50SW5kZXggXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSByb290RWxlbWVudCBcclxuICAgICAqIEBwYXJhbSB7TWFwfSBlbGVtZW50TWFwIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcihjb21wb25lbnRJbmRleCwgcm9vdEVsZW1lbnQsIGVsZW1lbnRNYXApIHtcclxuICAgICAgICB0aGlzLmNvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kZXg7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwID0gZWxlbWVudE1hcDtcclxuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlKCkge1xyXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGdldChpZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgKGlkLCB2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLnNldCh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJDaGlsZHJlbihpZCl7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuY2xlYXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRDaGlsZCAoaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuc2V0Q2hpbGQodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZENoaWxkIChpZCwgdmFsdWUpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5hZGRDaGlsZCh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJlcGVuZENoaWxkIChpZCwgdmFsdWUpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5wcmVwZW5kQ2hpbGQodmFsdWUpO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBNYXAsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xyXG5pbXBvcnQgeyBFbGVtZW50TWFwcGVyIH0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlclwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcbmltcG9ydCB7IEV2ZW50UmVnaXN0cnkgfSBmcm9tIFwiLi4vZXZlbnQvZXZlbnRSZWdpc3RyeVwiO1xyXG5cclxuLyoqXHJcbiAqIENvbGxlY3RzIGluZm9ybWF0aW9uIHdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgYW5kIGZpbmRzIHRoZSByb290IGVsZW1lbnQsIGNyZWF0ZXMgbWFwIG9mIGVsZW1lbnRzIFxyXG4gKiBhbmQgcmVnaXN0ZXJzIGV2ZW50cyBpbiB0aGUgZXZlbnRSZWdpc3RyeVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEVsZW1lbnRSZWdpc3RyYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZXZlbnRSZWdpc3RyeSwgdW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50SW5kZXgpIHtcclxuICAgICAgICB0aGlzLmNvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kZXg7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xyXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IHVuaXF1ZUlkUmVnaXN0cnk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7RXZlbnRSZWdpc3RyeX0gKi9cclxuICAgICAgICB0aGlzLmV2ZW50UmVnaXN0cnkgPSBldmVudFJlZ2lzdHJ5O1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xyXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RWxlbWVudE1hcCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGlzdGVucyB0byBlbGVtZW50cyBiZWluZyBjcmVhdGVkLCBhbmQgdGFrZXMgaW5uIHRoZSBjcmVhdGVkIFhtbEVsZW1lbnQgYW5kIGl0cyBwYXJlbnQgWG1sRWxlbWVudFxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHhtbEVsZW1lbnQgXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRXcmFwcGVyIFxyXG4gICAgICovXHJcbiAgICBlbGVtZW50Q3JlYXRlZCAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcikge1xyXG4gICAgICAgIHZhciBlbGVtZW50ID0gRWxlbWVudE1hcHBlci5tYXAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcik7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkVG9FbGVtZW50SWRNYXAoZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy5yZWdpc3RlckVsZW1lbnRFdmVudHMoZWxlbWVudCk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMucm9vdEVsZW1lbnQgPT09IG51bGwgJiYgZWxlbWVudCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gZWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHJlZ2lzdGVyRWxlbWVudEV2ZW50cyhlbGVtZW50KXtcclxuICAgICAgICBpZihlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlRWxlbWVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZXZlbnRSZWdpc3RyeSA9IHRoaXMuZXZlbnRSZWdpc3RyeTtcclxuICAgICAgICB2YXIgY29tcG9uZW50SW5kZXggPSB0aGlzLmNvbXBvbmVudEluZGV4O1xyXG4gICAgICAgIGVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChhdHRyaWJ1dGVLZXksYXR0cmlidXRlLHBhcmVudCl7XHJcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZSAhPT0gbnVsbCAmJiBhdHRyaWJ1dGUgIT09IHVuZGVmaW5lZCAmJiBhdHRyaWJ1dGUudmFsdWUuc3RhcnRzV2l0aChcIi8vZXZlbnQ6XCIpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnROYW1lID0gYXR0cmlidXRlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50VHlwZSA9IGF0dHJpYnV0ZS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgZXZlbnRSZWdpc3RyeS5hdHRhY2goZWxlbWVudCxldmVudFR5cGUsZXZlbnROYW1lLGNvbXBvbmVudEluZGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgICAgICAgICBcclxuICAgICAgICB9LHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRvRWxlbWVudElkTWFwKGVsZW1lbnQpIHtcclxuICAgICAgICBpZihlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlRWxlbWVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaWQgPSBudWxsO1xyXG4gICAgICAgIGlmKGVsZW1lbnQuY29udGFpbnNBdHRyaWJ1dGUoXCJpZFwiKSkge1xyXG4gICAgICAgICAgICBpZCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiKTtcclxuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIsdGhpcy51bmlxdWVJZFJlZ2lzdHJ5LmlkQXR0cmlidXRlV2l0aFN1ZmZpeChpZCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoaWQgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50TWFwLnNldChpZCxlbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBDb250YWluZXJCcmlkZ2UgfSBmcm9tIFwiLi4vYnJpZGdlL2NvbnRhaW5lckJyaWRnZVwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2FudmFzUm9vdCB7XHJcblxyXG4gICAgc3RhdGljIHJlcGxhY2VDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xyXG4gICAgICAgIHZhciBib2R5RWxlbWVudCA9IENvbnRhaW5lckJyaWRnZS5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICAgICAgYm9keUVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIGJvZHlFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgc2V0Q29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICB2YXIgYm9keUVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBib2R5RWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFkZENoaWxkQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICB2YXIgYm9keUVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYWRkQ2hpbGRFbGVtZW50KGlkLCBlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIGJvZHlFbGVtZW50ID0gQ29udGFpbmVyQnJpZGdlLmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgICAgICBib2R5RWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVFbGVtZW50KGlkKSB7XHJcbiAgICAgICAgQ29udGFpbmVyQnJpZGdlLnJlbW92ZUVsZW1lbnQoaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFkZEhlYWRlckVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5hZGRIZWFkZXJFbGVtZW50KGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFxyXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYWRkQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5hZGRCb2R5RWxlbWVudChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHByZXBlbmRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcclxuICAgICAgICBDb250YWluZXJCcmlkZ2UucHJlcGVuZEhlYWRlckVsZW1lbnQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5wcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxufSIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0VsZW1lbnRNYXBwZXJ9IGZyb20gXCIuLi9lbGVtZW50L2VsZW1lbnRNYXBwZXIuanNcIjtcblxuZXhwb3J0IGNsYXNzIEhUTUx7XG5cbiAgICBzdGF0aWMgY3VzdG9tKGVsZW1lbnROYW1lKXtcbiAgICAgICAgdmFyIHhtbEVsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChlbGVtZW50TmFtZSk7XG4gICAgICAgIHJldHVybiBFbGVtZW50TWFwcGVyLm1hcCh4bWxFbGVtZW50KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYXBwbHlTdHlsZXMoZWxlbWVudCxjbGFzc1ZhbHVlLHN0eWxlVmFsdWUpe1xuICAgICAgICBpZihjbGFzc1ZhbHVlICE9PSBudWxsKXtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJjbGFzc1wiLGNsYXNzVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHN0eWxlVmFsdWUgIT09IG51bGwpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcInN0eWxlXCIsc3R5bGVWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYShuYW1lLGhyZWYsY2xhc3NWYWx1ZSxzdHlsZVZhbHVlKXtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIVE1MLmN1c3RvbShcImFcIik7XG4gICAgICAgIGVsZW1lbnQuYWRkQ2hpbGQobmFtZSk7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJocmVmXCIsaHJlZik7XG4gICAgICAgIEhUTUwuYXBwbHlTdHlsZXMoZWxlbWVudCxjbGFzc1ZhbHVlLHN0eWxlVmFsdWUpO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAsIExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDYW52YXNSb290IH0gZnJvbSBcIi4vY2FudmFzUm9vdFwiO1xyXG5pbXBvcnQgeyBIVE1MIH0gZnJvbSBcIi4uL2h0bWwvaHRtbFwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcbmltcG9ydCB7IFRleHRub2RlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L3RleHRub2RlRWxlbWVudFwiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNhbnZhc1N0eWxlc1wiKTtcclxuXHJcbmNvbnN0IHN0eWxlcyA9IG5ldyBNYXAoKTtcclxuY29uc3Qgc3R5bGVPd25lcnMgPSBuZXcgTWFwKCk7XHJcbmNvbnN0IGVuYWJsZWRTdHlsZXMgPSBuZXcgTGlzdCgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIENhbnZhc1N0eWxlcyB7XHJcblxyXG4gICAgc3RhdGljIHNldFN0eWxlKG5hbWUsIHNvdXJjZSkge1xyXG4gICAgICAgIGlmKHN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBzdHlsZXMuZ2V0KG5hbWUpLnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cclxuICAgICAgICAgICAgbGV0IHN0eWxlRWxlbWVudCA9IEhUTUwuY3VzdG9tKFwic3R5bGVcIik7XHJcbiAgICAgICAgICAgIHN0eWxlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIsbmFtZSk7XHJcbiAgICAgICAgICAgIHN0eWxlRWxlbWVudC5zZXRDaGlsZChuZXcgVGV4dG5vZGVFbGVtZW50KHNvdXJjZS5nZXRTdHlsZXNTb3VyY2UoKSkpO1xyXG4gICAgICAgICAgICBzdHlsZXMuc2V0KG5hbWUsIHN0eWxlRWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVTdHlsZShuYW1lKSB7XHJcbiAgICAgICAgaWYoZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLnJlbW92ZShuYW1lKTtcclxuICAgICAgICAgICAgQ2FudmFzUm9vdC5yZW1vdmVFbGVtZW50KG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgc3R5bGVzLnJlbW92ZShuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGRpc2FibGVTdHlsZShuYW1lLCBvd25lcklkID0gMCkge1xyXG4gICAgICAgIENhbnZhc1N0eWxlcy5yZW1vdmVTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xyXG4gICAgICAgIGlmKENhbnZhc1N0eWxlcy5oYXNTdHlsZU93bmVyKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIXN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJTdHlsZSBkb2VzIG5vdCBleGlzdDogXCIgKyBuYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMucmVtb3ZlKG5hbWUpO1xyXG4gICAgICAgICAgICBDYW52YXNSb290LnJlbW92ZUVsZW1lbnQobmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBlbmFibGVTdHlsZShuYW1lLCBvd25lcklkID0gMCkge1xyXG4gICAgICAgIENhbnZhc1N0eWxlcy5hZGRTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xyXG4gICAgICAgIGlmKCFzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgTE9HLmVycm9yKFwiU3R5bGUgZG9lcyBub3QgZXhpc3Q6IFwiICsgbmFtZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIWVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5hZGQobmFtZSk7XHJcbiAgICAgICAgICAgIENhbnZhc1Jvb3QuYWRkSGVhZGVyRWxlbWVudChzdHlsZXMuZ2V0KG5hbWUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFkZFN0eWxlT3duZXIobmFtZSwgb3duZXJJZCkge1xyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBzdHlsZU93bmVycy5zZXQobmFtZSwgbmV3IExpc3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5nZXQobmFtZSkuY29udGFpbnMob3duZXJJZCkpIHtcclxuICAgICAgICAgICAgc3R5bGVPd25lcnMuZ2V0KG5hbWUpLmFkZChvd25lcklkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZVN0eWxlT3duZXIobmFtZSwgb3duZXJJZCkge1xyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5yZW1vdmUob3duZXJJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGhhc1N0eWxlT3duZXIobmFtZSkge1xyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdHlsZU93bmVycy5nZXQobmFtZSkuc2l6ZSgpID4gMDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudFwiO1xyXG5pbXBvcnQgeyBVbmlxdWVJZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vdW5pcXVlSWRSZWdpc3RyeVwiO1xyXG5pbXBvcnQgeyBFbGVtZW50UmVnaXN0cmF0b3IgfSBmcm9tIFwiLi9lbGVtZW50UmVnaXN0cmF0b3JcIjtcclxuaW1wb3J0IHsgRXZlbnRSZWdpc3RyeSB9IGZyb20gXCIuLi9ldmVudC9ldmVudFJlZ2lzdHJ5XCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeVwiO1xyXG5pbXBvcnQgeyBEb21UcmVlIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xyXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5XCI7XHJcbmltcG9ydCB7IENhbnZhc1N0eWxlcyB9IGZyb20gXCIuLi9jYW52YXMvY2FudmFzU3R5bGVzXCI7XHJcbmltcG9ydCB7IEluamVjdGlvblBvaW50IH0gZnJvbSBcIm1pbmRpX3YxXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29tcG9uZW50RmFjdG9yeVwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtFdmVudFJlZ2lzdHJ5fSAqL1xyXG4gICAgICAgIHRoaXMuZXZlbnRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKEV2ZW50UmVnaXN0cnkpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0eWxlc1JlZ2lzdHJ5fSAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX0gKi9cclxuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShUZW1wbGF0ZVJlZ2lzdHJ5KTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtVbmlxdWVJZFJlZ2lzdHJ5fSAqL1xyXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFVuaXF1ZUlkUmVnaXN0cnkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSByZXByZXNlbnRzIHRoZSB0ZW1wbGF0ZSBhbmQgdGhlIHN0eWxlcyBuYW1lIGlmIHRoZSBzdHlsZSBmb3IgdGhhdCBuYW1lIGlzIGF2YWlsYWJsZVxyXG4gICAgICovXHJcbiAgICBjcmVhdGUobmFtZSl7XHJcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldChuYW1lKTtcclxuICAgICAgICBpZighdGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgTE9HLmVycm9yKHRoaXMudGVtcGxhdGVSZWdpc3RyeSk7XHJcbiAgICAgICAgICAgIHRocm93IFwiTm8gdGVtcGxhdGUgd2FzIGZvdW5kIHdpdGggbmFtZSBcIiArIG5hbWU7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZWxlbWVudFJlZ2lzdHJhdG9yID0gbmV3IEVsZW1lbnRSZWdpc3RyYXRvcih0aGlzLmV2ZW50UmVnaXN0cnksIHRoaXMudW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50Q291bnRlcisrKTtcclxuICAgICAgICBuZXcgRG9tVHJlZSh0ZW1wbGF0ZS5nZXRUZW1wbGF0ZVNvdXJjZSgpLGVsZW1lbnRSZWdpc3RyYXRvcikubG9hZCgpO1xyXG5cclxuICAgICAgICB0aGlzLm1vdW50U3R5bGVzKG5hbWUpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IENvbXBvbmVudChlbGVtZW50UmVnaXN0cmF0b3IuY29tcG9uZW50SW5kZXgsIGVsZW1lbnRSZWdpc3RyYXRvci5yb290RWxlbWVudCwgZWxlbWVudFJlZ2lzdHJhdG9yLmdldEVsZW1lbnRNYXAoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW91bnRTdHlsZXMobmFtZSkge1xyXG4gICAgICAgIGlmKHRoaXMuc3R5bGVzUmVnaXN0cnkuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgQ2FudmFzU3R5bGVzLnNldFN0eWxlKG5hbWUsIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0KG5hbWUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG52YXIgY29tcG9uZW50Q291bnRlciA9IDA7IiwiaW1wb3J0IHsgTG9nZ2VyLCBMaXN0IH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcclxuaW1wb3J0IHsgU2luZ2xldG9uQ29uZmlnLCBQcm90b3R5cGVDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIlxyXG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBFdmVudFJlZ2lzdHJ5IH0gZnJvbSBcIi4vZXZlbnQvZXZlbnRSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBVbmlxdWVJZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vY29tcG9uZW50L3VuaXF1ZUlkUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgQ29tcG9uZW50RmFjdG9yeSB9IGZyb20gXCIuL2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzXCI7XHJcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29uZmlnXCIpO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbmZpZyB7XHJcblxyXG4gICAgc3RhdGljIGdldEluc3RhbmNlKCkge1xyXG4gICAgICAgIHJldHVybiBqdXN0cmlnaHRDb25maWc7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy50eXBlQ29uZmlnTGlzdCA9IG5ldyBMaXN0KFtcclxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVGVtcGxhdGVSZWdpc3RyeSksXHJcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKFN0eWxlc1JlZ2lzdHJ5KSxcclxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVW5pcXVlSWRSZWdpc3RyeSksXHJcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKENvbXBvbmVudEZhY3RvcnkpLFxyXG4gICAgICAgICAgICBQcm90b3R5cGVDb25maWcudW5uYW1lZChFdmVudFJlZ2lzdHJ5KV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICBnZXRUeXBlQ29uZmlnTGlzdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlQ29uZmlnTGlzdDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNvbnN0IGp1c3RyaWdodENvbmZpZyA9IG5ldyBDb25maWcoKTsiLCJpbXBvcnQgeyBMaXN0LCBMb2dnZXIgfSBmcm9tICBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IE1pbmRpSW5qZWN0b3IsIE1pbmRpQ29uZmlnLCBJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyLCBDb25maWdBY2Nlc3NvciB9IGZyb20gXCJtaW5kaV92MVwiO1xyXG5pbXBvcnQgeyBDb21wb25lbnRDb25maWdQcm9jZXNzb3IgfSBmcm9tIFwiLi9jb21wb25lbnQvY29tcG9uZW50Q29uZmlnUHJvY2Vzc29yLmpzXCI7XHJcbmltcG9ydCB7IE1vZHVsZUxvYWRlciB9IGZyb20gXCIuL2xvYWRlci9tb2R1bGVMb2FkZXIuanNcIjtcclxuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnLmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQXBwbGljYXRpb25cIik7XHJcblxyXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb24ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge0xpc3R9ICovXHJcbiAgICAgICAgdGhpcy53b3JrZXJMaXN0ID0gbmV3IExpc3QoKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xyXG4gICAgICAgIHRoaXMubW9kdWxlTG9hZGVyTGlzdCA9IG5ldyBMaXN0KCk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7TWluZGlDb25maWd9ICovXHJcbiAgICAgICAgdGhpcy5jb25maWcgPSBuZXcgTWluZGlDb25maWcoKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xyXG4gICAgICAgIHRoaXMucnVubmluZ1dvcmtlcnMgPSBuZXcgTGlzdCgpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbmZpZ1xyXG4gICAgICAgICAgICAuYWRkQWxsVHlwZUNvbmZpZyhDb25maWcuZ2V0SW5zdGFuY2UoKS5nZXRUeXBlQ29uZmlnTGlzdCgpKVxyXG4gICAgICAgICAgICAuYWRkQWxsQ29uZmlnUHJvY2Vzc29yKG5ldyBMaXN0KFsgQ29tcG9uZW50Q29uZmlnUHJvY2Vzc29yIF0pKVxyXG4gICAgICAgICAgICAuYWRkQWxsSW5zdGFuY2VQcm9jZXNzb3IobmV3IExpc3QoWyBJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyIF0pKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRBbGxUeXBlQ29uZmlnKHR5cGVDb25maWdMaXN0KSB7XHJcbiAgICAgICAgdGhpcy5jb25maWcuYWRkQWxsVHlwZUNvbmZpZyh0eXBlQ29uZmlnTGlzdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcnVuKCkge1xyXG4gICAgICAgIHRoaXMuZ2V0TWF0Y2hpbmdNb2R1bGVMb2FkZXIoKS5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5zdGFydFdvcmtlcnMoKTtcclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlTWF0Y2hpbmdNb2R1bGUoKSB7XHJcbiAgICAgICAgdGhpcy5nZXRNYXRjaGluZ01vZHVsZUxvYWRlcigpLmRlZmF1bHRJbnN0YW5jZS5sb2FkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRXb3JrZXJzKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmdXb3JrZXJzLnNpemUoKSA+IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndvcmtlckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IHZhbHVlKCk7XHJcbiAgICAgICAgICAgIE1pbmRpSW5qZWN0b3IuaW5qZWN0KGluc3RhbmNlLCB0aGlzLmNvbmZpZyk7XHJcbiAgICAgICAgICAgIHRoaXMucnVubmluZ1dvcmtlcnMuYWRkKGluc3RhbmNlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7TW9kdWxlTG9hZGVyfVxyXG4gICAgICovXHJcbiAgICBnZXRNYXRjaGluZ01vZHVsZUxvYWRlcigpIHtcclxuICAgICAgICBsZXQgZm91bmRNb2R1bGVMb2FkZXIgPSBudWxsO1xyXG4gICAgICAgIHRoaXMubW9kdWxlTG9hZGVyTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlLm1hdGNoZXMoKSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRNb2R1bGVMb2FkZXIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICByZXR1cm4gZm91bmRNb2R1bGVMb2FkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byBkZXBlbmRlbmN5IGluamVjdGlvbiBjb25maWdcclxuICAgICAqL1xyXG4gICAgd2luZG93RGlDb25maWcoKSB7XHJcbiAgICAgICAgd2luZG93LmRpQ29uZmlnID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBMT0cuaW5mbyh0aGlzLmNvbmZpZy5jb25maWdFbnRyaWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byB0ZW1wbGF0ZSByZWdpc3RyeVxyXG4gICAgICovXHJcbiAgICB3aW5kb3dUZW1wbGF0ZVJlZ2lzdHJ5KCkge1xyXG4gICAgICAgIHdpbmRvdy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBMT0cuaW5mbyhDb25maWdBY2Nlc3Nvci5pbnN0YW5jZUhvbGRlcihUZW1wbGF0ZVJlZ2lzdHJ5Lm5hbWUsIHRoaXMuY29uZmlnKS5pbnN0YW5jZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlIGdsb2JhbCBhY2Nlc3MgdG8gc3R5bGUgcmVnaXN0cnlcclxuICAgICAqL1xyXG4gICAgd2luZG93U3R5bGVSZWdpc3RyeSgpIHtcclxuICAgICAgICB3aW5kb3cuc3R5bGVSZWdpc3RyeSA9ICgpID0+IHtcclxuICAgICAgICAgICAgTE9HLmluZm8oQ29uZmlnQWNjZXNzb3IuaW5zdGFuY2VIb2xkZXIoU3R5bGVzUmVnaXN0cnkubmFtZSwgdGhpcy5jb25maWcpLmluc3RhbmNlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgUHJvcGVydHlBY2Nlc3NvciwgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdElucHV0RWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Fic3RyYWN0SW5wdXRFbGVtZW50XCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJJbnB1dEVsZW1lbnREYXRhQmluZGluZ1wiKTtcblxuZXhwb3J0IGNsYXNzIElucHV0RWxlbWVudERhdGFCaW5kaW5nIHtcblxuICAgIGNvbnN0cnVjdG9yKG1vZGVsLCB2YWxpZGF0b3IpIHtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLnZhbGlkYXRvciA9IHZhbGlkYXRvcjtcbiAgICAgICAgdGhpcy5wdWxsZXJzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5wdXNoZXJzID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbGluayhtb2RlbCwgdmFsaWRhdG9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXRFbGVtZW50RGF0YUJpbmRpbmcobW9kZWwsIHZhbGlkYXRvcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdElucHV0RWxlbWVudH0gZmllbGQgXG4gICAgICovXG4gICAgYW5kKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvKGZpZWxkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmaWVsZCBcbiAgICAgKi9cbiAgICB0byhmaWVsZCkge1xuICAgICAgICBjb25zdCBwdWxsZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbW9kZWxWYWx1ZSA9IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgZmllbGQubmFtZSk7XG4gICAgICAgICAgICBpZiAobW9kZWxWYWx1ZSAhPT0gZmllbGQudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBQcm9wZXJ0eUFjY2Vzc29yLnNldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUsIGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnZhbGlkYXRvciAmJiB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZSl7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0b3IudmFsaWRhdGUoZmllbGQudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBmaWVsZC5hdHRhY2hFdmVudChcIm9uY2hhbmdlXCIsIHB1bGxlcik7XG4gICAgICAgIGZpZWxkLmF0dGFjaEV2ZW50KFwib25rZXl1cFwiLCBwdWxsZXIpO1xuICAgICAgICBwdWxsZXIuY2FsbCgpO1xuXG4gICAgICAgIGNvbnN0IHB1c2hlciA9ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBtb2RlbFZhbHVlID0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lKTtcbiAgICAgICAgICAgIGlmIChtb2RlbFZhbHVlICE9PSBmaWVsZC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGZpZWxkLnZhbHVlID0gbW9kZWxWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnZhbGlkYXRvciAmJiB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZVNpbGVudCAmJiBmaWVsZC52YWx1ZSl7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0b3IudmFsaWRhdGVTaWxlbnQoZmllbGQudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBjaGFuZ2VkRnVuY3Rpb25OYW1lID0gXCJfX2NoYW5nZWRfXCIgKyBmaWVsZC5uYW1lLnJlcGxhY2UoXCIuXCIsXCJfXCIpO1xuICAgICAgICBpZiAoIXRoaXMubW9kZWxbY2hhbmdlZEZ1bmN0aW9uTmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMubW9kZWxbY2hhbmdlZEZ1bmN0aW9uTmFtZV0gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnB1bGxlcnMuYWRkKHB1bGxlcik7XG4gICAgICAgIHRoaXMucHVzaGVycy5hZGQocHVzaGVyKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBwdWxsKCkge1xuICAgICAgICB0aGlzLnB1bGxlcnMuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbChwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIHB1c2goKSB7XG4gICAgICAgIHRoaXMucHVzaGVycy5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFByb3h5T2JqZWN0RmFjdG9yeSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGEgcHJveHkgZm9yIGFuIG9iamVjdCB3aGljaCBhbGxvd3MgZGF0YWJpbmRpbmcgZnJvbSB0aGUgb2JqZWN0IHRvIHRoZSBmb3JtIGVsZW1lbnRcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNyZWF0ZVByb3h5T2JqZWN0KG9iamVjdCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJveHkob2JqZWN0LCB7XHJcbiAgICAgICAgICAgIHNldDogKHRhcmdldCwgcHJvcCwgdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBzdWNjZXNzID0gKHRhcmdldFtwcm9wXSA9IHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uTmFtZSA9IFwiX19jaGFuZ2VkX1wiICsgcHJvcDtcclxuICAgICAgICAgICAgICAgIGxldCBjaGFuZ2VkRnVuY3Rpb24gPSB0YXJnZXRbY2hhbmdlZEZ1bmN0aW9uTmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZihjaGFuZ2VkRnVuY3Rpb24gJiYgdHlwZW9mIGNoYW5nZWRGdW5jdGlvbiA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJvdW5kQ2hhbmdlZEZ1bmN0aW9uID0gY2hhbmdlZEZ1bmN0aW9uLmJpbmQodGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICBib3VuZENoYW5nZWRGdW5jdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MgPT09IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgT2JqZWN0RnVuY3Rpb24gfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFdmVudEZpbHRlcmVkT2JqZWN0RnVuY3Rpb24gZXh0ZW5kcyBPYmplY3RGdW5jdGlvbiB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb250cnVjdG9yXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBvYmplY3RGdW5jdGlvbiBcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRoZUZpbHRlciBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iob2JqZWN0RnVuY3Rpb24sIGZpbHRlcil7XHJcbiAgICAgICAgdGhpcy5vYmplY3RGdW5jdGlvbiA9IG9iamVjdEZ1bmN0aW9uO1xyXG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xyXG4gICAgfVxyXG5cclxuICAgIGNhbGwocGFyYW1zKXtcclxuICAgICAgICBpZih0aGlzLmZpbHRlciAmJiB0aGlzLmZpbHRlci5jYWxsKHRoaXMscGFyYW1zKSkge1xyXG4gICAgICAgICAgICB0aGlzLm9iamVjdEZ1bmN0aW9uLmNhbGwocGFyYW1zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcclxuaW1wb3J0IHsgTWluZGlDb25maWcsIE1pbmRpSW5qZWN0b3IgfSBmcm9tIFwibWluZGlfdjFcIjtcclxuaW1wb3J0IHsgTW9kdWxlTG9hZGVyIH0gZnJvbSBcIi4vbW9kdWxlTG9hZGVyLmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRGlNb2R1bGVMb2FkZXJcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgRGlNb2R1bGVMb2FkZXIgZXh0ZW5kcyBNb2R1bGVMb2FkZXIge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge01pbmRpQ29uZmlnfSBjb25maWdcclxuICAgICAqIEBwYXJhbSB7UmVnRXhwfSBtYXRjaFBhdGggXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcm9vdFBhdGggXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbW9kdWxlUGF0aCBcclxuICAgICAqIEBwYXJhbSB7QXJyYXk8TG9hZGVyRmlsdGVyPn0gbG9hZGVyRmlsdGVycyBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBtYXRjaFBhdGgsIHJvb3RQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJGaWx0ZXJzID0gW10pIHtcclxuICAgICAgICBzdXBlcihtYXRjaFBhdGgsIHJvb3RQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJGaWx0ZXJzKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtNaW5kaUNvbmZpZ30gKi9cclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcclxuICAgIH1cclxuXHJcbiAgICBsb2FkKHJvb3RQYXRoKSB7XHJcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcztcclxuICAgICAgICBpZiAoIXBhcmVudC5maWx0ZXJzUGFzcygpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFwYXJlbnQuZGVmYXVsdEluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5pbXBvcnRNb2R1bGUoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5kZWZhdWx0SW5zdGFuY2UubG9hZChyb290UGF0aCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5kZWZhdWx0SW5zdGFuY2UubG9hZChyb290UGF0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge01vZHVsZUxvYWRlcn0gbW9kdWxlTG9hZGVyXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgaW1wb3J0TW9kdWxlKCkge1xyXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmltcG9ydE1vZHVsZSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcuYWRkQWxsVHlwZUNvbmZpZyhwYXJlbnQuZGVmYXVsdEluc3RhbmNlLnR5cGVDb25maWdMaXN0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmZpbmFsaXplKCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgTWluZGlJbmplY3Rvci5pbmplY3QocGFyZW50LmRlZmF1bHRJbnN0YW5jZSwgdGhpcy5jb25maWcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IENvbnRhaW5lckJyaWRnZSB9IGZyb20gXCIuLi9icmlkZ2UvY29udGFpbmVyQnJpZGdlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25TdG9yYWdlIHtcclxuICAgIFxyXG4gICAgc3RhdGljIHNldExvY2FsQXR0cmlidXRlKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBDb250YWluZXJCcmlkZ2Uuc2V0TG9jYWxBdHRyaWJ1dGUoa2V5LHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0TG9jYWxBdHRyaWJ1dGUoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5nZXRMb2NhbEF0dHJpYnV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBoYXNMb2NhbEF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLmhhc0xvY2FsQXR0cmlidXRlKGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZUxvY2FsQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UucmVtb3ZlTG9jYWxBdHRyaWJ1dGUoa2V5KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IENvbnRhaW5lckJyaWRnZSB9IGZyb20gXCIuLi9icmlkZ2UvY29udGFpbmVyQnJpZGdlLmpzXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBTZXNzaW9uU3RvcmFnZSB7XHJcblxyXG4gICAgc3RhdGljIHNldFNlc3Npb25BdHRyaWJ1dGUoa2V5LCB2YWx1ZSkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5zZXRTZXNzaW9uQXR0cmlidXRlKGtleSx2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGhhc1Nlc3Npb25BdHRyaWJ1dGUoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5oYXNTZXNzaW9uQXR0cmlidXRlKGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldFNlc3Npb25BdHRyaWJ1dGUoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5nZXRTZXNzaW9uQXR0cmlidXRlKGtleSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZVNlc3Npb25BdHRyaWJ1dGUoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5yZW1vdmVTZXNzaW9uQXR0cmlidXRlKGtleSk7XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgT2JqZWN0RnVuY3Rpb24gfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBIdHRwUmVzcG9uc2VIYW5kbGVyIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGNvZGUgXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBvYmplY3RGdW5jdGlvbiBcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1hcHBlckZ1bmN0aW9uIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcihjb2RlLCBvYmplY3RGdW5jdGlvbiwgbWFwcGVyRnVuY3Rpb24pIHtcclxuICAgICAgICB0aGlzLmNvZGUgPSBjb2RlO1xyXG4gICAgICAgIHRoaXMub2JqZWN0RnVuY3Rpb24gPSBvYmplY3RGdW5jdGlvbjtcclxuICAgICAgICB0aGlzLm1hcHBlckZ1bmN0aW9uID0gbWFwcGVyRnVuY3Rpb247XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgTWFwLCBPYmplY3RGdW5jdGlvbiwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IEh0dHBSZXNwb25zZUhhbmRsZXIgfSBmcm9tIFwiLi9odHRwUmVzcG9uc2VIYW5kbGVyXCI7XHJcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuLi9jbGllbnQvY2xpZW50LmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSHR0cENhbGxCdWlsZGVyXCIpO1xyXG5cclxuZXhwb3J0IGNsYXNzIEh0dHBDYWxsQnVpbGRlciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1ldGVyIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcih1cmwsIHBhcmFtdGVyKSB7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge09iamVjdH0gKi9cclxuICAgICAgICB0aGlzLnBhcmFtdGVyID0gcGFyYW10ZXI7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xyXG4gICAgICAgIHRoaXMuaHR0cENhbGxiYWNrTWFwID0gbmV3IE1hcCgpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xyXG4gICAgICAgIHRoaXMuZXJyb3JDYWxsYmFjayA9IG51bGw7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSA9IDQwMDA7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7bnVtYmVyfSAqL1xyXG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUgPSA0MDAwO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge2Z1bmN0aW9ufSAqL1xyXG4gICAgICAgIHRoaXMuZXJyb3JNYXBwZXJGdW5jdGlvbiA9IG51bGw7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xyXG4gICAgICAgIHRoaXMuYXV0aG9yaXphdGlvbiA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7Q2xpZW50fSBjbGllbnQgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtZXRlciBcclxuICAgICAqIEByZXR1cm5zIHtIdHRwQ2FsbEJ1aWxkZXJ9XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBuZXdJbnN0YW5jZShjbGllbnQsIHVybCwgcGFyYW1ldGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwQ2FsbEJ1aWxkZXIoY2xpZW50LCB1cmwsIHBhcmFtZXRlcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlIFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCBcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cclxuICAgICAqL1xyXG4gICAgcmVzcG9uc2VNYXBwaW5nKGNvZGUsIG9iamVjdCwgY2FsbGJhY2ssIG1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5odHRwQ2FsbGJhY2tNYXAuc2V0KGNvZGUsIG5ldyBIdHRwUmVzcG9uc2VIYW5kbGVyKGNvZGUsIG5ldyBPYmplY3RGdW5jdGlvbihvYmplY3QsIGNhbGxiYWNrKSwgbWFwcGVyRnVuY3Rpb24pKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCBcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZXJyb3JNYXBwZXJGdW5jdGlvbiBtYXBwZXIgZnVuY3Rpb24gdG8gcGFzcyB0aGUgcmVzdWx0IG9iamVjdCB0b1xyXG4gICAgICovXHJcbiAgICBlcnJvck1hcHBpbmcob2JqZWN0LCBjYWxsYmFjaywgZXJyb3JNYXBwZXJGdW5jdGlvbiA9IG51bGwpIHtcclxuICAgICAgICBpZihvYmplY3QgJiYgY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYgKGVycm9yTWFwcGVyRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZXJyb3JNYXBwZXJGdW5jdGlvbiA9IGVycm9yTWFwcGVyRnVuY3Rpb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lcnJvckNhbGxiYWNrID0gbmV3IE9iamVjdEZ1bmN0aW9uKG9iamVjdCwgY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGF1dGhvcml6YXRpb24gXHJcbiAgICAgKi9cclxuICAgIGF1dGhvcml6YXRpb25IZWFkZXIoYXV0aG9yaXphdGlvbikge1xyXG4gICAgICAgIHRoaXMuYXV0aG9yaXphdGlvbiA9IFwiQmVhcmVyIFwiICsgYXV0aG9yaXphdGlvbjtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBjb25uZWN0aW9uVGltZW91dChjb25uZWN0aW9uVGltZW91dFZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlID0gY29ubmVjdGlvblRpbWVvdXRWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXNwb25zZVRpbWVvdXQocmVzcG9uc2VUaW1lb3V0VmFsdWUpIHtcclxuICAgICAgICB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlID0gcmVzcG9uc2VUaW1lb3V0VmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0KCkge1xyXG4gICAgICAgIENsaWVudC5nZXQodGhpcy51cmwsIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSwgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSkudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xyXG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NFcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcG9zdCgpIHtcclxuICAgICAgICBDbGllbnQucG9zdCh0aGlzLnVybCwgdGhpcy5wYXJhbXRlciwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHB1dCgpIHtcclxuICAgICAgICBDbGllbnQucHV0KHRoaXMudXJsLCB0aGlzLnBhcmFtdGVyLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbikudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xyXG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NFcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcGF0Y2goKSB7XHJcbiAgICAgICAgQ2xpZW50LnBhdGNoKHRoaXMudXJsLCB0aGlzLnBhcmFtdGVyLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbikudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xyXG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NFcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZGVsZXRlKCkge1xyXG4gICAgICAgIENsaWVudC5kZWxldGUodGhpcy51cmwsIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSwgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSkudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xyXG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NFcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc0Vycm9yKGVycm9yKSB7XHJcbiAgICAgICAgTE9HLmVycm9yKGVycm9yKTtcclxuICAgICAgICBpZih0aGlzLmVycm9yQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYodGhpcy5lcnJvck1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBlcnJvciA9IHRoaXMuZXJyb3JNYXBwZXJGdW5jdGlvbi5jYWxsKHRoaXMsIGVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVycm9yQ2FsbGJhY2suY2FsbChlcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1Jlc3BvbnNlfSByZXNwb25zZSBcclxuICAgICAqL1xyXG4gICAgcHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgLyoqIEB0eXBlIHtIdHRwUmVzcG9uc2VIYW5kbGVyfSAqL1xyXG4gICAgICAgIHZhciByZXNwb25zZUhhbmRsZXIgPSB0aGlzLmh0dHBDYWxsYmFja01hcC5nZXQocmVzcG9uc2Uuc3RhdHVzKTtcclxuICAgICAgICBpZihyZXNwb25zZUhhbmRsZXIpIHtcclxuICAgICAgICAgICAgaWYocmVzcG9uc2VIYW5kbGVyLm1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZS5qc29uKCkudGhlbihcclxuICAgICAgICAgICAgICAgICAgICAob2JqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXBwZXJGdW5jdGlvbiA9IHJlc3BvbnNlSGFuZGxlci5tYXBwZXJGdW5jdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobWFwcGVyRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlSGFuZGxlci5vYmplY3RGdW5jdGlvbi5jYWxsKG1hcHBlckZ1bmN0aW9uKG9iamVjdCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VIYW5kbGVyLm9iamVjdEZ1bmN0aW9uLmNhbGwob2JqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgKGZhaWxSZWFzb24pID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlSGFuZGxlci5vYmplY3RGdW5jdGlvbi5jYWxsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBMaXN0LCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJBYnN0cmFjdFZhbGlkYXRvclwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzQ3VycmVudGx5VmFsaWRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgZW5hYmxlZCA9IHRydWUpIHtcclxuICAgICAgICB0aGlzLnZhbGlkTGlzdGVuZXJMaXN0ID0gbmV3IExpc3QoKTtcclxuICAgICAgICB0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QgPSBuZXcgTGlzdCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBjdXJyZW50bHlWYWxpZDtcclxuICAgICAgICB0aGlzLmVuYWJsZWQgPSBlbmFibGVkO1xyXG4gICAgfVxyXG5cclxuICAgIGVuYWJsZSgpIHtcclxuICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbGlkKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5pbnZhbGlkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRpc2FibGUoKSB7XHJcbiAgICAgICAgbGV0IHdhc1ZhbGlkID0gdGhpcy5jdXJyZW50bHlWYWxpZDtcclxuICAgICAgICAvLyBGYWtlIHZhbGlkXHJcbiAgICAgICAgdGhpcy52YWxpZCgpO1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB3YXNWYWxpZDtcclxuICAgIH1cclxuXHJcbiAgICBpc1ZhbGlkKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50bHlWYWxpZDtcclxuICAgIH1cclxuXHJcblx0dmFsaWQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gdHJ1ZTtcclxuICAgICAgICBpZighdGhpcy52YWxpZExpc3RlbmVyTGlzdCkge1xyXG4gICAgICAgICAgICBMT0cud2FybihcIk5vIHZhbGlkYXRpb24gbGlzdGVuZXJzXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudmFsaWRMaXN0ZW5lckxpc3QuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICB2YWx1ZS5jYWxsKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cdH1cclxuXHJcblx0aW52YWxpZCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBmYWxzZTtcclxuICAgICAgICBpZighdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0KSB7XHJcbiAgICAgICAgICAgIExPRy53YXJuKFwiTm8gaW52YWxpZGF0aW9uIGxpc3RlbmVyc1wiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICB2YWx1ZS5jYWxsKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cdH1cclxuXHJcblx0dmFsaWRTaWxlbnQoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHRydWU7XHJcblx0fVxyXG5cclxuXHRpbnZhbGlkU2lsZW50KCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBmYWxzZTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFxyXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IHZhbGlkTGlzdGVuZXIgXHJcblx0ICovXHJcblx0d2l0aFZhbGlkTGlzdGVuZXIodmFsaWRMaXN0ZW5lcikge1xyXG5cdFx0dGhpcy52YWxpZExpc3RlbmVyTGlzdC5hZGQodmFsaWRMaXN0ZW5lcik7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFxyXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGludmFsaWRMaXN0ZW5lciBcclxuXHQgKi9cclxuXHR3aXRoSW52YWxpZExpc3RlbmVyKGludmFsaWRMaXN0ZW5lcikge1xyXG5cdFx0dGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0LmFkZChpbnZhbGlkTGlzdGVuZXIpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBMaXN0LCBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3RWYWxpZGF0b3IuanMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFuZFZhbGlkYXRvclNldCBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihpc1ZhbGlkRnJvbVN0YXJ0ID0gZmFsc2UpIHtcclxuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QgPSBuZXcgTGlzdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdFZhbGlkYXRvcn0gdmFsaWRhdG9yXHJcbiAgICAgKi9cclxuICAgIHdpdGhWYWxpZGF0b3IodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgdmFsaWRhdG9yLndpdGhWYWxpZExpc3RlbmVyKG5ldyBPYmplY3RGdW5jdGlvbih0aGlzLCB0aGlzLm9uZVZhbGlkKSk7XHJcbiAgICAgICAgdmFsaWRhdG9yLndpdGhJbnZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lSW52YWxpZCkpO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgdmFsaWRcclxuICAgICAqL1xyXG4gICAgb25lVmFsaWQoKSB7XHJcbiAgICAgICAgbGV0IGZvdW5kSW52YWxpZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYoIXZhbHVlLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRJbnZhbGlkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICBpZighZm91bmRJbnZhbGlkKSB7XHJcbiAgICAgICAgICAgIHN1cGVyLnZhbGlkKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3VwZXIuaW52YWxpZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxyXG4gICAgICovXHJcbiAgICBvbmVJbnZhbGlkKCkge1xyXG4gICAgICAgIHN1cGVyLmludmFsaWQoKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZWdleFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCByZWdleCA9IFwiKC4qKVwiKSB7XHJcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcclxuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xyXG4gICAgICAgIHRoaXMucmVnZXggPSByZWdleDtcclxuICAgIH1cclxuXHJcblx0dmFsaWRhdGUodmFsdWUpe1xyXG5cdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS5tYXRjaCh0aGlzLnJlZ2V4KSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYoIXZhbHVlICYmICF0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHRcdHRoaXMudmFsaWQoKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS5tYXRjaCh0aGlzLnJlZ2V4KSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYoIXZhbHVlICYmICF0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHRcdHRoaXMudmFsaWRTaWxlbnQoKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xyXG5cclxuY29uc3QgRU1BSUxfRk9STUFUID0gL15cXHcrKFtcXC4tXT9cXHcrKSpAXFx3KyhbXFwuLV0/XFx3KykqKFxcLlxcd3syLDN9KSskLztcclxuXHJcbmV4cG9ydCBjbGFzcyBFbWFpbFZhbGlkYXRvciBleHRlbmRzIFJlZ2V4VmFsaWRhdG9yIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XHJcbiAgICAgICAgc3VwZXIobWFuZGF0b3J5LCBpc2N1cnJlbnRseVZhbGlkLCBFTUFJTF9GT1JNQVQpO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XHJcbmltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRXF1YWxzRnVuY3Rpb25SZXN1bHRWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIFxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gbWFuZGF0b3J5IFxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcclxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXHJcblx0ICovXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBjb21wYXJlZFZhbHVlRnVuY3Rpb24gPSBudWxsKSB7XHJcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcclxuXHJcblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXHJcblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcclxuXHJcblx0XHQvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xyXG5cdFx0dGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24gPSBjb21wYXJlZFZhbHVlRnVuY3Rpb247XHJcblx0fVxyXG5cclxuXHR2YWxpZGF0ZSh2YWx1ZSl7XHJcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSB0aGlzLmNvbXBhcmVkVmFsdWVGdW5jdGlvbi5jYWxsKCkpe1xyXG5cdCAgICBcdHRoaXMudmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gdGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24uY2FsbCgpKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xyXG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiwgUHJvcGVydHlBY2Nlc3NvciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEVxdWFsc1Byb3BlcnR5VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG5cclxuXHQvKipcclxuXHQgKiBcclxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcclxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGlzY3VycmVudGx5VmFsaWQgXHJcblx0ICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxyXG5cdCAqL1xyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgbW9kZWwgPSBudWxsLCBhdHRyaWJ1dGVOYW1lID0gbnVsbCkge1xyXG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XHJcblxyXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xyXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XHJcblxyXG5cdFx0LyoqIEB0eXBlIHtvYmplY3R9ICovXHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZU5hbWU7XHJcblx0fVxyXG5cclxuXHR2YWxpZGF0ZSh2YWx1ZSl7XHJcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIHRoaXMuYXR0cmlidXRlTmFtZSkpe1xyXG5cdCAgICBcdHRoaXMudmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCB0aGlzLmF0dHJpYnV0ZU5hbWUpKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xyXG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiwgUHJvcGVydHlBY2Nlc3NvciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEVxdWFsc1N0cmluZ1ZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcblx0LyoqXHJcblx0ICogXHJcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXHJcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxyXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGNvbXBhcmVkVmFsdWVGdW5jdGlvbiBcclxuXHQgKi9cclxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIGNvbnRyb2xWYWx1ZSA9IG51bGwpIHtcclxuXHRcdHN1cGVyKGlzY3VycmVudGx5VmFsaWQpO1xyXG5cclxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cclxuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IGNvbnRyb2xWYWx1ZTtcclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlKHZhbHVlKXtcclxuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XHJcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IGNvbnRyb2xWYWx1ZSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XHJcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xyXG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0iLCJpbXBvcnQgeyBMaXN0LCBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3RWYWxpZGF0b3IuanMnXHJcblxyXG5leHBvcnQgY2xhc3MgT3JWYWxpZGF0b3JTZXQgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcbiAgICBcclxuICAgIGNvbnN0cnVjdG9yKGlzVmFsaWRGcm9tU3RhcnQgPSBmYWxzZSkge1xyXG4gICAgICAgIHN1cGVyKGlzVmFsaWRGcm9tU3RhcnQpO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdCA9IG5ldyBMaXN0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0VmFsaWRhdG9yfSB2YWxpZGF0b3JcclxuICAgICAqL1xyXG4gICAgd2l0aFZhbGlkYXRvcih2YWxpZGF0b3IpIHtcclxuICAgICAgICB2YWxpZGF0b3Iud2l0aFZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lVmFsaWQpKTtcclxuICAgICAgICB2YWxpZGF0b3Iud2l0aEludmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0LmFkZCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxyXG4gICAgICovXHJcbiAgICBvbmVWYWxpZCgpIHtcclxuICAgICAgICBzdXBlci52YWxpZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyBpbnZhbGlkXHJcbiAgICAgKi9cclxuICAgIG9uZUludmFsaWQoKSB7XHJcbiAgICAgICAgbGV0IGZvdW5kVmFsaWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKHZhbHVlLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgaWYoZm91bmRWYWxpZCkge1xyXG4gICAgICAgICAgICBzdXBlci52YWxpZCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xyXG5cclxuY29uc3QgUEFTU1dPUkRfRk9STUFUID0gL14oPz0uKltBLVphLXpdKSg/PS4qP1swLTldKSg/PS4qP1sjPyFAJCVeJiotXSkuezgsfSQvO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBhc3N3b3JkVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UpIHtcclxuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIFBBU1NXT1JEX0ZPUk1BVCk7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcclxuXHJcbmNvbnN0IFBIT05FX0ZPUk1BVCA9IC9eXFwrWzAtOV17Mn1cXHM/KFswLTldXFxzPykqJC87XHJcblxyXG5leHBvcnQgY2xhc3MgUGhvbmVWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xyXG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgUEhPTkVfRk9STUFUKTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlcXVpcmVkVmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG5cclxuXHRjb25zdHJ1Y3RvcihjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBlbmFibGVkID0gdHJ1ZSkge1xyXG5cdFx0c3VwZXIoY3VycmVudGx5VmFsaWQsIGVuYWJsZWQpO1xyXG5cdH1cclxuXHJcblx0dmFsaWRhdGUodmFsdWUpe1xyXG5cdFx0aWYodmFsdWUgPT09IFwiXCIpe1xyXG5cdCAgICBcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy52YWxpZCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYodmFsdWUgPT09IFwiXCIpe1xyXG5cdCAgICBcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy52YWxpZFNpbGVudCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn1cclxuIl0sIm5hbWVzIjpbIkxvZ2dlciIsIkxpc3QiLCJNYXAiLCJMT0ciLCJJbmplY3Rpb25Qb2ludCIsIlhtbEVsZW1lbnQiLCJYbWxDZGF0YSIsIkRvbVRyZWUiLCJTaW5nbGV0b25Db25maWciLCJQcm90b3R5cGVDb25maWciLCJNaW5kaUNvbmZpZyIsIkluc3RhbmNlUG9zdENvbmZpZ1RyaWdnZXIiLCJNaW5kaUluamVjdG9yIiwiQ29uZmlnQWNjZXNzb3IiLCJQcm9wZXJ0eUFjY2Vzc29yIiwiT2JqZWN0RnVuY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU0sR0FBRyxHQUFHLElBQUlB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RixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSztZQUM1RixJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2xDLEVBQUUsQ0FBQyxLQUFLLEtBQUs7WUFDVixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVCLENBQUMsQ0FBQztLQUNOOztJQUVELElBQUksR0FBRztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSztZQUNoSSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2xDLEVBQUUsQ0FBQyxLQUFLLEtBQUs7WUFDVixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVCLENBQUMsQ0FBQztLQUNOOztJQUVELEdBQUcsR0FBRztRQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSztZQUMvSCxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2xDLEVBQUUsQ0FBQyxLQUFLLEtBQUs7WUFDVixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVCLENBQUMsQ0FBQztLQUNOOztJQUVELEtBQUssR0FBRztRQUNKLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFD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

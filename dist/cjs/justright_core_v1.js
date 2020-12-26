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
var containerbridge_v1 = require('containerbridge_v1');
var xmlparser_v1 = require('xmlparser_v1');

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
        return containerbridge_v1.ContainerFunctions.fetch(url.toString(),params, connectionTimeout, responseTimeout);
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
        return containerbridge_v1.ContainerFunctions.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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
        return containerbridge_v1.ContainerFunctions.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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
        return containerbridge_v1.ContainerFunctions.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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
        return containerbridge_v1.ContainerFunctions.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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

const LOG = new coreutil_v1.Logger("StylesRegistry");

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
        LOG.info("Loading styles " + name + " at " + url.toString());

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

const LOG$1 = new coreutil_v1.Logger("TemplateRegistry");

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
        LOG$1.info("Loading template " + name + " at " + url.toString());
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

const LOG$2 = new coreutil_v1.Logger("TemplatePostConfig");

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

const LOG$3 = new coreutil_v1.Logger("StylesLoader");

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

const LOG$4 = new coreutil_v1.Logger("ComponentConfigProcessor");

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
        containerbridge_v1.ContainerFunctions.replaceUrl(url.toString(), title, stateObject);
    }

    static pushUrl(url, title, stateObject) {
        containerbridge_v1.ContainerFunctions.pushUrl(url.toString(), title, stateObject);
    }

    static getUrl() {
        return new Url(containerbridge_v1.ContainerFunctions.currentUrl());
    }

    static loadUrl(url) {
        containerbridge_v1.ContainerFunctions.loadUrl(url.toString());
    }
}

const LOG$5 = new coreutil_v1.Logger("LoaderFilter");

class LoaderFilter {

    /**
     * @returns {Boolean}
     */
    process() {
        LOG$5.info("Inumplemented Loader Filter breaks by default");
        return false;
    }

}

const LOG$6 = new coreutil_v1.Logger("ModuleLoader");

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

const LOG$7 = new coreutil_v1.Logger("BaseElement");

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
            this.element = containerbridge_v1.ContainerFunctions.createElement(value);
            return;
        }
        if(value instanceof HTMLElement){
            this.element = value;
            return;
        }
        LOG$7.error("Unrecognized value for Element");
        LOG$7.error(value);
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
            element = containerbridge_v1.ContainerFunctions.createElementNS(xmlElement.namespaceUri,xmlElement.fullName);
        }else{
            element = containerbridge_v1.ContainerFunctions.createElement(xmlElement.name);
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
            LOG$7.warn("Event '" + eventType + "' allready attached for " + this.element.name);
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
            this.element.parentNode.replaceChild(containerbridge_v1.ContainerFunctions.createTextNode(input), this.element);
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
            this.element.appendChild(containerbridge_v1.ContainerFunctions.createTextNode(input));
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
            this.element.insertBefore(containerbridge_v1.ContainerFunctions.createTextNode(input),this.element.firstChild);
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

const LOG$8 = new coreutil_v1.Logger("AbstractInputElement");

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
            this.element = containerbridge_v1.ContainerFunctions.createTextNode(value);
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

const LOG$9 = new coreutil_v1.Logger("EventRegistry");

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
        var bodyElement = containerbridge_v1.ContainerFunctions.getElementById(id);
        bodyElement.parentNode.replaceChild(component.rootElement.mappedElement, bodyElement);
    }

    static setComponent(id, component) {
        var bodyElement = containerbridge_v1.ContainerFunctions.getElementById(id);
        bodyElement.innerHTML = '';
        bodyElement.appendChild(component.rootElement.mappedElement, bodyElement);
    }

    static addChildComponent(id, component) {
        var bodyElement = containerbridge_v1.ContainerFunctions.getElementById(id);
        bodyElement.appendChild(component.rootElement.mappedElement);
    }

    static addChildElement(id, element) {
        var bodyElement = containerbridge_v1.ContainerFunctions.getElementById(id);
        bodyElement.appendChild(element.mappedElement);
    }

    static removeElement(id) {
        containerbridge_v1.ContainerFunctions.removeElement(id);
    }

    /** 
     * @param {BaseElement} element
     */
    static addHeaderElement(element) {
        containerbridge_v1.ContainerFunctions.addHeaderElement(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static addBodyElement(element) {
        containerbridge_v1.ContainerFunctions.addBodyElement(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependHeaderElement(element) {
        containerbridge_v1.ContainerFunctions.prependHeaderElement(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependBodyElement(element) {
        containerbridge_v1.ContainerFunctions.prependBodyElement(element.mappedElement);
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

const LOG$a = new coreutil_v1.Logger("CanvasStyles");

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
            LOG$a.error("Style does not exist: " + name);
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
            LOG$a.error("Style does not exist: " + name);
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

const LOG$b = new coreutil_v1.Logger("ComponentFactory");

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
            LOG$b.error(this.templateRegistry);
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

const LOG$c = new coreutil_v1.Logger("Config");

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

const LOG$d = new coreutil_v1.Logger("Application");

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
            LOG$d.info(this.config.configEntries);
        };
    }

    /**
     * Enable global access to template registry
     */
    windowTemplateRegistry() {
        window.templateRegistry = () => {
            LOG$d.info(mindi_v1.ConfigAccessor.instanceHolder(TemplateRegistry.name, this.config).instance);
        };
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            LOG$d.info(mindi_v1.ConfigAccessor.instanceHolder(StylesRegistry.name, this.config).instance);
        };
    }

}

const LOG$e = new coreutil_v1.Logger("InputElementDataBinding");

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

/**
 * Object Function which is called if the filter function returns true
 */
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

const LOG$f = new coreutil_v1.Logger("DiModuleLoader");

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

const LOG$g = new coreutil_v1.Logger("HttpCallBuilder");

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
        LOG$g.error(error);
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

const LOG$h = new coreutil_v1.Logger("AbstractValidator");

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
            LOG$h.warn("No validation listeners");
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
            LOG$h.warn("No invalidation listeners");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2xpZW50L2NsaWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC91cmwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdGVtcGxhdGUvdGVtcGxhdGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3R5bGVzL3N0eWxlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudENvbmZpZ1Byb2Nlc3Nvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi9oaXN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbG9hZGVyRmlsdGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbW9kdWxlTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2F0dHJpYnV0ZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9iYXNlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9yYWRpb0lucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9jaGVja2JveElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRhcmVhSW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRub2RlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9zaW1wbGVFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2Zvcm1FbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3ZpZGVvRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZXZlbnQvZXZlbnRSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L3VuaXF1ZUlkUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9lbGVtZW50UmVnaXN0cmF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNSb290LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9odG1sL2h0bWwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNTdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb25maWcuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2FwcGxpY2F0aW9uLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9kYXRhQmluZC9pbnB1dEVsZW1lbnREYXRhQmluZGluZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZGF0YUJpbmQvcHJveHlPYmplY3RGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudEZpbHRlcmVkT2JqZWN0RnVuY3Rpb24uanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2xvYWRlci9kaU1vZHVsZUxvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9odHRwUmVzcG9uc2VIYW5kbGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL2h0dHBDYWxsQnVpbGRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2Fic3RyYWN0VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvYW5kVmFsaWRhdG9yU2V0LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcmVnZXhWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lbWFpbFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VxdWFsc0Z1bmN0aW9uUmVzdWx0VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzUHJvcGVydHlWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNTdHJpbmdWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9vclZhbGlkYXRvclNldC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bhc3N3b3JkVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcGhvbmVsVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcmVxdWlyZWRWYWxpZGF0b3IuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29udGFpbmVyRnVuY3Rpb25zIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENsaWVudCB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXQodXJsLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDApe1xyXG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxyXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyRnVuY3Rpb25zLmZldGNoKHVybC50b1N0cmluZygpLHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcG9zdCh1cmwsIGRhdGEsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCwgYXV0aG9yaXphdGlvbiA9IG51bGwpe1xyXG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcclxuICAgICAgICB2YXIgcGFyYW1zID0gIHtcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cclxuICAgICAgICAgICAgcmVkaXJlY3Q6IFwiZm9sbG93XCIsIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckZ1bmN0aW9ucy5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwdXQodXJsLCBkYXRhLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDAsIGF1dGhvcml6YXRpb24gPSBudWxsKXtcclxuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XHJcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxyXG4gICAgICAgICAgICBtZXRob2Q6ICdQVVQnLCBcclxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cclxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXHJcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckZ1bmN0aW9ucy5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwYXRjaCh1cmwsIGRhdGEsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCwgYXV0aG9yaXphdGlvbiA9IG51bGwpe1xyXG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcclxuICAgICAgICB2YXIgcGFyYW1zID0gIHtcclxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXHJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BBVENIJywgXHJcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXHJcbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JywgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBDb250YWluZXJGdW5jdGlvbnMuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIGRlbGV0ZSh1cmwsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCl7XHJcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXHJcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXHJcbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBDb250YWluZXJGdW5jdGlvbnMuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldEhlYWRlcihhdXRob3JpemF0aW9uID0gbnVsbCkge1xyXG4gICAgICAgIGxldCBoZWFkZXJzID0ge1xyXG4gICAgICAgICAgICBcInVzZXItYWdlbnRcIjogXCJNb3ppbGxhLzQuMCBNRE4gRXhhbXBsZVwiLFxyXG4gICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKGF1dGhvcml6YXRpb24pIHtcclxuICAgICAgICAgICAgaGVhZGVycyA9IHtcclxuICAgICAgICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBcIk1vemlsbGEvNC4wIE1ETiBFeGFtcGxlXCIsXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcclxuICAgICAgICAgICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBhdXRob3JpemF0aW9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGhlYWRlcnM7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQge0xpc3QsTWFwfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIFVybHtcblxuICAgIGNvbnN0cnVjdG9yKHZhbHVlKXtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaG9zdCA9IG51bGw7XG4gICAgICAgIHRoaXMucG9ydCA9IG51bGw7XG4gICAgICAgIHRoaXMucGF0aExpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5ib29rbWFyayA9IG51bGw7XG4gICAgICAgIGlmKHZhbHVlID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVtYWluaW5nID0gdGhpcy5kZXRlcm1pbmVQcm90b2NvbCh2YWx1ZSk7XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5wcm90b2NvbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZUhvc3QocmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuaG9zdCAhPT0gbnVsbCl7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZVBvcnQocmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUGF0aChyZW1haW5pbmcpO1xuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUGFyYW1ldGVycyhyZW1haW5pbmcpO1xuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGV0ZXJtaW5lQm9va21hcmsocmVtYWluaW5nKTtcbiAgICB9XG5cbiAgICBnZXRQcm90b2NvbCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wcm90b2NvbDtcbiAgICB9XG5cbiAgICBnZXRIb3N0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLmhvc3Q7XG4gICAgfVxuXG4gICAgZ2V0UG9ydCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wb3J0O1xuICAgIH1cblxuICAgIGdldFBhdGhMaXN0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhMaXN0O1xuICAgIH1cblxuICAgIGdldFBhdGhQYXJ0KGluZGV4KXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aExpc3QuZ2V0KGluZGV4KTtcbiAgICB9XG5cbiAgICBnZXRQYXRoKCl7XG4gICAgICAgIGxldCBwYXRoID0gXCIvXCI7XG4gICAgICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgICAgIHRoaXMucGF0aExpc3QuZm9yRWFjaCgodmFsdWUgPT4ge1xuICAgICAgICAgICAgaWYgKCFmaXJzdCkge1xuICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoICsgXCIvXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXRoID0gcGF0aCArIHZhbHVlO1xuICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgfSksdGhpcyk7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIGNsZWFyUGF0aExpc3QoKXtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgZ2V0UGFyYW1ldGVyTWFwKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmFtZXRlck1hcDtcbiAgICB9XG5cbiAgICBjbGVhclBhcmFtZXRlck1BcCgpe1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXRQYXJhbWV0ZXIoa2V5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyTWFwLmdldChrZXkpO1xuICAgIH1cblxuICAgIHNldFBhcmFtZXRlcihrZXksdmFsdWUpe1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcC5zZXQoa2V5LHZhbHVlKTtcbiAgICB9XG5cbiAgICBzZXRCb29rbWFyayhib29rbWFyayl7XG4gICAgICAgIHRoaXMuYm9va21hcmsgPSBib29rbWFyaztcbiAgICB9XG5cbiAgICBzZXRQYXRoKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZGV0ZXJtaW5lUGF0aCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgc2V0UXVlcnlTdHJpbmcodmFsdWUpIHtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAgPSB0aGlzLmRldGVybWluZVBhcmFtZXRlcnModmFsdWUpO1xuICAgIH1cblxuICAgIGdldEJvb2ttYXJrKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmJvb2ttYXJrO1xuICAgIH1cblxuICAgIGRldGVybWluZVByb3RvY29sKHZhbHVlKXtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIi8vXCIpID09PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCIvL1wiKTtcbiAgICAgICAgaWYocGFydHNbMF0uaW5kZXhPZihcIi9cIikgIT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb3RvY29sID0gcGFydHNbMF07XG4gICAgICAgIGlmKHBhcnRzLmxlbmd0aD09MSl7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShwYXJ0c1swXSArIFwiLy9cIixcIlwiKTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVIb3N0KHZhbHVlKXtcbiAgICAgICAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCIvXCIpO1xuICAgICAgICB2YXIgaG9zdFBhcnQgPSBwYXJ0c1swXTtcbiAgICAgICAgaWYoaG9zdFBhcnQuaW5kZXhPZihcIjpcIikgIT09IC0xKXtcbiAgICAgICAgICAgIGhvc3RQYXJ0ID0gaG9zdFBhcnQuc3BsaXQoXCI6XCIpWzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaG9zdCA9IGhvc3RQYXJ0O1xuICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKGhvc3RQYXJ0LFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGRldGVybWluZVBvcnQodmFsdWUpe1xuICAgICAgICBpZighdmFsdWUuc3RhcnRzV2l0aChcIjpcIikpe1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwb3J0UGFydCA9IHZhbHVlLnNwbGl0KFwiL1wiKVswXS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHRoaXMucG9ydCA9IHBvcnRQYXJ0O1xuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShcIjpcIiArIHBvcnRQYXJ0LFwiXCIpO1xuICAgIH1cblxuICAgIGRldGVybWluZVBhdGgodmFsdWUpe1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gdmFsdWU7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCI/XCIpICE9PSAtMSl7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIj9cIik7XG4gICAgICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIj9cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgfSBlbHNlIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSl7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIiNcIik7XG4gICAgICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgfVxuICAgICAgICBpZih2YWx1ZS5zdGFydHNXaXRoKFwiL1wiKSl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGF0aFBhcnRzID0gbmV3IExpc3QodmFsdWUuc3BsaXQoXCIvXCIpKTtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHBhdGhQYXJ0cy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLHBhcmVudCl7XG4gICAgICAgICAgICBwYXJlbnQucGF0aExpc3QuYWRkKGRlY29kZVVSSSh2YWx1ZSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIHJldHVybiByZW1haW5pbmc7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUGFyYW1ldGVycyh2YWx1ZSl7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB2YWx1ZTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIj9cIikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIj9cIikrMSk7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgcmVtYWluaW5nID0gdmFsdWUuc3Vic3RyaW5nKHZhbHVlLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDAsdmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJ0TGlzdCA9IG5ldyBMaXN0KHZhbHVlLnNwbGl0KFwiJlwiKSk7XG4gICAgICAgIHZhciBwYXJhbWV0ZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHBhcnRMaXN0LmZvckVhY2goZnVuY3Rpb24odmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIHZhciBrZXlWYWx1ZSA9IHZhbHVlLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIGlmKGtleVZhbHVlLmxlbmd0aCA+PSAyKXtcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJNYXAuc2V0KGRlY29kZVVSSShrZXlWYWx1ZVswXSksZGVjb2RlVVJJKGtleVZhbHVlWzFdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAgPSBwYXJhbWV0ZXJNYXA7XG4gICAgICAgIHJldHVybiByZW1haW5pbmc7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lQm9va21hcmsodmFsdWUpe1xuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiI1wiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuYm9va21hcmsgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikrMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICB2YXIgdmFsdWUgPSBcIlwiO1xuICAgICAgICBpZih0aGlzLnByb3RvY29sICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyB0aGlzLnByb3RvY29sICsgXCIvL1wiO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuaG9zdCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgdGhpcy5ob3N0O1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMucG9ydCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI6XCIgKyB0aGlzLnBvcnQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhdGhMaXN0LmZvckVhY2goZnVuY3Rpb24ocGF0aFBhcnQscGFyZW50KXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIi9cIiArIHBhdGhQYXJ0O1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgdmFyIGZpcnN0UGFyYW1ldGVyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAuZm9yRWFjaChmdW5jdGlvbihwYXJhbWV0ZXJLZXkscGFyYW1ldGVyVmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIGlmKGZpcnN0UGFyYW1ldGVyKXtcbiAgICAgICAgICAgICAgICBmaXJzdFBhcmFtZXRlcj1mYWxzZTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI/XCI7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCImXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgZW5jb2RlVVJJKHBhcmFtZXRlcktleSkgKyBcIj1cIiArIGVuY29kZVVSSShwYXJhbWV0ZXJWYWx1ZSk7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIGlmKHRoaXMuYm9va21hcmsgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIiNcIiArIHRoaXMuYm9va21hcms7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxufVxuIiwiZXhwb3J0IGNsYXNzIFN0eWxlc3tcclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0eWxlc1NvdXJjZSBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Ioc3R5bGVzU291cmNlKXtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXHJcbiAgICAgICAgdGhpcy5zdHlsZXNTb3VyY2UgPSBzdHlsZXNTb3VyY2U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXRTdHlsZXNTb3VyY2UoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNTb3VyY2U7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmltcG9ydCB7TWFwLCBMb2dnZXIsIE9iamVjdEZ1bmN0aW9ufSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcclxuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XHJcbmltcG9ydCB7IFN0eWxlcyB9IGZyb20gXCIuL3N0eWxlcy5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlN0eWxlc1JlZ2lzdHJ5XCIpO1xyXG5cclxuZXhwb3J0IGNsYXNzIFN0eWxlc1JlZ2lzdHJ5IHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzTWFwID0gbmV3IE1hcCgpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cclxuICAgICAgICB0aGlzLnN0eWxlc1VybE1hcCA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzUXVldWVTaXplID0gMDtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cclxuICAgICAgICB0aGlzLmNhbGxiYWNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKiBAcGFyYW0ge1N0eWxlc30gc3R5bGVzIFxyXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcclxuICAgICAqL1xyXG4gICAgc2V0KG5hbWUsc3R5bGVzLHVybCl7XHJcbiAgICAgICAgaWYodXJsICE9PSB1bmRlZmluZWQgJiYgdXJsICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGVzVXJsTWFwLnNldChuYW1lLCB1cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0eWxlc01hcC5zZXQobmFtZSwgc3R5bGVzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKi9cclxuICAgIGdldChuYW1lKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNNYXAuZ2V0KG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqL1xyXG4gICAgY29udGFpbnMobmFtZSl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzTWFwLmNvbnRhaW5zKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjYWxsYmFjayBcclxuICAgICAqL1xyXG4gICAgZG9uZShjYWxsYmFjayl7XHJcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtTdHlsZXNSZWdpc3RyeX0gcmVnaXN0cnkgXHJcbiAgICAgKi9cclxuICAgIGRvQ2FsbGJhY2socmVnaXN0cnkpe1xyXG4gICAgICAgIGlmKHRtby5jYWxsYmFjayAhPT0gbnVsbCAmJiByZWdpc3RyeS5jYWxsYmFjayAhPT0gdW5kZWZpbmVkICAmJiByZWdpc3RyeS5zdHlsZXNRdWV1ZVNpemUgPT09IHJlZ2lzdHJ5LnN0eWxlc01hcC5zaXplKCkpe1xyXG4gICAgICAgICAgICB2YXIgdGVtcENhbGxiYWNrID0gcmVnaXN0cnkuY2FsbGJhY2s7XHJcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcclxuICAgICAgICAgICAgdGVtcENhbGxiYWNrLmNhbGwoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxyXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcclxuICAgICAqL1xyXG4gICAgIGxvYWQobmFtZSwgdXJsKSB7XHJcbiAgICAgICAgdGhpcy5zdHlsZXNRdWV1ZVNpemUgKys7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIENsaWVudC5nZXQodXJsKS50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHN0eWxlcyBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZS50ZXh0KCkudGhlbigodGV4dCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFN0eWxlcyh0ZXh0KSx1cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge01hcH0gbmFtZVVybE1hcCBcclxuICAgICAqL1xyXG4gICAgZ2V0U3R5bGVzTG9hZGVkUHJvbWlzZShuYW1lVXJsTWFwKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgbG9hZGVkID0gMDtcclxuICAgICAgICAgICAgaWYoIW5hbWVVcmxNYXAgfHwgbmFtZVVybE1hcC5zaXplKCkgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5hbWVVcmxNYXAuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLmNvbnRhaW5zKGtleSkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcclxuICAgICAgICAgICAgICAgICAgICBpZihsb2FkZWQgPT0gbmFtZVVybE1hcC5zaXplKCkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMucHJpdmF0ZUxvYWQoa2V5LCBuZXcgVXJsKHZhbHVlKSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKHJlYXNvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVhc29uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSx0aGlzKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlTG9hZChuYW1lLCB1cmwpIHtcclxuICAgICAgICBMT0cuaW5mbyhcIkxvYWRpbmcgc3R5bGVzIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsLnRvU3RyaW5nKCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgc3R5bGVzIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgU3R5bGVzKHRleHQpLHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGV7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGVtcGxhdGVTb3VyY2UgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGVtcGxhdGVTb3VyY2Upe1xuXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlU291cmNlID0gdGVtcGxhdGVTb3VyY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRUZW1wbGF0ZVNvdXJjZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVNvdXJjZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtNYXAsIExvZ2dlciwgT2JqZWN0RnVuY3Rpb259IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtUZW1wbGF0ZX0gZnJvbSBcIi4vdGVtcGxhdGUuanNcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuLi9jbGllbnQvY2xpZW50LmpzXCI7XG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlRlbXBsYXRlUmVnaXN0cnlcIik7XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVJlZ2lzdHJ5IHtcblxuICAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlVXJsTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7aW50ZWdlcn0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVF1ZXVlU2l6ZSA9IDA7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVByZWZpeCBcbiAgICAgKi9cbiAgICBzZXRMYW5ndWFnZVByZWZpeChsYW5ndWFnZVByZWZpeCkge1xuICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ID0gbGFuZ3VhZ2VQcmVmaXg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZX0gdGVtcGxhdGUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBzZXQobmFtZSx0ZW1wbGF0ZSx1cmwpe1xuICAgICAgICBpZih1cmwgIT09IHVuZGVmaW5lZCAmJiB1cmwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAuc2V0KG5hbWUsIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50ZW1wbGF0ZU1hcC5zZXQobmFtZSwgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGdldChuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVNYXAuZ2V0KG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGNvbnRhaW5zKG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZU1hcC5jb250YWlucyhuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjYWxsYmFjayBcbiAgICAgKi9cbiAgICBkb25lKGNhbGxiYWNrKXtcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLmRvQ2FsbGJhY2sodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZVJlZ2lzdHJ5fSByZWdpc3RyeSBcbiAgICAgKi9cbiAgICBkb0NhbGxiYWNrKHJlZ2lzdHJ5KXtcbiAgICAgICAgaWYodG1vLmNhbGxiYWNrICE9PSBudWxsICYmIHJlZ2lzdHJ5LmNhbGxiYWNrICE9PSB1bmRlZmluZWQgICYmIHJlZ2lzdHJ5LnRlbXBsYXRlUXVldWVTaXplID09PSByZWdpc3RyeS50ZW1wbGF0ZU1hcC5zaXplKCkpe1xuICAgICAgICAgICAgdmFyIHRlbXBDYWxsYmFjayA9IHJlZ2lzdHJ5LmNhbGxiYWNrO1xuICAgICAgICAgICAgcmVnaXN0cnkuY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICAgICAgdGVtcENhbGxiYWNrLmNhbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgbG9hZChuYW1lLCB1cmwpIHtcbiAgICAgICAgaWYodGhpcy5sYW5ndWFnZVByZWZpeCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdXJsLmdldFBhdGhMaXN0KCkuc2V0TGFzdChcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ICsgXCIuXCIgK1xuICAgICAgICAgICAgICAgIHVybC5nZXRQYXRoTGlzdCgpLmdldExhc3QoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRlbXBsYXRlUXVldWVTaXplICsrO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIENsaWVudC5nZXQodXJsKS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5vayl7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgdGVtcGxhdGUgZm9yIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNwb25zZS50ZXh0KCkudGhlbigodGV4dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChuYW1lLG5ldyBUZW1wbGF0ZSh0ZXh0KSx1cmwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvQ2FsbGJhY2sodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcH0gbmFtZVVybE1hcCBcbiAgICAgKi9cbiAgICBnZXRUZW1wbGF0ZXNMb2FkZWRQcm9taXNlKG5hbWVVcmxNYXApIHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB2YXIgbG9hZGVkID0gMDtcbiAgICAgICAgICAgIGlmKCFuYW1lVXJsTWFwIHx8IG5hbWVVcmxNYXAuc2l6ZSgpID09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmFtZVVybE1hcC5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLmNvbnRhaW5zKGtleSkpe1xuICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKys7XG4gICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucHJpdmF0ZUxvYWQoa2V5LCBuZXcgVXJsKHZhbHVlKSlcblxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihsb2FkZWQgPT0gbmFtZVVybE1hcC5zaXplKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgocmVhc29uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LHRoaXMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIHByaXZhdGVMb2FkKG5hbWUsIHVybCkge1xuICAgICAgICBpZih0aGlzLmxhbmd1YWdlUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1cmwuZ2V0UGF0aExpc3QoKS5zZXRMYXN0KFxuICAgICAgICAgICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggKyBcIi5cIiArXG4gICAgICAgICAgICAgICAgdXJsLmdldFBhdGhMaXN0KCkuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIExPRy5pbmZvKFwiTG9hZGluZyB0ZW1wbGF0ZSBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybC50b1N0cmluZygpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHNlKSA9PiB7XG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHRlbXBsYXRlIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UudGV4dCgpLnRoZW4oKHRleHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgVGVtcGxhdGUodGV4dCksdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2xzZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBMb2dnZXIsIE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDb25maWcsIFR5cGVDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcclxuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJUZW1wbGF0ZVBvc3RDb25maWdcIik7XHJcblxyXG4vKipcclxuICogVG8gYmUgYWRkZWQgdG8gbWluZGkgYXMgYSBzaW5nbGV0b24uIFdpbGwgc2NhbiB0aHJvdWdoIGFsbCBjb25maWd1cmVkIGNsYXNzZXMgdGhhdCBoYXZlIGEgVEVNUExBVEVfVVJMIGFuZCBDT01QT05FTlRfTkFNRVxyXG4gKiBzdGF0aWMgZ2V0dGVyIGFuZCB3aWxsIGFzeW5jcm9ub3VzbHkgbG9hZCB0aGVtLiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIGFsbCB0ZW1wbGF0ZXMgYXJlIGxvYWRlZFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlc0xvYWRlciB7XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1RlbXBsYXRlUmVnaXN0cnl9IHRlbXBsYXRlUmVnaXN0cnkgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHRlbXBsYXRlUmVnaXN0cnkpIHtcclxuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSB0ZW1wbGF0ZVJlZ2lzdHJ5O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge01hcH0gY29uZmlnRW50cmllc1xyXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICAgKi9cclxuICAgIGxvYWQoY29uZmlnRW50cmllcykge1xyXG4gICAgICAgIGxldCB0ZW1wbGF0ZU1hcCA9IG5ldyBNYXAoKTtcclxuICAgICAgICBjb25maWdFbnRyaWVzLmZvckVhY2goKGtleSwgY29uZmlnRW50cnksIHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZihjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5URU1QTEFURV9VUkwgJiYgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUpIHtcclxuICAgICAgICAgICAgICAgIHRlbXBsYXRlTWFwLnNldChjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSwgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuVEVNUExBVEVfVVJMKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTsgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVSZWdpc3RyeS5nZXRUZW1wbGF0ZXNMb2FkZWRQcm9taXNlKHRlbXBsYXRlTWFwKTtcclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBMb2dnZXIsIE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcclxuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXNSZWdpc3RyeS5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlN0eWxlc0xvYWRlclwiKTtcclxuXHJcbi8qKlxyXG4gKiBUbyBiZSBhZGRlZCB0byBtaW5kaSBhcyBhIHNpbmdsZXRvbi4gV2lsbCBzY2FuIHRocm91Z2ggYWxsIGNvbmZpZ3VyZWQgY2xhc3NlcyB0aGF0IGhhdmUgYSBTVFlMRVNfVVJMIGFuZCBDT01QT05FTlRfTkFNRVxyXG4gKiBzdGF0aWMgZ2V0dGVyIGFuZCB3aWxsIGFzeW5jcm9ub3VzbHkgbG9hZCB0aGVtLiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIGFsbCBzdHlsZXMgYXJlIGxvYWRlZFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFN0eWxlc0xvYWRlciB7XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1N0eWxlc1JlZ2lzdHJ5fSBzdHlsZXNSZWdpc3RyeSBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Ioc3R5bGVzUmVnaXN0cnkpIHtcclxuICAgICAgICB0aGlzLnN0eWxlc1JlZ2lzdHJ5ID0gc3R5bGVzUmVnaXN0cnk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7TWFwfSBjb25maWdFbnRyaWVzXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgbG9hZChjb25maWdFbnRyaWVzKSB7XHJcbiAgICAgICAgbGV0IHN0eWxlc01hcCA9IG5ldyBNYXAoKTtcclxuICAgICAgICBjb25maWdFbnRyaWVzLmZvckVhY2goKGtleSwgY29uZmlnRW50cnksIHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZihjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5TVFlMRVNfVVJMICYmIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FKSB7XHJcbiAgICAgICAgICAgICAgICBzdHlsZXNNYXAuc2V0KGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FLCBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5TVFlMRVNfVVJMKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTsgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0U3R5bGVzTG9hZGVkUHJvbWlzZShzdHlsZXNNYXApO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDb25maWcsIEluamVjdGlvblBvaW50LCBUeXBlQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCI7XHJcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgVGVtcGxhdGVzTG9hZGVyIH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qc1wiO1xyXG5pbXBvcnQgeyBTdHlsZXNMb2FkZXIgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc0xvYWRlci5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbXBvbmVudENvbmZpZ1Byb2Nlc3NvclwiKVxyXG5cclxuLyoqXHJcbiAqIE1pbmRpIGNvbmZpZyBwcm9jZXNzb3Igd2hpY2ggbG9hZHMgYWxsIHRlbXBsYXRlcyBhbmQgc3R5bGVzIGZvciBhbGwgY29uZmlndXJlZCBjb21wb25lbnRzXHJcbiAqIGFuZCB0aGVuIGNhbGxzIGFueSBleGlzdGluZyBjb21wb25lbnRMb2FkZWQgZnVuY3Rpb24gb24gZWFjaCBjb21wb25lbnRcclxuICovXHJcbmV4cG9ydCBjbGFzcyBDb21wb25lbnRDb25maWdQcm9jZXNzb3Ige1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShUZW1wbGF0ZVJlZ2lzdHJ5KTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHR5cGUge1N0eWxlc1JlZ2lzdHJ5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKi9cclxuICAgIHBvc3RDb25maWcoKXtcclxuICAgICAgICB0aGlzLnRlbXBsYXRlc0xvYWRlciA9IG5ldyBUZW1wbGF0ZXNMb2FkZXIodGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5KTtcclxuICAgICAgICB0aGlzLnN0eWxlc0xvYWRlciA9IG5ldyBTdHlsZXNMb2FkZXIodGhpcy5zdHlsZXNSZWdpc3RyeSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7Q29uZmlnfSBjb25maWdcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBwcm9jZXNzQ29uZmlnKGNvbmZpZywgdW5jb25maWd1cmVkQ29uZmlnRW50cmllcykge1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXHJcbiAgICAgICAgICAgIFsgXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRlbXBsYXRlc0xvYWRlci5sb2FkKHVuY29uZmlndXJlZENvbmZpZ0VudHJpZXMpLCBcclxuICAgICAgICAgICAgICAgIHRoaXMuc3R5bGVzTG9hZGVyLmxvYWQodW5jb25maWd1cmVkQ29uZmlnRW50cmllcykgXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IENvbnRhaW5lckZ1bmN0aW9ucyB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcclxuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSGlzdG9yeSB7XHJcblxyXG4gICAgc3RhdGljIHJlcGxhY2VVcmwodXJsLCB0aXRsZSwgc3RhdGVPYmplY3QpIHtcclxuICAgICAgICBDb250YWluZXJGdW5jdGlvbnMucmVwbGFjZVVybCh1cmwudG9TdHJpbmcoKSwgdGl0bGUsIHN0YXRlT2JqZWN0KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcHVzaFVybCh1cmwsIHRpdGxlLCBzdGF0ZU9iamVjdCkge1xyXG4gICAgICAgIENvbnRhaW5lckZ1bmN0aW9ucy5wdXNoVXJsKHVybC50b1N0cmluZygpLCB0aXRsZSwgc3RhdGVPYmplY3QpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRVcmwoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBVcmwoQ29udGFpbmVyRnVuY3Rpb25zLmN1cnJlbnRVcmwoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGxvYWRVcmwodXJsKSB7XHJcbiAgICAgICAgQ29udGFpbmVyRnVuY3Rpb25zLmxvYWRVcmwodXJsLnRvU3RyaW5nKCkpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJMb2FkZXJGaWx0ZXJcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgTG9hZGVyRmlsdGVyIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufVxyXG4gICAgICovXHJcbiAgICBwcm9jZXNzKCkge1xyXG4gICAgICAgIExPRy5pbmZvKFwiSW51bXBsZW1lbnRlZCBMb2FkZXIgRmlsdGVyIGJyZWFrcyBieSBkZWZhdWx0XCIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxyXG5pbXBvcnQgeyBIaXN0b3J5IH0gZnJvbSBcIi4uL25hdmlnYXRpb24vaGlzdG9yeS5qc1wiO1xyXG5pbXBvcnQgeyBMb2FkZXJGaWx0ZXIgfSBmcm9tIFwiLi9sb2FkZXJGaWx0ZXIuanNcIjtcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJNb2R1bGVMb2FkZXJcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgTW9kdWxlTG9hZGVyIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtSZWdFeHB9IG1hdGNoUGF0aCBcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb290UGF0aCBcclxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGVQYXRoIFxyXG4gICAgICogQHBhcmFtIHtBcnJheTxMb2FkZXJGaWx0ZXI+fSBsb2FkZXJGaWx0ZXJzIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihtYXRjaFBhdGgsIHJvb3RQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJGaWx0ZXJzID0gW10pIHtcclxuICAgICAgICBcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7UmVnRXhwfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMubWF0Y2hQYXRoID0gbWF0Y2hQYXRoO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMucm9vdFBhdGggPSByb290UGF0aDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLm1vZHVsZVBhdGggPSBtb2R1bGVQYXRoO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7QXJyYXk8TG9hZGVyRmlsdGVyPn1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLmxvYWRlckZpbHRlcnMgPSBsb2FkZXJGaWx0ZXJzO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdEluc3RhbmNlID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnJlcXVlc3RlZFBhdGggPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGF1dGhvcml6ZWQoKXsgXHJcbiAgICAgICAgaWYgKHRoaXMucmVxdWlyZWRTY29wZUFycmF5Lmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgbWF0Y2hlcygpeyBcclxuICAgICAgICBjb25zdCB1cmwgPSBIaXN0b3J5LmdldFVybCgpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1hdGNoUGF0aC50ZXN0KHVybC5nZXRQYXRoKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIGxvYWQocm9vdFBhdGgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZmlsdGVyc1Bhc3MoKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgaWYgKCFwYXJlbnQuZGVmYXVsdEluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5pbXBvcnRNb2R1bGUoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5kZWZhdWx0SW5zdGFuY2UubG9hZChyb290UGF0aCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5kZWZhdWx0SW5zdGFuY2UubG9hZChyb290UGF0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZpbHRlcnNQYXNzKCkge1xyXG4gICAgICAgIGxldCBwYXNzID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5sb2FkZXJGaWx0ZXJzKSB7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZGVyRmlsdGVycy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZighZWxlbWVudC5wcm9jZXNzKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXNzID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwYXNzO1xyXG4gICAgfVxyXG5cclxuICAgIGltcG9ydE1vZHVsZSgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAobnVsbCAhPSB0aGlzLmRlZmF1bHRJbnN0YW5jZSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGltcG9ydCh0aGlzLm1vZHVsZVBhdGgpLnRoZW4oKG1vZHVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZWZhdWx0SW5zdGFuY2UgPSBuZXcgbW9kdWxlLmRlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goKHJlYXNvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlYXNvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGRlZmF1bHRJbnN0YW5jZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZWZhdWx0SW5zdGFuY2U7XHJcbiAgICB9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXR0cmlidXRlKSB7XHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGUgPSBhdHRyaWJ1dGU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHZhbHVlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS52YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbmFtZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGUubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbmFtZXNwYWNlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS5uYW1lO1xyXG4gICAgfVxyXG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTWFwLCBMb2dnZXIsIExpc3QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENvbnRhaW5lckZ1bmN0aW9ucyB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IEF0dHJpYnV0ZSB9IGZyb20gXCIuL2F0dHJpYnV0ZS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQmFzZUVsZW1lbnRcIik7XG5cbi8qKlxuICogQSBiYXNlIGNsYXNzIGZvciBlbmNsb3NpbmcgYW4gSFRNTEVsZW1lbnRcbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR8c3RyaW5nfEhUTUxFbGVtZW50fSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgXG4gICAgICAgIC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbnVsbDtcbiAgICAgICAgdGhpcy5ldmVudHNBdHRhY2hlZCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIFxuICAgICAgICBpZih2YWx1ZSBpbnN0YW5jZW9mIFhtbEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuY3JlYXRlRnJvbVhtbEVsZW1lbnQodmFsdWUsIHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IENvbnRhaW5lckZ1bmN0aW9ucy5jcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZih2YWx1ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIExPRy5lcnJvcihcIlVucmVjb2duaXplZCB2YWx1ZSBmb3IgRWxlbWVudFwiKTtcbiAgICAgICAgTE9HLmVycm9yKHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2FkQXR0cmlidXRlcygpIHtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50LmF0dHJpYnV0ZXMgPT09IG51bGwgfHwgdGhpcy5lbGVtZW50LmF0dHJpYnV0ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5hdHRyaWJ1dGVNYXAgPT09IG51bGwgfHwgdGhpcy5hdHRyaWJ1dGVNYXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAuc2V0KHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5hbWUsbmV3IEF0dHJpYnV0ZSh0aGlzLmVsZW1lbnQuYXR0cmlidXRlc1tpXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGJyb3dzZXIgRWxlbWVudCBmcm9tIHRoZSBYbWxFbGVtZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHhtbEVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRFbGVtZW50XG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgY3JlYXRlRnJvbVhtbEVsZW1lbnQoeG1sRWxlbWVudCwgcGFyZW50RWxlbWVudCkge1xuICAgICAgICBsZXQgZWxlbWVudCA9IG51bGw7XG4gICAgICAgIGlmKHhtbEVsZW1lbnQubmFtZXNwYWNlKXtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBDb250YWluZXJGdW5jdGlvbnMuY3JlYXRlRWxlbWVudE5TKHhtbEVsZW1lbnQubmFtZXNwYWNlVXJpLHhtbEVsZW1lbnQuZnVsbE5hbWUpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBDb250YWluZXJGdW5jdGlvbnMuY3JlYXRlRWxlbWVudCh4bWxFbGVtZW50Lm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHBhcmVudEVsZW1lbnQgJiYgcGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgeG1sRWxlbWVudC5hdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlS2V5LGF0dHJpYnV0ZSl7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVLZXksYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIGEgZnVuY3Rpb24gdG8gYW4gZXZlbnQgaW4gdGhlIGVuY2xvc2VkIGVsZW1lbnQgaWYgbm9uZSBhbGxyZWFkeSBleGlzdHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmdW5jdGlvblBhcmFtXG4gICAgICovXG4gICAgYXR0YWNoRXZlbnQoZXZlbnRUeXBlLCBmdW5jdGlvblBhcmFtKSB7XG4gICAgICAgIGlmKCF0aGlzLmV2ZW50c0F0dGFjaGVkLmNvbnRhaW5zKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGlmKGV2ZW50VHlwZS5zdGFydHNXaXRoKFwib25cIikpIHtcbiAgICAgICAgICAgICAgICBldmVudFR5cGUgPSBldmVudFR5cGUuc3Vic3RyKDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBmdW5jdGlvblBhcmFtKTtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzQXR0YWNoZWQuYWRkKGV2ZW50VHlwZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBMT0cud2FybihcIkV2ZW50ICdcIiArIGV2ZW50VHlwZSArIFwiJyBhbGxyZWFkeSBhdHRhY2hlZCBmb3IgXCIgKyB0aGlzLmVsZW1lbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGVuY2xvc2VkIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIGdldCBtYXBwZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIGdldCBmdWxsTmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC50YWdOYW1lO1xuICAgIH1cblxuICAgIGdldCB0b3AoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICAgIH1cblxuICAgIGdldCBib3R0b20oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuYm90dG9tO1xuICAgIH1cblxuICAgIGdldCBsZWZ0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQ7XG4gICAgfVxuXG4gICAgZ2V0IHJpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0O1xuICAgIH1cblxuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aDtcbiAgICB9XG5cbiAgICBnZXQgaGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICB9XG5cbiAgICBnZXQgYXR0cmlidXRlcygpIHtcbiAgICAgICAgdGhpcy5sb2FkQXR0cmlidXRlcygpO1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVNYXA7XG4gICAgfVxuXG4gICAgc2V0QXR0cmlidXRlVmFsdWUoa2V5LHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LHZhbHVlKTtcbiAgICB9XG5cbiAgICBnZXRBdHRyaWJ1dGVWYWx1ZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICB9XG5cbiAgICBjb250YWluc0F0dHJpYnV0ZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5oYXNBdHRyaWJ1dGUoa2V5KTtcbiAgICB9XG5cbiAgICByZW1vdmVBdHRyaWJ1dGUoa2V5KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICB9XG5cbiAgICBzZXRTdHlsZShrZXksdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlW2tleV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXRTdHlsZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5zdHlsZVtrZXldO1xuICAgIH1cblxuICAgIHJlbW92ZVN0eWxlKGtleSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGVba2V5XSA9IG51bGw7XG4gICAgfVxuXG4gICAgc2V0KGlucHV0KSB7XG4gICAgICAgIGlmKHRoaXMuZWxlbWVudC5wYXJlbnROb2RlID09PSBudWxsKXtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJUaGUgZWxlbWVudCBoYXMgbm8gcGFyZW50LCBjYW4gbm90IHN3YXAgaXQgZm9yIHZhbHVlXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0Lm1hcHBlZEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dC5tYXBwZWRFbGVtZW50LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0ICYmIGlucHV0LnJvb3RFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChDb250YWluZXJGdW5jdGlvbnMuY3JlYXRlVGV4dE5vZGUoaW5wdXQpLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNNb3VudGVkKCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuZWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0Q2hpbGQoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKGlucHV0KTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gdW5kZWZpbmVkICYmIGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpe1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0Lm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKENvbnRhaW5lckZ1bmN0aW9ucy5jcmVhdGVUZXh0Tm9kZShpbnB1dCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByZXBlbmRDaGlsZChpbnB1dCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKGlucHV0Lm1hcHBlZEVsZW1lbnQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoQ29udGFpbmVyRnVuY3Rpb25zLmNyZWF0ZVRleHROb2RlKGlucHV0KSx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkFic3RyYWN0SW5wdXRFbGVtZW50XCIpO1xuXG4vKipcbiAqIFNoYXJlZCBwcm9wZXJ0aWVzIG9mIGlucHV0IGVsZW1lbnRzXG4gKi9cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdElucHV0RWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gdmFsdWVcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKHZhbHVlLCBwYXJlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQgbmFtZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHZhbHVlIGdpdmVuIGFueSBwcm9jZXNzaW5nIHJ1bGVzXG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmJhY2tpbmdWYWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IElucHV0RXZlbnQoJ2NoYW5nZScpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzb3VyY2UgdmFsdWVcbiAgICAgKi9cbiAgICBnZXQgYmFja2luZ1ZhbHVlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWU7XG4gICAgfVxuXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICAgIH1cblxuICAgIHNlbGVjdEFsbCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNlbGVjdCgpO1xuICAgIH1cblxuICAgIGVuYWJsZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZGlzYWJsZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdElucHV0RWxlbWVudCB9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBSYWRpb0lucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc2V0IGNoZWNrZWQodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlzQ2hlY2tlZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNoZWNrZWQ7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0NoZWNrZWQoKTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IFwidHJ1ZVwiKTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdElucHV0RWxlbWVudCB9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBDaGVja2JveElucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc2V0IGNoZWNrZWQodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlzQ2hlY2tlZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNoZWNrZWQ7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0NoZWNrZWQoKTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IFwidHJ1ZVwiKTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtBYnN0cmFjdElucHV0RWxlbWVudH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHRJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0YXJlYUlucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgZ2V0IGlubmVySFRNTCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBzZXQgaW5uZXJIVE1MKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGFkZENoaWxkKGlucHV0KSB7XG4gICAgICAgIHN1cGVyLmFkZENoaWxkKGlucHV0KTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIHByZXBlbmRDaGlsZChpbnB1dCkge1xuICAgICAgICBzdXBlci5wcmVwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5pbm5lckhUTUw7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgWG1sQ2RhdGEgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBDb250YWluZXJGdW5jdGlvbnMgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0bm9kZUVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sQ2RhdGF9IHZhbHVlIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIGlmKHZhbHVlIGluc3RhbmNlb2YgWG1sQ2RhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuY3JlYXRlRnJvbVhtbENkYXRhKHZhbHVlLCBwYXJlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBDb250YWluZXJGdW5jdGlvbnMuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtYbWxDZGF0YX0gY2RhdGFFbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudEVsZW1lbnQgXG4gICAgICovXG4gICAgY3JlYXRlRnJvbVhtbENkYXRhKGNkYXRhRWxlbWVudCwgcGFyZW50RWxlbWVudCkge1xuICAgICAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNkYXRhRWxlbWVudC52YWx1ZSk7XG4gICAgICAgIGlmKHBhcmVudEVsZW1lbnQgIT09IG51bGwgJiYgcGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFNpbXBsZUVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIGdldCBpbm5lckhUTUwoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgc2V0IGlubmVySFRNTCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XHJcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBGb3JtRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uc3RydWN0b3JcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xyXG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHZhbHVlIG9mIHRoZSBpbnB1dHMgbmFtZVxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IG5hbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHRoZSB2YWx1ZSBvZiBpbnB1dHMgbmFtZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBzZXQgbmFtZSh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgc3VibWl0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc3VibWl0KCk7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBWaWRlb0VsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudCB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3RvclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gdmFsdWUgXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xyXG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG1hcHBlZEVsZW1lbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBwbGF5KCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5wbGF5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgbXV0ZSgpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQubXV0ZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHVubXV0ZSgpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQubXV0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbENkYXRhLFhtbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7UmFkaW9JbnB1dEVsZW1lbnR9IGZyb20gXCIuL3JhZGlvSW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge0NoZWNrYm94SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9jaGVja2JveElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUZXh0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi90ZXh0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RleHRhcmVhSW5wdXRFbGVtZW50fSBmcm9tIFwiLi90ZXh0YXJlYUlucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUZXh0bm9kZUVsZW1lbnR9IGZyb20gXCIuL3RleHRub2RlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHtTaW1wbGVFbGVtZW50fSBmcm9tIFwiLi9zaW1wbGVFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBGb3JtRWxlbWVudCB9IGZyb20gXCIuL2Zvcm1FbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBWaWRlb0VsZW1lbnQgfSBmcm9tIFwiLi92aWRlb0VsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnRNYXBwZXIge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2FueX0gaW5wdXQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyBtYXAoaW5wdXQsIHBhcmVudCkge1xuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9SYWRpbyhpbnB1dCkpeyByZXR1cm4gbmV3IFJhZGlvSW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb0NoZWNrYm94KGlucHV0KSl7IHJldHVybiBuZXcgQ2hlY2tib3hJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvU3VibWl0KGlucHV0KSl7IHJldHVybiBuZXcgVGV4dElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9Gb3JtKGlucHV0KSl7IHJldHVybiBuZXcgRm9ybUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVGV4dGFyZWEoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0YXJlYUlucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0KGlucHV0KSl7IHJldHVybiBuZXcgVGV4dElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9WaWRlbyhpbnB1dCkpeyByZXR1cm4gbmV3IFZpZGVvRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0bm9kZShpbnB1dCkpeyByZXR1cm4gbmV3IFRleHRub2RlRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9TaW1wbGUoaW5wdXQpKXsgcmV0dXJuIG5ldyBTaW1wbGVFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTWFwcGluZyB0byBzaW1wbGUgYnkgZGVmYXVsdCBcIiArIGlucHV0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaW1wbGVFbGVtZW50KGlucHV0LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9SYWRpbyhpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwicmFkaW9cIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJyYWRpb1wiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvQ2hlY2tib3goaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCAmJiBpbnB1dC50eXBlID09PSBcImNoZWNrYm94XCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIiAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiY2hlY2tib3hcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1N1Ym1pdChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwic3VibWl0XCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIiAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwic3VibWl0XCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9Gb3JtKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxGb3JtRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJmb3JtXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0KGlucHV0KXtcbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwidGV4dFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJlbWFpbFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJkYXRlXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIpIHtcbiAgICAgICAgICAgIGlmKCFpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRleHRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcImVtYWlsXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiZGF0ZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dG5vZGUoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgTm9kZSAmJiBpbnB1dC5ub2RlVHlwZSA9PT0gXCJURVhUX05PREVcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbENkYXRhKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVmlkZW8oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJ2aWRlb1wiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dGFyZWEoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJ0ZXh0YXJlYVwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvU2ltcGxlKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCk7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBFbGVtZW50TWFwcGVyIH0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRXZlbnR7XG5cbiAgICBjb25zdHJ1Y3RvcihldmVudCl7XG4gICAgICAgIHRoaXMuZXZlbnQgPSBldmVudDtcbiAgICAgICAgaWYodGhpcy5ldmVudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gXCJkcmFnc3RhcnRcIil7XG4gICAgICAgICAgICB0aGlzLmV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKCd0ZXh0L3BsYWluJywgbnVsbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdG9wUHJvcGFnYXRpb24oKXtcbiAgICAgICAgdGhpcy5ldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICBwcmV2ZW50RGVmYXVsdCgpe1xuICAgICAgICB0aGlzLmV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGV2ZW50IGFuZCB0aGUgZWRnZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGNvbnRhaW5pbmcgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0T2Zmc2V0WCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5vZmZzZXRYO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBldmVudCBhbmQgdGhlIGVkZ2UgeSBjb29yZGluYXRlIG9mIHRoZSBjb250YWluaW5nIG9iamVjdFxuICAgICAqL1xuICAgIGdldE9mZnNldFkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQub2Zmc2V0WTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbW91c2UgeCBjb29yZGluYXRlIG9mIHRoZSBldmVudCByZWxhdGl2ZSB0byB0aGUgY2xpZW50IHdpbmRvdyB2aWV3XG4gICAgICovXG4gICAgZ2V0Q2xpZW50WCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5jbGllbnRYO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtb3VzZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGV2ZW50IHJlbGF0aXZlIHRvIHRoZSBjbGllbnQgd2luZG93IHZpZXdcbiAgICAgKi9cbiAgICBnZXRDbGllbnRZKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmNsaWVudFk7XG4gICAgfVxuXG4gICAgZ2V0VGFyZ2V0KCl7XG4gICAgICAgIHJldHVybiBFbGVtZW50TWFwcGVyLm1hcCh0aGlzLmV2ZW50LnRhcmdldCk7XG4gICAgfVxuXG4gICAgZ2V0S2V5Q29kZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQua2V5Q29kZTtcbiAgICB9XG5cbiAgICBpc0tleUNvZGUoY29kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5rZXlDb2RlID09PSBjb2RlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBNYXAsIE9iamVjdEZ1bmN0aW9uLCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEV2ZW50IH0gZnJvbSBcIi4vZXZlbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkV2ZW50UmVnaXN0cnlcIik7XG5cbmV4cG9ydCBjbGFzcyBFdmVudFJlZ2lzdHJ5IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5iZWZvcmVMaXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuYWZ0ZXJMaXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29ubmVjdHMgZWxlbWVudHMgd2l0aCB0aGUgZXZlbnQgcmVnaXN0cnkgc28gdGhhdCBldmVudHMgdHJpZ2dlcmVkIG9uIHRoZSBlbGVtZW50IGdldHMgZGlzdHJpYnV0ZWQgdG8gYWxsIGxpc3RlbmVyc1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnQgdGhlIGVsZW1lbnQgd2hpY2ggaXMgdGhlIHNvdXJjZSBvZiB0aGUgZXZlbnQgYW5kIHdoaWNoIGNhbiBiZSBhdHRhY2hlZCB0b1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGUgdGhlIGV2ZW50IHR5cGUgYXMgaXQgaXMgZGVmaW5lZCBieSB0aGUgY29udGFpbmluZyB0cmlnZ2VyIChleGFtcGxlIFwib25jbGlja1wiKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgdGhlIGV2ZW50IG5hbWUgYXMgaXQgd2lsbCBiZSByZWZlcnJlZCB0byBpbiB0aGUgRXZlbnRSZWdpc3RyeSAoZXhhbXBsZSBcIi8vZXZlbnQ6Y2xpY2tlZFwiKVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb21wb25lbnRJbmRleCB1bmlxdWUgaWQgb2YgdGhlIGNvbXBvbmVudCB3aGljaCBvd25zIHRoZSBlbGVtZW50XG4gICAgICovXG4gICAgYXR0YWNoKGVsZW1lbnQsIGV2ZW50VHlwZSwgZXZlbnROYW1lLCBjb21wb25lbnRJbmRleCkge1xuICAgICAgICBjb25zdCB1bmlxdWVFdmVudE5hbWUgPSBldmVudE5hbWUgKyBcIl9cIiArIGNvbXBvbmVudEluZGV4O1xuICAgICAgICBjb25zdCB0aGVFdmVudFJlZ2lzdHJ5ID0gdGhpcztcbiAgICAgICAgZWxlbWVudC5hdHRhY2hFdmVudChldmVudFR5cGUsIGZ1bmN0aW9uKGV2ZW50KSB7IHRoZUV2ZW50UmVnaXN0cnkudHJpZ2dlcih1bmlxdWVFdmVudE5hbWUsIGV2ZW50TmFtZSwgZXZlbnQpOyB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIHRoZSBldmVudCBuYW1lIGFzIGl0IHdpbGwgYmUgcmVmZXJyZWQgdG8gaW4gdGhlIEV2ZW50UmVnaXN0cnkgKGV4YW1wbGUgXCIvL2V2ZW50OmNsaWNrZWRcIilcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBsaXN0ZW5lciB0aGUgb2JqZWN0IHdoaWNoIG93bnMgdGhlIGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdW5pcXVlSW5kZXggYSB1bmlxdWUgaW5kZXggZm9yIHRoZSBldmVudFxuICAgICAqL1xuICAgIGxpc3RlbihldmVudE5hbWUsIGxpc3RlbmVyLCB1bmlxdWVJbmRleCkge1xuICAgICAgICBjb25zdCB1bmlxdWVFdmVudE5hbWUgPSBldmVudE5hbWUgKyBcIl9cIiArIHVuaXF1ZUluZGV4O1xuICAgICAgICB0aGlzLmluaXRNYXAodGhpcy5saXN0ZW5lcnMsIHVuaXF1ZUV2ZW50TmFtZSk7XG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICBjb25zdCBsaXN0ZW5lck1hcCA9IHRoaXMubGlzdGVuZXJzLmdldCh1bmlxdWVFdmVudE5hbWUpO1xuICAgICAgICBsaXN0ZW5lck1hcC5zZXQobGlzdGVuZXIuZ2V0T2JqZWN0KCkuY29uc3RydWN0b3IubmFtZSwgbGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgdGhlIGV2ZW50IG5hbWUgYXMgaXQgd2lsbCBiZSByZWZlcnJlZCB0byBpbiB0aGUgRXZlbnRSZWdpc3RyeSAoZXhhbXBsZSBcIi8vZXZlbnQ6Y2xpY2tlZFwiKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGxpc3RlbmVyIHRoZSBvYmplY3Qgd2hpY2ggb3ducyB0aGUgaGFuZGxlciBmdW5jdGlvblxuICAgICAqL1xuICAgIGxpc3RlbkJlZm9yZShldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuaW5pdE1hcCh0aGlzLmJlZm9yZUxpc3RlbmVycywgZXZlbnROYW1lKTtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIGNvbnN0IGxpc3RlbmVyTWFwID0gdGhpcy5iZWZvcmVMaXN0ZW5lcnMuZ2V0KGV2ZW50TmFtZSk7XG4gICAgICAgIGxpc3RlbmVyTWFwLnNldChsaXN0ZW5lci5nZXRPYmplY3QoKS5jb25zdHJ1Y3Rvci5uYW1lLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSB0aGUgZXZlbnQgbmFtZSBhcyBpdCB3aWxsIGJlIHJlZmVycmVkIHRvIGluIHRoZSBFdmVudFJlZ2lzdHJ5IChleGFtcGxlIFwiLy9ldmVudDpjbGlja2VkXCIpXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gbGlzdGVuZXIgdGhlIG9iamVjdCB3aGljaCBvd25zIHRoZSBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICovXG4gICAgbGlzdGVuQWZ0ZXIoZXZlbnROYW1lLCBsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLmluaXRNYXAodGhpcy5hZnRlckxpc3RlbmVycywgZXZlbnROYW1lKTtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIGNvbnN0IGxpc3RlbmVyTWFwID0gdGhpcy5hZnRlckxpc3RlbmVycy5nZXQoZXZlbnROYW1lKTtcbiAgICAgICAgbGlzdGVuZXJNYXAuc2V0KGxpc3RlbmVyLmdldE9iamVjdCgpLmNvbnN0cnVjdG9yLm5hbWUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcH0gbWFwIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgXG4gICAgICovXG4gICAgaW5pdE1hcChtYXAsIGtleSkge1xuICAgICAgICBpZiAoIW1hcC5leGlzdHMoa2V5KSkge1xuICAgICAgICAgICAgbWFwLnNldChrZXksbmV3IE1hcCgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRyaWdnZXIoc3VmZml4ZWRFdmVudE5hbWUsIGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVCZWZvcmUoZXZlbnROYW1lLCBldmVudCk7XG4gICAgICAgIGlmICh0aGlzLmxpc3RlbmVycy5leGlzdHMoc3VmZml4ZWRFdmVudE5hbWUpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5nZXQoc3VmZml4ZWRFdmVudE5hbWUpLmZvckVhY2goKGtleSwgdmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhbHVlLmNhbGwobmV3IEV2ZW50KGV2ZW50KSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmhhbmRsZUFmdGVyKGV2ZW50TmFtZSwgZXZlbnQpO1xuICAgIH1cblxuICAgIGhhbmRsZUJlZm9yZShldmVudE5hbWUsIGV2ZW50KSB7XG4gICAgICAgIHRoaXMuaGFuZGxlR2xvYmFsKHRoaXMuYmVmb3JlTGlzdGVuZXJzLCBldmVudE5hbWUsIGV2ZW50KTtcbiAgICB9XG5cbiAgICBoYW5kbGVBZnRlcihldmVudE5hbWUsIGV2ZW50KSB7XG4gICAgICAgIHRoaXMuaGFuZGxlR2xvYmFsKHRoaXMuYWZ0ZXJMaXN0ZW5lcnMsIGV2ZW50TmFtZSwgZXZlbnQpO1xuICAgIH1cblxuICAgIGhhbmRsZUdsb2JhbChsaXN0ZW5lcnMsIGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgaWYobGlzdGVuZXJzLmV4aXN0cyhldmVudE5hbWUpKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMuZ2V0KGV2ZW50TmFtZSkuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWUuY2FsbChuZXcgRXZlbnQoZXZlbnQpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgVW5pcXVlSWRSZWdpc3RyeSB7XHJcblxyXG4gICAgaWRBdHRyaWJ1dGVXaXRoU3VmZml4IChpZCkge1xyXG4gICAgICAgIGlmKGlkTmFtZXMuY29udGFpbnMoaWQpKSB7XHJcbiAgICAgICAgICAgIHZhciBudW1iZXIgPSBpZE5hbWVzLmdldChpZCk7XHJcbiAgICAgICAgICAgIGlkTmFtZXMuc2V0KGlkLG51bWJlcisxKTtcclxuICAgICAgICAgICAgcmV0dXJuIGlkICsgXCItXCIgKyBudW1iZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlkTmFtZXMuc2V0KGlkLDEpO1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbnZhciBpZE5hbWVzID0gbmV3IE1hcCgpOyIsImltcG9ydCB7IE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcblxyXG4vKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXHJcblxyXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGNvbXBvbmVudEluZGV4IFxyXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcm9vdEVsZW1lbnQgXHJcbiAgICAgKiBAcGFyYW0ge01hcH0gZWxlbWVudE1hcCBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY29tcG9uZW50SW5kZXgsIHJvb3RFbGVtZW50LCBlbGVtZW50TWFwKSB7XHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGV4O1xyXG4gICAgICAgIHRoaXMuZWxlbWVudE1hcCA9IGVsZW1lbnRNYXA7XHJcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IHJvb3RFbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZSgpIHtcclxuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybnMge0Jhc2VFbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBnZXQoaWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwLmdldChpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0IChpZCwgdmFsdWUpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5zZXQodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyQ2hpbGRyZW4oaWQpe1xyXG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q2hpbGQgKGlkLCB2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLnNldENoaWxkKHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRDaGlsZCAoaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuYWRkQ2hpbGQodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHByZXBlbmRDaGlsZCAoaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkucHJlcGVuZENoaWxkKHZhbHVlKTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgTWFwLCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcclxuaW1wb3J0IHsgRWxlbWVudE1hcHBlciB9IGZyb20gXCIuLi9lbGVtZW50L2VsZW1lbnRNYXBwZXJcIjtcclxuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudFwiO1xyXG5pbXBvcnQgeyBFdmVudFJlZ2lzdHJ5IH0gZnJvbSBcIi4uL2V2ZW50L2V2ZW50UmVnaXN0cnlcIjtcclxuXHJcbi8qKlxyXG4gKiBDb2xsZWN0cyBpbmZvcm1hdGlvbiB3aGVuIGVsZW1lbnRzIGFyZSBjcmVhdGVkIGFuZCBmaW5kcyB0aGUgcm9vdCBlbGVtZW50LCBjcmVhdGVzIG1hcCBvZiBlbGVtZW50cyBcclxuICogYW5kIHJlZ2lzdGVycyBldmVudHMgaW4gdGhlIGV2ZW50UmVnaXN0cnlcclxuICovXHJcbmV4cG9ydCBjbGFzcyBFbGVtZW50UmVnaXN0cmF0b3Ige1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGV2ZW50UmVnaXN0cnksIHVuaXF1ZUlkUmVnaXN0cnksIGNvbXBvbmVudEluZGV4KSB7XHJcbiAgICAgICAgdGhpcy5jb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGV4O1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cclxuICAgICAgICB0aGlzLnVuaXF1ZUlkUmVnaXN0cnkgPSB1bmlxdWVJZFJlZ2lzdHJ5O1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge0V2ZW50UmVnaXN0cnl9ICovXHJcbiAgICAgICAgdGhpcy5ldmVudFJlZ2lzdHJ5ID0gZXZlbnRSZWdpc3RyeTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cclxuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwID0gbmV3IE1hcCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEVsZW1lbnRNYXAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIExpc3RlbnMgdG8gZWxlbWVudHMgYmVpbmcgY3JlYXRlZCwgYW5kIHRha2VzIGlubiB0aGUgY3JlYXRlZCBYbWxFbGVtZW50IGFuZCBpdHMgcGFyZW50IFhtbEVsZW1lbnRcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB4bWxFbGVtZW50IFxyXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50V3JhcHBlciBcclxuICAgICAqL1xyXG4gICAgZWxlbWVudENyZWF0ZWQgKHhtbEVsZW1lbnQsIHBhcmVudFdyYXBwZXIpIHtcclxuICAgICAgICB2YXIgZWxlbWVudCA9IEVsZW1lbnRNYXBwZXIubWFwKHhtbEVsZW1lbnQsIHBhcmVudFdyYXBwZXIpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZFRvRWxlbWVudElkTWFwKGVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMucmVnaXN0ZXJFbGVtZW50RXZlbnRzKGVsZW1lbnQpO1xyXG5cclxuICAgICAgICBpZih0aGlzLnJvb3RFbGVtZW50ID09PSBudWxsICYmIGVsZW1lbnQgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICByZWdpc3RlckVsZW1lbnRFdmVudHMoZWxlbWVudCl7XHJcbiAgICAgICAgaWYoZWxlbWVudCA9PT0gbnVsbCB8fCBlbGVtZW50ID09PSB1bmRlZmluZWQgfHwgIShlbGVtZW50IGluc3RhbmNlb2YgQmFzZUVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGV2ZW50UmVnaXN0cnkgPSB0aGlzLmV2ZW50UmVnaXN0cnk7XHJcbiAgICAgICAgdmFyIGNvbXBvbmVudEluZGV4ID0gdGhpcy5jb21wb25lbnRJbmRleDtcclxuICAgICAgICBlbGVtZW50LmF0dHJpYnV0ZXMuZm9yRWFjaChmdW5jdGlvbiAoYXR0cmlidXRlS2V5LGF0dHJpYnV0ZSxwYXJlbnQpe1xyXG4gICAgICAgICAgICBpZihhdHRyaWJ1dGUgIT09IG51bGwgJiYgYXR0cmlidXRlICE9PSB1bmRlZmluZWQgJiYgYXR0cmlidXRlLnZhbHVlLnN0YXJ0c1dpdGgoXCIvL2V2ZW50OlwiKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50TmFtZSA9IGF0dHJpYnV0ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIHZhciBldmVudFR5cGUgPSBhdHRyaWJ1dGUubmFtZTtcclxuICAgICAgICAgICAgICAgIGV2ZW50UmVnaXN0cnkuYXR0YWNoKGVsZW1lbnQsZXZlbnRUeXBlLGV2ZW50TmFtZSxjb21wb25lbnRJbmRleCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7ICAgICAgICAgXHJcbiAgICAgICAgfSx0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRUb0VsZW1lbnRJZE1hcChlbGVtZW50KSB7XHJcbiAgICAgICAgaWYoZWxlbWVudCA9PT0gbnVsbCB8fCBlbGVtZW50ID09PSB1bmRlZmluZWQgfHwgIShlbGVtZW50IGluc3RhbmNlb2YgQmFzZUVsZW1lbnQpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGlkID0gbnVsbDtcclxuICAgICAgICBpZihlbGVtZW50LmNvbnRhaW5zQXR0cmlidXRlKFwiaWRcIikpIHtcclxuICAgICAgICAgICAgaWQgPSBlbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwiaWRcIik7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiLHRoaXMudW5pcXVlSWRSZWdpc3RyeS5pZEF0dHJpYnV0ZVdpdGhTdWZmaXgoaWQpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGlkICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudE1hcC5zZXQoaWQsZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQ29udGFpbmVyRnVuY3Rpb25zIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2FudmFzUm9vdCB7XHJcblxyXG4gICAgc3RhdGljIHJlcGxhY2VDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xyXG4gICAgICAgIHZhciBib2R5RWxlbWVudCA9IENvbnRhaW5lckZ1bmN0aW9ucy5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICAgICAgYm9keUVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIGJvZHlFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgc2V0Q29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICB2YXIgYm9keUVsZW1lbnQgPSBDb250YWluZXJGdW5jdGlvbnMuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBib2R5RWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFkZENoaWxkQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICB2YXIgYm9keUVsZW1lbnQgPSBDb250YWluZXJGdW5jdGlvbnMuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYWRkQ2hpbGRFbGVtZW50KGlkLCBlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIGJvZHlFbGVtZW50ID0gQ29udGFpbmVyRnVuY3Rpb25zLmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgICAgICBib2R5RWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVFbGVtZW50KGlkKSB7XHJcbiAgICAgICAgQ29udGFpbmVyRnVuY3Rpb25zLnJlbW92ZUVsZW1lbnQoaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFkZEhlYWRlckVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckZ1bmN0aW9ucy5hZGRIZWFkZXJFbGVtZW50KGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFxyXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYWRkQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckZ1bmN0aW9ucy5hZGRCb2R5RWxlbWVudChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHByZXBlbmRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcclxuICAgICAgICBDb250YWluZXJGdW5jdGlvbnMucHJlcGVuZEhlYWRlckVsZW1lbnQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckZ1bmN0aW9ucy5wcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxufSIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0VsZW1lbnRNYXBwZXJ9IGZyb20gXCIuLi9lbGVtZW50L2VsZW1lbnRNYXBwZXIuanNcIjtcblxuZXhwb3J0IGNsYXNzIEhUTUx7XG5cbiAgICBzdGF0aWMgY3VzdG9tKGVsZW1lbnROYW1lKXtcbiAgICAgICAgdmFyIHhtbEVsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChlbGVtZW50TmFtZSk7XG4gICAgICAgIHJldHVybiBFbGVtZW50TWFwcGVyLm1hcCh4bWxFbGVtZW50KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYXBwbHlTdHlsZXMoZWxlbWVudCxjbGFzc1ZhbHVlLHN0eWxlVmFsdWUpe1xuICAgICAgICBpZihjbGFzc1ZhbHVlICE9PSBudWxsKXtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJjbGFzc1wiLGNsYXNzVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHN0eWxlVmFsdWUgIT09IG51bGwpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcInN0eWxlXCIsc3R5bGVWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYShuYW1lLGhyZWYsY2xhc3NWYWx1ZSxzdHlsZVZhbHVlKXtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIVE1MLmN1c3RvbShcImFcIik7XG4gICAgICAgIGVsZW1lbnQuYWRkQ2hpbGQobmFtZSk7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJocmVmXCIsaHJlZik7XG4gICAgICAgIEhUTUwuYXBwbHlTdHlsZXMoZWxlbWVudCxjbGFzc1ZhbHVlLHN0eWxlVmFsdWUpO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAsIExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDYW52YXNSb290IH0gZnJvbSBcIi4vY2FudmFzUm9vdC5qc1wiO1xyXG5pbXBvcnQgeyBIVE1MIH0gZnJvbSBcIi4uL2h0bWwvaHRtbC5qc1wiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50LmpzXCI7XHJcbmltcG9ydCB7IFRleHRub2RlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L3RleHRub2RlRWxlbWVudC5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNhbnZhc1N0eWxlc1wiKTtcclxuXHJcbmNvbnN0IHN0eWxlcyA9IG5ldyBNYXAoKTtcclxuY29uc3Qgc3R5bGVPd25lcnMgPSBuZXcgTWFwKCk7XHJcbmNvbnN0IGVuYWJsZWRTdHlsZXMgPSBuZXcgTGlzdCgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIENhbnZhc1N0eWxlcyB7XHJcblxyXG4gICAgc3RhdGljIHNldFN0eWxlKG5hbWUsIHNvdXJjZSkge1xyXG4gICAgICAgIGlmKHN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBzdHlsZXMuZ2V0KG5hbWUpLnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cclxuICAgICAgICAgICAgbGV0IHN0eWxlRWxlbWVudCA9IEhUTUwuY3VzdG9tKFwic3R5bGVcIik7XHJcbiAgICAgICAgICAgIHN0eWxlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIsbmFtZSk7XHJcbiAgICAgICAgICAgIHN0eWxlRWxlbWVudC5zZXRDaGlsZChuZXcgVGV4dG5vZGVFbGVtZW50KHNvdXJjZS5nZXRTdHlsZXNTb3VyY2UoKSkpO1xyXG4gICAgICAgICAgICBzdHlsZXMuc2V0KG5hbWUsIHN0eWxlRWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVTdHlsZShuYW1lKSB7XHJcbiAgICAgICAgaWYoZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLnJlbW92ZShuYW1lKTtcclxuICAgICAgICAgICAgQ2FudmFzUm9vdC5yZW1vdmVFbGVtZW50KG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgc3R5bGVzLnJlbW92ZShuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGRpc2FibGVTdHlsZShuYW1lLCBvd25lcklkID0gMCkge1xyXG4gICAgICAgIENhbnZhc1N0eWxlcy5yZW1vdmVTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xyXG4gICAgICAgIGlmKENhbnZhc1N0eWxlcy5oYXNTdHlsZU93bmVyKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIXN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJTdHlsZSBkb2VzIG5vdCBleGlzdDogXCIgKyBuYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMucmVtb3ZlKG5hbWUpO1xyXG4gICAgICAgICAgICBDYW52YXNSb290LnJlbW92ZUVsZW1lbnQobmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBlbmFibGVTdHlsZShuYW1lLCBvd25lcklkID0gMCkge1xyXG4gICAgICAgIENhbnZhc1N0eWxlcy5hZGRTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xyXG4gICAgICAgIGlmKCFzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgTE9HLmVycm9yKFwiU3R5bGUgZG9lcyBub3QgZXhpc3Q6IFwiICsgbmFtZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIWVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5hZGQobmFtZSk7XHJcbiAgICAgICAgICAgIENhbnZhc1Jvb3QuYWRkSGVhZGVyRWxlbWVudChzdHlsZXMuZ2V0KG5hbWUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFkZFN0eWxlT3duZXIobmFtZSwgb3duZXJJZCkge1xyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBzdHlsZU93bmVycy5zZXQobmFtZSwgbmV3IExpc3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5nZXQobmFtZSkuY29udGFpbnMob3duZXJJZCkpIHtcclxuICAgICAgICAgICAgc3R5bGVPd25lcnMuZ2V0KG5hbWUpLmFkZChvd25lcklkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZVN0eWxlT3duZXIobmFtZSwgb3duZXJJZCkge1xyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5yZW1vdmUob3duZXJJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGhhc1N0eWxlT3duZXIobmFtZSkge1xyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdHlsZU93bmVycy5nZXQobmFtZSkuc2l6ZSgpID4gMDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudFwiO1xyXG5pbXBvcnQgeyBVbmlxdWVJZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vdW5pcXVlSWRSZWdpc3RyeVwiO1xyXG5pbXBvcnQgeyBFbGVtZW50UmVnaXN0cmF0b3IgfSBmcm9tIFwiLi9lbGVtZW50UmVnaXN0cmF0b3JcIjtcclxuaW1wb3J0IHsgRXZlbnRSZWdpc3RyeSB9IGZyb20gXCIuLi9ldmVudC9ldmVudFJlZ2lzdHJ5XCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeVwiO1xyXG5pbXBvcnQgeyBEb21UcmVlIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xyXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5XCI7XHJcbmltcG9ydCB7IENhbnZhc1N0eWxlcyB9IGZyb20gXCIuLi9jYW52YXMvY2FudmFzU3R5bGVzXCI7XHJcbmltcG9ydCB7IEluamVjdGlvblBvaW50IH0gZnJvbSBcIm1pbmRpX3YxXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29tcG9uZW50RmFjdG9yeVwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtFdmVudFJlZ2lzdHJ5fSAqL1xyXG4gICAgICAgIHRoaXMuZXZlbnRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKEV2ZW50UmVnaXN0cnkpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0eWxlc1JlZ2lzdHJ5fSAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX0gKi9cclxuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShUZW1wbGF0ZVJlZ2lzdHJ5KTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtVbmlxdWVJZFJlZ2lzdHJ5fSAqL1xyXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFVuaXF1ZUlkUmVnaXN0cnkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSByZXByZXNlbnRzIHRoZSB0ZW1wbGF0ZSBhbmQgdGhlIHN0eWxlcyBuYW1lIGlmIHRoZSBzdHlsZSBmb3IgdGhhdCBuYW1lIGlzIGF2YWlsYWJsZVxyXG4gICAgICovXHJcbiAgICBjcmVhdGUobmFtZSl7XHJcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldChuYW1lKTtcclxuICAgICAgICBpZighdGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgTE9HLmVycm9yKHRoaXMudGVtcGxhdGVSZWdpc3RyeSk7XHJcbiAgICAgICAgICAgIHRocm93IFwiTm8gdGVtcGxhdGUgd2FzIGZvdW5kIHdpdGggbmFtZSBcIiArIG5hbWU7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZWxlbWVudFJlZ2lzdHJhdG9yID0gbmV3IEVsZW1lbnRSZWdpc3RyYXRvcih0aGlzLmV2ZW50UmVnaXN0cnksIHRoaXMudW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50Q291bnRlcisrKTtcclxuICAgICAgICBuZXcgRG9tVHJlZSh0ZW1wbGF0ZS5nZXRUZW1wbGF0ZVNvdXJjZSgpLGVsZW1lbnRSZWdpc3RyYXRvcikubG9hZCgpO1xyXG5cclxuICAgICAgICB0aGlzLm1vdW50U3R5bGVzKG5hbWUpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IENvbXBvbmVudChlbGVtZW50UmVnaXN0cmF0b3IuY29tcG9uZW50SW5kZXgsIGVsZW1lbnRSZWdpc3RyYXRvci5yb290RWxlbWVudCwgZWxlbWVudFJlZ2lzdHJhdG9yLmdldEVsZW1lbnRNYXAoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW91bnRTdHlsZXMobmFtZSkge1xyXG4gICAgICAgIGlmKHRoaXMuc3R5bGVzUmVnaXN0cnkuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgQ2FudmFzU3R5bGVzLnNldFN0eWxlKG5hbWUsIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0KG5hbWUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG52YXIgY29tcG9uZW50Q291bnRlciA9IDA7IiwiaW1wb3J0IHsgTG9nZ2VyLCBMaXN0IH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcclxuaW1wb3J0IHsgU2luZ2xldG9uQ29uZmlnLCBQcm90b3R5cGVDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIlxyXG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBFdmVudFJlZ2lzdHJ5IH0gZnJvbSBcIi4vZXZlbnQvZXZlbnRSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBVbmlxdWVJZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vY29tcG9uZW50L3VuaXF1ZUlkUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgQ29tcG9uZW50RmFjdG9yeSB9IGZyb20gXCIuL2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzXCI7XHJcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29uZmlnXCIpO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbmZpZyB7XHJcblxyXG4gICAgc3RhdGljIGdldEluc3RhbmNlKCkge1xyXG4gICAgICAgIHJldHVybiBqdXN0cmlnaHRDb25maWc7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy50eXBlQ29uZmlnTGlzdCA9IG5ldyBMaXN0KFtcclxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVGVtcGxhdGVSZWdpc3RyeSksXHJcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKFN0eWxlc1JlZ2lzdHJ5KSxcclxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVW5pcXVlSWRSZWdpc3RyeSksXHJcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKENvbXBvbmVudEZhY3RvcnkpLFxyXG4gICAgICAgICAgICBQcm90b3R5cGVDb25maWcudW5uYW1lZChFdmVudFJlZ2lzdHJ5KV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICBnZXRUeXBlQ29uZmlnTGlzdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlQ29uZmlnTGlzdDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNvbnN0IGp1c3RyaWdodENvbmZpZyA9IG5ldyBDb25maWcoKTsiLCJpbXBvcnQgeyBMaXN0LCBMb2dnZXIgfSBmcm9tICBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IE1pbmRpSW5qZWN0b3IsIE1pbmRpQ29uZmlnLCBJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyLCBDb25maWdBY2Nlc3NvciB9IGZyb20gXCJtaW5kaV92MVwiO1xyXG5pbXBvcnQgeyBDb21wb25lbnRDb25maWdQcm9jZXNzb3IgfSBmcm9tIFwiLi9jb21wb25lbnQvY29tcG9uZW50Q29uZmlnUHJvY2Vzc29yLmpzXCI7XHJcbmltcG9ydCB7IE1vZHVsZUxvYWRlciB9IGZyb20gXCIuL2xvYWRlci9tb2R1bGVMb2FkZXIuanNcIjtcclxuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnLmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQXBwbGljYXRpb25cIik7XHJcblxyXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb24ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge0xpc3R9ICovXHJcbiAgICAgICAgdGhpcy53b3JrZXJMaXN0ID0gbmV3IExpc3QoKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xyXG4gICAgICAgIHRoaXMubW9kdWxlTG9hZGVyTGlzdCA9IG5ldyBMaXN0KCk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7TWluZGlDb25maWd9ICovXHJcbiAgICAgICAgdGhpcy5jb25maWcgPSBuZXcgTWluZGlDb25maWcoKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xyXG4gICAgICAgIHRoaXMucnVubmluZ1dvcmtlcnMgPSBuZXcgTGlzdCgpO1xyXG5cclxuICAgICAgICB0aGlzLmNvbmZpZ1xyXG4gICAgICAgICAgICAuYWRkQWxsVHlwZUNvbmZpZyhDb25maWcuZ2V0SW5zdGFuY2UoKS5nZXRUeXBlQ29uZmlnTGlzdCgpKVxyXG4gICAgICAgICAgICAuYWRkQWxsQ29uZmlnUHJvY2Vzc29yKG5ldyBMaXN0KFsgQ29tcG9uZW50Q29uZmlnUHJvY2Vzc29yIF0pKVxyXG4gICAgICAgICAgICAuYWRkQWxsSW5zdGFuY2VQcm9jZXNzb3IobmV3IExpc3QoWyBJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyIF0pKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRBbGxUeXBlQ29uZmlnKHR5cGVDb25maWdMaXN0KSB7XHJcbiAgICAgICAgdGhpcy5jb25maWcuYWRkQWxsVHlwZUNvbmZpZyh0eXBlQ29uZmlnTGlzdCk7XHJcbiAgICB9XHJcblxyXG4gICAgcnVuKCkge1xyXG4gICAgICAgIHRoaXMuZ2V0TWF0Y2hpbmdNb2R1bGVMb2FkZXIoKS5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5zdGFydFdvcmtlcnMoKTtcclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlTWF0Y2hpbmdNb2R1bGUoKSB7XHJcbiAgICAgICAgdGhpcy5nZXRNYXRjaGluZ01vZHVsZUxvYWRlcigpLmRlZmF1bHRJbnN0YW5jZS5sb2FkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRXb3JrZXJzKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmdXb3JrZXJzLnNpemUoKSA+IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndvcmtlckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IHZhbHVlKCk7XHJcbiAgICAgICAgICAgIE1pbmRpSW5qZWN0b3IuaW5qZWN0KGluc3RhbmNlLCB0aGlzLmNvbmZpZyk7XHJcbiAgICAgICAgICAgIHRoaXMucnVubmluZ1dvcmtlcnMuYWRkKGluc3RhbmNlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7TW9kdWxlTG9hZGVyfVxyXG4gICAgICovXHJcbiAgICBnZXRNYXRjaGluZ01vZHVsZUxvYWRlcigpIHtcclxuICAgICAgICBsZXQgZm91bmRNb2R1bGVMb2FkZXIgPSBudWxsO1xyXG4gICAgICAgIHRoaXMubW9kdWxlTG9hZGVyTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKHZhbHVlLm1hdGNoZXMoKSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRNb2R1bGVMb2FkZXIgPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICByZXR1cm4gZm91bmRNb2R1bGVMb2FkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byBkZXBlbmRlbmN5IGluamVjdGlvbiBjb25maWdcclxuICAgICAqL1xyXG4gICAgd2luZG93RGlDb25maWcoKSB7XHJcbiAgICAgICAgd2luZG93LmRpQ29uZmlnID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBMT0cuaW5mbyh0aGlzLmNvbmZpZy5jb25maWdFbnRyaWVzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byB0ZW1wbGF0ZSByZWdpc3RyeVxyXG4gICAgICovXHJcbiAgICB3aW5kb3dUZW1wbGF0ZVJlZ2lzdHJ5KCkge1xyXG4gICAgICAgIHdpbmRvdy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBMT0cuaW5mbyhDb25maWdBY2Nlc3Nvci5pbnN0YW5jZUhvbGRlcihUZW1wbGF0ZVJlZ2lzdHJ5Lm5hbWUsIHRoaXMuY29uZmlnKS5pbnN0YW5jZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlIGdsb2JhbCBhY2Nlc3MgdG8gc3R5bGUgcmVnaXN0cnlcclxuICAgICAqL1xyXG4gICAgd2luZG93U3R5bGVSZWdpc3RyeSgpIHtcclxuICAgICAgICB3aW5kb3cuc3R5bGVSZWdpc3RyeSA9ICgpID0+IHtcclxuICAgICAgICAgICAgTE9HLmluZm8oQ29uZmlnQWNjZXNzb3IuaW5zdGFuY2VIb2xkZXIoU3R5bGVzUmVnaXN0cnkubmFtZSwgdGhpcy5jb25maWcpLmluc3RhbmNlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgUHJvcGVydHlBY2Nlc3NvciwgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdElucHV0RWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Fic3RyYWN0SW5wdXRFbGVtZW50XCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJJbnB1dEVsZW1lbnREYXRhQmluZGluZ1wiKTtcblxuZXhwb3J0IGNsYXNzIElucHV0RWxlbWVudERhdGFCaW5kaW5nIHtcblxuICAgIGNvbnN0cnVjdG9yKG1vZGVsLCB2YWxpZGF0b3IpIHtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLnZhbGlkYXRvciA9IHZhbGlkYXRvcjtcbiAgICAgICAgdGhpcy5wdWxsZXJzID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5wdXNoZXJzID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbGluayhtb2RlbCwgdmFsaWRhdG9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5wdXRFbGVtZW50RGF0YUJpbmRpbmcobW9kZWwsIHZhbGlkYXRvcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdElucHV0RWxlbWVudH0gZmllbGQgXG4gICAgICovXG4gICAgYW5kKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvKGZpZWxkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmaWVsZCBcbiAgICAgKi9cbiAgICB0byhmaWVsZCkge1xuICAgICAgICBjb25zdCBwdWxsZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbW9kZWxWYWx1ZSA9IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgZmllbGQubmFtZSk7XG4gICAgICAgICAgICBpZiAobW9kZWxWYWx1ZSAhPT0gZmllbGQudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBQcm9wZXJ0eUFjY2Vzc29yLnNldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUsIGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnZhbGlkYXRvciAmJiB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZSl7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0b3IudmFsaWRhdGUoZmllbGQudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBmaWVsZC5hdHRhY2hFdmVudChcIm9uY2hhbmdlXCIsIHB1bGxlcik7XG4gICAgICAgIGZpZWxkLmF0dGFjaEV2ZW50KFwib25rZXl1cFwiLCBwdWxsZXIpO1xuICAgICAgICBwdWxsZXIuY2FsbCgpO1xuXG4gICAgICAgIGNvbnN0IHB1c2hlciA9ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBtb2RlbFZhbHVlID0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lKTtcbiAgICAgICAgICAgIGlmIChtb2RlbFZhbHVlICE9PSBmaWVsZC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGZpZWxkLnZhbHVlID0gbW9kZWxWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnZhbGlkYXRvciAmJiB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZVNpbGVudCAmJiBmaWVsZC52YWx1ZSl7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0b3IudmFsaWRhdGVTaWxlbnQoZmllbGQudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBjaGFuZ2VkRnVuY3Rpb25OYW1lID0gXCJfX2NoYW5nZWRfXCIgKyBmaWVsZC5uYW1lLnJlcGxhY2UoXCIuXCIsXCJfXCIpO1xuICAgICAgICBpZiAoIXRoaXMubW9kZWxbY2hhbmdlZEZ1bmN0aW9uTmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMubW9kZWxbY2hhbmdlZEZ1bmN0aW9uTmFtZV0gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnB1bGxlcnMuYWRkKHB1bGxlcik7XG4gICAgICAgIHRoaXMucHVzaGVycy5hZGQocHVzaGVyKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBwdWxsKCkge1xuICAgICAgICB0aGlzLnB1bGxlcnMuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbChwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIHB1c2goKSB7XG4gICAgICAgIHRoaXMucHVzaGVycy5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFByb3h5T2JqZWN0RmFjdG9yeSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGEgcHJveHkgZm9yIGFuIG9iamVjdCB3aGljaCBhbGxvd3MgZGF0YWJpbmRpbmcgZnJvbSB0aGUgb2JqZWN0IHRvIHRoZSBmb3JtIGVsZW1lbnRcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNyZWF0ZVByb3h5T2JqZWN0KG9iamVjdCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJveHkob2JqZWN0LCB7XHJcbiAgICAgICAgICAgIHNldDogKHRhcmdldCwgcHJvcCwgdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBzdWNjZXNzID0gKHRhcmdldFtwcm9wXSA9IHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uTmFtZSA9IFwiX19jaGFuZ2VkX1wiICsgcHJvcDtcclxuICAgICAgICAgICAgICAgIGxldCBjaGFuZ2VkRnVuY3Rpb24gPSB0YXJnZXRbY2hhbmdlZEZ1bmN0aW9uTmFtZV07XHJcbiAgICAgICAgICAgICAgICBpZihjaGFuZ2VkRnVuY3Rpb24gJiYgdHlwZW9mIGNoYW5nZWRGdW5jdGlvbiA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJvdW5kQ2hhbmdlZEZ1bmN0aW9uID0gY2hhbmdlZEZ1bmN0aW9uLmJpbmQodGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgICAgICBib3VuZENoYW5nZWRGdW5jdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MgPT09IHZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuLyoqXHJcbiAqIE9iamVjdCBGdW5jdGlvbiB3aGljaCBpcyBjYWxsZWQgaWYgdGhlIGZpbHRlciBmdW5jdGlvbiByZXR1cm5zIHRydWVcclxuICovXHJcbmV4cG9ydCBjbGFzcyBFdmVudEZpbHRlcmVkT2JqZWN0RnVuY3Rpb24gZXh0ZW5kcyBPYmplY3RGdW5jdGlvbiB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb250cnVjdG9yXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBvYmplY3RGdW5jdGlvbiBcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRoZUZpbHRlciBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Iob2JqZWN0RnVuY3Rpb24sIGZpbHRlcil7XHJcbiAgICAgICAgdGhpcy5vYmplY3RGdW5jdGlvbiA9IG9iamVjdEZ1bmN0aW9uO1xyXG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xyXG4gICAgfVxyXG5cclxuICAgIGNhbGwocGFyYW1zKXtcclxuICAgICAgICBpZih0aGlzLmZpbHRlciAmJiB0aGlzLmZpbHRlci5jYWxsKHRoaXMscGFyYW1zKSkge1xyXG4gICAgICAgICAgICB0aGlzLm9iamVjdEZ1bmN0aW9uLmNhbGwocGFyYW1zKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcclxuaW1wb3J0IHsgTWluZGlDb25maWcsIE1pbmRpSW5qZWN0b3IgfSBmcm9tIFwibWluZGlfdjFcIjtcclxuaW1wb3J0IHsgTW9kdWxlTG9hZGVyIH0gZnJvbSBcIi4vbW9kdWxlTG9hZGVyLmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRGlNb2R1bGVMb2FkZXJcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgRGlNb2R1bGVMb2FkZXIgZXh0ZW5kcyBNb2R1bGVMb2FkZXIge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge01pbmRpQ29uZmlnfSBjb25maWdcclxuICAgICAqIEBwYXJhbSB7UmVnRXhwfSBtYXRjaFBhdGggXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcm9vdFBhdGggXHJcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbW9kdWxlUGF0aCBcclxuICAgICAqIEBwYXJhbSB7QXJyYXk8TG9hZGVyRmlsdGVyPn0gbG9hZGVyRmlsdGVycyBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBtYXRjaFBhdGgsIHJvb3RQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJGaWx0ZXJzID0gW10pIHtcclxuICAgICAgICBzdXBlcihtYXRjaFBhdGgsIHJvb3RQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJGaWx0ZXJzKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtNaW5kaUNvbmZpZ30gKi9cclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcclxuICAgIH1cclxuXHJcbiAgICBsb2FkKHJvb3RQYXRoKSB7XHJcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcztcclxuICAgICAgICBpZiAoIXBhcmVudC5maWx0ZXJzUGFzcygpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFwYXJlbnQuZGVmYXVsdEluc3RhbmNlKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5pbXBvcnRNb2R1bGUoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5kZWZhdWx0SW5zdGFuY2UubG9hZChyb290UGF0aCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5kZWZhdWx0SW5zdGFuY2UubG9hZChyb290UGF0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge01vZHVsZUxvYWRlcn0gbW9kdWxlTG9hZGVyXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgaW1wb3J0TW9kdWxlKCkge1xyXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXM7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIHN1cGVyLmltcG9ydE1vZHVsZSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcuYWRkQWxsVHlwZUNvbmZpZyhwYXJlbnQuZGVmYXVsdEluc3RhbmNlLnR5cGVDb25maWdMaXN0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmZpbmFsaXplKCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgTWluZGlJbmplY3Rvci5pbmplY3QocGFyZW50LmRlZmF1bHRJbnN0YW5jZSwgdGhpcy5jb25maWcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSHR0cFJlc3BvbnNlSGFuZGxlciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb2RlIFxyXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gb2JqZWN0RnVuY3Rpb24gXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtYXBwZXJGdW5jdGlvbiBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY29kZSwgb2JqZWN0RnVuY3Rpb24sIG1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZTtcclxuICAgICAgICB0aGlzLm9iamVjdEZ1bmN0aW9uID0gb2JqZWN0RnVuY3Rpb247XHJcbiAgICAgICAgdGhpcy5tYXBwZXJGdW5jdGlvbiA9IG1hcHBlckZ1bmN0aW9uO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IE1hcCwgT2JqZWN0RnVuY3Rpb24sIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBIdHRwUmVzcG9uc2VIYW5kbGVyIH0gZnJvbSBcIi4vaHR0cFJlc3BvbnNlSGFuZGxlclwiO1xyXG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkh0dHBDYWxsQnVpbGRlclwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBIdHRwQ2FsbEJ1aWxkZXIge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtZXRlciBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IodXJsLCBwYXJhbXRlcikge1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLnVybCA9IHVybDtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3R9ICovXHJcbiAgICAgICAgdGhpcy5wYXJhbXRlciA9IHBhcmFtdGVyO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cclxuICAgICAgICB0aGlzLmh0dHBDYWxsYmFja01hcCA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cclxuICAgICAgICB0aGlzLmVycm9yQ2FsbGJhY2sgPSBudWxsO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUgPSA0MDAwO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cclxuICAgICAgICB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlID0gNDAwMDtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtmdW5jdGlvbn0gKi9cclxuICAgICAgICB0aGlzLmVycm9yTWFwcGVyRnVuY3Rpb24gPSBudWxsO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLmF1dGhvcml6YXRpb24gPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge0NsaWVudH0gY2xpZW50IFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbWV0ZXIgXHJcbiAgICAgKiBAcmV0dXJucyB7SHR0cENhbGxCdWlsZGVyfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbmV3SW5zdGFuY2UoY2xpZW50LCB1cmwsIHBhcmFtZXRlcikge1xyXG4gICAgICAgIHJldHVybiBuZXcgSHR0cENhbGxCdWlsZGVyKGNsaWVudCwgdXJsLCBwYXJhbWV0ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY29kZSBcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3QgXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1hcHBlckZ1bmN0aW9uIG1hcHBlciBmdW5jdGlvbiB0byBwYXNzIHRoZSByZXN1bHQgb2JqZWN0IHRvXHJcbiAgICAgKi9cclxuICAgIHJlc3BvbnNlTWFwcGluZyhjb2RlLCBvYmplY3QsIGNhbGxiYWNrLCBtYXBwZXJGdW5jdGlvbikge1xyXG4gICAgICAgIHRoaXMuaHR0cENhbGxiYWNrTWFwLnNldChjb2RlLCBuZXcgSHR0cFJlc3BvbnNlSGFuZGxlcihjb2RlLCBuZXcgT2JqZWN0RnVuY3Rpb24ob2JqZWN0LCBjYWxsYmFjayksIG1hcHBlckZ1bmN0aW9uKSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3QgXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGVycm9yTWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cclxuICAgICAqL1xyXG4gICAgZXJyb3JNYXBwaW5nKG9iamVjdCwgY2FsbGJhY2ssIGVycm9yTWFwcGVyRnVuY3Rpb24gPSBudWxsKSB7XHJcbiAgICAgICAgaWYob2JqZWN0ICYmIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvck1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yTWFwcGVyRnVuY3Rpb24gPSBlcnJvck1hcHBlckZ1bmN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JDYWxsYmFjayA9IG5ldyBPYmplY3RGdW5jdGlvbihvYmplY3QsIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpemF0aW9uIFxyXG4gICAgICovXHJcbiAgICBhdXRob3JpemF0aW9uSGVhZGVyKGF1dGhvcml6YXRpb24pIHtcclxuICAgICAgICB0aGlzLmF1dGhvcml6YXRpb24gPSBcIkJlYXJlciBcIiArIGF1dGhvcml6YXRpb247XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgY29ubmVjdGlvblRpbWVvdXQoY29ubmVjdGlvblRpbWVvdXRWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSA9IGNvbm5lY3Rpb25UaW1lb3V0VmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzcG9uc2VUaW1lb3V0KHJlc3BvbnNlVGltZW91dFZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSA9IHJlc3BvbnNlVGltZW91dFZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCgpIHtcclxuICAgICAgICBDbGllbnQuZ2V0KHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHBvc3QoKSB7XHJcbiAgICAgICAgQ2xpZW50LnBvc3QodGhpcy51cmwsIHRoaXMucGFyYW10ZXIsIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSwgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSwgdGhpcy5hdXRob3JpemF0aW9uKS50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXNwb25zZShyZXNwb25zZSk7XHJcbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0Vycm9yKGVycm9yKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdXQoKSB7XHJcbiAgICAgICAgQ2xpZW50LnB1dCh0aGlzLnVybCwgdGhpcy5wYXJhbXRlciwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHBhdGNoKCkge1xyXG4gICAgICAgIENsaWVudC5wYXRjaCh0aGlzLnVybCwgdGhpcy5wYXJhbXRlciwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGRlbGV0ZSgpIHtcclxuICAgICAgICBDbGllbnQuZGVsZXRlKHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NFcnJvcihlcnJvcikge1xyXG4gICAgICAgIExPRy5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgaWYodGhpcy5lcnJvckNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuZXJyb3JNYXBwZXJGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgZXJyb3IgPSB0aGlzLmVycm9yTWFwcGVyRnVuY3Rpb24uY2FsbCh0aGlzLCBlcnJvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lcnJvckNhbGxiYWNrLmNhbGwoZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtSZXNwb25zZX0gcmVzcG9uc2UgXHJcbiAgICAgKi9cclxuICAgIHByb2Nlc3NSZXNwb25zZShyZXNwb25zZSkge1xyXG4gICAgICAgIC8qKiBAdHlwZSB7SHR0cFJlc3BvbnNlSGFuZGxlcn0gKi9cclxuICAgICAgICB2YXIgcmVzcG9uc2VIYW5kbGVyID0gdGhpcy5odHRwQ2FsbGJhY2tNYXAuZ2V0KHJlc3BvbnNlLnN0YXR1cyk7XHJcbiAgICAgICAgaWYocmVzcG9uc2VIYW5kbGVyKSB7XHJcbiAgICAgICAgICAgIGlmKHJlc3BvbnNlSGFuZGxlci5tYXBwZXJGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuanNvbigpLnRoZW4oXHJcbiAgICAgICAgICAgICAgICAgICAgKG9iamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFwcGVyRnVuY3Rpb24gPSByZXNwb25zZUhhbmRsZXIubWFwcGVyRnVuY3Rpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZUhhbmRsZXIub2JqZWN0RnVuY3Rpb24uY2FsbChtYXBwZXJGdW5jdGlvbihvYmplY3QpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlSGFuZGxlci5vYmplY3RGdW5jdGlvbi5jYWxsKG9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIChmYWlsUmVhc29uKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZUhhbmRsZXIub2JqZWN0RnVuY3Rpb24uY2FsbCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQWJzdHJhY3RWYWxpZGF0b3JcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0N1cnJlbnRseVZhbGlkXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGN1cnJlbnRseVZhbGlkID0gZmFsc2UsIGVuYWJsZWQgPSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy52YWxpZExpc3RlbmVyTGlzdCA9IG5ldyBMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0ID0gbmV3IExpc3QoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gY3VycmVudGx5VmFsaWQ7XHJcbiAgICAgICAgdGhpcy5lbmFibGVkID0gZW5hYmxlZDtcclxuICAgIH1cclxuXHJcbiAgICBlbmFibGUoKSB7XHJcbiAgICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkpIHtcclxuICAgICAgICAgICAgdGhpcy52YWxpZCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkaXNhYmxlKCkge1xyXG4gICAgICAgIGxldCB3YXNWYWxpZCA9IHRoaXMuY3VycmVudGx5VmFsaWQ7XHJcbiAgICAgICAgLy8gRmFrZSB2YWxpZFxyXG4gICAgICAgIHRoaXMudmFsaWQoKTtcclxuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gd2FzVmFsaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaXNWYWxpZCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudGx5VmFsaWQ7XHJcbiAgICB9XHJcblxyXG5cdHZhbGlkKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgaWYoIXRoaXMudmFsaWRMaXN0ZW5lckxpc3QpIHtcclxuICAgICAgICAgICAgTE9HLndhcm4oXCJObyB2YWxpZGF0aW9uIGxpc3RlbmVyc1wiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnZhbGlkTGlzdGVuZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgdmFsdWUuY2FsbCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHR9XHJcblxyXG5cdGludmFsaWQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgaWYoIXRoaXMuaW52YWxpZExpc3RlbmVyTGlzdCkge1xyXG4gICAgICAgICAgICBMT0cud2FybihcIk5vIGludmFsaWRhdGlvbiBsaXN0ZW5lcnNcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgdmFsdWUuY2FsbCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHR9XHJcblxyXG5cdHZhbGlkU2lsZW50KCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB0cnVlO1xyXG5cdH1cclxuXHJcblx0aW52YWxpZFNpbGVudCgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gZmFsc2U7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBcclxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSB2YWxpZExpc3RlbmVyIFxyXG5cdCAqL1xyXG5cdHdpdGhWYWxpZExpc3RlbmVyKHZhbGlkTGlzdGVuZXIpIHtcclxuXHRcdHRoaXMudmFsaWRMaXN0ZW5lckxpc3QuYWRkKHZhbGlkTGlzdGVuZXIpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBcclxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBpbnZhbGlkTGlzdGVuZXIgXHJcblx0ICovXHJcblx0d2l0aEludmFsaWRMaXN0ZW5lcihpbnZhbGlkTGlzdGVuZXIpIHtcclxuXHRcdHRoaXMuaW52YWxpZExpc3RlbmVyTGlzdC5hZGQoaW52YWxpZExpc3RlbmVyKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgTGlzdCwgT2JqZWN0RnVuY3Rpb24gfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0VmFsaWRhdG9yLmpzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBBbmRWYWxpZGF0b3JTZXQgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaXNWYWxpZEZyb21TdGFydCA9IGZhbHNlKSB7XHJcbiAgICAgICAgc3VwZXIoaXNWYWxpZEZyb21TdGFydCk7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0ID0gbmV3IExpc3QoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RWYWxpZGF0b3J9IHZhbGlkYXRvclxyXG4gICAgICovXHJcbiAgICB3aXRoVmFsaWRhdG9yKHZhbGlkYXRvcikge1xyXG4gICAgICAgIHZhbGlkYXRvci53aXRoVmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVWYWxpZCkpO1xyXG4gICAgICAgIHZhbGlkYXRvci53aXRoSW52YWxpZExpc3RlbmVyKG5ldyBPYmplY3RGdW5jdGlvbih0aGlzLCB0aGlzLm9uZUludmFsaWQpKTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuYWRkKHZhbGlkYXRvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbmUgdmFsaWRhdG9yIHNhaWQgaXQgd2FzIHZhbGlkXHJcbiAgICAgKi9cclxuICAgIG9uZVZhbGlkKCkge1xyXG4gICAgICAgIGxldCBmb3VuZEludmFsaWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKCF2YWx1ZS5pc1ZhbGlkKCkpIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kSW52YWxpZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgaWYoIWZvdW5kSW52YWxpZCkge1xyXG4gICAgICAgICAgICBzdXBlci52YWxpZCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbmUgdmFsaWRhdG9yIHNhaWQgaXQgd2FzIGludmFsaWRcclxuICAgICAqL1xyXG4gICAgb25lSW52YWxpZCgpIHtcclxuICAgICAgICBzdXBlci5pbnZhbGlkKCk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVnZXhWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgcmVnZXggPSBcIiguKilcIikge1xyXG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XHJcblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcclxuICAgICAgICB0aGlzLnJlZ2V4ID0gcmVnZXg7XHJcbiAgICB9XHJcblxyXG5cdHZhbGlkYXRlKHZhbHVlKXtcclxuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUubWF0Y2godGhpcy5yZWdleCkpe1xyXG5cdCAgICBcdHRoaXMudmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmKCF2YWx1ZSAmJiAhdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0XHR0aGlzLnZhbGlkKCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5pbnZhbGlkKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcclxuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUubWF0Y2godGhpcy5yZWdleCkpe1xyXG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmKCF2YWx1ZSAmJiAhdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0XHR0aGlzLnZhbGlkU2lsZW50KCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcclxuXHJcbmNvbnN0IEVNQUlMX0ZPUk1BVCA9IC9eXFx3KyhbXFwuLV0/XFx3KykqQFxcdysoW1xcLi1dP1xcdyspKihcXC5cXHd7MiwzfSkrJC87XHJcblxyXG5leHBvcnQgY2xhc3MgRW1haWxWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xyXG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgRU1BSUxfRk9STUFUKTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xyXG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEVxdWFsc0Z1bmN0aW9uUmVzdWx0VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG5cclxuXHQvKipcclxuXHQgKiBcclxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcclxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGlzY3VycmVudGx5VmFsaWQgXHJcblx0ICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxyXG5cdCAqL1xyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgY29tcGFyZWRWYWx1ZUZ1bmN0aW9uID0gbnVsbCkge1xyXG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XHJcblxyXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xyXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XHJcblxyXG5cdFx0LyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cclxuXHRcdHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uID0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uO1xyXG5cdH1cclxuXHJcblx0dmFsaWRhdGUodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gdGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24uY2FsbCgpKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcclxuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uLmNhbGwoKSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcclxuaW1wb3J0IHsgT2JqZWN0RnVuY3Rpb24sIFByb3BlcnR5QWNjZXNzb3IgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFcXVhbHNQcm9wZXJ0eVZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcblx0LyoqXHJcblx0ICogXHJcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXHJcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxyXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGNvbXBhcmVkVmFsdWVGdW5jdGlvbiBcclxuXHQgKi9cclxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIG1vZGVsID0gbnVsbCwgYXR0cmlidXRlTmFtZSA9IG51bGwpIHtcclxuXHRcdHN1cGVyKGlzY3VycmVudGx5VmFsaWQpO1xyXG5cclxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cclxuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xyXG5cclxuXHRcdC8qKiBAdHlwZSB7b2JqZWN0fSAqL1xyXG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBcclxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGVOYW1lO1xyXG5cdH1cclxuXHJcblx0dmFsaWRhdGUodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCB0aGlzLmF0dHJpYnV0ZU5hbWUpKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcclxuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgdGhpcy5hdHRyaWJ1dGVOYW1lKSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcclxuaW1wb3J0IHsgT2JqZWN0RnVuY3Rpb24sIFByb3BlcnR5QWNjZXNzb3IgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFcXVhbHNTdHJpbmdWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIFxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gbWFuZGF0b3J5IFxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcclxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXHJcblx0ICovXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBjb250cm9sVmFsdWUgPSBudWxsKSB7XHJcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcclxuXHJcblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXHJcblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XHJcblx0fVxyXG5cclxuXHR2YWxpZGF0ZSh2YWx1ZSl7XHJcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xyXG5cdCAgICBcdHRoaXMudmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gY29udHJvbFZhbHVlKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgTGlzdCwgT2JqZWN0RnVuY3Rpb24gfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0VmFsaWRhdG9yLmpzJ1xyXG5cclxuZXhwb3J0IGNsYXNzIE9yVmFsaWRhdG9yU2V0IGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3Rvcihpc1ZhbGlkRnJvbVN0YXJ0ID0gZmFsc2UpIHtcclxuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QgPSBuZXcgTGlzdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdFZhbGlkYXRvcn0gdmFsaWRhdG9yXHJcbiAgICAgKi9cclxuICAgIHdpdGhWYWxpZGF0b3IodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgdmFsaWRhdG9yLndpdGhWYWxpZExpc3RlbmVyKG5ldyBPYmplY3RGdW5jdGlvbih0aGlzLCB0aGlzLm9uZVZhbGlkKSk7XHJcbiAgICAgICAgdmFsaWRhdG9yLndpdGhJbnZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lSW52YWxpZCkpO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgdmFsaWRcclxuICAgICAqL1xyXG4gICAgb25lVmFsaWQoKSB7XHJcbiAgICAgICAgc3VwZXIudmFsaWQoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxyXG4gICAgICovXHJcbiAgICBvbmVJbnZhbGlkKCkge1xyXG4gICAgICAgIGxldCBmb3VuZFZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0LmZvckVhY2goKHZhbHVlLHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZih2YWx1ZS5pc1ZhbGlkKCkpIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kVmFsaWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIGlmKGZvdW5kVmFsaWQpIHtcclxuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzdXBlci5pbnZhbGlkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcclxuXHJcbmNvbnN0IFBBU1NXT1JEX0ZPUk1BVCA9IC9eKD89LipbQS1aYS16XSkoPz0uKj9bMC05XSkoPz0uKj9bIz8hQCQlXiYqLV0pLns4LH0kLztcclxuXHJcbmV4cG9ydCBjbGFzcyBQYXNzd29yZFZhbGlkYXRvciBleHRlbmRzIFJlZ2V4VmFsaWRhdG9yIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XHJcbiAgICAgICAgc3VwZXIobWFuZGF0b3J5LCBpc2N1cnJlbnRseVZhbGlkLCBQQVNTV09SRF9GT1JNQVQpO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBSZWdleFZhbGlkYXRvciB9IGZyb20gXCIuL3JlZ2V4VmFsaWRhdG9yLmpzXCI7XHJcblxyXG5jb25zdCBQSE9ORV9GT1JNQVQgPSAvXlxcK1swLTldezJ9XFxzPyhbMC05XVxccz8pKiQvO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBob25lVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UpIHtcclxuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIFBIT05FX0ZPUk1BVCk7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZXF1aXJlZFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcblx0Y29uc3RydWN0b3IoY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgZW5hYmxlZCA9IHRydWUpIHtcclxuXHRcdHN1cGVyKGN1cnJlbnRseVZhbGlkLCBlbmFibGVkKTtcclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlKHZhbHVlKXtcclxuXHRcdGlmKHZhbHVlID09PSBcIlwiKXtcclxuXHQgICAgXHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMudmFsaWQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcclxuXHRcdGlmKHZhbHVlID09PSBcIlwiKXtcclxuXHQgICAgXHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMudmFsaWRTaWxlbnQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiJdLCJuYW1lcyI6WyJDb250YWluZXJGdW5jdGlvbnMiLCJMaXN0IiwiTWFwIiwiTG9nZ2VyIiwiTE9HIiwiSW5qZWN0aW9uUG9pbnQiLCJYbWxFbGVtZW50IiwiWG1sQ2RhdGEiLCJEb21UcmVlIiwiU2luZ2xldG9uQ29uZmlnIiwiUHJvdG90eXBlQ29uZmlnIiwiTWluZGlDb25maWciLCJJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyIiwiTWluZGlJbmplY3RvciIsIkNvbmZpZ0FjY2Vzc29yIiwiUHJvcGVydHlBY2Nlc3NvciIsIk9iamVjdEZ1bmN0aW9uIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRU8sTUFBTSxNQUFNLENBQUM7Ozs7Ozs7SUFPaEIsT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLGlCQUFpQixHQUFHLElBQUksRUFBRSxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzdELElBQUksTUFBTSxJQUFJO1lBQ1YsTUFBTSxFQUFFLEtBQUs7WUFDYixJQUFJLEVBQUUsTUFBTTtZQUNaLFFBQVEsRUFBRSxRQUFRO1VBQ3JCO1FBQ0QsT0FBT0EscUNBQWtCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7S0FDOUY7Ozs7Ozs7O0lBUUQsT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxpQkFBaUIsR0FBRyxJQUFJLEVBQUUsZUFBZSxHQUFHLElBQUksRUFBRSxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBQzFGLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDOUMsSUFBSSxNQUFNLElBQUk7WUFDVixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsT0FBTyxFQUFFLE9BQU87WUFDaEIsTUFBTSxFQUFFLE1BQU07WUFDZCxJQUFJLEVBQUUsTUFBTTtZQUNaLFFBQVEsRUFBRSxRQUFRO1VBQ3JCO1FBQ0QsT0FBT0EscUNBQWtCLENBQUMsS0FBSyxD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

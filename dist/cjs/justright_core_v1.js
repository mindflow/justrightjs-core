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
                    get: function () {
                        return e[k];
                    }
                });
            }
        });
    }
    n['default'] = e;
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

class History {

    static replaceUrl(url, title, stateObject) {
        containerbridge_v1.ContainerUrl.replaceUrl(url.toString(), title, stateObject);
    }

    static pushUrl(url, title, stateObject) {
        containerbridge_v1.ContainerUrl.pushUrl(url.toString(), title, stateObject);
    }

    static currentUrl() {
        return new Url(containerbridge_v1.ContainerUrl.currentUrl());
    }

}

let navigatoion = null;

class Navigation {

    constructor() {

    }

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
        ContainerUrl.go(url.toString());
    }

    /**
     * Navigate browser back
     */
    back() {
        ContainerUrl.back();
    }

    /**
     * Load path without renavigating browser
     * @param {string} path
     * @returns {Url}
     */
    load(path) {
        const url = History.currentUrl();
        url.determinePath(path);
        History.pushUrl(url);
        return url;
    }

}

let activeModuleRunner = null;

class ActiveModuleRunner {

    constructor() {

        /** @type {ModuleRunner} */
        this.moduleRunner = null;
    }

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
     load(path) {
        const url = Navigation.instance().load(path);
        this.moduleRunner.runModule(url);
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

const LOG$5 = new coreutil_v1.Logger("BaseElement");

/**
 * A base class for enclosing an HTMLElement
 */
class BaseElement {

    /**
     * Constructor
     *
     * @param {XmlElement|string|any} value Value to be converted to Container UI Element (HTMLElement in the case of Web Browser)
     * @param {BaseElement} parent the parent BaseElement
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
            this.element = containerbridge_v1.ContainerElement.createElement(value);
            return;
        }
        if(containerbridge_v1.ContainerElement.isUIElement(value)){
            this.element = value;
            return;
        }
        LOG$5.error("Unrecognized value for Element");
        LOG$5.error(value);
    }

    loadAttributes() {
        if (this.element.attributes === null || this.element.attributes === undefined) {
            this.attributeMap = new coreutil_v1.Map();
            return;
        }
        if (this.attributeMap === null || this.attributeMap === undefined) {
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
            element = containerbridge_v1.ContainerElement.createElementNS(xmlElement.namespaceUri, xmlElement.fullName);
        }else {
            element = containerbridge_v1.ContainerElement.createElement(xmlElement.name);
        }
        if(parentElement && parentElement.mappedElement !== null) {
            containerbridge_v1.ContainerElement.appendChild(parentElement.mappedElement, element);
        }
        xmlElement.attributes.forEach((attributeKey, attribute) => {
            containerbridge_v1.ContainerElement.setAttribute(element, attributeKey, attribute.value);
            return true;
        });
        return element;
    }

    /**
     * Attach a function to an event in the enclosed element if none allready exists
     *
     * @param {string} eventType
     * @param {function} functionParam
     * @param {boolean} capture
     */
    attachEvent(eventType, functionParam, capture = false) {
        if(!this.eventsAttached.contains(eventType)) {
            if(eventType.startsWith("on")) {
                eventType = eventType.substr(2);
            }
            containerbridge_v1.ContainerElement.addEventListener(this.element, eventType, functionParam, capture);
            this.eventsAttached.add(eventType);
        } else {
            LOG$5.warn("Event '" + eventType + "' allready attached for " + this.element.name);
        }
    }

    listenTo(eventType, listener, capture) {
        containerbridge_v1.ContainerElement.addEventListener(this.element, eventType, (event) => {
            listener.call(new Event(event));
        }, capture);
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
        containerbridge_v1.ContainerElement.setAttribute(this.element, key,value);
    }

    getAttributeValue(key) {
        return containerbridge_v1.ContainerElement.getAttribute(this.element, key);
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
            this.element.parentNode.replaceChild(containerbridge_v1.ContainerElement.createTextNode(input), this.element);
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
            this.element.appendChild(containerbridge_v1.ContainerElement.createTextNode(input));
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
            this.element.insertBefore(containerbridge_v1.ContainerElement.createTextNode(input),this.element.firstChild);
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

const LOG$6 = new coreutil_v1.Logger("AbstractInputElement");

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

    /**
     * 
     * @returns {SimpleElement}
     */
    getTarget(){
        if (this.event && this.event.target) {
            return ElementMapper.map(this.event.target);
        }
    }

    /**
     * 
     * @returns {SimpleElement}
     */
    getRelatedTarget(){
        if (this.event && this.event.relatedTarget) {
            return ElementMapper.map(this.event.relatedTarget);
        }
        return null;
    }

    /**
     * 
     * @returns {string}
     */
     getRelatedTargetAttribute(attributeName){
        if (this.event.relatedTarget) {
            return ElementMapper.map(this.event.relatedTarget).getAttributeValue(attributeName);
        }
        return null;
    }

    getTargetValue(){
        if(this.getTarget()) { 
            return this.getTarget().value;
        }
        return null;
    }

    getKeyCode() {
        return this.event.keyCode;
    }

    isKeyCode(code) {
        return this.event.keyCode === code;
    }

}

const LOG$7 = new coreutil_v1.Logger("EventRegistry");

class EventRegistry {

    constructor() {

        /** @type {Map<Map<ObjectFunction>} */
        this.listeners = new coreutil_v1.Map();
    }

    /**
     * Connects elements with the event registry so that events triggered on the element gets distributed to all listeners
     * 
     * @param {BaseElement} element the element which is the source of the event and which can be attached to
     * @param {String} eventType the event type as it is defined by the containing trigger (example "onclick")
     * @param {String} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {String} componentIndex unique id of the component which owns the element
     * @param {boolean} capture 
     */
    attach(element, eventType, eventName, componentIndex, capture = false) {
        const uniqueEventName = eventName + "_" + componentIndex;
        const theEventRegistry = this;
        element.attachEvent(eventType, function(event) {
            theEventRegistry.trigger(uniqueEventName, event); 
        }, capture);
    }

    /**
     * 
     * @param {String} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {ObjectFunction} listener the object which owns the handler function
     * @param {String} uniqueIndex a unique index for the event
     */
    listen(eventName, listener, uniqueIndex) {
        this.initMap(eventName + "_" + uniqueIndex)
            .set(listener.object.constructor.name, listener);
    }

    /**
     * 
     * @param {String} key 
     * @returns {Map<ObjectFunction>}
     */
    initMap(key) {
        if (!this.listeners.exists(key)) {
            this.listeners.set(key,new coreutil_v1.Map());
        }
        return this.listeners.get(key);
    }

    trigger(suffixedEventName, event) {
        if (this.listeners.exists(suffixedEventName)) {
            this.listeners.get(suffixedEventName).forEach((key, value, parent) => {
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

    static shouldSwallowNextFocusEscape = false;

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
     * @param {ObjectFunction} listener
     * @param {BaseElement} focusRoot
     */
    static listenToFocusEscape(listener, focusRoot) {
        
        const callIfNotContains = new coreutil_v1.ObjectFunction(null, (event) => {
            if (containerbridge_v1.ContainerElement.contains(focusRoot.element, event.getTarget().element)) {
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

const LOG$8 = new coreutil_v1.Logger("CanvasStyles");

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
            LOG$8.error("Style does not exist: " + name);
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
            LOG$8.error("Style does not exist: " + name);
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

const LOG$9 = new coreutil_v1.Logger("ComponentFactory");

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
            LOG$9.error(this.templateRegistry);
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

const LOG$a = new coreutil_v1.Logger("Config");

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

const LOG$b = new coreutil_v1.Logger("LoaderInterceptor");

class LoaderInterceptor {

    /**
     * @returns {Boolean}
     */
    process() {
        LOG$b.info("Unimplemented Loader Interceptor breaks by default");
        return false;
    }

}

const LOG$c = new coreutil_v1.Logger("ModuleLoader");

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
            LOG$c.error("Url is null");
            return false;
        }
        return coreutil_v1.StringUtils.nonNullEquals(this.matchPath, url.getPath());
    }

    /**
     * 
     * @returns {Promise<Main>}
     */
    load() {
        return this.importModule().then((main) => {
            return this.interceptorsPass().then(() => {
                return main;
            }).catch((reason) => {
                LOG$c.warn("Filter rejected " + reason);
            });
        });
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

    importModule() {
        return new Promise((resolve, reject) => {
            Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require(this.modulePath)); }).then((module) => {
                resolve(new module.default());
            }).catch((reason) => {
                reject(reason);
            });
        });
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

const LOG$d = new coreutil_v1.Logger("DiModuleLoader");

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
    load() {
        return this.importModule().then((main) => {
            return this.interceptorsPass().then(() => {
                return mindi_v1.MindiInjector.inject(main, this.config);
            }).catch((reason) => {
                LOG$d.warn("Filter rejected " + reason);
                throw reason;
            });
        }).catch((reason) => {
            throw reason;
        });
    }

    /**
     * 
     * @param {ModuleLoader} moduleLoader
     * @returns {Promise}
     */
    importModule() {
        return new Promise((resolve, reject) => {
            return super.importModule().then((main) => {
                this.config.addAllTypeConfig(main.typeConfigList);
                this.config.finalize().then(() => {

                    new coreutil_v1.List(this.loaderInterceptors).promiseChain((loaderInterceptor) => {
                        return mindi_v1.MindiInjector.inject(loaderInterceptor, this.config);
                    }).then(() => {
                        resolve(main);
                    }).catch((error) => {
                        // Failed to inject
                        reject(error);
                    });

                }).catch((error) => {
                    // Failed to finalize config
                    reject(error);
                });

            }).catch((error) => {
                // Failed to import module
                reject(error);
            });
        });
    }
}

const LOG$e = new coreutil_v1.Logger("Application");

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

    run() {
        LOG$e.info("Running Application");
        this.config
            .addAllTypeConfig(this.defaultConfig)
            .addAllTypeConfig(this.customConfig)
            .addAllConfigProcessor(this.defaultConfigProcessors)
            .addAllInstanceProcessor(this.defaultInstanceProcessors);
        ActiveModuleRunner.instance().set(this);
        containerbridge_v1.ContainerUrl.addUserNavigateListener(
            new coreutil_v1.ObjectFunction(this, this.update),
            Event
        );
        this.runModule(History.currentUrl()).then(() => {
            this.startWorkers();
        });
    }

    /**
     * 
     * @param {Event} event
     */
    update(event) {
        const url = History.currentUrl();
        if (this.activeMain && coreutil_v1.StringUtils.nonNullEquals(this.activeMain.path, url.getPath())) {
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
    runModule(url) {
        return this.getMatchingModuleLoader(url).load().then((main) => {
            this.activeMain = main;
            main.load(url, null);
        }).catch((error) => {
            LOG$e.error(error);
        });
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

class TrailNode {

    constructor() {

        /** @type {string} */
        this.path = null;

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
     * 
     * @param {any} object 
     * @param {TrailNode} node 
     * @param {Url} url 
     */
    static load(object, node, url) {
        const trail = TrailProcessor.processNode(object, node, url);

        const currentUrl = History.currentUrl();
        currentUrl.setBookmark(null);
        History.replaceUrl(currentUrl, currentUrl.toString(), trail);
        
        trail.forEach((value) => {
            currentUrl.setBookmark(value);
            History.pushUrl(currentUrl, currentUrl.toString(), trail);
            return true;
        }, this);
    }

    /**
     * 
     * @param {any} object 
     * @param {TrailNode} node 
     * @param {Url} url 
     */
     static update(object, node, url) {
        TrailProcessor.processNode(object, node, url);
    }

    /**
     * 
     * @param {any} object 
     * @param {TrailNode} parentNode 
     * @param {Url} url 
     * @param {List<String>} trailStops
     * @returns {List<String>}
     */
    static processNode(object, parentNode, url, trailStops = new coreutil_v1.List()) {
        let currentObject = object;

        if (parentNode.property) {
            currentObject = object[parentNode.property];
        }

        if (coreutil_v1.StringUtils.startsWith(url.bookmark, TrailProcessor.toStartsWith(parentNode.path))) {
            // Add value.path to history
            trailStops.add(parentNode.path);
            if (parentNode.waypoint) {
                parentNode.waypoint.call(currentObject);
            }
        }
        if (coreutil_v1.StringUtils.nonNullEquals(url.bookmark, parentNode.path)) {
            // Add value.path to history
            trailStops.add(parentNode.path);
            if (parentNode.destination) {
                parentNode.destination.call(currentObject);
            }
        }

        if (parentNode.next) {
            parentNode.next.forEach((childNode) => {
                trailStops = TrailProcessor.processNode(currentObject, childNode, url, trailStops);
            });
        }

        return trailStops;
    }

    static toStartsWith(path) {
        if (null == path) {
            return "/";
        }
        if (coreutil_v1.StringUtils.nonNullEquals(path, "/")) {
            return "/";
        }
        return path + "/";
    }

}

const LOG$g = new coreutil_v1.Logger("HttpCallBuilder");

class HttpCallBuilder {

    /**
     * 
     * @param {string} url 
     * @param {object} payload 
     */
    constructor(url, payload) {

        /** @type {String} */
        this.url = url;

        /** @type {Object} */
        this.payload = payload;

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
     * @param {object} payload 
     * @returns {HttpCallBuilder}
     */
    static newInstance(url, payload) {
        return new HttpCallBuilder(url, payload);
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
        this.authorization = "Bearer " + authorization;
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
    get() {
        return this.asTypeMappedPromise(
            Client.get(this.url, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization)
        );
    }

    /**
     * @returns {Promise}
     */
    post() {
        return this.asTypeMappedPromise(
            Client.post(this.url, this.payload, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization)
        );
    }

    /**
     * @returns {Promise}
     */
    put() {
        return this.asTypeMappedPromise(
            Client.put(this.url, this.payload, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization)
        );
    }

    /**
     * @returns {Promise}
     */
    patch() {
        return this.asTypeMappedPromise(
            Client.patch(this.url, this.payload, this.connectionTimeoutValue, this.responseTimeoutValue, this.authorization)
        );
    }

    /**
     * @returns {Promise}
     */
    delete() {
        return this.asTypeMappedPromise(
            Client.delete(this.url, this.connectionTimeoutValue, this.responseTimeoutValue)
        );
    }

    /**
     * 
     * @param {Promise} fetchPromise 
     */
    asTypeMappedPromise(fetchPromise) {
        return new Promise((resolve,reject) => {
            fetchPromise.then((fetchResponse) => {
                this.handleFetchResponse(fetchResponse, resolve, reject);
            }).catch((error) => {
                // API did not execute
                reject(this.errorMappingFunction(error));
            });
        });
    }

    /**
     * 
     * @param {Response} fetchResponse 
     * @param {function} resolve 
     * @param {function} reject 
     */
    handleFetchResponse(fetchResponse, resolve, reject) {
        const successResponseMapper = this.successMappingMap.get(fetchResponse.status);
        const failResponseMapper = this.failMappingMap.get(fetchResponse.status);

        // Empty response
        if (204 === fetchResponse.status || fetchResponse.headers.get("Content-Length") === "0") {
            if (successResponseMapper) {
                resolve(successResponseMapper(null)); 
                return;
            }
            if(failResponseMapper) {
                reject(failResponseMapper(null)); 
                return;
            }
            reject(new Error("Missing mapper for return status: " + fetchResponse.status));
            return;
        }

        // Assuming json response        
        fetchResponse.json().then((responseJson) => {
            if(successResponseMapper) { 
                resolve(successResponseMapper(responseJson)); 
                return;
            }
            if(failResponseMapper) {
                reject(failResponseMapper(responseJson)); 
                return;
            }
            reject(this.errorMappingFunction(responseJson));
        }).catch((error) => {
            // Response did not provide json
            reject(this.errorMappingFunction(error));
        });
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
exports.ActiveModuleRunner = ActiveModuleRunner;
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
exports.InputElementDataBinding = InputElementDataBinding;
exports.LoaderInterceptor = LoaderInterceptor;
exports.Main = Main;
exports.ModuleLoader = ModuleLoader;
exports.ModuleRunner = ModuleRunner;
exports.Navigation = Navigation;
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
exports.TrailNode = TrailNode;
exports.TrailProcessor = TrailProcessor;
exports.UniqueIdRegistry = UniqueIdRegistry;
exports.Url = Url;
exports.VideoElement = VideoElement;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvbW9kdWxlUnVubmVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL3VybC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi9oaXN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9uYXZpZ2F0aW9uL25hdmlnYXRpb24uanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2FjdGl2ZU1vZHVsZVJ1bm5lci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2xpZW50L2NsaWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3R5bGVzL3N0eWxlcy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC90ZW1wbGF0ZS90ZW1wbGF0ZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdGVtcGxhdGUvdGVtcGxhdGVzTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVzTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb21wb25lbnQvY29tcG9uZW50Q29uZmlnUHJvY2Vzc29yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2F0dHJpYnV0ZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9iYXNlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9yYWRpb0lucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9jaGVja2JveElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRhcmVhSW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRub2RlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9zaW1wbGVFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2Zvcm1FbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3ZpZGVvRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZXZlbnQvZXZlbnRSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L3VuaXF1ZUlkUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9lbGVtZW50UmVnaXN0cmF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNSb290LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9odG1sL2h0bWwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNTdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb25maWcuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2xvYWRlci9sb2FkZXJJbnRlcmNlcHRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbG9hZGVyL21vZHVsZUxvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbWFpbi5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbG9hZGVyL2RpTW9kdWxlTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9hcHBsaWNhdGlvbi5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZGF0YUJpbmQvaW5wdXRFbGVtZW50RGF0YUJpbmRpbmcuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2RhdGFCaW5kL3Byb3h5T2JqZWN0RmFjdG9yeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZXZlbnQvZXZlbnRGaWx0ZXJlZE9iamVjdEZ1bmN0aW9uLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9uYXZpZ2F0aW9uL3RyYWlsTm9kZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi90cmFpbFByb2Nlc3Nvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9odHRwQ2FsbEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9hYnN0cmFjdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2FuZFZhbGlkYXRvclNldC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlZ2V4VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZW1haWxWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNGdW5jdGlvblJlc3VsdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VxdWFsc1Byb3BlcnR5VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzU3RyaW5nVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3Ivb3JWYWxpZGF0b3JTZXQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9wYXNzd29yZFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bob25lbFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlcXVpcmVkVmFsaWRhdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjbGFzcyBNb2R1bGVSdW5uZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICAgcnVuTW9kdWxlKHVybCkge1xuICAgICB9XG5cbn0iLCJpbXBvcnQge0xpc3QsTWFwfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIFVybHtcblxuICAgIGNvbnN0cnVjdG9yKHZhbHVlKXtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaG9zdCA9IG51bGw7XG4gICAgICAgIHRoaXMucG9ydCA9IG51bGw7XG4gICAgICAgIHRoaXMucGF0aExpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5ib29rbWFyayA9IG51bGw7XG4gICAgICAgIGlmKHZhbHVlID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVtYWluaW5nID0gdGhpcy5kZXRlcm1pbmVQcm90b2NvbCh2YWx1ZSk7XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5wcm90b2NvbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZUhvc3QocmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuaG9zdCAhPT0gbnVsbCl7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZVBvcnQocmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUGF0aChyZW1haW5pbmcpO1xuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUGFyYW1ldGVycyhyZW1haW5pbmcpO1xuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGV0ZXJtaW5lQm9va21hcmsocmVtYWluaW5nKTtcbiAgICB9XG5cbiAgICBnZXRQcm90b2NvbCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wcm90b2NvbDtcbiAgICB9XG5cbiAgICBnZXRIb3N0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLmhvc3Q7XG4gICAgfVxuXG4gICAgZ2V0UG9ydCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wb3J0O1xuICAgIH1cblxuICAgIGdldFBhdGhMaXN0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhMaXN0O1xuICAgIH1cblxuICAgIGdldFBhdGhQYXJ0KGluZGV4KXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aExpc3QuZ2V0KGluZGV4KTtcbiAgICB9XG5cbiAgICBnZXRQYXRoKCl7XG4gICAgICAgIGxldCBwYXRoID0gXCIvXCI7XG4gICAgICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgICAgIHRoaXMucGF0aExpc3QuZm9yRWFjaCgodmFsdWUgPT4ge1xuICAgICAgICAgICAgaWYgKCFmaXJzdCkge1xuICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoICsgXCIvXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXRoID0gcGF0aCArIHZhbHVlO1xuICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgfSksdGhpcyk7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIGNsZWFyUGF0aExpc3QoKXtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgZ2V0UGFyYW1ldGVyTWFwKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmFtZXRlck1hcDtcbiAgICB9XG5cbiAgICBjbGVhclBhcmFtZXRlck1BcCgpe1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXRQYXJhbWV0ZXIoa2V5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyTWFwLmdldChrZXkpO1xuICAgIH1cblxuICAgIHNldFBhcmFtZXRlcihrZXksdmFsdWUpe1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcC5zZXQoa2V5LHZhbHVlKTtcbiAgICB9XG5cbiAgICBzZXRCb29rbWFyayhib29rbWFyayl7XG4gICAgICAgIHRoaXMuYm9va21hcmsgPSBib29rbWFyaztcbiAgICB9XG5cbiAgICBzZXRQYXRoKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZGV0ZXJtaW5lUGF0aCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgc2V0UXVlcnlTdHJpbmcodmFsdWUpIHtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAgPSB0aGlzLmRldGVybWluZVBhcmFtZXRlcnModmFsdWUpO1xuICAgIH1cblxuICAgIGdldEJvb2ttYXJrKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmJvb2ttYXJrO1xuICAgIH1cblxuICAgIGRldGVybWluZVByb3RvY29sKHZhbHVlKXtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIi8vXCIpID09PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCIvL1wiKTtcbiAgICAgICAgaWYocGFydHNbMF0uaW5kZXhPZihcIi9cIikgIT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb3RvY29sID0gcGFydHNbMF07XG4gICAgICAgIGlmKHBhcnRzLmxlbmd0aD09MSl7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShwYXJ0c1swXSArIFwiLy9cIixcIlwiKTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVIb3N0KHZhbHVlKXtcbiAgICAgICAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCIvXCIpO1xuICAgICAgICB2YXIgaG9zdFBhcnQgPSBwYXJ0c1swXTtcbiAgICAgICAgaWYoaG9zdFBhcnQuaW5kZXhPZihcIjpcIikgIT09IC0xKXtcbiAgICAgICAgICAgIGhvc3RQYXJ0ID0gaG9zdFBhcnQuc3BsaXQoXCI6XCIpWzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaG9zdCA9IGhvc3RQYXJ0O1xuICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKGhvc3RQYXJ0LFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGRldGVybWluZVBvcnQodmFsdWUpe1xuICAgICAgICBpZighdmFsdWUuc3RhcnRzV2l0aChcIjpcIikpe1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwb3J0UGFydCA9IHZhbHVlLnNwbGl0KFwiL1wiKVswXS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHRoaXMucG9ydCA9IHBvcnRQYXJ0O1xuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShcIjpcIiArIHBvcnRQYXJ0LFwiXCIpO1xuICAgIH1cblxuICAgIGRldGVybWluZVBhdGgodmFsdWUpe1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gdmFsdWU7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCI/XCIpICE9PSAtMSl7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIj9cIik7XG4gICAgICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIj9cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgfSBlbHNlIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSl7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIiNcIik7XG4gICAgICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgfVxuICAgICAgICBpZih2YWx1ZS5zdGFydHNXaXRoKFwiL1wiKSl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGF0aFBhcnRzID0gbmV3IExpc3QodmFsdWUuc3BsaXQoXCIvXCIpKTtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHBhdGhQYXJ0cy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLHBhcmVudCl7XG4gICAgICAgICAgICBwYXJlbnQucGF0aExpc3QuYWRkKGRlY29kZVVSSSh2YWx1ZSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIHJldHVybiByZW1haW5pbmc7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUGFyYW1ldGVycyh2YWx1ZSl7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB2YWx1ZTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIj9cIikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIj9cIikrMSk7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgcmVtYWluaW5nID0gdmFsdWUuc3Vic3RyaW5nKHZhbHVlLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDAsdmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJ0TGlzdCA9IG5ldyBMaXN0KHZhbHVlLnNwbGl0KFwiJlwiKSk7XG4gICAgICAgIHZhciBwYXJhbWV0ZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHBhcnRMaXN0LmZvckVhY2goZnVuY3Rpb24odmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIHZhciBrZXlWYWx1ZSA9IHZhbHVlLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIGlmKGtleVZhbHVlLmxlbmd0aCA+PSAyKXtcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJNYXAuc2V0KGRlY29kZVVSSShrZXlWYWx1ZVswXSksZGVjb2RlVVJJKGtleVZhbHVlWzFdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAgPSBwYXJhbWV0ZXJNYXA7XG4gICAgICAgIHJldHVybiByZW1haW5pbmc7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lQm9va21hcmsodmFsdWUpe1xuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiI1wiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuYm9va21hcmsgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikrMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICB2YXIgdmFsdWUgPSBcIlwiO1xuICAgICAgICBpZih0aGlzLnByb3RvY29sICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyB0aGlzLnByb3RvY29sICsgXCIvL1wiO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuaG9zdCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgdGhpcy5ob3N0O1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMucG9ydCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI6XCIgKyB0aGlzLnBvcnQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhdGhMaXN0LmZvckVhY2goZnVuY3Rpb24ocGF0aFBhcnQscGFyZW50KXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIi9cIiArIHBhdGhQYXJ0O1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgdmFyIGZpcnN0UGFyYW1ldGVyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAuZm9yRWFjaChmdW5jdGlvbihwYXJhbWV0ZXJLZXkscGFyYW1ldGVyVmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIGlmKGZpcnN0UGFyYW1ldGVyKXtcbiAgICAgICAgICAgICAgICBmaXJzdFBhcmFtZXRlcj1mYWxzZTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI/XCI7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCImXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgZW5jb2RlVVJJKHBhcmFtZXRlcktleSkgKyBcIj1cIiArIGVuY29kZVVSSShwYXJhbWV0ZXJWYWx1ZSk7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIGlmKHRoaXMuYm9va21hcmsgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIiNcIiArIHRoaXMuYm9va21hcms7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQ29udGFpbmVyVXJsIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsXCI7XG5cbmV4cG9ydCBjbGFzcyBIaXN0b3J5IHtcblxuICAgIHN0YXRpYyByZXBsYWNlVXJsKHVybCwgdGl0bGUsIHN0YXRlT2JqZWN0KSB7XG4gICAgICAgIENvbnRhaW5lclVybC5yZXBsYWNlVXJsKHVybC50b1N0cmluZygpLCB0aXRsZSwgc3RhdGVPYmplY3QpO1xuICAgIH1cblxuICAgIHN0YXRpYyBwdXNoVXJsKHVybCwgdGl0bGUsIHN0YXRlT2JqZWN0KSB7XG4gICAgICAgIENvbnRhaW5lclVybC5wdXNoVXJsKHVybC50b1N0cmluZygpLCB0aXRsZSwgc3RhdGVPYmplY3QpO1xuICAgIH1cblxuICAgIHN0YXRpYyBjdXJyZW50VXJsKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVybChDb250YWluZXJVcmwuY3VycmVudFVybCgpKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBIaXN0b3J5IH0gZnJvbSBcIi4vaGlzdG9yeS5qc1wiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XG5cbmxldCBuYXZpZ2F0b2lvbiA9IG51bGw7XG5cbmV4cG9ydCBjbGFzcyBOYXZpZ2F0aW9uIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgfVxuXG4gICAgc3RhdGljIGluc3RhbmNlKCkge1xuICAgICAgICBpZiAoIW5hdmlnYXRvaW9uKSB7XG4gICAgICAgICAgICBuYXZpZ2F0b2lvbiA9IG5ldyBOYXZpZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hdmlnYXRvaW9uO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5hdmlnYXRlIGJyb3dzZXIgdG8gbmV3IHVybFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgZ28odXJsKSB7XG4gICAgICAgIENvbnRhaW5lclVybC5nbyh1cmwudG9TdHJpbmcoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTmF2aWdhdGUgYnJvd3NlciBiYWNrXG4gICAgICovXG4gICAgYmFjaygpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLmJhY2soKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHBhdGggd2l0aG91dCByZW5hdmlnYXRpbmcgYnJvd3NlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gICAgICogQHJldHVybnMge1VybH1cbiAgICAgKi9cbiAgICBsb2FkKHBhdGgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gSGlzdG9yeS5jdXJyZW50VXJsKCk7XG4gICAgICAgIHVybC5kZXRlcm1pbmVQYXRoKHBhdGgpO1xuICAgICAgICBIaXN0b3J5LnB1c2hVcmwodXJsKTtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBNb2R1bGVSdW5uZXIgfSBmcm9tIFwiLi9tb2R1bGVSdW5uZXIuanNcIjtcbmltcG9ydCB7IE5hdmlnYXRpb24gfSBmcm9tIFwiLi9uYXZpZ2F0aW9uL25hdmlnYXRpb24uanNcIjtcblxubGV0IGFjdGl2ZU1vZHVsZVJ1bm5lciA9IG51bGw7XG5cbmV4cG9ydCBjbGFzcyBBY3RpdmVNb2R1bGVSdW5uZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNb2R1bGVSdW5uZXJ9ICovXG4gICAgICAgIHRoaXMubW9kdWxlUnVubmVyID0gbnVsbDtcbiAgICB9XG5cbiAgICBzdGF0aWMgaW5zdGFuY2UoKSB7XG4gICAgICAgIGlmICghYWN0aXZlTW9kdWxlUnVubmVyKSB7XG4gICAgICAgICAgICBhY3RpdmVNb2R1bGVSdW5uZXIgPSBuZXcgQWN0aXZlTW9kdWxlUnVubmVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGl2ZU1vZHVsZVJ1bm5lcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01vZHVsZVJ1bm5lcn0gbmV3TW9kdWxlUnVubmVyIFxuICAgICAqL1xuICAgIHNldChuZXdNb2R1bGVSdW5uZXIpIHtcbiAgICAgICAgdGhpcy5tb2R1bGVSdW5uZXIgPSBuZXdNb2R1bGVSdW5uZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9hZCBwYXRoIHdpdGhvdXQgcmVuYXZpZ2F0aW5nIGJyb3dzZXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBcbiAgICAgKi9cbiAgICAgbG9hZChwYXRoKSB7XG4gICAgICAgIGNvbnN0IHVybCA9IE5hdmlnYXRpb24uaW5zdGFuY2UoKS5sb2FkKHBhdGgpO1xuICAgICAgICB0aGlzLm1vZHVsZVJ1bm5lci5ydW5Nb2R1bGUodXJsKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgQ29udGFpbmVySHR0cENsaWVudCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcblxuZXhwb3J0IGNsYXNzIENsaWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0KHVybCwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgcG9zdCh1cmwsIGRhdGEsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCwgYXV0aG9yaXphdGlvbiA9IG51bGwpe1xuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIG1vZGU6IFwiY29yc1wiLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiBcImZvbGxvd1wiLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgcHV0KHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsIFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JywgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XG4gICAgICovXG4gICAgc3RhdGljIHBhdGNoKHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BBVENIJywgXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZGVsZXRlKHVybCwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwKXtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldEhlYWRlcihhdXRob3JpemF0aW9uID0gbnVsbCkge1xuICAgICAgICBsZXQgaGVhZGVycyA9IHtcbiAgICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBcIk1vemlsbGEvNC4wIE1ETiBFeGFtcGxlXCIsXG4gICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICB9O1xuICAgICAgICBpZiAoYXV0aG9yaXphdGlvbikge1xuICAgICAgICAgICAgaGVhZGVycyA9IHtcbiAgICAgICAgICAgICAgICBcInVzZXItYWdlbnRcIjogXCJNb3ppbGxhLzQuMCBNRE4gRXhhbXBsZVwiLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBhdXRob3JpemF0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhlYWRlcnM7XG4gICAgfVxufSIsImV4cG9ydCBjbGFzcyBTdHlsZXN7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3R5bGVzU291cmNlIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHN0eWxlc1NvdXJjZSl7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzU291cmNlID0gc3R5bGVzU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0U3R5bGVzU291cmNlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc1NvdXJjZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtNYXAsIExvZ2dlciwgT2JqZWN0RnVuY3Rpb259IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzIH0gZnJvbSBcIi4vc3R5bGVzLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJTdHlsZXNSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIFN0eWxlc1JlZ2lzdHJ5IHtcblxuICAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnN0eWxlc01hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy5zdHlsZXNVcmxNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xuICAgICAgICB0aGlzLnN0eWxlc1F1ZXVlU2l6ZSA9IDA7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtTdHlsZXN9IHN0eWxlcyBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIHNldChuYW1lLHN0eWxlcyx1cmwpe1xuICAgICAgICBpZih1cmwgIT09IHVuZGVmaW5lZCAmJiB1cmwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuc3R5bGVzVXJsTWFwLnNldChuYW1lLCB1cmwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3R5bGVzTWFwLnNldChuYW1lLCBzdHlsZXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGdldChuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzTWFwLmdldChuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKi9cbiAgICBjb250YWlucyhuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzTWFwLmNvbnRhaW5zKG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGNhbGxiYWNrIFxuICAgICAqL1xuICAgIGRvbmUoY2FsbGJhY2spe1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0eWxlc1JlZ2lzdHJ5fSByZWdpc3RyeSBcbiAgICAgKi9cbiAgICBkb0NhbGxiYWNrKHJlZ2lzdHJ5KXtcbiAgICAgICAgaWYodG1vLmNhbGxiYWNrICE9PSBudWxsICYmIHJlZ2lzdHJ5LmNhbGxiYWNrICE9PSB1bmRlZmluZWQgICYmIHJlZ2lzdHJ5LnN0eWxlc1F1ZXVlU2l6ZSA9PT0gcmVnaXN0cnkuc3R5bGVzTWFwLnNpemUoKSl7XG4gICAgICAgICAgICB2YXIgdGVtcENhbGxiYWNrID0gcmVnaXN0cnkuY2FsbGJhY2s7XG4gICAgICAgICAgICByZWdpc3RyeS5jYWxsYmFjayA9IG51bGw7XG4gICAgICAgICAgICB0ZW1wQ2FsbGJhY2suY2FsbCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICAgbG9hZChuYW1lLCB1cmwpIHtcbiAgICAgICAgdGhpcy5zdHlsZXNRdWV1ZVNpemUgKys7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCBzdHlsZXMgZm9yIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNwb25zZS50ZXh0KCkudGhlbigodGV4dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChuYW1lLG5ldyBTdHlsZXModGV4dCksdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcH0gbmFtZVVybE1hcCBcbiAgICAgKi9cbiAgICBnZXRTdHlsZXNMb2FkZWRQcm9taXNlKG5hbWVVcmxNYXApIHtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpID0+IHtcbiAgICAgICAgICAgIHZhciBsb2FkZWQgPSAwO1xuICAgICAgICAgICAgaWYoIW5hbWVVcmxNYXAgfHwgbmFtZVVybE1hcC5zaXplKCkgPT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuYW1lVXJsTWFwLmZvckVhY2goKGtleSwgdmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuY29udGFpbnMoa2V5KSl7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcbiAgICAgICAgICAgICAgICAgICAgaWYobG9hZGVkID09IG5hbWVVcmxNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wcml2YXRlTG9hZChrZXksIG5ldyBVcmwodmFsdWUpKVxuXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChyZWFzb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sdGhpcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgcHJpdmF0ZUxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIExPRy5pbmZvKFwiTG9hZGluZyBzdHlsZXMgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmwudG9TdHJpbmcoKSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHN0eWxlcyBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFN0eWxlcyh0ZXh0KSx1cmwpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufSIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRle1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRlbXBsYXRlU291cmNlIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRlbXBsYXRlU291cmNlKXtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVNvdXJjZSA9IHRlbXBsYXRlU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0VGVtcGxhdGVTb3VyY2UoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVTb3VyY2U7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TWFwLCBMb2dnZXIsIE9iamVjdEZ1bmN0aW9ufSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7VGVtcGxhdGV9IGZyb20gXCIuL3RlbXBsYXRlLmpzXCI7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJUZW1wbGF0ZVJlZ2lzdHJ5XCIpO1xuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVSZWdpc3RyeSB7XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZU1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVVybE1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge2ludGVnZXJ9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVRdWV1ZVNpemUgPSAwO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7T2JqZWN0RnVuY3Rpb259ICovXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VQcmVmaXggXG4gICAgICovXG4gICAgc2V0TGFuZ3VhZ2VQcmVmaXgobGFuZ3VhZ2VQcmVmaXgpIHtcbiAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCA9IGxhbmd1YWdlUHJlZml4O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGV9IHRlbXBsYXRlIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgc2V0KG5hbWUsdGVtcGxhdGUsdXJsKXtcbiAgICAgICAgaWYodXJsICE9PSB1bmRlZmluZWQgJiYgdXJsICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlVXJsTWFwLnNldChuYW1lLCB1cmwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGVtcGxhdGVNYXAuc2V0KG5hbWUsIHRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKi9cbiAgICBnZXQobmFtZSl7XG4gICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlTWFwLmdldChuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKi9cbiAgICBjb250YWlucyhuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVNYXAuY29udGFpbnMobmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgZG9uZShjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGVSZWdpc3RyeX0gcmVnaXN0cnkgXG4gICAgICovXG4gICAgZG9DYWxsYmFjayhyZWdpc3RyeSl7XG4gICAgICAgIGlmKHRtby5jYWxsYmFjayAhPT0gbnVsbCAmJiByZWdpc3RyeS5jYWxsYmFjayAhPT0gdW5kZWZpbmVkICAmJiByZWdpc3RyeS50ZW1wbGF0ZVF1ZXVlU2l6ZSA9PT0gcmVnaXN0cnkudGVtcGxhdGVNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBDYWxsYmFjay5jYWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIGlmKHRoaXMubGFuZ3VhZ2VQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVybC5nZXRQYXRoTGlzdCgpLnNldExhc3QoXG4gICAgICAgICAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCArIFwiLlwiICtcbiAgICAgICAgICAgICAgICB1cmwuZ2V0UGF0aExpc3QoKS5nZXRMYXN0KClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVF1ZXVlU2l6ZSArKztcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHRlbXBsYXRlIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UudGV4dCgpLnRoZW4oKHRleHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgVGVtcGxhdGUodGV4dCksdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNYXB9IG5hbWVVcmxNYXAgXG4gICAgICovXG4gICAgZ2V0VGVtcGxhdGVzTG9hZGVkUHJvbWlzZShuYW1lVXJsTWFwKSB7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdmFyIGxvYWRlZCA9IDA7XG4gICAgICAgICAgICBpZighbmFtZVVybE1hcCB8fCBuYW1lVXJsTWFwLnNpemUoKSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5hbWVVcmxNYXAuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5jb250YWlucyhrZXkpKXtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkICsrO1xuICAgICAgICAgICAgICAgICAgICBpZihsb2FkZWQgPT0gbmFtZVVybE1hcC5zaXplKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnByaXZhdGVMb2FkKGtleSwgbmV3IFVybCh2YWx1ZSkpXG5cbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGVkICsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYobG9hZGVkID09IG5hbWVVcmxNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKHJlYXNvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlYXNvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBwcml2YXRlTG9hZChuYW1lLCB1cmwpIHtcbiAgICAgICAgaWYodGhpcy5sYW5ndWFnZVByZWZpeCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdXJsLmdldFBhdGhMaXN0KCkuc2V0TGFzdChcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ICsgXCIuXCIgK1xuICAgICAgICAgICAgICAgIHVybC5nZXRQYXRoTGlzdCgpLmdldExhc3QoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBMT0cuaW5mbyhcIkxvYWRpbmcgdGVtcGxhdGUgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmwudG9TdHJpbmcoKSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2xzZSkgPT4ge1xuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFRlbXBsYXRlKHRleHQpLHVybCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59IiwiaW1wb3J0IHsgTG9nZ2VyLCBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENvbmZpZywgVHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlRlbXBsYXRlUG9zdENvbmZpZ1wiKTtcblxuLyoqXG4gKiBUbyBiZSBhZGRlZCB0byBtaW5kaSBhcyBhIHNpbmdsZXRvbi4gV2lsbCBzY2FuIHRocm91Z2ggYWxsIGNvbmZpZ3VyZWQgY2xhc3NlcyB0aGF0IGhhdmUgYSBURU1QTEFURV9VUkwgYW5kIENPTVBPTkVOVF9OQU1FXG4gKiBzdGF0aWMgZ2V0dGVyIGFuZCB3aWxsIGFzeW5jcm9ub3VzbHkgbG9hZCB0aGVtLiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIGFsbCB0ZW1wbGF0ZXMgYXJlIGxvYWRlZFxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVzTG9hZGVyIHtcblxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZVJlZ2lzdHJ5fSB0ZW1wbGF0ZVJlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRlbXBsYXRlUmVnaXN0cnkpIHtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gdGVtcGxhdGVSZWdpc3RyeTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcH0gY29uZmlnRW50cmllc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGxvYWQoY29uZmlnRW50cmllcykge1xuICAgICAgICBsZXQgdGVtcGxhdGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIGNvbmZpZ0VudHJpZXMuZm9yRWFjaCgoa2V5LCBjb25maWdFbnRyeSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICBpZihjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5URU1QTEFURV9VUkwgJiYgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZU1hcC5zZXQoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUsIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlRFTVBMQVRFX1VSTCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7IFxuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UodGVtcGxhdGVNYXApO1xuICAgIH1cblxufSIsImltcG9ydCB7IExvZ2dlciwgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzUmVnaXN0cnkuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlN0eWxlc0xvYWRlclwiKTtcblxuLyoqXG4gKiBUbyBiZSBhZGRlZCB0byBtaW5kaSBhcyBhIHNpbmdsZXRvbi4gV2lsbCBzY2FuIHRocm91Z2ggYWxsIGNvbmZpZ3VyZWQgY2xhc3NlcyB0aGF0IGhhdmUgYSBTVFlMRVNfVVJMIGFuZCBDT01QT05FTlRfTkFNRVxuICogc3RhdGljIGdldHRlciBhbmQgd2lsbCBhc3luY3Jvbm91c2x5IGxvYWQgdGhlbS4gUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiBhbGwgc3R5bGVzIGFyZSBsb2FkZWRcbiAqL1xuZXhwb3J0IGNsYXNzIFN0eWxlc0xvYWRlciB7XG5cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3R5bGVzUmVnaXN0cnl9IHN0eWxlc1JlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHN0eWxlc1JlZ2lzdHJ5KSB7XG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBzdHlsZXNSZWdpc3RyeTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcH0gY29uZmlnRW50cmllc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGxvYWQoY29uZmlnRW50cmllcykge1xuICAgICAgICBsZXQgc3R5bGVzTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICBjb25maWdFbnRyaWVzLmZvckVhY2goKGtleSwgY29uZmlnRW50cnksIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgaWYoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuU1RZTEVTX1VSTCAmJiBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSkge1xuICAgICAgICAgICAgICAgIHN0eWxlc01hcC5zZXQoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUsIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlNUWUxFU19VUkwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpOyBcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0U3R5bGVzTG9hZGVkUHJvbWlzZShzdHlsZXNNYXApO1xuICAgIH1cblxufSIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ29uZmlnLCBJbmplY3Rpb25Qb2ludCwgVHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlc0xvYWRlciB9IGZyb20gXCIuLi90ZW1wbGF0ZS90ZW1wbGF0ZXNMb2FkZXIuanNcIjtcbmltcG9ydCB7IFN0eWxlc0xvYWRlciB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzTG9hZGVyLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDb21wb25lbnRDb25maWdQcm9jZXNzb3JcIilcblxuLyoqXG4gKiBNaW5kaSBjb25maWcgcHJvY2Vzc29yIHdoaWNoIGxvYWRzIGFsbCB0ZW1wbGF0ZXMgYW5kIHN0eWxlcyBmb3IgYWxsIGNvbmZpZ3VyZWQgY29tcG9uZW50c1xuICogYW5kIHRoZW4gY2FsbHMgYW55IGV4aXN0aW5nIGNvbXBvbmVudExvYWRlZCBmdW5jdGlvbiBvbiBlYWNoIGNvbXBvbmVudFxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50Q29uZmlnUHJvY2Vzc29yIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFRlbXBsYXRlUmVnaXN0cnkpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7U3R5bGVzUmVnaXN0cnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnN0eWxlc1JlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoU3R5bGVzUmVnaXN0cnkpO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgcG9zdENvbmZpZygpe1xuICAgICAgICB0aGlzLnRlbXBsYXRlc0xvYWRlciA9IG5ldyBUZW1wbGF0ZXNMb2FkZXIodGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5KTtcbiAgICAgICAgdGhpcy5zdHlsZXNMb2FkZXIgPSBuZXcgU3R5bGVzTG9hZGVyKHRoaXMuc3R5bGVzUmVnaXN0cnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7Q29uZmlnfSBjb25maWdcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBwcm9jZXNzQ29uZmlnKGNvbmZpZywgdW5jb25maWd1cmVkQ29uZmlnRW50cmllcykge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgICAgIFsgXG4gICAgICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZXNMb2FkZXIubG9hZCh1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSwgXG4gICAgICAgICAgICAgICAgdGhpcy5zdHlsZXNMb2FkZXIubG9hZCh1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSBcbiAgICAgICAgICAgIF1cbiAgICAgICAgKTtcbiAgICB9XG5cbn0iLCJleHBvcnQgY2xhc3MgQXR0cmlidXRlIHtcblxuICAgIGNvbnN0cnVjdG9yKGF0dHJpYnV0ZSkge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZSA9IGF0dHJpYnV0ZTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS52YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlLm5hbWU7XG4gICAgfVxuXG4gICAgZ2V0IG5hbWVzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlLm5hbWU7XG4gICAgfVxufSIsImltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBNYXAsIExvZ2dlciwgTGlzdCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ29udGFpbmVyRWxlbWVudCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IEF0dHJpYnV0ZSB9IGZyb20gXCIuL2F0dHJpYnV0ZS5qc1wiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi4vZXZlbnQvZXZlbnQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkJhc2VFbGVtZW50XCIpO1xuXG4vKipcbiAqIEEgYmFzZSBjbGFzcyBmb3IgZW5jbG9zaW5nIGFuIEhUTUxFbGVtZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fHN0cmluZ3xhbnl9IHZhbHVlIFZhbHVlIHRvIGJlIGNvbnZlcnRlZCB0byBDb250YWluZXIgVUkgRWxlbWVudCAoSFRNTEVsZW1lbnQgaW4gdGhlIGNhc2Ugb2YgV2ViIEJyb3dzZXIpXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IHRoZSBwYXJlbnQgQmFzZUVsZW1lbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIFxuICAgICAgICAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG51bGw7XG4gICAgICAgIHRoaXMuZXZlbnRzQXR0YWNoZWQgPSBuZXcgTGlzdCgpO1xuICAgICAgICBcbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBYbWxFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLmNyZWF0ZUZyb21YbWxFbGVtZW50KHZhbHVlLCBwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKENvbnRhaW5lckVsZW1lbnQuaXNVSUVsZW1lbnQodmFsdWUpKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIExPRy5lcnJvcihcIlVucmVjb2duaXplZCB2YWx1ZSBmb3IgRWxlbWVudFwiKTtcbiAgICAgICAgTE9HLmVycm9yKHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2FkQXR0cmlidXRlcygpIHtcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzID09PSBudWxsIHx8IHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmF0dHJpYnV0ZU1hcCA9PT0gbnVsbCB8fCB0aGlzLmF0dHJpYnV0ZU1hcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5lbGVtZW50LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcC5zZXQodGhpcy5lbGVtZW50LmF0dHJpYnV0ZXNbaV0ubmFtZSxuZXcgQXR0cmlidXRlKHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYnJvd3NlciBFbGVtZW50IGZyb20gdGhlIFhtbEVsZW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0geG1sRWxlbWVudFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudEVsZW1lbnRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBjcmVhdGVGcm9tWG1sRWxlbWVudCh4bWxFbGVtZW50LCBwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIGxldCBlbGVtZW50ID0gbnVsbDtcbiAgICAgICAgaWYoeG1sRWxlbWVudC5uYW1lc3BhY2Upe1xuICAgICAgICAgICAgZWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuY3JlYXRlRWxlbWVudE5TKHhtbEVsZW1lbnQubmFtZXNwYWNlVXJpLCB4bWxFbGVtZW50LmZ1bGxOYW1lKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudC5jcmVhdGVFbGVtZW50KHhtbEVsZW1lbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYocGFyZW50RWxlbWVudCAmJiBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuYXBwZW5kQ2hpbGQocGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50LCBlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICB4bWxFbGVtZW50LmF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cmlidXRlS2V5LCBhdHRyaWJ1dGUpID0+IHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuc2V0QXR0cmlidXRlKGVsZW1lbnQsIGF0dHJpYnV0ZUtleSwgYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIGEgZnVuY3Rpb24gdG8gYW4gZXZlbnQgaW4gdGhlIGVuY2xvc2VkIGVsZW1lbnQgaWYgbm9uZSBhbGxyZWFkeSBleGlzdHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmdW5jdGlvblBhcmFtXG4gICAgICogQHBhcmFtIHtib29sZWFufSBjYXB0dXJlXG4gICAgICovXG4gICAgYXR0YWNoRXZlbnQoZXZlbnRUeXBlLCBmdW5jdGlvblBhcmFtLCBjYXB0dXJlID0gZmFsc2UpIHtcbiAgICAgICAgaWYoIXRoaXMuZXZlbnRzQXR0YWNoZWQuY29udGFpbnMoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgaWYoZXZlbnRUeXBlLnN0YXJ0c1dpdGgoXCJvblwiKSkge1xuICAgICAgICAgICAgICAgIGV2ZW50VHlwZSA9IGV2ZW50VHlwZS5zdWJzdHIoMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDb250YWluZXJFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5lbGVtZW50LCBldmVudFR5cGUsIGZ1bmN0aW9uUGFyYW0sIGNhcHR1cmUpO1xuICAgICAgICAgICAgdGhpcy5ldmVudHNBdHRhY2hlZC5hZGQoZXZlbnRUeXBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIExPRy53YXJuKFwiRXZlbnQgJ1wiICsgZXZlbnRUeXBlICsgXCInIGFsbHJlYWR5IGF0dGFjaGVkIGZvciBcIiArIHRoaXMuZWxlbWVudC5uYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxpc3RlblRvKGV2ZW50VHlwZSwgbGlzdGVuZXIsIGNhcHR1cmUpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMuZWxlbWVudCwgZXZlbnRUeXBlLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGxpc3RlbmVyLmNhbGwobmV3IEV2ZW50KGV2ZW50KSk7XG4gICAgICAgIH0sIGNhcHR1cmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgZW5jbG9zZWQgZWxlbWVudFxuICAgICAqXG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgZ2V0IG1hcHBlZEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG4gICAgZ2V0IGZ1bGxOYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnRhZ05hbWU7XG4gICAgfVxuXG4gICAgZ2V0IHRvcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG4gICAgfVxuXG4gICAgZ2V0IGJvdHRvbSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5ib3R0b207XG4gICAgfVxuXG4gICAgZ2V0IGxlZnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdDtcbiAgICB9XG5cbiAgICBnZXQgcmlnaHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQ7XG4gICAgfVxuXG4gICAgZ2V0IHdpZHRoKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgIH1cblxuICAgIGdldCBoZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIGdldCBhdHRyaWJ1dGVzKCkge1xuICAgICAgICB0aGlzLmxvYWRBdHRyaWJ1dGVzKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZU1hcDtcbiAgICB9XG5cbiAgICBzZXRBdHRyaWJ1dGVWYWx1ZShrZXksdmFsdWUpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5zZXRBdHRyaWJ1dGUodGhpcy5lbGVtZW50LCBrZXksdmFsdWUpO1xuICAgIH1cblxuICAgIGdldEF0dHJpYnV0ZVZhbHVlKGtleSkge1xuICAgICAgICByZXR1cm4gQ29udGFpbmVyRWxlbWVudC5nZXRBdHRyaWJ1dGUodGhpcy5lbGVtZW50LCBrZXkpO1xuICAgIH1cblxuICAgIGNvbnRhaW5zQXR0cmlidXRlKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lmhhc0F0dHJpYnV0ZShrZXkpO1xuICAgIH1cblxuICAgIHJlbW92ZUF0dHJpYnV0ZShrZXkpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgIH1cblxuICAgIHNldFN0eWxlKGtleSx2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGVba2V5XSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldFN0eWxlKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnN0eWxlW2tleV07XG4gICAgfVxuXG4gICAgcmVtb3ZlU3R5bGUoa2V5KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVtrZXldID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZXQoaW5wdXQpIHtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50LnBhcmVudE5vZGUgPT09IG51bGwpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlRoZSBlbGVtZW50IGhhcyBubyBwYXJlbnQsIGNhbiBub3Qgc3dhcCBpdCBmb3IgdmFsdWVcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQubWFwcGVkRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0Lm1hcHBlZEVsZW1lbnQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQgJiYgaW5wdXQucm9vdEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gaW5wdXQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZih0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKENvbnRhaW5lckVsZW1lbnQuY3JlYXRlVGV4dE5vZGUoaW5wdXQpLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNNb3VudGVkKCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuZWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0Q2hpbGQoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKGlucHV0KTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gdW5kZWZpbmVkICYmIGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpe1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0Lm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKENvbnRhaW5lckVsZW1lbnQuY3JlYXRlVGV4dE5vZGUoaW5wdXQpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSB1bmRlZmluZWQgJiYgaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dC5tYXBwZWRFbGVtZW50LHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgJiYgaW5wdXQucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKENvbnRhaW5lckVsZW1lbnQuY3JlYXRlVGV4dE5vZGUoaW5wdXQpLHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKGlucHV0LHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKGlucHV0LHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQWJzdHJhY3RJbnB1dEVsZW1lbnRcIik7XG5cbi8qKlxuICogU2hhcmVkIHByb3BlcnRpZXMgb2YgaW5wdXQgZWxlbWVudHNcbiAqL1xuZXhwb3J0IGNsYXNzIEFic3RyYWN0SW5wdXRFbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIodmFsdWUsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmFsdWUgb2YgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldCBuYW1lKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmFsdWUgZ2l2ZW4gYW55IHByb2Nlc3NpbmcgcnVsZXNcbiAgICAgKi9cbiAgICBnZXQgdmFsdWUoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFja2luZ1ZhbHVlO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgSW5wdXRFdmVudCgnY2hhbmdlJykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNvdXJjZSB2YWx1ZVxuICAgICAqL1xuICAgIGdldCBiYWNraW5nVmFsdWUoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9XG5cbiAgICBmb2N1cygpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgc2VsZWN0QWxsKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2VsZWN0KCk7XG4gICAgfVxuXG4gICAgZW5hYmxlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBkaXNhYmxlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0SW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFJhZGlvSW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBzZXQgY2hlY2tlZCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaXNDaGVja2VkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuY2hlY2tlZDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzQ2hlY2tlZCgpO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9ICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gXCJ0cnVlXCIpO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0SW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIENoZWNrYm94SW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBzZXQgY2hlY2tlZCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaXNDaGVja2VkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuY2hlY2tlZDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzQ2hlY2tlZCgpO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9ICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gXCJ0cnVlXCIpO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dElucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtBYnN0cmFjdElucHV0RWxlbWVudH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHRhcmVhSW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBnZXQgaW5uZXJIVE1MKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIHNldCBpbm5lckhUTUwodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgc3VwZXIuYWRkQ2hpbGQoaW5wdXQpO1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgcHJlcGVuZENoaWxkKGlucHV0KSB7XG4gICAgICAgIHN1cGVyLnByZXBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmlubmVySFRNTDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBYbWxDZGF0YSB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IENvbnRhaW5lckVsZW1lbnQgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0bm9kZUVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sQ2RhdGF9IHZhbHVlIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIGlmKHZhbHVlIGluc3RhbmNlb2YgWG1sQ2RhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuY3JlYXRlRnJvbVhtbENkYXRhKHZhbHVlLCBwYXJlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7WG1sQ2RhdGF9IGNkYXRhRWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRFbGVtZW50IFxuICAgICAqL1xuICAgIGNyZWF0ZUZyb21YbWxDZGF0YShjZGF0YUVsZW1lbnQsIHBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjZGF0YUVsZW1lbnQudmFsdWUpO1xuICAgICAgICBpZihwYXJlbnRFbGVtZW50ICE9PSBudWxsICYmIHBhcmVudEVsZW1lbnQubWFwcGVkRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgQ29udGFpbmVyRWxlbWVudC5hcHBlbmRDaGlsZChwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG4gICAgZ2V0IG1hcHBlZEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBTaW1wbGVFbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBnZXQgaW5uZXJIVE1MKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIHNldCBpbm5lckhUTUwodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBGb3JtRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmFsdWUgb2YgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldCBuYW1lKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdmFsdWU7XG4gICAgfVxuXG4gICAgc3VibWl0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnN1Ym1pdCgpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVmlkZW9FbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gdmFsdWUgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIGdldCBtYXBwZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIHBsYXkoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5wbGF5KCk7XG4gICAgfVxuXG4gICAgbXV0ZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm11dGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB1bm11dGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5tdXRlZCA9IGZhbHNlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbENkYXRhLFhtbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7UmFkaW9JbnB1dEVsZW1lbnR9IGZyb20gXCIuL3JhZGlvSW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge0NoZWNrYm94SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9jaGVja2JveElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUZXh0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi90ZXh0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RleHRhcmVhSW5wdXRFbGVtZW50fSBmcm9tIFwiLi90ZXh0YXJlYUlucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUZXh0bm9kZUVsZW1lbnR9IGZyb20gXCIuL3RleHRub2RlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHtTaW1wbGVFbGVtZW50fSBmcm9tIFwiLi9zaW1wbGVFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBGb3JtRWxlbWVudCB9IGZyb20gXCIuL2Zvcm1FbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBWaWRlb0VsZW1lbnQgfSBmcm9tIFwiLi92aWRlb0VsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnRNYXBwZXIge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2FueX0gaW5wdXQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyBtYXAoaW5wdXQsIHBhcmVudCkge1xuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9SYWRpbyhpbnB1dCkpeyByZXR1cm4gbmV3IFJhZGlvSW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb0NoZWNrYm94KGlucHV0KSl7IHJldHVybiBuZXcgQ2hlY2tib3hJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvU3VibWl0KGlucHV0KSl7IHJldHVybiBuZXcgVGV4dElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9Gb3JtKGlucHV0KSl7IHJldHVybiBuZXcgRm9ybUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVGV4dGFyZWEoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0YXJlYUlucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0KGlucHV0KSl7IHJldHVybiBuZXcgVGV4dElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9WaWRlbyhpbnB1dCkpeyByZXR1cm4gbmV3IFZpZGVvRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0bm9kZShpbnB1dCkpeyByZXR1cm4gbmV3IFRleHRub2RlRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9TaW1wbGUoaW5wdXQpKXsgcmV0dXJuIG5ldyBTaW1wbGVFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTWFwcGluZyB0byBzaW1wbGUgYnkgZGVmYXVsdCBcIiArIGlucHV0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaW1wbGVFbGVtZW50KGlucHV0LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9SYWRpbyhpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwicmFkaW9cIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJyYWRpb1wiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvQ2hlY2tib3goaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCAmJiBpbnB1dC50eXBlID09PSBcImNoZWNrYm94XCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIiAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiY2hlY2tib3hcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1N1Ym1pdChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwic3VibWl0XCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIiAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwic3VibWl0XCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9Gb3JtKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxGb3JtRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJmb3JtXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0KGlucHV0KXtcbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwidGV4dFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJlbWFpbFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJkYXRlXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIpIHtcbiAgICAgICAgICAgIGlmKCFpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRleHRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcImVtYWlsXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiZGF0ZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dG5vZGUoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgTm9kZSAmJiBpbnB1dC5ub2RlVHlwZSA9PT0gXCJURVhUX05PREVcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbENkYXRhKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVmlkZW8oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJ2aWRlb1wiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dGFyZWEoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJ0ZXh0YXJlYVwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvU2ltcGxlKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCk7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBFbGVtZW50TWFwcGVyIH0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlci5qc1wiO1xuaW1wb3J0IHsgU2ltcGxlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L3NpbXBsZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIEV2ZW50e1xuXG4gICAgY29uc3RydWN0b3IoZXZlbnQpe1xuICAgICAgICB0aGlzLmV2ZW50ID0gZXZlbnQ7XG4gICAgICAgIGlmKHRoaXMuZXZlbnQudHlwZS50b0xvd2VyQ2FzZSgpID09IFwiZHJhZ3N0YXJ0XCIpe1xuICAgICAgICAgICAgdGhpcy5ldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsIG51bGwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RvcFByb3BhZ2F0aW9uKCl7XG4gICAgICAgIHRoaXMuZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuXG4gICAgcHJldmVudERlZmF1bHQoKXtcbiAgICAgICAgdGhpcy5ldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBldmVudCBhbmQgdGhlIGVkZ2UgeCBjb29yZGluYXRlIG9mIHRoZSBjb250YWluaW5nIG9iamVjdFxuICAgICAqL1xuICAgIGdldE9mZnNldFgoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQub2Zmc2V0WDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgZXZlbnQgYW5kIHRoZSBlZGdlIHkgY29vcmRpbmF0ZSBvZiB0aGUgY29udGFpbmluZyBvYmplY3RcbiAgICAgKi9cbiAgICBnZXRPZmZzZXRZKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Lm9mZnNldFk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1vdXNlIHggY29vcmRpbmF0ZSBvZiB0aGUgZXZlbnQgcmVsYXRpdmUgdG8gdGhlIGNsaWVudCB3aW5kb3cgdmlld1xuICAgICAqL1xuICAgIGdldENsaWVudFgoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQuY2xpZW50WDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbW91c2UgeSBjb29yZGluYXRlIG9mIHRoZSBldmVudCByZWxhdGl2ZSB0byB0aGUgY2xpZW50IHdpbmRvdyB2aWV3XG4gICAgICovXG4gICAgZ2V0Q2xpZW50WSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5jbGllbnRZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtTaW1wbGVFbGVtZW50fVxuICAgICAqL1xuICAgIGdldFRhcmdldCgpe1xuICAgICAgICBpZiAodGhpcy5ldmVudCAmJiB0aGlzLmV2ZW50LnRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHRoaXMuZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtTaW1wbGVFbGVtZW50fVxuICAgICAqL1xuICAgIGdldFJlbGF0ZWRUYXJnZXQoKXtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQgJiYgdGhpcy5ldmVudC5yZWxhdGVkVGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gRWxlbWVudE1hcHBlci5tYXAodGhpcy5ldmVudC5yZWxhdGVkVGFyZ2V0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgICBnZXRSZWxhdGVkVGFyZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpe1xuICAgICAgICBpZiAodGhpcy5ldmVudC5yZWxhdGVkVGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gRWxlbWVudE1hcHBlci5tYXAodGhpcy5ldmVudC5yZWxhdGVkVGFyZ2V0KS5nZXRBdHRyaWJ1dGVWYWx1ZShhdHRyaWJ1dGVOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBnZXRUYXJnZXRWYWx1ZSgpe1xuICAgICAgICBpZih0aGlzLmdldFRhcmdldCgpKSB7IFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFyZ2V0KCkudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0S2V5Q29kZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQua2V5Q29kZTtcbiAgICB9XG5cbiAgICBpc0tleUNvZGUoY29kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5rZXlDb2RlID09PSBjb2RlO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgTWFwLCBPYmplY3RGdW5jdGlvbiwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuL2V2ZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJFdmVudFJlZ2lzdHJ5XCIpO1xuXG5leHBvcnQgY2xhc3MgRXZlbnRSZWdpc3RyeSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvKiogQHR5cGUge01hcDxNYXA8T2JqZWN0RnVuY3Rpb24+fSAqL1xuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb25uZWN0cyBlbGVtZW50cyB3aXRoIHRoZSBldmVudCByZWdpc3RyeSBzbyB0aGF0IGV2ZW50cyB0cmlnZ2VyZWQgb24gdGhlIGVsZW1lbnQgZ2V0cyBkaXN0cmlidXRlZCB0byBhbGwgbGlzdGVuZXJzXG4gICAgICogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudCB0aGUgZWxlbWVudCB3aGljaCBpcyB0aGUgc291cmNlIG9mIHRoZSBldmVudCBhbmQgd2hpY2ggY2FuIGJlIGF0dGFjaGVkIHRvXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50VHlwZSB0aGUgZXZlbnQgdHlwZSBhcyBpdCBpcyBkZWZpbmVkIGJ5IHRoZSBjb250YWluaW5nIHRyaWdnZXIgKGV4YW1wbGUgXCJvbmNsaWNrXCIpXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSB0aGUgZXZlbnQgbmFtZSBhcyBpdCB3aWxsIGJlIHJlZmVycmVkIHRvIGluIHRoZSBFdmVudFJlZ2lzdHJ5IChleGFtcGxlIFwiLy9ldmVudDpjbGlja2VkXCIpXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNvbXBvbmVudEluZGV4IHVuaXF1ZSBpZCBvZiB0aGUgY29tcG9uZW50IHdoaWNoIG93bnMgdGhlIGVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNhcHR1cmUgXG4gICAgICovXG4gICAgYXR0YWNoKGVsZW1lbnQsIGV2ZW50VHlwZSwgZXZlbnROYW1lLCBjb21wb25lbnRJbmRleCwgY2FwdHVyZSA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnN0IHVuaXF1ZUV2ZW50TmFtZSA9IGV2ZW50TmFtZSArIFwiX1wiICsgY29tcG9uZW50SW5kZXg7XG4gICAgICAgIGNvbnN0IHRoZUV2ZW50UmVnaXN0cnkgPSB0aGlzO1xuICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHRoZUV2ZW50UmVnaXN0cnkudHJpZ2dlcih1bmlxdWVFdmVudE5hbWUsIGV2ZW50KTsgXG4gICAgICAgIH0sIGNhcHR1cmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgdGhlIGV2ZW50IG5hbWUgYXMgaXQgd2lsbCBiZSByZWZlcnJlZCB0byBpbiB0aGUgRXZlbnRSZWdpc3RyeSAoZXhhbXBsZSBcIi8vZXZlbnQ6Y2xpY2tlZFwiKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGxpc3RlbmVyIHRoZSBvYmplY3Qgd2hpY2ggb3ducyB0aGUgaGFuZGxlciBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1bmlxdWVJbmRleCBhIHVuaXF1ZSBpbmRleCBmb3IgdGhlIGV2ZW50XG4gICAgICovXG4gICAgbGlzdGVuKGV2ZW50TmFtZSwgbGlzdGVuZXIsIHVuaXF1ZUluZGV4KSB7XG4gICAgICAgIHRoaXMuaW5pdE1hcChldmVudE5hbWUgKyBcIl9cIiArIHVuaXF1ZUluZGV4KVxuICAgICAgICAgICAgLnNldChsaXN0ZW5lci5vYmplY3QuY29uc3RydWN0b3IubmFtZSwgbGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgXG4gICAgICogQHJldHVybnMge01hcDxPYmplY3RGdW5jdGlvbj59XG4gICAgICovXG4gICAgaW5pdE1hcChrZXkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5leGlzdHMoa2V5KSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc2V0KGtleSxuZXcgTWFwKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RlbmVycy5nZXQoa2V5KTtcbiAgICB9XG5cbiAgICB0cmlnZ2VyKHN1ZmZpeGVkRXZlbnROYW1lLCBldmVudCkge1xuICAgICAgICBpZiAodGhpcy5saXN0ZW5lcnMuZXhpc3RzKHN1ZmZpeGVkRXZlbnROYW1lKSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuZ2V0KHN1ZmZpeGVkRXZlbnROYW1lKS5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICB2YWx1ZS5jYWxsKG5ldyBFdmVudChldmVudCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIFVuaXF1ZUlkUmVnaXN0cnkge1xuXG4gICAgaWRBdHRyaWJ1dGVXaXRoU3VmZml4IChpZCkge1xuICAgICAgICBpZihpZE5hbWVzLmNvbnRhaW5zKGlkKSkge1xuICAgICAgICAgICAgdmFyIG51bWJlciA9IGlkTmFtZXMuZ2V0KGlkKTtcbiAgICAgICAgICAgIGlkTmFtZXMuc2V0KGlkLG51bWJlcisxKTtcbiAgICAgICAgICAgIHJldHVybiBpZCArIFwiLVwiICsgbnVtYmVyO1xuICAgICAgICB9XG4gICAgICAgIGlkTmFtZXMuc2V0KGlkLDEpO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG59XG5cbnZhciBpZE5hbWVzID0gbmV3IE1hcCgpOyIsImltcG9ydCB7IE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudFwiO1xuXG4vKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGNvbXBvbmVudEluZGV4IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHJvb3RFbGVtZW50IFxuICAgICAqIEBwYXJhbSB7TWFwfSBlbGVtZW50TWFwIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbXBvbmVudEluZGV4LCByb290RWxlbWVudCwgZWxlbWVudE1hcCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kZXg7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcCA9IGVsZW1lbnRNYXA7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSByb290RWxlbWVudDtcbiAgICB9XG5cbiAgICByZW1vdmUoKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxuICAgICAqIEByZXR1cm5zIHtCYXNlRWxlbWVudH1cbiAgICAgKi9cbiAgICBnZXQoaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fVxuICAgICAqIEByZXR1cm5zIHtCYXNlRWxlbWVudH1cbiAgICAgKi9cbiAgICBzZXQgKGlkLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5zZXQodmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwLmdldChpZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGlkIFxuICAgICAqIEByZXR1cm5zIHtCYXNlRWxlbWVudH1cbiAgICAgKi9cbiAgICBjbGVhckNoaWxkcmVuKGlkKXtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuY2xlYXIoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fVxuICAgICAqIEByZXR1cm5zIHtCYXNlRWxlbWVudH1cbiAgICAgKi9cbiAgICBzZXRDaGlsZCAoaWQsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLnNldENoaWxkKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fVxuICAgICAqIEByZXR1cm5zIHtCYXNlRWxlbWVudH1cbiAgICAgKi9cbiAgICBhZGRDaGlsZCAoaWQsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLmFkZENoaWxkKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fVxuICAgICAqIEByZXR1cm5zIHtCYXNlRWxlbWVudH1cbiAgICAgKi9cbiAgICBwcmVwZW5kQ2hpbGQgKGlkLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5wcmVwZW5kQ2hpbGQodmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwLmdldChpZCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBNYXAsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEVsZW1lbnRNYXBwZXIgfSBmcm9tIFwiLi4vZWxlbWVudC9lbGVtZW50TWFwcGVyXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XG5pbXBvcnQgeyBFdmVudFJlZ2lzdHJ5IH0gZnJvbSBcIi4uL2V2ZW50L2V2ZW50UmVnaXN0cnlcIjtcblxuLyoqXG4gKiBDb2xsZWN0cyBpbmZvcm1hdGlvbiB3aGVuIGVsZW1lbnRzIGFyZSBjcmVhdGVkIGFuZCBmaW5kcyB0aGUgcm9vdCBlbGVtZW50LCBjcmVhdGVzIG1hcCBvZiBlbGVtZW50cyBcbiAqIGFuZCByZWdpc3RlcnMgZXZlbnRzIGluIHRoZSBldmVudFJlZ2lzdHJ5XG4gKi9cbmV4cG9ydCBjbGFzcyBFbGVtZW50UmVnaXN0cmF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IoZXZlbnRSZWdpc3RyeSwgdW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50SW5kZXgpIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGV4O1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnVuaXF1ZUlkUmVnaXN0cnkgPSB1bmlxdWVJZFJlZ2lzdHJ5O1xuXG4gICAgICAgIC8qKiBAdHlwZSB7RXZlbnRSZWdpc3RyeX0gKi9cbiAgICAgICAgdGhpcy5ldmVudFJlZ2lzdHJ5ID0gZXZlbnRSZWdpc3RyeTtcblxuICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZ2V0RWxlbWVudE1hcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMaXN0ZW5zIHRvIGVsZW1lbnRzIGJlaW5nIGNyZWF0ZWQsIGFuZCB0YWtlcyBpbm4gdGhlIGNyZWF0ZWQgWG1sRWxlbWVudCBhbmQgaXRzIHBhcmVudCBYbWxFbGVtZW50XG4gICAgICogXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB4bWxFbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudFdyYXBwZXIgXG4gICAgICovXG4gICAgZWxlbWVudENyZWF0ZWQgKHhtbEVsZW1lbnQsIHBhcmVudFdyYXBwZXIpIHtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBFbGVtZW50TWFwcGVyLm1hcCh4bWxFbGVtZW50LCBwYXJlbnRXcmFwcGVyKTtcblxuICAgICAgICB0aGlzLmFkZFRvRWxlbWVudElkTWFwKGVsZW1lbnQpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyRWxlbWVudEV2ZW50cyhlbGVtZW50KTtcblxuICAgICAgICBpZih0aGlzLnJvb3RFbGVtZW50ID09PSBudWxsICYmIGVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgcmVnaXN0ZXJFbGVtZW50RXZlbnRzKGVsZW1lbnQpe1xuICAgICAgICBpZihlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZXZlbnRSZWdpc3RyeSA9IHRoaXMuZXZlbnRSZWdpc3RyeTtcbiAgICAgICAgdmFyIGNvbXBvbmVudEluZGV4ID0gdGhpcy5jb21wb25lbnRJbmRleDtcbiAgICAgICAgZWxlbWVudC5hdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24gKGF0dHJpYnV0ZUtleSxhdHRyaWJ1dGUscGFyZW50KXtcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZSAhPT0gbnVsbCAmJiBhdHRyaWJ1dGUgIT09IHVuZGVmaW5lZCAmJiBhdHRyaWJ1dGUudmFsdWUuc3RhcnRzV2l0aChcIi8vZXZlbnQ6XCIpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50TmFtZSA9IGF0dHJpYnV0ZS52YWx1ZTtcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnRUeXBlID0gYXR0cmlidXRlLm5hbWU7XG4gICAgICAgICAgICAgICAgZXZlbnRSZWdpc3RyeS5hdHRhY2goZWxlbWVudCxldmVudFR5cGUsZXZlbnROYW1lLGNvbXBvbmVudEluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlOyAgICAgICAgIFxuICAgICAgICB9LHRoaXMpO1xuICAgIH1cblxuICAgIGFkZFRvRWxlbWVudElkTWFwKGVsZW1lbnQpIHtcbiAgICAgICAgaWYoZWxlbWVudCA9PT0gbnVsbCB8fCBlbGVtZW50ID09PSB1bmRlZmluZWQgfHwgIShlbGVtZW50IGluc3RhbmNlb2YgQmFzZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlkID0gbnVsbDtcbiAgICAgICAgaWYoZWxlbWVudC5jb250YWluc0F0dHJpYnV0ZShcImlkXCIpKSB7XG4gICAgICAgICAgICBpZCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiKTtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiLHRoaXMudW5pcXVlSWRSZWdpc3RyeS5pZEF0dHJpYnV0ZVdpdGhTdWZmaXgoaWQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGlkICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRNYXAuc2V0KGlkLGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxufSIsImltcG9ydCB7IENvbnRhaW5lckVsZW1lbnQsIENvbnRhaW5lcldpbmRvdyB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vY29tcG9uZW50L2NvbXBvbmVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi4vZXZlbnQvZXZlbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIENhbnZhc1Jvb3Qge1xuXG4gICAgc3RhdGljIHNob3VsZFN3YWxsb3dOZXh0Rm9jdXNFc2NhcGUgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0NvbXBvbmVudH0gY29tcG9uZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyByZXBsYWNlQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIGJvZHlFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtDb21wb25lbnR9IGNvbXBvbmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgc2V0Q29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBib2R5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIFxuICAgICAqIEBwYXJhbSB7Q29tcG9uZW50fSBjb21wb25lbnQgXG4gICAgICovXG4gICAgc3RhdGljIGFkZENoaWxkQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0NvbXBvbmVudH0gY29tcG9uZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyBhZGRDaGlsZEVsZW1lbnQoaWQsIGVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICovXG4gICAgc3RhdGljIHJlbW92ZUVsZW1lbnQoaWQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5yZW1vdmVFbGVtZW50KGlkKTtcbiAgICB9XG5cbiAgICAvKiogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxuICAgICAqL1xuICAgIHN0YXRpYyBhZGRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5hcHBlbmRSb290TWV0YUNoaWxkKGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgYWRkQm9keUVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBDb250YWluZXJFbGVtZW50LmFwcGVuZFJvb3RVaUNoaWxkKGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgcHJlcGVuZEhlYWRlckVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBDb250YWluZXJFbGVtZW50LnByZXBlbmRFbGVtZW50KFwiaGVhZFwiLCBlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XG4gICAgICovXG4gICAgc3RhdGljIHByZXBlbmRCb2R5RWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQucHJlcGVuZEVsZW1lbnQoXCJib2R5XCIsIGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIFJlbWVtYmVyIHRvIHN3YWxsb3dGb2N1c0VzY2FwZSBmb3IgaW5pdGlhbCB0cmlnZ2VyaW5nIGV2ZW50c1xuICAgICAqIHdoaWNoIGFyZSBleHRlcm5hbCB0byBmb2N1c1Jvb3RcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBsaXN0ZW5lclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGZvY3VzUm9vdFxuICAgICAqL1xuICAgIHN0YXRpYyBsaXN0ZW5Ub0ZvY3VzRXNjYXBlKGxpc3RlbmVyLCBmb2N1c1Jvb3QpIHtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNhbGxJZk5vdENvbnRhaW5zID0gbmV3IE9iamVjdEZ1bmN0aW9uKG51bGwsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKENvbnRhaW5lckVsZW1lbnQuY29udGFpbnMoZm9jdXNSb290LmVsZW1lbnQsIGV2ZW50LmdldFRhcmdldCgpLmVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKENhbnZhc1Jvb3Quc2hvdWxkU3dhbGxvd05leHRGb2N1c0VzY2FwZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxpc3RlbmVyLmNhbGwoZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgQ29udGFpbmVyV2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjYWxsSWZOb3RDb250YWlucywgRXZlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdoZW4gYW4gZWxlbWVudCBpcyBjb25naWd1cmVkIHRvIGJlIGhpZGRlbiBieSBGb2N1c0VzY2FwZSxcbiAgICAgKiBhbmQgd2FzIHNob3duIGJ5IGFuIGV2ZW50IHRyaWdnZXJlZCBmcm9tIGFuIGV4dGVybmFsIGVsZW1lbnQsXG4gICAgICogdGhlbiBGb2N1c0VzY2FwZSBnZXRzIHRyaWdnZXJlZCByaWdodCBhZnRlciB0aGUgZWxlbWVudCBpc1xuICAgICAqIHNob3duLiBUaGVyZWZvcmUgdGhpcyBmdW5jdGlvbiBhbGxvd3MgdGhpcyBldmVudCB0byBiZSBcbiAgICAgKiBzd2FsbG93ZWQgdG8gYXZvaWQgdGhpcyBiZWhhdmlvclxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmb3JNaWxsaXNlY29uZHMgXG4gICAgICovXG4gICAgc3RhdGljIHN3YWxsb3dGb2N1c0VzY2FwZShmb3JNaWxsaXNlY29uZHMpIHtcbiAgICAgICAgQ2FudmFzUm9vdC5zaG91bGRTd2FsbG93TmV4dEZvY3VzRXNjYXBlID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBDYW52YXNSb290LnNob3VsZFN3YWxsb3dOZXh0Rm9jdXNFc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgfSwgZm9yTWlsbGlzZWNvbmRzKTtcbiAgICB9XG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7RWxlbWVudE1hcHBlcn0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgSFRNTHtcblxuICAgIHN0YXRpYyBjdXN0b20oZWxlbWVudE5hbWUpe1xuICAgICAgICB2YXIgeG1sRWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnROYW1lKTtcbiAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHhtbEVsZW1lbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBhcHBseVN0eWxlcyhlbGVtZW50LCBjbGFzc1ZhbHVlLCBzdHlsZVZhbHVlKXtcbiAgICAgICAgaWYoY2xhc3NWYWx1ZSl7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiY2xhc3NcIiwgY2xhc3NWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3R5bGVWYWx1ZSl7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIiwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYSh2YWx1ZSwgaHJlZiwgY2xhc3NWYWx1ZSwgc3R5bGVWYWx1ZSl7XG4gICAgICAgIHZhciBlbGVtZW50ID0gSFRNTC5jdXN0b20oXCJhXCIpO1xuICAgICAgICBlbGVtZW50LmFkZENoaWxkKHZhbHVlKTtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImhyZWZcIixocmVmKTtcbiAgICAgICAgSFRNTC5hcHBseVN0eWxlcyhlbGVtZW50LCBjbGFzc1ZhbHVlLCBzdHlsZVZhbHVlKTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGkodmFsdWUsIGNsYXNzVmFsdWUsIHN0eWxlVmFsdWUpe1xuICAgICAgICB2YXIgZWxlbWVudCA9IEhUTUwuY3VzdG9tKFwiaVwiKTtcbiAgICAgICAgZWxlbWVudC5hZGRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIEhUTUwuYXBwbHlTdHlsZXMoZWxlbWVudCwgY2xhc3NWYWx1ZSwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IE1hcCwgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDYW52YXNSb290IH0gZnJvbSBcIi4vY2FudmFzUm9vdC5qc1wiO1xuaW1wb3J0IHsgSFRNTCB9IGZyb20gXCIuLi9odG1sL2h0bWwuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFRleHRub2RlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L3RleHRub2RlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ2FudmFzU3R5bGVzXCIpO1xuXG5jb25zdCBzdHlsZXMgPSBuZXcgTWFwKCk7XG5jb25zdCBzdHlsZU93bmVycyA9IG5ldyBNYXAoKTtcbmNvbnN0IGVuYWJsZWRTdHlsZXMgPSBuZXcgTGlzdCgpO1xuXG5leHBvcnQgY2xhc3MgQ2FudmFzU3R5bGVzIHtcblxuICAgIHN0YXRpYyBzZXRTdHlsZShuYW1lLCBzb3VyY2UpIHtcbiAgICAgICAgaWYoc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBzdHlsZXMuZ2V0KG5hbWUpLnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xuICAgICAgICAgICAgbGV0IHN0eWxlRWxlbWVudCA9IEhUTUwuY3VzdG9tKFwic3R5bGVcIik7XG4gICAgICAgICAgICBzdHlsZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiLG5hbWUpO1xuICAgICAgICAgICAgc3R5bGVFbGVtZW50LnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XG4gICAgICAgICAgICBzdHlsZXMuc2V0KG5hbWUsIHN0eWxlRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlU3R5bGUobmFtZSkge1xuICAgICAgICBpZihlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLnJlbW92ZShuYW1lKTtcbiAgICAgICAgICAgIENhbnZhc1Jvb3QucmVtb3ZlRWxlbWVudChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZihzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHN0eWxlcy5yZW1vdmUobmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZGlzYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XG4gICAgICAgIENhbnZhc1N0eWxlcy5yZW1vdmVTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xuICAgICAgICBpZihDYW52YXNTdHlsZXMuaGFzU3R5bGVPd25lcihuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihcIlN0eWxlIGRvZXMgbm90IGV4aXN0OiBcIiArIG5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMucmVtb3ZlKG5hbWUpO1xuICAgICAgICAgICAgQ2FudmFzUm9vdC5yZW1vdmVFbGVtZW50KG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGVuYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XG4gICAgICAgIENhbnZhc1N0eWxlcy5hZGRTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xuICAgICAgICBpZighc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJTdHlsZSBkb2VzIG5vdCBleGlzdDogXCIgKyBuYW1lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZighZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5hZGQobmFtZSk7XG4gICAgICAgICAgICBDYW52YXNSb290LmFkZEhlYWRlckVsZW1lbnQoc3R5bGVzLmdldChuYW1lKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYWRkU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgc3R5bGVPd25lcnMuc2V0KG5hbWUsIG5ldyBMaXN0KCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5nZXQobmFtZSkuY29udGFpbnMob3duZXJJZCkpIHtcbiAgICAgICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5hZGQob3duZXJJZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5yZW1vdmUob3duZXJJZCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGhhc1N0eWxlT3duZXIobmFtZSkge1xuICAgICAgICBpZighc3R5bGVPd25lcnMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3R5bGVPd25lcnMuZ2V0KG5hbWUpLnNpemUoKSA+IDA7XG4gICAgfVxufSIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudFwiO1xuaW1wb3J0IHsgVW5pcXVlSWRSZWdpc3RyeSB9IGZyb20gXCIuL3VuaXF1ZUlkUmVnaXN0cnlcIjtcbmltcG9ydCB7IEVsZW1lbnRSZWdpc3RyYXRvciB9IGZyb20gXCIuL2VsZW1lbnRSZWdpc3RyYXRvclwiO1xuaW1wb3J0IHsgRXZlbnRSZWdpc3RyeSB9IGZyb20gXCIuLi9ldmVudC9ldmVudFJlZ2lzdHJ5XCI7XG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnlcIjtcbmltcG9ydCB7IERvbVRyZWUgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNSZWdpc3RyeVwiO1xuaW1wb3J0IHsgQ2FudmFzU3R5bGVzIH0gZnJvbSBcIi4uL2NhbnZhcy9jYW52YXNTdHlsZXNcIjtcbmltcG9ydCB7IEluamVjdGlvblBvaW50IH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDb21wb25lbnRGYWN0b3J5XCIpO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvKiogQHR5cGUge0V2ZW50UmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMuZXZlbnRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKEV2ZW50UmVnaXN0cnkpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3R5bGVzUmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtUZW1wbGF0ZVJlZ2lzdHJ5fSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShUZW1wbGF0ZVJlZ2lzdHJ5KTtcblxuICAgICAgICAvKiogQHR5cGUge1VuaXF1ZUlkUmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFVuaXF1ZUlkUmVnaXN0cnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHJlcHJlc2VudHMgdGhlIHRlbXBsYXRlIGFuZCB0aGUgc3R5bGVzIG5hbWUgaWYgdGhlIHN0eWxlIGZvciB0aGF0IG5hbWUgaXMgYXZhaWxhYmxlXG4gICAgICovXG4gICAgY3JlYXRlKG5hbWUpe1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlUmVnaXN0cnkuZ2V0KG5hbWUpO1xuICAgICAgICBpZighdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcih0aGlzLnRlbXBsYXRlUmVnaXN0cnkpO1xuICAgICAgICAgICAgdGhyb3cgXCJObyB0ZW1wbGF0ZSB3YXMgZm91bmQgd2l0aCBuYW1lIFwiICsgbmFtZTtcblxuICAgICAgICB9XG4gICAgICAgIHZhciBlbGVtZW50UmVnaXN0cmF0b3IgPSBuZXcgRWxlbWVudFJlZ2lzdHJhdG9yKHRoaXMuZXZlbnRSZWdpc3RyeSwgdGhpcy51bmlxdWVJZFJlZ2lzdHJ5LCBjb21wb25lbnRDb3VudGVyKyspO1xuICAgICAgICBuZXcgRG9tVHJlZSh0ZW1wbGF0ZS5nZXRUZW1wbGF0ZVNvdXJjZSgpLGVsZW1lbnRSZWdpc3RyYXRvcikubG9hZCgpO1xuXG4gICAgICAgIHRoaXMubW91bnRTdHlsZXMobmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnQoZWxlbWVudFJlZ2lzdHJhdG9yLmNvbXBvbmVudEluZGV4LCBlbGVtZW50UmVnaXN0cmF0b3Iucm9vdEVsZW1lbnQsIGVsZW1lbnRSZWdpc3RyYXRvci5nZXRFbGVtZW50TWFwKCkpO1xuICAgIH1cblxuICAgIG1vdW50U3R5bGVzKG5hbWUpIHtcbiAgICAgICAgaWYodGhpcy5zdHlsZXNSZWdpc3RyeS5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgQ2FudmFzU3R5bGVzLnNldFN0eWxlKG5hbWUsIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0KG5hbWUpKTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG52YXIgY29tcG9uZW50Q291bnRlciA9IDA7IiwiaW1wb3J0IHsgTG9nZ2VyLCBMaXN0IH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcbmltcG9ydCB7IFNpbmdsZXRvbkNvbmZpZywgUHJvdG90eXBlQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCJcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBFdmVudFJlZ2lzdHJ5IH0gZnJvbSBcIi4vZXZlbnQvZXZlbnRSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgVW5pcXVlSWRSZWdpc3RyeSB9IGZyb20gXCIuL2NvbXBvbmVudC91bmlxdWVJZFJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBDb21wb25lbnRGYWN0b3J5IH0gZnJvbSBcIi4vY29tcG9uZW50L2NvbXBvbmVudEZhY3RvcnkuanNcIjtcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDb25maWdcIik7XG5cbmV4cG9ydCBjbGFzcyBDb25maWcge1xuXG4gICAgc3RhdGljIGdldEluc3RhbmNlKCkge1xuICAgICAgICByZXR1cm4ganVzdHJpZ2h0Q29uZmlnO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnR5cGVDb25maWdMaXN0ID0gbmV3IExpc3QoW1xuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVGVtcGxhdGVSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChTdHlsZXNSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChVbmlxdWVJZFJlZ2lzdHJ5KSxcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKENvbXBvbmVudEZhY3RvcnkpLFxuICAgICAgICAgICAgUHJvdG90eXBlQ29uZmlnLnVubmFtZWQoRXZlbnRSZWdpc3RyeSldKTtcbiAgICAgICAgfVxuXG4gICAgZ2V0VHlwZUNvbmZpZ0xpc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVDb25maWdMaXN0O1xuICAgIH1cblxufVxuXG5jb25zdCBqdXN0cmlnaHRDb25maWcgPSBuZXcgQ29uZmlnKCk7IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkxvYWRlckludGVyY2VwdG9yXCIpO1xuXG5leHBvcnQgY2xhc3MgTG9hZGVySW50ZXJjZXB0b3Ige1xuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge0Jvb2xlYW59XG4gICAgICovXG4gICAgcHJvY2VzcygpIHtcbiAgICAgICAgTE9HLmluZm8oXCJVbmltcGxlbWVudGVkIExvYWRlciBJbnRlcmNlcHRvciBicmVha3MgYnkgZGVmYXVsdFwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxufSIsImltcG9ydCB7IExvZ2dlciwgU3RyaW5nVXRpbHMgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XG5pbXBvcnQgeyBMb2FkZXJJbnRlcmNlcHRvciB9IGZyb20gXCIuL2xvYWRlckludGVyY2VwdG9yLmpzXCJcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIk1vZHVsZUxvYWRlclwiKTtcblxuZXhwb3J0IGNsYXNzIE1vZHVsZUxvYWRlciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbWF0Y2hQYXRoIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGVQYXRoIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8TG9hZGVySW50ZXJjZXB0b3I+fSBsb2FkZXJJbnRlcmNlcHRvcnNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihtYXRjaFBhdGgsIG1vZHVsZVBhdGgsIGxvYWRlckludGVyY2VwdG9ycyA9IFtdKSB7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubWF0Y2hQYXRoID0gbWF0Y2hQYXRoO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tb2R1bGVQYXRoID0gbW9kdWxlUGF0aDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge0FycmF5PExvYWRlckludGVyY2VwdG9yPn1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubG9hZGVySW50ZXJjZXB0b3JzID0gbG9hZGVySW50ZXJjZXB0b3JzO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWF0Y2hlcyBpZiB0aGUgY29uZmlndXJlZCBtYXRjaFVybCBzdGFydHMgd2l0aCB0aGUgcHJvdmlkZWQgdXJsIG9yXG4gICAgICogaWYgdGhlIGNvbmZpZ3VyZWQgbWF0Y2hVcmwgaXMgbnVsbFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgbWF0Y2hlcyh1cmwpe1xuICAgICAgICBpZiAoIXRoaXMubWF0Y2hQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXVybCkge1xuICAgICAgICAgICAgTE9HLmVycm9yKFwiVXJsIGlzIG51bGxcIik7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFN0cmluZ1V0aWxzLm5vbk51bGxFcXVhbHModGhpcy5tYXRjaFBhdGgsIHVybC5nZXRQYXRoKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPE1haW4+fVxuICAgICAqL1xuICAgIGxvYWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmltcG9ydE1vZHVsZSgpLnRoZW4oKG1haW4pID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmludGVyY2VwdG9yc1Bhc3MoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFpbjtcbiAgICAgICAgICAgIH0pLmNhdGNoKChyZWFzb24pID0+IHtcbiAgICAgICAgICAgICAgICBMT0cud2FybihcIkZpbHRlciByZWplY3RlZCBcIiArIHJlYXNvbik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgaW50ZXJjZXB0b3JzUGFzcygpIHtcbiAgICAgICAgY29uc3QgaW50ZXJjZXB0b3JzID0gdGhpcy5sb2FkZXJJbnRlcmNlcHRvcnM7XG4gICAgICAgIGlmIChpbnRlcmNlcHRvcnMgJiYgaW50ZXJjZXB0b3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxldCBpbnRlcmNlcHRvclByb21pc2VDaGFpbiA9IGludGVyY2VwdG9yc1swXS5wcm9jZXNzKCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGludGVyY2VwdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGludGVyY2VwdG9yUHJvbWlzZUNoYWluID0gaW50ZXJjZXB0b3JQcm9taXNlQ2hhaW4udGhlbihpbnRlcmNlcHRvcnNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGludGVyY2VwdG9yUHJvbWlzZUNoYWluO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBpbXBvcnRNb2R1bGUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpbXBvcnQodGhpcy5tb2R1bGVQYXRoKS50aGVuKChtb2R1bGUpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKG5ldyBtb2R1bGUuZGVmYXVsdCgpKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChyZWFzb24pID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi91dGlsL3VybFwiO1xuXG5leHBvcnQgY2xhc3MgTWFpbiB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGxvYWQodXJsKSB7XG4gICAgICAgIHRocm93IFwiTWFpbiBjbGFzcyBtdXN0IGltcGxlbWVudCBsb2FkKHVybClcIjtcbiAgICB9XG5cbiAgICB1cGRhdGUoKSB7XG4gICAgICAgIHRocm93IFwiTWFpbiBjbGFzcyBtdXN0IGltcGxlbWVudCB1cGRhdGUoKVwiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IHBhdGgoKSB7XG4gICAgICAgIHRocm93IFwiTWFpbiBjbGFzcyBtdXN0IGltcGxlbWVudCBnZXQgcGF0aCgpXCI7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcbmltcG9ydCB7IE1pbmRpQ29uZmlnLCBNaW5kaUluamVjdG9yIH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBNb2R1bGVMb2FkZXIgfSBmcm9tIFwiLi9tb2R1bGVMb2FkZXIuanNcIjtcbmltcG9ydCB7IExvYWRlckludGVyY2VwdG9yIH0gZnJvbSBcIi4vbG9hZGVySW50ZXJjZXB0b3IuanNcIlxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9tYWluLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJEaU1vZHVsZUxvYWRlclwiKTtcblxuZXhwb3J0IGNsYXNzIERpTW9kdWxlTG9hZGVyIGV4dGVuZHMgTW9kdWxlTG9hZGVyIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWluZGlDb25maWd9IGNvbmZpZ1xuICAgICAqIEBwYXJhbSB7UmVnRXhwfSBtYXRjaFBhdGggXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1vZHVsZVBhdGggXG4gICAgICogQHBhcmFtIHtBcnJheTxMb2FkZXJJbnRlcmNlcHRvcj59IGxvYWRlckludGVyY2VwdG9yc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgbWF0Y2hQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJJbnRlcmNlcHRvcnMgPSBbXSkge1xuICAgICAgICBzdXBlcihtYXRjaFBhdGgsIG1vZHVsZVBhdGgsIGxvYWRlckludGVyY2VwdG9ycyk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNaW5kaUNvbmZpZ30gKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2U8TWFpbj59XG4gICAgICovXG4gICAgbG9hZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW1wb3J0TW9kdWxlKCkudGhlbigobWFpbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJjZXB0b3JzUGFzcygpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBNaW5kaUluamVjdG9yLmluamVjdChtYWluLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgICAgICB9KS5jYXRjaCgocmVhc29uKSA9PiB7XG4gICAgICAgICAgICAgICAgTE9HLndhcm4oXCJGaWx0ZXIgcmVqZWN0ZWQgXCIgKyByZWFzb24pO1xuICAgICAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KS5jYXRjaCgocmVhc29uKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TW9kdWxlTG9hZGVyfSBtb2R1bGVMb2FkZXJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBpbXBvcnRNb2R1bGUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gc3VwZXIuaW1wb3J0TW9kdWxlKCkudGhlbigobWFpbikgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmFkZEFsbFR5cGVDb25maWcobWFpbi50eXBlQ29uZmlnTGlzdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcuZmluYWxpemUoKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICBuZXcgTGlzdCh0aGlzLmxvYWRlckludGVyY2VwdG9ycykucHJvbWlzZUNoYWluKChsb2FkZXJJbnRlcmNlcHRvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE1pbmRpSW5qZWN0b3IuaW5qZWN0KGxvYWRlckludGVyY2VwdG9yLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgICAgICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShtYWluKTtcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGYWlsZWQgdG8gaW5qZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBGYWlsZWQgdG8gZmluYWxpemUgY29uZmlnXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEZhaWxlZCB0byBpbXBvcnQgbW9kdWxlXG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59IiwiaW1wb3J0IHsgTWluZGlJbmplY3RvciwgTWluZGlDb25maWcsIEluc3RhbmNlUG9zdENvbmZpZ1RyaWdnZXIsIENvbmZpZ0FjY2Vzc29yLCBTaW5nbGV0b25Db25maWcsIFByb3RvdHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xuaW1wb3J0IHsgTGlzdCwgTG9nZ2VyLCBPYmplY3RGdW5jdGlvbiwgU3RyaW5nVXRpbHMgfSBmcm9tICBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb250YWluZXJVcmwgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBDb21wb25lbnRDb25maWdQcm9jZXNzb3IgfSBmcm9tIFwiLi9jb21wb25lbnQvY29tcG9uZW50Q29uZmlnUHJvY2Vzc29yLmpzXCI7XG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IENvbmZpZyB9IGZyb20gXCIuL2NvbmZpZy5qc1wiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi9ldmVudC9ldmVudC5qc1wiO1xuaW1wb3J0IHsgSGlzdG9yeSB9IGZyb20gXCIuL25hdmlnYXRpb24vaGlzdG9yeS5qc1wiO1xuaW1wb3J0IHsgRGlNb2R1bGVMb2FkZXIgfSBmcm9tIFwiLi9sb2FkZXIvZGlNb2R1bGVMb2FkZXIuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuL3V0aWwvdXJsLmpzXCI7XG5pbXBvcnQgeyBNb2R1bGVSdW5uZXIgfSBmcm9tIFwiLi9tb2R1bGVSdW5uZXIuanNcIjtcbmltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi9tYWluLmpzXCI7XG5pbXBvcnQgeyBBY3RpdmVNb2R1bGVSdW5uZXIgfSBmcm9tIFwiLi9hY3RpdmVNb2R1bGVSdW5uZXIuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkFwcGxpY2F0aW9uXCIpO1xuXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb24gZXh0ZW5kcyBNb2R1bGVSdW5uZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICAvKiogQHR5cGUge0xpc3R9ICovXG4gICAgICAgIHRoaXMud29ya2VyTGlzdCA9IG5ldyBMaXN0KCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0PERpTW9kdWxlTG9hZGVyPn0gKi9cbiAgICAgICAgdGhpcy5tb2R1bGVMb2FkZXJMaXN0ID0gbmV3IExpc3QoKTtcblxuICAgICAgICAvKiogQHR5cGUge01pbmRpQ29uZmlnfSAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IG5ldyBNaW5kaUNvbmZpZygpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TGlzdH0gKi9cbiAgICAgICAgdGhpcy5ydW5uaW5nV29ya2VycyA9IG5ldyBMaXN0KCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYWlufSAqL1xuICAgICAgICB0aGlzLmFjdGl2ZU1haW4gPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZGVmYXVsdENvbmZpZyA9IENvbmZpZy5nZXRJbnN0YW5jZSgpLmdldFR5cGVDb25maWdMaXN0KCk7XG5cbiAgICAgICAgdGhpcy5kZWZhdWx0Q29uZmlnUHJvY2Vzc29ycyA9IG5ldyBMaXN0KFsgQ29tcG9uZW50Q29uZmlnUHJvY2Vzc29yIF0pO1xuXG4gICAgICAgIHRoaXMuZGVmYXVsdEluc3RhbmNlUHJvY2Vzc29ycyA9IG5ldyBMaXN0KFsgSW5zdGFuY2VQb3N0Q29uZmlnVHJpZ2dlciBdKVxuXG4gICAgICAgIHRoaXMuY3VzdG9tQ29uZmlnID0gbmV3IExpc3QoKTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TGlzdDxTaW5nbGV0b25Db25maWcgfCBQcm90b3R5cGVDb25maWc+fSB0eXBlQ29uZmlnTGlzdCBcbiAgICAgKi9cbiAgICBzZXQgY3VzdG9tVHlwZUNvbmZpZyh0eXBlQ29uZmlnTGlzdCkge1xuICAgICAgICB0aGlzLmN1c3RvbUNvbmZpZyA9IHR5cGVDb25maWdMaXN0O1xuICAgIH1cblxuICAgIHJ1bigpIHtcbiAgICAgICAgTE9HLmluZm8oXCJSdW5uaW5nIEFwcGxpY2F0aW9uXCIpO1xuICAgICAgICB0aGlzLmNvbmZpZ1xuICAgICAgICAgICAgLmFkZEFsbFR5cGVDb25maWcodGhpcy5kZWZhdWx0Q29uZmlnKVxuICAgICAgICAgICAgLmFkZEFsbFR5cGVDb25maWcodGhpcy5jdXN0b21Db25maWcpXG4gICAgICAgICAgICAuYWRkQWxsQ29uZmlnUHJvY2Vzc29yKHRoaXMuZGVmYXVsdENvbmZpZ1Byb2Nlc3NvcnMpXG4gICAgICAgICAgICAuYWRkQWxsSW5zdGFuY2VQcm9jZXNzb3IodGhpcy5kZWZhdWx0SW5zdGFuY2VQcm9jZXNzb3JzKTtcbiAgICAgICAgQWN0aXZlTW9kdWxlUnVubmVyLmluc3RhbmNlKCkuc2V0KHRoaXMpO1xuICAgICAgICBDb250YWluZXJVcmwuYWRkVXNlck5hdmlnYXRlTGlzdGVuZXIoXG4gICAgICAgICAgICBuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy51cGRhdGUpLFxuICAgICAgICAgICAgRXZlbnRcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5ydW5Nb2R1bGUoSGlzdG9yeS5jdXJyZW50VXJsKCkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGFydFdvcmtlcnMoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnRcbiAgICAgKi9cbiAgICB1cGRhdGUoZXZlbnQpIHtcbiAgICAgICAgY29uc3QgdXJsID0gSGlzdG9yeS5jdXJyZW50VXJsKCk7XG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZU1haW4gJiYgU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyh0aGlzLmFjdGl2ZU1haW4ucGF0aCwgdXJsLmdldFBhdGgoKSkpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlTWFpbi51cGRhdGUodXJsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJ1bk1vZHVsZSh1cmwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcnVuTW9kdWxlKHVybCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRNYXRjaGluZ01vZHVsZUxvYWRlcih1cmwpLmxvYWQoKS50aGVuKChtYWluKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZU1haW4gPSBtYWluO1xuICAgICAgICAgICAgbWFpbi5sb2FkKHVybCwgbnVsbCk7XG4gICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgTE9HLmVycm9yKGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhcnRXb3JrZXJzKCkge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nV29ya2Vycy5zaXplKCkgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53b3JrZXJMaXN0LmZvckVhY2goKHZhbHVlLHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgdmFsdWUoKTtcbiAgICAgICAgICAgIE1pbmRpSW5qZWN0b3IuaW5qZWN0KGluc3RhbmNlLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmdXb3JrZXJzLmFkZChpbnN0YW5jZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtVcmx9IHVybFxuICAgICAqIEByZXR1cm5zIHtEaU1vZHVsZUxvYWRlcn1cbiAgICAgKi9cbiAgICBnZXRNYXRjaGluZ01vZHVsZUxvYWRlcih1cmwpIHtcbiAgICAgICAgbGV0IGZvdW5kTW9kdWxlTG9hZGVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5tb2R1bGVMb2FkZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaGVzKHVybCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZE1vZHVsZUxvYWRlciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGZvdW5kTW9kdWxlTG9hZGVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBnbG9iYWwgYWNjZXNzIHRvIGRlcGVuZGVuY3kgaW5qZWN0aW9uIGNvbmZpZ1xuICAgICAqL1xuICAgIHdpbmRvd0RpQ29uZmlnKCkge1xuICAgICAgICB3aW5kb3cuZGlDb25maWcgPSAoKSA9PiB7XG4gICAgICAgICAgICBMT0cuaW5mbyh0aGlzLmNvbmZpZy5jb25maWdFbnRyaWVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBnbG9iYWwgYWNjZXNzIHRvIHRlbXBsYXRlIHJlZ2lzdHJ5XG4gICAgICovXG4gICAgd2luZG93VGVtcGxhdGVSZWdpc3RyeSgpIHtcbiAgICAgICAgd2luZG93LnRlbXBsYXRlUmVnaXN0cnkgPSAoKSA9PiB7XG4gICAgICAgICAgICBMT0cuaW5mbyhDb25maWdBY2Nlc3Nvci5pbnN0YW5jZUhvbGRlcihUZW1wbGF0ZVJlZ2lzdHJ5Lm5hbWUsIHRoaXMuY29uZmlnKS5pbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byBzdHlsZSByZWdpc3RyeVxuICAgICAqL1xuICAgIHdpbmRvd1N0eWxlUmVnaXN0cnkoKSB7XG4gICAgICAgIHdpbmRvdy5zdHlsZVJlZ2lzdHJ5ID0gKCkgPT4ge1xuICAgICAgICAgICAgTE9HLmluZm8oQ29uZmlnQWNjZXNzb3IuaW5zdGFuY2VIb2xkZXIoU3R5bGVzUmVnaXN0cnkubmFtZSwgdGhpcy5jb25maWcpLmluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IFByb3BlcnR5QWNjZXNzb3IsIExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudFwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSW5wdXRFbGVtZW50RGF0YUJpbmRpbmdcIik7XG5cbmV4cG9ydCBjbGFzcyBJbnB1dEVsZW1lbnREYXRhQmluZGluZyB7XG5cbiAgICBjb25zdHJ1Y3Rvcihtb2RlbCwgdmFsaWRhdG9yKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy52YWxpZGF0b3IgPSB2YWxpZGF0b3I7XG4gICAgICAgIHRoaXMucHVsbGVycyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMucHVzaGVycyA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGxpbmsobW9kZWwsIHZhbGlkYXRvcikge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0RWxlbWVudERhdGFCaW5kaW5nKG1vZGVsLCB2YWxpZGF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZpZWxkIFxuICAgICAqL1xuICAgIGFuZChmaWVsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50byhmaWVsZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdElucHV0RWxlbWVudH0gZmllbGQgXG4gICAgICovXG4gICAgdG8oZmllbGQpIHtcbiAgICAgICAgY29uc3QgcHVsbGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgbGV0IG1vZGVsVmFsdWUgPSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUpO1xuICAgICAgICAgICAgaWYgKG1vZGVsVmFsdWUgIT09IGZpZWxkLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgUHJvcGVydHlBY2Nlc3Nvci5zZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lLCBmaWVsZC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlKGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZmllbGQuYXR0YWNoRXZlbnQoXCJvbmNoYW5nZVwiLCBwdWxsZXIpO1xuICAgICAgICBmaWVsZC5hdHRhY2hFdmVudChcIm9ua2V5dXBcIiwgcHVsbGVyKTtcbiAgICAgICAgcHVsbGVyLmNhbGwoKTtcblxuICAgICAgICBjb25zdCBwdXNoZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgbW9kZWxWYWx1ZSA9IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgZmllbGQubmFtZSk7XG4gICAgICAgICAgICBpZiAobW9kZWxWYWx1ZSAhPT0gZmllbGQudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBmaWVsZC52YWx1ZSA9IG1vZGVsVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGVTaWxlbnQgJiYgZmllbGQudmFsdWUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlU2lsZW50KGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uTmFtZSA9IFwiX19jaGFuZ2VkX1wiICsgZmllbGQubmFtZS5yZXBsYWNlKFwiLlwiLFwiX1wiKTtcbiAgICAgICAgaWYgKCF0aGlzLm1vZGVsW2NoYW5nZWRGdW5jdGlvbk5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVsW2NoYW5nZWRGdW5jdGlvbk5hbWVdID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucHVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wdWxsZXJzLmFkZChwdWxsZXIpO1xuICAgICAgICB0aGlzLnB1c2hlcnMuYWRkKHB1c2hlcik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcHVsbCgpIHtcbiAgICAgICAgdGhpcy5wdWxsZXJzLmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBwdXNoKCkge1xuICAgICAgICB0aGlzLnB1c2hlcnMuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbChwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBQcm94eU9iamVjdEZhY3Rvcnkge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHByb3h5IGZvciBhbiBvYmplY3Qgd2hpY2ggYWxsb3dzIGRhdGFiaW5kaW5nIGZyb20gdGhlIG9iamVjdCB0byB0aGUgZm9ybSBlbGVtZW50XG4gICAgICogXG4gICAgICogQHRlbXBsYXRlIFRcbiAgICAgKiBAcGFyYW0ge1R9IG9iamVjdCBcbiAgICAgKiBAcmV0dXJucyB7VH1cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlUHJveHlPYmplY3Qob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkob2JqZWN0LCB7XG4gICAgICAgICAgICBzZXQ6ICh0YXJnZXQsIHByb3AsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHN1Y2Nlc3MgPSAodGFyZ2V0W3Byb3BdID0gdmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbk5hbWUgPSBcIl9fY2hhbmdlZF9cIiArIHByb3A7XG4gICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbiA9IHRhcmdldFtjaGFuZ2VkRnVuY3Rpb25OYW1lXTtcbiAgICAgICAgICAgICAgICBpZihjaGFuZ2VkRnVuY3Rpb24gJiYgdHlwZW9mIGNoYW5nZWRGdW5jdGlvbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBib3VuZENoYW5nZWRGdW5jdGlvbiA9IGNoYW5nZWRGdW5jdGlvbi5iaW5kKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIGJvdW5kQ2hhbmdlZEZ1bmN0aW9uKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzID09PSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSIsImltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbi8qKlxuICogT2JqZWN0IEZ1bmN0aW9uIHdoaWNoIGlzIGNhbGxlZCBpZiB0aGUgZmlsdGVyIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZVxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRGaWx0ZXJlZE9iamVjdEZ1bmN0aW9uIGV4dGVuZHMgT2JqZWN0RnVuY3Rpb24ge1xuXG4gICAgLyoqXG4gICAgICogQ29udHJ1Y3RvclxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IG9iamVjdEZ1bmN0aW9uIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRoZUZpbHRlciBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvYmplY3RGdW5jdGlvbiwgZmlsdGVyKXtcbiAgICAgICAgdGhpcy5vYmplY3RGdW5jdGlvbiA9IG9iamVjdEZ1bmN0aW9uO1xuICAgICAgICB0aGlzLmZpbHRlciA9IGZpbHRlcjtcbiAgICB9XG5cbiAgICBjYWxsKHBhcmFtcyl7XG4gICAgICAgIGlmKHRoaXMuZmlsdGVyICYmIHRoaXMuZmlsdGVyLmNhbGwodGhpcyxwYXJhbXMpKSB7XG4gICAgICAgICAgICB0aGlzLm9iamVjdEZ1bmN0aW9uLmNhbGwocGFyYW1zKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImV4cG9ydCBjbGFzcyBUcmFpbE5vZGUge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMucGF0aCA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtwcm9wZXJ0eX0gKi9cbiAgICAgICAgdGhpcy5wcm9wZXJ0eSA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtmdW5jdGlvbn0gKi9cbiAgICAgICAgdGhpcy53YXlwb2ludCA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtmdW5jdGlvbn0gKi9cbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtBcnJheTxUcmFpbE5vZGU+fSAqL1xuICAgICAgICB0aGlzLm5leHQgPSBudWxsO1xuICAgIH1cblxufSIsImltcG9ydCB7IExpc3QsIFN0cmluZ1V0aWxzIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBUcmFpbE5vZGUgfSBmcm9tIFwiLi90cmFpbE5vZGUuanNcIjtcbmltcG9ydCB7IEhpc3RvcnkgfSBmcm9tIFwiLi9oaXN0b3J5LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUcmFpbFByb2Nlc3NvciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2FueX0gb2JqZWN0IFxuICAgICAqIEBwYXJhbSB7VHJhaWxOb2RlfSBub2RlIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgc3RhdGljIGxvYWQob2JqZWN0LCBub2RlLCB1cmwpIHtcbiAgICAgICAgY29uc3QgdHJhaWwgPSBUcmFpbFByb2Nlc3Nvci5wcm9jZXNzTm9kZShvYmplY3QsIG5vZGUsIHVybCk7XG5cbiAgICAgICAgY29uc3QgY3VycmVudFVybCA9IEhpc3RvcnkuY3VycmVudFVybCgpO1xuICAgICAgICBjdXJyZW50VXJsLnNldEJvb2ttYXJrKG51bGwpO1xuICAgICAgICBIaXN0b3J5LnJlcGxhY2VVcmwoY3VycmVudFVybCwgY3VycmVudFVybC50b1N0cmluZygpLCB0cmFpbCk7XG4gICAgICAgIFxuICAgICAgICB0cmFpbC5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY3VycmVudFVybC5zZXRCb29rbWFyayh2YWx1ZSk7XG4gICAgICAgICAgICBIaXN0b3J5LnB1c2hVcmwoY3VycmVudFVybCwgY3VycmVudFVybC50b1N0cmluZygpLCB0cmFpbCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHthbnl9IG9iamVjdCBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgICBzdGF0aWMgdXBkYXRlKG9iamVjdCwgbm9kZSwgdXJsKSB7XG4gICAgICAgIFRyYWlsUHJvY2Vzc29yLnByb2Nlc3NOb2RlKG9iamVjdCwgbm9kZSwgdXJsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2FueX0gb2JqZWN0IFxuICAgICAqIEBwYXJhbSB7VHJhaWxOb2RlfSBwYXJlbnROb2RlIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHBhcmFtIHtMaXN0PFN0cmluZz59IHRyYWlsU3RvcHNcbiAgICAgKiBAcmV0dXJucyB7TGlzdDxTdHJpbmc+fVxuICAgICAqL1xuICAgIHN0YXRpYyBwcm9jZXNzTm9kZShvYmplY3QsIHBhcmVudE5vZGUsIHVybCwgdHJhaWxTdG9wcyA9IG5ldyBMaXN0KCkpIHtcbiAgICAgICAgbGV0IGN1cnJlbnRPYmplY3QgPSBvYmplY3Q7XG5cbiAgICAgICAgaWYgKHBhcmVudE5vZGUucHJvcGVydHkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRPYmplY3QgPSBvYmplY3RbcGFyZW50Tm9kZS5wcm9wZXJ0eV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoU3RyaW5nVXRpbHMuc3RhcnRzV2l0aCh1cmwuYm9va21hcmssIFRyYWlsUHJvY2Vzc29yLnRvU3RhcnRzV2l0aChwYXJlbnROb2RlLnBhdGgpKSkge1xuICAgICAgICAgICAgLy8gQWRkIHZhbHVlLnBhdGggdG8gaGlzdG9yeVxuICAgICAgICAgICAgdHJhaWxTdG9wcy5hZGQocGFyZW50Tm9kZS5wYXRoKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnROb2RlLndheXBvaW50KSB7XG4gICAgICAgICAgICAgICAgcGFyZW50Tm9kZS53YXlwb2ludC5jYWxsKGN1cnJlbnRPYmplY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKHVybC5ib29rbWFyaywgcGFyZW50Tm9kZS5wYXRoKSkge1xuICAgICAgICAgICAgLy8gQWRkIHZhbHVlLnBhdGggdG8gaGlzdG9yeVxuICAgICAgICAgICAgdHJhaWxTdG9wcy5hZGQocGFyZW50Tm9kZS5wYXRoKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnROb2RlLmRlc3RpbmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5kZXN0aW5hdGlvbi5jYWxsKGN1cnJlbnRPYmplY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhcmVudE5vZGUubmV4dCkge1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5uZXh0LmZvckVhY2goKGNoaWxkTm9kZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRyYWlsU3RvcHMgPSBUcmFpbFByb2Nlc3Nvci5wcm9jZXNzTm9kZShjdXJyZW50T2JqZWN0LCBjaGlsZE5vZGUsIHVybCwgdHJhaWxTdG9wcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cmFpbFN0b3BzO1xuICAgIH1cblxuICAgIHN0YXRpYyB0b1N0YXJ0c1dpdGgocGF0aCkge1xuICAgICAgICBpZiAobnVsbCA9PSBwYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gXCIvXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFN0cmluZ1V0aWxzLm5vbk51bGxFcXVhbHMocGF0aCwgXCIvXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gXCIvXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGggKyBcIi9cIjtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBNYXAsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcblxuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSHR0cENhbGxCdWlsZGVyXCIpO1xuXG5leHBvcnQgY2xhc3MgSHR0cENhbGxCdWlsZGVyIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBheWxvYWQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodXJsLCBwYXlsb2FkKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7T2JqZWN0fSAqL1xuICAgICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xuICAgICAgICB0aGlzLmF1dGhvcml6YXRpb24gPSBudWxsO1xuXG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMuc3VjY2Vzc01hcHBpbmdNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMuZmFpbE1hcHBpbmdNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtmdW5jdGlvbn0gKi9cbiAgICAgICAgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbiA9IChlcnJvcikgPT4geyByZXR1cm4gZXJyb3I7IH07XG5cblxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICAgICAgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlID0gNDAwMDtcblxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICAgICAgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSA9IDQwMDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGF5bG9hZCBcbiAgICAgKiBAcmV0dXJucyB7SHR0cENhbGxCdWlsZGVyfVxuICAgICAqL1xuICAgIHN0YXRpYyBuZXdJbnN0YW5jZSh1cmwsIHBheWxvYWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwQ2FsbEJ1aWxkZXIodXJsLCBwYXlsb2FkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY29kZSBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtYXBwZXJGdW5jdGlvbiBtYXBwZXIgZnVuY3Rpb24gdG8gcGFzcyB0aGUgcmVzdWx0IG9iamVjdCB0b1xuICAgICAqL1xuICAgIHN1Y2Nlc3NNYXBwaW5nKGNvZGUsIG1hcHBlckZ1bmN0aW9uID0gKCkgPT4geyByZXR1cm4gbnVsbDsgfSkge1xuICAgICAgICB0aGlzLnN1Y2Nlc3NNYXBwaW5nTWFwLnNldChjb2RlLCBtYXBwZXJGdW5jdGlvbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1hcHBlckZ1bmN0aW9uIG1hcHBlciBmdW5jdGlvbiB0byBwYXNzIHRoZSByZXN1bHQgb2JqZWN0IHRvXG4gICAgICovXG4gICAgZmFpbE1hcHBpbmcoY29kZSwgbWFwcGVyRnVuY3Rpb24gPSAoKSA9PiB7IHJldHVybiBudWxsOyB9KSB7XG4gICAgICAgIHRoaXMuZmFpbE1hcHBpbmdNYXAuc2V0KGNvZGUsIG1hcHBlckZ1bmN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cbiAgICAgKi9cbiAgICBlcnJvck1hcHBpbmcobWFwcGVyRnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbiA9IG1hcHBlckZ1bmN0aW9uO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXphdGlvbiBcbiAgICAgKi9cbiAgICBhdXRob3JpemF0aW9uSGVhZGVyKGF1dGhvcml6YXRpb24pIHtcbiAgICAgICAgdGhpcy5hdXRob3JpemF0aW9uID0gXCJCZWFyZXIgXCIgKyBhdXRob3JpemF0aW9uO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25uZWN0aW9uVGltZW91dChjb25uZWN0aW9uVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSA9IGNvbm5lY3Rpb25UaW1lb3V0VmFsdWU7XG4gICAgfVxuXG4gICAgcmVzcG9uc2VUaW1lb3V0KHJlc3BvbnNlVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUgPSByZXNwb25zZVRpbWVvdXRWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBnZXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzVHlwZU1hcHBlZFByb21pc2UoXG4gICAgICAgICAgICBDbGllbnQuZ2V0KHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBwb3N0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKFxuICAgICAgICAgICAgQ2xpZW50LnBvc3QodGhpcy51cmwsIHRoaXMucGF5bG9hZCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgcHV0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKFxuICAgICAgICAgICAgQ2xpZW50LnB1dCh0aGlzLnVybCwgdGhpcy5wYXlsb2FkLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBwYXRjaCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXNUeXBlTWFwcGVkUHJvbWlzZShcbiAgICAgICAgICAgIENsaWVudC5wYXRjaCh0aGlzLnVybCwgdGhpcy5wYXlsb2FkLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBkZWxldGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzVHlwZU1hcHBlZFByb21pc2UoXG4gICAgICAgICAgICBDbGllbnQuZGVsZXRlKHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtQcm9taXNlfSBmZXRjaFByb21pc2UgXG4gICAgICovXG4gICAgYXNUeXBlTWFwcGVkUHJvbWlzZShmZXRjaFByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZmV0Y2hQcm9taXNlLnRoZW4oKGZldGNoUmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUZldGNoUmVzcG9uc2UoZmV0Y2hSZXNwb25zZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEFQSSBkaWQgbm90IGV4ZWN1dGVcbiAgICAgICAgICAgICAgICByZWplY3QodGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihlcnJvcikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7UmVzcG9uc2V9IGZldGNoUmVzcG9uc2UgXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZSBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZWplY3QgXG4gICAgICovXG4gICAgaGFuZGxlRmV0Y2hSZXNwb25zZShmZXRjaFJlc3BvbnNlLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgY29uc3Qgc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyID0gdGhpcy5zdWNjZXNzTWFwcGluZ01hcC5nZXQoZmV0Y2hSZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICBjb25zdCBmYWlsUmVzcG9uc2VNYXBwZXIgPSB0aGlzLmZhaWxNYXBwaW5nTWFwLmdldChmZXRjaFJlc3BvbnNlLnN0YXR1cyk7XG5cbiAgICAgICAgLy8gRW1wdHkgcmVzcG9uc2VcbiAgICAgICAgaWYgKDIwNCA9PT0gZmV0Y2hSZXNwb25zZS5zdGF0dXMgfHwgZmV0Y2hSZXNwb25zZS5oZWFkZXJzLmdldChcIkNvbnRlbnQtTGVuZ3RoXCIpID09PSBcIjBcIikge1xuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NSZXNwb25zZU1hcHBlcikge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKG51bGwpKTsgXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZmFpbFJlc3BvbnNlTWFwcGVyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGZhaWxSZXNwb25zZU1hcHBlcihudWxsKSk7IFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJNaXNzaW5nIG1hcHBlciBmb3IgcmV0dXJuIHN0YXR1czogXCIgKyBmZXRjaFJlc3BvbnNlLnN0YXR1cykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzdW1pbmcganNvbiByZXNwb25zZSAgICAgICAgXG4gICAgICAgIGZldGNoUmVzcG9uc2UuanNvbigpLnRoZW4oKHJlc3BvbnNlSnNvbikgPT4ge1xuICAgICAgICAgICAgaWYoc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKSB7IFxuICAgICAgICAgICAgICAgIHJlc29sdmUoc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKHJlc3BvbnNlSnNvbikpOyBcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihmYWlsUmVzcG9uc2VNYXBwZXIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZmFpbFJlc3BvbnNlTWFwcGVyKHJlc3BvbnNlSnNvbikpOyBcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWplY3QodGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihyZXNwb25zZUpzb24pKTtcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAvLyBSZXNwb25zZSBkaWQgbm90IHByb3ZpZGUganNvblxuICAgICAgICAgICAgcmVqZWN0KHRoaXMuZXJyb3JNYXBwaW5nRnVuY3Rpb24oZXJyb3IpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJBYnN0cmFjdFZhbGlkYXRvclwiKTtcblxuZXhwb3J0IGNsYXNzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNDdXJyZW50bHlWYWxpZFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGN1cnJlbnRseVZhbGlkID0gZmFsc2UsIGVuYWJsZWQgPSB0cnVlKSB7XG4gICAgICAgIHRoaXMudmFsaWRMaXN0ZW5lckxpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gY3VycmVudGx5VmFsaWQ7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgfVxuXG4gICAgZW5hYmxlKCkge1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHRoaXMudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGlzYWJsZSgpIHtcbiAgICAgICAgbGV0IHdhc1ZhbGlkID0gdGhpcy5jdXJyZW50bHlWYWxpZDtcbiAgICAgICAgLy8gRmFrZSB2YWxpZFxuICAgICAgICB0aGlzLnZhbGlkKCk7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gd2FzVmFsaWQ7XG4gICAgfVxuXG4gICAgaXNWYWxpZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRseVZhbGlkO1xuICAgIH1cblxuXHR2YWxpZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gdHJ1ZTtcbiAgICAgICAgaWYoIXRoaXMudmFsaWRMaXN0ZW5lckxpc3QpIHtcbiAgICAgICAgICAgIExPRy53YXJuKFwiTm8gdmFsaWRhdGlvbiBsaXN0ZW5lcnNcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52YWxpZExpc3RlbmVyTGlzdC5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG5cdH1cblxuXHRpbnZhbGlkKCkge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBmYWxzZTtcbiAgICAgICAgaWYoIXRoaXMuaW52YWxpZExpc3RlbmVyTGlzdCkge1xuICAgICAgICAgICAgTE9HLndhcm4oXCJObyBpbnZhbGlkYXRpb24gbGlzdGVuZXJzXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW52YWxpZExpc3RlbmVyTGlzdC5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG5cdH1cblxuXHR2YWxpZFNpbGVudCgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHRydWU7XG5cdH1cblxuXHRpbnZhbGlkU2lsZW50KCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IHZhbGlkTGlzdGVuZXIgXG5cdCAqL1xuXHR3aXRoVmFsaWRMaXN0ZW5lcih2YWxpZExpc3RlbmVyKSB7XG5cdFx0dGhpcy52YWxpZExpc3RlbmVyTGlzdC5hZGQodmFsaWRMaXN0ZW5lcik7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGludmFsaWRMaXN0ZW5lciBcblx0ICovXG5cdHdpdGhJbnZhbGlkTGlzdGVuZXIoaW52YWxpZExpc3RlbmVyKSB7XG5cdFx0dGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0LmFkZChpbnZhbGlkTGlzdGVuZXIpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn1cbiIsImltcG9ydCB7IExpc3QsIE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3RWYWxpZGF0b3IuanMnO1xuXG5leHBvcnQgY2xhc3MgQW5kVmFsaWRhdG9yU2V0IGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IoaXNWYWxpZEZyb21TdGFydCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKGlzVmFsaWRGcm9tU3RhcnQpO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QgPSBuZXcgTGlzdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RWYWxpZGF0b3J9IHZhbGlkYXRvclxuICAgICAqL1xuICAgIHdpdGhWYWxpZGF0b3IodmFsaWRhdG9yKSB7XG4gICAgICAgIHZhbGlkYXRvci53aXRoVmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVWYWxpZCkpO1xuICAgICAgICB2YWxpZGF0b3Iud2l0aEludmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxuICAgICAqL1xuICAgIG9uZVZhbGlkKCkge1xuICAgICAgICBsZXQgZm91bmRJbnZhbGlkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmKCF2YWx1ZS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZEludmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgaWYoIWZvdW5kSW52YWxpZCkge1xuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxuICAgICAqL1xuICAgIG9uZUludmFsaWQoKSB7XG4gICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgUmVnZXhWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCByZWdleCA9IFwiKC4qKVwiKSB7XG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XG4gICAgICAgIHRoaXMucmVnZXggPSByZWdleDtcbiAgICB9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUubWF0Y2godGhpcy5yZWdleCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmKCF2YWx1ZSAmJiAhdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdFx0dGhpcy52YWxpZCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUubWF0Y2godGhpcy5yZWdleCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmKCF2YWx1ZSAmJiAhdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdFx0dGhpcy52YWxpZFNpbGVudCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cbn1cbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuY29uc3QgRU1BSUxfRk9STUFUID0gL15cXHcrKFtcXC4tXT9cXHcrKSpAXFx3KyhbXFwuLV0/XFx3KykqKFxcLlxcd3syLDN9KSskLztcblxuZXhwb3J0IGNsYXNzIEVtYWlsVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIEVNQUlMX0ZPUk1BVCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgRXF1YWxzRnVuY3Rpb25SZXN1bHRWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXG5cdCAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIGNvbXBhcmVkVmFsdWVGdW5jdGlvbiA9IG51bGwpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcblxuXHRcdC8qKiBAdHlwZSB7T2JqZWN0RnVuY3Rpb259ICovXG5cdFx0dGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24gPSBjb21wYXJlZFZhbHVlRnVuY3Rpb247XG5cdH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSB0aGlzLmNvbXBhcmVkVmFsdWVGdW5jdGlvbi5jYWxsKCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uLmNhbGwoKSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fVxuXHR9XG5cbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiwgUHJvcGVydHlBY2Nlc3NvciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgRXF1YWxzUHJvcGVydHlWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXG5cdCAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIG1vZGVsID0gbnVsbCwgYXR0cmlidXRlTmFtZSA9IG51bGwpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcblxuXHRcdC8qKiBAdHlwZSB7b2JqZWN0fSAqL1xuICAgICAgICB0aGlzLm1vZGVsID0gbW9kZWw7XG4gICAgICAgIFxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVOYW1lID0gYXR0cmlidXRlTmFtZTtcblx0fVxuXG5cdHZhbGlkYXRlKHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgdGhpcy5hdHRyaWJ1dGVOYW1lKSl7XG5cdCAgICBcdHRoaXMudmFsaWQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fVxuXHR9XG5cblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCB0aGlzLmF0dHJpYnV0ZU5hbWUpKXtcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9XG5cdH1cblxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7IE9iamVjdEZ1bmN0aW9uLCBQcm9wZXJ0eUFjY2Vzc29yIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBFcXVhbHNTdHJpbmdWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXG5cdCAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIGNvbnRyb2xWYWx1ZSA9IG51bGwpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XG5cdH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IGNvbnRyb2xWYWx1ZSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fVxuXHR9XG5cbn0iLCJpbXBvcnQgeyBMaXN0LCBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0VmFsaWRhdG9yLmpzJ1xuXG5leHBvcnQgY2xhc3MgT3JWYWxpZGF0b3JTZXQgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG4gICAgXG4gICAgY29uc3RydWN0b3IoaXNWYWxpZEZyb21TdGFydCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKGlzVmFsaWRGcm9tU3RhcnQpO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QgPSBuZXcgTGlzdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RWYWxpZGF0b3J9IHZhbGlkYXRvclxuICAgICAqL1xuICAgIHdpdGhWYWxpZGF0b3IodmFsaWRhdG9yKSB7XG4gICAgICAgIHZhbGlkYXRvci53aXRoVmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVWYWxpZCkpO1xuICAgICAgICB2YWxpZGF0b3Iud2l0aEludmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxuICAgICAqL1xuICAgIG9uZVZhbGlkKCkge1xuICAgICAgICBzdXBlci52YWxpZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxuICAgICAqL1xuICAgIG9uZUludmFsaWQoKSB7XG4gICAgICAgIGxldCBmb3VuZFZhbGlkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmKHZhbHVlLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIGZvdW5kVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgaWYoZm91bmRWYWxpZCkge1xuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuY29uc3QgUEFTU1dPUkRfRk9STUFUID0gL14oPz0uKltBLVphLXpdKSg/PS4qP1swLTldKSg/PS4qP1sjPyFAJCVeJiotXSkuezgsfSQvO1xuXG5leHBvcnQgY2xhc3MgUGFzc3dvcmRWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgUEFTU1dPUkRfRk9STUFUKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuY29uc3QgUEhPTkVfRk9STUFUID0gL15cXCtbMC05XXsyfVxccz8oWzAtOV1cXHM/KSokLztcblxuZXhwb3J0IGNsYXNzIFBob25lVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIFBIT05FX0ZPUk1BVCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBSZXF1aXJlZFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuXHRjb25zdHJ1Y3RvcihjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBlbmFibGVkID0gdHJ1ZSkge1xuXHRcdHN1cGVyKGN1cnJlbnRseVZhbGlkLCBlbmFibGVkKTtcblx0fVxuXG5cdHZhbGlkYXRlKHZhbHVlKXtcblx0XHRpZih2YWx1ZSA9PT0gXCJcIil7XG5cdCAgICBcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnZhbGlkKCk7XG5cdFx0fVxuXHR9XG5cblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xuXHRcdGlmKHZhbHVlID09PSBcIlwiKXtcblx0ICAgIFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9XG5cdH1cblxufVxuIl0sIm5hbWVzIjpbIkxpc3QiLCJNYXAiLCJDb250YWluZXJVcmwiLCJDb250YWluZXJIdHRwQ2xpZW50IiwiTG9nZ2VyIiwiTE9HIiwiSW5qZWN0aW9uUG9pbnQiLCJYbWxFbGVtZW50IiwiQ29udGFpbmVyRWxlbWVudCIsIlhtbENkYXRhIiwiT2JqZWN0RnVuY3Rpb24iLCJDb250YWluZXJXaW5kb3ciLCJEb21UcmVlIiwiU2luZ2xldG9uQ29uZmlnIiwiUHJvdG90eXBlQ29uZmlnIiwiU3RyaW5nVXRpbHMiLCJNaW5kaUluamVjdG9yIiwiTWluZGlDb25maWciLCJJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyIiwiQ29uZmlnQWNjZXNzb3IiLCJQcm9wZXJ0eUFjY2Vzc29yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFPLE1BQU0sWUFBWSxDQUFDO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUssU0FBUyxDQUFDLEdBQUcsRUFBRTtBQUNwQixNQUFNO0FBQ047QUFDQTs7QUNSTyxNQUFNLEdBQUc7QUFDaEI7QUFDQSxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUM7QUFDdEIsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztBQUM3QixRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3pC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

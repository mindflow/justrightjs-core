'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var coreutil_v1 = require('coreutil_v1');
var mindi_v1 = require('mindi_v1');
var containerbridge_v1 = require('containerbridge_v1');
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
        containerbridge_v1.ContainerUrl.replaceUrl(url.toString(), title, stateObject);
    }

    static pushUrl(url, title, stateObject) {
        containerbridge_v1.ContainerUrl.pushUrl(url.toString(), title, stateObject);
    }

    static getUrl() {
        return new Url(containerbridge_v1.ContainerUrl.currentUrl());
    }

    static loadUrl(url) {
        containerbridge_v1.ContainerUrl.loadUrl(url.toString());
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
            Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require(this.modulePath)); }).then((module) => {
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
            this.element = containerbridge_v1.ContainerElement.createElement(value);
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
            element = containerbridge_v1.ContainerElement.createElementNS(xmlElement.namespaceUri,xmlElement.fullName);
        }else {
            element = containerbridge_v1.ContainerElement.createElement(xmlElement.name);
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

/* jshint esversion: 6 */

const LOG$9 = new coreutil_v1.Logger("EventRegistry");

class EventRegistry {

    constructor() {

        /** @type {Map<Map<ObjectFunction>} */
        this.listeners = new coreutil_v1.Map();

        /** @type {Map<ObjectFunction>} */
        this.beforeListeners = new coreutil_v1.Map();

        /** @type {Map<ObjectFunction>} */
        this.afterListeners = new coreutil_v1.Map();
    }

    /**
     * Connects elements with the event registry so that events triggered on the element gets distributed to all listeners
     * 
     * @param {BaseElement} element the element which is the source of the event and which can be attached to
     * @param {String} eventType the event type as it is defined by the containing trigger (example "onclick")
     * @param {String} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {String} componentIndex unique id of the component which owns the element
     */
    attach(element, eventType, eventName, componentIndex) {
        const uniqueEventName = eventName + "_" + componentIndex;
        const theEventRegistry = this;
        element.attachEvent(eventType, function(event) { theEventRegistry.trigger(uniqueEventName, eventName, event); });
    }

    /**
     * 
     * @param {String} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {ObjectFunction} listener the object which owns the handler function
     * @param {String} uniqueIndex a unique index for the event
     */
    listen(eventName, listener, uniqueIndex) {
        const uniqueEventName = eventName + "_" + uniqueIndex;
        this.initMap(this.listeners, uniqueEventName);
        /** @type {Map<ObjectFunction>} */
        const listenerMap = this.listeners.get(uniqueEventName);
        listenerMap.set(listener.object.constructor.name, listener);
    }

    /**
     * 
     * @param {String} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {ObjectFunction} listener the object which owns the handler function
     */
    listenBefore(eventName, listener) {
        this.initMap(this.beforeListeners, eventName);
        /** @type {Map<ObjectFunction>} */
        const listenerMap = this.beforeListeners.get(eventName);
        listenerMap.set(listener.object.constructor.name, listener);
    }

    /**
     * 
     * @param {String} eventName the event name as it will be referred to in the EventRegistry (example "//event:clicked")
     * @param {ObjectFunction} listener the object which owns the handler function
     */
    listenAfter(eventName, listener) {
        this.initMap(this.afterListeners, eventName);
        /** @type {Map} */
        const listenerMap = this.afterListeners.get(eventName);
        listenerMap.set(listener.object.constructor.name, listener);
    }

    /**
     * 
     * @param {Map<Map<ObjectFunction>} map 
     * @param {String} key 
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
        var bodyElement = containerbridge_v1.ContainerElement.getElementById(id);
        bodyElement.parentNode.replaceChild(component.rootElement.mappedElement, bodyElement);
    }

    static setComponent(id, component) {
        var bodyElement = containerbridge_v1.ContainerElement.getElementById(id);
        bodyElement.innerHTML = '';
        bodyElement.appendChild(component.rootElement.mappedElement, bodyElement);
    }

    static addChildComponent(id, component) {
        var bodyElement = containerbridge_v1.ContainerElement.getElementById(id);
        bodyElement.appendChild(component.rootElement.mappedElement);
    }

    static addChildElement(id, element) {
        var bodyElement = containerbridge_v1.ContainerElement.getElementById(id);
        bodyElement.appendChild(element.mappedElement);
    }

    static removeElement(id) {
        containerbridge_v1.ContainerElement.removeElement(id);
    }

    /** 
     * @param {BaseElement} element
     */
    static addHeaderElement(element) {
        containerbridge_v1.ContainerElement.addElement("head", element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static addBodyElement(element) {
        containerbridge_v1.ContainerElement.addElement("body", element.mappedElement);
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
                    mindi_v1.MindiInjector.inject(parent.defaultInstance, this.config).then(() => {
                        resolve();
                    });
                });
            });
        });
    }
}

const LOG$g = new coreutil_v1.Logger("AbstractValidator");

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
            LOG$g.warn("No validation listeners");
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
            LOG$g.warn("No invalidation listeners");
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

const LOG$h = new coreutil_v1.Logger("HttpCallBuilder");

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
     * @param {Client} client 
     * @param {string} url 
     * @param {object} payload 
     * @returns {HttpCallBuilder}
     */
    static newInstance(client, url, payload) {
        return new HttpCallBuilder(client, url, payload);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2xpZW50L2NsaWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC91cmwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdGVtcGxhdGUvdGVtcGxhdGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3R5bGVzL3N0eWxlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudENvbmZpZ1Byb2Nlc3Nvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi9oaXN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbG9hZGVyRmlsdGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbW9kdWxlTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2F0dHJpYnV0ZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9iYXNlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9yYWRpb0lucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9jaGVja2JveElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRhcmVhSW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRub2RlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9zaW1wbGVFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2Zvcm1FbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3ZpZGVvRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZXZlbnQvZXZlbnRSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L3VuaXF1ZUlkUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9lbGVtZW50UmVnaXN0cmF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNSb290LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9odG1sL2h0bWwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNTdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb25maWcuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2FwcGxpY2F0aW9uLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9kYXRhQmluZC9pbnB1dEVsZW1lbnREYXRhQmluZGluZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZGF0YUJpbmQvcHJveHlPYmplY3RGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudEZpbHRlcmVkT2JqZWN0RnVuY3Rpb24uanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2xvYWRlci9kaU1vZHVsZUxvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2Fic3RyYWN0VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvYW5kVmFsaWRhdG9yU2V0LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcmVnZXhWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lbWFpbFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VxdWFsc0Z1bmN0aW9uUmVzdWx0VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzUHJvcGVydHlWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNTdHJpbmdWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9vclZhbGlkYXRvclNldC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bhc3N3b3JkVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcGhvbmVsVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcmVxdWlyZWRWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3V0aWwvaHR0cENhbGxCdWlsZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnRhaW5lckh0dHBDbGllbnQgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBDbGllbnQge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XG4gICAgICovXG4gICAgc3RhdGljIGdldCh1cmwsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCwgYXV0aG9yaXphdGlvbiA9IG51bGwpe1xuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ29udGFpbmVySHR0cENsaWVudC5mZXRjaCh1cmwudG9TdHJpbmcoKSxwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XG4gICAgICovXG4gICAgc3RhdGljIHBvc3QodXJsLCBkYXRhLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDAsIGF1dGhvcml6YXRpb24gPSBudWxsKXtcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xuICAgICAgICB2YXIgcGFyYW1zID0gIHtcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICBtb2RlOiBcImNvcnNcIiwgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogXCJmb2xsb3dcIiwgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XG4gICAgICovXG4gICAgc3RhdGljIHB1dCh1cmwsIGRhdGEsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCwgYXV0aG9yaXphdGlvbiA9IG51bGwpe1xuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXG4gICAgICAgICAgICBtZXRob2Q6ICdQVVQnLCBcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ29udGFpbmVySHR0cENsaWVudC5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxuICAgICAqL1xuICAgIHN0YXRpYyBwYXRjaCh1cmwsIGRhdGEsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCwgYXV0aG9yaXphdGlvbiA9IG51bGwpe1xuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXG4gICAgICAgICAgICBtZXRob2Q6ICdQQVRDSCcsIFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JywgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmxcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XG4gICAgICovXG4gICAgc3RhdGljIGRlbGV0ZSh1cmwsIGNvbm5lY3Rpb25UaW1lb3V0ID0gNDAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCl7XG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xuICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRIZWFkZXIoYXV0aG9yaXphdGlvbiA9IG51bGwpIHtcbiAgICAgICAgbGV0IGhlYWRlcnMgPSB7XG4gICAgICAgICAgICBcInVzZXItYWdlbnRcIjogXCJNb3ppbGxhLzQuMCBNRE4gRXhhbXBsZVwiLFxuICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGF1dGhvcml6YXRpb24pIHtcbiAgICAgICAgICAgIGhlYWRlcnMgPSB7XG4gICAgICAgICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFwiTW96aWxsYS80LjAgTUROIEV4YW1wbGVcIixcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYXV0aG9yaXphdGlvblxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgIH1cbn0iLCJpbXBvcnQge0xpc3QsTWFwfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIFVybHtcblxuICAgIGNvbnN0cnVjdG9yKHZhbHVlKXtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaG9zdCA9IG51bGw7XG4gICAgICAgIHRoaXMucG9ydCA9IG51bGw7XG4gICAgICAgIHRoaXMucGF0aExpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5ib29rbWFyayA9IG51bGw7XG4gICAgICAgIGlmKHZhbHVlID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVtYWluaW5nID0gdGhpcy5kZXRlcm1pbmVQcm90b2NvbCh2YWx1ZSk7XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5wcm90b2NvbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZUhvc3QocmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuaG9zdCAhPT0gbnVsbCl7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZVBvcnQocmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUGF0aChyZW1haW5pbmcpO1xuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUGFyYW1ldGVycyhyZW1haW5pbmcpO1xuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGV0ZXJtaW5lQm9va21hcmsocmVtYWluaW5nKTtcbiAgICB9XG5cbiAgICBnZXRQcm90b2NvbCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wcm90b2NvbDtcbiAgICB9XG5cbiAgICBnZXRIb3N0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLmhvc3Q7XG4gICAgfVxuXG4gICAgZ2V0UG9ydCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wb3J0O1xuICAgIH1cblxuICAgIGdldFBhdGhMaXN0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhMaXN0O1xuICAgIH1cblxuICAgIGdldFBhdGhQYXJ0KGluZGV4KXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aExpc3QuZ2V0KGluZGV4KTtcbiAgICB9XG5cbiAgICBnZXRQYXRoKCl7XG4gICAgICAgIGxldCBwYXRoID0gXCIvXCI7XG4gICAgICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgICAgIHRoaXMucGF0aExpc3QuZm9yRWFjaCgodmFsdWUgPT4ge1xuICAgICAgICAgICAgaWYgKCFmaXJzdCkge1xuICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoICsgXCIvXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXRoID0gcGF0aCArIHZhbHVlO1xuICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgfSksdGhpcyk7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIGNsZWFyUGF0aExpc3QoKXtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgZ2V0UGFyYW1ldGVyTWFwKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmFtZXRlck1hcDtcbiAgICB9XG5cbiAgICBjbGVhclBhcmFtZXRlck1BcCgpe1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXRQYXJhbWV0ZXIoa2V5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyTWFwLmdldChrZXkpO1xuICAgIH1cblxuICAgIHNldFBhcmFtZXRlcihrZXksdmFsdWUpe1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcC5zZXQoa2V5LHZhbHVlKTtcbiAgICB9XG5cbiAgICBzZXRCb29rbWFyayhib29rbWFyayl7XG4gICAgICAgIHRoaXMuYm9va21hcmsgPSBib29rbWFyaztcbiAgICB9XG5cbiAgICBzZXRQYXRoKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZGV0ZXJtaW5lUGF0aCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgc2V0UXVlcnlTdHJpbmcodmFsdWUpIHtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAgPSB0aGlzLmRldGVybWluZVBhcmFtZXRlcnModmFsdWUpO1xuICAgIH1cblxuICAgIGdldEJvb2ttYXJrKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmJvb2ttYXJrO1xuICAgIH1cblxuICAgIGRldGVybWluZVByb3RvY29sKHZhbHVlKXtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIi8vXCIpID09PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCIvL1wiKTtcbiAgICAgICAgaWYocGFydHNbMF0uaW5kZXhPZihcIi9cIikgIT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb3RvY29sID0gcGFydHNbMF07XG4gICAgICAgIGlmKHBhcnRzLmxlbmd0aD09MSl7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShwYXJ0c1swXSArIFwiLy9cIixcIlwiKTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVIb3N0KHZhbHVlKXtcbiAgICAgICAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCIvXCIpO1xuICAgICAgICB2YXIgaG9zdFBhcnQgPSBwYXJ0c1swXTtcbiAgICAgICAgaWYoaG9zdFBhcnQuaW5kZXhPZihcIjpcIikgIT09IC0xKXtcbiAgICAgICAgICAgIGhvc3RQYXJ0ID0gaG9zdFBhcnQuc3BsaXQoXCI6XCIpWzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaG9zdCA9IGhvc3RQYXJ0O1xuICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKGhvc3RQYXJ0LFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGRldGVybWluZVBvcnQodmFsdWUpe1xuICAgICAgICBpZighdmFsdWUuc3RhcnRzV2l0aChcIjpcIikpe1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwb3J0UGFydCA9IHZhbHVlLnNwbGl0KFwiL1wiKVswXS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHRoaXMucG9ydCA9IHBvcnRQYXJ0O1xuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShcIjpcIiArIHBvcnRQYXJ0LFwiXCIpO1xuICAgIH1cblxuICAgIGRldGVybWluZVBhdGgodmFsdWUpe1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gdmFsdWU7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCI/XCIpICE9PSAtMSl7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIj9cIik7XG4gICAgICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIj9cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgfSBlbHNlIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSl7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIiNcIik7XG4gICAgICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgfVxuICAgICAgICBpZih2YWx1ZS5zdGFydHNXaXRoKFwiL1wiKSl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGF0aFBhcnRzID0gbmV3IExpc3QodmFsdWUuc3BsaXQoXCIvXCIpKTtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHBhdGhQYXJ0cy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLHBhcmVudCl7XG4gICAgICAgICAgICBwYXJlbnQucGF0aExpc3QuYWRkKGRlY29kZVVSSSh2YWx1ZSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIHJldHVybiByZW1haW5pbmc7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUGFyYW1ldGVycyh2YWx1ZSl7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB2YWx1ZTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIj9cIikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIj9cIikrMSk7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgcmVtYWluaW5nID0gdmFsdWUuc3Vic3RyaW5nKHZhbHVlLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDAsdmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJ0TGlzdCA9IG5ldyBMaXN0KHZhbHVlLnNwbGl0KFwiJlwiKSk7XG4gICAgICAgIHZhciBwYXJhbWV0ZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHBhcnRMaXN0LmZvckVhY2goZnVuY3Rpb24odmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIHZhciBrZXlWYWx1ZSA9IHZhbHVlLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIGlmKGtleVZhbHVlLmxlbmd0aCA+PSAyKXtcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJNYXAuc2V0KGRlY29kZVVSSShrZXlWYWx1ZVswXSksZGVjb2RlVVJJKGtleVZhbHVlWzFdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAgPSBwYXJhbWV0ZXJNYXA7XG4gICAgICAgIHJldHVybiByZW1haW5pbmc7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lQm9va21hcmsodmFsdWUpe1xuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiI1wiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuYm9va21hcmsgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikrMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICB2YXIgdmFsdWUgPSBcIlwiO1xuICAgICAgICBpZih0aGlzLnByb3RvY29sICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyB0aGlzLnByb3RvY29sICsgXCIvL1wiO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuaG9zdCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgdGhpcy5ob3N0O1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMucG9ydCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI6XCIgKyB0aGlzLnBvcnQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhdGhMaXN0LmZvckVhY2goZnVuY3Rpb24ocGF0aFBhcnQscGFyZW50KXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIi9cIiArIHBhdGhQYXJ0O1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgdmFyIGZpcnN0UGFyYW1ldGVyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAuZm9yRWFjaChmdW5jdGlvbihwYXJhbWV0ZXJLZXkscGFyYW1ldGVyVmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIGlmKGZpcnN0UGFyYW1ldGVyKXtcbiAgICAgICAgICAgICAgICBmaXJzdFBhcmFtZXRlcj1mYWxzZTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI/XCI7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCImXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgZW5jb2RlVVJJKHBhcmFtZXRlcktleSkgKyBcIj1cIiArIGVuY29kZVVSSShwYXJhbWV0ZXJWYWx1ZSk7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIGlmKHRoaXMuYm9va21hcmsgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIiNcIiArIHRoaXMuYm9va21hcms7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxufVxuIiwiZXhwb3J0IGNsYXNzIFN0eWxlc3tcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdHlsZXNTb3VyY2UgXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc3R5bGVzU291cmNlKXtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5zdHlsZXNTb3VyY2UgPSBzdHlsZXNTb3VyY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRTdHlsZXNTb3VyY2UoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzU291cmNlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge01hcCwgTG9nZ2VyLCBPYmplY3RGdW5jdGlvbn0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XG5pbXBvcnQgeyBTdHlsZXMgfSBmcm9tIFwiLi9zdHlsZXMuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlN0eWxlc1JlZ2lzdHJ5XCIpO1xuXG5leHBvcnQgY2xhc3MgU3R5bGVzUmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnN0eWxlc1VybE1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge2ludGVnZXJ9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzUXVldWVTaXplID0gMDtcblxuICAgICAgICAvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1N0eWxlc30gc3R5bGVzIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgc2V0KG5hbWUsc3R5bGVzLHVybCl7XG4gICAgICAgIGlmKHVybCAhPT0gdW5kZWZpbmVkICYmIHVybCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5zdHlsZXNVcmxNYXAuc2V0KG5hbWUsIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdHlsZXNNYXAuc2V0KG5hbWUsIHN0eWxlcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICovXG4gICAgZ2V0KG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNNYXAuZ2V0KG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGNvbnRhaW5zKG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNNYXAuY29udGFpbnMobmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgZG9uZShjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3R5bGVzUmVnaXN0cnl9IHJlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGRvQ2FsbGJhY2socmVnaXN0cnkpe1xuICAgICAgICBpZih0bW8uY2FsbGJhY2sgIT09IG51bGwgJiYgcmVnaXN0cnkuY2FsbGJhY2sgIT09IHVuZGVmaW5lZCAgJiYgcmVnaXN0cnkuc3R5bGVzUXVldWVTaXplID09PSByZWdpc3RyeS5zdHlsZXNNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBDYWxsYmFjay5jYWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgICBsb2FkKG5hbWUsIHVybCkge1xuICAgICAgICB0aGlzLnN0eWxlc1F1ZXVlU2l6ZSArKztcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHN0eWxlcyBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFN0eWxlcyh0ZXh0KSx1cmwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvQ2FsbGJhY2sodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBuYW1lVXJsTWFwIFxuICAgICAqL1xuICAgIGdldFN0eWxlc0xvYWRlZFByb21pc2UobmFtZVVybE1hcCkge1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdmFyIGxvYWRlZCA9IDA7XG4gICAgICAgICAgICBpZighbmFtZVVybE1hcCB8fCBuYW1lVXJsTWFwLnNpemUoKSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5hbWVVcmxNYXAuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5jb250YWlucyhrZXkpKXtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkICsrO1xuICAgICAgICAgICAgICAgICAgICBpZihsb2FkZWQgPT0gbmFtZVVybE1hcC5zaXplKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnByaXZhdGVMb2FkKGtleSwgbmV3IFVybCh2YWx1ZSkpXG5cbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9hZGVkICsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYobG9hZGVkID09IG5hbWVVcmxNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKHJlYXNvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHJlYXNvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBwcml2YXRlTG9hZChuYW1lLCB1cmwpIHtcbiAgICAgICAgTE9HLmluZm8oXCJMb2FkaW5nIHN0eWxlcyBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybC50b1N0cmluZygpKTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIENsaWVudC5nZXQodXJsKS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5vayl7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgc3R5bGVzIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UudGV4dCgpLnRoZW4oKHRleHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgU3R5bGVzKHRleHQpLHVybCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGV7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGVtcGxhdGVTb3VyY2UgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGVtcGxhdGVTb3VyY2Upe1xuXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlU291cmNlID0gdGVtcGxhdGVTb3VyY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRUZW1wbGF0ZVNvdXJjZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVNvdXJjZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtNYXAsIExvZ2dlciwgT2JqZWN0RnVuY3Rpb259IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtUZW1wbGF0ZX0gZnJvbSBcIi4vdGVtcGxhdGUuanNcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuLi9jbGllbnQvY2xpZW50LmpzXCI7XG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlRlbXBsYXRlUmVnaXN0cnlcIik7XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVJlZ2lzdHJ5IHtcblxuICAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlVXJsTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7aW50ZWdlcn0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVF1ZXVlU2l6ZSA9IDA7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVByZWZpeCBcbiAgICAgKi9cbiAgICBzZXRMYW5ndWFnZVByZWZpeChsYW5ndWFnZVByZWZpeCkge1xuICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ID0gbGFuZ3VhZ2VQcmVmaXg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZX0gdGVtcGxhdGUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBzZXQobmFtZSx0ZW1wbGF0ZSx1cmwpe1xuICAgICAgICBpZih1cmwgIT09IHVuZGVmaW5lZCAmJiB1cmwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAuc2V0KG5hbWUsIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50ZW1wbGF0ZU1hcC5zZXQobmFtZSwgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGdldChuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVNYXAuZ2V0KG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGNvbnRhaW5zKG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZU1hcC5jb250YWlucyhuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjYWxsYmFjayBcbiAgICAgKi9cbiAgICBkb25lKGNhbGxiYWNrKXtcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLmRvQ2FsbGJhY2sodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZVJlZ2lzdHJ5fSByZWdpc3RyeSBcbiAgICAgKi9cbiAgICBkb0NhbGxiYWNrKHJlZ2lzdHJ5KXtcbiAgICAgICAgaWYodG1vLmNhbGxiYWNrICE9PSBudWxsICYmIHJlZ2lzdHJ5LmNhbGxiYWNrICE9PSB1bmRlZmluZWQgICYmIHJlZ2lzdHJ5LnRlbXBsYXRlUXVldWVTaXplID09PSByZWdpc3RyeS50ZW1wbGF0ZU1hcC5zaXplKCkpe1xuICAgICAgICAgICAgdmFyIHRlbXBDYWxsYmFjayA9IHJlZ2lzdHJ5LmNhbGxiYWNrO1xuICAgICAgICAgICAgcmVnaXN0cnkuY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICAgICAgdGVtcENhbGxiYWNrLmNhbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgbG9hZChuYW1lLCB1cmwpIHtcbiAgICAgICAgaWYodGhpcy5sYW5ndWFnZVByZWZpeCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdXJsLmdldFBhdGhMaXN0KCkuc2V0TGFzdChcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ICsgXCIuXCIgK1xuICAgICAgICAgICAgICAgIHVybC5nZXRQYXRoTGlzdCgpLmdldExhc3QoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRlbXBsYXRlUXVldWVTaXplICsrO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIENsaWVudC5nZXQodXJsKS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5vayl7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgdGVtcGxhdGUgZm9yIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNwb25zZS50ZXh0KCkudGhlbigodGV4dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChuYW1lLG5ldyBUZW1wbGF0ZSh0ZXh0KSx1cmwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvQ2FsbGJhY2sodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcH0gbmFtZVVybE1hcCBcbiAgICAgKi9cbiAgICBnZXRUZW1wbGF0ZXNMb2FkZWRQcm9taXNlKG5hbWVVcmxNYXApIHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB2YXIgbG9hZGVkID0gMDtcbiAgICAgICAgICAgIGlmKCFuYW1lVXJsTWFwIHx8IG5hbWVVcmxNYXAuc2l6ZSgpID09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmFtZVVybE1hcC5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLmNvbnRhaW5zKGtleSkpe1xuICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKys7XG4gICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucHJpdmF0ZUxvYWQoa2V5LCBuZXcgVXJsKHZhbHVlKSlcblxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihsb2FkZWQgPT0gbmFtZVVybE1hcC5zaXplKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgocmVhc29uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LHRoaXMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIHByaXZhdGVMb2FkKG5hbWUsIHVybCkge1xuICAgICAgICBpZih0aGlzLmxhbmd1YWdlUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1cmwuZ2V0UGF0aExpc3QoKS5zZXRMYXN0KFxuICAgICAgICAgICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggKyBcIi5cIiArXG4gICAgICAgICAgICAgICAgdXJsLmdldFBhdGhMaXN0KCkuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIExPRy5pbmZvKFwiTG9hZGluZyB0ZW1wbGF0ZSBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybC50b1N0cmluZygpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHNlKSA9PiB7XG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHRlbXBsYXRlIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UudGV4dCgpLnRoZW4oKHRleHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgVGVtcGxhdGUodGV4dCksdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2xzZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBMb2dnZXIsIE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ29uZmlnLCBUeXBlQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4vdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiVGVtcGxhdGVQb3N0Q29uZmlnXCIpO1xuXG4vKipcbiAqIFRvIGJlIGFkZGVkIHRvIG1pbmRpIGFzIGEgc2luZ2xldG9uLiBXaWxsIHNjYW4gdGhyb3VnaCBhbGwgY29uZmlndXJlZCBjbGFzc2VzIHRoYXQgaGF2ZSBhIFRFTVBMQVRFX1VSTCBhbmQgQ09NUE9ORU5UX05BTUVcbiAqIHN0YXRpYyBnZXR0ZXIgYW5kIHdpbGwgYXN5bmNyb25vdXNseSBsb2FkIHRoZW0uIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gYWxsIHRlbXBsYXRlcyBhcmUgbG9hZGVkXG4gKi9cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZXNMb2FkZXIge1xuXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1RlbXBsYXRlUmVnaXN0cnl9IHRlbXBsYXRlUmVnaXN0cnkgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGVtcGxhdGVSZWdpc3RyeSkge1xuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSB0ZW1wbGF0ZVJlZ2lzdHJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBjb25maWdFbnRyaWVzXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgbG9hZChjb25maWdFbnRyaWVzKSB7XG4gICAgICAgIGxldCB0ZW1wbGF0ZU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgY29uZmlnRW50cmllcy5mb3JFYWNoKChrZXksIGNvbmZpZ0VudHJ5LCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmKGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlRFTVBMQVRFX1VSTCAmJiBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSkge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlTWFwLnNldChjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSwgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuVEVNUExBVEVfVVJMKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTsgXG4gICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlUmVnaXN0cnkuZ2V0VGVtcGxhdGVzTG9hZGVkUHJvbWlzZSh0ZW1wbGF0ZU1hcCk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTG9nZ2VyLCBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXNSZWdpc3RyeS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiU3R5bGVzTG9hZGVyXCIpO1xuXG4vKipcbiAqIFRvIGJlIGFkZGVkIHRvIG1pbmRpIGFzIGEgc2luZ2xldG9uLiBXaWxsIHNjYW4gdGhyb3VnaCBhbGwgY29uZmlndXJlZCBjbGFzc2VzIHRoYXQgaGF2ZSBhIFNUWUxFU19VUkwgYW5kIENPTVBPTkVOVF9OQU1FXG4gKiBzdGF0aWMgZ2V0dGVyIGFuZCB3aWxsIGFzeW5jcm9ub3VzbHkgbG9hZCB0aGVtLiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIGFsbCBzdHlsZXMgYXJlIGxvYWRlZFxuICovXG5leHBvcnQgY2xhc3MgU3R5bGVzTG9hZGVyIHtcblxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHlsZXNSZWdpc3RyeX0gc3R5bGVzUmVnaXN0cnkgXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc3R5bGVzUmVnaXN0cnkpIHtcbiAgICAgICAgdGhpcy5zdHlsZXNSZWdpc3RyeSA9IHN0eWxlc1JlZ2lzdHJ5O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBjb25maWdFbnRyaWVzXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgbG9hZChjb25maWdFbnRyaWVzKSB7XG4gICAgICAgIGxldCBzdHlsZXNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIGNvbmZpZ0VudHJpZXMuZm9yRWFjaCgoa2V5LCBjb25maWdFbnRyeSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICBpZihjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5TVFlMRVNfVVJMICYmIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FKSB7XG4gICAgICAgICAgICAgICAgc3R5bGVzTWFwLnNldChjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSwgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuU1RZTEVTX1VSTCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7IFxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNSZWdpc3RyeS5nZXRTdHlsZXNMb2FkZWRQcm9taXNlKHN0eWxlc01hcCk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb25maWcsIEluamVjdGlvblBvaW50LCBUeXBlQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgVGVtcGxhdGVzTG9hZGVyIH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzTG9hZGVyIH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNMb2FkZXIuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbXBvbmVudENvbmZpZ1Byb2Nlc3NvclwiKVxuXG4vKipcbiAqIE1pbmRpIGNvbmZpZyBwcm9jZXNzb3Igd2hpY2ggbG9hZHMgYWxsIHRlbXBsYXRlcyBhbmQgc3R5bGVzIGZvciBhbGwgY29uZmlndXJlZCBjb21wb25lbnRzXG4gKiBhbmQgdGhlbiBjYWxscyBhbnkgZXhpc3RpbmcgY29tcG9uZW50TG9hZGVkIGZ1bmN0aW9uIG9uIGVhY2ggY29tcG9uZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRDb25maWdQcm9jZXNzb3Ige1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtUZW1wbGF0ZVJlZ2lzdHJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoVGVtcGxhdGVSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtTdHlsZXNSZWdpc3RyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBwb3N0Q29uZmlnKCl7XG4gICAgICAgIHRoaXMudGVtcGxhdGVzTG9hZGVyID0gbmV3IFRlbXBsYXRlc0xvYWRlcih0aGlzLnRlbXBsYXRlUmVnaXN0cnkpO1xuICAgICAgICB0aGlzLnN0eWxlc0xvYWRlciA9IG5ldyBTdHlsZXNMb2FkZXIodGhpcy5zdHlsZXNSZWdpc3RyeSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtDb25maWd9IGNvbmZpZ1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIHByb2Nlc3NDb25maWcoY29uZmlnLCB1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSB7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKFxuICAgICAgICAgICAgWyBcbiAgICAgICAgICAgICAgICB0aGlzLnRlbXBsYXRlc0xvYWRlci5sb2FkKHVuY29uZmlndXJlZENvbmZpZ0VudHJpZXMpLCBcbiAgICAgICAgICAgICAgICB0aGlzLnN0eWxlc0xvYWRlci5sb2FkKHVuY29uZmlndXJlZENvbmZpZ0VudHJpZXMpIFxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuICAgIH1cblxufSIsImltcG9ydCB7IENvbnRhaW5lclVybCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybFwiO1xuXG5leHBvcnQgY2xhc3MgSGlzdG9yeSB7XG5cbiAgICBzdGF0aWMgcmVwbGFjZVVybCh1cmwsIHRpdGxlLCBzdGF0ZU9iamVjdCkge1xuICAgICAgICBDb250YWluZXJVcmwucmVwbGFjZVVybCh1cmwudG9TdHJpbmcoKSwgdGl0bGUsIHN0YXRlT2JqZWN0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcHVzaFVybCh1cmwsIHRpdGxlLCBzdGF0ZU9iamVjdCkge1xuICAgICAgICBDb250YWluZXJVcmwucHVzaFVybCh1cmwudG9TdHJpbmcoKSwgdGl0bGUsIHN0YXRlT2JqZWN0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0VXJsKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVybChDb250YWluZXJVcmwuY3VycmVudFVybCgpKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbG9hZFVybCh1cmwpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLmxvYWRVcmwodXJsLnRvU3RyaW5nKCkpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiTG9hZGVyRmlsdGVyXCIpO1xuXG5leHBvcnQgY2xhc3MgTG9hZGVyRmlsdGVyIHtcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgICAqL1xuICAgIHByb2Nlc3MoKSB7XG4gICAgICAgIExPRy5pbmZvKFwiSW51bXBsZW1lbnRlZCBMb2FkZXIgRmlsdGVyIGJyZWFrcyBieSBkZWZhdWx0XCIpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcbmltcG9ydCB7IEhpc3RvcnkgfSBmcm9tIFwiLi4vbmF2aWdhdGlvbi9oaXN0b3J5LmpzXCI7XG5pbXBvcnQgeyBMb2FkZXJGaWx0ZXIgfSBmcm9tIFwiLi9sb2FkZXJGaWx0ZXIuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIk1vZHVsZUxvYWRlclwiKTtcblxuZXhwb3J0IGNsYXNzIE1vZHVsZUxvYWRlciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cH0gbWF0Y2hQYXRoIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByb290UGF0aCBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbW9kdWxlUGF0aCBcbiAgICAgKiBAcGFyYW0ge0FycmF5PExvYWRlckZpbHRlcj59IGxvYWRlckZpbHRlcnMgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWF0Y2hQYXRoLCByb290UGF0aCwgbW9kdWxlUGF0aCwgbG9hZGVyRmlsdGVycyA9IFtdKSB7XG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge1JlZ0V4cH1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubWF0Y2hQYXRoID0gbWF0Y2hQYXRoO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yb290UGF0aCA9IHJvb3RQYXRoO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5tb2R1bGVQYXRoID0gbW9kdWxlUGF0aDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge0FycmF5PExvYWRlckZpbHRlcj59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxvYWRlckZpbHRlcnMgPSBsb2FkZXJGaWx0ZXJzO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5kZWZhdWx0SW5zdGFuY2UgPSBudWxsO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZXF1ZXN0ZWRQYXRoID0gbnVsbDtcbiAgICB9XG5cbiAgICBhdXRob3JpemVkKCl7IFxuICAgICAgICBpZiAodGhpcy5yZXF1aXJlZFNjb3BlQXJyYXkubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBtYXRjaGVzKCl7IFxuICAgICAgICBjb25zdCB1cmwgPSBIaXN0b3J5LmdldFVybCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaFBhdGgudGVzdCh1cmwuZ2V0UGF0aCgpKTtcbiAgICB9XG5cbiAgICBsb2FkKHJvb3RQYXRoKSB7XG4gICAgICAgIGlmICghdGhpcy5maWx0ZXJzUGFzcygpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcztcbiAgICAgICAgaWYgKCFwYXJlbnQuZGVmYXVsdEluc3RhbmNlKSB7XG4gICAgICAgICAgICBwYXJlbnQuaW1wb3J0TW9kdWxlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcGFyZW50LmRlZmF1bHRJbnN0YW5jZS5sb2FkKHJvb3RQYXRoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LmRlZmF1bHRJbnN0YW5jZS5sb2FkKHJvb3RQYXRoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZpbHRlcnNQYXNzKCkge1xuICAgICAgICBsZXQgcGFzcyA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLmxvYWRlckZpbHRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMubG9hZGVyRmlsdGVycy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIWVsZW1lbnQucHJvY2VzcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhc3MgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwYXNzO1xuICAgIH1cblxuICAgIGltcG9ydE1vZHVsZSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmIChudWxsICE9IHRoaXMuZGVmYXVsdEluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGltcG9ydCh0aGlzLm1vZHVsZVBhdGgpLnRoZW4oKG1vZHVsZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVmYXVsdEluc3RhbmNlID0gbmV3IG1vZHVsZS5kZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSkuY2F0Y2goKHJlYXNvbikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGRlZmF1bHRJbnN0YW5jZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVmYXVsdEluc3RhbmNlO1xuICAgIH1cblxufSIsImV4cG9ydCBjbGFzcyBBdHRyaWJ1dGUge1xuXG4gICAgY29uc3RydWN0b3IoYXR0cmlidXRlKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlID0gYXR0cmlidXRlO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlLnZhbHVlO1xuICAgIH1cblxuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGUubmFtZTtcbiAgICB9XG5cbiAgICBnZXQgbmFtZXNwYWNlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGUubmFtZTtcbiAgICB9XG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTWFwLCBMb2dnZXIsIExpc3QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENvbnRhaW5lckVsZW1lbnQgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBBdHRyaWJ1dGUgfSBmcm9tIFwiLi9hdHRyaWJ1dGUuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkJhc2VFbGVtZW50XCIpO1xuXG4vKipcbiAqIEEgYmFzZSBjbGFzcyBmb3IgZW5jbG9zaW5nIGFuIEhUTUxFbGVtZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fHN0cmluZ3xIVE1MRWxlbWVudH0gdmFsdWVcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIFxuICAgICAgICAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG51bGw7XG4gICAgICAgIHRoaXMuZXZlbnRzQXR0YWNoZWQgPSBuZXcgTGlzdCgpO1xuICAgICAgICBcbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBYbWxFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLmNyZWF0ZUZyb21YbWxFbGVtZW50KHZhbHVlLCBwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHZhbHVlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpe1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gdmFsdWU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgTE9HLmVycm9yKFwiVW5yZWNvZ25pemVkIHZhbHVlIGZvciBFbGVtZW50XCIpO1xuICAgICAgICBMT0cuZXJyb3IodmFsdWUpO1xuICAgIH1cblxuICAgIGxvYWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQuYXR0cmlidXRlcyA9PT0gbnVsbCB8fCB0aGlzLmVsZW1lbnQuYXR0cmlidXRlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLmF0dHJpYnV0ZU1hcCA9PT0gbnVsbCB8fCB0aGlzLmF0dHJpYnV0ZU1hcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5lbGVtZW50LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcC5zZXQodGhpcy5lbGVtZW50LmF0dHJpYnV0ZXNbaV0ubmFtZSxuZXcgQXR0cmlidXRlKHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYnJvd3NlciBFbGVtZW50IGZyb20gdGhlIFhtbEVsZW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0geG1sRWxlbWVudFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudEVsZW1lbnRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBjcmVhdGVGcm9tWG1sRWxlbWVudCh4bWxFbGVtZW50LCBwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIGxldCBlbGVtZW50ID0gbnVsbDtcbiAgICAgICAgaWYoeG1sRWxlbWVudC5uYW1lc3BhY2Upe1xuICAgICAgICAgICAgZWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuY3JlYXRlRWxlbWVudE5TKHhtbEVsZW1lbnQubmFtZXNwYWNlVXJpLHhtbEVsZW1lbnQuZnVsbE5hbWUpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmNyZWF0ZUVsZW1lbnQoeG1sRWxlbWVudC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZihwYXJlbnRFbGVtZW50ICYmIHBhcmVudEVsZW1lbnQubWFwcGVkRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHhtbEVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGF0dHJpYnV0ZUtleSxhdHRyaWJ1dGUpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlS2V5LGF0dHJpYnV0ZS52YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBhIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IGluIHRoZSBlbmNsb3NlZCBlbGVtZW50IGlmIG5vbmUgYWxscmVhZHkgZXhpc3RzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZnVuY3Rpb25QYXJhbVxuICAgICAqL1xuICAgIGF0dGFjaEV2ZW50KGV2ZW50VHlwZSwgZnVuY3Rpb25QYXJhbSkge1xuICAgICAgICBpZighdGhpcy5ldmVudHNBdHRhY2hlZC5jb250YWlucyhldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBpZihldmVudFR5cGUuc3RhcnRzV2l0aChcIm9uXCIpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRUeXBlID0gZXZlbnRUeXBlLnN1YnN0cigyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZnVuY3Rpb25QYXJhbSk7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c0F0dGFjaGVkLmFkZChldmVudFR5cGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTE9HLndhcm4oXCJFdmVudCAnXCIgKyBldmVudFR5cGUgKyBcIicgYWxscmVhZHkgYXR0YWNoZWQgZm9yIFwiICsgdGhpcy5lbGVtZW50Lm5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBlbmNsb3NlZCBlbGVtZW50XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXQgZnVsbE5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudGFnTmFtZTtcbiAgICB9XG5cbiAgICBnZXQgdG9wKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICB9XG5cbiAgICBnZXQgYm90dG9tKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbTtcbiAgICB9XG5cbiAgICBnZXQgbGVmdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xuICAgIH1cblxuICAgIGdldCByaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5yaWdodDtcbiAgICB9XG5cbiAgICBnZXQgd2lkdGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgZ2V0IGF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHRoaXMubG9hZEF0dHJpYnV0ZXMoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlTWFwO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZVZhbHVlKGtleSx2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSx2YWx1ZSk7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlVmFsdWUoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlKGtleSk7XG4gICAgfVxuXG4gICAgY29udGFpbnNBdHRyaWJ1dGUoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaGFzQXR0cmlidXRlKGtleSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlQXR0cmlidXRlKGtleSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgfVxuXG4gICAgc2V0U3R5bGUoa2V5LHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVtrZXldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0U3R5bGUoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc3R5bGVba2V5XTtcbiAgICB9XG5cbiAgICByZW1vdmVTdHlsZShrZXkpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlW2tleV0gPSBudWxsO1xuICAgIH1cblxuICAgIHNldChpbnB1dCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSA9PT0gbnVsbCl7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVGhlIGVsZW1lbnQgaGFzIG5vIHBhcmVudCwgY2FuIG5vdCBzd2FwIGl0IGZvciB2YWx1ZVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dC5tYXBwZWRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQubWFwcGVkRWxlbWVudCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiBpbnB1dCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoQ29udGFpbmVyRWxlbWVudC5jcmVhdGVUZXh0Tm9kZShpbnB1dCksIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc01vdW50ZWQoKSB7XG4gICAgICAgIGlmKHRoaXMuZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmVtb3ZlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB3aGlsZSAodGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRDaGlsZChpbnB1dCkge1xuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuYWRkQ2hpbGQoaW5wdXQpO1xuICAgIH1cblxuICAgIGFkZENoaWxkKGlucHV0KSB7XG4gICAgICAgIGlmIChpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSB1bmRlZmluZWQgJiYgaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXQubWFwcGVkRWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0ICYmIGlucHV0LnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoQ29udGFpbmVyRWxlbWVudC5jcmVhdGVUZXh0Tm9kZShpbnB1dCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByZXBlbmRDaGlsZChpbnB1dCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKGlucHV0Lm1hcHBlZEVsZW1lbnQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoQ29udGFpbmVyRWxlbWVudC5jcmVhdGVUZXh0Tm9kZShpbnB1dCksdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJBYnN0cmFjdElucHV0RWxlbWVudFwiKTtcblxuLyoqXG4gKiBTaGFyZWQgcHJvcGVydGllcyBvZiBpbnB1dCBlbGVtZW50c1xuICovXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RJbnB1dEVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHZhbHVlXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50XG4gICAgICovXG4gICAgY29uc3RydWN0b3IodmFsdWUsIHBhcmVudCkge1xuICAgICAgICBzdXBlcih2YWx1ZSwgcGFyZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHZhbHVlIG9mIHRoZSBpbnB1dHMgbmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm5hbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB2YWx1ZSBvZiBpbnB1dHMgbmFtZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgc2V0IG5hbWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBnaXZlbiBhbnkgcHJvY2Vzc2luZyBydWxlc1xuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5iYWNraW5nVmFsdWU7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBJbnB1dEV2ZW50KCdjaGFuZ2UnKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc291cmNlIHZhbHVlXG4gICAgICovXG4gICAgZ2V0IGJhY2tpbmdWYWx1ZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cblxuICAgIGZvY3VzKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBzZWxlY3RBbGwoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZWxlY3QoKTtcbiAgICB9XG5cbiAgICBlbmFibGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGRpc2FibGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5kaXNhYmxlZCA9IHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgUmFkaW9JbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHNldCBjaGVja2VkKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpc0NoZWNrZWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jaGVja2VkO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDaGVja2VkKCk7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBcInRydWVcIik7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2hlY2tib3hJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHNldCBjaGVja2VkKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpc0NoZWNrZWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jaGVja2VkO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDaGVja2VkKCk7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBcInRydWVcIik7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0SW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dGFyZWFJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIGdldCBpbm5lckhUTUwoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgc2V0IGlubmVySFRNTCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChpbnB1dCkge1xuICAgICAgICBzdXBlci5hZGRDaGlsZChpbnB1dCk7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgc3VwZXIucHJlcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuaW5uZXJIVE1MO1xuICAgIH1cblxufSIsImltcG9ydCB7IFhtbENkYXRhIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQ29udGFpbmVyRWxlbWVudCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHRub2RlRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxDZGF0YX0gdmFsdWUgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBYbWxDZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gdGhpcy5jcmVhdGVGcm9tWG1sQ2RhdGEodmFsdWUsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtYbWxDZGF0YX0gY2RhdGFFbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudEVsZW1lbnQgXG4gICAgICovXG4gICAgY3JlYXRlRnJvbVhtbENkYXRhKGNkYXRhRWxlbWVudCwgcGFyZW50RWxlbWVudCkge1xuICAgICAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNkYXRhRWxlbWVudC52YWx1ZSk7XG4gICAgICAgIGlmKHBhcmVudEVsZW1lbnQgIT09IG51bGwgJiYgcGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFNpbXBsZUVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIGdldCBpbm5lckhUTUwoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgc2V0IGlubmVySFRNTCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIEZvcm1FbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHZhbHVlIG9mIHRoZSBpbnB1dHMgbmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm5hbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB2YWx1ZSBvZiBpbnB1dHMgbmFtZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgc2V0IG5hbWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBzdWJtaXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc3VibWl0KCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBWaWRlb0VsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB2YWx1ZSBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgZ2V0IG1hcHBlZEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG4gICAgcGxheSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnBsYXkoKTtcbiAgICB9XG5cbiAgICBtdXRlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQubXV0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHVubXV0ZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm11dGVkID0gZmFsc2U7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sQ2RhdGEsWG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtSYWRpb0lucHV0RWxlbWVudH0gZnJvbSBcIi4vcmFkaW9JbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7Q2hlY2tib3hJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2NoZWNrYm94SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RleHRJbnB1dEVsZW1lbnR9IGZyb20gXCIuL3RleHRJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7VGV4dGFyZWFJbnB1dEVsZW1lbnR9IGZyb20gXCIuL3RleHRhcmVhSW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RleHRub2RlRWxlbWVudH0gZnJvbSBcIi4vdGV4dG5vZGVFbGVtZW50LmpzXCI7XG5pbXBvcnQge1NpbXBsZUVsZW1lbnR9IGZyb20gXCIuL3NpbXBsZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEZvcm1FbGVtZW50IH0gZnJvbSBcIi4vZm9ybUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFZpZGVvRWxlbWVudCB9IGZyb20gXCIuL3ZpZGVvRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudE1hcHBlciB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7YW55fSBpbnB1dCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgc3RhdGljIG1hcChpbnB1dCwgcGFyZW50KSB7XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1JhZGlvKGlucHV0KSl7IHJldHVybiBuZXcgUmFkaW9JbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvQ2hlY2tib3goaW5wdXQpKXsgcmV0dXJuIG5ldyBDaGVja2JveElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9TdWJtaXQoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb0Zvcm0oaW5wdXQpKXsgcmV0dXJuIG5ldyBGb3JtRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0YXJlYShpbnB1dCkpeyByZXR1cm4gbmV3IFRleHRhcmVhSW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHQoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1ZpZGVvKGlucHV0KSl7IHJldHVybiBuZXcgVmlkZW9FbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHRub2RlKGlucHV0KSl7IHJldHVybiBuZXcgVGV4dG5vZGVFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1NpbXBsZShpbnB1dCkpeyByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgY29uc29sZS5sb2coXCJNYXBwaW5nIHRvIHNpbXBsZSBieSBkZWZhdWx0IFwiICsgaW5wdXQpO1xuICAgICAgICByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1JhZGlvKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJyYWRpb1wiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInJhZGlvXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9DaGVja2JveChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwiY2hlY2tib3hcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJjaGVja2JveFwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvU3VibWl0KGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJzdWJtaXRcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJzdWJtaXRcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb0Zvcm0oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImZvcm1cIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1RleHQoaW5wdXQpe1xuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJ0ZXh0XCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInBhc3N3b3JkXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcImVtYWlsXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcImRhdGVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwidGltZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIikge1xuICAgICAgICAgICAgaWYoIWlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwidGV4dFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInBhc3N3b3JkXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiZW1haWxcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJkYXRlXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwidGltZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0bm9kZShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBOb2RlICYmIGlucHV0Lm5vZGVUeXBlID09PSBcIlRFWFRfTk9ERVwiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sQ2RhdGEpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9WaWRlbyhpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MVmlkZW9FbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcInZpZGVvXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0YXJlYShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcInRleHRhcmVhXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9TaW1wbGUoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50KTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IEVsZW1lbnRNYXBwZXIgfSBmcm9tIFwiLi4vZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudHtcblxuICAgIGNvbnN0cnVjdG9yKGV2ZW50KXtcbiAgICAgICAgdGhpcy5ldmVudCA9IGV2ZW50O1xuICAgICAgICBpZih0aGlzLmV2ZW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSBcImRyYWdzdGFydFwiKXtcbiAgICAgICAgICAgIHRoaXMuZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoJ3RleHQvcGxhaW4nLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3BQcm9wYWdhdGlvbigpe1xuICAgICAgICB0aGlzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHByZXZlbnREZWZhdWx0KCl7XG4gICAgICAgIHRoaXMuZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgZXZlbnQgYW5kIHRoZSBlZGdlIHggY29vcmRpbmF0ZSBvZiB0aGUgY29udGFpbmluZyBvYmplY3RcbiAgICAgKi9cbiAgICBnZXRPZmZzZXRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Lm9mZnNldFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGV2ZW50IGFuZCB0aGUgZWRnZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNvbnRhaW5pbmcgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0T2Zmc2V0WSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5vZmZzZXRZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtb3VzZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGV2ZW50IHJlbGF0aXZlIHRvIHRoZSBjbGllbnQgd2luZG93IHZpZXdcbiAgICAgKi9cbiAgICBnZXRDbGllbnRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmNsaWVudFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1vdXNlIHkgY29vcmRpbmF0ZSBvZiB0aGUgZXZlbnQgcmVsYXRpdmUgdG8gdGhlIGNsaWVudCB3aW5kb3cgdmlld1xuICAgICAqL1xuICAgIGdldENsaWVudFkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQuY2xpZW50WTtcbiAgICB9XG5cbiAgICBnZXRUYXJnZXQoKXtcbiAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHRoaXMuZXZlbnQudGFyZ2V0KTtcbiAgICB9XG5cbiAgICBnZXRUYXJnZXRWYWx1ZSgpe1xuICAgICAgICBpZih0aGlzLmdldFRhcmdldCgpKSB7IFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFyZ2V0KCkudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0S2V5Q29kZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQua2V5Q29kZTtcbiAgICB9XG5cbiAgICBpc0tleUNvZGUoY29kZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5rZXlDb2RlID09PSBjb2RlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBNYXAsIE9iamVjdEZ1bmN0aW9uLCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEV2ZW50IH0gZnJvbSBcIi4vZXZlbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkV2ZW50UmVnaXN0cnlcIik7XG5cbmV4cG9ydCBjbGFzcyBFdmVudFJlZ2lzdHJ5IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwPE1hcDxPYmplY3RGdW5jdGlvbj59ICovXG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwPE9iamVjdEZ1bmN0aW9uPn0gKi9cbiAgICAgICAgdGhpcy5iZWZvcmVMaXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXA8T2JqZWN0RnVuY3Rpb24+fSAqL1xuICAgICAgICB0aGlzLmFmdGVyTGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbm5lY3RzIGVsZW1lbnRzIHdpdGggdGhlIGV2ZW50IHJlZ2lzdHJ5IHNvIHRoYXQgZXZlbnRzIHRyaWdnZXJlZCBvbiB0aGUgZWxlbWVudCBnZXRzIGRpc3RyaWJ1dGVkIHRvIGFsbCBsaXN0ZW5lcnNcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50IHRoZSBlbGVtZW50IHdoaWNoIGlzIHRoZSBzb3VyY2Ugb2YgdGhlIGV2ZW50IGFuZCB3aGljaCBjYW4gYmUgYXR0YWNoZWQgdG9cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRUeXBlIHRoZSBldmVudCB0eXBlIGFzIGl0IGlzIGRlZmluZWQgYnkgdGhlIGNvbnRhaW5pbmcgdHJpZ2dlciAoZXhhbXBsZSBcIm9uY2xpY2tcIilcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIHRoZSBldmVudCBuYW1lIGFzIGl0IHdpbGwgYmUgcmVmZXJyZWQgdG8gaW4gdGhlIEV2ZW50UmVnaXN0cnkgKGV4YW1wbGUgXCIvL2V2ZW50OmNsaWNrZWRcIilcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50SW5kZXggdW5pcXVlIGlkIG9mIHRoZSBjb21wb25lbnQgd2hpY2ggb3ducyB0aGUgZWxlbWVudFxuICAgICAqL1xuICAgIGF0dGFjaChlbGVtZW50LCBldmVudFR5cGUsIGV2ZW50TmFtZSwgY29tcG9uZW50SW5kZXgpIHtcbiAgICAgICAgY29uc3QgdW5pcXVlRXZlbnROYW1lID0gZXZlbnROYW1lICsgXCJfXCIgKyBjb21wb25lbnRJbmRleDtcbiAgICAgICAgY29uc3QgdGhlRXZlbnRSZWdpc3RyeSA9IHRoaXM7XG4gICAgICAgIGVsZW1lbnQuYXR0YWNoRXZlbnQoZXZlbnRUeXBlLCBmdW5jdGlvbihldmVudCkgeyB0aGVFdmVudFJlZ2lzdHJ5LnRyaWdnZXIodW5pcXVlRXZlbnROYW1lLCBldmVudE5hbWUsIGV2ZW50KTsgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50TmFtZSB0aGUgZXZlbnQgbmFtZSBhcyBpdCB3aWxsIGJlIHJlZmVycmVkIHRvIGluIHRoZSBFdmVudFJlZ2lzdHJ5IChleGFtcGxlIFwiLy9ldmVudDpjbGlja2VkXCIpXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gbGlzdGVuZXIgdGhlIG9iamVjdCB3aGljaCBvd25zIHRoZSBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHVuaXF1ZUluZGV4IGEgdW5pcXVlIGluZGV4IGZvciB0aGUgZXZlbnRcbiAgICAgKi9cbiAgICBsaXN0ZW4oZXZlbnROYW1lLCBsaXN0ZW5lciwgdW5pcXVlSW5kZXgpIHtcbiAgICAgICAgY29uc3QgdW5pcXVlRXZlbnROYW1lID0gZXZlbnROYW1lICsgXCJfXCIgKyB1bmlxdWVJbmRleDtcbiAgICAgICAgdGhpcy5pbml0TWFwKHRoaXMubGlzdGVuZXJzLCB1bmlxdWVFdmVudE5hbWUpO1xuICAgICAgICAvKiogQHR5cGUge01hcDxPYmplY3RGdW5jdGlvbj59ICovXG4gICAgICAgIGNvbnN0IGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lcnMuZ2V0KHVuaXF1ZUV2ZW50TmFtZSk7XG4gICAgICAgIGxpc3RlbmVyTWFwLnNldChsaXN0ZW5lci5vYmplY3QuY29uc3RydWN0b3IubmFtZSwgbGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgdGhlIGV2ZW50IG5hbWUgYXMgaXQgd2lsbCBiZSByZWZlcnJlZCB0byBpbiB0aGUgRXZlbnRSZWdpc3RyeSAoZXhhbXBsZSBcIi8vZXZlbnQ6Y2xpY2tlZFwiKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGxpc3RlbmVyIHRoZSBvYmplY3Qgd2hpY2ggb3ducyB0aGUgaGFuZGxlciBmdW5jdGlvblxuICAgICAqL1xuICAgIGxpc3RlbkJlZm9yZShldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuaW5pdE1hcCh0aGlzLmJlZm9yZUxpc3RlbmVycywgZXZlbnROYW1lKTtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXA8T2JqZWN0RnVuY3Rpb24+fSAqL1xuICAgICAgICBjb25zdCBsaXN0ZW5lck1hcCA9IHRoaXMuYmVmb3JlTGlzdGVuZXJzLmdldChldmVudE5hbWUpO1xuICAgICAgICBsaXN0ZW5lck1hcC5zZXQobGlzdGVuZXIub2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIHRoZSBldmVudCBuYW1lIGFzIGl0IHdpbGwgYmUgcmVmZXJyZWQgdG8gaW4gdGhlIEV2ZW50UmVnaXN0cnkgKGV4YW1wbGUgXCIvL2V2ZW50OmNsaWNrZWRcIilcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBsaXN0ZW5lciB0aGUgb2JqZWN0IHdoaWNoIG93bnMgdGhlIGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBsaXN0ZW5BZnRlcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuaW5pdE1hcCh0aGlzLmFmdGVyTGlzdGVuZXJzLCBldmVudE5hbWUpO1xuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgY29uc3QgbGlzdGVuZXJNYXAgPSB0aGlzLmFmdGVyTGlzdGVuZXJzLmdldChldmVudE5hbWUpO1xuICAgICAgICBsaXN0ZW5lck1hcC5zZXQobGlzdGVuZXIub2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcDxNYXA8T2JqZWN0RnVuY3Rpb24+fSBtYXAgXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBcbiAgICAgKi9cbiAgICBpbml0TWFwKG1hcCwga2V5KSB7XG4gICAgICAgIGlmICghbWFwLmV4aXN0cyhrZXkpKSB7XG4gICAgICAgICAgICBtYXAuc2V0KGtleSxuZXcgTWFwKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJpZ2dlcihzdWZmaXhlZEV2ZW50TmFtZSwgZXZlbnROYW1lLCBldmVudCkge1xuICAgICAgICB0aGlzLmhhbmRsZUJlZm9yZShldmVudE5hbWUsIGV2ZW50KTtcbiAgICAgICAgaWYgKHRoaXMubGlzdGVuZXJzLmV4aXN0cyhzdWZmaXhlZEV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChzdWZmaXhlZEV2ZW50TmFtZSkuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWUuY2FsbChuZXcgRXZlbnQoZXZlbnQpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGFuZGxlQWZ0ZXIoZXZlbnROYW1lLCBldmVudCk7XG4gICAgfVxuXG4gICAgaGFuZGxlQmVmb3JlKGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVHbG9iYWwodGhpcy5iZWZvcmVMaXN0ZW5lcnMsIGV2ZW50TmFtZSwgZXZlbnQpO1xuICAgIH1cblxuICAgIGhhbmRsZUFmdGVyKGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVHbG9iYWwodGhpcy5hZnRlckxpc3RlbmVycywgZXZlbnROYW1lLCBldmVudCk7XG4gICAgfVxuXG4gICAgaGFuZGxlR2xvYmFsKGxpc3RlbmVycywgZXZlbnROYW1lLCBldmVudCkge1xuICAgICAgICBpZihsaXN0ZW5lcnMuZXhpc3RzKGV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy5nZXQoZXZlbnROYW1lKS5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICB2YWx1ZS5jYWxsKG5ldyBFdmVudChldmVudCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIFVuaXF1ZUlkUmVnaXN0cnkge1xuXG4gICAgaWRBdHRyaWJ1dGVXaXRoU3VmZml4IChpZCkge1xuICAgICAgICBpZihpZE5hbWVzLmNvbnRhaW5zKGlkKSkge1xuICAgICAgICAgICAgdmFyIG51bWJlciA9IGlkTmFtZXMuZ2V0KGlkKTtcbiAgICAgICAgICAgIGlkTmFtZXMuc2V0KGlkLG51bWJlcisxKTtcbiAgICAgICAgICAgIHJldHVybiBpZCArIFwiLVwiICsgbnVtYmVyO1xuICAgICAgICB9XG4gICAgICAgIGlkTmFtZXMuc2V0KGlkLDEpO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG59XG5cbnZhciBpZE5hbWVzID0gbmV3IE1hcCgpOyIsImltcG9ydCB7IE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudFwiO1xuXG4vKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGNvbXBvbmVudEluZGV4IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHJvb3RFbGVtZW50IFxuICAgICAqIEBwYXJhbSB7TWFwfSBlbGVtZW50TWFwIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbXBvbmVudEluZGV4LCByb290RWxlbWVudCwgZWxlbWVudE1hcCkge1xuICAgICAgICB0aGlzLmNvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kZXg7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcCA9IGVsZW1lbnRNYXA7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSByb290RWxlbWVudDtcbiAgICB9XG5cbiAgICByZW1vdmUoKSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge0Jhc2VFbGVtZW50fVxuICAgICAqL1xuICAgIGdldChpZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwLmdldChpZCk7XG4gICAgfVxuXG4gICAgc2V0IChpZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuc2V0KHZhbHVlKTtcbiAgICB9XG5cbiAgICBjbGVhckNoaWxkcmVuKGlkKXtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBzZXRDaGlsZCAoaWQsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLnNldENoaWxkKHZhbHVlKTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZCAoaWQsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLmFkZENoaWxkKHZhbHVlKTtcbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQgKGlkLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5wcmVwZW5kQ2hpbGQodmFsdWUpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgTWFwLCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBFbGVtZW50TWFwcGVyIH0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlclwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgRXZlbnRSZWdpc3RyeSB9IGZyb20gXCIuLi9ldmVudC9ldmVudFJlZ2lzdHJ5XCI7XG5cbi8qKlxuICogQ29sbGVjdHMgaW5mb3JtYXRpb24gd2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBhbmQgZmluZHMgdGhlIHJvb3QgZWxlbWVudCwgY3JlYXRlcyBtYXAgb2YgZWxlbWVudHMgXG4gKiBhbmQgcmVnaXN0ZXJzIGV2ZW50cyBpbiB0aGUgZXZlbnRSZWdpc3RyeVxuICovXG5leHBvcnQgY2xhc3MgRWxlbWVudFJlZ2lzdHJhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKGV2ZW50UmVnaXN0cnksIHVuaXF1ZUlkUmVnaXN0cnksIGNvbXBvbmVudEluZGV4KSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50SW5kZXggPSBjb21wb25lbnRJbmRleDtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy51bmlxdWVJZFJlZ2lzdHJ5ID0gdW5pcXVlSWRSZWdpc3RyeTtcblxuICAgICAgICAvKiogQHR5cGUge0V2ZW50UmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMuZXZlbnRSZWdpc3RyeSA9IGV2ZW50UmVnaXN0cnk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50TWFwID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGdldEVsZW1lbnRNYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGlzdGVucyB0byBlbGVtZW50cyBiZWluZyBjcmVhdGVkLCBhbmQgdGFrZXMgaW5uIHRoZSBjcmVhdGVkIFhtbEVsZW1lbnQgYW5kIGl0cyBwYXJlbnQgWG1sRWxlbWVudFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0geG1sRWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRXcmFwcGVyIFxuICAgICAqL1xuICAgIGVsZW1lbnRDcmVhdGVkICh4bWxFbGVtZW50LCBwYXJlbnRXcmFwcGVyKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gRWxlbWVudE1hcHBlci5tYXAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcik7XG5cbiAgICAgICAgdGhpcy5hZGRUb0VsZW1lbnRJZE1hcChlbGVtZW50KTtcbiAgICAgICAgdGhpcy5yZWdpc3RlckVsZW1lbnRFdmVudHMoZWxlbWVudCk7XG5cbiAgICAgICAgaWYodGhpcy5yb290RWxlbWVudCA9PT0gbnVsbCAmJiBlbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIHJlZ2lzdGVyRWxlbWVudEV2ZW50cyhlbGVtZW50KXtcbiAgICAgICAgaWYoZWxlbWVudCA9PT0gbnVsbCB8fCBlbGVtZW50ID09PSB1bmRlZmluZWQgfHwgIShlbGVtZW50IGluc3RhbmNlb2YgQmFzZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGV2ZW50UmVnaXN0cnkgPSB0aGlzLmV2ZW50UmVnaXN0cnk7XG4gICAgICAgIHZhciBjb21wb25lbnRJbmRleCA9IHRoaXMuY29tcG9uZW50SW5kZXg7XG4gICAgICAgIGVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChhdHRyaWJ1dGVLZXksYXR0cmlidXRlLHBhcmVudCl7XG4gICAgICAgICAgICBpZihhdHRyaWJ1dGUgIT09IG51bGwgJiYgYXR0cmlidXRlICE9PSB1bmRlZmluZWQgJiYgYXR0cmlidXRlLnZhbHVlLnN0YXJ0c1dpdGgoXCIvL2V2ZW50OlwiKSkge1xuICAgICAgICAgICAgICAgIHZhciBldmVudE5hbWUgPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50VHlwZSA9IGF0dHJpYnV0ZS5uYW1lO1xuICAgICAgICAgICAgICAgIGV2ZW50UmVnaXN0cnkuYXR0YWNoKGVsZW1lbnQsZXZlbnRUeXBlLGV2ZW50TmFtZSxjb21wb25lbnRJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgICAgICAgICBcbiAgICAgICAgfSx0aGlzKTtcbiAgICB9XG5cbiAgICBhZGRUb0VsZW1lbnRJZE1hcChlbGVtZW50KSB7XG4gICAgICAgIGlmKGVsZW1lbnQgPT09IG51bGwgfHwgZWxlbWVudCA9PT0gdW5kZWZpbmVkIHx8ICEoZWxlbWVudCBpbnN0YW5jZW9mIEJhc2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpZCA9IG51bGw7XG4gICAgICAgIGlmKGVsZW1lbnQuY29udGFpbnNBdHRyaWJ1dGUoXCJpZFwiKSkge1xuICAgICAgICAgICAgaWQgPSBlbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwiaWRcIik7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiaWRcIix0aGlzLnVuaXF1ZUlkUmVnaXN0cnkuaWRBdHRyaWJ1dGVXaXRoU3VmZml4KGlkKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihpZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50TWFwLnNldChpZCxlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn0iLCJpbXBvcnQgeyBDb250YWluZXJFbGVtZW50IH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2FudmFzUm9vdCB7XG5cbiAgICBzdGF0aWMgcmVwbGFjZUNvbXBvbmVudChpZCwgY29tcG9uZW50KSB7XG4gICAgICAgIHZhciBib2R5RWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBib2R5RWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChjb21wb25lbnQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCwgYm9keUVsZW1lbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBzZXRDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xuICAgICAgICB2YXIgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBib2R5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFkZENoaWxkQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgdmFyIGJvZHlFbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYWRkQ2hpbGRFbGVtZW50KGlkLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciBib2R5RWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBib2R5RWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyByZW1vdmVFbGVtZW50KGlkKSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQucmVtb3ZlRWxlbWVudChpZCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgYWRkSGVhZGVyRWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQuYWRkRWxlbWVudChcImhlYWRcIiwgZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKiogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxuICAgICAqL1xuICAgIHN0YXRpYyBhZGRCb2R5RWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQuYWRkRWxlbWVudChcImJvZHlcIiwgZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKiogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxuICAgICAqL1xuICAgIHN0YXRpYyBwcmVwZW5kSGVhZGVyRWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQucHJlcGVuZEVsZW1lbnQoXCJoZWFkXCIsIGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgcHJlcGVuZEJvZHlFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5wcmVwZW5kRWxlbWVudChcImJvZHlcIiwgZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7RWxlbWVudE1hcHBlcn0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgSFRNTHtcblxuICAgIHN0YXRpYyBjdXN0b20oZWxlbWVudE5hbWUpe1xuICAgICAgICB2YXIgeG1sRWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnROYW1lKTtcbiAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHhtbEVsZW1lbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBhcHBseVN0eWxlcyhlbGVtZW50LGNsYXNzVmFsdWUsc3R5bGVWYWx1ZSl7XG4gICAgICAgIGlmKGNsYXNzVmFsdWUgIT09IG51bGwpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsY2xhc3NWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3R5bGVWYWx1ZSAhPT0gbnVsbCl7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIixzdHlsZVZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBhKG5hbWUsaHJlZixjbGFzc1ZhbHVlLHN0eWxlVmFsdWUpe1xuICAgICAgICB2YXIgZWxlbWVudCA9IEhUTUwuY3VzdG9tKFwiYVwiKTtcbiAgICAgICAgZWxlbWVudC5hZGRDaGlsZChuYW1lKTtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImhyZWZcIixocmVmKTtcbiAgICAgICAgSFRNTC5hcHBseVN0eWxlcyhlbGVtZW50LGNsYXNzVmFsdWUsc3R5bGVWYWx1ZSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IE1hcCwgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDYW52YXNSb290IH0gZnJvbSBcIi4vY2FudmFzUm9vdC5qc1wiO1xuaW1wb3J0IHsgSFRNTCB9IGZyb20gXCIuLi9odG1sL2h0bWwuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFRleHRub2RlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L3RleHRub2RlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ2FudmFzU3R5bGVzXCIpO1xuXG5jb25zdCBzdHlsZXMgPSBuZXcgTWFwKCk7XG5jb25zdCBzdHlsZU93bmVycyA9IG5ldyBNYXAoKTtcbmNvbnN0IGVuYWJsZWRTdHlsZXMgPSBuZXcgTGlzdCgpO1xuXG5leHBvcnQgY2xhc3MgQ2FudmFzU3R5bGVzIHtcblxuICAgIHN0YXRpYyBzZXRTdHlsZShuYW1lLCBzb3VyY2UpIHtcbiAgICAgICAgaWYoc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBzdHlsZXMuZ2V0KG5hbWUpLnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xuICAgICAgICAgICAgbGV0IHN0eWxlRWxlbWVudCA9IEhUTUwuY3VzdG9tKFwic3R5bGVcIik7XG4gICAgICAgICAgICBzdHlsZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiLG5hbWUpO1xuICAgICAgICAgICAgc3R5bGVFbGVtZW50LnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XG4gICAgICAgICAgICBzdHlsZXMuc2V0KG5hbWUsIHN0eWxlRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlU3R5bGUobmFtZSkge1xuICAgICAgICBpZihlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLnJlbW92ZShuYW1lKTtcbiAgICAgICAgICAgIENhbnZhc1Jvb3QucmVtb3ZlRWxlbWVudChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZihzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHN0eWxlcy5yZW1vdmUobmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZGlzYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XG4gICAgICAgIENhbnZhc1N0eWxlcy5yZW1vdmVTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xuICAgICAgICBpZihDYW52YXNTdHlsZXMuaGFzU3R5bGVPd25lcihuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihcIlN0eWxlIGRvZXMgbm90IGV4aXN0OiBcIiArIG5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMucmVtb3ZlKG5hbWUpO1xuICAgICAgICAgICAgQ2FudmFzUm9vdC5yZW1vdmVFbGVtZW50KG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGVuYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XG4gICAgICAgIENhbnZhc1N0eWxlcy5hZGRTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xuICAgICAgICBpZighc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJTdHlsZSBkb2VzIG5vdCBleGlzdDogXCIgKyBuYW1lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZighZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5hZGQobmFtZSk7XG4gICAgICAgICAgICBDYW52YXNSb290LmFkZEhlYWRlckVsZW1lbnQoc3R5bGVzLmdldChuYW1lKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYWRkU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgc3R5bGVPd25lcnMuc2V0KG5hbWUsIG5ldyBMaXN0KCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5nZXQobmFtZSkuY29udGFpbnMob3duZXJJZCkpIHtcbiAgICAgICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5hZGQob3duZXJJZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5yZW1vdmUob3duZXJJZCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGhhc1N0eWxlT3duZXIobmFtZSkge1xuICAgICAgICBpZighc3R5bGVPd25lcnMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3R5bGVPd25lcnMuZ2V0KG5hbWUpLnNpemUoKSA+IDA7XG4gICAgfVxufSIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudFwiO1xuaW1wb3J0IHsgVW5pcXVlSWRSZWdpc3RyeSB9IGZyb20gXCIuL3VuaXF1ZUlkUmVnaXN0cnlcIjtcbmltcG9ydCB7IEVsZW1lbnRSZWdpc3RyYXRvciB9IGZyb20gXCIuL2VsZW1lbnRSZWdpc3RyYXRvclwiO1xuaW1wb3J0IHsgRXZlbnRSZWdpc3RyeSB9IGZyb20gXCIuLi9ldmVudC9ldmVudFJlZ2lzdHJ5XCI7XG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnlcIjtcbmltcG9ydCB7IERvbVRyZWUgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNSZWdpc3RyeVwiO1xuaW1wb3J0IHsgQ2FudmFzU3R5bGVzIH0gZnJvbSBcIi4uL2NhbnZhcy9jYW52YXNTdHlsZXNcIjtcbmltcG9ydCB7IEluamVjdGlvblBvaW50IH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDb21wb25lbnRGYWN0b3J5XCIpO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvKiogQHR5cGUge0V2ZW50UmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMuZXZlbnRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKEV2ZW50UmVnaXN0cnkpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3R5bGVzUmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtUZW1wbGF0ZVJlZ2lzdHJ5fSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShUZW1wbGF0ZVJlZ2lzdHJ5KTtcblxuICAgICAgICAvKiogQHR5cGUge1VuaXF1ZUlkUmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFVuaXF1ZUlkUmVnaXN0cnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIHJlcHJlc2VudHMgdGhlIHRlbXBsYXRlIGFuZCB0aGUgc3R5bGVzIG5hbWUgaWYgdGhlIHN0eWxlIGZvciB0aGF0IG5hbWUgaXMgYXZhaWxhYmxlXG4gICAgICovXG4gICAgY3JlYXRlKG5hbWUpe1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlUmVnaXN0cnkuZ2V0KG5hbWUpO1xuICAgICAgICBpZighdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcih0aGlzLnRlbXBsYXRlUmVnaXN0cnkpO1xuICAgICAgICAgICAgdGhyb3cgXCJObyB0ZW1wbGF0ZSB3YXMgZm91bmQgd2l0aCBuYW1lIFwiICsgbmFtZTtcblxuICAgICAgICB9XG4gICAgICAgIHZhciBlbGVtZW50UmVnaXN0cmF0b3IgPSBuZXcgRWxlbWVudFJlZ2lzdHJhdG9yKHRoaXMuZXZlbnRSZWdpc3RyeSwgdGhpcy51bmlxdWVJZFJlZ2lzdHJ5LCBjb21wb25lbnRDb3VudGVyKyspO1xuICAgICAgICBuZXcgRG9tVHJlZSh0ZW1wbGF0ZS5nZXRUZW1wbGF0ZVNvdXJjZSgpLGVsZW1lbnRSZWdpc3RyYXRvcikubG9hZCgpO1xuXG4gICAgICAgIHRoaXMubW91bnRTdHlsZXMobmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnQoZWxlbWVudFJlZ2lzdHJhdG9yLmNvbXBvbmVudEluZGV4LCBlbGVtZW50UmVnaXN0cmF0b3Iucm9vdEVsZW1lbnQsIGVsZW1lbnRSZWdpc3RyYXRvci5nZXRFbGVtZW50TWFwKCkpO1xuICAgIH1cblxuICAgIG1vdW50U3R5bGVzKG5hbWUpIHtcbiAgICAgICAgaWYodGhpcy5zdHlsZXNSZWdpc3RyeS5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgQ2FudmFzU3R5bGVzLnNldFN0eWxlKG5hbWUsIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0KG5hbWUpKTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG52YXIgY29tcG9uZW50Q291bnRlciA9IDA7IiwiaW1wb3J0IHsgTG9nZ2VyLCBMaXN0IH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcbmltcG9ydCB7IFNpbmdsZXRvbkNvbmZpZywgUHJvdG90eXBlQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCJcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBFdmVudFJlZ2lzdHJ5IH0gZnJvbSBcIi4vZXZlbnQvZXZlbnRSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgVW5pcXVlSWRSZWdpc3RyeSB9IGZyb20gXCIuL2NvbXBvbmVudC91bmlxdWVJZFJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBDb21wb25lbnRGYWN0b3J5IH0gZnJvbSBcIi4vY29tcG9uZW50L2NvbXBvbmVudEZhY3RvcnkuanNcIjtcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDb25maWdcIik7XG5cbmV4cG9ydCBjbGFzcyBDb25maWcge1xuXG4gICAgc3RhdGljIGdldEluc3RhbmNlKCkge1xuICAgICAgICByZXR1cm4ganVzdHJpZ2h0Q29uZmlnO1xuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnR5cGVDb25maWdMaXN0ID0gbmV3IExpc3QoW1xuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVGVtcGxhdGVSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChTdHlsZXNSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChVbmlxdWVJZFJlZ2lzdHJ5KSxcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKENvbXBvbmVudEZhY3RvcnkpLFxuICAgICAgICAgICAgUHJvdG90eXBlQ29uZmlnLnVubmFtZWQoRXZlbnRSZWdpc3RyeSldKTtcbiAgICAgICAgfVxuXG4gICAgZ2V0VHlwZUNvbmZpZ0xpc3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVDb25maWdMaXN0O1xuICAgIH1cblxufVxuXG5jb25zdCBqdXN0cmlnaHRDb25maWcgPSBuZXcgQ29uZmlnKCk7IiwiaW1wb3J0IHsgTGlzdCwgTG9nZ2VyIH0gZnJvbSAgXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgTWluZGlJbmplY3RvciwgTWluZGlDb25maWcsIEluc3RhbmNlUG9zdENvbmZpZ1RyaWdnZXIsIENvbmZpZ0FjY2Vzc29yIH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBDb21wb25lbnRDb25maWdQcm9jZXNzb3IgfSBmcm9tIFwiLi9jb21wb25lbnQvY29tcG9uZW50Q29uZmlnUHJvY2Vzc29yLmpzXCI7XG5pbXBvcnQgeyBNb2R1bGVMb2FkZXIgfSBmcm9tIFwiLi9sb2FkZXIvbW9kdWxlTG9hZGVyLmpzXCI7XG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IENvbmZpZyB9IGZyb20gXCIuL2NvbmZpZy5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQXBwbGljYXRpb25cIik7XG5cbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbiB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvKiogQHR5cGUge0xpc3R9ICovXG4gICAgICAgIHRoaXMud29ya2VyTGlzdCA9IG5ldyBMaXN0KCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xuICAgICAgICB0aGlzLm1vZHVsZUxvYWRlckxpc3QgPSBuZXcgTGlzdCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWluZGlDb25maWd9ICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gbmV3IE1pbmRpQ29uZmlnKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xuICAgICAgICB0aGlzLnJ1bm5pbmdXb3JrZXJzID0gbmV3IExpc3QoKTtcblxuICAgICAgICB0aGlzLmNvbmZpZ1xuICAgICAgICAgICAgLmFkZEFsbFR5cGVDb25maWcoQ29uZmlnLmdldEluc3RhbmNlKCkuZ2V0VHlwZUNvbmZpZ0xpc3QoKSlcbiAgICAgICAgICAgIC5hZGRBbGxDb25maWdQcm9jZXNzb3IobmV3IExpc3QoWyBDb21wb25lbnRDb25maWdQcm9jZXNzb3IgXSkpXG4gICAgICAgICAgICAuYWRkQWxsSW5zdGFuY2VQcm9jZXNzb3IobmV3IExpc3QoWyBJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyIF0pKTtcbiAgICB9XG5cbiAgICBhZGRBbGxUeXBlQ29uZmlnKHR5cGVDb25maWdMaXN0KSB7XG4gICAgICAgIHRoaXMuY29uZmlnLmFkZEFsbFR5cGVDb25maWcodHlwZUNvbmZpZ0xpc3QpO1xuICAgIH1cblxuICAgIHJ1bigpIHtcbiAgICAgICAgdGhpcy5nZXRNYXRjaGluZ01vZHVsZUxvYWRlcigpLmxvYWQoKTtcbiAgICAgICAgdGhpcy5zdGFydFdvcmtlcnMoKTtcbiAgICB9XG5cbiAgICBleGVjdXRlTWF0Y2hpbmdNb2R1bGUoKSB7XG4gICAgICAgIHRoaXMuZ2V0TWF0Y2hpbmdNb2R1bGVMb2FkZXIoKS5kZWZhdWx0SW5zdGFuY2UubG9hZCgpO1xuICAgIH1cblxuICAgIHN0YXJ0V29ya2VycygpIHtcbiAgICAgICAgaWYgKHRoaXMucnVubmluZ1dvcmtlcnMuc2l6ZSgpID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMud29ya2VyTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IHZhbHVlKCk7XG4gICAgICAgICAgICBNaW5kaUluamVjdG9yLmluamVjdChpbnN0YW5jZSwgdGhpcy5jb25maWcpO1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nV29ya2Vycy5hZGQoaW5zdGFuY2UpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtNb2R1bGVMb2FkZXJ9XG4gICAgICovXG4gICAgZ2V0TWF0Y2hpbmdNb2R1bGVMb2FkZXIoKSB7XG4gICAgICAgIGxldCBmb3VuZE1vZHVsZUxvYWRlciA9IG51bGw7XG4gICAgICAgIHRoaXMubW9kdWxlTG9hZGVyTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaGVzKCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZE1vZHVsZUxvYWRlciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGZvdW5kTW9kdWxlTG9hZGVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBnbG9iYWwgYWNjZXNzIHRvIGRlcGVuZGVuY3kgaW5qZWN0aW9uIGNvbmZpZ1xuICAgICAqL1xuICAgIHdpbmRvd0RpQ29uZmlnKCkge1xuICAgICAgICB3aW5kb3cuZGlDb25maWcgPSAoKSA9PiB7XG4gICAgICAgICAgICBMT0cuaW5mbyh0aGlzLmNvbmZpZy5jb25maWdFbnRyaWVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBnbG9iYWwgYWNjZXNzIHRvIHRlbXBsYXRlIHJlZ2lzdHJ5XG4gICAgICovXG4gICAgd2luZG93VGVtcGxhdGVSZWdpc3RyeSgpIHtcbiAgICAgICAgd2luZG93LnRlbXBsYXRlUmVnaXN0cnkgPSAoKSA9PiB7XG4gICAgICAgICAgICBMT0cuaW5mbyhDb25maWdBY2Nlc3Nvci5pbnN0YW5jZUhvbGRlcihUZW1wbGF0ZVJlZ2lzdHJ5Lm5hbWUsIHRoaXMuY29uZmlnKS5pbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byBzdHlsZSByZWdpc3RyeVxuICAgICAqL1xuICAgIHdpbmRvd1N0eWxlUmVnaXN0cnkoKSB7XG4gICAgICAgIHdpbmRvdy5zdHlsZVJlZ2lzdHJ5ID0gKCkgPT4ge1xuICAgICAgICAgICAgTE9HLmluZm8oQ29uZmlnQWNjZXNzb3IuaW5zdGFuY2VIb2xkZXIoU3R5bGVzUmVnaXN0cnkubmFtZSwgdGhpcy5jb25maWcpLmluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IFByb3BlcnR5QWNjZXNzb3IsIExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudFwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSW5wdXRFbGVtZW50RGF0YUJpbmRpbmdcIik7XG5cbmV4cG9ydCBjbGFzcyBJbnB1dEVsZW1lbnREYXRhQmluZGluZyB7XG5cbiAgICBjb25zdHJ1Y3Rvcihtb2RlbCwgdmFsaWRhdG9yKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy52YWxpZGF0b3IgPSB2YWxpZGF0b3I7XG4gICAgICAgIHRoaXMucHVsbGVycyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMucHVzaGVycyA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGxpbmsobW9kZWwsIHZhbGlkYXRvcikge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0RWxlbWVudERhdGFCaW5kaW5nKG1vZGVsLCB2YWxpZGF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZpZWxkIFxuICAgICAqL1xuICAgIGFuZChmaWVsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50byhmaWVsZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdElucHV0RWxlbWVudH0gZmllbGQgXG4gICAgICovXG4gICAgdG8oZmllbGQpIHtcbiAgICAgICAgY29uc3QgcHVsbGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgbGV0IG1vZGVsVmFsdWUgPSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUpO1xuICAgICAgICAgICAgaWYgKG1vZGVsVmFsdWUgIT09IGZpZWxkLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgUHJvcGVydHlBY2Nlc3Nvci5zZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lLCBmaWVsZC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlKGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZmllbGQuYXR0YWNoRXZlbnQoXCJvbmNoYW5nZVwiLCBwdWxsZXIpO1xuICAgICAgICBmaWVsZC5hdHRhY2hFdmVudChcIm9ua2V5dXBcIiwgcHVsbGVyKTtcbiAgICAgICAgcHVsbGVyLmNhbGwoKTtcblxuICAgICAgICBjb25zdCBwdXNoZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgbW9kZWxWYWx1ZSA9IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgZmllbGQubmFtZSk7XG4gICAgICAgICAgICBpZiAobW9kZWxWYWx1ZSAhPT0gZmllbGQudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBmaWVsZC52YWx1ZSA9IG1vZGVsVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGVTaWxlbnQgJiYgZmllbGQudmFsdWUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlU2lsZW50KGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uTmFtZSA9IFwiX19jaGFuZ2VkX1wiICsgZmllbGQubmFtZS5yZXBsYWNlKFwiLlwiLFwiX1wiKTtcbiAgICAgICAgaWYgKCF0aGlzLm1vZGVsW2NoYW5nZWRGdW5jdGlvbk5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVsW2NoYW5nZWRGdW5jdGlvbk5hbWVdID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucHVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wdWxsZXJzLmFkZChwdWxsZXIpO1xuICAgICAgICB0aGlzLnB1c2hlcnMuYWRkKHB1c2hlcik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcHVsbCgpIHtcbiAgICAgICAgdGhpcy5wdWxsZXJzLmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBwdXNoKCkge1xuICAgICAgICB0aGlzLnB1c2hlcnMuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbChwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBQcm94eU9iamVjdEZhY3Rvcnkge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHByb3h5IGZvciBhbiBvYmplY3Qgd2hpY2ggYWxsb3dzIGRhdGFiaW5kaW5nIGZyb20gdGhlIG9iamVjdCB0byB0aGUgZm9ybSBlbGVtZW50XG4gICAgICogXG4gICAgICogQHRlbXBsYXRlIFRcbiAgICAgKiBAcGFyYW0ge1R9IG9iamVjdCBcbiAgICAgKiBAcmV0dXJucyB7VH1cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlUHJveHlPYmplY3Qob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkob2JqZWN0LCB7XG4gICAgICAgICAgICBzZXQ6ICh0YXJnZXQsIHByb3AsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHN1Y2Nlc3MgPSAodGFyZ2V0W3Byb3BdID0gdmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbk5hbWUgPSBcIl9fY2hhbmdlZF9cIiArIHByb3A7XG4gICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbiA9IHRhcmdldFtjaGFuZ2VkRnVuY3Rpb25OYW1lXTtcbiAgICAgICAgICAgICAgICBpZihjaGFuZ2VkRnVuY3Rpb24gJiYgdHlwZW9mIGNoYW5nZWRGdW5jdGlvbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBib3VuZENoYW5nZWRGdW5jdGlvbiA9IGNoYW5nZWRGdW5jdGlvbi5iaW5kKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIGJvdW5kQ2hhbmdlZEZ1bmN0aW9uKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzID09PSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSIsImltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbi8qKlxuICogT2JqZWN0IEZ1bmN0aW9uIHdoaWNoIGlzIGNhbGxlZCBpZiB0aGUgZmlsdGVyIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZVxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRGaWx0ZXJlZE9iamVjdEZ1bmN0aW9uIGV4dGVuZHMgT2JqZWN0RnVuY3Rpb24ge1xuXG4gICAgLyoqXG4gICAgICogQ29udHJ1Y3RvclxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IG9iamVjdEZ1bmN0aW9uIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRoZUZpbHRlciBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvYmplY3RGdW5jdGlvbiwgZmlsdGVyKXtcbiAgICAgICAgdGhpcy5vYmplY3RGdW5jdGlvbiA9IG9iamVjdEZ1bmN0aW9uO1xuICAgICAgICB0aGlzLmZpbHRlciA9IGZpbHRlcjtcbiAgICB9XG5cbiAgICBjYWxsKHBhcmFtcyl7XG4gICAgICAgIGlmKHRoaXMuZmlsdGVyICYmIHRoaXMuZmlsdGVyLmNhbGwodGhpcyxwYXJhbXMpKSB7XG4gICAgICAgICAgICB0aGlzLm9iamVjdEZ1bmN0aW9uLmNhbGwocGFyYW1zKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiXG5pbXBvcnQgeyBNaW5kaUNvbmZpZywgTWluZGlJbmplY3RvciB9IGZyb20gXCJtaW5kaV92MVwiO1xuaW1wb3J0IHsgTW9kdWxlTG9hZGVyIH0gZnJvbSBcIi4vbW9kdWxlTG9hZGVyLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJEaU1vZHVsZUxvYWRlclwiKTtcblxuZXhwb3J0IGNsYXNzIERpTW9kdWxlTG9hZGVyIGV4dGVuZHMgTW9kdWxlTG9hZGVyIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWluZGlDb25maWd9IGNvbmZpZ1xuICAgICAqIEBwYXJhbSB7UmVnRXhwfSBtYXRjaFBhdGggXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHJvb3RQYXRoIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGVQYXRoIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8TG9hZGVyRmlsdGVyPn0gbG9hZGVyRmlsdGVycyBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIG1hdGNoUGF0aCwgcm9vdFBhdGgsIG1vZHVsZVBhdGgsIGxvYWRlckZpbHRlcnMgPSBbXSkge1xuICAgICAgICBzdXBlcihtYXRjaFBhdGgsIHJvb3RQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJGaWx0ZXJzKTtcblxuICAgICAgICAvKiogQHR5cGUge01pbmRpQ29uZmlnfSAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB9XG5cbiAgICBsb2FkKHJvb3RQYXRoKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXM7XG4gICAgICAgIGlmICghcGFyZW50LmZpbHRlcnNQYXNzKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXBhcmVudC5kZWZhdWx0SW5zdGFuY2UpIHtcbiAgICAgICAgICAgIHBhcmVudC5pbXBvcnRNb2R1bGUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBwYXJlbnQuZGVmYXVsdEluc3RhbmNlLmxvYWQocm9vdFBhdGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnQuZGVmYXVsdEluc3RhbmNlLmxvYWQocm9vdFBhdGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNb2R1bGVMb2FkZXJ9IG1vZHVsZUxvYWRlclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGltcG9ydE1vZHVsZSgpIHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcztcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBzdXBlci5pbXBvcnRNb2R1bGUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5hZGRBbGxUeXBlQ29uZmlnKHBhcmVudC5kZWZhdWx0SW5zdGFuY2UudHlwZUNvbmZpZ0xpc3QpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLmZpbmFsaXplKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIE1pbmRpSW5qZWN0b3IuaW5qZWN0KHBhcmVudC5kZWZhdWx0SW5zdGFuY2UsIHRoaXMuY29uZmlnKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufSIsImltcG9ydCB7IExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQWJzdHJhY3RWYWxpZGF0b3JcIik7XG5cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzQ3VycmVudGx5VmFsaWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBlbmFibGVkID0gdHJ1ZSkge1xuICAgICAgICB0aGlzLnZhbGlkTGlzdGVuZXJMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IGN1cnJlbnRseVZhbGlkO1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgIH1cblxuICAgIGVuYWJsZSgpIHtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRpc2FibGUoKSB7XG4gICAgICAgIGxldCB3YXNWYWxpZCA9IHRoaXMuY3VycmVudGx5VmFsaWQ7XG4gICAgICAgIC8vIEZha2UgdmFsaWRcbiAgICAgICAgdGhpcy52YWxpZCgpO1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHdhc1ZhbGlkO1xuICAgIH1cblxuICAgIGlzVmFsaWQoKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50bHlWYWxpZDtcbiAgICB9XG5cblx0dmFsaWQoKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHRydWU7XG4gICAgICAgIGlmKCF0aGlzLnZhbGlkTGlzdGVuZXJMaXN0KSB7XG4gICAgICAgICAgICBMT0cud2FybihcIk5vIHZhbGlkYXRpb24gbGlzdGVuZXJzXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsaWRMaXN0ZW5lckxpc3QuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuXHR9XG5cblx0aW52YWxpZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gZmFsc2U7XG4gICAgICAgIGlmKCF0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QpIHtcbiAgICAgICAgICAgIExPRy53YXJuKFwiTm8gaW52YWxpZGF0aW9uIGxpc3RlbmVyc1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuXHR9XG5cblx0dmFsaWRTaWxlbnQoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB0cnVlO1xuXHR9XG5cblx0aW52YWxpZFNpbGVudCgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSB2YWxpZExpc3RlbmVyIFxuXHQgKi9cblx0d2l0aFZhbGlkTGlzdGVuZXIodmFsaWRMaXN0ZW5lcikge1xuXHRcdHRoaXMudmFsaWRMaXN0ZW5lckxpc3QuYWRkKHZhbGlkTGlzdGVuZXIpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBpbnZhbGlkTGlzdGVuZXIgXG5cdCAqL1xuXHR3aXRoSW52YWxpZExpc3RlbmVyKGludmFsaWRMaXN0ZW5lcikge1xuXHRcdHRoaXMuaW52YWxpZExpc3RlbmVyTGlzdC5hZGQoaW52YWxpZExpc3RlbmVyKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG59XG4iLCJpbXBvcnQgeyBMaXN0LCBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0VmFsaWRhdG9yLmpzJztcblxuZXhwb3J0IGNsYXNzIEFuZFZhbGlkYXRvclNldCBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKGlzVmFsaWRGcm9tU3RhcnQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0ID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0VmFsaWRhdG9yfSB2YWxpZGF0b3JcbiAgICAgKi9cbiAgICB3aXRoVmFsaWRhdG9yKHZhbGlkYXRvcikge1xuICAgICAgICB2YWxpZGF0b3Iud2l0aFZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lVmFsaWQpKTtcbiAgICAgICAgdmFsaWRhdG9yLndpdGhJbnZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lSW52YWxpZCkpO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuYWRkKHZhbGlkYXRvcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgdmFsaWRcbiAgICAgKi9cbiAgICBvbmVWYWxpZCgpIHtcbiAgICAgICAgbGV0IGZvdW5kSW52YWxpZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XG4gICAgICAgICAgICBpZighdmFsdWUuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICAgICAgZm91bmRJbnZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGlmKCFmb3VuZEludmFsaWQpIHtcbiAgICAgICAgICAgIHN1cGVyLnZhbGlkKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdXBlci5pbnZhbGlkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbmUgdmFsaWRhdG9yIHNhaWQgaXQgd2FzIGludmFsaWRcbiAgICAgKi9cbiAgICBvbmVJbnZhbGlkKCkge1xuICAgICAgICBzdXBlci5pbnZhbGlkKCk7XG4gICAgfVxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcblxuZXhwb3J0IGNsYXNzIFJlZ2V4VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgcmVnZXggPSBcIiguKilcIikge1xuXHRcdHN1cGVyKGlzY3VycmVudGx5VmFsaWQpO1xuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xuICAgICAgICB0aGlzLnJlZ2V4ID0gcmVnZXg7XG4gICAgfVxuXG5cdHZhbGlkYXRlKHZhbHVlKXtcblx0XHRpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLm1hdGNoKHRoaXMucmVnZXgpKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZighdmFsdWUgJiYgIXRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHRcdHRoaXMudmFsaWQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLm1hdGNoKHRoaXMucmVnZXgpKXtcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZighdmFsdWUgJiYgIXRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHRcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG59XG4iLCJpbXBvcnQgeyBSZWdleFZhbGlkYXRvciB9IGZyb20gXCIuL3JlZ2V4VmFsaWRhdG9yLmpzXCI7XG5cbmNvbnN0IEVNQUlMX0ZPUk1BVCA9IC9eXFx3KyhbXFwuLV0/XFx3KykqQFxcdysoW1xcLi1dP1xcdyspKihcXC5cXHd7MiwzfSkrJC87XG5cbmV4cG9ydCBjbGFzcyBFbWFpbFZhbGlkYXRvciBleHRlbmRzIFJlZ2V4VmFsaWRhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIobWFuZGF0b3J5LCBpc2N1cnJlbnRseVZhbGlkLCBFTUFJTF9GT1JNQVQpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHsgT2JqZWN0RnVuY3Rpb24gfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIEVxdWFsc0Z1bmN0aW9uUmVzdWx0VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG5cdC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcblx0ICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxuXHQgKi9cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBjb21wYXJlZFZhbHVlRnVuY3Rpb24gPSBudWxsKSB7XG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XG5cblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XG5cblx0XHQvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xuXHRcdHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uID0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gdGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24uY2FsbCgpKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSB0aGlzLmNvbXBhcmVkVmFsdWVGdW5jdGlvbi5jYWxsKCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHsgT2JqZWN0RnVuY3Rpb24sIFByb3BlcnR5QWNjZXNzb3IgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIEVxdWFsc1Byb3BlcnR5VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG5cdC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcblx0ICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxuXHQgKi9cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBtb2RlbCA9IG51bGwsIGF0dHJpYnV0ZU5hbWUgPSBudWxsKSB7XG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XG5cblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XG5cblx0XHQvKiogQHR5cGUge29iamVjdH0gKi9cbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICBcbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMuYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZU5hbWU7XG5cdH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIHRoaXMuYXR0cmlidXRlTmFtZSkpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgdGhpcy5hdHRyaWJ1dGVOYW1lKSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fVxuXHR9XG5cbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiwgUHJvcGVydHlBY2Nlc3NvciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgRXF1YWxzU3RyaW5nVmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG5cdC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcblx0ICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxuXHQgKi9cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBjb250cm9sVmFsdWUgPSBudWxsKSB7XG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XG5cblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMuY29udHJvbFZhbHVlID0gY29udHJvbFZhbHVlO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gY29udHJvbFZhbHVlKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59IiwiaW1wb3J0IHsgTGlzdCwgT2JqZWN0RnVuY3Rpb24gfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSAnLi9hYnN0cmFjdFZhbGlkYXRvci5qcydcblxuZXhwb3J0IGNsYXNzIE9yVmFsaWRhdG9yU2V0IGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKGlzVmFsaWRGcm9tU3RhcnQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0ID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0VmFsaWRhdG9yfSB2YWxpZGF0b3JcbiAgICAgKi9cbiAgICB3aXRoVmFsaWRhdG9yKHZhbGlkYXRvcikge1xuICAgICAgICB2YWxpZGF0b3Iud2l0aFZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lVmFsaWQpKTtcbiAgICAgICAgdmFsaWRhdG9yLndpdGhJbnZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lSW52YWxpZCkpO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuYWRkKHZhbGlkYXRvcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgdmFsaWRcbiAgICAgKi9cbiAgICBvbmVWYWxpZCgpIHtcbiAgICAgICAgc3VwZXIudmFsaWQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbmUgdmFsaWRhdG9yIHNhaWQgaXQgd2FzIGludmFsaWRcbiAgICAgKi9cbiAgICBvbmVJbnZhbGlkKCkge1xuICAgICAgICBsZXQgZm91bmRWYWxpZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XG4gICAgICAgICAgICBpZih2YWx1ZS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZFZhbGlkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIGlmKGZvdW5kVmFsaWQpIHtcbiAgICAgICAgICAgIHN1cGVyLnZhbGlkKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdXBlci5pbnZhbGlkKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBSZWdleFZhbGlkYXRvciB9IGZyb20gXCIuL3JlZ2V4VmFsaWRhdG9yLmpzXCI7XG5cbmNvbnN0IFBBU1NXT1JEX0ZPUk1BVCA9IC9eKD89LipbQS1aYS16XSkoPz0uKj9bMC05XSkoPz0uKj9bIz8hQCQlXiYqLV0pLns4LH0kLztcblxuZXhwb3J0IGNsYXNzIFBhc3N3b3JkVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIFBBU1NXT1JEX0ZPUk1BVCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBSZWdleFZhbGlkYXRvciB9IGZyb20gXCIuL3JlZ2V4VmFsaWRhdG9yLmpzXCI7XG5cbmNvbnN0IFBIT05FX0ZPUk1BVCA9IC9eXFwrWzAtOV17Mn1cXHM/KFswLTldXFxzPykqJC87XG5cbmV4cG9ydCBjbGFzcyBQaG9uZVZhbGlkYXRvciBleHRlbmRzIFJlZ2V4VmFsaWRhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIobWFuZGF0b3J5LCBpc2N1cnJlbnRseVZhbGlkLCBQSE9ORV9GT1JNQVQpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgUmVxdWlyZWRWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0Y29uc3RydWN0b3IoY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgZW5hYmxlZCA9IHRydWUpIHtcblx0XHRzdXBlcihjdXJyZW50bHlWYWxpZCwgZW5hYmxlZCk7XG5cdH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYodmFsdWUgPT09IFwiXCIpe1xuXHQgICAgXHR0aGlzLmludmFsaWQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZih2YWx1ZSA9PT0gXCJcIil7XG5cdCAgICBcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fVxuXHR9XG5cbn1cbiIsImltcG9ydCB7IE1hcCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSHR0cENhbGxCdWlsZGVyXCIpO1xuXG5leHBvcnQgY2xhc3MgSHR0cENhbGxCdWlsZGVyIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBheWxvYWQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodXJsLCBwYXlsb2FkKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7T2JqZWN0fSAqL1xuICAgICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xuICAgICAgICB0aGlzLmF1dGhvcml6YXRpb24gPSBudWxsO1xuXG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMuc3VjY2Vzc01hcHBpbmdNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMuZmFpbE1hcHBpbmdNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtmdW5jdGlvbn0gKi9cbiAgICAgICAgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbiA9IChlcnJvcikgPT4geyByZXR1cm4gZXJyb3I7IH07XG5cblxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICAgICAgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlID0gNDAwMDtcblxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICAgICAgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSA9IDQwMDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtDbGllbnR9IGNsaWVudCBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXlsb2FkIFxuICAgICAqIEByZXR1cm5zIHtIdHRwQ2FsbEJ1aWxkZXJ9XG4gICAgICovXG4gICAgc3RhdGljIG5ld0luc3RhbmNlKGNsaWVudCwgdXJsLCBwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybiBuZXcgSHR0cENhbGxCdWlsZGVyKGNsaWVudCwgdXJsLCBwYXlsb2FkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY29kZSBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtYXBwZXJGdW5jdGlvbiBtYXBwZXIgZnVuY3Rpb24gdG8gcGFzcyB0aGUgcmVzdWx0IG9iamVjdCB0b1xuICAgICAqL1xuICAgIHN1Y2Nlc3NNYXBwaW5nKGNvZGUsIG1hcHBlckZ1bmN0aW9uID0gKCkgPT4geyByZXR1cm4gbnVsbDsgfSkge1xuICAgICAgICB0aGlzLnN1Y2Nlc3NNYXBwaW5nTWFwLnNldChjb2RlLCBtYXBwZXJGdW5jdGlvbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1hcHBlckZ1bmN0aW9uIG1hcHBlciBmdW5jdGlvbiB0byBwYXNzIHRoZSByZXN1bHQgb2JqZWN0IHRvXG4gICAgICovXG4gICAgZmFpbE1hcHBpbmcoY29kZSwgbWFwcGVyRnVuY3Rpb24gPSAoKSA9PiB7IHJldHVybiBudWxsOyB9KSB7XG4gICAgICAgIHRoaXMuZmFpbE1hcHBpbmdNYXAuc2V0KGNvZGUsIG1hcHBlckZ1bmN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cbiAgICAgKi9cbiAgICBlcnJvck1hcHBpbmcobWFwcGVyRnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbiA9IG1hcHBlckZ1bmN0aW9uO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXphdGlvbiBcbiAgICAgKi9cbiAgICBhdXRob3JpemF0aW9uSGVhZGVyKGF1dGhvcml6YXRpb24pIHtcbiAgICAgICAgdGhpcy5hdXRob3JpemF0aW9uID0gXCJCZWFyZXIgXCIgKyBhdXRob3JpemF0aW9uO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25uZWN0aW9uVGltZW91dChjb25uZWN0aW9uVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSA9IGNvbm5lY3Rpb25UaW1lb3V0VmFsdWU7XG4gICAgfVxuXG4gICAgcmVzcG9uc2VUaW1lb3V0KHJlc3BvbnNlVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUgPSByZXNwb25zZVRpbWVvdXRWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBnZXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzVHlwZU1hcHBlZFByb21pc2UoXG4gICAgICAgICAgICBDbGllbnQuZ2V0KHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBwb3N0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKFxuICAgICAgICAgICAgQ2xpZW50LnBvc3QodGhpcy51cmwsIHRoaXMucGF5bG9hZCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgcHV0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKFxuICAgICAgICAgICAgQ2xpZW50LnB1dCh0aGlzLnVybCwgdGhpcy5wYXlsb2FkLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBwYXRjaCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXNUeXBlTWFwcGVkUHJvbWlzZShcbiAgICAgICAgICAgIENsaWVudC5wYXRjaCh0aGlzLnVybCwgdGhpcy5wYXlsb2FkLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBkZWxldGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzVHlwZU1hcHBlZFByb21pc2UoXG4gICAgICAgICAgICBDbGllbnQuZGVsZXRlKHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtQcm9taXNlfSBmZXRjaFByb21pc2UgXG4gICAgICovXG4gICAgYXNUeXBlTWFwcGVkUHJvbWlzZShmZXRjaFByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZmV0Y2hQcm9taXNlLnRoZW4oKGZldGNoUmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUZldGNoUmVzcG9uc2UoZmV0Y2hSZXNwb25zZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEFQSSBkaWQgbm90IGV4ZWN1dGVcbiAgICAgICAgICAgICAgICByZWplY3QodGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihlcnJvcikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7UmVzcG9uc2V9IGZldGNoUmVzcG9uc2UgXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZSBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZWplY3QgXG4gICAgICovXG4gICAgaGFuZGxlRmV0Y2hSZXNwb25zZShmZXRjaFJlc3BvbnNlLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgY29uc3Qgc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyID0gdGhpcy5zdWNjZXNzTWFwcGluZ01hcC5nZXQoZmV0Y2hSZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICBjb25zdCBmYWlsUmVzcG9uc2VNYXBwZXIgPSB0aGlzLmZhaWxNYXBwaW5nTWFwLmdldChmZXRjaFJlc3BvbnNlLnN0YXR1cyk7XG5cbiAgICAgICAgLy8gRW1wdHkgcmVzcG9uc2VcbiAgICAgICAgaWYgKDIwNCA9PT0gZmV0Y2hSZXNwb25zZS5zdGF0dXMgfHwgZmV0Y2hSZXNwb25zZS5oZWFkZXJzLmdldChcIkNvbnRlbnQtTGVuZ3RoXCIpID09PSBcIjBcIikge1xuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NSZXNwb25zZU1hcHBlcikge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKG51bGwpKTsgXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZmFpbFJlc3BvbnNlTWFwcGVyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGZhaWxSZXNwb25zZU1hcHBlcihudWxsKSk7IFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJNaXNzaW5nIG1hcHBlciBmb3IgcmV0dXJuIHN0YXR1czogXCIgKyBmZXRjaFJlc3BvbnNlLnN0YXR1cykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzdW1pbmcganNvbiByZXNwb25zZSAgICAgICAgXG4gICAgICAgIGZldGNoUmVzcG9uc2UuanNvbigpLnRoZW4oKHJlc3BvbnNlSnNvbikgPT4ge1xuICAgICAgICAgICAgaWYoc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKSB7IFxuICAgICAgICAgICAgICAgIHJlc29sdmUoc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKHJlc3BvbnNlSnNvbikpOyBcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihmYWlsUmVzcG9uc2VNYXBwZXIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZmFpbFJlc3BvbnNlTWFwcGVyKHJlc3BvbnNlSnNvbikpOyBcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWplY3QodGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihyZXNwb25zZUpzb24pKTtcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAvLyBSZXNwb25zZSBkaWQgbm90IHByb3ZpZGUganNvblxuICAgICAgICAgICAgcmVqZWN0KHRoaXMuZXJyb3JNYXBwaW5nRnVuY3Rpb24oZXJyb3IpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59Il0sIm5hbWVzIjpbIkNvbnRhaW5lckh0dHBDbGllbnQiLCJMaXN0IiwiTWFwIiwiTG9nZ2VyIiwiTE9HIiwiSW5qZWN0aW9uUG9pbnQiLCJDb250YWluZXJVcmwiLCJYbWxFbGVtZW50IiwiQ29udGFpbmVyRWxlbWVudCIsIlhtbENkYXRhIiwiRG9tVHJlZSIsIlNpbmdsZXRvbkNvbmZpZyIsIlByb3RvdHlwZUNvbmZpZyIsIk1pbmRpQ29uZmlnIiwiSW5zdGFuY2VQb3N0Q29uZmlnVHJpZ2dlciIsIk1pbmRpSW5qZWN0b3IiLCJDb25maWdBY2Nlc3NvciIsIlByb3BlcnR5QWNjZXNzb3IiLCJPYmplY3RGdW5jdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFTyxNQUFNLE1BQU0sQ0FBQztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sR0FBRyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsR0FBRyxJQUFJLEVBQUUsZUFBZSxHQUFHLElBQUksRUFBRSxhQUFhLEdBQUcsSUFBSSxDQUFDO0FBQzNGLFFBQVEsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN0RCxRQUFRLElBQUksTUFBTSxJQUFJO0FBQ3RCLFlBQVksT0FB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

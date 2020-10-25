import { Logger, List, Map, PropertyAccessor, ObjectFunction } from './coreutil_v1.js'
import { InjectionPoint, SingletonConfig, PrototypeConfig, InstancePostConfigTrigger, MindiConfig, MindiInjector, ConfigAccessor } from './mindi_v1.js'
import { XmlElement, XmlCdata, DomTree } from './xmlparser_v1.js'

const LOG = new Logger("ContainerBridge");

class ContainerBridge {

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

/* jshint esversion: 6 */

class Url{

    constructor(value){
        this.protocol = null;
        this.host = null;
        this.port = null;
        this.pathList = new List();
        this.parameterMap = new Map();
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

    getPath(index){
        return this.pathList.get(index);
    }

    clearPathList(){
        this.pathList = new List();
    }

    getParameterMap(){
        return this.parameterMap;
    }

    clearParameterMAp(){
        this.parameterMap = new Map();
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
        var pathParts = new List(value.split("/"));
        this.pathList = new List();
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
        var partList = new List(value.split("&"));
        var parameterMap = new Map();
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

const LOG$1 = new Logger("StylesRegistry");

class StylesRegistry {

    constructor(){
        /** @type {Map} */
        this.stylesMap = new Map();

        /** @type {Map} */
        this.stylesUrlMap = new Map();

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

const LOG$2 = new Logger("TemplateRegistry");

class TemplateRegistry {

    constructor(){
        /** @type {Map} */
        this.templateMap = new Map();

        /** @type {Map} */
        this.templateUrlMap = new Map();

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

const LOG$3 = new Logger("TemplatePostConfig");

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
     * @param {Config} config
     * @returns {Promise}
     */
    load(config) {
        let templateMap = new Map();
        config.configEntries.forEach((key, configEntry, parent) => {
            if(configEntry.classReference.TEMPLATE_URL && configEntry.classReference.COMPONENT_NAME) {
                templateMap.set(configEntry.classReference.COMPONENT_NAME, configEntry.classReference.TEMPLATE_URL);
            }
            return true;
        }, this); 
        return this.templateRegistry.getTemplatesLoadedPromise(templateMap);
    }

}

const LOG$4 = new Logger("StylesLoader");

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
     * @param {Config} config
     * @returns {Promise}
     */
    load(config) {
        let stylesMap = new Map();
        config.configEntries.forEach((key, configEntry, parent) => {
            if(configEntry.classReference.STYLES_URL && configEntry.classReference.COMPONENT_NAME) {
                stylesMap.set(configEntry.classReference.COMPONENT_NAME, configEntry.classReference.STYLES_URL);
            }
            return true;
        }, this); 
        return this.stylesRegistry.getStylesLoadedPromise(stylesMap);
    }

}

const LOG$5 = new Logger("ComponentConfigProcessor");

/**
 * Mindi config processor which loads all templates and styles for all configured components
 * and then calls any existing componentLoaded function on each component
 */
class ComponentConfigProcessor {

    constructor() {

        /**
         * @type {TemplateRegistry}
         */
        this.templateRegistry = InjectionPoint.instance(TemplateRegistry);

        /**
         * @type {StylesRegistry}
         */
        this.stylesRegistry = InjectionPoint.instance(StylesRegistry);

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
    processConfig(config) {
        return Promise.all(
            [ 
                this.templatesLoader.load(config), 
                this.stylesLoader.load(config) 
            ]
        );
    }

}

class Site {

    constructor() {

        /** @type {List} */
        this.typeConfigList = new List();
        
        /** @type {List} */
        this.workers = new List();

        /** @type {List} */
        this.loaderList = new List();
    }

}

class History {

    static pushUrl(url,title,stateObject) {
        window.history.pushState(stateObject, title, url.toString());
    }

    static getUrl() {
        return new Url(window.location.href);
    }

    static loadUrl(url) {
        window.location = url.toString();
    }
}

const LOG$6 = new Logger("Loader");

class Loader {

    constructor(rootPath, modulePath) {
        this.rootPath = rootPath;
        this.modulePath = modulePath;
    }

    matches(){ 
        if (null == this.rootPath) {
            return true;
        }
        const url = History.getUrl();
        return url.getPathList().size() > 0 && "/" +  url.getPath(0) === this.rootPath;
    }

    loadModule() {
        return import(this.modulePath);
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

const LOG$7 = new Logger("BaseElement");

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
        this.eventsAttached = new List();
        
        if(value instanceof XmlElement) {
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
        LOG$7.error("Unrecognized value for Element");
        LOG$7.error(value);
    }

    loadAttributes() {
        if(this.element.attributes === null || this.element.attributes === undefined) {
            this.attributeMap = new Map();
            return;
        }
        if(this.attributeMap === null || this.attributeMap === undefined) {
            this.attributeMap = new Map();
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

const LOG$8 = new Logger("AbstractInputElement");

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
        if(value instanceof XmlCdata) {
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
            (input instanceof XmlElement && input.name === "input" && input.getAttribute("type") && input.getAttribute("type").value === "radio");
    }

    static mapsToCheckbox(input){
        return (input instanceof HTMLInputElement && input.type === "checkbox") ||
            (input instanceof XmlElement && input.name === "input" && input.getAttribute("type") && input.getAttribute("type").value === "checkbox");
    }

    static mapsToSubmit(input){
        return (input instanceof HTMLInputElement && input.type === "submit") ||
            (input instanceof XmlElement && input.name === "input" && input.getAttribute("type") && input.getAttribute("type").value === "submit");
    }

    static mapsToForm(input){
        return (input instanceof HTMLFormElement) ||
            (input instanceof XmlElement && input.name === "form");
    }

    static mapsToText(input){
        if (input instanceof HTMLInputElement) {
            if (input.type === "text") { return true; }
            if (input.type === "password") { return true; }
            if (input.type === "email") { return true; }
            if (input.type === "date") { return true; }
            if (input.type === "time") { return true; }
        }
        if(input instanceof XmlElement && input.name === "input") {
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
            (input instanceof XmlCdata);
    }

    static mapsToVideo(input){
        return (input instanceof HTMLVideoElement) ||
            (input instanceof XmlElement && input.name === "video");
    }

    static mapsToTextarea(input){
        return (input instanceof HTMLTextAreaElement) ||
            (input instanceof XmlElement && input.name === "textarea");
    }

    static mapsToSimple(input){
        return (input instanceof HTMLElement) ||
            (input instanceof XmlElement);
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

const LOG$9 = new Logger("EventRegistry");

class EventRegistry {

    constructor() {
        this.listeners = new Map();
        this.beforeListeners = new Map();
        this.afterListeners = new Map();
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
            map.set(key,new Map());
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

var idNames = new Map();

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

        this.elementMap = new Map();
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
        var xmlElement = new XmlElement(elementName);
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

const LOG$a = new Logger("CanvasStyles");

const styles = new Map();
const styleOwners = new Map();
const enabledStyles = new List();

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
            styleOwners.set(name, new List());
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

const LOG$b = new Logger("ComponentFactory");

class ComponentFactory {

    constructor() {

        /** @type {EventRegistry} */
        this.eventRegistry = InjectionPoint.instance(EventRegistry);

        /** @type {StylesRegistry} */
        this.stylesRegistry = InjectionPoint.instance(StylesRegistry);

        /** @type {TemplateRegistry} */
        this.templateRegistry = InjectionPoint.instance(TemplateRegistry);

        /** @type {UniqueIdRegistry} */
        this.uniqueIdRegistry = InjectionPoint.instance(UniqueIdRegistry);
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
        new DomTree(template.getTemplateSource(),elementRegistrator).load();

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

class State {

    constructor() {

        this.stateListenerMap = new Map();
    }

    recordState(newPath) {
        var url = History.getUrl();
        // Push current url to browser history
        if(!(url.getPath(0) === newPath)) {
            this.setUrl(url);
        }
    }

    /**
     * Sets a new state
     * 
     * @param url 
     */
    setUrl(url) {
        History.pushUrl(url,"",{});
    }
}

const LOG$c = new Logger("Config");

class Config {

    static getInstance() {
        return justrightConfig;
    }

    constructor() {
        this.typeConfigList = new List([
            SingletonConfig.unnamed(TemplateRegistry),
            SingletonConfig.unnamed(StylesRegistry),
            SingletonConfig.unnamed(UniqueIdRegistry),
            SingletonConfig.unnamed(ComponentFactory),
            SingletonConfig.unnamed(State),
            PrototypeConfig.unnamed(EventRegistry)]);
        }

    getTypeConfigList() {
        return this.typeConfigList;
    }

}

const justrightConfig = new Config();

const LOG$d = new Logger("Application");

const SHARED_INSTANCE_PROCESSORS_LIST = new List([ InstancePostConfigTrigger ]);
const SHARED_CONFIG_PROCESSORS_LIST = new List([ ComponentConfigProcessor ]);
const CONFIG = new MindiConfig();

class Application {

    /** 
     * @param {Site} site
     */
    constructor(site) {

        this.site = site;
        this.runningWorkers = new List();
        this.instansiatedLoaders = new List();

        /** @type {Loader} */
        const loader = this.getMatchingLoader();

        /** @type {Promise} */
        const modulePromise = loader.loadModule();

        CONFIG
            .addAllTypeConfig(Config.getInstance().getTypeConfigList())
            .addAllTypeConfig(site.typeConfigList)
            .addAllConfigProcessor(SHARED_CONFIG_PROCESSORS_LIST)
            .addAllInstanceProcessor(SHARED_INSTANCE_PROCESSORS_LIST);

        modulePromise.then((module) => {
            const mainObject = new module.default();
            CONFIG.addAllTypeConfig(mainObject.typeConfigList);
            CONFIG.finalize().then(() => {
                
                // Let mindi load the loader
                MindiInjector.inject(mainObject, CONFIG);
    
                this.instansiatedLoaders.add(mainObject);
                this.startWorkers();
            });
        });
    }

    startWorkers() {
        if (this.runningWorkers.size() > 0) {
            return;
        }
        this.site.workers.forEach((value,parent) => {
            const instance = new value();
            MindiInjector.inject(instance, CONFIG);
            this.runningWorkers.add(instance);
            return true;
        }, this);
    }

    getExistingInstasiatedLoader() {
        let loader = null;
        this.instansiatedLoaders.forEach((value,parent) => {
            if (value.matches()) {
                loader = value;
                return false;
            }
            return true;
        }, this);
        return loader;
    }

    getMatchingLoader() {
        let loader = null;
        this.site.loaderList.forEach((value,parent) => {
            if (value.matches()) {
                loader = value;
                return false;
            }
            return true;
        }, this);
        return loader;
    }

    /**
     * Enable global access to dependency injection config
     */
    windowDiConfig() {
        window.diConfig = () => {
            LOG$d.info(CONFIG.configEntries);
        };
    }

    /**
     * Enable global access to template registry
     */
    windowTemplateRegistry() {
        window.templateRegistry = () => {
            LOG$d.info(ConfigAccessor.instanceHolder(TemplateRegistry.name, CONFIG).getInstance());
        };
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            LOG$d.info(ConfigAccessor.instanceHolder(StylesRegistry.name, CONFIG).getInstance());
        };
    }

}

const LOG$e = new Logger("InputElementDataBinding");

class InputElementDataBinding {

    constructor(model, validator) {
        this.model = model;
        this.validator = validator;
        this.pullers = new List();
        this.pushers = new List();
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
            let modelValue = PropertyAccessor.getValue(this.model, field.name);
            if (modelValue !== field.value) {
                PropertyAccessor.setValue(this.model, field.name, field.value);
            }
            if (this.validator && this.validator.validate){
                this.validator.validate(field.value);
            }
        };
        field.attachEvent("onchange", puller);
        field.attachEvent("onkeyup", puller);
        puller.call();

        const pusher = () => {
            var modelValue = PropertyAccessor.getValue(this.model, field.name);
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

class EventFilteredObjectFunction extends ObjectFunction {

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

const LOG$f = new Logger("HttpCallBuilder");

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
        this.httpCallbackMap = new Map();

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
        this.httpCallbackMap.set(code, new HttpResponseHandler(code, new ObjectFunction(object, callback), mapperFunction));
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
            this.errorCallback = new ObjectFunction(object, callback);
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
        LOG$f.error(error);
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

const LOG$g = new Logger("AbstractValidator");

class AbstractValidator {

    /**
     * @param {boolean} isCurrentlyValid
     */
    constructor(currentlyValid = false, enabled = true) {
        this.validListenerList = new List();
        this.invalidListenerList = new List();
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
        this.validatorList = new List();
    }

    /**
     * @param {AbstractValidator} validator
     */
    withValidator(validator) {
        validator.withValidListener(new ObjectFunction(this, this.oneValid));
        validator.withInvalidListener(new ObjectFunction(this, this.oneInvalid));
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
		} else if(value === PropertyAccessor.getValue(this.model, this.attributeName)){
	    	this.valid();
		} else {
			this.invalid();
		}
	}

	validateSilent(value){
		if (!value && this.mandatory) {
			this.invalidSilent();
		} else if(value === PropertyAccessor.getValue(this.model, this.attributeName)){
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
        this.validatorList = new List();
    }

    /**
     * @param {AbstractValidator} validator
     */
    withValidator(validator) {
        validator.withValidListener(new ObjectFunction(this, this.oneValid));
        validator.withInvalidListener(new ObjectFunction(this, this.oneInvalid));
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

export { AbstractInputElement, AbstractValidator, AndValidatorSet, Application, ApplicationStorage, Attribute, BaseElement, CanvasRoot, CanvasStyles, CheckboxInputElement, Client, Component, ComponentConfigProcessor, ComponentFactory, Config, ContainerBridge, ElementMapper, ElementRegistrator, EmailValidator, EqualsFunctionResultValidator, EqualsPropertyValidator, EqualsStringValidator, Event, EventFilteredObjectFunction, EventRegistry, FormElement, HTML, History, HttpCallBuilder, HttpResponseHandler, InputElementDataBinding, Loader, OrValidatorSet, PasswordValidator, PhoneValidator, ProxyObjectFactory, RadioInputElement, RegexValidator, RequiredValidator, SessionStorage, SimpleElement, Site, State, Styles, StylesLoader, StylesRegistry, Template, TemplateRegistry, TemplatesLoader, TextInputElement, TextareaInputElement, TextnodeElement, UniqueIdRegistry, Url, VideoElement };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvYnJpZGdlL2NvbnRhaW5lckJyaWRnZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2xpZW50L2NsaWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC91cmwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdGVtcGxhdGUvdGVtcGxhdGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3R5bGVzL3N0eWxlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudENvbmZpZ1Byb2Nlc3Nvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc2l0ZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi9oaXN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvYXR0cmlidXRlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2Jhc2VFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3JhZGlvSW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2NoZWNrYm94SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdGV4dGFyZWFJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdGV4dG5vZGVFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3NpbXBsZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvZm9ybUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdmlkZW9FbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2VsZW1lbnRNYXBwZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2V2ZW50L2V2ZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudFJlZ2lzdHJ5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb21wb25lbnQvdW5pcXVlSWRSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2VsZW1lbnRSZWdpc3RyYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2FudmFzL2NhbnZhc1Jvb3QuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2h0bWwvaHRtbC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2FudmFzL2NhbnZhc1N0eWxlcy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudEZhY3RvcnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L25hdmlnYXRpb24vc3RhdGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbmZpZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvYXBwbGljYXRpb24uanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2RhdGFCaW5kL2lucHV0RWxlbWVudERhdGFCaW5kaW5nLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9kYXRhQmluZC9wcm94eU9iamVjdEZhY3RvcnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2V2ZW50L2V2ZW50RmlsdGVyZWRPYmplY3RGdW5jdGlvbi5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3RvcmFnZS9hcHBsaWNhdGlvblN0b3JhZ2UuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0b3JhZ2Uvc2Vzc2lvblN0b3JhZ2UuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3V0aWwvaHR0cFJlc3BvbnNlSGFuZGxlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9odHRwQ2FsbEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9hYnN0cmFjdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2FuZFZhbGlkYXRvclNldC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlZ2V4VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZW1haWxWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNGdW5jdGlvblJlc3VsdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VxdWFsc1Byb3BlcnR5VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzU3RyaW5nVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3Ivb3JWYWxpZGF0b3JTZXQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9wYXNzd29yZFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bob25lbFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlcXVpcmVkVmFsaWRhdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbnRhaW5lckJyaWRnZVwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb250YWluZXJCcmlkZ2Uge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXRFbGVtZW50QnlJZChpZCkge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWxldSBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNyZWF0ZVRleHROb2RlKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNyZWF0ZUVsZW1lbnQobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lU3BhY2UgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNyZWF0ZUVsZW1lbnROUyhuYW1lU3BhY2UsIG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVTcGFjZSwgbmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZmV0Y2godXJsLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0ID0gMTAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UudGltZW91dChjb25uZWN0aW9uVGltZW91dCwgd2luZG93LmZldGNoKHVybCwgcGFyYW1zKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcmFnZSBicmlkZ2VcclxuXHJcbiAgICBzdGF0aWMgc2V0U2Vzc2lvbkF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgd2luZG93LnNlc3Npb25TdG9yYWdlLnNldEl0ZW0oa2V5LHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcmVtb3ZlU2Vzc2lvbkF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBoYXNTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShrZXkpICE9PSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBzZXRMb2NhbEF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSx2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZUxvY2FsQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBoYXNMb2NhbEF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkgIT09IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldExvY2FsQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcmVtb3ZlRWxlbWVudChpZCkge1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICAgICAgZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhZGRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcclxuICAgICAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF07XHJcbiAgICAgICAgaGVhZGVyLmFwcGVuZChlbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYWRkQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF07XHJcbiAgICAgICAgYm9keS5hcHBlbmQoZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHByZXBlbmRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcclxuICAgICAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF07XHJcbiAgICAgICAgaGVhZGVyLnByZXBlbmQoZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHByZXBlbmRCb2R5RWxlbWVudChlbGVtZW50KSB7XHJcbiAgICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiYm9keVwiKVswXTtcclxuICAgICAgICBib2R5LnByZXBlbmQoZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHRpbWVvdXQobWlsbGlzZWNvbmRzLCBwcm9taXNlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcInRpbWVvdXRcIikpXHJcbiAgICAgICAgICB9LCBtaWxsaXNlY29uZHMpXHJcbiAgICAgICAgICBwcm9taXNlLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgQ29udGFpbmVyQnJpZGdlIH0gZnJvbSBcIi4uL2JyaWRnZS9jb250YWluZXJCcmlkZ2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBDbGllbnQge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZ2V0KHVybCwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwKXtcclxuICAgICAgICB2YXIgcGFyYW1zID0gIHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cclxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5mZXRjaCh1cmwudG9TdHJpbmcoKSxwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHBvc3QodXJsLCBkYXRhLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDAsIGF1dGhvcml6YXRpb24gPSBudWxsKXtcclxuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XHJcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxyXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICBtb2RlOiBcImNvcnNcIiwgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXHJcbiAgICAgICAgICAgIHJlZGlyZWN0OiBcImZvbGxvd1wiLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcHV0KHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XHJcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xyXG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcclxuICAgICAgICAgICAgbWV0aG9kOiAnUFVUJywgXHJcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXHJcbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JywgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcGF0Y2godXJsLCBkYXRhLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDAsIGF1dGhvcml6YXRpb24gPSBudWxsKXtcclxuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XHJcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxyXG4gICAgICAgICAgICBtZXRob2Q6ICdQQVRDSCcsIFxyXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxyXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZWxldGUodXJsLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDApe1xyXG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxyXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxyXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRIZWFkZXIoYXV0aG9yaXphdGlvbiA9IG51bGwpIHtcclxuICAgICAgICBsZXQgaGVhZGVycyA9IHtcclxuICAgICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFwiTW96aWxsYS80LjAgTUROIEV4YW1wbGVcIixcclxuICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChhdXRob3JpemF0aW9uKSB7XHJcbiAgICAgICAgICAgIGhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICBcInVzZXItYWdlbnRcIjogXCJNb3ppbGxhLzQuMCBNRE4gRXhhbXBsZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYXV0aG9yaXphdGlvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xyXG4gICAgfVxyXG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge0xpc3QsTWFwfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIFVybHtcblxuICAgIGNvbnN0cnVjdG9yKHZhbHVlKXtcbiAgICAgICAgdGhpcy5wcm90b2NvbCA9IG51bGw7XG4gICAgICAgIHRoaXMuaG9zdCA9IG51bGw7XG4gICAgICAgIHRoaXMucG9ydCA9IG51bGw7XG4gICAgICAgIHRoaXMucGF0aExpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5ib29rbWFyayA9IG51bGw7XG4gICAgICAgIGlmKHZhbHVlID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVtYWluaW5nID0gdGhpcy5kZXRlcm1pbmVQcm90b2NvbCh2YWx1ZSk7XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5wcm90b2NvbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZUhvc3QocmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuaG9zdCAhPT0gbnVsbCl7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZVBvcnQocmVtYWluaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUGF0aChyZW1haW5pbmcpO1xuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUGFyYW1ldGVycyhyZW1haW5pbmcpO1xuICAgICAgICBpZihyZW1haW5pbmcgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGV0ZXJtaW5lQm9va21hcmsocmVtYWluaW5nKTtcbiAgICB9XG5cbiAgICBnZXRQcm90b2NvbCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wcm90b2NvbDtcbiAgICB9XG5cbiAgICBnZXRIb3N0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLmhvc3Q7XG4gICAgfVxuXG4gICAgZ2V0UG9ydCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wb3J0O1xuICAgIH1cblxuICAgIGdldFBhdGhMaXN0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhMaXN0O1xuICAgIH1cblxuICAgIGdldFBhdGgoaW5kZXgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wYXRoTGlzdC5nZXQoaW5kZXgpO1xuICAgIH1cblxuICAgIGNsZWFyUGF0aExpc3QoKXtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgZ2V0UGFyYW1ldGVyTWFwKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmFtZXRlck1hcDtcbiAgICB9XG5cbiAgICBjbGVhclBhcmFtZXRlck1BcCgpe1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBnZXRQYXJhbWV0ZXIoa2V5KXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyTWFwLmdldChrZXkpO1xuICAgIH1cblxuICAgIHNldFBhcmFtZXRlcihrZXksdmFsdWUpe1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcC5zZXQoa2V5LHZhbHVlKTtcbiAgICB9XG5cbiAgICBzZXRCb29rbWFyayhib29rbWFyayl7XG4gICAgICAgIHRoaXMuYm9va21hcmsgPSBib29rbWFyaztcbiAgICB9XG5cbiAgICBzZXRQYXRoKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZGV0ZXJtaW5lUGF0aCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgc2V0UXVlcnlTdHJpbmcodmFsdWUpIHtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAgPSB0aGlzLmRldGVybWluZVBhcmFtZXRlcnModmFsdWUpO1xuICAgIH1cblxuICAgIGdldEJvb2ttYXJrKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmJvb2ttYXJrO1xuICAgIH1cblxuICAgIGRldGVybWluZVByb3RvY29sKHZhbHVlKXtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIi8vXCIpID09PSAtMSl7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCIvL1wiKTtcbiAgICAgICAgaWYocGFydHNbMF0uaW5kZXhPZihcIi9cIikgIT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnByb3RvY29sID0gcGFydHNbMF07XG4gICAgICAgIGlmKHBhcnRzLmxlbmd0aD09MSl7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShwYXJ0c1swXSArIFwiLy9cIixcIlwiKTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVIb3N0KHZhbHVlKXtcbiAgICAgICAgdmFyIHBhcnRzID0gdmFsdWUuc3BsaXQoXCIvXCIpO1xuICAgICAgICB2YXIgaG9zdFBhcnQgPSBwYXJ0c1swXTtcbiAgICAgICAgaWYoaG9zdFBhcnQuaW5kZXhPZihcIjpcIikgIT09IC0xKXtcbiAgICAgICAgICAgIGhvc3RQYXJ0ID0gaG9zdFBhcnQuc3BsaXQoXCI6XCIpWzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaG9zdCA9IGhvc3RQYXJ0O1xuICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKGhvc3RQYXJ0LFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGRldGVybWluZVBvcnQodmFsdWUpe1xuICAgICAgICBpZighdmFsdWUuc3RhcnRzV2l0aChcIjpcIikpe1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwb3J0UGFydCA9IHZhbHVlLnNwbGl0KFwiL1wiKVswXS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHRoaXMucG9ydCA9IHBvcnRQYXJ0O1xuICAgICAgICByZXR1cm4gdmFsdWUucmVwbGFjZShcIjpcIiArIHBvcnRQYXJ0LFwiXCIpO1xuICAgIH1cblxuICAgIGRldGVybWluZVBhdGgodmFsdWUpe1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gdmFsdWU7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCI/XCIpICE9PSAtMSl7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIj9cIik7XG4gICAgICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIj9cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgfSBlbHNlIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSl7XG4gICAgICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIiNcIik7XG4gICAgICAgICAgICBpZihwYXJ0cy5sZW5ndGggPiAxKXtcbiAgICAgICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYXJ0c1swXTtcbiAgICAgICAgfVxuICAgICAgICBpZih2YWx1ZS5zdGFydHNXaXRoKFwiL1wiKSl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygxKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGF0aFBhcnRzID0gbmV3IExpc3QodmFsdWUuc3BsaXQoXCIvXCIpKTtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHBhdGhQYXJ0cy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLHBhcmVudCl7XG4gICAgICAgICAgICBwYXJlbnQucGF0aExpc3QuYWRkKGRlY29kZVVSSSh2YWx1ZSkpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIHJldHVybiByZW1haW5pbmc7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUGFyYW1ldGVycyh2YWx1ZSl7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB2YWx1ZTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIj9cIikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIj9cIikrMSk7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgcmVtYWluaW5nID0gdmFsdWUuc3Vic3RyaW5nKHZhbHVlLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDAsdmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJ0TGlzdCA9IG5ldyBMaXN0KHZhbHVlLnNwbGl0KFwiJlwiKSk7XG4gICAgICAgIHZhciBwYXJhbWV0ZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHBhcnRMaXN0LmZvckVhY2goZnVuY3Rpb24odmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIHZhciBrZXlWYWx1ZSA9IHZhbHVlLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIGlmKGtleVZhbHVlLmxlbmd0aCA+PSAyKXtcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJNYXAuc2V0KGRlY29kZVVSSShrZXlWYWx1ZVswXSksZGVjb2RlVVJJKGtleVZhbHVlWzFdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAgPSBwYXJhbWV0ZXJNYXA7XG4gICAgICAgIHJldHVybiByZW1haW5pbmc7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lQm9va21hcmsodmFsdWUpe1xuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiI1wiKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuYm9va21hcmsgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikrMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0b1N0cmluZygpe1xuICAgICAgICB2YXIgdmFsdWUgPSBcIlwiO1xuICAgICAgICBpZih0aGlzLnByb3RvY29sICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyB0aGlzLnByb3RvY29sICsgXCIvL1wiO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuaG9zdCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgdGhpcy5ob3N0O1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMucG9ydCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI6XCIgKyB0aGlzLnBvcnQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhdGhMaXN0LmZvckVhY2goZnVuY3Rpb24ocGF0aFBhcnQscGFyZW50KXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIi9cIiArIHBhdGhQYXJ0O1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgdmFyIGZpcnN0UGFyYW1ldGVyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAuZm9yRWFjaChmdW5jdGlvbihwYXJhbWV0ZXJLZXkscGFyYW1ldGVyVmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIGlmKGZpcnN0UGFyYW1ldGVyKXtcbiAgICAgICAgICAgICAgICBmaXJzdFBhcmFtZXRlcj1mYWxzZTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI/XCI7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCImXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgZW5jb2RlVVJJKHBhcmFtZXRlcktleSkgKyBcIj1cIiArIGVuY29kZVVSSShwYXJhbWV0ZXJWYWx1ZSk7XG4gICAgICAgIH0sdGhpcyk7XG4gICAgICAgIGlmKHRoaXMuYm9va21hcmsgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIiNcIiArIHRoaXMuYm9va21hcms7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxufVxuIiwiZXhwb3J0IGNsYXNzIFN0eWxlc3tcclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0eWxlc1NvdXJjZSBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3Ioc3R5bGVzU291cmNlKXtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXHJcbiAgICAgICAgdGhpcy5zdHlsZXNTb3VyY2UgPSBzdHlsZXNTb3VyY2U7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXRTdHlsZXNTb3VyY2UoKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNTb3VyY2U7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmltcG9ydCB7TWFwLCBMb2dnZXIsIE9iamVjdEZ1bmN0aW9ufSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcclxuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XHJcbmltcG9ydCB7IFN0eWxlcyB9IGZyb20gXCIuL3N0eWxlcy5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlN0eWxlc1JlZ2lzdHJ5XCIpO1xyXG5cclxuZXhwb3J0IGNsYXNzIFN0eWxlc1JlZ2lzdHJ5IHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzTWFwID0gbmV3IE1hcCgpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cclxuICAgICAgICB0aGlzLnN0eWxlc1VybE1hcCA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzUXVldWVTaXplID0gMDtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cclxuICAgICAgICB0aGlzLmNhbGxiYWNrID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKiBAcGFyYW0ge1N0eWxlc30gc3R5bGVzIFxyXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcclxuICAgICAqL1xyXG4gICAgc2V0KG5hbWUsc3R5bGVzLHVybCl7XHJcbiAgICAgICAgaWYodXJsICE9PSB1bmRlZmluZWQgJiYgdXJsICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3R5bGVzVXJsTWFwLnNldChuYW1lLCB1cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0eWxlc01hcC5zZXQobmFtZSwgc3R5bGVzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKi9cclxuICAgIGdldChuYW1lKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNNYXAuZ2V0KG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqL1xyXG4gICAgY29udGFpbnMobmFtZSl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzTWFwLmNvbnRhaW5zKG5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjYWxsYmFjayBcclxuICAgICAqL1xyXG4gICAgZG9uZShjYWxsYmFjayl7XHJcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtTdHlsZXNSZWdpc3RyeX0gcmVnaXN0cnkgXHJcbiAgICAgKi9cclxuICAgIGRvQ2FsbGJhY2socmVnaXN0cnkpe1xyXG4gICAgICAgIGlmKHRtby5jYWxsYmFjayAhPT0gbnVsbCAmJiByZWdpc3RyeS5jYWxsYmFjayAhPT0gdW5kZWZpbmVkICAmJiByZWdpc3RyeS5zdHlsZXNRdWV1ZVNpemUgPT09IHJlZ2lzdHJ5LnN0eWxlc01hcC5zaXplKCkpe1xyXG4gICAgICAgICAgICB2YXIgdGVtcENhbGxiYWNrID0gcmVnaXN0cnkuY2FsbGJhY2s7XHJcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcclxuICAgICAgICAgICAgdGVtcENhbGxiYWNrLmNhbGwoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxyXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcclxuICAgICAqL1xyXG4gICAgIGxvYWQobmFtZSwgdXJsKSB7XHJcbiAgICAgICAgdGhpcy5zdHlsZXNRdWV1ZVNpemUgKys7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIENsaWVudC5nZXQodXJsKS50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHN0eWxlcyBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZS50ZXh0KCkudGhlbigodGV4dCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFN0eWxlcyh0ZXh0KSx1cmwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge01hcH0gbmFtZVVybE1hcCBcclxuICAgICAqL1xyXG4gICAgZ2V0U3R5bGVzTG9hZGVkUHJvbWlzZShuYW1lVXJsTWFwKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgbG9hZGVkID0gMDtcclxuICAgICAgICAgICAgaWYoIW5hbWVVcmxNYXAgfHwgbmFtZVVybE1hcC5zaXplKCkgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5hbWVVcmxNYXAuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLmNvbnRhaW5zKGtleSkpe1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcclxuICAgICAgICAgICAgICAgICAgICBpZihsb2FkZWQgPT0gbmFtZVVybE1hcC5zaXplKCkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMucHJpdmF0ZUxvYWQoa2V5LCBuZXcgVXJsKHZhbHVlKSlcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goKHJlYXNvbikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVhc29uKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSx0aGlzKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxyXG4gICAgICovXHJcbiAgICBwcml2YXRlTG9hZChuYW1lLCB1cmwpIHtcclxuICAgICAgICBMT0cuaW5mbyhcIkxvYWRpbmcgc3R5bGVzIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsLnRvU3RyaW5nKCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgc3R5bGVzIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgU3R5bGVzKHRleHQpLHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGV7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGVtcGxhdGVTb3VyY2UgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGVtcGxhdGVTb3VyY2Upe1xuXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlU291cmNlID0gdGVtcGxhdGVTb3VyY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRUZW1wbGF0ZVNvdXJjZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVNvdXJjZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtNYXAsIExvZ2dlciwgT2JqZWN0RnVuY3Rpb259IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHtUZW1wbGF0ZX0gZnJvbSBcIi4vdGVtcGxhdGUuanNcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuLi9jbGllbnQvY2xpZW50LmpzXCI7XG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlRlbXBsYXRlUmVnaXN0cnlcIik7XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZVJlZ2lzdHJ5IHtcblxuICAgIGNvbnN0cnVjdG9yKCl7XG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlVXJsTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7aW50ZWdlcn0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVF1ZXVlU2l6ZSA9IDA7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVByZWZpeCBcbiAgICAgKi9cbiAgICBzZXRMYW5ndWFnZVByZWZpeChsYW5ndWFnZVByZWZpeCkge1xuICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ID0gbGFuZ3VhZ2VQcmVmaXg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZX0gdGVtcGxhdGUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBzZXQobmFtZSx0ZW1wbGF0ZSx1cmwpe1xuICAgICAgICBpZih1cmwgIT09IHVuZGVmaW5lZCAmJiB1cmwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAuc2V0KG5hbWUsIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50ZW1wbGF0ZU1hcC5zZXQobmFtZSwgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGdldChuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVNYXAuZ2V0KG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGNvbnRhaW5zKG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZU1hcC5jb250YWlucyhuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjYWxsYmFjayBcbiAgICAgKi9cbiAgICBkb25lKGNhbGxiYWNrKXtcbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICB0aGlzLmRvQ2FsbGJhY2sodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZVJlZ2lzdHJ5fSByZWdpc3RyeSBcbiAgICAgKi9cbiAgICBkb0NhbGxiYWNrKHJlZ2lzdHJ5KXtcbiAgICAgICAgaWYodG1vLmNhbGxiYWNrICE9PSBudWxsICYmIHJlZ2lzdHJ5LmNhbGxiYWNrICE9PSB1bmRlZmluZWQgICYmIHJlZ2lzdHJ5LnRlbXBsYXRlUXVldWVTaXplID09PSByZWdpc3RyeS50ZW1wbGF0ZU1hcC5zaXplKCkpe1xuICAgICAgICAgICAgdmFyIHRlbXBDYWxsYmFjayA9IHJlZ2lzdHJ5LmNhbGxiYWNrO1xuICAgICAgICAgICAgcmVnaXN0cnkuY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICAgICAgdGVtcENhbGxiYWNrLmNhbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgbG9hZChuYW1lLCB1cmwpIHtcbiAgICAgICAgaWYodGhpcy5sYW5ndWFnZVByZWZpeCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdXJsLmdldFBhdGhMaXN0KCkuc2V0TGFzdChcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ICsgXCIuXCIgK1xuICAgICAgICAgICAgICAgIHVybC5nZXRQYXRoTGlzdCgpLmdldExhc3QoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRlbXBsYXRlUXVldWVTaXplICsrO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIENsaWVudC5nZXQodXJsKS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5vayl7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgdGVtcGxhdGUgZm9yIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNwb25zZS50ZXh0KCkudGhlbigodGV4dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChuYW1lLG5ldyBUZW1wbGF0ZSh0ZXh0KSx1cmwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvQ2FsbGJhY2sodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcH0gbmFtZVVybE1hcCBcbiAgICAgKi9cbiAgICBnZXRUZW1wbGF0ZXNMb2FkZWRQcm9taXNlKG5hbWVVcmxNYXApIHtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB2YXIgbG9hZGVkID0gMDtcbiAgICAgICAgICAgIGlmKCFuYW1lVXJsTWFwIHx8IG5hbWVVcmxNYXAuc2l6ZSgpID09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmFtZVVybE1hcC5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZih0aGlzLmNvbnRhaW5zKGtleSkpe1xuICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKys7XG4gICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucHJpdmF0ZUxvYWQoa2V5LCBuZXcgVXJsKHZhbHVlKSlcblxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihsb2FkZWQgPT0gbmFtZVVybE1hcC5zaXplKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgocmVhc29uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LHRoaXMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIHByaXZhdGVMb2FkKG5hbWUsIHVybCkge1xuICAgICAgICBpZih0aGlzLmxhbmd1YWdlUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1cmwuZ2V0UGF0aExpc3QoKS5zZXRMYXN0KFxuICAgICAgICAgICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggKyBcIi5cIiArXG4gICAgICAgICAgICAgICAgdXJsLmdldFBhdGhMaXN0KCkuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIExPRy5pbmZvKFwiTG9hZGluZyB0ZW1wbGF0ZSBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybC50b1N0cmluZygpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHNlKSA9PiB7XG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHRlbXBsYXRlIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UudGV4dCgpLnRoZW4oKHRleHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgVGVtcGxhdGUodGV4dCksdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2xzZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBMb2dnZXIsIE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcclxuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJUZW1wbGF0ZVBvc3RDb25maWdcIik7XHJcblxyXG4vKipcclxuICogVG8gYmUgYWRkZWQgdG8gbWluZGkgYXMgYSBzaW5nbGV0b24uIFdpbGwgc2NhbiB0aHJvdWdoIGFsbCBjb25maWd1cmVkIGNsYXNzZXMgdGhhdCBoYXZlIGEgVEVNUExBVEVfVVJMIGFuZCBDT01QT05FTlRfTkFNRVxyXG4gKiBzdGF0aWMgZ2V0dGVyIGFuZCB3aWxsIGFzeW5jcm9ub3VzbHkgbG9hZCB0aGVtLiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIGFsbCB0ZW1wbGF0ZXMgYXJlIGxvYWRlZFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlc0xvYWRlciB7XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1RlbXBsYXRlUmVnaXN0cnl9IHRlbXBsYXRlUmVnaXN0cnkgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHRlbXBsYXRlUmVnaXN0cnkpIHtcclxuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSB0ZW1wbGF0ZVJlZ2lzdHJ5O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge0NvbmZpZ30gY29uZmlnXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgbG9hZChjb25maWcpIHtcclxuICAgICAgICBsZXQgdGVtcGxhdGVNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgY29uZmlnLmNvbmZpZ0VudHJpZXMuZm9yRWFjaCgoa2V5LCBjb25maWdFbnRyeSwgcGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlRFTVBMQVRFX1VSTCAmJiBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSkge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVNYXAuc2V0KGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FLCBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5URU1QTEFURV9VUkwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpOyBcclxuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UodGVtcGxhdGVNYXApO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IExvZ2dlciwgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IENvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xyXG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiU3R5bGVzTG9hZGVyXCIpO1xyXG5cclxuLyoqXHJcbiAqIFRvIGJlIGFkZGVkIHRvIG1pbmRpIGFzIGEgc2luZ2xldG9uLiBXaWxsIHNjYW4gdGhyb3VnaCBhbGwgY29uZmlndXJlZCBjbGFzc2VzIHRoYXQgaGF2ZSBhIFNUWUxFU19VUkwgYW5kIENPTVBPTkVOVF9OQU1FXHJcbiAqIHN0YXRpYyBnZXR0ZXIgYW5kIHdpbGwgYXN5bmNyb25vdXNseSBsb2FkIHRoZW0uIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gYWxsIHN0eWxlcyBhcmUgbG9hZGVkXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU3R5bGVzTG9hZGVyIHtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7U3R5bGVzUmVnaXN0cnl9IHN0eWxlc1JlZ2lzdHJ5IFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihzdHlsZXNSZWdpc3RyeSkge1xyXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBzdHlsZXNSZWdpc3RyeTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtDb25maWd9IGNvbmZpZ1xyXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XHJcbiAgICAgKi9cclxuICAgIGxvYWQoY29uZmlnKSB7XHJcbiAgICAgICAgbGV0IHN0eWxlc01hcCA9IG5ldyBNYXAoKTtcclxuICAgICAgICBjb25maWcuY29uZmlnRW50cmllcy5mb3JFYWNoKChrZXksIGNvbmZpZ0VudHJ5LCBwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuU1RZTEVTX1VSTCAmJiBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSkge1xyXG4gICAgICAgICAgICAgICAgc3R5bGVzTWFwLnNldChjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSwgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuU1RZTEVTX1VSTCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSwgdGhpcyk7IFxyXG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc1JlZ2lzdHJ5LmdldFN0eWxlc0xvYWRlZFByb21pc2Uoc3R5bGVzTWFwKTtcclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgQ29uZmlnLCBJbmplY3Rpb25Qb2ludCB9IGZyb20gXCJtaW5kaV92MVwiO1xyXG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlc0xvYWRlciB9IGZyb20gXCIuLi90ZW1wbGF0ZS90ZW1wbGF0ZXNMb2FkZXIuanNcIjtcclxuaW1wb3J0IHsgU3R5bGVzTG9hZGVyIH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNMb2FkZXIuanNcIjtcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDb21wb25lbnRDb25maWdQcm9jZXNzb3JcIilcclxuXHJcbi8qKlxyXG4gKiBNaW5kaSBjb25maWcgcHJvY2Vzc29yIHdoaWNoIGxvYWRzIGFsbCB0ZW1wbGF0ZXMgYW5kIHN0eWxlcyBmb3IgYWxsIGNvbmZpZ3VyZWQgY29tcG9uZW50c1xyXG4gKiBhbmQgdGhlbiBjYWxscyBhbnkgZXhpc3RpbmcgY29tcG9uZW50TG9hZGVkIGZ1bmN0aW9uIG9uIGVhY2ggY29tcG9uZW50XHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50Q29uZmlnUHJvY2Vzc29yIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHR5cGUge1RlbXBsYXRlUmVnaXN0cnl9XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoVGVtcGxhdGVSZWdpc3RyeSk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEB0eXBlIHtTdHlsZXNSZWdpc3RyeX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnN0eWxlc1JlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoU3R5bGVzUmVnaXN0cnkpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICovXHJcbiAgICBwb3N0Q29uZmlnKCl7XHJcbiAgICAgICAgdGhpcy50ZW1wbGF0ZXNMb2FkZXIgPSBuZXcgVGVtcGxhdGVzTG9hZGVyKHRoaXMudGVtcGxhdGVSZWdpc3RyeSk7XHJcbiAgICAgICAgdGhpcy5zdHlsZXNMb2FkZXIgPSBuZXcgU3R5bGVzTG9hZGVyKHRoaXMuc3R5bGVzUmVnaXN0cnkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge0NvbmZpZ30gY29uZmlnXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgcHJvY2Vzc0NvbmZpZyhjb25maWcpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXHJcbiAgICAgICAgICAgIFsgXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRlbXBsYXRlc0xvYWRlci5sb2FkKGNvbmZpZyksIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdHlsZXNMb2FkZXIubG9hZChjb25maWcpIFxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBMaXN0IH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcclxuXHJcbmV4cG9ydCBjbGFzcyBTaXRlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xyXG4gICAgICAgIHRoaXMudHlwZUNvbmZpZ0xpc3QgPSBuZXcgTGlzdCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBAdHlwZSB7TGlzdH0gKi9cclxuICAgICAgICB0aGlzLndvcmtlcnMgPSBuZXcgTGlzdCgpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge0xpc3R9ICovXHJcbiAgICAgICAgdGhpcy5sb2FkZXJMaXN0ID0gbmV3IExpc3QoKTtcclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmxcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBIaXN0b3J5IHtcclxuXHJcbiAgICBzdGF0aWMgcHVzaFVybCh1cmwsdGl0bGUsc3RhdGVPYmplY3QpIHtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUoc3RhdGVPYmplY3QsIHRpdGxlLCB1cmwudG9TdHJpbmcoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldFVybCgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFVybCh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGxvYWRVcmwodXJsKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gdXJsLnRvU3RyaW5nKCk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxyXG5pbXBvcnQgeyBIaXN0b3J5IH0gZnJvbSBcIi4vbmF2aWdhdGlvbi9oaXN0b3J5LmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiTG9hZGVyXCIpO1xyXG5cclxuZXhwb3J0IGNsYXNzIExvYWRlciB7XHJcblxyXG4gICAgY29uc3RydWN0b3Iocm9vdFBhdGgsIG1vZHVsZVBhdGgpIHtcclxuICAgICAgICB0aGlzLnJvb3RQYXRoID0gcm9vdFBhdGg7XHJcbiAgICAgICAgdGhpcy5tb2R1bGVQYXRoID0gbW9kdWxlUGF0aDtcclxuICAgIH1cclxuXHJcbiAgICBtYXRjaGVzKCl7IFxyXG4gICAgICAgIGlmIChudWxsID09IHRoaXMucm9vdFBhdGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHVybCA9IEhpc3RvcnkuZ2V0VXJsKCk7XHJcbiAgICAgICAgcmV0dXJuIHVybC5nZXRQYXRoTGlzdCgpLnNpemUoKSA+IDAgJiYgXCIvXCIgKyAgdXJsLmdldFBhdGgoMCkgPT09IHRoaXMucm9vdFBhdGg7XHJcbiAgICB9XHJcblxyXG4gICAgbG9hZE1vZHVsZSgpIHtcclxuICAgICAgICByZXR1cm4gaW1wb3J0KHRoaXMubW9kdWxlUGF0aCk7XHJcbiAgICB9XHJcblxyXG59IiwiZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXR0cmlidXRlKSB7XHJcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGUgPSBhdHRyaWJ1dGU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IHZhbHVlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS52YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbmFtZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGUubmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbmFtZXNwYWNlKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS5uYW1lO1xyXG4gICAgfVxyXG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTWFwLCBMb2dnZXIsIExpc3QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEF0dHJpYnV0ZSB9IGZyb20gXCIuL2F0dHJpYnV0ZS5qc1wiO1xuaW1wb3J0IHsgQ29udGFpbmVyQnJpZGdlIH0gZnJvbSBcIi4uL2JyaWRnZS9jb250YWluZXJCcmlkZ2UuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkJhc2VFbGVtZW50XCIpO1xuXG4vKipcbiAqIEEgYmFzZSBjbGFzcyBmb3IgZW5jbG9zaW5nIGFuIEhUTUxFbGVtZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fHN0cmluZ3xIVE1MRWxlbWVudH0gdmFsdWVcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIFxuICAgICAgICAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG51bGw7XG4gICAgICAgIHRoaXMuZXZlbnRzQXR0YWNoZWQgPSBuZXcgTGlzdCgpO1xuICAgICAgICBcbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBYbWxFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLmNyZWF0ZUZyb21YbWxFbGVtZW50KHZhbHVlLCBwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuY3JlYXRlRWxlbWVudCh2YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCl7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBMT0cuZXJyb3IoXCJVbnJlY29nbml6ZWQgdmFsdWUgZm9yIEVsZW1lbnRcIik7XG4gICAgICAgIExPRy5lcnJvcih2YWx1ZSk7XG4gICAgfVxuXG4gICAgbG9hZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIGlmKHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzID09PSBudWxsIHx8IHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHRoaXMuYXR0cmlidXRlTWFwID09PSBudWxsIHx8IHRoaXMuYXR0cmlidXRlTWFwID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmVsZW1lbnQuYXR0cmlidXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwLnNldCh0aGlzLmVsZW1lbnQuYXR0cmlidXRlc1tpXS5uYW1lLG5ldyBBdHRyaWJ1dGUodGhpcy5lbGVtZW50LmF0dHJpYnV0ZXNbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBicm93c2VyIEVsZW1lbnQgZnJvbSB0aGUgWG1sRWxlbWVudFxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB4bWxFbGVtZW50XG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50RWxlbWVudFxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIGNyZWF0ZUZyb21YbWxFbGVtZW50KHhtbEVsZW1lbnQsIHBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBudWxsO1xuICAgICAgICBpZih4bWxFbGVtZW50Lm5hbWVzcGFjZSl7XG4gICAgICAgICAgICBlbGVtZW50ID0gQ29udGFpbmVyQnJpZGdlLmNyZWF0ZUVsZW1lbnROUyh4bWxFbGVtZW50Lm5hbWVzcGFjZVVyaSx4bWxFbGVtZW50LmZ1bGxOYW1lKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlbGVtZW50ID0gQ29udGFpbmVyQnJpZGdlLmNyZWF0ZUVsZW1lbnQoeG1sRWxlbWVudC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZihwYXJlbnRFbGVtZW50ICYmIHBhcmVudEVsZW1lbnQubWFwcGVkRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHhtbEVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uKGF0dHJpYnV0ZUtleSxhdHRyaWJ1dGUpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlS2V5LGF0dHJpYnV0ZS52YWx1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBhIGZ1bmN0aW9uIHRvIGFuIGV2ZW50IGluIHRoZSBlbmNsb3NlZCBlbGVtZW50IGlmIG5vbmUgYWxscmVhZHkgZXhpc3RzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gZnVuY3Rpb25QYXJhbVxuICAgICAqL1xuICAgIGF0dGFjaEV2ZW50KGV2ZW50VHlwZSwgZnVuY3Rpb25QYXJhbSkge1xuICAgICAgICBpZighdGhpcy5ldmVudHNBdHRhY2hlZC5jb250YWlucyhldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBpZihldmVudFR5cGUuc3RhcnRzV2l0aChcIm9uXCIpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRUeXBlID0gZXZlbnRUeXBlLnN1YnN0cigyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgZnVuY3Rpb25QYXJhbSk7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c0F0dGFjaGVkLmFkZChldmVudFR5cGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTE9HLndhcm4oXCJFdmVudCAnXCIgKyBldmVudFR5cGUgKyBcIicgYWxscmVhZHkgYXR0YWNoZWQgZm9yIFwiICsgdGhpcy5lbGVtZW50Lm5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBlbmNsb3NlZCBlbGVtZW50XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXQgZnVsbE5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudGFnTmFtZTtcbiAgICB9XG5cbiAgICBnZXQgdG9wKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcbiAgICB9XG5cbiAgICBnZXQgYm90dG9tKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmJvdHRvbTtcbiAgICB9XG5cbiAgICBnZXQgbGVmdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xuICAgIH1cblxuICAgIGdldCByaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5yaWdodDtcbiAgICB9XG5cbiAgICBnZXQgd2lkdGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgZ2V0IGF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHRoaXMubG9hZEF0dHJpYnV0ZXMoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlTWFwO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZVZhbHVlKGtleSx2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSx2YWx1ZSk7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlVmFsdWUoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0QXR0cmlidXRlKGtleSk7XG4gICAgfVxuXG4gICAgY29udGFpbnNBdHRyaWJ1dGUoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaGFzQXR0cmlidXRlKGtleSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlQXR0cmlidXRlKGtleSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgfVxuXG4gICAgc2V0U3R5bGUoa2V5LHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVtrZXldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0U3R5bGUoa2V5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc3R5bGVba2V5XTtcbiAgICB9XG5cbiAgICByZW1vdmVTdHlsZShrZXkpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlW2tleV0gPSBudWxsO1xuICAgIH1cblxuICAgIHNldChpbnB1dCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSA9PT0gbnVsbCl7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVGhlIGVsZW1lbnQgaGFzIG5vIHBhcmVudCwgY2FuIG5vdCBzd2FwIGl0IGZvciB2YWx1ZVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dC5tYXBwZWRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQubWFwcGVkRWxlbWVudCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiBpbnB1dCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoQ29udGFpbmVyQnJpZGdlLmNyZWF0ZVRleHROb2RlKGlucHV0KSwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzTW91bnRlZCgpIHtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZW1vdmUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldENoaWxkKGlucHV0KSB7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChpbnB1dCk7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dC5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgJiYgaW5wdXQucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChDb250YWluZXJCcmlkZ2UuY3JlYXRlVGV4dE5vZGUoaW5wdXQpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkQ2hpbGQoaW5wdXQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSB1bmRlZmluZWQgJiYgaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dC5tYXBwZWRFbGVtZW50LHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgJiYgaW5wdXQucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKENvbnRhaW5lckJyaWRnZS5jcmVhdGVUZXh0Tm9kZShpbnB1dCksdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJBYnN0cmFjdElucHV0RWxlbWVudFwiKTtcblxuLyoqXG4gKiBTaGFyZWQgcHJvcGVydGllcyBvZiBpbnB1dCBlbGVtZW50c1xuICovXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RJbnB1dEVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHZhbHVlXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50XG4gICAgICovXG4gICAgY29uc3RydWN0b3IodmFsdWUsIHBhcmVudCkge1xuICAgICAgICBzdXBlcih2YWx1ZSwgcGFyZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHZhbHVlIG9mIHRoZSBpbnB1dHMgbmFtZVxuICAgICAqXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm5hbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSB2YWx1ZSBvZiBpbnB1dHMgbmFtZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgc2V0IG5hbWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBnaXZlbiBhbnkgcHJvY2Vzc2luZyBydWxlc1xuICAgICAqL1xuICAgIGdldCB2YWx1ZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5iYWNraW5nVmFsdWU7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBJbnB1dEV2ZW50KCdjaGFuZ2UnKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc291cmNlIHZhbHVlXG4gICAgICovXG4gICAgZ2V0IGJhY2tpbmdWYWx1ZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlO1xuICAgIH1cblxuICAgIGZvY3VzKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBzZWxlY3RBbGwoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZWxlY3QoKTtcbiAgICB9XG5cbiAgICBlbmFibGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGRpc2FibGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5kaXNhYmxlZCA9IHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgUmFkaW9JbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHNldCBjaGVja2VkKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpc0NoZWNrZWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jaGVja2VkO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDaGVja2VkKCk7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBcInRydWVcIik7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2hlY2tib3hJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHNldCBjaGVja2VkKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpc0NoZWNrZWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5jaGVja2VkO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDaGVja2VkKCk7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBcInRydWVcIik7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0SW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dGFyZWFJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIGdldCBpbm5lckhUTUwoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgc2V0IGlubmVySFRNTCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChpbnB1dCkge1xuICAgICAgICBzdXBlci5hZGRDaGlsZChpbnB1dCk7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgc3VwZXIucHJlcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuaW5uZXJIVE1MO1xuICAgIH1cblxufSIsImltcG9ydCB7IFhtbENkYXRhIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQ29udGFpbmVyQnJpZGdlIH0gZnJvbSBcIi4uL2JyaWRnZS9jb250YWluZXJCcmlkZ2UuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHRub2RlRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxDZGF0YX0gdmFsdWUgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBYbWxDZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gdGhpcy5jcmVhdGVGcm9tWG1sQ2RhdGEodmFsdWUsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IENvbnRhaW5lckJyaWRnZS5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1htbENkYXRhfSBjZGF0YUVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50RWxlbWVudCBcbiAgICAgKi9cbiAgICBjcmVhdGVGcm9tWG1sQ2RhdGEoY2RhdGFFbGVtZW50LCBwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY2RhdGFFbGVtZW50LnZhbHVlKTtcbiAgICAgICAgaWYocGFyZW50RWxlbWVudCAhPT0gbnVsbCAmJiBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHBhcmVudEVsZW1lbnQubWFwcGVkRWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIGdldCBtYXBwZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgU2ltcGxlRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgZ2V0IGlubmVySFRNTCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBzZXQgaW5uZXJIVE1MKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcclxuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEZvcm1FbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3RvclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XHJcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGlucHV0cyBuYW1lXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXQgbmFtZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm5hbWU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGlucHV0cyBuYW1lXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXHJcbiAgICAgKi9cclxuICAgIHNldCBuYW1lKHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB2YWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBzdWJtaXQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5zdWJtaXQoKTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFZpZGVvRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnN0cnVjdG9yXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB2YWx1ZSBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XHJcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHBsYXkoKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50LnBsYXkoKTtcclxuICAgIH1cclxuXHJcbiAgICBtdXRlKCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5tdXRlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdW5tdXRlKCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5tdXRlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sQ2RhdGEsWG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtSYWRpb0lucHV0RWxlbWVudH0gZnJvbSBcIi4vcmFkaW9JbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7Q2hlY2tib3hJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2NoZWNrYm94SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RleHRJbnB1dEVsZW1lbnR9IGZyb20gXCIuL3RleHRJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7VGV4dGFyZWFJbnB1dEVsZW1lbnR9IGZyb20gXCIuL3RleHRhcmVhSW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RleHRub2RlRWxlbWVudH0gZnJvbSBcIi4vdGV4dG5vZGVFbGVtZW50LmpzXCI7XG5pbXBvcnQge1NpbXBsZUVsZW1lbnR9IGZyb20gXCIuL3NpbXBsZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEZvcm1FbGVtZW50IH0gZnJvbSBcIi4vZm9ybUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFZpZGVvRWxlbWVudCB9IGZyb20gXCIuL3ZpZGVvRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudE1hcHBlciB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7YW55fSBpbnB1dCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgc3RhdGljIG1hcChpbnB1dCwgcGFyZW50KSB7XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1JhZGlvKGlucHV0KSl7IHJldHVybiBuZXcgUmFkaW9JbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvQ2hlY2tib3goaW5wdXQpKXsgcmV0dXJuIG5ldyBDaGVja2JveElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9TdWJtaXQoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb0Zvcm0oaW5wdXQpKXsgcmV0dXJuIG5ldyBGb3JtRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0YXJlYShpbnB1dCkpeyByZXR1cm4gbmV3IFRleHRhcmVhSW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHQoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1ZpZGVvKGlucHV0KSl7IHJldHVybiBuZXcgVmlkZW9FbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHRub2RlKGlucHV0KSl7IHJldHVybiBuZXcgVGV4dG5vZGVFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1NpbXBsZShpbnB1dCkpeyByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgY29uc29sZS5sb2coXCJNYXBwaW5nIHRvIHNpbXBsZSBieSBkZWZhdWx0IFwiICsgaW5wdXQpO1xuICAgICAgICByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1JhZGlvKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJyYWRpb1wiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInJhZGlvXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9DaGVja2JveChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwiY2hlY2tib3hcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJjaGVja2JveFwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvU3VibWl0KGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJzdWJtaXRcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJzdWJtaXRcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb0Zvcm0oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImZvcm1cIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1RleHQoaW5wdXQpe1xuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJ0ZXh0XCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInBhc3N3b3JkXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcImVtYWlsXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcImRhdGVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwidGltZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIikge1xuICAgICAgICAgICAgaWYoIWlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwidGV4dFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInBhc3N3b3JkXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiZW1haWxcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJkYXRlXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwidGltZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0bm9kZShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBOb2RlICYmIGlucHV0Lm5vZGVUeXBlID09PSBcIlRFWFRfTk9ERVwiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sQ2RhdGEpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9WaWRlbyhpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MVmlkZW9FbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcInZpZGVvXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0YXJlYShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcInRleHRhcmVhXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9TaW1wbGUoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50KTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IEVsZW1lbnRNYXBwZXIgfSBmcm9tIFwiLi4vZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudHtcblxuICAgIGNvbnN0cnVjdG9yKGV2ZW50KXtcbiAgICAgICAgdGhpcy5ldmVudCA9IGV2ZW50O1xuICAgICAgICBpZih0aGlzLmV2ZW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSBcImRyYWdzdGFydFwiKXtcbiAgICAgICAgICAgIHRoaXMuZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoJ3RleHQvcGxhaW4nLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3BQcm9wYWdhdGlvbigpe1xuICAgICAgICB0aGlzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHByZXZlbnREZWZhdWx0KCl7XG4gICAgICAgIHRoaXMuZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgZXZlbnQgYW5kIHRoZSBlZGdlIHggY29vcmRpbmF0ZSBvZiB0aGUgY29udGFpbmluZyBvYmplY3RcbiAgICAgKi9cbiAgICBnZXRPZmZzZXRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Lm9mZnNldFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGV2ZW50IGFuZCB0aGUgZWRnZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNvbnRhaW5pbmcgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0T2Zmc2V0WSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5vZmZzZXRZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtb3VzZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGV2ZW50IHJlbGF0aXZlIHRvIHRoZSBjbGllbnQgd2luZG93IHZpZXdcbiAgICAgKi9cbiAgICBnZXRDbGllbnRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmNsaWVudFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1vdXNlIHkgY29vcmRpbmF0ZSBvZiB0aGUgZXZlbnQgcmVsYXRpdmUgdG8gdGhlIGNsaWVudCB3aW5kb3cgdmlld1xuICAgICAqL1xuICAgIGdldENsaWVudFkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQuY2xpZW50WTtcbiAgICB9XG5cbiAgICBnZXRUYXJnZXQoKXtcbiAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHRoaXMuZXZlbnQudGFyZ2V0KTtcbiAgICB9XG5cbiAgICBnZXRLZXlDb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5rZXlDb2RlO1xuICAgIH1cblxuICAgIGlzS2V5Q29kZShjb2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmtleUNvZGUgPT09IGNvZGU7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IE1hcCwgT2JqZWN0RnVuY3Rpb24sIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi9ldmVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRXZlbnRSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIEV2ZW50UmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmJlZm9yZUxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5hZnRlckxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb25uZWN0cyBlbGVtZW50cyB3aXRoIHRoZSBldmVudCByZWdpc3RyeSBzbyB0aGF0IGV2ZW50cyB0cmlnZ2VyZWQgb24gdGhlIGVsZW1lbnQgZ2V0cyBkaXN0cmlidXRlZCB0byBhbGwgbGlzdGVuZXJzXG4gICAgICogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudCB0aGUgZWxlbWVudCB3aGljaCBpcyB0aGUgc291cmNlIG9mIHRoZSBldmVudCBhbmQgd2hpY2ggY2FuIGJlIGF0dGFjaGVkIHRvXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSB0aGUgZXZlbnQgdHlwZSBhcyBpdCBpcyBkZWZpbmVkIGJ5IHRoZSBjb250YWluaW5nIHRyaWdnZXIgKGV4YW1wbGUgXCJvbmNsaWNrXCIpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSB0aGUgZXZlbnQgbmFtZSBhcyBpdCB3aWxsIGJlIHJlZmVycmVkIHRvIGluIHRoZSBFdmVudFJlZ2lzdHJ5IChleGFtcGxlIFwiLy9ldmVudDpjbGlja2VkXCIpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbXBvbmVudEluZGV4IHVuaXF1ZSBpZCBvZiB0aGUgY29tcG9uZW50IHdoaWNoIG93bnMgdGhlIGVsZW1lbnRcbiAgICAgKi9cbiAgICBhdHRhY2goZWxlbWVudCwgZXZlbnRUeXBlLCBldmVudE5hbWUsIGNvbXBvbmVudEluZGV4KSB7XG4gICAgICAgIGNvbnN0IHVuaXF1ZUV2ZW50TmFtZSA9IGV2ZW50TmFtZSArIFwiX1wiICsgY29tcG9uZW50SW5kZXg7XG4gICAgICAgIGNvbnN0IHRoZUV2ZW50UmVnaXN0cnkgPSB0aGlzO1xuICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHsgdGhlRXZlbnRSZWdpc3RyeS50cmlnZ2VyKHVuaXF1ZUV2ZW50TmFtZSwgZXZlbnROYW1lLCBldmVudCk7IH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgdGhlIGV2ZW50IG5hbWUgYXMgaXQgd2lsbCBiZSByZWZlcnJlZCB0byBpbiB0aGUgRXZlbnRSZWdpc3RyeSAoZXhhbXBsZSBcIi8vZXZlbnQ6Y2xpY2tlZFwiKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGxpc3RlbmVyIHRoZSBvYmplY3Qgd2hpY2ggb3ducyB0aGUgaGFuZGxlciBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1bmlxdWVJbmRleCBhIHVuaXF1ZSBpbmRleCBmb3IgdGhlIGV2ZW50XG4gICAgICovXG4gICAgbGlzdGVuKGV2ZW50TmFtZSwgbGlzdGVuZXIsIHVuaXF1ZUluZGV4KSB7XG4gICAgICAgIGNvbnN0IHVuaXF1ZUV2ZW50TmFtZSA9IGV2ZW50TmFtZSArIFwiX1wiICsgdW5pcXVlSW5kZXg7XG4gICAgICAgIHRoaXMuaW5pdE1hcCh0aGlzLmxpc3RlbmVycywgdW5pcXVlRXZlbnROYW1lKTtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIGNvbnN0IGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lcnMuZ2V0KHVuaXF1ZUV2ZW50TmFtZSk7XG4gICAgICAgIGxpc3RlbmVyTWFwLnNldChsaXN0ZW5lci5nZXRPYmplY3QoKS5jb25zdHJ1Y3Rvci5uYW1lLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSB0aGUgZXZlbnQgbmFtZSBhcyBpdCB3aWxsIGJlIHJlZmVycmVkIHRvIGluIHRoZSBFdmVudFJlZ2lzdHJ5IChleGFtcGxlIFwiLy9ldmVudDpjbGlja2VkXCIpXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gbGlzdGVuZXIgdGhlIG9iamVjdCB3aGljaCBvd25zIHRoZSBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICovXG4gICAgbGlzdGVuQmVmb3JlKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5pbml0TWFwKHRoaXMuYmVmb3JlTGlzdGVuZXJzLCBldmVudE5hbWUpO1xuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgY29uc3QgbGlzdGVuZXJNYXAgPSB0aGlzLmJlZm9yZUxpc3RlbmVycy5nZXQoZXZlbnROYW1lKTtcbiAgICAgICAgbGlzdGVuZXJNYXAuc2V0KGxpc3RlbmVyLmdldE9iamVjdCgpLmNvbnN0cnVjdG9yLm5hbWUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIHRoZSBldmVudCBuYW1lIGFzIGl0IHdpbGwgYmUgcmVmZXJyZWQgdG8gaW4gdGhlIEV2ZW50UmVnaXN0cnkgKGV4YW1wbGUgXCIvL2V2ZW50OmNsaWNrZWRcIilcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBsaXN0ZW5lciB0aGUgb2JqZWN0IHdoaWNoIG93bnMgdGhlIGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBsaXN0ZW5BZnRlcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuaW5pdE1hcCh0aGlzLmFmdGVyTGlzdGVuZXJzLCBldmVudE5hbWUpO1xuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgY29uc3QgbGlzdGVuZXJNYXAgPSB0aGlzLmFmdGVyTGlzdGVuZXJzLmdldChldmVudE5hbWUpO1xuICAgICAgICBsaXN0ZW5lck1hcC5zZXQobGlzdGVuZXIuZ2V0T2JqZWN0KCkuY29uc3RydWN0b3IubmFtZSwgbGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBtYXAgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBcbiAgICAgKi9cbiAgICBpbml0TWFwKG1hcCwga2V5KSB7XG4gICAgICAgIGlmICghbWFwLmV4aXN0cyhrZXkpKSB7XG4gICAgICAgICAgICBtYXAuc2V0KGtleSxuZXcgTWFwKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJpZ2dlcihzdWZmaXhlZEV2ZW50TmFtZSwgZXZlbnROYW1lLCBldmVudCkge1xuICAgICAgICB0aGlzLmhhbmRsZUJlZm9yZShldmVudE5hbWUsIGV2ZW50KTtcbiAgICAgICAgaWYgKHRoaXMubGlzdGVuZXJzLmV4aXN0cyhzdWZmaXhlZEV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChzdWZmaXhlZEV2ZW50TmFtZSkuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWUuY2FsbChuZXcgRXZlbnQoZXZlbnQpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGFuZGxlQWZ0ZXIoZXZlbnROYW1lLCBldmVudCk7XG4gICAgfVxuXG4gICAgaGFuZGxlQmVmb3JlKGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVHbG9iYWwodGhpcy5iZWZvcmVMaXN0ZW5lcnMsIGV2ZW50TmFtZSwgZXZlbnQpO1xuICAgIH1cblxuICAgIGhhbmRsZUFmdGVyKGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVHbG9iYWwodGhpcy5hZnRlckxpc3RlbmVycywgZXZlbnROYW1lLCBldmVudCk7XG4gICAgfVxuXG4gICAgaGFuZGxlR2xvYmFsKGxpc3RlbmVycywgZXZlbnROYW1lLCBldmVudCkge1xuICAgICAgICBpZihsaXN0ZW5lcnMuZXhpc3RzKGV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy5nZXQoZXZlbnROYW1lKS5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICB2YWx1ZS5jYWxsKG5ldyBFdmVudChldmVudCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBVbmlxdWVJZFJlZ2lzdHJ5IHtcclxuXHJcbiAgICBpZEF0dHJpYnV0ZVdpdGhTdWZmaXggKGlkKSB7XHJcbiAgICAgICAgaWYoaWROYW1lcy5jb250YWlucyhpZCkpIHtcclxuICAgICAgICAgICAgdmFyIG51bWJlciA9IGlkTmFtZXMuZ2V0KGlkKTtcclxuICAgICAgICAgICAgaWROYW1lcy5zZXQoaWQsbnVtYmVyKzEpO1xyXG4gICAgICAgICAgICByZXR1cm4gaWQgKyBcIi1cIiArIG51bWJlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWROYW1lcy5zZXQoaWQsMSk7XHJcbiAgICAgICAgcmV0dXJuIGlkO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxudmFyIGlkTmFtZXMgPSBuZXcgTWFwKCk7IiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnRcIjtcclxuXHJcbi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wb25lbnQge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY29tcG9uZW50SW5kZXggXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSByb290RWxlbWVudCBcclxuICAgICAqIEBwYXJhbSB7TWFwfSBlbGVtZW50TWFwIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcihjb21wb25lbnRJbmRleCwgcm9vdEVsZW1lbnQsIGVsZW1lbnRNYXApIHtcclxuICAgICAgICB0aGlzLmNvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kZXg7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwID0gZWxlbWVudE1hcDtcclxuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlKCkge1xyXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGdldChpZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgKGlkLCB2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLnNldCh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJDaGlsZHJlbihpZCl7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuY2xlYXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRDaGlsZCAoaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuc2V0Q2hpbGQodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZENoaWxkIChpZCwgdmFsdWUpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5hZGRDaGlsZCh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJlcGVuZENoaWxkIChpZCwgdmFsdWUpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5wcmVwZW5kQ2hpbGQodmFsdWUpO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBNYXAsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xyXG5pbXBvcnQgeyBFbGVtZW50TWFwcGVyIH0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlclwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcbmltcG9ydCB7IEV2ZW50UmVnaXN0cnkgfSBmcm9tIFwiLi4vZXZlbnQvZXZlbnRSZWdpc3RyeVwiO1xyXG5cclxuLyoqXHJcbiAqIENvbGxlY3RzIGluZm9ybWF0aW9uIHdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgYW5kIGZpbmRzIHRoZSByb290IGVsZW1lbnQsIGNyZWF0ZXMgbWFwIG9mIGVsZW1lbnRzIFxyXG4gKiBhbmQgcmVnaXN0ZXJzIGV2ZW50cyBpbiB0aGUgZXZlbnRSZWdpc3RyeVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEVsZW1lbnRSZWdpc3RyYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZXZlbnRSZWdpc3RyeSwgdW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50SW5kZXgpIHtcclxuICAgICAgICB0aGlzLmNvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kZXg7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xyXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IHVuaXF1ZUlkUmVnaXN0cnk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7RXZlbnRSZWdpc3RyeX0gKi9cclxuICAgICAgICB0aGlzLmV2ZW50UmVnaXN0cnkgPSBldmVudFJlZ2lzdHJ5O1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xyXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RWxlbWVudE1hcCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGlzdGVucyB0byBlbGVtZW50cyBiZWluZyBjcmVhdGVkLCBhbmQgdGFrZXMgaW5uIHRoZSBjcmVhdGVkIFhtbEVsZW1lbnQgYW5kIGl0cyBwYXJlbnQgWG1sRWxlbWVudFxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHhtbEVsZW1lbnQgXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRXcmFwcGVyIFxyXG4gICAgICovXHJcbiAgICBlbGVtZW50Q3JlYXRlZCAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcikge1xyXG4gICAgICAgIHZhciBlbGVtZW50ID0gRWxlbWVudE1hcHBlci5tYXAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcik7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkVG9FbGVtZW50SWRNYXAoZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy5yZWdpc3RlckVsZW1lbnRFdmVudHMoZWxlbWVudCk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMucm9vdEVsZW1lbnQgPT09IG51bGwgJiYgZWxlbWVudCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gZWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHJlZ2lzdGVyRWxlbWVudEV2ZW50cyhlbGVtZW50KXtcclxuICAgICAgICBpZihlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlRWxlbWVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZXZlbnRSZWdpc3RyeSA9IHRoaXMuZXZlbnRSZWdpc3RyeTtcclxuICAgICAgICB2YXIgY29tcG9uZW50SW5kZXggPSB0aGlzLmNvbXBvbmVudEluZGV4O1xyXG4gICAgICAgIGVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChhdHRyaWJ1dGVLZXksYXR0cmlidXRlLHBhcmVudCl7XHJcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZSAhPT0gbnVsbCAmJiBhdHRyaWJ1dGUgIT09IHVuZGVmaW5lZCAmJiBhdHRyaWJ1dGUudmFsdWUuc3RhcnRzV2l0aChcIi8vZXZlbnQ6XCIpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnROYW1lID0gYXR0cmlidXRlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50VHlwZSA9IGF0dHJpYnV0ZS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgZXZlbnRSZWdpc3RyeS5hdHRhY2goZWxlbWVudCxldmVudFR5cGUsZXZlbnROYW1lLGNvbXBvbmVudEluZGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgICAgICAgICBcclxuICAgICAgICB9LHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRvRWxlbWVudElkTWFwKGVsZW1lbnQpIHtcclxuICAgICAgICBpZihlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlRWxlbWVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaWQgPSBudWxsO1xyXG4gICAgICAgIGlmKGVsZW1lbnQuY29udGFpbnNBdHRyaWJ1dGUoXCJpZFwiKSkge1xyXG4gICAgICAgICAgICBpZCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiKTtcclxuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIsdGhpcy51bmlxdWVJZFJlZ2lzdHJ5LmlkQXR0cmlidXRlV2l0aFN1ZmZpeChpZCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoaWQgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50TWFwLnNldChpZCxlbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBDb250YWluZXJCcmlkZ2UgfSBmcm9tIFwiLi4vYnJpZGdlL2NvbnRhaW5lckJyaWRnZVwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2FudmFzUm9vdCB7XHJcblxyXG4gICAgc3RhdGljIHJlcGxhY2VDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xyXG4gICAgICAgIHZhciBib2R5RWxlbWVudCA9IENvbnRhaW5lckJyaWRnZS5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICAgICAgYm9keUVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIGJvZHlFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgc2V0Q29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICB2YXIgYm9keUVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBib2R5RWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFkZENoaWxkQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICB2YXIgYm9keUVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYWRkQ2hpbGRFbGVtZW50KGlkLCBlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIGJvZHlFbGVtZW50ID0gQ29udGFpbmVyQnJpZGdlLmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgICAgICBib2R5RWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVFbGVtZW50KGlkKSB7XHJcbiAgICAgICAgQ29udGFpbmVyQnJpZGdlLnJlbW92ZUVsZW1lbnQoaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFkZEhlYWRlckVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5hZGRIZWFkZXJFbGVtZW50KGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFxyXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYWRkQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5hZGRCb2R5RWxlbWVudChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHByZXBlbmRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcclxuICAgICAgICBDb250YWluZXJCcmlkZ2UucHJlcGVuZEhlYWRlckVsZW1lbnQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5wcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxufSIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0VsZW1lbnRNYXBwZXJ9IGZyb20gXCIuLi9lbGVtZW50L2VsZW1lbnRNYXBwZXIuanNcIjtcblxuZXhwb3J0IGNsYXNzIEhUTUx7XG5cbiAgICBzdGF0aWMgY3VzdG9tKGVsZW1lbnROYW1lKXtcbiAgICAgICAgdmFyIHhtbEVsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChlbGVtZW50TmFtZSk7XG4gICAgICAgIHJldHVybiBFbGVtZW50TWFwcGVyLm1hcCh4bWxFbGVtZW50KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYXBwbHlTdHlsZXMoZWxlbWVudCxjbGFzc1ZhbHVlLHN0eWxlVmFsdWUpe1xuICAgICAgICBpZihjbGFzc1ZhbHVlICE9PSBudWxsKXtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJjbGFzc1wiLGNsYXNzVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHN0eWxlVmFsdWUgIT09IG51bGwpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcInN0eWxlXCIsc3R5bGVWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYShuYW1lLGhyZWYsY2xhc3NWYWx1ZSxzdHlsZVZhbHVlKXtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIVE1MLmN1c3RvbShcImFcIik7XG4gICAgICAgIGVsZW1lbnQuYWRkQ2hpbGQobmFtZSk7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJocmVmXCIsaHJlZik7XG4gICAgICAgIEhUTUwuYXBwbHlTdHlsZXMoZWxlbWVudCxjbGFzc1ZhbHVlLHN0eWxlVmFsdWUpO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAsIExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDYW52YXNSb290IH0gZnJvbSBcIi4vY2FudmFzUm9vdFwiO1xyXG5pbXBvcnQgeyBIVE1MIH0gZnJvbSBcIi4uL2h0bWwvaHRtbFwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcbmltcG9ydCB7IFRleHRub2RlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L3RleHRub2RlRWxlbWVudFwiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNhbnZhc1N0eWxlc1wiKTtcclxuXHJcbmNvbnN0IHN0eWxlcyA9IG5ldyBNYXAoKTtcclxuY29uc3Qgc3R5bGVPd25lcnMgPSBuZXcgTWFwKCk7XHJcbmNvbnN0IGVuYWJsZWRTdHlsZXMgPSBuZXcgTGlzdCgpO1xyXG5cclxuZXhwb3J0IGNsYXNzIENhbnZhc1N0eWxlcyB7XHJcblxyXG4gICAgc3RhdGljIHNldFN0eWxlKG5hbWUsIHNvdXJjZSkge1xyXG4gICAgICAgIGlmKHN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBzdHlsZXMuZ2V0KG5hbWUpLnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cclxuICAgICAgICAgICAgbGV0IHN0eWxlRWxlbWVudCA9IEhUTUwuY3VzdG9tKFwic3R5bGVcIik7XHJcbiAgICAgICAgICAgIHN0eWxlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIsbmFtZSk7XHJcbiAgICAgICAgICAgIHN0eWxlRWxlbWVudC5zZXRDaGlsZChuZXcgVGV4dG5vZGVFbGVtZW50KHNvdXJjZS5nZXRTdHlsZXNTb3VyY2UoKSkpO1xyXG4gICAgICAgICAgICBzdHlsZXMuc2V0KG5hbWUsIHN0eWxlRWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVTdHlsZShuYW1lKSB7XHJcbiAgICAgICAgaWYoZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLnJlbW92ZShuYW1lKTtcclxuICAgICAgICAgICAgQ2FudmFzUm9vdC5yZW1vdmVFbGVtZW50KG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgc3R5bGVzLnJlbW92ZShuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGRpc2FibGVTdHlsZShuYW1lLCBvd25lcklkID0gMCkge1xyXG4gICAgICAgIENhbnZhc1N0eWxlcy5yZW1vdmVTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xyXG4gICAgICAgIGlmKENhbnZhc1N0eWxlcy5oYXNTdHlsZU93bmVyKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIXN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJTdHlsZSBkb2VzIG5vdCBleGlzdDogXCIgKyBuYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMucmVtb3ZlKG5hbWUpO1xyXG4gICAgICAgICAgICBDYW52YXNSb290LnJlbW92ZUVsZW1lbnQobmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBlbmFibGVTdHlsZShuYW1lLCBvd25lcklkID0gMCkge1xyXG4gICAgICAgIENhbnZhc1N0eWxlcy5hZGRTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xyXG4gICAgICAgIGlmKCFzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgTE9HLmVycm9yKFwiU3R5bGUgZG9lcyBub3QgZXhpc3Q6IFwiICsgbmFtZSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIWVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5hZGQobmFtZSk7XHJcbiAgICAgICAgICAgIENhbnZhc1Jvb3QuYWRkSGVhZGVyRWxlbWVudChzdHlsZXMuZ2V0KG5hbWUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFkZFN0eWxlT3duZXIobmFtZSwgb3duZXJJZCkge1xyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBzdHlsZU93bmVycy5zZXQobmFtZSwgbmV3IExpc3QoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5nZXQobmFtZSkuY29udGFpbnMob3duZXJJZCkpIHtcclxuICAgICAgICAgICAgc3R5bGVPd25lcnMuZ2V0KG5hbWUpLmFkZChvd25lcklkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZVN0eWxlT3duZXIobmFtZSwgb3duZXJJZCkge1xyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5yZW1vdmUob3duZXJJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGhhc1N0eWxlT3duZXIobmFtZSkge1xyXG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzdHlsZU93bmVycy5nZXQobmFtZSkuc2l6ZSgpID4gMDtcclxuICAgIH1cclxufSIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuL2NvbXBvbmVudFwiO1xyXG5pbXBvcnQgeyBVbmlxdWVJZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vdW5pcXVlSWRSZWdpc3RyeVwiO1xyXG5pbXBvcnQgeyBFbGVtZW50UmVnaXN0cmF0b3IgfSBmcm9tIFwiLi9lbGVtZW50UmVnaXN0cmF0b3JcIjtcclxuaW1wb3J0IHsgRXZlbnRSZWdpc3RyeSB9IGZyb20gXCIuLi9ldmVudC9ldmVudFJlZ2lzdHJ5XCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeVwiO1xyXG5pbXBvcnQgeyBEb21UcmVlIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xyXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5XCI7XHJcbmltcG9ydCB7IENhbnZhc1N0eWxlcyB9IGZyb20gXCIuLi9jYW52YXMvY2FudmFzU3R5bGVzXCI7XHJcbmltcG9ydCB7IEluamVjdGlvblBvaW50IH0gZnJvbSBcIm1pbmRpX3YxXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29tcG9uZW50RmFjdG9yeVwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtFdmVudFJlZ2lzdHJ5fSAqL1xyXG4gICAgICAgIHRoaXMuZXZlbnRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKEV2ZW50UmVnaXN0cnkpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0eWxlc1JlZ2lzdHJ5fSAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX0gKi9cclxuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShUZW1wbGF0ZVJlZ2lzdHJ5KTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtVbmlxdWVJZFJlZ2lzdHJ5fSAqL1xyXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFVuaXF1ZUlkUmVnaXN0cnkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSByZXByZXNlbnRzIHRoZSB0ZW1wbGF0ZSBhbmQgdGhlIHN0eWxlcyBuYW1lIGlmIHRoZSBzdHlsZSBmb3IgdGhhdCBuYW1lIGlzIGF2YWlsYWJsZVxyXG4gICAgICovXHJcbiAgICBjcmVhdGUobmFtZSl7XHJcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldChuYW1lKTtcclxuICAgICAgICBpZighdGVtcGxhdGUpIHtcclxuICAgICAgICAgICAgTE9HLmVycm9yKHRoaXMudGVtcGxhdGVSZWdpc3RyeSk7XHJcbiAgICAgICAgICAgIHRocm93IFwiTm8gdGVtcGxhdGUgd2FzIGZvdW5kIHdpdGggbmFtZSBcIiArIG5hbWU7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZWxlbWVudFJlZ2lzdHJhdG9yID0gbmV3IEVsZW1lbnRSZWdpc3RyYXRvcih0aGlzLmV2ZW50UmVnaXN0cnksIHRoaXMudW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50Q291bnRlcisrKTtcclxuICAgICAgICBuZXcgRG9tVHJlZSh0ZW1wbGF0ZS5nZXRUZW1wbGF0ZVNvdXJjZSgpLGVsZW1lbnRSZWdpc3RyYXRvcikubG9hZCgpO1xyXG5cclxuICAgICAgICB0aGlzLm1vdW50U3R5bGVzKG5hbWUpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IENvbXBvbmVudChlbGVtZW50UmVnaXN0cmF0b3IuY29tcG9uZW50SW5kZXgsIGVsZW1lbnRSZWdpc3RyYXRvci5yb290RWxlbWVudCwgZWxlbWVudFJlZ2lzdHJhdG9yLmdldEVsZW1lbnRNYXAoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgbW91bnRTdHlsZXMobmFtZSkge1xyXG4gICAgICAgIGlmKHRoaXMuc3R5bGVzUmVnaXN0cnkuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgQ2FudmFzU3R5bGVzLnNldFN0eWxlKG5hbWUsIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0KG5hbWUpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG52YXIgY29tcG9uZW50Q291bnRlciA9IDA7IiwiaW1wb3J0IHtIaXN0b3J5fSBmcm9tIFwiLi4vbmF2aWdhdGlvbi9oaXN0b3J5LmpzXCI7XHJcbmltcG9ydCB7TWFwfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTdGF0ZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuc3RhdGVMaXN0ZW5lck1hcCA9IG5ldyBNYXAoKTtcclxuICAgIH1cclxuXHJcbiAgICByZWNvcmRTdGF0ZShuZXdQYXRoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IEhpc3RvcnkuZ2V0VXJsKCk7XHJcbiAgICAgICAgLy8gUHVzaCBjdXJyZW50IHVybCB0byBicm93c2VyIGhpc3RvcnlcclxuICAgICAgICBpZighKHVybC5nZXRQYXRoKDApID09PSBuZXdQYXRoKSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldFVybCh1cmwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgYSBuZXcgc3RhdGVcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHVybCBcclxuICAgICAqL1xyXG4gICAgc2V0VXJsKHVybCkge1xyXG4gICAgICAgIEhpc3RvcnkucHVzaFVybCh1cmwsXCJcIix7fSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBMb2dnZXIsIExpc3QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxyXG5pbXBvcnQgeyBTaW5nbGV0b25Db25maWcsIFByb3RvdHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiXHJcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XHJcbmltcG9ydCB7IEV2ZW50UmVnaXN0cnkgfSBmcm9tIFwiLi9ldmVudC9ldmVudFJlZ2lzdHJ5LmpzXCI7XHJcbmltcG9ydCB7IFVuaXF1ZUlkUmVnaXN0cnkgfSBmcm9tIFwiLi9jb21wb25lbnQvdW5pcXVlSWRSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBDb21wb25lbnRGYWN0b3J5IH0gZnJvbSBcIi4vY29tcG9uZW50L2NvbXBvbmVudEZhY3RvcnkuanNcIjtcclxuaW1wb3J0IHsgU3RhdGUgfSBmcm9tIFwiLi9uYXZpZ2F0aW9uL3N0YXRlLmpzXCI7XHJcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29uZmlnXCIpO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbmZpZyB7XHJcblxyXG4gICAgc3RhdGljIGdldEluc3RhbmNlKCkge1xyXG4gICAgICAgIHJldHVybiBqdXN0cmlnaHRDb25maWc7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy50eXBlQ29uZmlnTGlzdCA9IG5ldyBMaXN0KFtcclxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVGVtcGxhdGVSZWdpc3RyeSksXHJcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKFN0eWxlc1JlZ2lzdHJ5KSxcclxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVW5pcXVlSWRSZWdpc3RyeSksXHJcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKENvbXBvbmVudEZhY3RvcnkpLFxyXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChTdGF0ZSksXHJcbiAgICAgICAgICAgIFByb3RvdHlwZUNvbmZpZy51bm5hbWVkKEV2ZW50UmVnaXN0cnkpXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIGdldFR5cGVDb25maWdMaXN0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnR5cGVDb25maWdMaXN0O1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuY29uc3QganVzdHJpZ2h0Q29uZmlnID0gbmV3IENvbmZpZygpOyIsImltcG9ydCB7IExpc3QsIExvZ2dlciB9IGZyb20gIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgTWluZGlJbmplY3RvciwgTWluZGlDb25maWcsIEluc3RhbmNlUG9zdENvbmZpZ1RyaWdnZXIsIENvbmZpZ0FjY2Vzc29yIH0gZnJvbSBcIm1pbmRpX3YxXCI7XHJcbmltcG9ydCB7IENvbXBvbmVudENvbmZpZ1Byb2Nlc3NvciB9IGZyb20gXCIuL2NvbXBvbmVudC9jb21wb25lbnRDb25maWdQcm9jZXNzb3IuanNcIjtcclxuaW1wb3J0IHsgU2l0ZSB9IGZyb20gXCIuL3NpdGUuanNcIjtcclxuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSBcIi4vbG9hZGVyLmpzXCI7XHJcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XHJcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XHJcbmltcG9ydCB7IENvbmZpZyB9IGZyb20gXCIuL2NvbmZpZy5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkFwcGxpY2F0aW9uXCIpO1xyXG5cclxuY29uc3QgU0hBUkVEX0lOU1RBTkNFX1BST0NFU1NPUlNfTElTVCA9IG5ldyBMaXN0KFsgSW5zdGFuY2VQb3N0Q29uZmlnVHJpZ2dlciBdKTtcclxuY29uc3QgU0hBUkVEX0NPTkZJR19QUk9DRVNTT1JTX0xJU1QgPSBuZXcgTGlzdChbIENvbXBvbmVudENvbmZpZ1Byb2Nlc3NvciBdKTtcclxuY29uc3QgQ09ORklHID0gbmV3IE1pbmRpQ29uZmlnKCk7XHJcblxyXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb24ge1xyXG5cclxuICAgIC8qKiBcclxuICAgICAqIEBwYXJhbSB7U2l0ZX0gc2l0ZVxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihzaXRlKSB7XHJcblxyXG4gICAgICAgIHRoaXMuc2l0ZSA9IHNpdGU7XHJcbiAgICAgICAgdGhpcy5ydW5uaW5nV29ya2VycyA9IG5ldyBMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5pbnN0YW5zaWF0ZWRMb2FkZXJzID0gbmV3IExpc3QoKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtMb2FkZXJ9ICovXHJcbiAgICAgICAgY29uc3QgbG9hZGVyID0gdGhpcy5nZXRNYXRjaGluZ0xvYWRlcigpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge1Byb21pc2V9ICovXHJcbiAgICAgICAgY29uc3QgbW9kdWxlUHJvbWlzZSA9IGxvYWRlci5sb2FkTW9kdWxlKCk7XHJcblxyXG4gICAgICAgIENPTkZJR1xyXG4gICAgICAgICAgICAuYWRkQWxsVHlwZUNvbmZpZyhDb25maWcuZ2V0SW5zdGFuY2UoKS5nZXRUeXBlQ29uZmlnTGlzdCgpKVxyXG4gICAgICAgICAgICAuYWRkQWxsVHlwZUNvbmZpZyhzaXRlLnR5cGVDb25maWdMaXN0KVxyXG4gICAgICAgICAgICAuYWRkQWxsQ29uZmlnUHJvY2Vzc29yKFNIQVJFRF9DT05GSUdfUFJPQ0VTU09SU19MSVNUKVxyXG4gICAgICAgICAgICAuYWRkQWxsSW5zdGFuY2VQcm9jZXNzb3IoU0hBUkVEX0lOU1RBTkNFX1BST0NFU1NPUlNfTElTVCk7XHJcblxyXG4gICAgICAgIG1vZHVsZVByb21pc2UudGhlbigobW9kdWxlKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG1haW5PYmplY3QgPSBuZXcgbW9kdWxlLmRlZmF1bHQoKTtcclxuICAgICAgICAgICAgQ09ORklHLmFkZEFsbFR5cGVDb25maWcobWFpbk9iamVjdC50eXBlQ29uZmlnTGlzdCk7XHJcbiAgICAgICAgICAgIENPTkZJRy5maW5hbGl6ZSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBMZXQgbWluZGkgbG9hZCB0aGUgbG9hZGVyXHJcbiAgICAgICAgICAgICAgICBNaW5kaUluamVjdG9yLmluamVjdChtYWluT2JqZWN0LCBDT05GSUcpO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmluc3RhbnNpYXRlZExvYWRlcnMuYWRkKG1haW5PYmplY3QpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydFdvcmtlcnMoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRXb3JrZXJzKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmdXb3JrZXJzLnNpemUoKSA+IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNpdGUud29ya2Vycy5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgdmFsdWUoKTtcclxuICAgICAgICAgICAgTWluZGlJbmplY3Rvci5pbmplY3QoaW5zdGFuY2UsIENPTkZJRyk7XHJcbiAgICAgICAgICAgIHRoaXMucnVubmluZ1dvcmtlcnMuYWRkKGluc3RhbmNlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RXhpc3RpbmdJbnN0YXNpYXRlZExvYWRlcigpIHtcclxuICAgICAgICBsZXQgbG9hZGVyID0gbnVsbDtcclxuICAgICAgICB0aGlzLmluc3RhbnNpYXRlZExvYWRlcnMuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaGVzKCkpIHtcclxuICAgICAgICAgICAgICAgIGxvYWRlciA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIHJldHVybiBsb2FkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TWF0Y2hpbmdMb2FkZXIoKSB7XHJcbiAgICAgICAgbGV0IGxvYWRlciA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5zaXRlLmxvYWRlckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaGVzKCkpIHtcclxuICAgICAgICAgICAgICAgIGxvYWRlciA9IHZhbHVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIHJldHVybiBsb2FkZXI7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byBkZXBlbmRlbmN5IGluamVjdGlvbiBjb25maWdcclxuICAgICAqL1xyXG4gICAgd2luZG93RGlDb25maWcoKSB7XHJcbiAgICAgICAgd2luZG93LmRpQ29uZmlnID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBMT0cuaW5mbyhDT05GSUcuY29uZmlnRW50cmllcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlIGdsb2JhbCBhY2Nlc3MgdG8gdGVtcGxhdGUgcmVnaXN0cnlcclxuICAgICAqL1xyXG4gICAgd2luZG93VGVtcGxhdGVSZWdpc3RyeSgpIHtcclxuICAgICAgICB3aW5kb3cudGVtcGxhdGVSZWdpc3RyeSA9ICgpID0+IHtcclxuICAgICAgICAgICAgTE9HLmluZm8oQ29uZmlnQWNjZXNzb3IuaW5zdGFuY2VIb2xkZXIoVGVtcGxhdGVSZWdpc3RyeS5uYW1lLCBDT05GSUcpLmdldEluc3RhbmNlKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZSBnbG9iYWwgYWNjZXNzIHRvIHN0eWxlIHJlZ2lzdHJ5XHJcbiAgICAgKi9cclxuICAgIHdpbmRvd1N0eWxlUmVnaXN0cnkoKSB7XHJcbiAgICAgICAgd2luZG93LnN0eWxlUmVnaXN0cnkgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIExPRy5pbmZvKENvbmZpZ0FjY2Vzc29yLmluc3RhbmNlSG9sZGVyKFN0eWxlc1JlZ2lzdHJ5Lm5hbWUsIENPTkZJRykuZ2V0SW5zdGFuY2UoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufVxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJpbXBvcnQgeyBQcm9wZXJ0eUFjY2Vzc29yLCBMaXN0LCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0SW5wdXRFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYWJzdHJhY3RJbnB1dEVsZW1lbnRcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIklucHV0RWxlbWVudERhdGFCaW5kaW5nXCIpO1xuXG5leHBvcnQgY2xhc3MgSW5wdXRFbGVtZW50RGF0YUJpbmRpbmcge1xuXG4gICAgY29uc3RydWN0b3IobW9kZWwsIHZhbGlkYXRvcikge1xuICAgICAgICB0aGlzLm1vZGVsID0gbW9kZWw7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yID0gdmFsaWRhdG9yO1xuICAgICAgICB0aGlzLnB1bGxlcnMgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLnB1c2hlcnMgPSBuZXcgTGlzdCgpO1xuICAgIH1cblxuICAgIHN0YXRpYyBsaW5rKG1vZGVsLCB2YWxpZGF0b3IpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBJbnB1dEVsZW1lbnREYXRhQmluZGluZyhtb2RlbCwgdmFsaWRhdG9yKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmaWVsZCBcbiAgICAgKi9cbiAgICBhbmQoZmllbGQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG8oZmllbGQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZpZWxkIFxuICAgICAqL1xuICAgIHRvKGZpZWxkKSB7XG4gICAgICAgIGNvbnN0IHB1bGxlciA9ICgpID0+IHtcbiAgICAgICAgICAgIGxldCBtb2RlbFZhbHVlID0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lKTtcbiAgICAgICAgICAgIGlmIChtb2RlbFZhbHVlICE9PSBmaWVsZC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIFByb3BlcnR5QWNjZXNzb3Iuc2V0VmFsdWUodGhpcy5tb2RlbCwgZmllbGQubmFtZSwgZmllbGQudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMudmFsaWRhdG9yICYmIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlKXtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZShmaWVsZC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGZpZWxkLmF0dGFjaEV2ZW50KFwib25jaGFuZ2VcIiwgcHVsbGVyKTtcbiAgICAgICAgZmllbGQuYXR0YWNoRXZlbnQoXCJvbmtleXVwXCIsIHB1bGxlcik7XG4gICAgICAgIHB1bGxlci5jYWxsKCk7XG5cbiAgICAgICAgY29uc3QgcHVzaGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgdmFyIG1vZGVsVmFsdWUgPSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUpO1xuICAgICAgICAgICAgaWYgKG1vZGVsVmFsdWUgIT09IGZpZWxkLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgZmllbGQudmFsdWUgPSBtb2RlbFZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMudmFsaWRhdG9yICYmIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlU2lsZW50ICYmIGZpZWxkLnZhbHVlKXtcbiAgICAgICAgICAgICAgICB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZVNpbGVudChmaWVsZC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbk5hbWUgPSBcIl9fY2hhbmdlZF9cIiArIGZpZWxkLm5hbWUucmVwbGFjZShcIi5cIixcIl9cIik7XG4gICAgICAgIGlmICghdGhpcy5tb2RlbFtjaGFuZ2VkRnVuY3Rpb25OYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5tb2RlbFtjaGFuZ2VkRnVuY3Rpb25OYW1lXSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHVsbGVycy5hZGQocHVsbGVyKTtcbiAgICAgICAgdGhpcy5wdXNoZXJzLmFkZChwdXNoZXIpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHB1bGwoKSB7XG4gICAgICAgIHRoaXMucHVsbGVycy5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgcHVzaCgpIHtcbiAgICAgICAgdGhpcy5wdXNoZXJzLmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG59XG4iLCJleHBvcnQgY2xhc3MgUHJveHlPYmplY3RGYWN0b3J5IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYSBwcm94eSBmb3IgYW4gb2JqZWN0IHdoaWNoIGFsbG93cyBkYXRhYmluZGluZyBmcm9tIHRoZSBvYmplY3QgdG8gdGhlIGZvcm0gZWxlbWVudFxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgY3JlYXRlUHJveHlPYmplY3Qob2JqZWN0KSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eShvYmplY3QsIHtcclxuICAgICAgICAgICAgc2V0OiAodGFyZ2V0LCBwcm9wLCB2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHN1Y2Nlc3MgPSAodGFyZ2V0W3Byb3BdID0gdmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjaGFuZ2VkRnVuY3Rpb25OYW1lID0gXCJfX2NoYW5nZWRfXCIgKyBwcm9wO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbiA9IHRhcmdldFtjaGFuZ2VkRnVuY3Rpb25OYW1lXTtcclxuICAgICAgICAgICAgICAgIGlmKGNoYW5nZWRGdW5jdGlvbiAmJiB0eXBlb2YgY2hhbmdlZEZ1bmN0aW9uID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYm91bmRDaGFuZ2VkRnVuY3Rpb24gPSBjaGFuZ2VkRnVuY3Rpb24uYmluZCh0YXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJvdW5kQ2hhbmdlZEZ1bmN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VzcyA9PT0gdmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEV2ZW50RmlsdGVyZWRPYmplY3RGdW5jdGlvbiBleHRlbmRzIE9iamVjdEZ1bmN0aW9uIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbnRydWN0b3JcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IG9iamVjdEZ1bmN0aW9uIFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gdGhlRmlsdGVyIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihvYmplY3RGdW5jdGlvbiwgZmlsdGVyKXtcclxuICAgICAgICB0aGlzLm9iamVjdEZ1bmN0aW9uID0gb2JqZWN0RnVuY3Rpb247XHJcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgY2FsbChwYXJhbXMpe1xyXG4gICAgICAgIGlmKHRoaXMuZmlsdGVyICYmIHRoaXMuZmlsdGVyLmNhbGwodGhpcyxwYXJhbXMpKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JqZWN0RnVuY3Rpb24uY2FsbChwYXJhbXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBDb250YWluZXJCcmlkZ2UgfSBmcm9tIFwiLi4vYnJpZGdlL2NvbnRhaW5lckJyaWRnZS5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uU3RvcmFnZSB7XHJcbiAgICBcclxuICAgIHN0YXRpYyBzZXRMb2NhbEF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgQ29udGFpbmVyQnJpZGdlLnNldExvY2FsQXR0cmlidXRlKGtleSx2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldExvY2FsQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuZ2V0TG9jYWxBdHRyaWJ1dGUoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaGFzTG9jYWxBdHRyaWJ1dGUoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5oYXNMb2NhbEF0dHJpYnV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVMb2NhbEF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLnJlbW92ZUxvY2FsQXR0cmlidXRlKGtleSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBDb250YWluZXJCcmlkZ2UgfSBmcm9tIFwiLi4vYnJpZGdlL2NvbnRhaW5lckJyaWRnZS5qc1wiXHJcblxyXG5leHBvcnQgY2xhc3MgU2Vzc2lvblN0b3JhZ2Uge1xyXG5cclxuICAgIHN0YXRpYyBzZXRTZXNzaW9uQXR0cmlidXRlKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBDb250YWluZXJCcmlkZ2Uuc2V0U2Vzc2lvbkF0dHJpYnV0ZShrZXksdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBoYXNTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuaGFzU2Vzc2lvbkF0dHJpYnV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuZ2V0U2Vzc2lvbkF0dHJpYnV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UucmVtb3ZlU2Vzc2lvbkF0dHJpYnV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSHR0cFJlc3BvbnNlSGFuZGxlciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb2RlIFxyXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gb2JqZWN0RnVuY3Rpb24gXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtYXBwZXJGdW5jdGlvbiBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY29kZSwgb2JqZWN0RnVuY3Rpb24sIG1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZTtcclxuICAgICAgICB0aGlzLm9iamVjdEZ1bmN0aW9uID0gb2JqZWN0RnVuY3Rpb247XHJcbiAgICAgICAgdGhpcy5tYXBwZXJGdW5jdGlvbiA9IG1hcHBlckZ1bmN0aW9uO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IE1hcCwgT2JqZWN0RnVuY3Rpb24sIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBIdHRwUmVzcG9uc2VIYW5kbGVyIH0gZnJvbSBcIi4vaHR0cFJlc3BvbnNlSGFuZGxlclwiO1xyXG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkh0dHBDYWxsQnVpbGRlclwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBIdHRwQ2FsbEJ1aWxkZXIge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtZXRlciBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IodXJsLCBwYXJhbXRlcikge1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLnVybCA9IHVybDtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3R9ICovXHJcbiAgICAgICAgdGhpcy5wYXJhbXRlciA9IHBhcmFtdGVyO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cclxuICAgICAgICB0aGlzLmh0dHBDYWxsYmFja01hcCA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cclxuICAgICAgICB0aGlzLmVycm9yQ2FsbGJhY2sgPSBudWxsO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUgPSA0MDAwO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cclxuICAgICAgICB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlID0gNDAwMDtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtmdW5jdGlvbn0gKi9cclxuICAgICAgICB0aGlzLmVycm9yTWFwcGVyRnVuY3Rpb24gPSBudWxsO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLmF1dGhvcml6YXRpb24gPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge0NsaWVudH0gY2xpZW50IFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbWV0ZXIgXHJcbiAgICAgKiBAcmV0dXJucyB7SHR0cENhbGxCdWlsZGVyfVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgbmV3SW5zdGFuY2UoY2xpZW50LCB1cmwsIHBhcmFtZXRlcikge1xyXG4gICAgICAgIHJldHVybiBuZXcgSHR0cENhbGxCdWlsZGVyKGNsaWVudCwgdXJsLCBwYXJhbWV0ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY29kZSBcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3QgXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1hcHBlckZ1bmN0aW9uIG1hcHBlciBmdW5jdGlvbiB0byBwYXNzIHRoZSByZXN1bHQgb2JqZWN0IHRvXHJcbiAgICAgKi9cclxuICAgIHJlc3BvbnNlTWFwcGluZyhjb2RlLCBvYmplY3QsIGNhbGxiYWNrLCBtYXBwZXJGdW5jdGlvbikge1xyXG4gICAgICAgIHRoaXMuaHR0cENhbGxiYWNrTWFwLnNldChjb2RlLCBuZXcgSHR0cFJlc3BvbnNlSGFuZGxlcihjb2RlLCBuZXcgT2JqZWN0RnVuY3Rpb24ob2JqZWN0LCBjYWxsYmFjayksIG1hcHBlckZ1bmN0aW9uKSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3QgXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGVycm9yTWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cclxuICAgICAqL1xyXG4gICAgZXJyb3JNYXBwaW5nKG9iamVjdCwgY2FsbGJhY2ssIGVycm9yTWFwcGVyRnVuY3Rpb24gPSBudWxsKSB7XHJcbiAgICAgICAgaWYob2JqZWN0ICYmIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmIChlcnJvck1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVycm9yTWFwcGVyRnVuY3Rpb24gPSBlcnJvck1hcHBlckZ1bmN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JDYWxsYmFjayA9IG5ldyBPYmplY3RGdW5jdGlvbihvYmplY3QsIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhdXRob3JpemF0aW9uIFxyXG4gICAgICovXHJcbiAgICBhdXRob3JpemF0aW9uSGVhZGVyKGF1dGhvcml6YXRpb24pIHtcclxuICAgICAgICB0aGlzLmF1dGhvcml6YXRpb24gPSBcIkJlYXJlciBcIiArIGF1dGhvcml6YXRpb247XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgY29ubmVjdGlvblRpbWVvdXQoY29ubmVjdGlvblRpbWVvdXRWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSA9IGNvbm5lY3Rpb25UaW1lb3V0VmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmVzcG9uc2VUaW1lb3V0KHJlc3BvbnNlVGltZW91dFZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSA9IHJlc3BvbnNlVGltZW91dFZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCgpIHtcclxuICAgICAgICBDbGllbnQuZ2V0KHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHBvc3QoKSB7XHJcbiAgICAgICAgQ2xpZW50LnBvc3QodGhpcy51cmwsIHRoaXMucGFyYW10ZXIsIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSwgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSwgdGhpcy5hdXRob3JpemF0aW9uKS50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXNwb25zZShyZXNwb25zZSk7XHJcbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0Vycm9yKGVycm9yKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdXQoKSB7XHJcbiAgICAgICAgQ2xpZW50LnB1dCh0aGlzLnVybCwgdGhpcy5wYXJhbXRlciwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHBhdGNoKCkge1xyXG4gICAgICAgIENsaWVudC5wYXRjaCh0aGlzLnVybCwgdGhpcy5wYXJhbXRlciwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGRlbGV0ZSgpIHtcclxuICAgICAgICBDbGllbnQuZGVsZXRlKHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcclxuICAgICAgICB9LCAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzRXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NFcnJvcihlcnJvcikge1xyXG4gICAgICAgIExPRy5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgaWYodGhpcy5lcnJvckNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuZXJyb3JNYXBwZXJGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgZXJyb3IgPSB0aGlzLmVycm9yTWFwcGVyRnVuY3Rpb24uY2FsbCh0aGlzLCBlcnJvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5lcnJvckNhbGxiYWNrLmNhbGwoZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtSZXNwb25zZX0gcmVzcG9uc2UgXHJcbiAgICAgKi9cclxuICAgIHByb2Nlc3NSZXNwb25zZShyZXNwb25zZSkge1xyXG4gICAgICAgIC8qKiBAdHlwZSB7SHR0cFJlc3BvbnNlSGFuZGxlcn0gKi9cclxuICAgICAgICB2YXIgcmVzcG9uc2VIYW5kbGVyID0gdGhpcy5odHRwQ2FsbGJhY2tNYXAuZ2V0KHJlc3BvbnNlLnN0YXR1cyk7XHJcbiAgICAgICAgaWYocmVzcG9uc2VIYW5kbGVyKSB7XHJcbiAgICAgICAgICAgIGlmKHJlc3BvbnNlSGFuZGxlci5tYXBwZXJGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuanNvbigpLnRoZW4oXHJcbiAgICAgICAgICAgICAgICAgICAgKG9iamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFwcGVyRnVuY3Rpb24gPSByZXNwb25zZUhhbmRsZXIubWFwcGVyRnVuY3Rpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZUhhbmRsZXIub2JqZWN0RnVuY3Rpb24uY2FsbChtYXBwZXJGdW5jdGlvbihvYmplY3QpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlSGFuZGxlci5vYmplY3RGdW5jdGlvbi5jYWxsKG9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIChmYWlsUmVhc29uKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZUhhbmRsZXIub2JqZWN0RnVuY3Rpb24uY2FsbCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQWJzdHJhY3RWYWxpZGF0b3JcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0N1cnJlbnRseVZhbGlkXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGN1cnJlbnRseVZhbGlkID0gZmFsc2UsIGVuYWJsZWQgPSB0cnVlKSB7XHJcbiAgICAgICAgdGhpcy52YWxpZExpc3RlbmVyTGlzdCA9IG5ldyBMaXN0KCk7XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0ID0gbmV3IExpc3QoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gY3VycmVudGx5VmFsaWQ7XHJcbiAgICAgICAgdGhpcy5lbmFibGVkID0gZW5hYmxlZDtcclxuICAgIH1cclxuXHJcbiAgICBlbmFibGUoKSB7XHJcbiAgICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkpIHtcclxuICAgICAgICAgICAgdGhpcy52YWxpZCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBkaXNhYmxlKCkge1xyXG4gICAgICAgIGxldCB3YXNWYWxpZCA9IHRoaXMuY3VycmVudGx5VmFsaWQ7XHJcbiAgICAgICAgLy8gRmFrZSB2YWxpZFxyXG4gICAgICAgIHRoaXMudmFsaWQoKTtcclxuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gd2FzVmFsaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaXNWYWxpZCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudGx5VmFsaWQ7XHJcbiAgICB9XHJcblxyXG5cdHZhbGlkKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgaWYoIXRoaXMudmFsaWRMaXN0ZW5lckxpc3QpIHtcclxuICAgICAgICAgICAgTE9HLndhcm4oXCJObyB2YWxpZGF0aW9uIGxpc3RlbmVyc1wiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnZhbGlkTGlzdGVuZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgdmFsdWUuY2FsbCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHR9XHJcblxyXG5cdGludmFsaWQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgaWYoIXRoaXMuaW52YWxpZExpc3RlbmVyTGlzdCkge1xyXG4gICAgICAgICAgICBMT0cud2FybihcIk5vIGludmFsaWRhdGlvbiBsaXN0ZW5lcnNcIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgdmFsdWUuY2FsbCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHR9XHJcblxyXG5cdHZhbGlkU2lsZW50KCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB0cnVlO1xyXG5cdH1cclxuXHJcblx0aW52YWxpZFNpbGVudCgpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gZmFsc2U7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBcclxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSB2YWxpZExpc3RlbmVyIFxyXG5cdCAqL1xyXG5cdHdpdGhWYWxpZExpc3RlbmVyKHZhbGlkTGlzdGVuZXIpIHtcclxuXHRcdHRoaXMudmFsaWRMaXN0ZW5lckxpc3QuYWRkKHZhbGlkTGlzdGVuZXIpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHQvKipcclxuXHQgKiBcclxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBpbnZhbGlkTGlzdGVuZXIgXHJcblx0ICovXHJcblx0d2l0aEludmFsaWRMaXN0ZW5lcihpbnZhbGlkTGlzdGVuZXIpIHtcclxuXHRcdHRoaXMuaW52YWxpZExpc3RlbmVyTGlzdC5hZGQoaW52YWxpZExpc3RlbmVyKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgTGlzdCwgT2JqZWN0RnVuY3Rpb24gfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0VmFsaWRhdG9yLmpzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBBbmRWYWxpZGF0b3JTZXQgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoaXNWYWxpZEZyb21TdGFydCA9IGZhbHNlKSB7XHJcbiAgICAgICAgc3VwZXIoaXNWYWxpZEZyb21TdGFydCk7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0ID0gbmV3IExpc3QoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RWYWxpZGF0b3J9IHZhbGlkYXRvclxyXG4gICAgICovXHJcbiAgICB3aXRoVmFsaWRhdG9yKHZhbGlkYXRvcikge1xyXG4gICAgICAgIHZhbGlkYXRvci53aXRoVmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVWYWxpZCkpO1xyXG4gICAgICAgIHZhbGlkYXRvci53aXRoSW52YWxpZExpc3RlbmVyKG5ldyBPYmplY3RGdW5jdGlvbih0aGlzLCB0aGlzLm9uZUludmFsaWQpKTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuYWRkKHZhbGlkYXRvcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbmUgdmFsaWRhdG9yIHNhaWQgaXQgd2FzIHZhbGlkXHJcbiAgICAgKi9cclxuICAgIG9uZVZhbGlkKCkge1xyXG4gICAgICAgIGxldCBmb3VuZEludmFsaWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKCF2YWx1ZS5pc1ZhbGlkKCkpIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kSW52YWxpZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgaWYoIWZvdW5kSW52YWxpZCkge1xyXG4gICAgICAgICAgICBzdXBlci52YWxpZCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPbmUgdmFsaWRhdG9yIHNhaWQgaXQgd2FzIGludmFsaWRcclxuICAgICAqL1xyXG4gICAgb25lSW52YWxpZCgpIHtcclxuICAgICAgICBzdXBlci5pbnZhbGlkKCk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgUmVnZXhWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgcmVnZXggPSBcIiguKilcIikge1xyXG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XHJcblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcclxuICAgICAgICB0aGlzLnJlZ2V4ID0gcmVnZXg7XHJcbiAgICB9XHJcblxyXG5cdHZhbGlkYXRlKHZhbHVlKXtcclxuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUubWF0Y2godGhpcy5yZWdleCkpe1xyXG5cdCAgICBcdHRoaXMudmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmKCF2YWx1ZSAmJiAhdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0XHR0aGlzLnZhbGlkKCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5pbnZhbGlkKCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcclxuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUubWF0Y2godGhpcy5yZWdleCkpe1xyXG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmKCF2YWx1ZSAmJiAhdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0XHR0aGlzLnZhbGlkU2lsZW50KCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcclxuXHJcbmNvbnN0IEVNQUlMX0ZPUk1BVCA9IC9eXFx3KyhbXFwuLV0/XFx3KykqQFxcdysoW1xcLi1dP1xcdyspKihcXC5cXHd7MiwzfSkrJC87XHJcblxyXG5leHBvcnQgY2xhc3MgRW1haWxWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xyXG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgRU1BSUxfRk9STUFUKTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xyXG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEVxdWFsc0Z1bmN0aW9uUmVzdWx0VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG5cclxuXHQvKipcclxuXHQgKiBcclxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcclxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGlzY3VycmVudGx5VmFsaWQgXHJcblx0ICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxyXG5cdCAqL1xyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgY29tcGFyZWRWYWx1ZUZ1bmN0aW9uID0gbnVsbCkge1xyXG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XHJcblxyXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xyXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XHJcblxyXG5cdFx0LyoqIEB0eXBlIHtPYmplY3RGdW5jdGlvbn0gKi9cclxuXHRcdHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uID0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uO1xyXG5cdH1cclxuXHJcblx0dmFsaWRhdGUodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gdGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24uY2FsbCgpKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcclxuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uLmNhbGwoKSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcclxuaW1wb3J0IHsgT2JqZWN0RnVuY3Rpb24sIFByb3BlcnR5QWNjZXNzb3IgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFcXVhbHNQcm9wZXJ0eVZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcblx0LyoqXHJcblx0ICogXHJcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXHJcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxyXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGNvbXBhcmVkVmFsdWVGdW5jdGlvbiBcclxuXHQgKi9cclxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIG1vZGVsID0gbnVsbCwgYXR0cmlidXRlTmFtZSA9IG51bGwpIHtcclxuXHRcdHN1cGVyKGlzY3VycmVudGx5VmFsaWQpO1xyXG5cclxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cclxuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xyXG5cclxuXHRcdC8qKiBAdHlwZSB7b2JqZWN0fSAqL1xyXG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcclxuICAgICAgICBcclxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZU5hbWUgPSBhdHRyaWJ1dGVOYW1lO1xyXG5cdH1cclxuXHJcblx0dmFsaWRhdGUodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCB0aGlzLmF0dHJpYnV0ZU5hbWUpKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkKCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcclxuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgdGhpcy5hdHRyaWJ1dGVOYW1lKSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcclxuaW1wb3J0IHsgT2JqZWN0RnVuY3Rpb24sIFByb3BlcnR5QWNjZXNzb3IgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBFcXVhbHNTdHJpbmdWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIFxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gbWFuZGF0b3J5IFxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcclxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXHJcblx0ICovXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBjb250cm9sVmFsdWUgPSBudWxsKSB7XHJcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcclxuXHJcblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXHJcblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXHJcbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XHJcblx0fVxyXG5cclxuXHR2YWxpZGF0ZSh2YWx1ZSl7XHJcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xyXG5cdCAgICBcdHRoaXMudmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gY29udHJvbFZhbHVlKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgTGlzdCwgT2JqZWN0RnVuY3Rpb24gfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0VmFsaWRhdG9yLmpzJ1xyXG5cclxuZXhwb3J0IGNsYXNzIE9yVmFsaWRhdG9yU2V0IGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3Rvcihpc1ZhbGlkRnJvbVN0YXJ0ID0gZmFsc2UpIHtcclxuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QgPSBuZXcgTGlzdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdFZhbGlkYXRvcn0gdmFsaWRhdG9yXHJcbiAgICAgKi9cclxuICAgIHdpdGhWYWxpZGF0b3IodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgdmFsaWRhdG9yLndpdGhWYWxpZExpc3RlbmVyKG5ldyBPYmplY3RGdW5jdGlvbih0aGlzLCB0aGlzLm9uZVZhbGlkKSk7XHJcbiAgICAgICAgdmFsaWRhdG9yLndpdGhJbnZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lSW52YWxpZCkpO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgdmFsaWRcclxuICAgICAqL1xyXG4gICAgb25lVmFsaWQoKSB7XHJcbiAgICAgICAgc3VwZXIudmFsaWQoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxyXG4gICAgICovXHJcbiAgICBvbmVJbnZhbGlkKCkge1xyXG4gICAgICAgIGxldCBmb3VuZFZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0LmZvckVhY2goKHZhbHVlLHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZih2YWx1ZS5pc1ZhbGlkKCkpIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kVmFsaWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG4gICAgICAgIGlmKGZvdW5kVmFsaWQpIHtcclxuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzdXBlci5pbnZhbGlkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcclxuXHJcbmNvbnN0IFBBU1NXT1JEX0ZPUk1BVCA9IC9eKD89LipbQS1aYS16XSkoPz0uKj9bMC05XSkoPz0uKj9bIz8hQCQlXiYqLV0pLns4LH0kLztcclxuXHJcbmV4cG9ydCBjbGFzcyBQYXNzd29yZFZhbGlkYXRvciBleHRlbmRzIFJlZ2V4VmFsaWRhdG9yIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XHJcbiAgICAgICAgc3VwZXIobWFuZGF0b3J5LCBpc2N1cnJlbnRseVZhbGlkLCBQQVNTV09SRF9GT1JNQVQpO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBSZWdleFZhbGlkYXRvciB9IGZyb20gXCIuL3JlZ2V4VmFsaWRhdG9yLmpzXCI7XHJcblxyXG5jb25zdCBQSE9ORV9GT1JNQVQgPSAvXlxcK1swLTldezJ9XFxzPyhbMC05XVxccz8pKiQvO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBob25lVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UpIHtcclxuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIFBIT05FX0ZPUk1BVCk7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZXF1aXJlZFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcblx0Y29uc3RydWN0b3IoY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgZW5hYmxlZCA9IHRydWUpIHtcclxuXHRcdHN1cGVyKGN1cnJlbnRseVZhbGlkLCBlbmFibGVkKTtcclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlKHZhbHVlKXtcclxuXHRcdGlmKHZhbHVlID09PSBcIlwiKXtcclxuXHQgICAgXHR0aGlzLmludmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMudmFsaWQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcclxuXHRcdGlmKHZhbHVlID09PSBcIlwiKXtcclxuXHQgICAgXHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMudmFsaWRTaWxlbnQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiJdLCJuYW1lcyI6WyJMT0ciXSwibWFwcGluZ3MiOiI7Ozs7QUFFQSxNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDOztBQUUxQyxNQUFhLGVBQWUsQ0FBQzs7Ozs7O0lBTXpCLE9BQU8sY0FBYyxDQUFDLEVBQUUsRUFBRTtRQUN0QixPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDdEM7Ozs7OztJQU1ELE9BQU8sY0FBYyxDQUFDLEtBQUssRUFBRTtRQUN6QixPQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO0tBQ3hDOzs7Ozs7SUFNRCxPQUFPLGFBQWEsQ0FBQyxJQUFJLEVBQUU7UUFDdkIsT0FBTyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQztLQUN0Qzs7Ozs7OztJQU9ELE9BQU8sZUFBZSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUU7UUFDcEMsT0FBTyxRQUFRLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNwRDs7Ozs7OztJQU9ELE9BQU8sS0FBSyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEdBQUcsSUFBSSxFQUFFLGVBQWUsR0FBRyxJQUFJLEVBQUU7UUFDeEUsT0FBTyxlQUFl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

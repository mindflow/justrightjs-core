import { ContainerUrl, ContainerHttpClient, ContainerElement, ContainerWindow } from './containerbridge_v1.js';
import { List, Map, Logger, ObjectFunction, StringUtils, PropertyAccessor } from './coreutil_v1.js';
import { InjectionPoint, SingletonConfig, PrototypeConfig, MindiInjector, MindiConfig, InstancePostConfigTrigger, ConfigAccessor } from './mindi_v1.js';
import { XmlElement, XmlCdata, DomTree } from './xmlparser_v1.js';

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

    constructor(protocol, host, port, pathValueList, parameterValueMap, bookmark){
        this.protocolString = protocol;
        this.hostString = host;
        this.portString = port;
        this.pathValueList = pathValueList;
        this.parameterValueMap = parameterValueMap;
        this.bookmarkString = bookmark;
        
        if (!this.pathValueList) {
            this.pathValueList = new List();
        }
        if (!this.parameterValueMap) {
            this.parameterValueMap = new Map();
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
            return new List();
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

        const rawPathPartList = new List(path.split("/"));

        const pathValueList = new List();
        rawPathPartList.forEach((value) => {
            pathValueList.add(decodeURI(value));
            return true;
        }, this);

        return pathValueList;
    }

    static determineParameters(remaining){
        const value = remaining["string"];

        if (!value) {
            return new Map();
        }

        let parameters = value;

        if(parameters.indexOf("?") === -1) {
            return new Map();
        }
        parameters = parameters.substring(parameters.indexOf("?")+1);
        if(parameters.indexOf("#") !== -1) {
            remaining["string"] = parameters.substring(parameters.indexOf("#"));
            parameters = parameters.substring(0,parameters.indexOf("#"));
        } else {
            remaining["string"] = null;
        }

        const parameterPartList = new List(parameters.split("&"));
        const parameterMap = new Map();
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
        ContainerUrl.replaceUrl(url.toString(), title, stateObject);
    }

    static pushUrl(url, title, stateObject) {
        ContainerUrl.pushUrl(url.toString(), title, stateObject);
    }

    static currentUrl() {
        return UrlUtils.parse(ContainerUrl.currentUrl());
    }

}

class UrlBuilder {

    constructor() {
        this.protocol = null;
        this.host = null;
        this.port = null;
        this.pathsList = new List();
        this.parametersMap = new Map();
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
        return ContainerHttpClient.fetch(url.toString(),params, connectionTimeout, responseTimeout);
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
        return ContainerHttpClient.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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
        return ContainerHttpClient.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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
        return ContainerHttpClient.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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
        return ContainerHttpClient.fetch(url.toString(), params, connectionTimeout, responseTimeout);
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

const LOG = new Logger("StylesRegistry");

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
                this.privateLoad(key, UrlUtils.parse(value))

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

const LOG$1 = new Logger("TemplateRegistry");

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
            url.pathsList.setLast(
                this.languagePrefix + "." +
                url.pathsList.getLast()
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
                this.privateLoad(key, UrlUtils.parse(value))

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
            url.pathsList.setLast(
                this.languagePrefix + "." +
                url.pathsList.getLast()
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

const LOG$2 = new Logger("TemplatePostConfig");

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
        let templateMap = new Map();
        configEntries.forEach((key, configEntry, parent) => {
            if(configEntry.classReference.TEMPLATE_URL && configEntry.classReference.COMPONENT_NAME) {
                templateMap.set(configEntry.classReference.COMPONENT_NAME, configEntry.classReference.TEMPLATE_URL);
            }
            return true;
        }, this); 
        return this.templateRegistry.getTemplatesLoadedPromise(templateMap);
    }

}

const LOG$3 = new Logger("StylesLoader");

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
        let stylesMap = new Map();
        configEntries.forEach((key, configEntry, parent) => {
            if(configEntry.classReference.STYLES_URL && configEntry.classReference.COMPONENT_NAME) {
                stylesMap.set(configEntry.classReference.COMPONENT_NAME, configEntry.classReference.STYLES_URL);
            }
            return true;
        }, this); 
        return this.stylesRegistry.getStylesLoadedPromise(stylesMap);
    }

}

const LOG$4 = new Logger("ComponentConfigProcessor");

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

const LOG$5 = new Logger("BaseElement");

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
        this.eventsAttached = new List();
        
        if(value instanceof XmlElement) {
            this.element = this.createFromXmlElement(value, parent);
            return;
        }
        if(typeof value === "string"){
            this.element = ContainerElement.createElement(value);
            return;
        }
        if(ContainerElement.isUIElement(value)){
            this.element = value;
            return;
        }
        LOG$5.error("Unrecognized value for Element");
        LOG$5.error(value);
    }

    loadAttributes() {
        if (this.element.attributes === null || this.element.attributes === undefined) {
            this.attributeMap = new Map();
            return;
        }
        if (this.attributeMap === null || this.attributeMap === undefined) {
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
            element = ContainerElement.createElementNS(xmlElement.namespaceUri, xmlElement.fullName);
        }else {
            element = ContainerElement.createElement(xmlElement.name);
        }
        if(parentElement && parentElement.mappedElement !== null) {
            ContainerElement.appendChild(parentElement.mappedElement, element);
        }
        xmlElement.attributes.forEach((attributeKey, attribute) => {
            ContainerElement.setAttribute(element, attributeKey, attribute.value);
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
            ContainerElement.addEventListener(this.element, eventType, functionParam, capture);
            this.eventsAttached.add(eventType);
        } else {
            LOG$5.warn("Event '" + eventType + "' allready attached for " + this.element.name);
        }
    }

    listenTo(eventType, listener, capture) {
        ContainerElement.addEventListener(this.element, eventType, (event) => {
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
        ContainerElement.setAttribute(this.element, key,value);
    }

    getAttributeValue(key) {
        return ContainerElement.getAttribute(this.element, key);
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
            this.element.parentNode.replaceChild(ContainerElement.createTextNode(input), this.element);
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
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
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
            this.element.appendChild(ContainerElement.createTextNode(input));
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
            this.element.insertBefore(ContainerElement.createTextNode(input),this.element.firstChild);
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

const LOG$6 = new Logger("AbstractInputElement");

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
            this.element = ContainerElement.createTextNode(value);
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
            ContainerElement.appendChild(parentElement.mappedElement, element);
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

const LOG$7 = new Logger("EventRegistry");

class EventRegistry {

    constructor() {

        /** @type {Map<Map<ObjectFunction>} */
        this.listeners = new Map();
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
            this.listeners.set(key,new Map());
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

    static shouldSwallowNextFocusEscape = false;

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static replaceComponent(id, component) {
        const bodyElement = ContainerElement.getElementById(id);
        bodyElement.parentNode.replaceChild(component.rootElement.mappedElement, bodyElement);
    }

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static setComponent(id, component) {
        const bodyElement = ContainerElement.getElementById(id);
        bodyElement.innerHTML = '';
        bodyElement.appendChild(component.rootElement.mappedElement, bodyElement);
    }

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static addChildComponent(id, component) {
        const bodyElement = ContainerElement.getElementById(id);
        bodyElement.appendChild(component.rootElement.mappedElement);
    }

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static addChildElement(id, element) {
        const bodyElement = ContainerElement.getElementById(id);
        bodyElement.appendChild(element.mappedElement);
    }

    /**
     * 
     * @param {String} id 
     */
    static removeElement(id) {
        ContainerElement.removeElement(id);
    }

    /** 
     * @param {BaseElement} element
     */
    static addHeaderElement(element) {
        ContainerElement.appendRootMetaChild(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static addBodyElement(element) {
        ContainerElement.appendRootUiChild(element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependHeaderElement(element) {
        ContainerElement.prependElement("head", element.mappedElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependBodyElement(element) {
        ContainerElement.prependElement("body", element.mappedElement);
    }

    /** 
     * Remember to swallowFocusEscape for initial triggering events
     * which are external to focusRoot
     * 
     * @param {ObjectFunction} listener
     * @param {BaseElement} focusRoot
     */
    static listenToFocusEscape(listener, focusRoot) {
        
        const callIfNotContains = new ObjectFunction(null, (event) => {
            if (ContainerElement.contains(focusRoot.element, event.getTarget().element)) {
                return;
            }
            if (CanvasRoot.shouldSwallowNextFocusEscape) {
                return;
            }
            listener.call(event);
        });
        ContainerWindow.addEventListener("click", callIfNotContains, Event);
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
        var xmlElement = new XmlElement(elementName);
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

const LOG$8 = new Logger("CanvasStyles");

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

const LOG$9 = new Logger("ComponentFactory");

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
            LOG$9.error(this.templateRegistry);
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

const LOG$a = new Logger("Config");

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
            PrototypeConfig.unnamed(EventRegistry)]);
        }

    getTypeConfigList() {
        return this.typeConfigList;
    }

}

const justrightConfig = new Config();

const LOG$b = new Logger("LoaderInterceptor");

class LoaderInterceptor {

    /**
     * @returns {Boolean}
     */
    process() {
        LOG$b.info("Unimplemented Loader Interceptor breaks by default");
        return false;
    }

}

const LOG$c = new Logger("ModuleLoader");

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
        return StringUtils.nonNullEquals(this.matchPath, url.path);
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
            import(this.modulePath).then((module) => {
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

const LOG$d = new Logger("DiModuleLoader");

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
                return MindiInjector.inject(main, this.config);
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

                    new List(this.loaderInterceptors).promiseChain((loaderInterceptor) => {
                        return MindiInjector.inject(loaderInterceptor, this.config);
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

const LOG$e = new Logger("Application");

class Application extends ModuleRunner {

    constructor() {

        super();

        /** @type {List} */
        this.workerList = new List();

        /** @type {List<DiModuleLoader>} */
        this.moduleLoaderList = new List();

        /** @type {MindiConfig} */
        this.config = new MindiConfig();

        /** @type {List} */
        this.runningWorkers = new List();

        /** @type {Main} */
        this.activeMain = null;

        this.defaultConfig = Config.getInstance().getTypeConfigList();

        this.defaultConfigProcessors = new List([ ComponentConfigProcessor ]);

        this.defaultInstanceProcessors = new List([ InstancePostConfigTrigger ]);

        this.customConfig = new List();

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
        ContainerUrl.addUserNavigateListener(
            new ObjectFunction(this, this.update),
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
        if (this.activeMain && StringUtils.nonNullEquals(this.activeMain.path, url.path)) {
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
            MindiInjector.inject(instance, this.config);
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
            LOG$e.info(ConfigAccessor.instanceHolder(TemplateRegistry.name, this.config).instance);
        };
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            LOG$e.info(ConfigAccessor.instanceHolder(StylesRegistry.name, this.config).instance);
        };
    }

}

const LOG$f = new Logger("InputElementDataBinding");

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

        if (!StringUtils.nonNullEquals(currentUrl.bookmark, matchingNode.trail)) {
            const urlBuilder = UrlBuilder.builder().withAllOfUrl(currentUrl);
            if (StringUtils.isBlank(currentUrl.bookmark)) {
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

        if (!StringUtils.nonNullEquals(currentUrl.bookmark, matchingNode.trail)) {
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
    static callMatchingFunctionFromUrl(url, currentObject, node, trailStops = new List()) {

        if (node.property) {
            currentObject = currentObject[node.property];
        }

        if (StringUtils.startsWith(url.bookmark, TrailProcessor.toStartsWith(node.trail))) {
            trailStops.add(node.trail);
            if (node.waypoint) {
                node.waypoint.call(currentObject);
            }
        }

        if (StringUtils.nonNullEquals(url.bookmark, node.trail)) {
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

        if (StringUtils.nonNullEquals(trail, "/")) {
            return "/";
        }

        return trail + "/";
    }

}

const LOG$g = new Logger("HttpCallBuilder");

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
        this.successMappingMap = new Map();

        /** @type {Map} */
        this.failMappingMap = new Map();

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

const LOG$h = new Logger("AbstractValidator");

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

export { AbstractInputElement, AbstractValidator, ActiveModuleRunner, AndValidatorSet, Application, Attribute, BaseElement, CanvasRoot, CanvasStyles, CheckboxInputElement, Client, Component, ComponentConfigProcessor, ComponentFactory, Config, DiModuleLoader, ElementMapper, ElementRegistrator, EmailValidator, EqualsFunctionResultValidator, EqualsPropertyValidator, EqualsStringValidator, Event, EventFilteredObjectFunction, EventRegistry, FormElement, HTML, History, HttpCallBuilder, InputElementDataBinding, LoaderInterceptor, Main, ModuleLoader, ModuleRunner, Navigation, OrValidatorSet, PasswordValidator, PhoneValidator, ProxyObjectFactory, RadioInputElement, RegexValidator, RequiredValidator, SimpleElement, Styles, StylesLoader, StylesRegistry, Template, TemplateRegistry, TemplatesLoader, TextInputElement, TextareaInputElement, TextnodeElement, TrailNode, TrailProcessor, UniqueIdRegistry, Url, UrlBuilder, UrlUtils, VideoElement };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvbW9kdWxlUnVubmVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL3VybC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC91cmxVdGlscy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi9oaXN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL3VybEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L25hdmlnYXRpb24vbmF2aWdhdGlvbi5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvYWN0aXZlTW9kdWxlUnVubmVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jbGllbnQvY2xpZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVzLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC90ZW1wbGF0ZS90ZW1wbGF0ZXNMb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNMb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRDb25maWdQcm9jZXNzb3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvYXR0cmlidXRlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2Jhc2VFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3JhZGlvSW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2NoZWNrYm94SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdGV4dGFyZWFJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdGV4dG5vZGVFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3NpbXBsZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvZm9ybUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdmlkZW9FbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2VsZW1lbnRNYXBwZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2V2ZW50L2V2ZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudFJlZ2lzdHJ5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb21wb25lbnQvdW5pcXVlSWRSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2VsZW1lbnRSZWdpc3RyYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2FudmFzL2NhbnZhc1Jvb3QuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2h0bWwvaHRtbC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2FudmFzL2NhbnZhc1N0eWxlcy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudEZhY3RvcnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbmZpZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbG9hZGVyL2xvYWRlckludGVyY2VwdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbW9kdWxlTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9tYWluLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvZGlNb2R1bGVMb2FkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2FwcGxpY2F0aW9uLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9kYXRhQmluZC9pbnB1dEVsZW1lbnREYXRhQmluZGluZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZGF0YUJpbmQvcHJveHlPYmplY3RGYWN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudEZpbHRlcmVkT2JqZWN0RnVuY3Rpb24uanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L25hdmlnYXRpb24vdHJhaWxOb2RlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9uYXZpZ2F0aW9uL3RyYWlsUHJvY2Vzc29yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL2h0dHBDYWxsQnVpbGRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2Fic3RyYWN0VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvYW5kVmFsaWRhdG9yU2V0LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcmVnZXhWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lbWFpbFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VxdWFsc0Z1bmN0aW9uUmVzdWx0VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzUHJvcGVydHlWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNTdHJpbmdWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9vclZhbGlkYXRvclNldC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bhc3N3b3JkVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcGhvbmVsVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcmVxdWlyZWRWYWxpZGF0b3IuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIE1vZHVsZVJ1bm5lciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgICBydW5Nb2R1bGUodXJsKSB7XG4gICAgIH1cblxufSIsImltcG9ydCB7TGlzdCxNYXB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgVXJse1xuXG4gICAgY29uc3RydWN0b3IocHJvdG9jb2wsIGhvc3QsIHBvcnQsIHBhdGhWYWx1ZUxpc3QsIHBhcmFtZXRlclZhbHVlTWFwLCBib29rbWFyayl7XG4gICAgICAgIHRoaXMucHJvdG9jb2xTdHJpbmcgPSBwcm90b2NvbDtcbiAgICAgICAgdGhpcy5ob3N0U3RyaW5nID0gaG9zdDtcbiAgICAgICAgdGhpcy5wb3J0U3RyaW5nID0gcG9ydDtcbiAgICAgICAgdGhpcy5wYXRoVmFsdWVMaXN0ID0gcGF0aFZhbHVlTGlzdDtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJWYWx1ZU1hcCA9IHBhcmFtZXRlclZhbHVlTWFwO1xuICAgICAgICB0aGlzLmJvb2ttYXJrU3RyaW5nID0gYm9va21hcms7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMucGF0aFZhbHVlTGlzdCkge1xuICAgICAgICAgICAgdGhpcy5wYXRoVmFsdWVMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMucGFyYW1ldGVyVmFsdWVNYXApIHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVyVmFsdWVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgcHJvdG9jb2woKXtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvdG9jb2xTdHJpbmc7XG4gICAgfVxuXG4gICAgZ2V0IGhvc3QoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuaG9zdFN0cmluZztcbiAgICB9XG5cbiAgICBnZXQgcG9ydCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wb3J0U3RyaW5nO1xuICAgIH1cblxuICAgIGdldCBwYXRoc0xpc3QoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aFZhbHVlTGlzdDtcbiAgICB9XG5cbiAgICBnZXQgYm9va21hcmsoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYm9va21hcmtTdHJpbmc7XG4gICAgfVxuXG4gICAgZ2V0IHBhcmFtZXRlck1hcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyVmFsdWVNYXA7XG4gICAgfVxuXG4gICAgZ2V0UGF0aFBhcnQoaW5kZXgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wYXRoVmFsdWVMaXN0LmdldChpbmRleCk7XG4gICAgfVxuXG4gICAgZ2V0IHBhdGgoKXtcbiAgICAgICAgbGV0IHBhdGggPSBcIi9cIjtcbiAgICAgICAgbGV0IGZpcnN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wYXRoVmFsdWVMaXN0LmZvckVhY2goKHZhbHVlID0+IHtcbiAgICAgICAgICAgIGlmICghZmlyc3QpIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gcGF0aCArIFwiL1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGF0aCA9IHBhdGggKyB2YWx1ZTtcbiAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIH0pLCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuXG4gICAgZ2V0UGFyYW1ldGVyKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJhbWV0ZXJNYXAuZ2V0KGtleSk7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKXtcbiAgICAgICAgdmFyIHZhbHVlID0gXCJcIjtcbiAgICAgICAgaWYodGhpcy5wcm90b2NvbCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgdGhpcy5wcm90b2NvbCArIFwiLy9cIjtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLmhvc3QgIT09IG51bGwpe1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIHRoaXMuaG9zdDtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLnBvcnQgIT09IG51bGwpe1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIFwiOlwiICsgdGhpcy5wb3J0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wYXRoVmFsdWVMaXN0LmZvckVhY2goZnVuY3Rpb24ocGF0aFBhcnQscGFyZW50KXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIi9cIiArIHBhdGhQYXJ0O1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgdmFyIGZpcnN0UGFyYW1ldGVyID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcC5mb3JFYWNoKGZ1bmN0aW9uKHBhcmFtZXRlcktleSxwYXJhbWV0ZXJWYWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgaWYoZmlyc3RQYXJhbWV0ZXIpe1xuICAgICAgICAgICAgICAgIGZpcnN0UGFyYW1ldGVyPWZhbHNlO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIj9cIjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIiZcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBlbmNvZGVVUkkocGFyYW1ldGVyS2V5KSArIFwiPVwiICsgZW5jb2RlVVJJKHBhcmFtZXRlclZhbHVlKTtcbiAgICAgICAgfSx0aGlzKTtcblxuICAgICAgICBpZih0aGlzLmJvb2ttYXJrICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCIjXCIgKyB0aGlzLmJvb2ttYXJrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IExpc3QsIE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4vdXJsLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBVcmxVdGlscyB7XG5cbiAgICAvKipcbiAgICAgKiBQYXJzZSBzdHJpbmcgdG8gdXJsXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybFN0cmluZyBcbiAgICAgKiBAcmV0dXJucyB7VXJsfVxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZSh1cmxTdHJpbmcpIHtcbiAgICAgICAgXG4gICAgICAgIGxldCByZW1haW5pbmcgPSB7IFwic3RyaW5nXCIgOiB1cmxTdHJpbmcgfTtcblxuICAgICAgICBpZiAodXJsU3RyaW5nID09PSBudWxsKSB7IHJldHVybiBudWxsOyB9XG5cbiAgICAgICAgY29uc3QgcHJvdG9jb2wgPSAgICAgIFVybFV0aWxzLmRldGVybWluZVByb3RvY29sKHJlbWFpbmluZyk7XG4gICAgICAgIGNvbnN0IGhvc3RBbmRQb3J0ID0gICBVcmxVdGlscy5kZXRlcm1pbmVIb3N0QW5kUG9ydChyZW1haW5pbmcpO1xuICAgICAgICBjb25zdCBob3N0ID0gICAgICAgICAgVXJsVXRpbHMuZXh0cmFjdEhvc3QoaG9zdEFuZFBvcnQpO1xuICAgICAgICBjb25zdCBwb3J0ID0gICAgICAgICAgVXJsVXRpbHMuZXh0cmFjdFBvcnQoaG9zdEFuZFBvcnQpO1xuICAgICAgICBjb25zdCBwYXRoc0xpc3QgPSAgICAgVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aChyZW1haW5pbmcpO1xuICAgICAgICBjb25zdCBwYXJhbWV0ZXJzTWFwID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGFyYW1ldGVycyhyZW1haW5pbmcpO1xuICAgICAgICBjb25zdCBib29rbWFyayA9ICAgICAgVXJsVXRpbHMuZGV0ZXJtaW5lQm9va21hcmsocmVtYWluaW5nKTtcblxuICAgICAgICByZXR1cm4gbmV3IFVybChwcm90b2NvbCwgaG9zdCwgcG9ydCwgcGF0aHNMaXN0LCBwYXJhbWV0ZXJzTWFwLCBib29rbWFyayk7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZVByb3RvY29sKHJlbWFpbmluZyl7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJlbWFpbmluZ1tcInN0cmluZ1wiXTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwcm90b2NvbCA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh2YWx1ZS5pbmRleE9mKFwiLy9cIikgPT09IC0xKXtcbiAgICAgICAgICAgIC8vIE5vICcvLycgdG8gaW5kaWNhdGUgcHJvdG9jb2wgXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJ0cyA9IHZhbHVlLnNwbGl0KFwiLy9cIik7XG4gICAgICAgIGlmKHBhcnRzWzBdLmluZGV4T2YoXCIvXCIpICE9PSAtMSl7XG4gICAgICAgICAgICAvLyBzbGFzaCBzaG91bGQgbm90IGJlIGluIHByb3RvY29sXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RvY29sID0gcGFydHNbMF07XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT0gMSl7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gdmFsdWUucmVwbGFjZShwYXJ0c1swXSArIFwiLy9cIiwgXCJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvdG9jb2w7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZUhvc3RBbmRQb3J0KHJlbWFpbmluZyl7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJlbWFpbmluZ1tcInN0cmluZ1wiXTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBob3N0QW5kUG9ydCA9IHZhbHVlO1xuICAgICAgICBsZXQgcmVtYWluaW5nU3RyaW5nID0gbnVsbDtcblxuICAgICAgICBpZiAoaG9zdEFuZFBvcnQuaW5kZXhPZihcIi9cIikgIT09IC0xKSB7XG4gICAgICAgICAgICAvLyBIb3N0IGNvbWVzIGJlZm9yZSB0aGUgZmlyc3QgJy8nXG4gICAgICAgICAgICBob3N0QW5kUG9ydCA9IGhvc3RBbmRQb3J0LnNwbGl0KFwiL1wiKVswXTtcbiAgICAgICAgICAgIHJlbWFpbmluZ1N0cmluZyA9IHZhbHVlLnJlcGxhY2UoaG9zdEFuZFBvcnQgKyBcIi9cIiwgXCJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSByZW1haW5pbmdTdHJpbmc7XG4gICAgICAgIHJldHVybiBob3N0QW5kUG9ydDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZXh0cmFjdEhvc3QoaG9zdEFuZFBvcnQpe1xuICAgICAgICBpZiAoIWhvc3RBbmRQb3J0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZihob3N0QW5kUG9ydC5pbmRleE9mKFwiOlwiKSA9PT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGhvc3RBbmRQb3J0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBob3N0QW5kUG9ydC5zcGxpdChcIjpcIilbMF07XG4gICAgfVxuXG4gICAgc3RhdGljIGV4dHJhY3RQb3J0KGhvc3RBbmRQb3J0KXtcbiAgICAgICAgaWYgKCFob3N0QW5kUG9ydCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaG9zdEFuZFBvcnQuaW5kZXhPZihcIjpcIikgPT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBob3N0QW5kUG9ydC5zcGxpdChcIjpcIilbMV07XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZVBhdGgocmVtYWluaW5nKXtcbiAgICAgICAgbGV0IHZhbHVlID0gcmVtYWluaW5nW1wic3RyaW5nXCJdO1xuXG4gICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTGlzdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHBhdGggPSB2YWx1ZTtcblxuICAgICAgICBpZiAocGF0aC5pbmRleE9mKFwiP1wiKSAhPT0gLTEpe1xuICAgICAgICAgICAgbGV0IHBhcnRzID0gcGF0aC5zcGxpdChcIj9cIik7XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IHBhdGguc3Vic3RyaW5nKHBhdGguaW5kZXhPZihcIj9cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGF0aCA9IHBhcnRzWzBdO1xuXG4gICAgICAgIH0gZWxzZSBpZiAocGF0aC5pbmRleE9mKFwiI1wiKSAhPT0gLTEpe1xuICAgICAgICAgICAgbGV0IHBhcnRzID0gcGF0aC5zcGxpdChcIiNcIik7XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IHBhdGguc3Vic3RyaW5nKHBhdGguaW5kZXhPZihcIiNcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGF0aCA9IHBhcnRzWzBdO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aChcIi9cIikpIHtcbiAgICAgICAgICAgIHBhdGggPSB2YWx1ZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByYXdQYXRoUGFydExpc3QgPSBuZXcgTGlzdChwYXRoLnNwbGl0KFwiL1wiKSk7XG5cbiAgICAgICAgY29uc3QgcGF0aFZhbHVlTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHJhd1BhdGhQYXJ0TGlzdC5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgcGF0aFZhbHVlTGlzdC5hZGQoZGVjb2RlVVJJKHZhbHVlKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHBhdGhWYWx1ZUxpc3Q7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZVBhcmFtZXRlcnMocmVtYWluaW5nKXtcbiAgICAgICAgY29uc3QgdmFsdWUgPSByZW1haW5pbmdbXCJzdHJpbmdcIl07XG5cbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXAoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJhbWV0ZXJzID0gdmFsdWU7XG5cbiAgICAgICAgaWYocGFyYW1ldGVycy5pbmRleE9mKFwiP1wiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWFwKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyYW1ldGVycyA9IHBhcmFtZXRlcnMuc3Vic3RyaW5nKHBhcmFtZXRlcnMuaW5kZXhPZihcIj9cIikrMSk7XG4gICAgICAgIGlmKHBhcmFtZXRlcnMuaW5kZXhPZihcIiNcIikgIT09IC0xKSB7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBwYXJhbWV0ZXJzLnN1YnN0cmluZyhwYXJhbWV0ZXJzLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgICAgIHBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzLnN1YnN0cmluZygwLHBhcmFtZXRlcnMuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmFtZXRlclBhcnRMaXN0ID0gbmV3IExpc3QocGFyYW1ldGVycy5zcGxpdChcIiZcIikpO1xuICAgICAgICBjb25zdCBwYXJhbWV0ZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHBhcmFtZXRlclBhcnRMaXN0LmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBsZXQga2V5VmFsdWUgPSB2YWx1ZS5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICBpZihrZXlWYWx1ZS5sZW5ndGggPj0gMil7XG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyTWFwLnNldChkZWNvZGVVUkkoa2V5VmFsdWVbMF0pLGRlY29kZVVSSShrZXlWYWx1ZVsxXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBwYXJhbWV0ZXJNYXA7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZUJvb2ttYXJrKHJlbWFpbmluZyl7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJlbWFpbmluZ1tcInN0cmluZ1wiXTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYm9va21hcmsgPSB2YWx1ZTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIiNcIikgIT09IC0xKSB7XG4gICAgICAgICAgICBib29rbWFyayA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiI1wiKSsxKTtcbiAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJvb2ttYXJrO1xuICAgIH1cblxuXG59IiwiaW1wb3J0IHsgQ29udGFpbmVyVXJsIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgVXJsVXRpbHMgfSBmcm9tIFwiLi4vdXRpbC91cmxVdGlscy5qc1wiO1xuXG5leHBvcnQgY2xhc3MgSGlzdG9yeSB7XG5cbiAgICBzdGF0aWMgcmVwbGFjZVVybCh1cmwsIHRpdGxlLCBzdGF0ZU9iamVjdCkge1xuICAgICAgICBDb250YWluZXJVcmwucmVwbGFjZVVybCh1cmwudG9TdHJpbmcoKSwgdGl0bGUsIHN0YXRlT2JqZWN0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcHVzaFVybCh1cmwsIHRpdGxlLCBzdGF0ZU9iamVjdCkge1xuICAgICAgICBDb250YWluZXJVcmwucHVzaFVybCh1cmwudG9TdHJpbmcoKSwgdGl0bGUsIHN0YXRlT2JqZWN0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3VycmVudFVybCgpIHtcbiAgICAgICAgcmV0dXJuIFVybFV0aWxzLnBhcnNlKENvbnRhaW5lclVybC5jdXJyZW50VXJsKCkpO1xuICAgIH1cblxufSIsImltcG9ydCB7IExpc3QsIE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4vdXJsLmpzXCI7XG5pbXBvcnQgeyBVcmxVdGlscyB9IGZyb20gXCIuL3VybFV0aWxzLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBVcmxCdWlsZGVyIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnByb3RvY29sID0gbnVsbDtcbiAgICAgICAgdGhpcy5ob3N0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3J0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5wYXRoc0xpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuYm9va21hcmsgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHN0YXRpYyBidWlsZGVyKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVybEJ1aWxkZXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgICB3aXRoVXJsKHVybCkge1xuICAgICAgICB0aGlzLndpdGhBbGxPZlVybChVcmxVdGlscy5wYXJzZSh1cmwpKVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgICB3aXRoUm9vdE9mVXJsKHVybCkge1xuICAgICAgICB0aGlzLnByb3RvY29sID0gdXJsLnByb3RvY29sO1xuICAgICAgICB0aGlzLnBvcnQgPSB1cmwucG9ydDtcbiAgICAgICAgdGhpcy5ob3N0ID0gdXJsLmhvc3Q7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMge1VybEJ1aWxkZXJ9XG4gICAgICovXG4gICAgIHdpdGhQYXRoT2ZVcmwodXJsKSB7XG4gICAgICAgIHRoaXMud2l0aFJvb3RPZlVybCh1cmwpO1xuICAgICAgICB0aGlzLnBhdGhzTGlzdCA9IHVybC5wYXRoc0xpc3Q7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMge1VybEJ1aWxkZXJ9XG4gICAgICovXG4gICAgd2l0aEFsbE9mVXJsKHVybCkge1xuICAgICAgICB0aGlzLndpdGhQYXRoT2ZVcmwodXJsKTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzTWFwID0gdXJsLnBhcmFtZXRlck1hcDtcbiAgICAgICAgdGhpcy5ib29rbWFyayA9IHVybC5ib29rbWFyaztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHByb3RvY29sIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhQcm90b2NvbChwcm90b2NvbCkge1xuICAgICAgICB0aGlzLnByb3RvY29sID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aCh7IFwic3RyaW5nXCIgOiBwcm90b2NvbCB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGhvc3QgXG4gICAgICogQHJldHVybnMge1VybEJ1aWxkZXJ9XG4gICAgICovXG4gICAgd2l0aEhvc3QoaG9zdCkge1xuICAgICAgICB0aGlzLmhvc3QgPSBVcmxVdGlscy5kZXRlcm1pbmVQYXRoKHsgXCJzdHJpbmdcIiA6IGhvc3QgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhQYXRoKHBhdGgpIHtcbiAgICAgICAgdGhpcy5wYXRoc0xpc3QgPSBVcmxVdGlscy5kZXRlcm1pbmVQYXRoKHsgXCJzdHJpbmdcIiA6IHBhdGggfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbWV0ZXJzIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhQYXJhbWV0ZXJzKHBhcmFtZXRlcnMpIHtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzTWFwID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aCh7IFwic3RyaW5nXCIgOiBwYXJhbWV0ZXJzIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYm9va21hcmsgXG4gICAgICogQHJldHVybnMge1VybEJ1aWxkZXJ9XG4gICAgICovXG4gICAgd2l0aEJvb2ttYXJrKGJvb2ttYXJrKSB7XG4gICAgICAgIHRoaXMuYm9va21hcmsgPSBVcmxVdGlscy5kZXRlcm1pbmVCb29rbWFyayh7IFwic3RyaW5nXCIgOiBib29rbWFyayB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVXJsKHRoaXMucHJvdG9jb2wsIHRoaXMuaG9zdCwgdGhpcy5wb3J0LCB0aGlzLnBhdGhzTGlzdCwgdGhpcy5wYXJhbWV0ZXJzTWFwLCB0aGlzLmJvb2ttYXJrKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgSGlzdG9yeSB9IGZyb20gXCIuL2hpc3RvcnkuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgQ29udGFpbmVyVXJsIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgVXJsQnVpbGRlciB9IGZyb20gXCIuLi91dGlsL3VybEJ1aWxkZXIuanNcIjtcblxubGV0IG5hdmlnYXRvaW9uID0gbnVsbDtcblxuZXhwb3J0IGNsYXNzIE5hdmlnYXRpb24ge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7TmF2aWdhdGlvbn1cbiAgICAgKi9cbiAgICBzdGF0aWMgaW5zdGFuY2UoKSB7XG4gICAgICAgIGlmICghbmF2aWdhdG9pb24pIHtcbiAgICAgICAgICAgIG5hdmlnYXRvaW9uID0gbmV3IE5hdmlnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmF2aWdhdG9pb247XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTmF2aWdhdGUgYnJvd3NlciB0byBuZXcgdXJsXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBnbyh1cmwpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLmdvKHVybC50b1N0cmluZygpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOYXZpZ2F0ZSBicm93c2VyIGJhY2tcbiAgICAgKi9cbiAgICBiYWNrKCkge1xuICAgICAgICBDb250YWluZXJVcmwuYmFjaygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvYWQgcGF0aCB3aXRob3V0IHJlbmF2aWdhdGluZyBicm93c2VyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICAgKiBAcmV0dXJucyB7VXJsfVxuICAgICAqL1xuICAgIGxvYWQocGF0aCkge1xuICAgICAgICBjb25zdCB1cmwgPSBIaXN0b3J5LmN1cnJlbnRVcmwoKTtcbiAgICAgICAgY29uc3QgbmV3VXJsID0gVXJsQnVpbGRlci5idWlsZGVyKCkud2l0aFJvb3RPZlVybCh1cmwpLndpdGhQYXRoKHBhdGgpLmJ1aWxkKCk7XG4gICAgICAgIEhpc3RvcnkucHVzaFVybChuZXdVcmwpO1xuICAgICAgICByZXR1cm4gbmV3VXJsO1xuICAgIH1cblxufSIsImltcG9ydCB7IE1vZHVsZVJ1bm5lciB9IGZyb20gXCIuL21vZHVsZVJ1bm5lci5qc1wiO1xuaW1wb3J0IHsgTmF2aWdhdGlvbiB9IGZyb20gXCIuL25hdmlnYXRpb24vbmF2aWdhdGlvbi5qc1wiO1xuXG5sZXQgYWN0aXZlTW9kdWxlUnVubmVyID0gbnVsbDtcblxuZXhwb3J0IGNsYXNzIEFjdGl2ZU1vZHVsZVJ1bm5lciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvKiogQHR5cGUge01vZHVsZVJ1bm5lcn0gKi9cbiAgICAgICAgdGhpcy5tb2R1bGVSdW5uZXIgPSBudWxsO1xuICAgIH1cblxuICAgIHN0YXRpYyBpbnN0YW5jZSgpIHtcbiAgICAgICAgaWYgKCFhY3RpdmVNb2R1bGVSdW5uZXIpIHtcbiAgICAgICAgICAgIGFjdGl2ZU1vZHVsZVJ1bm5lciA9IG5ldyBBY3RpdmVNb2R1bGVSdW5uZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWN0aXZlTW9kdWxlUnVubmVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TW9kdWxlUnVubmVyfSBuZXdNb2R1bGVSdW5uZXIgXG4gICAgICovXG4gICAgc2V0KG5ld01vZHVsZVJ1bm5lcikge1xuICAgICAgICB0aGlzLm1vZHVsZVJ1bm5lciA9IG5ld01vZHVsZVJ1bm5lcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHBhdGggd2l0aG91dCByZW5hdmlnYXRpbmcgYnJvd3NlclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFxuICAgICAqL1xuICAgICBsb2FkKHBhdGgpIHtcbiAgICAgICAgY29uc3QgdXJsID0gTmF2aWdhdGlvbi5pbnN0YW5jZSgpLmxvYWQocGF0aCk7XG4gICAgICAgIHRoaXMubW9kdWxlUnVubmVyLnJ1bk1vZHVsZSh1cmwpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBDb250YWluZXJIdHRwQ2xpZW50IH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuXG5leHBvcnQgY2xhc3MgQ2xpZW50IHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXQodXJsLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDAsIGF1dGhvcml6YXRpb24gPSBudWxsKXtcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xuICAgICAgICB2YXIgcGFyYW1zID0gIHtcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCkscGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxuICAgICAqL1xuICAgIHN0YXRpYyBwb3N0KHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XG4gICAgICAgIGxldCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgbW9kZTogXCJjb3JzXCIsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxuICAgICAgICAgICAgcmVkaXJlY3Q6IFwiZm9sbG93XCIsIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ29udGFpbmVySHR0cENsaWVudC5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBkYXRhXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxuICAgICAqL1xuICAgIHN0YXRpYyBwdXQodXJsLCBkYXRhLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDAsIGF1dGhvcml6YXRpb24gPSBudWxsKXtcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xuICAgICAgICB2YXIgcGFyYW1zID0gIHtcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxuICAgICAgICAgICAgbWV0aG9kOiAnUFVUJywgXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGF0Y2godXJsLCBkYXRhLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDAsIGF1dGhvcml6YXRpb24gPSBudWxsKXtcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xuICAgICAgICB2YXIgcGFyYW1zID0gIHtcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxuICAgICAgICAgICAgbWV0aG9kOiAnUEFUQ0gnLCBcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ29udGFpbmVySHR0cENsaWVudC5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxuICAgICAqL1xuICAgIHN0YXRpYyBkZWxldGUodXJsLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDApe1xuICAgICAgICB2YXIgcGFyYW1zID0gIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ29udGFpbmVySHR0cENsaWVudC5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCBjb25uZWN0aW9uVGltZW91dCwgcmVzcG9uc2VUaW1lb3V0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24gPSBudWxsKSB7XG4gICAgICAgIGxldCBoZWFkZXJzID0ge1xuICAgICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFwiTW96aWxsYS80LjAgTUROIEV4YW1wbGVcIixcbiAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgICAgIH07XG4gICAgICAgIGlmIChhdXRob3JpemF0aW9uKSB7XG4gICAgICAgICAgICBoZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBcIk1vemlsbGEvNC4wIE1ETiBFeGFtcGxlXCIsXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICAgICAgXCJBdXRob3JpemF0aW9uXCI6IGF1dGhvcml6YXRpb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGVhZGVycztcbiAgICB9XG59IiwiZXhwb3J0IGNsYXNzIFN0eWxlc3tcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdHlsZXNTb3VyY2UgXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc3R5bGVzU291cmNlKXtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5zdHlsZXNTb3VyY2UgPSBzdHlsZXNTb3VyY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRTdHlsZXNTb3VyY2UoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzU291cmNlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge01hcCwgTG9nZ2VyLCBPYmplY3RGdW5jdGlvbn0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XG5pbXBvcnQgeyBVcmxVdGlscyB9IGZyb20gXCIuLi91dGlsL3VybFV0aWxzLmpzXCI7XG5pbXBvcnQgeyBTdHlsZXMgfSBmcm9tIFwiLi9zdHlsZXMuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlN0eWxlc1JlZ2lzdHJ5XCIpO1xuXG5leHBvcnQgY2xhc3MgU3R5bGVzUmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnN0eWxlc1VybE1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge2ludGVnZXJ9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzUXVldWVTaXplID0gMDtcblxuICAgICAgICAvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1N0eWxlc30gc3R5bGVzIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgc2V0KG5hbWUsc3R5bGVzLHVybCl7XG4gICAgICAgIGlmKHVybCAhPT0gdW5kZWZpbmVkICYmIHVybCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5zdHlsZXNVcmxNYXAuc2V0KG5hbWUsIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdHlsZXNNYXAuc2V0KG5hbWUsIHN0eWxlcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICovXG4gICAgZ2V0KG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNNYXAuZ2V0KG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGNvbnRhaW5zKG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNNYXAuY29udGFpbnMobmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgZG9uZShjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3R5bGVzUmVnaXN0cnl9IHJlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGRvQ2FsbGJhY2socmVnaXN0cnkpe1xuICAgICAgICBpZih0bW8uY2FsbGJhY2sgIT09IG51bGwgJiYgcmVnaXN0cnkuY2FsbGJhY2sgIT09IHVuZGVmaW5lZCAgJiYgcmVnaXN0cnkuc3R5bGVzUXVldWVTaXplID09PSByZWdpc3RyeS5zdHlsZXNNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBDYWxsYmFjay5jYWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgICBsb2FkKG5hbWUsIHVybCkge1xuICAgICAgICB0aGlzLnN0eWxlc1F1ZXVlU2l6ZSArKztcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHN0eWxlcyBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFN0eWxlcyh0ZXh0KSx1cmwpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvQ2FsbGJhY2sodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBuYW1lVXJsTWFwIFxuICAgICAqL1xuICAgIGdldFN0eWxlc0xvYWRlZFByb21pc2UobmFtZVVybE1hcCkge1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdmFyIGxvYWRlZCA9IDA7XG4gICAgICAgICAgICBpZighbmFtZVVybE1hcCB8fCBuYW1lVXJsTWFwLnNpemUoKSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG5hbWVVcmxNYXAuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYodGhpcy5jb250YWlucyhrZXkpKXtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkICsrO1xuICAgICAgICAgICAgICAgICAgICBpZihsb2FkZWQgPT0gbmFtZVVybE1hcC5zaXplKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnByaXZhdGVMb2FkKGtleSwgVXJsVXRpbHMucGFyc2UodmFsdWUpKVxuXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChyZWFzb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sdGhpcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgcHJpdmF0ZUxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIExPRy5pbmZvKFwiTG9hZGluZyBzdHlsZXMgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmwudG9TdHJpbmcoKSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBcIlVuYWJsZSB0byBsb2FkIHN0eWxlcyBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFN0eWxlcyh0ZXh0KSx1cmwpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufSIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRle1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRlbXBsYXRlU291cmNlIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRlbXBsYXRlU291cmNlKXtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVNvdXJjZSA9IHRlbXBsYXRlU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0VGVtcGxhdGVTb3VyY2UoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVTb3VyY2U7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TWFwLCBMb2dnZXIsIE9iamVjdEZ1bmN0aW9ufSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7VGVtcGxhdGV9IGZyb20gXCIuL3RlbXBsYXRlLmpzXCI7XG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XG5pbXBvcnQgeyBVcmxVdGlscyB9IGZyb20gXCIuLi91dGlsL3VybFV0aWxzLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJUZW1wbGF0ZVJlZ2lzdHJ5XCIpO1xuXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVSZWdpc3RyeSB7XG5cbiAgICBjb25zdHJ1Y3Rvcigpe1xuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZU1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVVybE1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge2ludGVnZXJ9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVRdWV1ZVNpemUgPSAwO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7T2JqZWN0RnVuY3Rpb259ICovXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ID0gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VQcmVmaXggXG4gICAgICovXG4gICAgc2V0TGFuZ3VhZ2VQcmVmaXgobGFuZ3VhZ2VQcmVmaXgpIHtcbiAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCA9IGxhbmd1YWdlUHJlZml4O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGV9IHRlbXBsYXRlIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgc2V0KG5hbWUsdGVtcGxhdGUsdXJsKXtcbiAgICAgICAgaWYodXJsICE9PSB1bmRlZmluZWQgJiYgdXJsICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlVXJsTWFwLnNldChuYW1lLCB1cmwpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGVtcGxhdGVNYXAuc2V0KG5hbWUsIHRlbXBsYXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKi9cbiAgICBnZXQobmFtZSl7XG4gICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlTWFwLmdldChuYW1lKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKi9cbiAgICBjb250YWlucyhuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVNYXAuY29udGFpbnMobmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgZG9uZShjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGVSZWdpc3RyeX0gcmVnaXN0cnkgXG4gICAgICovXG4gICAgZG9DYWxsYmFjayhyZWdpc3RyeSl7XG4gICAgICAgIGlmKHRtby5jYWxsYmFjayAhPT0gbnVsbCAmJiByZWdpc3RyeS5jYWxsYmFjayAhPT0gdW5kZWZpbmVkICAmJiByZWdpc3RyeS50ZW1wbGF0ZVF1ZXVlU2l6ZSA9PT0gcmVnaXN0cnkudGVtcGxhdGVNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBDYWxsYmFjay5jYWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIGlmKHRoaXMubGFuZ3VhZ2VQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVybC5wYXRoc0xpc3Quc2V0TGFzdChcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ICsgXCIuXCIgK1xuICAgICAgICAgICAgICAgIHVybC5wYXRoc0xpc3QuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGVtcGxhdGVRdWV1ZVNpemUgKys7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFRlbXBsYXRlKHRleHQpLHVybCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBuYW1lVXJsTWFwIFxuICAgICAqL1xuICAgIGdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UobmFtZVVybE1hcCkge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpID0+IHtcbiAgICAgICAgICAgIHZhciBsb2FkZWQgPSAwO1xuICAgICAgICAgICAgaWYoIW5hbWVVcmxNYXAgfHwgbmFtZVVybE1hcC5zaXplKCkgPT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuYW1lVXJsTWFwLmZvckVhY2goKGtleSwgdmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuY29udGFpbnMoa2V5KSl7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcbiAgICAgICAgICAgICAgICAgICAgaWYobG9hZGVkID09IG5hbWVVcmxNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wcml2YXRlTG9hZChrZXksIFVybFV0aWxzLnBhcnNlKHZhbHVlKSlcblxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQgKys7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihsb2FkZWQgPT0gbmFtZVVybE1hcC5zaXplKCkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgocmVhc29uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QocmVhc29uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LHRoaXMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIHByaXZhdGVMb2FkKG5hbWUsIHVybCkge1xuICAgICAgICBpZih0aGlzLmxhbmd1YWdlUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1cmwucGF0aHNMaXN0LnNldExhc3QoXG4gICAgICAgICAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCArIFwiLlwiICtcbiAgICAgICAgICAgICAgICB1cmwucGF0aHNMaXN0LmdldExhc3QoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBMT0cuaW5mbyhcIkxvYWRpbmcgdGVtcGxhdGUgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmwudG9TdHJpbmcoKSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2xzZSkgPT4ge1xuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFRlbXBsYXRlKHRleHQpLHVybCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sc2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59IiwiaW1wb3J0IHsgTG9nZ2VyLCBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENvbmZpZywgVHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlRlbXBsYXRlUG9zdENvbmZpZ1wiKTtcblxuLyoqXG4gKiBUbyBiZSBhZGRlZCB0byBtaW5kaSBhcyBhIHNpbmdsZXRvbi4gV2lsbCBzY2FuIHRocm91Z2ggYWxsIGNvbmZpZ3VyZWQgY2xhc3NlcyB0aGF0IGhhdmUgYSBURU1QTEFURV9VUkwgYW5kIENPTVBPTkVOVF9OQU1FXG4gKiBzdGF0aWMgZ2V0dGVyIGFuZCB3aWxsIGFzeW5jcm9ub3VzbHkgbG9hZCB0aGVtLiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCByZXNvbHZlcyB3aGVuIGFsbCB0ZW1wbGF0ZXMgYXJlIGxvYWRlZFxuICovXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVzTG9hZGVyIHtcblxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZVJlZ2lzdHJ5fSB0ZW1wbGF0ZVJlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRlbXBsYXRlUmVnaXN0cnkpIHtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gdGVtcGxhdGVSZWdpc3RyeTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcH0gY29uZmlnRW50cmllc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGxvYWQoY29uZmlnRW50cmllcykge1xuICAgICAgICBsZXQgdGVtcGxhdGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIGNvbmZpZ0VudHJpZXMuZm9yRWFjaCgoa2V5LCBjb25maWdFbnRyeSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICBpZihjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5URU1QTEFURV9VUkwgJiYgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZU1hcC5zZXQoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUsIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlRFTVBMQVRFX1VSTCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7IFxuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UodGVtcGxhdGVNYXApO1xuICAgIH1cblxufSIsImltcG9ydCB7IExvZ2dlciwgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzUmVnaXN0cnkuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlN0eWxlc0xvYWRlclwiKTtcblxuLyoqXG4gKiBUbyBiZSBhZGRlZCB0byBtaW5kaSBhcyBhIHNpbmdsZXRvbi4gV2lsbCBzY2FuIHRocm91Z2ggYWxsIGNvbmZpZ3VyZWQgY2xhc3NlcyB0aGF0IGhhdmUgYSBTVFlMRVNfVVJMIGFuZCBDT01QT05FTlRfTkFNRVxuICogc3RhdGljIGdldHRlciBhbmQgd2lsbCBhc3luY3Jvbm91c2x5IGxvYWQgdGhlbS4gUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiBhbGwgc3R5bGVzIGFyZSBsb2FkZWRcbiAqL1xuZXhwb3J0IGNsYXNzIFN0eWxlc0xvYWRlciB7XG5cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3R5bGVzUmVnaXN0cnl9IHN0eWxlc1JlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHN0eWxlc1JlZ2lzdHJ5KSB7XG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBzdHlsZXNSZWdpc3RyeTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcH0gY29uZmlnRW50cmllc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGxvYWQoY29uZmlnRW50cmllcykge1xuICAgICAgICBsZXQgc3R5bGVzTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICBjb25maWdFbnRyaWVzLmZvckVhY2goKGtleSwgY29uZmlnRW50cnksIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgaWYoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuU1RZTEVTX1VSTCAmJiBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5DT01QT05FTlRfTkFNRSkge1xuICAgICAgICAgICAgICAgIHN0eWxlc01hcC5zZXQoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUsIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlNUWUxFU19VUkwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpOyBcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0U3R5bGVzTG9hZGVkUHJvbWlzZShzdHlsZXNNYXApO1xuICAgIH1cblxufSIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ29uZmlnLCBJbmplY3Rpb25Qb2ludCwgVHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlc0xvYWRlciB9IGZyb20gXCIuLi90ZW1wbGF0ZS90ZW1wbGF0ZXNMb2FkZXIuanNcIjtcbmltcG9ydCB7IFN0eWxlc0xvYWRlciB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzTG9hZGVyLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJDb21wb25lbnRDb25maWdQcm9jZXNzb3JcIilcblxuLyoqXG4gKiBNaW5kaSBjb25maWcgcHJvY2Vzc29yIHdoaWNoIGxvYWRzIGFsbCB0ZW1wbGF0ZXMgYW5kIHN0eWxlcyBmb3IgYWxsIGNvbmZpZ3VyZWQgY29tcG9uZW50c1xuICogYW5kIHRoZW4gY2FsbHMgYW55IGV4aXN0aW5nIGNvbXBvbmVudExvYWRlZCBmdW5jdGlvbiBvbiBlYWNoIGNvbXBvbmVudFxuICovXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50Q29uZmlnUHJvY2Vzc29yIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFRlbXBsYXRlUmVnaXN0cnkpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7U3R5bGVzUmVnaXN0cnl9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLnN0eWxlc1JlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoU3R5bGVzUmVnaXN0cnkpO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICovXG4gICAgcG9zdENvbmZpZygpe1xuICAgICAgICB0aGlzLnRlbXBsYXRlc0xvYWRlciA9IG5ldyBUZW1wbGF0ZXNMb2FkZXIodGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5KTtcbiAgICAgICAgdGhpcy5zdHlsZXNMb2FkZXIgPSBuZXcgU3R5bGVzTG9hZGVyKHRoaXMuc3R5bGVzUmVnaXN0cnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7Q29uZmlnfSBjb25maWdcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBwcm9jZXNzQ29uZmlnKGNvbmZpZywgdW5jb25maWd1cmVkQ29uZmlnRW50cmllcykge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgICAgIFsgXG4gICAgICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZXNMb2FkZXIubG9hZCh1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSwgXG4gICAgICAgICAgICAgICAgdGhpcy5zdHlsZXNMb2FkZXIubG9hZCh1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSBcbiAgICAgICAgICAgIF1cbiAgICAgICAgKTtcbiAgICB9XG5cbn0iLCJleHBvcnQgY2xhc3MgQXR0cmlidXRlIHtcblxuICAgIGNvbnN0cnVjdG9yKGF0dHJpYnV0ZSkge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZSA9IGF0dHJpYnV0ZTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS52YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlLm5hbWU7XG4gICAgfVxuXG4gICAgZ2V0IG5hbWVzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlLm5hbWU7XG4gICAgfVxufSIsImltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBNYXAsIExvZ2dlciwgTGlzdCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ29udGFpbmVyRWxlbWVudCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IEF0dHJpYnV0ZSB9IGZyb20gXCIuL2F0dHJpYnV0ZS5qc1wiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi4vZXZlbnQvZXZlbnQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkJhc2VFbGVtZW50XCIpO1xuXG4vKipcbiAqIEEgYmFzZSBjbGFzcyBmb3IgZW5jbG9zaW5nIGFuIEhUTUxFbGVtZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlRWxlbWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fHN0cmluZ3xhbnl9IHZhbHVlIFZhbHVlIHRvIGJlIGNvbnZlcnRlZCB0byBDb250YWluZXIgVUkgRWxlbWVudCAoSFRNTEVsZW1lbnQgaW4gdGhlIGNhc2Ugb2YgV2ViIEJyb3dzZXIpXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IHRoZSBwYXJlbnQgQmFzZUVsZW1lbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIFxuICAgICAgICAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG51bGw7XG4gICAgICAgIHRoaXMuZXZlbnRzQXR0YWNoZWQgPSBuZXcgTGlzdCgpO1xuICAgICAgICBcbiAgICAgICAgaWYodmFsdWUgaW5zdGFuY2VvZiBYbWxFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLmNyZWF0ZUZyb21YbWxFbGVtZW50KHZhbHVlLCBwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50LmNyZWF0ZUVsZW1lbnQodmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKENvbnRhaW5lckVsZW1lbnQuaXNVSUVsZW1lbnQodmFsdWUpKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIExPRy5lcnJvcihcIlVucmVjb2duaXplZCB2YWx1ZSBmb3IgRWxlbWVudFwiKTtcbiAgICAgICAgTE9HLmVycm9yKHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2FkQXR0cmlidXRlcygpIHtcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzID09PSBudWxsIHx8IHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmF0dHJpYnV0ZU1hcCA9PT0gbnVsbCB8fCB0aGlzLmF0dHJpYnV0ZU1hcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5lbGVtZW50LmF0dHJpYnV0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcC5zZXQodGhpcy5lbGVtZW50LmF0dHJpYnV0ZXNbaV0ubmFtZSxuZXcgQXR0cmlidXRlKHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzW2ldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgYnJvd3NlciBFbGVtZW50IGZyb20gdGhlIFhtbEVsZW1lbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0geG1sRWxlbWVudFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudEVsZW1lbnRcbiAgICAgKiBAcmV0dXJuIHtIVE1MRWxlbWVudH1cbiAgICAgKi9cbiAgICBjcmVhdGVGcm9tWG1sRWxlbWVudCh4bWxFbGVtZW50LCBwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIGxldCBlbGVtZW50ID0gbnVsbDtcbiAgICAgICAgaWYoeG1sRWxlbWVudC5uYW1lc3BhY2Upe1xuICAgICAgICAgICAgZWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnQuY3JlYXRlRWxlbWVudE5TKHhtbEVsZW1lbnQubmFtZXNwYWNlVXJpLCB4bWxFbGVtZW50LmZ1bGxOYW1lKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBlbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudC5jcmVhdGVFbGVtZW50KHhtbEVsZW1lbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYocGFyZW50RWxlbWVudCAmJiBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuYXBwZW5kQ2hpbGQocGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50LCBlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICB4bWxFbGVtZW50LmF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cmlidXRlS2V5LCBhdHRyaWJ1dGUpID0+IHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuc2V0QXR0cmlidXRlKGVsZW1lbnQsIGF0dHJpYnV0ZUtleSwgYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIGEgZnVuY3Rpb24gdG8gYW4gZXZlbnQgaW4gdGhlIGVuY2xvc2VkIGVsZW1lbnQgaWYgbm9uZSBhbGxyZWFkeSBleGlzdHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmdW5jdGlvblBhcmFtXG4gICAgICogQHBhcmFtIHtib29sZWFufSBjYXB0dXJlXG4gICAgICovXG4gICAgYXR0YWNoRXZlbnQoZXZlbnRUeXBlLCBmdW5jdGlvblBhcmFtLCBjYXB0dXJlID0gZmFsc2UpIHtcbiAgICAgICAgaWYoIXRoaXMuZXZlbnRzQXR0YWNoZWQuY29udGFpbnMoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgaWYoZXZlbnRUeXBlLnN0YXJ0c1dpdGgoXCJvblwiKSkge1xuICAgICAgICAgICAgICAgIGV2ZW50VHlwZSA9IGV2ZW50VHlwZS5zdWJzdHIoMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBDb250YWluZXJFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIodGhpcy5lbGVtZW50LCBldmVudFR5cGUsIGZ1bmN0aW9uUGFyYW0sIGNhcHR1cmUpO1xuICAgICAgICAgICAgdGhpcy5ldmVudHNBdHRhY2hlZC5hZGQoZXZlbnRUeXBlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIExPRy53YXJuKFwiRXZlbnQgJ1wiICsgZXZlbnRUeXBlICsgXCInIGFsbHJlYWR5IGF0dGFjaGVkIGZvciBcIiArIHRoaXMuZWxlbWVudC5uYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxpc3RlblRvKGV2ZW50VHlwZSwgbGlzdGVuZXIsIGNhcHR1cmUpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHRoaXMuZWxlbWVudCwgZXZlbnRUeXBlLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGxpc3RlbmVyLmNhbGwobmV3IEV2ZW50KGV2ZW50KSk7XG4gICAgICAgIH0sIGNhcHR1cmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgZW5jbG9zZWQgZWxlbWVudFxuICAgICAqXG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgZ2V0IG1hcHBlZEVsZW1lbnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG4gICAgZ2V0IGZ1bGxOYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnRhZ05hbWU7XG4gICAgfVxuXG4gICAgZ2V0IHRvcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG4gICAgfVxuXG4gICAgZ2V0IGJvdHRvbSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5ib3R0b207XG4gICAgfVxuXG4gICAgZ2V0IGxlZnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdDtcbiAgICB9XG5cbiAgICBnZXQgcmlnaHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkucmlnaHQ7XG4gICAgfVxuXG4gICAgZ2V0IHdpZHRoKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgIH1cblxuICAgIGdldCBoZWlnaHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIH1cblxuICAgIGdldCBhdHRyaWJ1dGVzKCkge1xuICAgICAgICB0aGlzLmxvYWRBdHRyaWJ1dGVzKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZU1hcDtcbiAgICB9XG5cbiAgICBzZXRBdHRyaWJ1dGVWYWx1ZShrZXksdmFsdWUpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5zZXRBdHRyaWJ1dGUodGhpcy5lbGVtZW50LCBrZXksdmFsdWUpO1xuICAgIH1cblxuICAgIGdldEF0dHJpYnV0ZVZhbHVlKGtleSkge1xuICAgICAgICByZXR1cm4gQ29udGFpbmVyRWxlbWVudC5nZXRBdHRyaWJ1dGUodGhpcy5lbGVtZW50LCBrZXkpO1xuICAgIH1cblxuICAgIGNvbnRhaW5zQXR0cmlidXRlKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lmhhc0F0dHJpYnV0ZShrZXkpO1xuICAgIH1cblxuICAgIHJlbW92ZUF0dHJpYnV0ZShrZXkpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgIH1cblxuICAgIHNldFN0eWxlKGtleSx2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGVba2V5XSA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldFN0eWxlKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnN0eWxlW2tleV07XG4gICAgfVxuXG4gICAgcmVtb3ZlU3R5bGUoa2V5KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVtrZXldID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZXQoaW5wdXQpIHtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50LnBhcmVudE5vZGUgPT09IG51bGwpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlRoZSBlbGVtZW50IGhhcyBubyBwYXJlbnQsIGNhbiBub3Qgc3dhcCBpdCBmb3IgdmFsdWVcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQubWFwcGVkRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0Lm1hcHBlZEVsZW1lbnQsIHRoaXMuZWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQgJiYgaW5wdXQucm9vdEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gaW5wdXQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZih0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKENvbnRhaW5lckVsZW1lbnQuY3JlYXRlVGV4dE5vZGUoaW5wdXQpLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNNb3VudGVkKCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldENoaWxkKGlucHV0KSB7XG4gICAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5hZGRDaGlsZChpbnB1dCk7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgaWYgKGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dC5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgJiYgaW5wdXQucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChDb250YWluZXJFbGVtZW50LmNyZWF0ZVRleHROb2RlKGlucHV0KSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJlcGVuZENoaWxkKGlucHV0KSB7XG4gICAgICAgIGlmKHRoaXMuZWxlbWVudC5maXJzdENoaWxkID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKGlucHV0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gdW5kZWZpbmVkICYmIGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQubWFwcGVkRWxlbWVudCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0ICYmIGlucHV0LnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShDb250YWluZXJFbGVtZW50LmNyZWF0ZVRleHROb2RlKGlucHV0KSx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkFic3RyYWN0SW5wdXRFbGVtZW50XCIpO1xuXG4vKipcbiAqIFNoYXJlZCBwcm9wZXJ0aWVzIG9mIGlucHV0IGVsZW1lbnRzXG4gKi9cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdElucHV0RWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gdmFsdWVcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKHZhbHVlLCBwYXJlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQgbmFtZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHZhbHVlIGdpdmVuIGFueSBwcm9jZXNzaW5nIHJ1bGVzXG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmJhY2tpbmdWYWx1ZTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IElucHV0RXZlbnQoJ2NoYW5nZScpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzb3VyY2UgdmFsdWVcbiAgICAgKi9cbiAgICBnZXQgYmFja2luZ1ZhbHVlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWU7XG4gICAgfVxuXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICAgIH1cblxuICAgIHNlbGVjdEFsbCgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNlbGVjdCgpO1xuICAgIH1cblxuICAgIGVuYWJsZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZGlzYWJsZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdElucHV0RWxlbWVudCB9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBSYWRpb0lucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc2V0IGNoZWNrZWQodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlzQ2hlY2tlZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNoZWNrZWQ7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0NoZWNrZWQoKTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IFwidHJ1ZVwiKTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdElucHV0RWxlbWVudCB9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBDaGVja2JveElucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc2V0IGNoZWNrZWQodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGlzQ2hlY2tlZCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmNoZWNrZWQ7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0NoZWNrZWQoKTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmNoZWNrZWQgPSAodmFsdWUgPT09IHRydWUgfHwgdmFsdWUgPT09IFwidHJ1ZVwiKTtcbiAgICB9XG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtBYnN0cmFjdElucHV0RWxlbWVudH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHRJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0YXJlYUlucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgZ2V0IGlubmVySFRNTCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBzZXQgaW5uZXJIVE1MKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGFkZENoaWxkKGlucHV0KSB7XG4gICAgICAgIHN1cGVyLmFkZENoaWxkKGlucHV0KTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIHByZXBlbmRDaGlsZChpbnB1dCkge1xuICAgICAgICBzdXBlci5wcmVwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5pbm5lckhUTUw7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgWG1sQ2RhdGEgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBDb250YWluZXJFbGVtZW50IH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dG5vZGVFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbENkYXRhfSB2YWx1ZSBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodmFsdWUsIHBhcmVudCkge1xuICAgICAgICBpZih2YWx1ZSBpbnN0YW5jZW9mIFhtbENkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSB0aGlzLmNyZWF0ZUZyb21YbWxDZGF0YSh2YWx1ZSwgcGFyZW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZih0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpe1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1htbENkYXRhfSBjZGF0YUVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50RWxlbWVudCBcbiAgICAgKi9cbiAgICBjcmVhdGVGcm9tWG1sQ2RhdGEoY2RhdGFFbGVtZW50LCBwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY2RhdGFFbGVtZW50LnZhbHVlKTtcbiAgICAgICAgaWYocGFyZW50RWxlbWVudCAhPT0gbnVsbCAmJiBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIENvbnRhaW5lckVsZW1lbnQuYXBwZW5kQ2hpbGQocGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50LCBlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IHZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIGdldCBtYXBwZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgU2ltcGxlRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgZ2V0IGlubmVySFRNTCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBzZXQgaW5uZXJIVE1MKHZhbHVlKXtcbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHZhbHVlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRm9ybUVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQgbmFtZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIHN1Ym1pdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5zdWJtaXQoKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFZpZGVvRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHZhbHVlIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBwbGF5KCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQucGxheSgpO1xuICAgIH1cblxuICAgIG11dGUoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5tdXRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdW5tdXRlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQubXV0ZWQgPSBmYWxzZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxDZGF0YSxYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge1JhZGlvSW5wdXRFbGVtZW50fSBmcm9tIFwiLi9yYWRpb0lucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHtDaGVja2JveElucHV0RWxlbWVudH0gZnJvbSBcIi4vY2hlY2tib3hJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7VGV4dElucHV0RWxlbWVudH0gZnJvbSBcIi4vdGV4dElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUZXh0YXJlYUlucHV0RWxlbWVudH0gZnJvbSBcIi4vdGV4dGFyZWFJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7VGV4dG5vZGVFbGVtZW50fSBmcm9tIFwiLi90ZXh0bm9kZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7U2ltcGxlRWxlbWVudH0gZnJvbSBcIi4vc2ltcGxlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgRm9ybUVsZW1lbnQgfSBmcm9tIFwiLi9mb3JtRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgVmlkZW9FbGVtZW50IH0gZnJvbSBcIi4vdmlkZW9FbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBFbGVtZW50TWFwcGVyIHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICogXG4gICAgICogQHBhcmFtIHthbnl9IGlucHV0IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgbWFwKGlucHV0LCBwYXJlbnQpIHtcbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvUmFkaW8oaW5wdXQpKXsgcmV0dXJuIG5ldyBSYWRpb0lucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9DaGVja2JveChpbnB1dCkpeyByZXR1cm4gbmV3IENoZWNrYm94SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1N1Ym1pdChpbnB1dCkpeyByZXR1cm4gbmV3IFRleHRJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvRm9ybShpbnB1dCkpeyByZXR1cm4gbmV3IEZvcm1FbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1RleHRhcmVhKGlucHV0KSl7IHJldHVybiBuZXcgVGV4dGFyZWFJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVGV4dChpbnB1dCkpeyByZXR1cm4gbmV3IFRleHRJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVmlkZW8oaW5wdXQpKXsgcmV0dXJuIG5ldyBWaWRlb0VsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVGV4dG5vZGUoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0bm9kZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvU2ltcGxlKGlucHV0KSl7IHJldHVybiBuZXcgU2ltcGxlRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBjb25zb2xlLmxvZyhcIk1hcHBpbmcgdG8gc2ltcGxlIGJ5IGRlZmF1bHQgXCIgKyBpbnB1dCk7XG4gICAgICAgIHJldHVybiBuZXcgU2ltcGxlRWxlbWVudChpbnB1dCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvUmFkaW8oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCAmJiBpbnB1dC50eXBlID09PSBcInJhZGlvXCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIiAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwicmFkaW9cIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb0NoZWNrYm94KGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJjaGVja2JveFwiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcImNoZWNrYm94XCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9TdWJtaXQoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCAmJiBpbnB1dC50eXBlID09PSBcInN1Ym1pdFwiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInN1Ym1pdFwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvRm9ybShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MRm9ybUVsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiZm9ybVwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dChpbnB1dCl7XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInRleHRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwicGFzc3dvcmRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwiZW1haWxcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwiZGF0ZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJ0aW1lXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiKSB7XG4gICAgICAgICAgICBpZighaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJ0ZXh0XCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwicGFzc3dvcmRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJlbWFpbFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcImRhdGVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJ0aW1lXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1RleHRub2RlKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIE5vZGUgJiYgaW5wdXQubm9kZVR5cGUgPT09IFwiVEVYVF9OT0RFXCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxDZGF0YSk7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1ZpZGVvKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxWaWRlb0VsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwidmlkZW9cIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1RleHRhcmVhKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwidGV4dGFyZWFcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1NpbXBsZShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQpO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgRWxlbWVudE1hcHBlciB9IGZyb20gXCIuLi9lbGVtZW50L2VsZW1lbnRNYXBwZXIuanNcIjtcbmltcG9ydCB7IFNpbXBsZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9zaW1wbGVFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudHtcblxuICAgIGNvbnN0cnVjdG9yKGV2ZW50KXtcbiAgICAgICAgdGhpcy5ldmVudCA9IGV2ZW50O1xuICAgICAgICBpZih0aGlzLmV2ZW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSBcImRyYWdzdGFydFwiKXtcbiAgICAgICAgICAgIHRoaXMuZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoJ3RleHQvcGxhaW4nLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3BQcm9wYWdhdGlvbigpe1xuICAgICAgICB0aGlzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHByZXZlbnREZWZhdWx0KCl7XG4gICAgICAgIHRoaXMuZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgZXZlbnQgYW5kIHRoZSBlZGdlIHggY29vcmRpbmF0ZSBvZiB0aGUgY29udGFpbmluZyBvYmplY3RcbiAgICAgKi9cbiAgICBnZXRPZmZzZXRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Lm9mZnNldFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGV2ZW50IGFuZCB0aGUgZWRnZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNvbnRhaW5pbmcgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0T2Zmc2V0WSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5vZmZzZXRZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtb3VzZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGV2ZW50IHJlbGF0aXZlIHRvIHRoZSBjbGllbnQgd2luZG93IHZpZXdcbiAgICAgKi9cbiAgICBnZXRDbGllbnRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmNsaWVudFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1vdXNlIHkgY29vcmRpbmF0ZSBvZiB0aGUgZXZlbnQgcmVsYXRpdmUgdG8gdGhlIGNsaWVudCB3aW5kb3cgdmlld1xuICAgICAqL1xuICAgIGdldENsaWVudFkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQuY2xpZW50WTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7U2ltcGxlRWxlbWVudH1cbiAgICAgKi9cbiAgICBnZXRUYXJnZXQoKXtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQgJiYgdGhpcy5ldmVudC50YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBFbGVtZW50TWFwcGVyLm1hcCh0aGlzLmV2ZW50LnRhcmdldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7U2ltcGxlRWxlbWVudH1cbiAgICAgKi9cbiAgICBnZXRSZWxhdGVkVGFyZ2V0KCl7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50ICYmIHRoaXMuZXZlbnQucmVsYXRlZFRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHRoaXMuZXZlbnQucmVsYXRlZFRhcmdldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICAgZ2V0UmVsYXRlZFRhcmdldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKXtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQucmVsYXRlZFRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHRoaXMuZXZlbnQucmVsYXRlZFRhcmdldCkuZ2V0QXR0cmlidXRlVmFsdWUoYXR0cmlidXRlTmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0VGFyZ2V0VmFsdWUoKXtcbiAgICAgICAgaWYodGhpcy5nZXRUYXJnZXQoKSkgeyBcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhcmdldCgpLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGdldEtleUNvZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmtleUNvZGU7XG4gICAgfVxuXG4gICAgaXNLZXlDb2RlKGNvZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQua2V5Q29kZSA9PT0gY29kZTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IE1hcCwgT2JqZWN0RnVuY3Rpb24sIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi9ldmVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRXZlbnRSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIEV2ZW50UmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXA8TWFwPE9iamVjdEZ1bmN0aW9uPn0gKi9cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29ubmVjdHMgZWxlbWVudHMgd2l0aCB0aGUgZXZlbnQgcmVnaXN0cnkgc28gdGhhdCBldmVudHMgdHJpZ2dlcmVkIG9uIHRoZSBlbGVtZW50IGdldHMgZGlzdHJpYnV0ZWQgdG8gYWxsIGxpc3RlbmVyc1xuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnQgdGhlIGVsZW1lbnQgd2hpY2ggaXMgdGhlIHNvdXJjZSBvZiB0aGUgZXZlbnQgYW5kIHdoaWNoIGNhbiBiZSBhdHRhY2hlZCB0b1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFR5cGUgdGhlIGV2ZW50IHR5cGUgYXMgaXQgaXMgZGVmaW5lZCBieSB0aGUgY29udGFpbmluZyB0cmlnZ2VyIChleGFtcGxlIFwib25jbGlja1wiKVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudE5hbWUgdGhlIGV2ZW50IG5hbWUgYXMgaXQgd2lsbCBiZSByZWZlcnJlZCB0byBpbiB0aGUgRXZlbnRSZWdpc3RyeSAoZXhhbXBsZSBcIi8vZXZlbnQ6Y2xpY2tlZFwiKVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjb21wb25lbnRJbmRleCB1bmlxdWUgaWQgb2YgdGhlIGNvbXBvbmVudCB3aGljaCBvd25zIHRoZSBlbGVtZW50XG4gICAgICogQHBhcmFtIHtib29sZWFufSBjYXB0dXJlIFxuICAgICAqL1xuICAgIGF0dGFjaChlbGVtZW50LCBldmVudFR5cGUsIGV2ZW50TmFtZSwgY29tcG9uZW50SW5kZXgsIGNhcHR1cmUgPSBmYWxzZSkge1xuICAgICAgICBjb25zdCB1bmlxdWVFdmVudE5hbWUgPSBldmVudE5hbWUgKyBcIl9cIiArIGNvbXBvbmVudEluZGV4O1xuICAgICAgICBjb25zdCB0aGVFdmVudFJlZ2lzdHJ5ID0gdGhpcztcbiAgICAgICAgZWxlbWVudC5hdHRhY2hFdmVudChldmVudFR5cGUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB0aGVFdmVudFJlZ2lzdHJ5LnRyaWdnZXIodW5pcXVlRXZlbnROYW1lLCBldmVudCk7IFxuICAgICAgICB9LCBjYXB0dXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIHRoZSBldmVudCBuYW1lIGFzIGl0IHdpbGwgYmUgcmVmZXJyZWQgdG8gaW4gdGhlIEV2ZW50UmVnaXN0cnkgKGV4YW1wbGUgXCIvL2V2ZW50OmNsaWNrZWRcIilcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBsaXN0ZW5lciB0aGUgb2JqZWN0IHdoaWNoIG93bnMgdGhlIGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdW5pcXVlSW5kZXggYSB1bmlxdWUgaW5kZXggZm9yIHRoZSBldmVudFxuICAgICAqL1xuICAgIGxpc3RlbihldmVudE5hbWUsIGxpc3RlbmVyLCB1bmlxdWVJbmRleCkge1xuICAgICAgICB0aGlzLmluaXRNYXAoZXZlbnROYW1lICsgXCJfXCIgKyB1bmlxdWVJbmRleClcbiAgICAgICAgICAgIC5zZXQobGlzdGVuZXIub2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5IFxuICAgICAqIEByZXR1cm5zIHtNYXA8T2JqZWN0RnVuY3Rpb24+fVxuICAgICAqL1xuICAgIGluaXRNYXAoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5saXN0ZW5lcnMuZXhpc3RzKGtleSkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnNldChrZXksbmV3IE1hcCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnMuZ2V0KGtleSk7XG4gICAgfVxuXG4gICAgdHJpZ2dlcihzdWZmaXhlZEV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMubGlzdGVuZXJzLmV4aXN0cyhzdWZmaXhlZEV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChzdWZmaXhlZEV2ZW50TmFtZSkuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWUuY2FsbChuZXcgRXZlbnQoZXZlbnQpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBVbmlxdWVJZFJlZ2lzdHJ5IHtcblxuICAgIGlkQXR0cmlidXRlV2l0aFN1ZmZpeCAoaWQpIHtcbiAgICAgICAgaWYoaWROYW1lcy5jb250YWlucyhpZCkpIHtcbiAgICAgICAgICAgIHZhciBudW1iZXIgPSBpZE5hbWVzLmdldChpZCk7XG4gICAgICAgICAgICBpZE5hbWVzLnNldChpZCxudW1iZXIrMSk7XG4gICAgICAgICAgICByZXR1cm4gaWQgKyBcIi1cIiArIG51bWJlcjtcbiAgICAgICAgfVxuICAgICAgICBpZE5hbWVzLnNldChpZCwxKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxufVxuXG52YXIgaWROYW1lcyA9IG5ldyBNYXAoKTsiLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnRcIjtcblxuLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb21wb25lbnRJbmRleCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSByb290RWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge01hcH0gZWxlbWVudE1hcCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb21wb25lbnRJbmRleCwgcm9vdEVsZW1lbnQsIGVsZW1lbnRNYXApIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGV4O1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAgPSBlbGVtZW50TWFwO1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKCkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgZ2V0KGlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc2V0IChpZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuc2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgY2xlYXJDaGlsZHJlbihpZCl7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLmNsZWFyKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc2V0Q2hpbGQgKGlkLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5zZXRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgYWRkQ2hpbGQgKGlkLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5hZGRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgcHJlcGVuZENoaWxkIChpZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkucHJlcGVuZENoaWxkKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgTWFwLCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBFbGVtZW50TWFwcGVyIH0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlclwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudFwiO1xuaW1wb3J0IHsgRXZlbnRSZWdpc3RyeSB9IGZyb20gXCIuLi9ldmVudC9ldmVudFJlZ2lzdHJ5XCI7XG5cbi8qKlxuICogQ29sbGVjdHMgaW5mb3JtYXRpb24gd2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBhbmQgZmluZHMgdGhlIHJvb3QgZWxlbWVudCwgY3JlYXRlcyBtYXAgb2YgZWxlbWVudHMgXG4gKiBhbmQgcmVnaXN0ZXJzIGV2ZW50cyBpbiB0aGUgZXZlbnRSZWdpc3RyeVxuICovXG5leHBvcnQgY2xhc3MgRWxlbWVudFJlZ2lzdHJhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKGV2ZW50UmVnaXN0cnksIHVuaXF1ZUlkUmVnaXN0cnksIGNvbXBvbmVudEluZGV4KSB7XG4gICAgICAgIHRoaXMuY29tcG9uZW50SW5kZXggPSBjb21wb25lbnRJbmRleDtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy51bmlxdWVJZFJlZ2lzdHJ5ID0gdW5pcXVlSWRSZWdpc3RyeTtcblxuICAgICAgICAvKiogQHR5cGUge0V2ZW50UmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMuZXZlbnRSZWdpc3RyeSA9IGV2ZW50UmVnaXN0cnk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50TWFwID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGdldEVsZW1lbnRNYXAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGlzdGVucyB0byBlbGVtZW50cyBiZWluZyBjcmVhdGVkLCBhbmQgdGFrZXMgaW5uIHRoZSBjcmVhdGVkIFhtbEVsZW1lbnQgYW5kIGl0cyBwYXJlbnQgWG1sRWxlbWVudFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0geG1sRWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRXcmFwcGVyIFxuICAgICAqL1xuICAgIGVsZW1lbnRDcmVhdGVkICh4bWxFbGVtZW50LCBwYXJlbnRXcmFwcGVyKSB7XG4gICAgICAgIHZhciBlbGVtZW50ID0gRWxlbWVudE1hcHBlci5tYXAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcik7XG5cbiAgICAgICAgdGhpcy5hZGRUb0VsZW1lbnRJZE1hcChlbGVtZW50KTtcbiAgICAgICAgdGhpcy5yZWdpc3RlckVsZW1lbnRFdmVudHMoZWxlbWVudCk7XG5cbiAgICAgICAgaWYodGhpcy5yb290RWxlbWVudCA9PT0gbnVsbCAmJiBlbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIHJlZ2lzdGVyRWxlbWVudEV2ZW50cyhlbGVtZW50KXtcbiAgICAgICAgaWYoZWxlbWVudCA9PT0gbnVsbCB8fCBlbGVtZW50ID09PSB1bmRlZmluZWQgfHwgIShlbGVtZW50IGluc3RhbmNlb2YgQmFzZUVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGV2ZW50UmVnaXN0cnkgPSB0aGlzLmV2ZW50UmVnaXN0cnk7XG4gICAgICAgIHZhciBjb21wb25lbnRJbmRleCA9IHRoaXMuY29tcG9uZW50SW5kZXg7XG4gICAgICAgIGVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChhdHRyaWJ1dGVLZXksYXR0cmlidXRlLHBhcmVudCl7XG4gICAgICAgICAgICBpZihhdHRyaWJ1dGUgIT09IG51bGwgJiYgYXR0cmlidXRlICE9PSB1bmRlZmluZWQgJiYgYXR0cmlidXRlLnZhbHVlLnN0YXJ0c1dpdGgoXCIvL2V2ZW50OlwiKSkge1xuICAgICAgICAgICAgICAgIHZhciBldmVudE5hbWUgPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50VHlwZSA9IGF0dHJpYnV0ZS5uYW1lO1xuICAgICAgICAgICAgICAgIGV2ZW50UmVnaXN0cnkuYXR0YWNoKGVsZW1lbnQsZXZlbnRUeXBlLGV2ZW50TmFtZSxjb21wb25lbnRJbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgICAgICAgICBcbiAgICAgICAgfSx0aGlzKTtcbiAgICB9XG5cbiAgICBhZGRUb0VsZW1lbnRJZE1hcChlbGVtZW50KSB7XG4gICAgICAgIGlmKGVsZW1lbnQgPT09IG51bGwgfHwgZWxlbWVudCA9PT0gdW5kZWZpbmVkIHx8ICEoZWxlbWVudCBpbnN0YW5jZW9mIEJhc2VFbGVtZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpZCA9IG51bGw7XG4gICAgICAgIGlmKGVsZW1lbnQuY29udGFpbnNBdHRyaWJ1dGUoXCJpZFwiKSkge1xuICAgICAgICAgICAgaWQgPSBlbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwiaWRcIik7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiaWRcIix0aGlzLnVuaXF1ZUlkUmVnaXN0cnkuaWRBdHRyaWJ1dGVXaXRoU3VmZml4KGlkKSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZihpZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50TWFwLnNldChpZCxlbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbn0iLCJpbXBvcnQgeyBDb250YWluZXJFbGVtZW50LCBDb250YWluZXJXaW5kb3cgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSBcIi4uL2NvbXBvbmVudC9jb21wb25lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEV2ZW50IH0gZnJvbSBcIi4uL2V2ZW50L2V2ZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBDYW52YXNSb290IHtcblxuICAgIHN0YXRpYyBzaG91bGRTd2FsbG93TmV4dEZvY3VzRXNjYXBlID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtDb21wb25lbnR9IGNvbXBvbmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVwbGFjZUNvbXBvbmVudChpZCwgY29tcG9uZW50KSB7XG4gICAgICAgIGNvbnN0IGJvZHlFbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGJvZHlFbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBib2R5RWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIFxuICAgICAqIEBwYXJhbSB7Q29tcG9uZW50fSBjb21wb25lbnQgXG4gICAgICovXG4gICAgc3RhdGljIHNldENvbXBvbmVudChpZCwgY29tcG9uZW50KSB7XG4gICAgICAgIGNvbnN0IGJvZHlFbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGJvZHlFbGVtZW50LmlubmVySFRNTCA9ICcnO1xuICAgICAgICBib2R5RWxlbWVudC5hcHBlbmRDaGlsZChjb21wb25lbnQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCwgYm9keUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZCBcbiAgICAgKiBAcGFyYW0ge0NvbXBvbmVudH0gY29tcG9uZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyBhZGRDaGlsZENvbXBvbmVudChpZCwgY29tcG9uZW50KSB7XG4gICAgICAgIGNvbnN0IGJvZHlFbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtDb21wb25lbnR9IGNvbXBvbmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgYWRkQ2hpbGRFbGVtZW50KGlkLCBlbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGJvZHlFbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlkIFxuICAgICAqL1xuICAgIHN0YXRpYyByZW1vdmVFbGVtZW50KGlkKSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQucmVtb3ZlRWxlbWVudChpZCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgYWRkSGVhZGVyRWxlbWVudChlbGVtZW50KSB7XG4gICAgICAgIENvbnRhaW5lckVsZW1lbnQuYXBwZW5kUm9vdE1ldGFDaGlsZChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XG4gICAgICovXG4gICAgc3RhdGljIGFkZEJvZHlFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5hcHBlbmRSb290VWlDaGlsZChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XG4gICAgICovXG4gICAgc3RhdGljIHByZXBlbmRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudC5wcmVwZW5kRWxlbWVudChcImhlYWRcIiwgZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKiogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxuICAgICAqL1xuICAgIHN0YXRpYyBwcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBDb250YWluZXJFbGVtZW50LnByZXBlbmRFbGVtZW50KFwiYm9keVwiLCBlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiBSZW1lbWJlciB0byBzd2FsbG93Rm9jdXNFc2NhcGUgZm9yIGluaXRpYWwgdHJpZ2dlcmluZyBldmVudHNcbiAgICAgKiB3aGljaCBhcmUgZXh0ZXJuYWwgdG8gZm9jdXNSb290XG4gICAgICogXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gbGlzdGVuZXJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBmb2N1c1Jvb3RcbiAgICAgKi9cbiAgICBzdGF0aWMgbGlzdGVuVG9Gb2N1c0VzY2FwZShsaXN0ZW5lciwgZm9jdXNSb290KSB7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjYWxsSWZOb3RDb250YWlucyA9IG5ldyBPYmplY3RGdW5jdGlvbihudWxsLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGlmIChDb250YWluZXJFbGVtZW50LmNvbnRhaW5zKGZvY3VzUm9vdC5lbGVtZW50LCBldmVudC5nZXRUYXJnZXQoKS5lbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChDYW52YXNSb290LnNob3VsZFN3YWxsb3dOZXh0Rm9jdXNFc2NhcGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsaXN0ZW5lci5jYWxsKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgICAgIENvbnRhaW5lcldpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgY2FsbElmTm90Q29udGFpbnMsIEV2ZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXaGVuIGFuIGVsZW1lbnQgaXMgY29uZ2lndXJlZCB0byBiZSBoaWRkZW4gYnkgRm9jdXNFc2NhcGUsXG4gICAgICogYW5kIHdhcyBzaG93biBieSBhbiBldmVudCB0cmlnZ2VyZWQgZnJvbSBhbiBleHRlcm5hbCBlbGVtZW50LFxuICAgICAqIHRoZW4gRm9jdXNFc2NhcGUgZ2V0cyB0cmlnZ2VyZWQgcmlnaHQgYWZ0ZXIgdGhlIGVsZW1lbnQgaXNcbiAgICAgKiBzaG93bi4gVGhlcmVmb3JlIHRoaXMgZnVuY3Rpb24gYWxsb3dzIHRoaXMgZXZlbnQgdG8gYmUgXG4gICAgICogc3dhbGxvd2VkIHRvIGF2b2lkIHRoaXMgYmVoYXZpb3JcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZm9yTWlsbGlzZWNvbmRzIFxuICAgICAqL1xuICAgIHN0YXRpYyBzd2FsbG93Rm9jdXNFc2NhcGUoZm9yTWlsbGlzZWNvbmRzKSB7XG4gICAgICAgIENhbnZhc1Jvb3Quc2hvdWxkU3dhbGxvd05leHRGb2N1c0VzY2FwZSA9IHRydWU7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgQ2FudmFzUm9vdC5zaG91bGRTd2FsbG93TmV4dEZvY3VzRXNjYXBlID0gZmFsc2U7XG4gICAgICAgIH0sIGZvck1pbGxpc2Vjb25kcyk7XG4gICAgfVxufSIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0VsZW1lbnRNYXBwZXJ9IGZyb20gXCIuLi9lbGVtZW50L2VsZW1lbnRNYXBwZXIuanNcIjtcblxuZXhwb3J0IGNsYXNzIEhUTUx7XG5cbiAgICBzdGF0aWMgY3VzdG9tKGVsZW1lbnROYW1lKXtcbiAgICAgICAgdmFyIHhtbEVsZW1lbnQgPSBuZXcgWG1sRWxlbWVudChlbGVtZW50TmFtZSk7XG4gICAgICAgIHJldHVybiBFbGVtZW50TWFwcGVyLm1hcCh4bWxFbGVtZW50KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYXBwbHlTdHlsZXMoZWxlbWVudCwgY2xhc3NWYWx1ZSwgc3R5bGVWYWx1ZSl7XG4gICAgICAgIGlmKGNsYXNzVmFsdWUpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIGNsYXNzVmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHN0eWxlVmFsdWUpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcInN0eWxlXCIsIHN0eWxlVmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGEodmFsdWUsIGhyZWYsIGNsYXNzVmFsdWUsIHN0eWxlVmFsdWUpe1xuICAgICAgICB2YXIgZWxlbWVudCA9IEhUTUwuY3VzdG9tKFwiYVwiKTtcbiAgICAgICAgZWxlbWVudC5hZGRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJocmVmXCIsaHJlZik7XG4gICAgICAgIEhUTUwuYXBwbHlTdHlsZXMoZWxlbWVudCwgY2xhc3NWYWx1ZSwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIHN0YXRpYyBpKHZhbHVlLCBjbGFzc1ZhbHVlLCBzdHlsZVZhbHVlKXtcbiAgICAgICAgdmFyIGVsZW1lbnQgPSBIVE1MLmN1c3RvbShcImlcIik7XG4gICAgICAgIGVsZW1lbnQuYWRkQ2hpbGQodmFsdWUpO1xuICAgICAgICBIVE1MLmFwcGx5U3R5bGVzKGVsZW1lbnQsIGNsYXNzVmFsdWUsIHN0eWxlVmFsdWUpO1xuICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAsIExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ2FudmFzUm9vdCB9IGZyb20gXCIuL2NhbnZhc1Jvb3QuanNcIjtcbmltcG9ydCB7IEhUTUwgfSBmcm9tIFwiLi4vaHRtbC9odG1sLmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBUZXh0bm9kZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC90ZXh0bm9kZUVsZW1lbnQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNhbnZhc1N0eWxlc1wiKTtcblxuY29uc3Qgc3R5bGVzID0gbmV3IE1hcCgpO1xuY29uc3Qgc3R5bGVPd25lcnMgPSBuZXcgTWFwKCk7XG5jb25zdCBlbmFibGVkU3R5bGVzID0gbmV3IExpc3QoKTtcblxuZXhwb3J0IGNsYXNzIENhbnZhc1N0eWxlcyB7XG5cbiAgICBzdGF0aWMgc2V0U3R5bGUobmFtZSwgc291cmNlKSB7XG4gICAgICAgIGlmKHN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgc3R5bGVzLmdldChuYW1lKS5zZXRDaGlsZChuZXcgVGV4dG5vZGVFbGVtZW50KHNvdXJjZS5nZXRTdHlsZXNTb3VyY2UoKSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLyoqIEB0eXBlIHtCYXNlRWxlbWVudH0gKi9cbiAgICAgICAgICAgIGxldCBzdHlsZUVsZW1lbnQgPSBIVE1MLmN1c3RvbShcInN0eWxlXCIpO1xuICAgICAgICAgICAgc3R5bGVFbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiaWRcIixuYW1lKTtcbiAgICAgICAgICAgIHN0eWxlRWxlbWVudC5zZXRDaGlsZChuZXcgVGV4dG5vZGVFbGVtZW50KHNvdXJjZS5nZXRTdHlsZXNTb3VyY2UoKSkpO1xuICAgICAgICAgICAgc3R5bGVzLnNldChuYW1lLCBzdHlsZUVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIHJlbW92ZVN0eWxlKG5hbWUpIHtcbiAgICAgICAgaWYoZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5yZW1vdmUobmFtZSk7XG4gICAgICAgICAgICBDYW52YXNSb290LnJlbW92ZUVsZW1lbnQobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBzdHlsZXMucmVtb3ZlKG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGRpc2FibGVTdHlsZShuYW1lLCBvd25lcklkID0gMCkge1xuICAgICAgICBDYW52YXNTdHlsZXMucmVtb3ZlU3R5bGVPd25lcihuYW1lLCBvd25lcklkKTtcbiAgICAgICAgaWYoQ2FudmFzU3R5bGVzLmhhc1N0eWxlT3duZXIobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZighc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJTdHlsZSBkb2VzIG5vdCBleGlzdDogXCIgKyBuYW1lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLnJlbW92ZShuYW1lKTtcbiAgICAgICAgICAgIENhbnZhc1Jvb3QucmVtb3ZlRWxlbWVudChuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBlbmFibGVTdHlsZShuYW1lLCBvd25lcklkID0gMCkge1xuICAgICAgICBDYW52YXNTdHlsZXMuYWRkU3R5bGVPd25lcihuYW1lLCBvd25lcklkKTtcbiAgICAgICAgaWYoIXN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgTE9HLmVycm9yKFwiU3R5bGUgZG9lcyBub3QgZXhpc3Q6IFwiICsgbmFtZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoIWVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMuYWRkKG5hbWUpO1xuICAgICAgICAgICAgQ2FudmFzUm9vdC5hZGRIZWFkZXJFbGVtZW50KHN0eWxlcy5nZXQobmFtZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGFkZFN0eWxlT3duZXIobmFtZSwgb3duZXJJZCkge1xuICAgICAgICBpZighc3R5bGVPd25lcnMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHN0eWxlT3duZXJzLnNldChuYW1lLCBuZXcgTGlzdCgpKTtcbiAgICAgICAgfVxuICAgICAgICBpZighc3R5bGVPd25lcnMuZ2V0KG5hbWUpLmNvbnRhaW5zKG93bmVySWQpKSB7XG4gICAgICAgICAgICBzdHlsZU93bmVycy5nZXQobmFtZSkuYWRkKG93bmVySWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIHJlbW92ZVN0eWxlT3duZXIobmFtZSwgb3duZXJJZCkge1xuICAgICAgICBpZighc3R5bGVPd25lcnMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdHlsZU93bmVycy5nZXQobmFtZSkucmVtb3ZlKG93bmVySWQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBoYXNTdHlsZU93bmVyKG5hbWUpIHtcbiAgICAgICAgaWYoIXN0eWxlT3duZXJzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0eWxlT3duZXJzLmdldChuYW1lKS5zaXplKCkgPiAwO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnRcIjtcbmltcG9ydCB7IFVuaXF1ZUlkUmVnaXN0cnkgfSBmcm9tIFwiLi91bmlxdWVJZFJlZ2lzdHJ5XCI7XG5pbXBvcnQgeyBFbGVtZW50UmVnaXN0cmF0b3IgfSBmcm9tIFwiLi9lbGVtZW50UmVnaXN0cmF0b3JcIjtcbmltcG9ydCB7IEV2ZW50UmVnaXN0cnkgfSBmcm9tIFwiLi4vZXZlbnQvZXZlbnRSZWdpc3RyeVwiO1xuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5XCI7XG5pbXBvcnQgeyBEb21UcmVlIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnlcIjtcbmltcG9ydCB7IENhbnZhc1N0eWxlcyB9IGZyb20gXCIuLi9jYW52YXMvY2FudmFzU3R5bGVzXCI7XG5pbXBvcnQgeyBJbmplY3Rpb25Qb2ludCB9IGZyb20gXCJtaW5kaV92MVwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29tcG9uZW50RmFjdG9yeVwiKTtcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEZhY3Rvcnkge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtFdmVudFJlZ2lzdHJ5fSAqL1xuICAgICAgICB0aGlzLmV2ZW50UmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShFdmVudFJlZ2lzdHJ5KTtcblxuICAgICAgICAvKiogQHR5cGUge1N0eWxlc1JlZ2lzdHJ5fSAqL1xuICAgICAgICB0aGlzLnN0eWxlc1JlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoU3R5bGVzUmVnaXN0cnkpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoVGVtcGxhdGVSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtVbmlxdWVJZFJlZ2lzdHJ5fSAqL1xuICAgICAgICB0aGlzLnVuaXF1ZUlkUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShVbmlxdWVJZFJlZ2lzdHJ5KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSByZXByZXNlbnRzIHRoZSB0ZW1wbGF0ZSBhbmQgdGhlIHN0eWxlcyBuYW1lIGlmIHRoZSBzdHlsZSBmb3IgdGhhdCBuYW1lIGlzIGF2YWlsYWJsZVxuICAgICAqL1xuICAgIGNyZWF0ZShuYW1lKXtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldChuYW1lKTtcbiAgICAgICAgaWYoIXRlbXBsYXRlKSB7XG4gICAgICAgICAgICBMT0cuZXJyb3IodGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5KTtcbiAgICAgICAgICAgIHRocm93IFwiTm8gdGVtcGxhdGUgd2FzIGZvdW5kIHdpdGggbmFtZSBcIiArIG5hbWU7XG5cbiAgICAgICAgfVxuICAgICAgICB2YXIgZWxlbWVudFJlZ2lzdHJhdG9yID0gbmV3IEVsZW1lbnRSZWdpc3RyYXRvcih0aGlzLmV2ZW50UmVnaXN0cnksIHRoaXMudW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50Q291bnRlcisrKTtcbiAgICAgICAgbmV3IERvbVRyZWUodGVtcGxhdGUuZ2V0VGVtcGxhdGVTb3VyY2UoKSxlbGVtZW50UmVnaXN0cmF0b3IpLmxvYWQoKTtcblxuICAgICAgICB0aGlzLm1vdW50U3R5bGVzKG5hbWUpO1xuXG4gICAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50KGVsZW1lbnRSZWdpc3RyYXRvci5jb21wb25lbnRJbmRleCwgZWxlbWVudFJlZ2lzdHJhdG9yLnJvb3RFbGVtZW50LCBlbGVtZW50UmVnaXN0cmF0b3IuZ2V0RWxlbWVudE1hcCgpKTtcbiAgICB9XG5cbiAgICBtb3VudFN0eWxlcyhuYW1lKSB7XG4gICAgICAgIGlmKHRoaXMuc3R5bGVzUmVnaXN0cnkuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIENhbnZhc1N0eWxlcy5zZXRTdHlsZShuYW1lLCB0aGlzLnN0eWxlc1JlZ2lzdHJ5LmdldChuYW1lKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxudmFyIGNvbXBvbmVudENvdW50ZXIgPSAwOyIsImltcG9ydCB7IExvZ2dlciwgTGlzdCB9IGZyb20gXCJjb3JldXRpbF92MVwiXG5pbXBvcnQgeyBTaW5nbGV0b25Db25maWcsIFByb3RvdHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiXG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgRXZlbnRSZWdpc3RyeSB9IGZyb20gXCIuL2V2ZW50L2V2ZW50UmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFVuaXF1ZUlkUmVnaXN0cnkgfSBmcm9tIFwiLi9jb21wb25lbnQvdW5pcXVlSWRSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgQ29tcG9uZW50RmFjdG9yeSB9IGZyb20gXCIuL2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuL3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ29uZmlnXCIpO1xuXG5leHBvcnQgY2xhc3MgQ29uZmlnIHtcblxuICAgIHN0YXRpYyBnZXRJbnN0YW5jZSgpIHtcbiAgICAgICAgcmV0dXJuIGp1c3RyaWdodENvbmZpZztcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy50eXBlQ29uZmlnTGlzdCA9IG5ldyBMaXN0KFtcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKFRlbXBsYXRlUmVnaXN0cnkpLFxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoU3R5bGVzUmVnaXN0cnkpLFxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVW5pcXVlSWRSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChDb21wb25lbnRGYWN0b3J5KSxcbiAgICAgICAgICAgIFByb3RvdHlwZUNvbmZpZy51bm5hbWVkKEV2ZW50UmVnaXN0cnkpXSk7XG4gICAgICAgIH1cblxuICAgIGdldFR5cGVDb25maWdMaXN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50eXBlQ29uZmlnTGlzdDtcbiAgICB9XG5cbn1cblxuY29uc3QganVzdHJpZ2h0Q29uZmlnID0gbmV3IENvbmZpZygpOyIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiXG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJMb2FkZXJJbnRlcmNlcHRvclwiKTtcblxuZXhwb3J0IGNsYXNzIExvYWRlckludGVyY2VwdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufVxuICAgICAqL1xuICAgIHByb2Nlc3MoKSB7XG4gICAgICAgIExPRy5pbmZvKFwiVW5pbXBsZW1lbnRlZCBMb2FkZXIgSW50ZXJjZXB0b3IgYnJlYWtzIGJ5IGRlZmF1bHRcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMb2dnZXIsIFN0cmluZ1V0aWxzIH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgTG9hZGVySW50ZXJjZXB0b3IgfSBmcm9tIFwiLi9sb2FkZXJJbnRlcmNlcHRvci5qc1wiXG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJNb2R1bGVMb2FkZXJcIik7XG5cbmV4cG9ydCBjbGFzcyBNb2R1bGVMb2FkZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1hdGNoUGF0aCBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbW9kdWxlUGF0aCBcbiAgICAgKiBAcGFyYW0ge0FycmF5PExvYWRlckludGVyY2VwdG9yPn0gbG9hZGVySW50ZXJjZXB0b3JzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWF0Y2hQYXRoLCBtb2R1bGVQYXRoLCBsb2FkZXJJbnRlcmNlcHRvcnMgPSBbXSkge1xuICAgICAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1hdGNoUGF0aCA9IG1hdGNoUGF0aDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMubW9kdWxlUGF0aCA9IG1vZHVsZVBhdGg7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtBcnJheTxMb2FkZXJJbnRlcmNlcHRvcj59XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmxvYWRlckludGVyY2VwdG9ycyA9IGxvYWRlckludGVyY2VwdG9ycztcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hdGNoZXMgaWYgdGhlIGNvbmZpZ3VyZWQgbWF0Y2hVcmwgc3RhcnRzIHdpdGggdGhlIHByb3ZpZGVkIHVybCBvclxuICAgICAqIGlmIHRoZSBjb25maWd1cmVkIG1hdGNoVXJsIGlzIG51bGxcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIG1hdGNoZXModXJsKXtcbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoUGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihcIlVybCBpcyBudWxsXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKHRoaXMubWF0Y2hQYXRoLCB1cmwucGF0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2U8TWFpbj59XG4gICAgICovXG4gICAgbG9hZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW1wb3J0TW9kdWxlKCkudGhlbigobWFpbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJjZXB0b3JzUGFzcygpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBtYWluO1xuICAgICAgICAgICAgfSkuY2F0Y2goKHJlYXNvbikgPT4ge1xuICAgICAgICAgICAgICAgIExPRy53YXJuKFwiRmlsdGVyIHJlamVjdGVkIFwiICsgcmVhc29uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBpbnRlcmNlcHRvcnNQYXNzKCkge1xuICAgICAgICBjb25zdCBpbnRlcmNlcHRvcnMgPSB0aGlzLmxvYWRlckludGVyY2VwdG9ycztcbiAgICAgICAgaWYgKGludGVyY2VwdG9ycyAmJiBpbnRlcmNlcHRvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgbGV0IGludGVyY2VwdG9yUHJvbWlzZUNoYWluID0gaW50ZXJjZXB0b3JzWzBdLnByb2Nlc3MoKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgaW50ZXJjZXB0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaW50ZXJjZXB0b3JQcm9taXNlQ2hhaW4gPSBpbnRlcmNlcHRvclByb21pc2VDaGFpbi50aGVuKGludGVyY2VwdG9yc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW50ZXJjZXB0b3JQcm9taXNlQ2hhaW47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIGltcG9ydE1vZHVsZSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGltcG9ydCh0aGlzLm1vZHVsZVBhdGgpLnRoZW4oKG1vZHVsZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUobmV3IG1vZHVsZS5kZWZhdWx0KCkpO1xuICAgICAgICAgICAgfSkuY2F0Y2goKHJlYXNvbikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxufSIsImltcG9ydCB7IFVybCB9IGZyb20gXCIuL3V0aWwvdXJsXCI7XG5cbmV4cG9ydCBjbGFzcyBNYWluIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgbG9hZCh1cmwpIHtcbiAgICAgICAgdGhyb3cgXCJNYWluIGNsYXNzIG11c3QgaW1wbGVtZW50IGxvYWQodXJsKVwiO1xuICAgIH1cblxuICAgIHVwZGF0ZSgpIHtcbiAgICAgICAgdGhyb3cgXCJNYWluIGNsYXNzIG11c3QgaW1wbGVtZW50IHVwZGF0ZSgpXCI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgcGF0aCgpIHtcbiAgICAgICAgdGhyb3cgXCJNYWluIGNsYXNzIG11c3QgaW1wbGVtZW50IGdldCBwYXRoKClcIjtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMaXN0LCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxuaW1wb3J0IHsgTWluZGlDb25maWcsIE1pbmRpSW5qZWN0b3IgfSBmcm9tIFwibWluZGlfdjFcIjtcbmltcG9ydCB7IE1vZHVsZUxvYWRlciB9IGZyb20gXCIuL21vZHVsZUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgTG9hZGVySW50ZXJjZXB0b3IgfSBmcm9tIFwiLi9sb2FkZXJJbnRlcmNlcHRvci5qc1wiXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL21haW4uanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkRpTW9kdWxlTG9hZGVyXCIpO1xuXG5leHBvcnQgY2xhc3MgRGlNb2R1bGVMb2FkZXIgZXh0ZW5kcyBNb2R1bGVMb2FkZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNaW5kaUNvbmZpZ30gY29uZmlnXG4gICAgICogQHBhcmFtIHtSZWdFeHB9IG1hdGNoUGF0aCBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbW9kdWxlUGF0aCBcbiAgICAgKiBAcGFyYW0ge0FycmF5PExvYWRlckludGVyY2VwdG9yPn0gbG9hZGVySW50ZXJjZXB0b3JzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBtYXRjaFBhdGgsIG1vZHVsZVBhdGgsIGxvYWRlckludGVyY2VwdG9ycyA9IFtdKSB7XG4gICAgICAgIHN1cGVyKG1hdGNoUGF0aCwgbW9kdWxlUGF0aCwgbG9hZGVySW50ZXJjZXB0b3JzKTtcblxuICAgICAgICAvKiogQHR5cGUge01pbmRpQ29uZmlnfSAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNYWluPn1cbiAgICAgKi9cbiAgICBsb2FkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbXBvcnRNb2R1bGUoKS50aGVuKChtYWluKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbnRlcmNlcHRvcnNQYXNzKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1pbmRpSW5qZWN0b3IuaW5qZWN0KG1haW4sIHRoaXMuY29uZmlnKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChyZWFzb24pID0+IHtcbiAgICAgICAgICAgICAgICBMT0cud2FybihcIkZpbHRlciByZWplY3RlZCBcIiArIHJlYXNvbik7XG4gICAgICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLmNhdGNoKChyZWFzb24pID0+IHtcbiAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNb2R1bGVMb2FkZXJ9IG1vZHVsZUxvYWRlclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGltcG9ydE1vZHVsZSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBzdXBlci5pbXBvcnRNb2R1bGUoKS50aGVuKChtYWluKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcuYWRkQWxsVHlwZUNvbmZpZyhtYWluLnR5cGVDb25maWdMaXN0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5maW5hbGl6ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIG5ldyBMaXN0KHRoaXMubG9hZGVySW50ZXJjZXB0b3JzKS5wcm9taXNlQ2hhaW4oKGxvYWRlckludGVyY2VwdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gTWluZGlJbmplY3Rvci5pbmplY3QobG9hZGVySW50ZXJjZXB0b3IsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKG1haW4pO1xuICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhaWxlZCB0byBpbmplY3RcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZhaWxlZCB0byBmaW5hbGl6ZSBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gRmFpbGVkIHRvIGltcG9ydCBtb2R1bGVcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBNaW5kaUluamVjdG9yLCBNaW5kaUNvbmZpZywgSW5zdGFuY2VQb3N0Q29uZmlnVHJpZ2dlciwgQ29uZmlnQWNjZXNzb3IsIFNpbmdsZXRvbkNvbmZpZywgUHJvdG90eXBlQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBMaXN0LCBMb2dnZXIsIE9iamVjdEZ1bmN0aW9uLCBTdHJpbmdVdGlscyB9IGZyb20gIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENvbnRhaW5lclVybCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IENvbXBvbmVudENvbmZpZ1Byb2Nlc3NvciB9IGZyb20gXCIuL2NvbXBvbmVudC9jb21wb25lbnRDb25maWdQcm9jZXNzb3IuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi90ZW1wbGF0ZS90ZW1wbGF0ZVJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuL3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnLmpzXCI7XG5pbXBvcnQgeyBFdmVudCB9IGZyb20gXCIuL2V2ZW50L2V2ZW50LmpzXCI7XG5pbXBvcnQgeyBIaXN0b3J5IH0gZnJvbSBcIi4vbmF2aWdhdGlvbi9oaXN0b3J5LmpzXCI7XG5pbXBvcnQgeyBEaU1vZHVsZUxvYWRlciB9IGZyb20gXCIuL2xvYWRlci9kaU1vZHVsZUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4vdXRpbC91cmwuanNcIjtcbmltcG9ydCB7IE1vZHVsZVJ1bm5lciB9IGZyb20gXCIuL21vZHVsZVJ1bm5lci5qc1wiO1xuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuL21haW4uanNcIjtcbmltcG9ydCB7IEFjdGl2ZU1vZHVsZVJ1bm5lciB9IGZyb20gXCIuL2FjdGl2ZU1vZHVsZVJ1bm5lci5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQXBwbGljYXRpb25cIik7XG5cbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbiBleHRlbmRzIE1vZHVsZVJ1bm5lciB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TGlzdH0gKi9cbiAgICAgICAgdGhpcy53b3JrZXJMaXN0ID0gbmV3IExpc3QoKTtcblxuICAgICAgICAvKiogQHR5cGUge0xpc3Q8RGlNb2R1bGVMb2FkZXI+fSAqL1xuICAgICAgICB0aGlzLm1vZHVsZUxvYWRlckxpc3QgPSBuZXcgTGlzdCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWluZGlDb25maWd9ICovXG4gICAgICAgIHRoaXMuY29uZmlnID0gbmV3IE1pbmRpQ29uZmlnKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtMaXN0fSAqL1xuICAgICAgICB0aGlzLnJ1bm5pbmdXb3JrZXJzID0gbmV3IExpc3QoKTtcblxuICAgICAgICAvKiogQHR5cGUge01haW59ICovXG4gICAgICAgIHRoaXMuYWN0aXZlTWFpbiA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5kZWZhdWx0Q29uZmlnID0gQ29uZmlnLmdldEluc3RhbmNlKCkuZ2V0VHlwZUNvbmZpZ0xpc3QoKTtcblxuICAgICAgICB0aGlzLmRlZmF1bHRDb25maWdQcm9jZXNzb3JzID0gbmV3IExpc3QoWyBDb21wb25lbnRDb25maWdQcm9jZXNzb3IgXSk7XG5cbiAgICAgICAgdGhpcy5kZWZhdWx0SW5zdGFuY2VQcm9jZXNzb3JzID0gbmV3IExpc3QoWyBJbnN0YW5jZVBvc3RDb25maWdUcmlnZ2VyIF0pXG5cbiAgICAgICAgdGhpcy5jdXN0b21Db25maWcgPSBuZXcgTGlzdCgpO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtMaXN0PFNpbmdsZXRvbkNvbmZpZyB8IFByb3RvdHlwZUNvbmZpZz59IHR5cGVDb25maWdMaXN0IFxuICAgICAqL1xuICAgIHNldCBjdXN0b21UeXBlQ29uZmlnKHR5cGVDb25maWdMaXN0KSB7XG4gICAgICAgIHRoaXMuY3VzdG9tQ29uZmlnID0gdHlwZUNvbmZpZ0xpc3Q7XG4gICAgfVxuXG4gICAgcnVuKCkge1xuICAgICAgICBMT0cuaW5mbyhcIlJ1bm5pbmcgQXBwbGljYXRpb25cIik7XG4gICAgICAgIHRoaXMuY29uZmlnXG4gICAgICAgICAgICAuYWRkQWxsVHlwZUNvbmZpZyh0aGlzLmRlZmF1bHRDb25maWcpXG4gICAgICAgICAgICAuYWRkQWxsVHlwZUNvbmZpZyh0aGlzLmN1c3RvbUNvbmZpZylcbiAgICAgICAgICAgIC5hZGRBbGxDb25maWdQcm9jZXNzb3IodGhpcy5kZWZhdWx0Q29uZmlnUHJvY2Vzc29ycylcbiAgICAgICAgICAgIC5hZGRBbGxJbnN0YW5jZVByb2Nlc3Nvcih0aGlzLmRlZmF1bHRJbnN0YW5jZVByb2Nlc3NvcnMpO1xuICAgICAgICBBY3RpdmVNb2R1bGVSdW5uZXIuaW5zdGFuY2UoKS5zZXQodGhpcyk7XG4gICAgICAgIENvbnRhaW5lclVybC5hZGRVc2VyTmF2aWdhdGVMaXN0ZW5lcihcbiAgICAgICAgICAgIG5ldyBPYmplY3RGdW5jdGlvbih0aGlzLCB0aGlzLnVwZGF0ZSksXG4gICAgICAgICAgICBFdmVudFxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJ1bk1vZHVsZShIaXN0b3J5LmN1cnJlbnRVcmwoKSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXJ0V29ya2VycygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuICAgICAqL1xuICAgIHVwZGF0ZShldmVudCkge1xuICAgICAgICBjb25zdCB1cmwgPSBIaXN0b3J5LmN1cnJlbnRVcmwoKTtcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlTWFpbiAmJiBTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKHRoaXMuYWN0aXZlTWFpbi5wYXRoLCB1cmwucGF0aCkpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlTWFpbi51cGRhdGUodXJsKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJ1bk1vZHVsZSh1cmwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcnVuTW9kdWxlKHVybCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRNYXRjaGluZ01vZHVsZUxvYWRlcih1cmwpLmxvYWQoKS50aGVuKChtYWluKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZU1haW4gPSBtYWluO1xuICAgICAgICAgICAgbWFpbi5sb2FkKHVybCwgbnVsbCk7XG4gICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgTE9HLmVycm9yKGVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhcnRXb3JrZXJzKCkge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nV29ya2Vycy5zaXplKCkgPiAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy53b3JrZXJMaXN0LmZvckVhY2goKHZhbHVlLHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgdmFsdWUoKTtcbiAgICAgICAgICAgIE1pbmRpSW5qZWN0b3IuaW5qZWN0KGluc3RhbmNlLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmdXb3JrZXJzLmFkZChpbnN0YW5jZSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtVcmx9IHVybFxuICAgICAqIEByZXR1cm5zIHtEaU1vZHVsZUxvYWRlcn1cbiAgICAgKi9cbiAgICBnZXRNYXRjaGluZ01vZHVsZUxvYWRlcih1cmwpIHtcbiAgICAgICAgbGV0IGZvdW5kTW9kdWxlTG9hZGVyID0gbnVsbDtcbiAgICAgICAgdGhpcy5tb2R1bGVMb2FkZXJMaXN0LmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaGVzKHVybCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZE1vZHVsZUxvYWRlciA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgcmV0dXJuIGZvdW5kTW9kdWxlTG9hZGVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBnbG9iYWwgYWNjZXNzIHRvIGRlcGVuZGVuY3kgaW5qZWN0aW9uIGNvbmZpZ1xuICAgICAqL1xuICAgIHdpbmRvd0RpQ29uZmlnKCkge1xuICAgICAgICB3aW5kb3cuZGlDb25maWcgPSAoKSA9PiB7XG4gICAgICAgICAgICBMT0cuaW5mbyh0aGlzLmNvbmZpZy5jb25maWdFbnRyaWVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuYWJsZSBnbG9iYWwgYWNjZXNzIHRvIHRlbXBsYXRlIHJlZ2lzdHJ5XG4gICAgICovXG4gICAgd2luZG93VGVtcGxhdGVSZWdpc3RyeSgpIHtcbiAgICAgICAgd2luZG93LnRlbXBsYXRlUmVnaXN0cnkgPSAoKSA9PiB7XG4gICAgICAgICAgICBMT0cuaW5mbyhDb25maWdBY2Nlc3Nvci5pbnN0YW5jZUhvbGRlcihUZW1wbGF0ZVJlZ2lzdHJ5Lm5hbWUsIHRoaXMuY29uZmlnKS5pbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byBzdHlsZSByZWdpc3RyeVxuICAgICAqL1xuICAgIHdpbmRvd1N0eWxlUmVnaXN0cnkoKSB7XG4gICAgICAgIHdpbmRvdy5zdHlsZVJlZ2lzdHJ5ID0gKCkgPT4ge1xuICAgICAgICAgICAgTE9HLmluZm8oQ29uZmlnQWNjZXNzb3IuaW5zdGFuY2VIb2xkZXIoU3R5bGVzUmVnaXN0cnkubmFtZSwgdGhpcy5jb25maWcpLmluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IFByb3BlcnR5QWNjZXNzb3IsIExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudFwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSW5wdXRFbGVtZW50RGF0YUJpbmRpbmdcIik7XG5cbmV4cG9ydCBjbGFzcyBJbnB1dEVsZW1lbnREYXRhQmluZGluZyB7XG5cbiAgICBjb25zdHJ1Y3Rvcihtb2RlbCwgdmFsaWRhdG9yKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy52YWxpZGF0b3IgPSB2YWxpZGF0b3I7XG4gICAgICAgIHRoaXMucHVsbGVycyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMucHVzaGVycyA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGxpbmsobW9kZWwsIHZhbGlkYXRvcikge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0RWxlbWVudERhdGFCaW5kaW5nKG1vZGVsLCB2YWxpZGF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZpZWxkIFxuICAgICAqL1xuICAgIGFuZChmaWVsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50byhmaWVsZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdElucHV0RWxlbWVudH0gZmllbGQgXG4gICAgICovXG4gICAgdG8oZmllbGQpIHtcbiAgICAgICAgY29uc3QgcHVsbGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgbGV0IG1vZGVsVmFsdWUgPSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUpO1xuICAgICAgICAgICAgaWYgKG1vZGVsVmFsdWUgIT09IGZpZWxkLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgUHJvcGVydHlBY2Nlc3Nvci5zZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lLCBmaWVsZC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlKGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZmllbGQuYXR0YWNoRXZlbnQoXCJvbmNoYW5nZVwiLCBwdWxsZXIpO1xuICAgICAgICBmaWVsZC5hdHRhY2hFdmVudChcIm9ua2V5dXBcIiwgcHVsbGVyKTtcbiAgICAgICAgcHVsbGVyLmNhbGwoKTtcblxuICAgICAgICBjb25zdCBwdXNoZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgbW9kZWxWYWx1ZSA9IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgZmllbGQubmFtZSk7XG4gICAgICAgICAgICBpZiAobW9kZWxWYWx1ZSAhPT0gZmllbGQudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBmaWVsZC52YWx1ZSA9IG1vZGVsVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGVTaWxlbnQgJiYgZmllbGQudmFsdWUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlU2lsZW50KGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uTmFtZSA9IFwiX19jaGFuZ2VkX1wiICsgZmllbGQubmFtZS5yZXBsYWNlKFwiLlwiLFwiX1wiKTtcbiAgICAgICAgaWYgKCF0aGlzLm1vZGVsW2NoYW5nZWRGdW5jdGlvbk5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVsW2NoYW5nZWRGdW5jdGlvbk5hbWVdID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucHVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wdWxsZXJzLmFkZChwdWxsZXIpO1xuICAgICAgICB0aGlzLnB1c2hlcnMuYWRkKHB1c2hlcik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcHVsbCgpIHtcbiAgICAgICAgdGhpcy5wdWxsZXJzLmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBwdXNoKCkge1xuICAgICAgICB0aGlzLnB1c2hlcnMuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbChwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBQcm94eU9iamVjdEZhY3Rvcnkge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHByb3h5IGZvciBhbiBvYmplY3Qgd2hpY2ggYWxsb3dzIGRhdGFiaW5kaW5nIGZyb20gdGhlIG9iamVjdCB0byB0aGUgZm9ybSBlbGVtZW50XG4gICAgICogXG4gICAgICogQHRlbXBsYXRlIFRcbiAgICAgKiBAcGFyYW0ge1R9IG9iamVjdCBcbiAgICAgKiBAcmV0dXJucyB7VH1cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlUHJveHlPYmplY3Qob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJveHkob2JqZWN0LCB7XG4gICAgICAgICAgICBzZXQ6ICh0YXJnZXQsIHByb3AsIHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHN1Y2Nlc3MgPSAodGFyZ2V0W3Byb3BdID0gdmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbk5hbWUgPSBcIl9fY2hhbmdlZF9cIiArIHByb3A7XG4gICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbiA9IHRhcmdldFtjaGFuZ2VkRnVuY3Rpb25OYW1lXTtcbiAgICAgICAgICAgICAgICBpZihjaGFuZ2VkRnVuY3Rpb24gJiYgdHlwZW9mIGNoYW5nZWRGdW5jdGlvbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBib3VuZENoYW5nZWRGdW5jdGlvbiA9IGNoYW5nZWRGdW5jdGlvbi5iaW5kKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIGJvdW5kQ2hhbmdlZEZ1bmN0aW9uKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzID09PSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSIsImltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbi8qKlxuICogT2JqZWN0IEZ1bmN0aW9uIHdoaWNoIGlzIGNhbGxlZCBpZiB0aGUgZmlsdGVyIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZVxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRGaWx0ZXJlZE9iamVjdEZ1bmN0aW9uIGV4dGVuZHMgT2JqZWN0RnVuY3Rpb24ge1xuXG4gICAgLyoqXG4gICAgICogQ29udHJ1Y3RvclxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IG9iamVjdEZ1bmN0aW9uIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRoZUZpbHRlciBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvYmplY3RGdW5jdGlvbiwgZmlsdGVyKXtcbiAgICAgICAgdGhpcy5vYmplY3RGdW5jdGlvbiA9IG9iamVjdEZ1bmN0aW9uO1xuICAgICAgICB0aGlzLmZpbHRlciA9IGZpbHRlcjtcbiAgICB9XG5cbiAgICBjYWxsKHBhcmFtcyl7XG4gICAgICAgIGlmKHRoaXMuZmlsdGVyICYmIHRoaXMuZmlsdGVyLmNhbGwodGhpcyxwYXJhbXMpKSB7XG4gICAgICAgICAgICB0aGlzLm9iamVjdEZ1bmN0aW9uLmNhbGwocGFyYW1zKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImV4cG9ydCBjbGFzcyBUcmFpbE5vZGUge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMudHJhaWwgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7cHJvcGVydHl9ICovXG4gICAgICAgIHRoaXMucHJvcGVydHkgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7ZnVuY3Rpb259ICovXG4gICAgICAgIHRoaXMud2F5cG9pbnQgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7ZnVuY3Rpb259ICovXG4gICAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7QXJyYXk8VHJhaWxOb2RlPn0gKi9cbiAgICAgICAgdGhpcy5uZXh0ID0gbnVsbDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMaXN0LCBTdHJpbmdVdGlscyB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgVHJhaWxOb2RlIH0gZnJvbSBcIi4vdHJhaWxOb2RlLmpzXCI7XG5pbXBvcnQgeyBIaXN0b3J5IH0gZnJvbSBcIi4vaGlzdG9yeS5qc1wiO1xuaW1wb3J0IHsgVXJsQnVpbGRlciB9IGZyb20gXCIuLi91dGlsL3VybEJ1aWxkZXIuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRyYWlsUHJvY2Vzc29yIHtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSBhbGwgbWF0Y2hpbmcgZnVuY3Rpb25zIGJhc2VkIG9uIHRoZSB0cmFpbCBpbiB0aGUgdXJsXG4gICAgICogYW5kIGNhbGxzIHRob3NlIGZ1bmN0aW9ucy4gQWxzbyBlbnN1cmVzIHRoYXQgdGhlIGxpc3RcbiAgICAgKiBvZiB0cmFpbCBzdG9wcyBhcmUgYWRkZWQgdG8gdGhlIGhpc3RvcnlcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEBwYXJhbSB7YW55fSBjYWxsaW5nT2JqZWN0IFxuICAgICAqIEBwYXJhbSB7VHJhaWxOb2RlfSBub2RlIFxuICAgICAqL1xuICAgIHN0YXRpYyBuYXZpZ2F0ZUFsbFN0b3BzKHVybCwgY2FsbGluZ09iamVjdCwgbm9kZSkge1xuICAgICAgICBjb25zdCB0cmFpbFN0b3BzID0gVHJhaWxQcm9jZXNzb3IuY2FsbE1hdGNoaW5nRnVuY3Rpb25Gcm9tVXJsKHVybCwgY2FsbGluZ09iamVjdCwgbm9kZSk7XG4gICAgICAgIGlmICghdHJhaWxTdG9wcyB8fCAwID09PSB0cmFpbFN0b3BzLnNpemUoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXJsQnVpbGRlciA9IFVybEJ1aWxkZXIuYnVpbGRlcigpLndpdGhBbGxPZlVybChIaXN0b3J5LmN1cnJlbnRVcmwoKSk7XG4gICAgICAgIGNvbnN0IHN0ZXBVcmwgPSB1cmxCdWlsZGVyLndpdGhCb29rbWFyayhudWxsKS5idWlsZCgpO1xuICAgICAgICBIaXN0b3J5LnJlcGxhY2VVcmwoc3RlcFVybCwgc3RlcFVybC50b1N0cmluZygpLCBudWxsKTtcbiAgICAgICAgXG4gICAgICAgIHRyYWlsU3RvcHMuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0ZXBVcmwgPSB1cmxCdWlsZGVyLndpdGhCb29rbWFyayh2YWx1ZSkuYnVpbGQoKTtcbiAgICAgICAgICAgIEhpc3RvcnkucHVzaFVybChzdGVwVXJsLCBzdGVwVXJsLnRvU3RyaW5nKCksIHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyB0aGUgbWF0Y2hpbmcgZnVuY3Rpb24gYmFzZWQgb24gdGhlIHRyYWlsIGluIHRoZSB1cmxcbiAgICAgKiBhbmQgY2FsbHMgdGhhdCBmdW5jdGlvbi5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEBwYXJhbSB7YW55fSBjYWxsaW5nT2JqZWN0IFxuICAgICAqIEBwYXJhbSB7VHJhaWxOb2RlfSBub2RlIFxuICAgICAqL1xuICAgIHN0YXRpYyBuYXZpZ2F0ZU5leHRTdG9wKHVybCwgY2FsbGluZ09iamVjdCwgbm9kZSkge1xuICAgICAgICBUcmFpbFByb2Nlc3Nvci5jYWxsTWF0Y2hpbmdGdW5jdGlvbkZyb21VcmwodXJsLCBjYWxsaW5nT2JqZWN0LCBub2RlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kcyB0aGUgdHJhaWwgc3RvcCB3aGljaCBtYXRjaGVzIHRoZSBmdW5jdGlvbiBhbmQgcmVjb3JkcyBpdCBpbiB0aGUgaGlzdG9yeVxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRoZUZ1bmN0aW9uIFxuICAgICAqIEBwYXJhbSB7YW55fSBjYWxsaW5nT2JqZWN0IFxuICAgICAqIEBwYXJhbSB7VHJhaWxOb2RlfSBub2RlIFxuICAgICAqL1xuICAgIHN0YXRpYyBmaW5kTmV4dFN0b3AodGhlRnVuY3Rpb24sIGNhbGxpbmdPYmplY3QsIG5vZGUpIHtcblxuICAgICAgICBjb25zdCBjdXJyZW50VXJsID0gSGlzdG9yeS5jdXJyZW50VXJsKCk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdOb2RlID0gVHJhaWxQcm9jZXNzb3IuZ2V0Tm9kZUJ5RnVuY3Rpb24obm9kZSwgdGhlRnVuY3Rpb24pO1xuXG4gICAgICAgIGlmICghbWF0Y2hpbmdOb2RlKSB7IFxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhlY3V0ZWRGdW5jdGlvblByb21pc2UgPSBtYXRjaGluZ05vZGUuZGVzdGluYXRpb24uY2FsbChjYWxsaW5nT2JqZWN0KTtcblxuICAgICAgICBpZiAoIVN0cmluZ1V0aWxzLm5vbk51bGxFcXVhbHMoY3VycmVudFVybC5ib29rbWFyaywgbWF0Y2hpbmdOb2RlLnRyYWlsKSkge1xuICAgICAgICAgICAgY29uc3QgdXJsQnVpbGRlciA9IFVybEJ1aWxkZXIuYnVpbGRlcigpLndpdGhBbGxPZlVybChjdXJyZW50VXJsKTtcbiAgICAgICAgICAgIGlmIChTdHJpbmdVdGlscy5pc0JsYW5rKGN1cnJlbnRVcmwuYm9va21hcmspKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RlcFVybCA9IHVybEJ1aWxkZXIud2l0aEJvb2ttYXJrKFwiL1wiKS5idWlsZCgpO1xuICAgICAgICAgICAgICAgIEhpc3RvcnkucHVzaFVybChzdGVwVXJsLCBzdGVwVXJsLnRvU3RyaW5nKCksIG51bGwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBzdGVwVXJsID0gdXJsQnVpbGRlci53aXRoQm9va21hcmsobWF0Y2hpbmdOb2RlLnRyYWlsKS5idWlsZCgpO1xuICAgICAgICAgICAgSGlzdG9yeS5wdXNoVXJsKHN0ZXBVcmwsIHN0ZXBVcmwudG9TdHJpbmcoKSwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhlY3V0ZWRGdW5jdGlvblByb21pc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIHRyYWlsIHN0b3Agd2hpY2ggbWF0Y2hlcyB0aGUgZnVuY3Rpb24gYW5kIHJlcGxhY2VzIGN1cnJlbnQgdXJsIHdpdGggaXRcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSB0aGVGdW5jdGlvbiBcbiAgICAgKiBAcGFyYW0ge2FueX0gY2FsbGluZ09iamVjdCBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKi9cbiAgICAgc3RhdGljIHJlcGxhY2VDdXJyZW50U3RvcCh0aGVGdW5jdGlvbiwgY2FsbGluZ09iamVjdCwgbm9kZSkge1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRVcmwgPSBIaXN0b3J5LmN1cnJlbnRVcmwoKTtcblxuICAgICAgICBjb25zdCBtYXRjaGluZ05vZGUgPSBUcmFpbFByb2Nlc3Nvci5nZXROb2RlQnlGdW5jdGlvbihub2RlLCB0aGVGdW5jdGlvbik7XG5cbiAgICAgICAgaWYgKCFtYXRjaGluZ05vZGUpIHsgXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBleGVjdXRlZEZ1bmN0aW9uUHJvbWlzZSA9IG1hdGNoaW5nTm9kZS5kZXN0aW5hdGlvbi5jYWxsKGNhbGxpbmdPYmplY3QpO1xuXG4gICAgICAgIGlmICghU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyhjdXJyZW50VXJsLmJvb2ttYXJrLCBtYXRjaGluZ05vZGUudHJhaWwpKSB7XG4gICAgICAgICAgICBjb25zdCB1cmxCdWlsZGVyID0gVXJsQnVpbGRlci5idWlsZGVyKCkud2l0aEFsbE9mVXJsKGN1cnJlbnRVcmwpO1xuICAgICAgICAgICAgY29uc3Qgc3RlcFVybCA9IHVybEJ1aWxkZXIud2l0aEJvb2ttYXJrKG1hdGNoaW5nTm9kZS50cmFpbCkuYnVpbGQoKTtcbiAgICAgICAgICAgIEhpc3RvcnkucmVwbGFjZVVybChzdGVwVXJsLCBzdGVwVXJsLnRvU3RyaW5nKCksIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4ZWN1dGVkRnVuY3Rpb25Qcm9taXNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VHJhaWxOb2RlfSBub2RlIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0aGVGdW5jdGlvbiBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBzdGF0aWMgZ2V0Tm9kZUJ5RnVuY3Rpb24obm9kZSwgdGhlRnVuY3Rpb24pIHtcblxuICAgICAgICBpZiAodGhlRnVuY3Rpb24gPT09IG5vZGUuZGVzdGluYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vZGUubmV4dCkge1xuICAgICAgICAgICAgbGV0IG1hdGNoaW5nTm9kZSA9IG51bGw7XG4gICAgICAgICAgICBub2RlLm5leHQuZm9yRWFjaCgoY2hpbGROb2RlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFtYXRjaGluZ05vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdOb2RlID0gVHJhaWxQcm9jZXNzb3IuZ2V0Tm9kZUJ5RnVuY3Rpb24oY2hpbGROb2RlLCB0aGVGdW5jdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAobWF0Y2hpbmdOb2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoaW5nTm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHBhcmFtIHthbnl9IG9iamVjdCBcbiAgICAgKiBAcGFyYW0ge1RyYWlsTm9kZX0gbm9kZSBcbiAgICAgKiBAcGFyYW0ge0xpc3Q8U3RyaW5nPn0gdHJhaWxTdG9wc1xuICAgICAqIEByZXR1cm5zIHtMaXN0PFN0cmluZz59XG4gICAgICovXG4gICAgc3RhdGljIGNhbGxNYXRjaGluZ0Z1bmN0aW9uRnJvbVVybCh1cmwsIGN1cnJlbnRPYmplY3QsIG5vZGUsIHRyYWlsU3RvcHMgPSBuZXcgTGlzdCgpKSB7XG5cbiAgICAgICAgaWYgKG5vZGUucHJvcGVydHkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRPYmplY3QgPSBjdXJyZW50T2JqZWN0W25vZGUucHJvcGVydHldO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFN0cmluZ1V0aWxzLnN0YXJ0c1dpdGgodXJsLmJvb2ttYXJrLCBUcmFpbFByb2Nlc3Nvci50b1N0YXJ0c1dpdGgobm9kZS50cmFpbCkpKSB7XG4gICAgICAgICAgICB0cmFpbFN0b3BzLmFkZChub2RlLnRyYWlsKTtcbiAgICAgICAgICAgIGlmIChub2RlLndheXBvaW50KSB7XG4gICAgICAgICAgICAgICAgbm9kZS53YXlwb2ludC5jYWxsKGN1cnJlbnRPYmplY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFN0cmluZ1V0aWxzLm5vbk51bGxFcXVhbHModXJsLmJvb2ttYXJrLCBub2RlLnRyYWlsKSkge1xuICAgICAgICAgICAgdHJhaWxTdG9wcy5hZGQobm9kZS50cmFpbCk7XG4gICAgICAgICAgICBpZiAobm9kZS5kZXN0aW5hdGlvbikge1xuICAgICAgICAgICAgICAgIG5vZGUuZGVzdGluYXRpb24uY2FsbChjdXJyZW50T2JqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLm5leHQpIHtcbiAgICAgICAgICAgIG5vZGUubmV4dC5mb3JFYWNoKChjaGlsZE5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICB0cmFpbFN0b3BzID0gVHJhaWxQcm9jZXNzb3IuY2FsbE1hdGNoaW5nRnVuY3Rpb25Gcm9tVXJsKHVybCwgY3VycmVudE9iamVjdCwgY2hpbGROb2RlLCB0cmFpbFN0b3BzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRyYWlsU3RvcHM7XG4gICAgfVxuXG4gICAgc3RhdGljIHRvU3RhcnRzV2l0aCh0cmFpbCkge1xuXG4gICAgICAgIGlmIChudWxsID09IHRyYWlsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCIvXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyh0cmFpbCwgXCIvXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gXCIvXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJhaWwgKyBcIi9cIjtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBNYXAsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcblxuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSHR0cENhbGxCdWlsZGVyXCIpO1xuXG5leHBvcnQgY2xhc3MgSHR0cENhbGxCdWlsZGVyIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHBheWxvYWQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodXJsLCBwYXlsb2FkKSB7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMudXJsID0gdXJsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7T2JqZWN0fSAqL1xuICAgICAgICB0aGlzLnBheWxvYWQgPSBwYXlsb2FkO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xuICAgICAgICB0aGlzLmF1dGhvcml6YXRpb24gPSBudWxsO1xuXG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMuc3VjY2Vzc01hcHBpbmdNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMuZmFpbE1hcHBpbmdNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtmdW5jdGlvbn0gKi9cbiAgICAgICAgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbiA9IChlcnJvcikgPT4geyByZXR1cm4gZXJyb3I7IH07XG5cblxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICAgICAgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlID0gNDAwMDtcblxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICAgICAgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSA9IDQwMDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGF5bG9hZCBcbiAgICAgKiBAcmV0dXJucyB7SHR0cENhbGxCdWlsZGVyfVxuICAgICAqL1xuICAgIHN0YXRpYyBuZXdJbnN0YW5jZSh1cmwsIHBheWxvYWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBIdHRwQ2FsbEJ1aWxkZXIodXJsLCBwYXlsb2FkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY29kZSBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtYXBwZXJGdW5jdGlvbiBtYXBwZXIgZnVuY3Rpb24gdG8gcGFzcyB0aGUgcmVzdWx0IG9iamVjdCB0b1xuICAgICAqL1xuICAgIHN1Y2Nlc3NNYXBwaW5nKGNvZGUsIG1hcHBlckZ1bmN0aW9uID0gKCkgPT4geyByZXR1cm4gbnVsbDsgfSkge1xuICAgICAgICB0aGlzLnN1Y2Nlc3NNYXBwaW5nTWFwLnNldChjb2RlLCBtYXBwZXJGdW5jdGlvbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IG1hcHBlckZ1bmN0aW9uIG1hcHBlciBmdW5jdGlvbiB0byBwYXNzIHRoZSByZXN1bHQgb2JqZWN0IHRvXG4gICAgICovXG4gICAgZmFpbE1hcHBpbmcoY29kZSwgbWFwcGVyRnVuY3Rpb24gPSAoKSA9PiB7IHJldHVybiBudWxsOyB9KSB7XG4gICAgICAgIHRoaXMuZmFpbE1hcHBpbmdNYXAuc2V0KGNvZGUsIG1hcHBlckZ1bmN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cbiAgICAgKi9cbiAgICBlcnJvck1hcHBpbmcobWFwcGVyRnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbiA9IG1hcHBlckZ1bmN0aW9uO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXphdGlvbiBcbiAgICAgKi9cbiAgICBhdXRob3JpemF0aW9uSGVhZGVyKGF1dGhvcml6YXRpb24pIHtcbiAgICAgICAgdGhpcy5hdXRob3JpemF0aW9uID0gXCJCZWFyZXIgXCIgKyBhdXRob3JpemF0aW9uO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb25uZWN0aW9uVGltZW91dChjb25uZWN0aW9uVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSA9IGNvbm5lY3Rpb25UaW1lb3V0VmFsdWU7XG4gICAgfVxuXG4gICAgcmVzcG9uc2VUaW1lb3V0KHJlc3BvbnNlVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUgPSByZXNwb25zZVRpbWVvdXRWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBnZXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzVHlwZU1hcHBlZFByb21pc2UoXG4gICAgICAgICAgICBDbGllbnQuZ2V0KHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBwb3N0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKFxuICAgICAgICAgICAgQ2xpZW50LnBvc3QodGhpcy51cmwsIHRoaXMucGF5bG9hZCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlLCB0aGlzLmF1dGhvcml6YXRpb24pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgcHV0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKFxuICAgICAgICAgICAgQ2xpZW50LnB1dCh0aGlzLnVybCwgdGhpcy5wYXlsb2FkLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBwYXRjaCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXNUeXBlTWFwcGVkUHJvbWlzZShcbiAgICAgICAgICAgIENsaWVudC5wYXRjaCh0aGlzLnVybCwgdGhpcy5wYXlsb2FkLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbilcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBkZWxldGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFzVHlwZU1hcHBlZFByb21pc2UoXG4gICAgICAgICAgICBDbGllbnQuZGVsZXRlKHRoaXMudXJsLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtQcm9taXNlfSBmZXRjaFByb21pc2UgXG4gICAgICovXG4gICAgYXNUeXBlTWFwcGVkUHJvbWlzZShmZXRjaFByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZmV0Y2hQcm9taXNlLnRoZW4oKGZldGNoUmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUZldGNoUmVzcG9uc2UoZmV0Y2hSZXNwb25zZSwgcmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEFQSSBkaWQgbm90IGV4ZWN1dGVcbiAgICAgICAgICAgICAgICByZWplY3QodGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihlcnJvcikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7UmVzcG9uc2V9IGZldGNoUmVzcG9uc2UgXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZSBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZWplY3QgXG4gICAgICovXG4gICAgaGFuZGxlRmV0Y2hSZXNwb25zZShmZXRjaFJlc3BvbnNlLCByZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgY29uc3Qgc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyID0gdGhpcy5zdWNjZXNzTWFwcGluZ01hcC5nZXQoZmV0Y2hSZXNwb25zZS5zdGF0dXMpO1xuICAgICAgICBjb25zdCBmYWlsUmVzcG9uc2VNYXBwZXIgPSB0aGlzLmZhaWxNYXBwaW5nTWFwLmdldChmZXRjaFJlc3BvbnNlLnN0YXR1cyk7XG5cbiAgICAgICAgLy8gRW1wdHkgcmVzcG9uc2VcbiAgICAgICAgaWYgKDIwNCA9PT0gZmV0Y2hSZXNwb25zZS5zdGF0dXMgfHwgZmV0Y2hSZXNwb25zZS5oZWFkZXJzLmdldChcIkNvbnRlbnQtTGVuZ3RoXCIpID09PSBcIjBcIikge1xuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NSZXNwb25zZU1hcHBlcikge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKG51bGwpKTsgXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZmFpbFJlc3BvbnNlTWFwcGVyKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGZhaWxSZXNwb25zZU1hcHBlcihudWxsKSk7IFxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJNaXNzaW5nIG1hcHBlciBmb3IgcmV0dXJuIHN0YXR1czogXCIgKyBmZXRjaFJlc3BvbnNlLnN0YXR1cykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzdW1pbmcganNvbiByZXNwb25zZSAgICAgICAgXG4gICAgICAgIGZldGNoUmVzcG9uc2UuanNvbigpLnRoZW4oKHJlc3BvbnNlSnNvbikgPT4ge1xuICAgICAgICAgICAgaWYoc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKSB7IFxuICAgICAgICAgICAgICAgIHJlc29sdmUoc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKHJlc3BvbnNlSnNvbikpOyBcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihmYWlsUmVzcG9uc2VNYXBwZXIpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZmFpbFJlc3BvbnNlTWFwcGVyKHJlc3BvbnNlSnNvbikpOyBcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWplY3QodGhpcy5lcnJvck1hcHBpbmdGdW5jdGlvbihyZXNwb25zZUpzb24pKTtcbiAgICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICAvLyBSZXNwb25zZSBkaWQgbm90IHByb3ZpZGUganNvblxuICAgICAgICAgICAgcmVqZWN0KHRoaXMuZXJyb3JNYXBwaW5nRnVuY3Rpb24oZXJyb3IpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJBYnN0cmFjdFZhbGlkYXRvclwiKTtcblxuZXhwb3J0IGNsYXNzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNDdXJyZW50bHlWYWxpZFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGN1cnJlbnRseVZhbGlkID0gZmFsc2UsIGVuYWJsZWQgPSB0cnVlKSB7XG4gICAgICAgIHRoaXMudmFsaWRMaXN0ZW5lckxpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QgPSBuZXcgTGlzdCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gY3VycmVudGx5VmFsaWQ7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgfVxuXG4gICAgZW5hYmxlKCkge1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICBpZiAodGhpcy5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIHRoaXMudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGlzYWJsZSgpIHtcbiAgICAgICAgbGV0IHdhc1ZhbGlkID0gdGhpcy5jdXJyZW50bHlWYWxpZDtcbiAgICAgICAgLy8gRmFrZSB2YWxpZFxuICAgICAgICB0aGlzLnZhbGlkKCk7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gd2FzVmFsaWQ7XG4gICAgfVxuXG4gICAgaXNWYWxpZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRseVZhbGlkO1xuICAgIH1cblxuXHR2YWxpZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gdHJ1ZTtcbiAgICAgICAgaWYoIXRoaXMudmFsaWRMaXN0ZW5lckxpc3QpIHtcbiAgICAgICAgICAgIExPRy53YXJuKFwiTm8gdmFsaWRhdGlvbiBsaXN0ZW5lcnNcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy52YWxpZExpc3RlbmVyTGlzdC5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG5cdH1cblxuXHRpbnZhbGlkKCkge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBmYWxzZTtcbiAgICAgICAgaWYoIXRoaXMuaW52YWxpZExpc3RlbmVyTGlzdCkge1xuICAgICAgICAgICAgTE9HLndhcm4oXCJObyBpbnZhbGlkYXRpb24gbGlzdGVuZXJzXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW52YWxpZExpc3RlbmVyTGlzdC5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG5cdH1cblxuXHR2YWxpZFNpbGVudCgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHRydWU7XG5cdH1cblxuXHRpbnZhbGlkU2lsZW50KCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gZmFsc2U7XG5cdH1cblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IHZhbGlkTGlzdGVuZXIgXG5cdCAqL1xuXHR3aXRoVmFsaWRMaXN0ZW5lcih2YWxpZExpc3RlbmVyKSB7XG5cdFx0dGhpcy52YWxpZExpc3RlbmVyTGlzdC5hZGQodmFsaWRMaXN0ZW5lcik7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGludmFsaWRMaXN0ZW5lciBcblx0ICovXG5cdHdpdGhJbnZhbGlkTGlzdGVuZXIoaW52YWxpZExpc3RlbmVyKSB7XG5cdFx0dGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0LmFkZChpbnZhbGlkTGlzdGVuZXIpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn1cbiIsImltcG9ydCB7IExpc3QsIE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3RWYWxpZGF0b3IuanMnO1xuXG5leHBvcnQgY2xhc3MgQW5kVmFsaWRhdG9yU2V0IGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IoaXNWYWxpZEZyb21TdGFydCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKGlzVmFsaWRGcm9tU3RhcnQpO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QgPSBuZXcgTGlzdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RWYWxpZGF0b3J9IHZhbGlkYXRvclxuICAgICAqL1xuICAgIHdpdGhWYWxpZGF0b3IodmFsaWRhdG9yKSB7XG4gICAgICAgIHZhbGlkYXRvci53aXRoVmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVWYWxpZCkpO1xuICAgICAgICB2YWxpZGF0b3Iud2l0aEludmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxuICAgICAqL1xuICAgIG9uZVZhbGlkKCkge1xuICAgICAgICBsZXQgZm91bmRJbnZhbGlkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmKCF2YWx1ZS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZEludmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgaWYoIWZvdW5kSW52YWxpZCkge1xuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxuICAgICAqL1xuICAgIG9uZUludmFsaWQoKSB7XG4gICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgUmVnZXhWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCByZWdleCA9IFwiKC4qKVwiKSB7XG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XG4gICAgICAgIHRoaXMucmVnZXggPSByZWdleDtcbiAgICB9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUubWF0Y2godGhpcy5yZWdleCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmKCF2YWx1ZSAmJiAhdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdFx0dGhpcy52YWxpZCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgdmFsdWUubWF0Y2godGhpcy5yZWdleCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmKCF2YWx1ZSAmJiAhdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdFx0dGhpcy52YWxpZFNpbGVudCgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cbn1cbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuY29uc3QgRU1BSUxfRk9STUFUID0gL15cXHcrKFtcXC4tXT9cXHcrKSpAXFx3KyhbXFwuLV0/XFx3KykqKFxcLlxcd3syLDN9KSskLztcblxuZXhwb3J0IGNsYXNzIEVtYWlsVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIEVNQUlMX0ZPUk1BVCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgRXF1YWxzRnVuY3Rpb25SZXN1bHRWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXG5cdCAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIGNvbXBhcmVkVmFsdWVGdW5jdGlvbiA9IG51bGwpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcblxuXHRcdC8qKiBAdHlwZSB7T2JqZWN0RnVuY3Rpb259ICovXG5cdFx0dGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24gPSBjb21wYXJlZFZhbHVlRnVuY3Rpb247XG5cdH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSB0aGlzLmNvbXBhcmVkVmFsdWVGdW5jdGlvbi5jYWxsKCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uLmNhbGwoKSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fVxuXHR9XG5cbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiwgUHJvcGVydHlBY2Nlc3NvciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgRXF1YWxzUHJvcGVydHlWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXG5cdCAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIG1vZGVsID0gbnVsbCwgYXR0cmlidXRlTmFtZSA9IG51bGwpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcblxuXHRcdC8qKiBAdHlwZSB7b2JqZWN0fSAqL1xuICAgICAgICB0aGlzLm1vZGVsID0gbW9kZWw7XG4gICAgICAgIFxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVOYW1lID0gYXR0cmlidXRlTmFtZTtcblx0fVxuXG5cdHZhbGlkYXRlKHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgdGhpcy5hdHRyaWJ1dGVOYW1lKSl7XG5cdCAgICBcdHRoaXMudmFsaWQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fVxuXHR9XG5cblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCB0aGlzLmF0dHJpYnV0ZU5hbWUpKXtcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9XG5cdH1cblxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7IE9iamVjdEZ1bmN0aW9uLCBQcm9wZXJ0eUFjY2Vzc29yIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBFcXVhbHNTdHJpbmdWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXG5cdCAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIGNvbnRyb2xWYWx1ZSA9IG51bGwpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XG5cdH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IGNvbnRyb2xWYWx1ZSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fVxuXHR9XG5cbn0iLCJpbXBvcnQgeyBMaXN0LCBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0VmFsaWRhdG9yLmpzJ1xuXG5leHBvcnQgY2xhc3MgT3JWYWxpZGF0b3JTZXQgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG4gICAgXG4gICAgY29uc3RydWN0b3IoaXNWYWxpZEZyb21TdGFydCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKGlzVmFsaWRGcm9tU3RhcnQpO1xuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QgPSBuZXcgTGlzdCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RWYWxpZGF0b3J9IHZhbGlkYXRvclxuICAgICAqL1xuICAgIHdpdGhWYWxpZGF0b3IodmFsaWRhdG9yKSB7XG4gICAgICAgIHZhbGlkYXRvci53aXRoVmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVWYWxpZCkpO1xuICAgICAgICB2YWxpZGF0b3Iud2l0aEludmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxuICAgICAqL1xuICAgIG9uZVZhbGlkKCkge1xuICAgICAgICBzdXBlci52YWxpZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxuICAgICAqL1xuICAgIG9uZUludmFsaWQoKSB7XG4gICAgICAgIGxldCBmb3VuZFZhbGlkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmKHZhbHVlLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIGZvdW5kVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgaWYoZm91bmRWYWxpZCkge1xuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuY29uc3QgUEFTU1dPUkRfRk9STUFUID0gL14oPz0uKltBLVphLXpdKSg/PS4qP1swLTldKSg/PS4qP1sjPyFAJCVeJiotXSkuezgsfSQvO1xuXG5leHBvcnQgY2xhc3MgUGFzc3dvcmRWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgUEFTU1dPUkRfRk9STUFUKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuY29uc3QgUEhPTkVfRk9STUFUID0gL15cXCtbMC05XXsyfVxccz8oWzAtOV1cXHM/KSokLztcblxuZXhwb3J0IGNsYXNzIFBob25lVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xuXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIFBIT05FX0ZPUk1BVCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBSZXF1aXJlZFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuXHRjb25zdHJ1Y3RvcihjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBlbmFibGVkID0gdHJ1ZSkge1xuXHRcdHN1cGVyKGN1cnJlbnRseVZhbGlkLCBlbmFibGVkKTtcblx0fVxuXG5cdHZhbGlkYXRlKHZhbHVlKXtcblx0XHRpZih2YWx1ZSA9PT0gXCJcIil7XG5cdCAgICBcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnZhbGlkKCk7XG5cdFx0fVxuXHR9XG5cblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xuXHRcdGlmKHZhbHVlID09PSBcIlwiKXtcblx0ICAgIFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9XG5cdH1cblxufVxuIl0sIm5hbWVzIjpbIkxPRyJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBTyxNQUFNLFlBQVksQ0FBQztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLLFNBQVMsQ0FBQyxHQUFHLEVBQUU7QUFDcEIsTUFBTTtBQUNOO0FBQ0E7O0FDUk8sTUFBTSxHQUFHO0FBQ2hCO0FBQ0EsSUFBSSxXQUFXLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLGlCQUFpQixFQUFFLFFBQVEsQ0FBQztBQUNqRixRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDO0FBQ3ZDLFFBQVEsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDL0IsUUFBUSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUMvQixRQUFRLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO0FBQzNDLFFBQVEsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixDQUFDO0FBQ25ELFFBQVEsSUFBSSxDQUFDLGNBQWMsR0FBRyxRQUFRLENBQUM7QUFDdkM7QUFDQSxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ2pDLFlBQVksSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0FBQzVDLFNBQVM7QUFDVCxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7QUFDckMsWUFBWSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUMvQyxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLFFBQVEsRUFB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

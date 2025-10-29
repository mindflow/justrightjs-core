'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var coreutil_v1 = require('coreutil_v1');
var containerbridge_v1 = require('containerbridge_v1');
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

const LOG$d = new coreutil_v1.Logger("AbstractValidator");

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
            LOG$d.warn("No validation listeners");
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
            LOG$d.warn("No invalidation listeners");
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

class NumberValidator extends RegexValidator {

    static PHONE_FORMAT = /^\d*$/;

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

class StyleSelector {
    /**
     * 
     * @param {String} className 
     */
    constructor(className) {

        /** @type {String} */
        this.className = className;

        /** @type {Map<String, String>} */
        this.attributes = new Map();
    }

    /**
     * 
     * @param {String} key
     * @param {String} value
     */
    withAttribute(key, value) {
        this.attributes.set(key, value);
        return this;
    }

    /**
     * 
     * @returns {String}
     */
    toString() {
        let attrString = "";
        this.attributes.forEach((value, key) => {
            attrString += `\t${key}: ${value};\n`;
        });
        return `${this.className} {\n${attrString}}`;
    }

}

class StyleMedia {

    /**
     * 
     * @param {String} media 
     */
    constructor(media) {

        /** @type {String} */
        this.media = media;

        /** @type {Array<StyleSelector>} */
        this.styleSelectorArray = [];
    }

    /**
     * 
     * @param {StyleSelector} styleSelector
     * @returns {StyleMedia}
     */
    withSelector(styleSelector) {
        this.styleSelectorArray.set(styleSelector);
        return this;
    }

    /**
     * 
     * @returns {String}
     */
    toString() {
        let mediaString = "";
        this.styleSelectorArray.forEach((value) => {
            mediaString += `${value.toString()}\n`;
        });
        return `${this.media} {\n${mediaString}\n}\n`;
    }

}

class Stylesheet {

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

class StylesheetBuilder {

    /**
     * 
     * @returns {StylesheetBuilder}
     */
    static create() {
        return new StylesheetBuilder();
    }

    constructor() {

        /** @type {StyleSelector[]} */
        this.styleSelectorArray = [];

        /** @type {StyleMedia[]} */
        this.mediaArray = [];

        /** @type {StyleSelector|StyleMedia} */
        this.lastAdded = null;

        /** @type {StyleSelector|StyleMedia} */
        this.context = null;

        /** @type {StyleSelector|StyleMedia} */
        this.parentContext = null;

    }

    open() {
        if (!this.lastAdded) {
            throw new Error("No context to open");
        }
        if (this.lastAdded) {
            if (this.context !== null) {
                this.parentContext = this.context;
            }
            this.context = this.lastAdded;
        }
        return this;
    }

    close() {
        if (this.context === null) {
            throw new Error("No context to close");
        }
        this.context = this.parentContext;
        this.parentContext = null;
        return this;
    }

    /**
     * 
     * @param {String} styleSelectorName 
     * @returns {StylesheetBuilder}
     */
    selector(styleSelectorName) {
        const element = new StyleSelector(styleSelectorName);
        if (this.context === null) {
            this.styleSelectorArray.push(element);
        } else if(this.context instanceof StyleMedia) {
            this.context.styleSelectorArray.push(element);
        } else {
            throw new Error(`Open context must be a media context when adding ${styleSelectorName}`);
        }
        this.lastAdded = element;
        return this;
    }

    media(mediaSelector) {
        if (this.context !== null) {
            throw new Error(`Cannot add media ${mediaSelector} inside open context`);
        }
        const element = new StyleMedia(mediaSelector);
        this.mediaArray.push(element);
        this.lastAdded = element;
        return this;
    }

    /**
     * 
     * @param {String} property 
     * @param {String|Number} value 
     * @returns {StylesheetBuilder}
     */
    style(property, value) {
        if (!(this.context instanceof StyleSelector)) {
            throw new Error(`No open selector context when adding style ${property}`);
        }
        this.context.withAttribute(property, value);
        return this;
    }

    /**
     * 
     * @returns {Stylesheet}
     */
    build() {
        let stylesString = "";
        this.styleSelectorArray.forEach((styleSelector) => {
            stylesString += styleSelector.toString() + "\n";
        });
        this.mediaArray.forEach((styleMedia) => {
            stylesString += styleMedia.toString() + "\n";
        });
        return new Stylesheet(stylesString);
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

class Client {

    /**
     * 
     * @param {String} url 
     * @param {String} authorization
     * @param {Number} timeout
     * @returns {Promise<ContainerHttpResponse>|Promise<ContainerDownload>}
     */
    static get(url, authorization = null, timeout = 1000, download = false) {
        const headers = Client.getHeader(authorization);
        const params =  {
            headers: headers,
            method: 'GET',
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow' // manual, *follow, error
        };
        if (download) {
            return containerbridge_v1.ContainerHttpClient.download(url.toString(), params, timeout);
        }
        return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, timeout);
    }

    /**
     * 
     * @param {String} url 
     * @param {Object|ContainerUploadData} data
     * @param {String} authorization
     * @param {Method} progrecCallbackMethod
     * @param {Number} timeout
     * @returns {Promise<ContainerHttpResponse>}
     */
    static post(url, data, authorization = null, progrecCallbackMethod = null, timeout = 1000){
        if (data instanceof containerbridge_v1.ContainerUploadData) {
            return containerbridge_v1.ContainerHttpClient.upload("POST", url, data, authorization, progrecCallbackMethod, timeout);
        }
        const headers = Client.getHeader(authorization);
        const params =  {
            body: JSON.stringify(data), // must match 'Content-Type' header
            headers: headers,
            method: "POST",
            mode: "cors", // no-cors, cors, *same-origin
            redirect: "follow", // manual, *follow, error
        };
        return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, timeout);
    }

    /**
     * 
     * @param {String} url 
     * @param {Object|ContainerUploadData} data
     * @param {String} authorization
     * @param {Method} progrecCallbackMethod
     * @param {Number} timeout
     * @returns {Promise<ContainerHttpResponse>}
     */
    static put(url, data, authorization = null, progrecCallbackMethod = null, timeout = 1000){
        if (data instanceof containerbridge_v1.ContainerUploadData) {
            return containerbridge_v1.ContainerHttpClient.upload("PUT", url, data, authorization, progrecCallbackMethod, timeout);
        }
        const headers = Client.getHeader(authorization);
        const params =  {
            body: JSON.stringify(data), // must match 'Content-Type' header
            method: 'PUT', 
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow', // manual, *follow, error
            headers: headers
        };
        return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, timeout);
    }

    /**
     * 
     * @param {String} url 
     * @param {Object|ContainerUploadData} data
     * @param {String} authorization
     * @param {Method} progrecCallbackMethod
     * @param {Number} timeout
     * @returns {Promise<ContainerHttpResponse>}
     */
    static patch(url, data, authorization = null, progrecCallbackMethod = null, timeout = 1000) {
        const headers = Client.getHeader(authorization);
        const params =  {
            body: JSON.stringify(data), // must match 'Content-Type' header
            method: 'PATCH', 
            mode: 'cors', // no-cors, cors, *same-origin
            redirect: 'follow', // manual, *follow, error
            headers: headers
        };
        return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, timeout);
    }

    /**
     * 
     * @param {String} url
     * @param {Object|ContainerUploadData} data
     * @param {String} authorization
     * @param {Method} progrecCallbackMethod
     * @param {Number} timeout
     * @returns {Promise<ContainerHttpResponse>}
     */
    static delete(url, data, authorization = null, progrecCallbackMethod = null, timeout = 1000) {
        const headers = Client.getHeader(authorization);
        if (data) {
            const params =  {
                body: JSON.stringify(data), // must match 'Content-Type' header
                method: 'DELETE',
                mode: 'cors', // no-cors, cors, *same-origin
                redirect: 'follow', // manual, *follow, error
                headers: headers
            };
            return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, timeout);
        } else {
            const params =  {
                method: 'DELETE',
                mode: 'cors', // no-cors, cors, *same-origin
                redirect: 'follow', // manual, *follow, error
                headers: headers
            };
            return containerbridge_v1.ContainerHttpClient.fetch(url.toString(), params, timeout);
        }
    }

    static getHeader(authorization = null) {
        if (authorization) {
            return {
                "user-agent": "Mozilla/4.0 MDN Example",
                "content-type": "application/json",
                "Authorization": authorization
            }
        }
        return {
            "user-agent": "Mozilla/4.0 MDN Example",
            "content-type": "application/json"
        };
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
     * @param {String} anchor 
     */
    constructor(protocol, host, port, pathValueList, parameterValueMap, anchor){

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
        this.anchorString = anchor;
        
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

        if(this.anchor !== null) {
            value = value + "#" + this.anchor;
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

/* jshint esversion: 6 */

const LOG$c = new coreutil_v1.Logger("TemplateRegistry");

class TemplateRegistry {

    constructor(){
        /** @type {Map} */
        this.templateMap = new Map();

        /** @type {Map} */
        this.templateUrlMap = new Map();

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
        if (this.templateMap.get(name)) {
            return true;
        }
        return false;
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
        
        if(!nameUrlMap || nameUrlMap.length == 0) {
            return null;
        }
        let loadPromises = [];
        const parent = this;
        nameUrlMap.forEach((value, key) => {
            if (parent.contains(key)){
                return;
            }
            try {
                loadPromises.push(parent.privateLoad(key, UrlUtils.parse(value)));
            } catch(reason) {
                throw reason;
            }
        });
        return await Promise.all(loadPromises);
    }

    /**
     * 
     * @param {string} name 
     * @param {Url} url 
     */
    async privateLoad(name, url) {
        if (this.languagePrefix !== null) {
            url.pathsList.setLast(
                this.languagePrefix + "." +
                url.pathsList.getLast()
            );
        }
        LOG$c.info("Loading template " + name + " at " + url.toString());
        const response = await Client.get(url);
        if (!response.ok){
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
 * To be added to mindi as a singleton. Will scan through all configured classes that have a TEMPLATE_URL
 * static getter and will asyncronously load them. Returns a promise which resolves when all templates are loaded
 */
class TemplatesLoader {


    /**
     * 
     * @param {TemplateRegistry} templateRegistry 
     */
    constructor(templateRegistry) {

        /** @type {TemplateRegistry} */
        this.templateRegistry = templateRegistry;
    }

    /**
     * 
     * @param {Map<String,TypeConfig>} configEntries
     * @returns {Promise}
     */
    load(configEntries) {
        let templateMap = new Map();
        configEntries.forEach((configEntry, key) => {
            if (configEntry.classReference.TEMPLATE_URL) {
                templateMap.set(configEntry.classReference.name, configEntry.classReference.TEMPLATE_URL);
            }
        }); 
        return this.templateRegistry.getTemplatesLoadedPromise(templateMap);
    }

}

class MappedContainerElement {

    /**
     * 
     * @param {ContainerElement} element 
     */
    constructor(element) {

        if (!element) {
            throw new Error("ContainerElement must be provided");
        }

        /** @type {ContainerElement} */
        this.containerElement = element;
    }

}

const LOG$b = new coreutil_v1.Logger("ElementUtils");

class ElementUtils {


    /**
     * 
     * @param {any} value 
     * @param {MappedContainerElement} parent 
     * @returns 
     */
    static createContainerElement(value, parent) {
        if (value instanceof xmlparser_v1.XmlElement) {
            return ElementUtils.createFromXmlElement(value, parent);
        }
        if (typeof value === "string") {
            return containerbridge_v1.ContainerElementUtils.createElement(value);
        }
        if (containerbridge_v1.ContainerElementUtils.isUIElement(value)) {
            return new containerbridge_v1.ContainerElement(value);
        }
        LOG$b.error("Unrecognized value for Element");
        LOG$b.error(value);
        return null;
    }

    /**
     * Creates a browser Element from the XmlElement
     *
     * @param {XmlElement} xmlElement
     * @param {MappedContainerElement} parentElement
     * @return {HTMLElement}
     */
    static createFromXmlElement(xmlElement, parentElement) {
        let element = null;
        if (xmlElement.namespace) {
            element = containerbridge_v1.ContainerElementUtils.createElementNS(xmlElement.namespaceUri, xmlElement.fullName);
        } else {
            element = containerbridge_v1.ContainerElementUtils.createElement(xmlElement.name);
        }
        if (parentElement && parentElement.containerElement !== null) {
            parentElement.containerElement.appendChild(element);
        }
        xmlElement.attributes.forEach((attributeKey, attribute) => {
            containerbridge_v1.ContainerElementUtils.setAttributeValue(element, attributeKey, attribute.value);
            return true;
        });
        return element;
    }

}

new coreutil_v1.Logger("HttpCallBuilder");

/**
 * @template T
 */
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

        /** @type {Method} */
        this.progressCallbackMethod = null;

        /** @type {boolean} */
        this.downloadResponse = false;

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
     * @return {HttpCallBuilder}
     */
    successMapping(code, mapperFunction = () => { return null; }) {
        this.successMappingMap.set(code, mapperFunction);
        return this;
    }

    /**
     * 
     * @returns {HttpCallBuilder<ContainerDownload>}
     */
    asDownload() {
        this.downloadResponse = true;
        return this;
    }

    /**
     * 
     * @param {Number} code 
     * @param {function} mapperFunction mapper function to pass the result object to
     * @return {HttpCallBuilder}
     */
    failMapping(code, mapperFunction = () => { return null; }) {
        this.failMappingMap.set(code, mapperFunction);
        return this;
    }

    /**
     * 
     * @param {function} mapperFunction mapper function to pass the result object to
     * @return {HttpCallBuilder}
     */
    errorMapping(mapperFunction) {
        this.errorMappingFunction = mapperFunction;
        return this;
    }

    /**
     * 
     * @param {string} authorization 
     * @return {HttpCallBuilder}
     */
    authorizationHeader(authorization) {
        if (!coreutil_v1.StringUtils.isBlank(authorization)) {
            this.authorization = "Bearer " + authorization;
        }
        return this;
    }

    /**
     * 
     * @param {Method} progressCallbackMethod 
     * @returns {HttpCallBuilder}
     */
    progressCallback(progressCallbackMethod) {
        this.progressCallbackMethod = progressCallbackMethod;
        return this;
    }

    /**
     * 
     * @param {Number} connectionTimeoutValue 
     * @returns {HttpCallBuilder}
     */
    connectionTimeout(connectionTimeoutValue) {
        this.connectionTimeoutValue = connectionTimeoutValue;
        return this;
    }

    /**
     * 
     * @param {Number} responseTimeoutValue 
     * @returns {HttpCallBuilder}
     */
    responseTimeout(responseTimeoutValue) {
        this.responseTimeoutValue = responseTimeoutValue;
        return this;
    }

    /**
     * @returns {Promise<T>}
     */
    async get() {
        const response = Client.get(this.url, this.authorization, this.connectionTimeoutValue, this.downloadResponse);
        return this.asTypeMappedPromise(response);
    }

    /**
     * @param {Object|ContainerUploadData} payload
     * @returns {Promise<T>}
     */
    async post(payload) {
        const response = await Client.post(this.url, payload, this.authorization, this.progressCallbackMethod, this.connectionTimeoutValue);
        return this.asTypeMappedPromise(response);
    }

    /**
     * @param {Object|ContainerUploadData} payload
     * @returns {Promise<T>}
     */
    async put(payload) {
        const response = await Client.put(this.url, payload, this.authorization, this.progressCallbackMethod, this.connectionTimeoutValue);
        return this.asTypeMappedPromise(response);
    }

    /**
     * @param {Object|ContainerUploadData} payload
     * @returns {Promise<T>}
     */
    async patch(payload) {
        const response = await Client.patch(this.url, payload, this.authorization, this.progressCallbackMethod, this.connectionTimeoutValue);
        return this.asTypeMappedPromise(response);
    }

    /**
     * @param {Object|ContainerUploadData} payload
     * @returns {Promise<T>}
     */
    async delete(payload = null) {
        const response = await Client.delete(this.url, payload, this.authorization, this.progressCallbackMethod, this.connectionTimeoutValue);
        return this.asTypeMappedPromise(response);
    }

    /**
     * 
     * @param {Promise<ContainerHttpResponse} fetchPromise 
     */
    async asTypeMappedPromise(fetchPromise) {
        try {
            const fetchResponse = await fetchPromise;
            if (fetchResponse instanceof containerbridge_v1.ContainerDownload) {
                return fetchResponse;
            }
            return await this.handleFetchResponse(fetchResponse);
        } catch(error) {
            // API did not execute
            throw this.errorMappingFunction(error);
        }
    }

    /**
     * 
     * @param {ContainerHttpResponse} fetchResponse 
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
            if (failResponseMapper) {
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

class EmailValidator extends RegexValidator {

    static EMAIL_FORMAT = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

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

class UrlBuilder {

    constructor() {
        this.protocol = null;
        this.host = null;
        this.port = null;
        this.pathsList = new coreutil_v1.List();
        this.parametersMap = new coreutil_v1.Map();
        this.anchor = null;
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
     * @param {string} anchor 
     * @returns {UrlBuilder}
     */
    withAnchor(anchor) {
        this.anchor = UrlUtils.determineBookmark({ "string" : anchor });
        return this;
    }

    build() {
        return new Url(this.protocol, this.host, this.port, this.pathsList, this.parametersMap, this.anchor);
    }
}

const PASSWORD_FORMAT = /^(?=.*[A-Za-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

class PasswordValidator extends RegexValidator {

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, PASSWORD_FORMAT);
    }

}

class PhoneValidator extends RegexValidator {

    static PHONE_FORMAT = /^\+[0-9]{2}\s?([0-9]\s?)*$/;

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

class ModuleRunner {

    /**
     * 
     * @param {Url} url 
     * @returns 
     */
     runModule(url) {
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
    loadPath(path) {
        const url = History.currentUrl();
        const newUrl = UrlBuilder.builder().withRootOfUrl(url).withPath(path).build();
        History.pushUrl(newUrl);
        return newUrl;
    }

    /**
     * Load anchor without renavigating browser
     * @param {string} anchor
     * @returns {Url}
     */
    loadAnchor(anchor) {
        const url = History.currentUrl();
        const newUrl = UrlBuilder.builder().withRootOfUrl(url).withAnchor(anchor).build();
        History.pushUrl(newUrl);
        return newUrl;
    }

}

class TrailNode {

    constructor() {

        /** @type {boolean} */
        this.root = false;

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
     * Load anchor without renavigating browser
     * @param {TrailNode} trailNode 
     */
     async load(trailNode) {
        const url = Navigation.instance().loadAnchor(trailNode.trail);
        return await this.moduleRunner.runModule(url);
    }
}

/* jshint esversion: 6 */

const LOG$a = new coreutil_v1.Logger("StylesRegistry");

class StylesRegistry {

    constructor(){
        /** @type {Map} */
        this.stylesMap = new Map();

        /** @type {Map} */
        this.stylesUrlMap = new Map();

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
    set(name, styles, url){
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
        if (this.stylesMap.get(name)) {
            return true;
        }
        return false;
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
        if(registry.callback !== null && registry.callback !== undefined  && registry.stylesQueueSize === registry.stylesMap.entries.length){
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
        this.set(name, new Stylesheet(text), url);
        this.doCallback(this);
        return null;
    }

    /**
     * 
     * @param {Map<string, string>} nameUrlMap 
     * @returns 
     */
    async getStylesLoadedPromise(nameUrlMap) {
        
        if(!nameUrlMap || nameUrlMap.size == 0) {
            return null;
        }
        let loadPromises = [];
        const parent = this;
        nameUrlMap.forEach((value, key) => {
            if (parent.contains(key)){
                return true;
            }
            try {
                loadPromises.push(parent.privateLoad(key, UrlUtils.parse(value)));
            } catch(reason) {
                throw reason;
            }
        });
        return await Promise.all(loadPromises);
    }

    /**
     * 
     * @param {string} name 
     * @param {Url} url 
     */
    async privateLoad(name, url) {
        LOG$a.info("Loading styles " + name + " at " + url.toString());

        const response = await Client.get(url);
        if(!response.ok){
            throw "Unable to load styles for " + name + " at " + url;
        }
        const text = await response.text();
        const styles = new Stylesheet(text);
        this.set(name, styles, url);
        return styles;
    }
}

new coreutil_v1.Logger("StylesLoader");

/**
 * To be added to mindi as a singleton. Will scan through all configured classes that have a STYLES_URL
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
     * @param {Map<String, TypeConfig>} configEntries
     * @returns {Promise}
     */
    load(configEntries) {
        const stylesMap = new Map();
        configEntries.forEach((configEntry, key) => {
            if(configEntry.classReference.STYLES_URL) {
                stylesMap.set(configEntry.classReference.name, configEntry.classReference.STYLES_URL);
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
     * @param {Map<string, TypeConfig>} unconfiguredConfigEntries
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

const LOG$9 = new coreutil_v1.Logger("LoaderInterceptor");

class LoaderInterceptor {

    /**
     * @returns {Boolean}
     */
    process() {
        LOG$9.info("Unimplemented Loader Interceptor breaks by default");
        return false;
    }

}

const LOG$8 = new coreutil_v1.Logger("ModuleLoader");

class ModuleLoader {

    /**
     * 
     * @param {String} modulePath 
     * @param {string} trailMap 
     * @param {Array<LoaderInterceptor>} loaderInterceptors
     */
    constructor(modulePath, trailMap, loaderInterceptors = []) {
    
        /**
         * @type {string}
         */
        this.modulePath = modulePath;

        /**
         * @type {TrailNode}
         */
        this.trailMap = trailMap;

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
        if (!this.trailMap) {
            return true;
        }
        if (!url) {
            LOG$8.error("Url is null");
            return false;
        }
        if (!url.anchor) {
            if (this.trailMap.root) {
                return true;
            }
            return false;
        }
        return coreutil_v1.StringUtils.startsWith(url.anchor + "/", this.trailMap.trail + "/");
    }

    /**
     * 
     * @returns {Promise<Main>}
     */
    async load() {
        try {
            const module = await this.importModule();
            await this.interceptorsPass();
            return module;
        } catch(reason) {
            LOG$8.warn("Filter rejected " + reason);
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

class Module {

    constructor() {

        /** @type {Url} */
        this.url = null;

        /** @type {TrailNode} */
        this.trailMap = null;
    }

    async load() {
        throw "Module class must implement load()";
    }

}

const LOG$7 = new coreutil_v1.Logger("DiModuleLoader");

class DiModuleLoader extends ModuleLoader {

    /**
     * 
     * @param {String} modulePath 
     * @param {object} trailMap 
     * @param {MindiConfig} config
     * @param {Array<LoaderInterceptor>} loaderInterceptors
     */
    constructor(modulePath, trailMap, config, loaderInterceptors = []) {
        super(modulePath, trailMap, loaderInterceptors);

        /** @type {MindiConfig} */
        this.config = config;
    }

    /**
     * 
     * @returns {Promise<Module>}
     */
    async load() {
        try {
            const module = await this.importModule();
            await this.interceptorsPass();
            return await mindi_v1.MindiInjector.inject(module, this.config);
        } catch(reason) {
            LOG$7.warn("Module loader failed " + reason);
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
            const module = await super.importModule();
            this.config.addAllTypeConfig(module.typeConfigArray);
            await this.config.finalize();
            const workingConfig = this.config;
            await coreutil_v1.ArrayUtils.promiseChain(this.loaderInterceptors, (loaderInterceptor) => {
                return mindi_v1.MindiInjector.inject(loaderInterceptor, workingConfig);
            });
            return module;
        } catch(error) {
            throw error;
        }
    }
}

/**
 * StateManager
 * 
 * @template T
 */
class StateManager {

    constructor() {
        /** @type {Map<String, T>} */
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

    get objectArray() {
        return Array.from(this.objectMap.values());
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

    async delete(key = "__DEFAULT__") {
        this.objectMap.delete(key);
        this.listeners.delete(key);
        this.signalStateChange(null, key);
    }

    async clear() {
        for (let key of this.objectMap.keys()) {
            this.signalStateChange(null, key);
        }
        this.signalStateChange(null, "__ANY__");
        this.objectMap.clear();
        this.listeners.clear();
    }

    signalStateChange(object, key) {
        if (this.listeners.has(key)) {
            for (let listener of this.listeners.get(key)) {
                listener.call([object, key]);
            }
        }

        const anyKey = "__ANY__";
        if (key != anyKey && this.listeners.has(anyKey)) {
            for (let listener of this.listeners.get(anyKey)) {
                listener.call([object, key]);
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

const LOG$6 = new coreutil_v1.Logger("BaseElement");

/**
 * A base class for enclosing an HTMLElement
 */
class BaseElement extends MappedContainerElement {

    /**
     * Constructor
     *
     * @param {XmlElement|string|any} value Value to be converted to Container UI Element (HTMLElement in the case of Web Browser)
     * @param {BaseElement} parent the parent BaseElement
     */
    constructor(value, parent) {
        super(ElementUtils.createContainerElement(value, parent));
        this.attributeMap = null;
        this.eventsAttached = new coreutil_v1.List();
    }

    loadAttributes() {
        if (this.containerElement.attributes === null || this.containerElement.attributes === undefined) {
            this.attributeMap = new coreutil_v1.Map();
            return;
        }
        if (this.attributeMap === null || this.attributeMap === undefined) {
            this.attributeMap = new coreutil_v1.Map();
            for (var i = 0; i < this.containerElement.attributes.length; i++) {
                this.attributeMap.set(this.containerElement.attributes[i].name,new Attribute(this.containerElement.attributes[i]));
            }
        }
    }

    /**
     * 
     * @param {string} eventType 
     * @param {Method} listener 
     * @param {boolean} capture 
     * @returns 
     */
    listenTo(eventType, listener, capture) {
        this.containerElement.addEventListener(eventType, listener, capture);
        return this;
    }

    get fullName() {
        return this.containerElement.tagName;
    }

    get top() {
        return this.containerElement.boundingClientRect.top;
    }

    get bottom() {
        return this.containerElement.boundingClientRect.bottom;
    }

    get left() {
        return this.containerElement.boundingClientRect.left;
    }

    get right() {
        return this.containerElement.boundingClientRect.right;
    }

    get width() {
        return this.containerElement.offsetWidth;
    }

    get height() {
        return this.containerElement.offsetHeight;
    }

    get attributes() {
        this.loadAttributes();
        return this.attributeMap;
    }

    setAttributeValue(key, value) {
        containerbridge_v1.ContainerElementUtils.setAttributeValue(this.containerElement, key,value);
    }

    getAttributeValue(key) {
        return containerbridge_v1.ContainerElementUtils.getAttributeValue(this.containerElement, key);
    }

    containsAttribute(key) {
        const containerElement = this.containerElement;
        return containerElement.hasAttribute(key);
    }

    removeAttribute(key) {
        this.containerElement.removeAttribute(key);
    }

    setStyle(key, value) {
        this.containerElement.style[key] = value;
    }

    getStyle(key) {
        return this.containerElement.style[key];
    }

    removeStyle(key) {
        this.containerElement.style[key] = null;
    }

    set(input) {
        if(!this.containerElement.parentNode){
            console.error("The element has no parent, can not swap it for value");
            return;
        }
        /** @type {ContainerElement} */
        const parentNode = this.containerElement.parentNode;

        if(input.containerElement) {
            parentNode.replaceChild(input.containerElement);
            return;
        }
        if(input && input.rootElement) {
            parentNode.replaceChild(input.rootElement.containerElement, this.containerElement);
            this.containerElement = input.rootElement.containerElement;
            return;
        }
        if(typeof input == "string") {
            parentNode.replaceChild(containerbridge_v1.ContainerElementUtils.createTextNode(input), this.containerElement);
            return;
        }
        if(input instanceof Text) {
            parentNode.replaceChild(input, this.containerElement);
            return;
        }
        if(input instanceof Element) {
            parentNode.replaceChild(input, this.containerElement);
            return;
        }
        LOG$6.warn("No valid input to set the element");
        LOG$6.warn(input);
    }

    isMounted() {
        if(this.containerElement.parentNode) {
            return true;
        }
        return false;
    }

    remove() {
        if (this.containerElement.parentNode) {
            /** @type {ContainerElement} */
            const parentNode = this.containerElement.parentNode;
            parentNode.removeChild(this.containerElement);
        }
    }

    clear() {
        while (this.containerElement.firstChild) {
            this.containerElement.removeChild(this.containerElement.firstChild);
        }
    }

    setChild(input) {
        this.clear();
        this.addChild(input);
    }

    addChild(input) {
        if (input.containerElement !== undefined && input.containerElement !== null){
            this.containerElement.appendChild(input.containerElement);
            return;
        }
        if (input && input.rootElement) {
            this.containerElement.appendChild(input.rootElement.containerElement);
            return;
        }
        if (typeof input == "string") {
            this.containerElement.appendChild(containerbridge_v1.ContainerElementUtils.createTextNode(input));
            return;
        }
        if (input instanceof Text) {
            this.containerElement.appendChild(input);
            return;
        }
        if (input instanceof Element) {
            const containerElement = new containerbridge_v1.ContainerElement(input);
            this.containerElement.appendChild(containerElement);
            return;
        }
        LOG$6.warn("No valid input to add the element");
        LOG$6.warn(input);
    }

    prependChild(input) {
        if(this.containerElement.firstChild === null) {
            this.addChild(input);
        }
        if (input.containerElement !== undefined && input.containerElement !== null) {
            this.containerElement.insertBefore(input.containerElement, this.containerElement.firstChild);
            return;
        }
        if (input && input.rootElement) {
            this.containerElement.insertBefore(input.rootElement.containerElement, this.containerElement.firstChild);
            return;
        }
        if (typeof input == "string") {
            this.containerElement.insertBefore(containerbridge_v1.ContainerElementUtils.createTextNode(input), this.containerElement.firstChild);
            return;
        }
        if (input instanceof containerbridge_v1.ContainerText) {
            this.containerElement.insertBefore(input, this.containerElement.firstChild);
            return;
        }
        if (input instanceof Element) {
            this.containerElement.insertBefore(input, this.containerElement.firstChild);
            return;
        }
        LOG$6.warn("No valid input to prepend the element");
        LOG$6.warn(input);
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
        return this.containerElement.name;
    }

    /**
     * Set the value of inputs name
     *
     * @param {string} value
     */
    set name(value) {
        this.containerElement.name = value;
    }

    /**
     * Returns the value given any processing rules
     */
    get value(){
        return this.backingValue;
    }

    set value(value){
        this.containerElement.value = value;
        this.containerElement.dispatchEvent('change');
    }

    /**
     * Returns the source value
     */
    get backingValue(){
        return this.containerElement.value;
    }

    focus() {
        this.containerElement.focus();
    }

    selectAll() {
        this.containerElement.select();
    }

    enable() {
        this.containerElement.disabled = false;
    }

    disable() {
        this.containerElement.disabled = true;
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
        this.containerElement.checked = value;
    }

    isChecked(){
        return this.containerElement.checked;
    }

    get value() {
        return this.isChecked();
    }

    set value(value) {
        this.containerElement.checked = (value === true || value === "true");
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
        this.containerElement.checked = value;
    }

    isChecked(){
        return this.containerElement.checked;
    }

    get value() {
        return this.isChecked();
    }

    set value(value) {
        this.containerElement.checked = (value === true || value === "true");
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
        return this.containerElement.innerHTML;
    }

    set innerHTML(value){
        this.containerElement.innerHTML = value;
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

        /** @type {ContainerElement} */
        this.containerElement = null;

        if(value instanceof xmlparser_v1.XmlCdata) {
            this.containerElement = this.createFromXmlCdata(value, parent);
        }
        if(typeof value === "string"){
            this.containerElement = containerbridge_v1.ContainerElementUtils.createTextNode(value);
        }
    }

    /**
     * 
     * @param {XmlCdata} cdataElement 
     * @param {BaseElement} parentElement 
     */
    createFromXmlCdata(cdataElement, parentElement) {
        const element = containerbridge_v1.ContainerElementUtils.createTextNode(cdataElement.value);
        if(parentElement !== null && parentElement.containerElement !== null) {
            parentElement.containerElement.appendChild(element);
        }
        return element;
    }

    set value(value) {
        this.element = value;
    }

    get value() {
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
        return this.containerElement.innerHTML;
    }

    set innerHTML(value){
        this.containerElement.innerHTML = value;
    }

    focus() {
        this.containerElement.focus();
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
        return this.containerElement.name;
    }

    /**
     * Set the value of inputs name
     *
     * @param {string} value
     */
    set name(value) {
        this.containerElement.name = value;
    }

    submit() {
        return this.containerElement.submit();
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
        return this.containerElement;
    }

    playMuted() {
        this.containerElement.playMuted();
    }

    play() {
        this.containerElement.play();
    }

    mute() {
        this.containerElement.muted = true;
    }

    unmute() {
        this.containerElement.muted = false;
    }

}

/* jshint esversion: 6 */

class OptionElement extends BaseElement {
	/**
	 * Constructor
	 *
	 * @param {XmlElement} element 
	 * @param {BaseElement} parent 
	 */
	constructor(element, parent) {
		super(element, parent);
        this.optionLabel = null;
	}

    get value(){
        return this.getAttributeValue("value");
    }

    set value(val){
        this.setAttributeValue("value", val);
    }

    get label(){
        return this.optionLabel;
    }

    set label(value){
        this.optionLabel = value;
        this.setChild(value);
    }
}

/* jshint esversion: 6 */

class SelectElement extends BaseElement {
	/**
	 * Constructor
	 *
	 * @param {XmlElement} element 
	 * @param {BaseElement} parent 
	 */
	constructor(element, parent) {
		super(element, parent);

        /** @type {Array<OptionElement>} */
        this.optionsArray = [];
	}

    /**
     * Get options as array of OptionElement
     * @return {Array<OptionElement>}
     */
    get options(){
        return this.optionsArray;
    }

    /**
     * Set options from array of OptionElement
     * @param {Array<OptionElement>} optionsArray
     */
    set options(optionsArray){
        this.optionsArray = optionsArray;
        this.renderOptions();
    }

    renderOptions(){
        while (this.containerElement.firstChild) {
            this.containerElement.removeChild(this.containerElement.firstChild);
        }
        for (const option of this.optionsArray){
            this.containerElement.appendChild(option.containerElement);
        }
    }

    /**
     * Get the value of the inputs name
     *
     * @return {string}
     */
    get name() {
        return this.containerElement.name;
    }

    /**
     * Set the value of inputs name
     *
     * @param {string} value
     */
    set name(value) {
        this.containerElement.name = value;
    }

    /**
     * Returns the value given any processing rules
     */
    get value(){
        return this.backingValue;
    }

    /**
     * Returns the source value
     */
    get backingValue(){
        return this.containerElement.value;
    }

    focus() {
        this.containerElement.focus();
    }

    selectAll() {
        this.containerElement.select();
    }

    enable() {
        this.containerElement.disabled = false;
    }

    disable() {
        this.containerElement.disabled = true;
    }
}

class FileInputElement extends AbstractInputElement{

    /**
     * Constructor
     *
     * @param {XmlElement} element 
     * @param {BaseElement} parent 
     */
    constructor(element, parent) {
        super(element, parent);
    }

    async focus() {
        LOG.WARN("File input elements cannot be focused directly due to browser security restrictions.");
        this.element.focus();
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
        if (ElementMapper.mapsToFile(input)){      return new FileInputElement(input, parent); }
        if (ElementMapper.mapsToText(input)){      return new TextInputElement(input, parent); }
        if (ElementMapper.mapsToVideo(input)){     return new VideoElement(input, parent); }
        if (ElementMapper.mapsToTextnode(input)){  return new TextnodeElement(input, parent); }
        if (ElementMapper.mapsToOption(input)){    return new OptionElement(input, parent); }
        if (ElementMapper.mapsToSelect(input)){    return new SelectElement(input, parent); }
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

    static mapsToFile(input){
        if (input instanceof HTMLInputElement) {
            if (input.type === "file") { return true; }
        }
        if(input instanceof xmlparser_v1.XmlElement && input.name === "input") {
            if(input.getAttribute("type").value === "file") { return true; }
        }
        return false;
    }

    static mapsToText(input){
        if (input instanceof HTMLInputElement) {
            if (input.type === "text") { return true; }
            if (input.type === "hidden") { return true; }
            if (input.type === "number") { return true; }
            if (input.type === "password") { return true; }
            if (input.type === "email") { return true; }
            if (input.type === "date") { return true; }
            if (input.type === "time") { return true; }
        }
        if(input instanceof xmlparser_v1.XmlElement && input.name === "input") {
            if(!input.getAttribute("type")) { return true; }
            if(input.getAttribute("type").value === "text") { return true; }
            if(input.getAttribute("type").value === "hidden") { return true; }
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

    static mapsToOption(input){
        return (input instanceof HTMLOptionElement) ||
            (input instanceof xmlparser_v1.XmlElement && input.name === "option");
    }
    
    static mapsToSelect(input){
        return (input instanceof HTMLSelectElement) ||
            (input instanceof xmlparser_v1.XmlElement && input.name === "select");
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

    /**
     * 
     * @param {UniqueIdRegistry} uniqueIdRegistry 
     * @param {Number} componentIndex 
     */
    constructor(uniqueIdRegistry, componentIndex) {

        /** @type {Number} */
        this.componentIndex = componentIndex;

        /** @type {UniqueIdRegistry} */
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
    elementCreated(xmlElement, parentWrapper) {
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

class CanvasRoot {

    static shouldSwallowNextFocusEscape = false;

    /** @type {ContainerElement} */
    static mouseDownElement = null;

    static focusEscapeEventRequested = false;

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static replaceComponent(id, component) {
        const bodyElement = containerbridge_v1.ContainerElementUtils.getElementById(id);
        bodyElement.parentNode.replaceChild(component.rootElement.containerElement, bodyElement);
    }

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static setComponent(id, component) {
        const bodyElement = containerbridge_v1.ContainerElementUtils.getElementById(id);
        bodyElement.innerHTML = '';
        bodyElement.appendChild(component.rootElement.containerElement, bodyElement);
    }

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static addChildComponent(id, component) {
        const bodyElement = containerbridge_v1.ContainerElementUtils.getElementById(id);
        bodyElement.appendChild(component.rootElement.containerElement);
    }

    /**
     * 
     * @param {String} id 
     * @param {Component} component 
     */
    static addChildElement(id, element) {
        const bodyElement = containerbridge_v1.ContainerElementUtils.getElementById(id);
        bodyElement.appendChild(element.containerElement);
    }

    /**
     * 
     * @param {String} id 
     */
    static removeElement(id) {
        containerbridge_v1.ContainerElementUtils.removeElement(id);
    }

    /** 
     * @param {BaseElement} element
     */
    static addHeaderElement(element) {
        containerbridge_v1.ContainerElementUtils.appendRootMetaChild(element.containerElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static addBodyElement(element) {
        containerbridge_v1.ContainerElementUtils.appendRootUiChild(element.containerElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependHeaderElement(element) {
        containerbridge_v1.ContainerElementUtils.prependElement("head", element.containerElement);
    }

    /** 
     * @param {BaseElement} element
     */
    static prependBodyElement(element) {
        containerbridge_v1.ContainerElementUtils.prependElement("body", element.containerElement);
    }

    /** 
     * Remember to swallowFocusEscape for initial triggering events
     * which are external to focusRoot
     * 
     * Also remember to keep the destroy function and call it
     * when the listener is no longer needed
     * 
     * @param {Method} listener
     * @param {BaseElement} focusRoot
     * @returns {Function} destroy function to remove the listener from the container window
     */
    static listenToFocusEscape(listener, focusRoot) {
        
        const destroyFunctions = [];

        /* Hack: Because we don't have a way of knowing in the click event which element was in focus when mousedown occured */
        if (!CanvasRoot.focusEscapeEventRequested) {
            const updateMouseDownElement = new coreutil_v1.Method(null, (/** @type {ContainerEvent} */ event) => {
                CanvasRoot.mouseDownElement = event.target;
            });
            destroyFunctions.push(
                containerbridge_v1.ContainerWindow.addEventListener("mousedown", updateMouseDownElement)
            );
            CanvasRoot.focusEscapeEventRequested = true;
        }

        const callIfNotContains = new coreutil_v1.Method(null, (/** @type {ContainerEvent} */ event) => {
            CanvasRoot.mouseDownElement = event.target;
            if (containerbridge_v1.ContainerElementUtils.contains(focusRoot.containerElement, CanvasRoot.mouseDownElement)) {
                return;
            }
            // If the element is not connected, then the element is not visible
            // and we should not trigger focus escape events
            if (!containerbridge_v1.ContainerElementUtils.isConnected(CanvasRoot.mouseDownElement)) {
                return;
            }
            if (CanvasRoot.shouldSwallowNextFocusEscape) {
                return;
            }
            listener.call(event);
        });
        destroyFunctions.push(
            containerbridge_v1.ContainerWindow.addEventListener("click", callIfNotContains)
        );

        return () => {
            destroyFunctions.forEach(destroy => destroy());
        };
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
        const xmlElement = new xmlparser_v1.XmlElement(elementName);
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
        const element = HTML.custom("a");
        element.addChild(value);
        element.setAttributeValue("href",href);
        HTML.applyStyles(element, classValue, styleValue);
        return element;
    }

    static i(value, classValue, styleValue){
        const element = HTML.custom("i");
        element.addChild(value);
        HTML.applyStyles(element, classValue, styleValue);
        return element;
    }
}

const LOG$5 = new coreutil_v1.Logger("CanvasStyles");

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
            LOG$5.error("Style does not exist: " + name);
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
            LOG$5.error("Style does not exist: " + name);
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

class ComponentFactory {

    constructor() {

    }

    /**
     * 
     * @param {string} componentName 
     * @returns {Component}
     */
    create(componentName) {
        throw "Not implemented";
    }

}

const LOG$4 = new coreutil_v1.Logger("TemplateComponentFactory");

class TemplateComponentFactory extends ComponentFactory{

    constructor() {

        super();

        /** @type {StylesRegistry} */
        this.stylesRegistry = mindi_v1.InjectionPoint.instance(StylesRegistry);

        /** @type {TemplateRegistry} */
        this.templateRegistry = mindi_v1.InjectionPoint.instance(TemplateRegistry);

        /** @type {UniqueIdRegistry} */
        this.uniqueIdRegistry = mindi_v1.InjectionPoint.instance(UniqueIdRegistry);
    }

    /**
     * 
     * @param {function} classType represents the template and the styles name if the style for that name is available
     */
    create(classType){
        if (!classType.TEMPLATE_URL || !classType.STYLES_URL) {
            throw new Error("Template component class must implement static members TEMPLATE_URL and STYLES_URL");
        }
        const template = this.templateRegistry.get(classType.name);
        if(!template) {
            LOG$4.error(this.templateRegistry);
            console.trace();
            throw new Error("No template was found with name " + classType.name);

        }
        const elementRegistrator = new ElementRegistrator(this.uniqueIdRegistry, templateComponentCounter++);
        new xmlparser_v1.DomTree(template.getTemplateSource(), elementRegistrator).load();

        this.mountStyles(classType.name);

        return new Component(elementRegistrator.componentIndex, elementRegistrator.rootElement, elementRegistrator.getElementMap());
    }

    mountStyles(name) {
        if (this.stylesRegistry.contains(name)) {
            CanvasStyles.setStyle(name, this.stylesRegistry.get(name));
        }
    }

}

let templateComponentCounter = 0;

class TrailProcessor {

    /**
     * Finds the all matching functions based on the anchor in the url
     * and calls those functions sequentially. Also ensures that the list
     * of trail stops are added to the history
     * 
     * @param {Url} url 
     * @param {any} callingObject 
     * @param {TrailNode} node 
     */
    static proceedAlongAnchor(url, callingObject, node) {
        const trailStops = TrailProcessor.triggerFunctionsAlongAnchor(url, callingObject, node);
        if (!trailStops || 0 === trailStops.length) {
            return;
        }

        const urlBuilder = UrlBuilder.builder().withAllOfUrl(History.currentUrl());
        const stepUrl = urlBuilder.withAnchor(null).build();
        History.replaceUrl(stepUrl, stepUrl.toString(), null);
        
        trailStops.forEach((value) => {
            const stepUrl = urlBuilder.withAnchor(value).build();
            History.pushUrl(stepUrl, stepUrl.toString(), value);
        });
    }

    /**
     * Finds the matching functions based on the trail in the url
     * and calls those functions sequentially.
     * 
     * @param {Url} url
     * @param {any} object 
     * @param {TrailNode} node 
     * @param {Array<String>} trailStops
     * @returns {Array<String>}
     */
    static triggerFunctionsAlongAnchor(url, currentObject, node, trailStops = new Array()) {

        const parentsPath = trailStops ? trailStops.join("") : "";

        if (node.property) {
            currentObject = currentObject[node.property];
        }

        if (coreutil_v1.StringUtils.startsWith(url.anchor, TrailProcessor.toStartsWith(node.trail))) {
            trailStops = coreutil_v1.ArrayUtils.add(trailStops, node.trail);
            if (node.waypoint) {
                node.waypoint.call(currentObject);
            }
        }


        if (coreutil_v1.StringUtils.nonNullEquals(url.anchor, parentsPath + node.trail)) {
            trailStops = coreutil_v1.ArrayUtils.add(trailStops, node.trail);
            if (node.destination) {
                node.destination.call(currentObject);
            }
        }

        if (node.next) {
            node.next.forEach((childNode) => {
                trailStops = TrailProcessor.triggerFunctionsAlongAnchor(url, currentObject, childNode, trailStops);
            });
        }

        return trailStops;
    }

    /**
     * Finds the trail destination function matching the provided function, triggers the function and records
     * the trail as a new url with the anchor.
     * 
     * Should be called from the context of the direct parent controller. Only the destination function will
     * be called, and the entire trail will be recorded in the history.
     * 
     * @param {function} theFunction 
     * @param {any} callingObject 
     * @param {TrailNode} node The root node from the trail map
     */
    static proceedToDestinationFunction(theFunction, callingObject, node) {

        const currentUrl = History.currentUrl();

        const matchingNodeTrail = TrailProcessor.getNodeTrailByFunction(node, theFunction);

        if (0 === matchingNodeTrail.length) { 
            return Promise.resolve();
        }

        const executedFunctionResponse = theFunction.call(callingObject);
        const newTrail = TrailProcessor.concatinateSequenceAsAnchor(matchingNodeTrail);

        if (!coreutil_v1.StringUtils.nonNullEquals(currentUrl.anchor, newTrail)) {
            const urlBuilder = UrlBuilder.builder().withAllOfUrl(currentUrl);
            const stepUrl = urlBuilder.withAnchor(newTrail).build();
            History.pushUrl(stepUrl, stepUrl.toString(), null);
        }

        return executedFunctionResponse;
    }

    /**
     * Finds the trail destination function matching the provided function, triggers the function and records
     * the trail by replacing the current url with the new url including the anchor.
     * 
     * Should be called from the context of the direct parent controller. Only the destination function will
     * be called, and the entire trail will be recorded in the history.
     * 
     * @param {function} theFunction 
     * @param {any} callingObject 
     * @param {TrailNode} node 
     */
    static jumpToDestinationFunction(theFunction, callingObject, node) {

        const currentUrl = History.currentUrl();

        const matchingNodeTrail = TrailProcessor.getNodeTrailByFunction(node, theFunction);

        if (0 === matchingNodeTrail.length) { 
            return Promise.resolve();
        }

        const executedFunctionResponse = theFunction.call(callingObject);
        const newTrail = TrailProcessor.concatinateSequenceAsAnchor(matchingNodeTrail);

        if (!coreutil_v1.StringUtils.nonNullEquals(currentUrl.anchor, newTrail)) {
            const urlBuilder = UrlBuilder.builder().withAllOfUrl(currentUrl);
            const stepUrl = urlBuilder.withAnchor(newTrail).build();
            History.replaceUrl(stepUrl, stepUrl.toString(), null);
        }

        return executedFunctionResponse;
    }


    /**
     * 
     * @param {Array<TrailNode>} nodeSequence
     * @returns {string} anchor
     */
    static concatinateSequenceAsAnchor(nodeSequence) {

        const trailArray = nodeSequence.map((node) => {
            return node.trail;
        });

        return trailArray.join("");
    }

    /**
     * 
     * @param {TrailNode} node 
     * @param {string} theFunction 
     * @param {Array<TrailNode>} nodeTrail
     * @returns {Array<TrailNode>}
     */
    static getNodeTrailByFunction(node, theFunction, nodeTrail = new Array(), root = true) {

        // Check if node is a match, then add it
        if (theFunction === node.destination) {
            nodeTrail = coreutil_v1.ArrayUtils.add(nodeTrail, node);
        }

        // Checking child nodes if not found yet
        if (theFunction !== node.destination && nodeTrail.length === 0 && node.next) {
            node.next.forEach((childNode) => {
                if (nodeTrail.length === 0) {
                    nodeTrail = TrailProcessor.getNodeTrailByFunction(childNode, theFunction, nodeTrail, false);
                }
            });
        }

        // Already found node, adding this ancestor of the node
        if (nodeTrail.length > 0) {
            nodeTrail = coreutil_v1.ArrayUtils.add(nodeTrail, node);
        }

        if (root && nodeTrail.length > 0) {
            // If root is true, then the list is complete so we reverse it
            return nodeTrail.reverse();
        }
        return nodeTrail;
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

class ComponentBuilder {

    /**
     * 
     * @param {UniqueIdRegistry} idRegistry
     * @returns {ComponentBuilder}
     */
    static create(idRegistry) {
        return new ComponentBuilder(idRegistry);
    }

    /**
     * @param {UniqueIdRegistry} idRegistry
     */
    constructor(idRegistry) {

        /** @type {UniqueIdRegistry} */
        this.idRegistry = idRegistry;

        /** @type {Map<String, BaseElement>} */
        this.elementMap = new Map();

        /** @type {BaseElement} */
        this.rootElement = null;

        /** @type {BaseElement} */
        this.lastAddedElement = null;

        /** @type {BaseElement} */
        this.contextElement = null;

        /** @type {BaseElement[]} */
        this.trail = [];

    }

    /**
     * 
     * @param {UniqueIdRegistry} idRegistry
     * @param {Map<String, BaseElement>} elementMap
     * @param {String} tag 
     * @param {String[]} attributeArray 
     * @returns {BaseElement}
     */
    static tag(idRegistry, elementMap, tag, ...attributeArray) {

        /** @type {BaseElement} */
        const element = HTML.custom(tag);

        attributeArray.forEach(attr => {
            let key = attr;
            let val = "";
            if (attr.indexOf("=") !== -1) {
                let indexOfColon = attr.indexOf("=");
                key = attr.substring(0, indexOfColon);
                val = attr.substring(indexOfColon + 1);
                if ("id" === key) {
                    elementMap.set(val, element);
                    val = idRegistry.idAttributeWithSuffix(attr.substring(indexOfColon + 1));
                }
            }
            element.setAttributeValue(key, val);

        });
        return element;
    }

    /**
     * 
     * @param {String} tag 
     * @param  {String[]} attributeArray 
     * @returns 
     */
    root(tag, ...attributeArray) {
        if (this.rootElement) {
            throw new Error("ComponentBuilder: Root element is already defined.");
        }
        this.rootElement = ComponentBuilder.tag(this.idRegistry, this.elementMap, tag, ...attributeArray);
        this.lastAddedElement = this.rootElement;
        this.contextElement = this.rootElement;
        return this;
    }

    /**
     * 
     * @param {String} tagName 
     * @param  {String[]} attributeArray
     * @returns {ComponentBuilder}
     */
    node(tagName, ...attributeArray) {
        if (!this.rootElement) {
            throw new Error("ComponentBuilder: Root element is not defined. Call root() before adding child elements.");
        }
        if (this.trail.length === 0) {
            throw new Error("ComponentBuilder: No open element context to add child elements, call open() before adding.");
        }
        const element = ComponentBuilder.tag(this.idRegistry, this.elementMap, tagName, ...attributeArray);
        this.contextElement.addChild(element);
        this.lastAddedElement = element;
        return this;
    }

    /**
     * 
     * @param {String} text 
     * @returns {ComponentBuilder}
     */
    text(text) {
        if (!this.rootElement) {
            throw new Error("ComponentBuilder: Root element is not defined. Call root() before adding child elements.");
        }
        if (this.trail.length === 0) {
            throw new Error("ComponentBuilder: No open element context to add child elements, call open() before adding.");
        }
        this.contextElement.addChild(text);
        this.lastAddedElement = null;
        return this;
    }

    open() {
        if (!this.rootElement) {
            throw new Error("ComponentBuilder: Root element is not defined. Call root() before adding child elements.");
        }
        if (this.lastAddedElement === null) {
            throw new Error("ComponentBuilder: Unable to open last element.");
        }
        this.trail.push(this.contextElement);
        this.contextElement = this.lastAddedElement;
        return this;
    }

    close() {
        if (this.trail.length === 0) {
            throw new Error("ComponentBuilder: No open element context to close.");
        }
        this.contextElement = this.trail.pop();
        this.lastAddedElement = this.contextElement;
        return this;
    }

    build() {
        return new Component(componentBuilderCounter++, this.rootElement, this.elementMap);
    }
}

let componentBuilderCounter = 0;

class InlineComponentFactory extends ComponentFactory {

    constructor() {
        super();

        /** @type {StylesRegistry} */
        this.stylesRegistry = mindi_v1.InjectionPoint.instance(StylesRegistry);

        /** @type {UniqueIdRegistry} */
        this.uniqueIdRegistry = mindi_v1.InjectionPoint.instance(UniqueIdRegistry);
    }

    /**
     * 
     * @param {function} classType represents the inline component class
     */
    create(classType){
        if (!classType.buildComponent || !classType.buildStylesheet) {
            throw new Error("Inline component class must implement static methods buildComponent() and buildStylesheet()");
        }

        /** @type {Component} */
        const component = classType.buildComponent(ComponentBuilder.create(this.uniqueIdRegistry));

        /** @type {String} */
        const stylesheet = classType.buildStylesheet(StylesheetBuilder.create());

        CanvasStyles.setStyle(classType.name, stylesheet);
        
        return component;
    }

}

const LOG$3 = new coreutil_v1.Logger("Application");

class Application extends ModuleRunner {

    /**
     * 
     * @param {Array<ModuleLoader>} moduleLoaderArray 
     * @param {Config} config 
     * @param {Array} workerArray 
     */
    constructor(moduleLoaderArray, config = new mindi_v1.MindiConfig(), workerArray = new Array()) {

        super();

        /** @type {Array<ModuleLoader>} */
        this.moduleLoaderArray = moduleLoaderArray;

        /** @type {MindiConfig} */
        this.config = config;

        /** @type {Array} */
        this.workerArray = workerArray;

        /** @type {Array} */
        this.runningWorkers = new Array();

        /** @type {Module} */
        this.activeModule = null;

        this.defaultConfig = [
            mindi_v1.SingletonConfig.unnamed(TemplateRegistry),
            mindi_v1.SingletonConfig.unnamed(StylesRegistry),
            mindi_v1.SingletonConfig.unnamed(UniqueIdRegistry),
            mindi_v1.SingletonConfig.unnamed(TemplateComponentFactory),
            mindi_v1.SingletonConfig.unnamed(InlineComponentFactory),
            mindi_v1.PrototypeConfig.unnamed(StateManager)
        ];

        this.defaultConfigProcessors = [ ComponentConfigProcessor ];

        this.defaultInstanceProcessors = [ mindi_v1.InstancePostConfigTrigger ];

    }

    async run() {
        LOG$3.info("Running Application");
        this.config
            .addAllTypeConfig(this.defaultConfig)
            .addAllConfigProcessor(this.defaultConfigProcessors)
            .addAllInstanceProcessor(this.defaultInstanceProcessors);
        ActiveModuleRunner.instance().set(this);
        containerbridge_v1.ContainerUrl.addUserNavigateListener(new coreutil_v1.Method(this, this.update));
        const module = await this.runModule(History.currentUrl());
        this.startWorkers();
        return module;
    }

    /**
     * 
     * @param {ContainerEvent} event
     */
    update(event) {
        const url = History.currentUrl();

        if (this.activeModule && coreutil_v1.StringUtils.startsWith(url.anchor, this.activeModule.trailMap.trail)) {
            TrailProcessor.triggerFunctionsAlongAnchor(url, this.activeModule, this.activeModule.trailMap);
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
            const moduleLoader = this.getMatchingModuleLoader(url);
            this.activeModule = await moduleLoader.load();
            this.activeModule.url = url;
            this.activeModule.trailMap = moduleLoader.trailMap;
            this.activeModule.load();
            return this.activeModule;
        } catch(error) {
            LOG$3.error(error);
            return null;
        }
    }

    startWorkers() {
        if (this.runningWorkers.length > 0) {
            return;
        }
        const config = this.config;
        const runningWorkers = this.runningWorkers;
        this.workerArray.forEach((value) => {
            const instance = new value();
            mindi_v1.MindiInjector.inject(instance, config);
            coreutil_v1.ArrayUtils.add(runningWorkers, instance);
        });
    }

    /**
     * @param {Url} url
     * @returns {DiModuleLoader}
     */
    getMatchingModuleLoader(url) {
        let foundModuleLoader = null;
        this.moduleLoaderArray.forEach((value) => {
            if (!foundModuleLoader && value.matches(url)) {
                foundModuleLoader = value;
            }
        });
        return foundModuleLoader;
    }

    /**
     * Enable global access to dependency injection config
     */
    windowDiConfig() {
        window.diConfig = () => {
            LOG$3.info(this.config.configEntries);
        };
    }

    /**
     * Enable global access to template registry
     */
    windowTemplateRegistry() {
        window.templateRegistry = () => {
            const typeConfig = mindi_v1.ConfigAccessor.typeConfigByName(TemplateRegistry.name, this.config);
            LOG$3.info(typeConfig.instanceHolder().instance);
        };
    }

    /**
     * Enable global access to style registry
     */
    windowStyleRegistry() {
        window.styleRegistry = () => {
            const typeConfig = mindi_v1.ConfigAccessor.typeConfigByName(StylesRegistry.name, this.config);
            LOG$3.info(typeConfig.instanceHolder().instance);
        };
    }

}

class IdSpace {

    static ID_SPACE_STRING_WIDTH = 17;

    static HW_STRING_PART_WIDTH = 9;
    static EPOCH_SECONDS_STRING_PART_WIDTH = 6;
    static COUNT_STRING_PART_WIDTH = 2;

    constructor(mac = null, epochSeconds = null, counter = null) {
        this.mac = mac;
        this.epochSeconds = epochSeconds;
        this.counter = counter;
    }

    /**
     * 
     * @param {String} idSpaceString 
     * @returns {IdSpace}
     */
    static parse(idSpaceString) {
        if (idSpaceString == null || idSpaceString.length < IdSpace.ID_SPACE_STRING_WIDTH || !coreutil_v1.RadixUtils.isValidRadixString(idSpaceString)) {
            throw Error("ID Space must be at least " + IdSpace.ID_SPACE_STRING_WIDTH + " characters long and contain valid characters.");
        }
        const macString = idSpaceString.substring(0, IdSpace.HW_STRING_PART_WIDTH);
        const epochSecondsString = idSpaceString.substring(
            IdSpace.HW_STRING_PART_WIDTH, 
            IdSpace.HW_STRING_PART_WIDTH + IdSpace.EPOCH_SECONDS_STRING_PART_WIDTH);

        const counterString = idSpaceString.substring(
            IdSpace.HW_STRING_PART_WIDTH + IdSpace.EPOCH_SECONDS_STRING_PART_WIDTH,
            IdSpace.HW_STRING_PART_WIDTH + IdSpace.EPOCH_SECONDS_STRING_PART_WIDTH + IdSpace.COUNT_STRING_PART_WIDTH);

        const mac = coreutil_v1.RadixUtils.fromRadixString(macString);
        const epochSeconds = coreutil_v1.RadixUtils.fromRadixString(epochSecondsString);
        const counter = coreutil_v1.RadixUtils.fromRadixString(counterString);

        return new IdSpace(mac, epochSeconds, counter);
    }

    /**
     * 
     * @returns {String}
     */
    toString() {
        const macString = coreutil_v1.StringUtils.leftPad(coreutil_v1.RadixUtils.toRadixString(this.mac), IdSpace.HW_STRING_PART_WIDTH, '0');
        const epochSecondsString = coreutil_v1.StringUtils.leftPad(coreutil_v1.RadixUtils.toRadixString(this.epochSeconds), IdSpace.EPOCH_SECONDS_STRING_PART_WIDTH, '0');
        const counterString = coreutil_v1.StringUtils.leftPad(coreutil_v1.RadixUtils.toRadixString(this.counter), IdSpace.COUNT_STRING_PART_WIDTH, '0');
        return macString + epochSecondsString + counterString;
    }

    report() {
        const report = new Map();
        report.set("IdSpace [MAC]", coreutil_v1.MacUtils.toMacAddress(this.mac));
        report.set("IdSpace [Epoch]", this.epochSeconds * 1000);
        report.set("IdSpace [Date]", new Date(this.epochSeconds * 1000).toISOString());
        report.set("IdSpace [Counter]", this.counter);
        return report;
    }
}

class UserId {

    static USER_ID_STRING_WIDTH = 9;

    static EPOCH_CENTIS_STRING_PART_WIDTH = 7;
    static COUNT_STRING_PART_WIDTH = 2;

    constructor(epochCentis = null, counter = null) {
        this.epochCentis = epochCentis;
        this.counter = counter;
    }

    /**
     * 
     * @param {String} userIdString 
     * @returns 
     */
    static parse(userIdString) {
        if (userIdString == null || userIdString.length !== UserId.USER_ID_STRING_WIDTH || !coreutil_v1.RadixUtils.isValidRadixString(userIdString)) {
            throw new Error("User ID must be at least " + UserId.USER_ID_STRING_WIDTH + " characters long and contain valid characters.");
        }
        const epochCentis = coreutil_v1.RadixUtils.fromRadixString(userIdString.substring(0, UserId.EPOCH_CENTIS_STRING_PART_WIDTH));
        const counter = coreutil_v1.RadixUtils.fromRadixString(userIdString.substring(UserId.EPOCH_CENTIS_STRING_PART_WIDTH, UserId.USER_ID_STRING_WIDTH));
        return new UserId(epochCentis, counter);
    }

    /**
     * 
     * @returns {String}
     */
    toString() {
        const epochMillisString = coreutil_v1.StringUtils.leftPad(coreutil_v1.RadixUtils.toRadixString(this.epochCentis), UserId.EPOCH_CENTIS_STRING_PART_WIDTH, '0');
        const counterString = coreutil_v1.StringUtils.leftPad(coreutil_v1.RadixUtils.toRadixString(this.counter), UserId.COUNT_STRING_PART_WIDTH, '0');
        return epochMillisString + counterString;
    }

    report() {
        const report = new Map();
        report.set("UserId [Epoch]", this.epochCentis * 10);
        report.set("UserId [Date]", new Date(this.epochCentis * 10).toISOString());
        report.set("UserId [Counter]", this.counter);
        return report;
    }
}

const LOG$2 = new coreutil_v1.Logger("Id");

class Id {

    constructor(idSpace = null, userId = null) {
        this.idSpace = idSpace;
        this.userId = userId;
    }

    /**
     * 
     * @param {String} idString 
     * @returns {Id}
     */
    static parse(idString) {
        const idSpaceString = idString.substring(0, IdSpace.ID_SPACE_STRING_WIDTH);
        const userIdString = idString.substring(IdSpace.ID_SPACE_STRING_WIDTH);

        const idSpace = IdSpace.parse(idSpaceString);
        const userId = UserId.parse(userIdString);

        return new Id(idSpace, userId);
    }

    report() {
        const report = new Map();
        const idSpaceReport = this.idSpace.report();
        for (const [key, value] of idSpaceReport.entries()) {
            report.set(key, value);
        }
        const userIdReport = this.userId.report();
        for (const [key, value] of userIdReport.entries()) {
            report.set(key, value);
        }
        return report;
    }

    reportString() {
        const report = this.report();
        let reportString = "";
        let first = true;
        for (const [key, value] of report.entries()) {
            if (first) {
                reportString += key + ": " + value;
            } else {
                reportString += "\n" + key + ": " + value;
            }
            first = false;
        }
        return reportString;
    }

    print (){
        LOG$2.info(this.reportString());
    }

    toString() {
        return idSpace.toString() + userId.toString();
    }

    userId() {
        return userId.toString();
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

class Event {

    /**
     * 
     * @param {Event} event 
     */
    constructor(event) {

        /** @type {Event} */
        this.event = event;
        if (this.event.type.toLowerCase() == "dragstart"){
            this.event.dataTransfer.setData('text/plain', null);
        }
    }

    stopPropagation() {
        this.event.stopPropagation();
    }

    preventDefault() {
        this.event.preventDefault();
    }

    get files() {
        if (this.event.target && this.event.target.files) {
            return this.event.target.files;
        }
        if (this.event.dataTransfer) {
            /** @type {DataTransfer} */
            const dataTransfer = this.event.dataTransfer;
            if (dataTransfer.files) {
                return dataTransfer.files;
            }
        }
        return [];
    }

    /**
     * The distance between the event and the edge x coordinate of the containing object
     */
    get offsetX() {
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
    get clientX() {
        return this.event.clientX;
    }

    /**
     * The mouse y coordinate of the event relative to the client window view
     */
    get clientY() {
        return this.event.clientY;
    }

    /**
     * 
     * @returns {SimpleElement}
     */
    get target() {
        if (this.event && this.event.target) {
            return ConfiguredFunction.execute("mapElement", this.event.target);
        }
    }

    /**
     * 
     * @returns {SimpleElement}
     */
    get relatedTarget() {
        if (this.event && this.event.relatedTarget) {
            return ConfiguredFunction.execute("mapElement", this.event.relatedTarget);
        }
        return null;
    }

    /**
     * 
     * @returns {string}
     */
     getRelatedTargetAttribute(attributeName) {
        if (this.event.relatedTarget) {
            return ConfiguredFunction.execute("mapElement", this.event.relatedTarget).getAttributeValue(attributeName);
        }
        return null;
    }

    get targetValue() {
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

class StyleAccessor {
    
    /**
     * @type {BaseElement}
     * @return {StyleAccessor}
     */
    static from(baseElement) {
        return new StyleAccessor(baseElement);
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
        const currentStyleMap = this.stylesAsMap(this.baseElement.getAttributeValue("style"));
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
        const currentStyleMap = this.stylesAsMap(this.baseElement.getAttributeValue("style"));
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
        const currentStyleMap = this.stylesAsMap(this.baseElement.getAttributeValue("style"));
        return coreutil_v1.StringUtils.nonNullEquals(currentStyleMap.get(styleName), styleValue);
    }
    
    /**
     * 
     * @param {String} styleName 
     */
    exists(styleName) {
        const currentStyleMap = this.stylesAsMap(this.baseElement.getAttributeValue("style"));
        return currentStyleMap.contains(styleName);
    }

    stylesAsMap(styles) {
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

class StyleSelectorAccessor {
    
    /**
     * @type {BaseElement}
     * @return {StyleSelectorAccessor}
     */
    static from(baseElement) {
        return new StyleSelectorAccessor(baseElement);
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
exports.ComponentBuilder = ComponentBuilder;
exports.ComponentConfigProcessor = ComponentConfigProcessor;
exports.ComponentFactory = ComponentFactory;
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
exports.FileInputElement = FileInputElement;
exports.FormElement = FormElement;
exports.HTML = HTML;
exports.History = History;
exports.HttpCallBuilder = HttpCallBuilder;
exports.Id = Id;
exports.IdSpace = IdSpace;
exports.InlineComponentFactory = InlineComponentFactory;
exports.InputElementDataBinding = InputElementDataBinding;
exports.LoaderInterceptor = LoaderInterceptor;
exports.MappedContainerElement = MappedContainerElement;
exports.Module = Module;
exports.ModuleLoader = ModuleLoader;
exports.ModuleRunner = ModuleRunner;
exports.Navigation = Navigation;
exports.NumberValidator = NumberValidator;
exports.OptionElement = OptionElement;
exports.OrValidatorSet = OrValidatorSet;
exports.PasswordValidator = PasswordValidator;
exports.PhoneValidator = PhoneValidator;
exports.ProxyObjectFactory = ProxyObjectFactory;
exports.RadioInputElement = RadioInputElement;
exports.RegexValidator = RegexValidator;
exports.RequiredValidator = RequiredValidator;
exports.SelectElement = SelectElement;
exports.SimpleElement = SimpleElement;
exports.StateManager = StateManager;
exports.StyleAccessor = StyleAccessor;
exports.StyleMedia = StyleMedia;
exports.StyleSelector = StyleSelector;
exports.StyleSelectorAccessor = StyleSelectorAccessor;
exports.StylesLoader = StylesLoader;
exports.StylesRegistry = StylesRegistry;
exports.Stylesheet = Stylesheet;
exports.StylesheetBuilder = StylesheetBuilder;
exports.Template = Template;
exports.TemplateComponentFactory = TemplateComponentFactory;
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
exports.UserId = UserId;
exports.VideoElement = VideoElement;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2Fic3RyYWN0VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzUHJvcGVydHlWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNTdHJpbmdWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9yZWdleFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL251bWJlclZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL29yVmFsaWRhdG9yU2V0LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVTZWxlY3Rvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3R5bGVzL3N0eWxlTWVkaWEuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNoZWV0LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVzaGVldEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jbGllbnQvY2xpZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL3VybC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC91cmxVdGlscy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdGVtcGxhdGUvdGVtcGxhdGVzTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L21hcHBlZENvbnRhaW5lckVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3V0aWwvZWxlbWVudFV0aWxzLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC91dGlsL2h0dHBDYWxsQnVpbGRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2FuZFZhbGlkYXRvclNldC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VtYWlsVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzRnVuY3Rpb25SZXN1bHRWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3V0aWwvdXJsQnVpbGRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bhc3N3b3JkVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcGhvbmVsVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvcmVxdWlyZWRWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L21vZHVsZVJ1bm5lci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbmF2aWdhdGlvbi9oaXN0b3J5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9uYXZpZ2F0aW9uL25hdmlnYXRpb24uanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L25hdmlnYXRpb24vdHJhaWxOb2RlLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9hY3RpdmVNb2R1bGVSdW5uZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3R5bGVzL3N0eWxlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudENvbmZpZ1Byb2Nlc3Nvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvbG9hZGVyL2xvYWRlckludGVyY2VwdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9sb2FkZXIvbW9kdWxlTG9hZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9tb2R1bGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2xvYWRlci9kaU1vZHVsZUxvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3RhdGUvc3RhdGVNYW5hZ2VyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb21wb25lbnQvdW5pcXVlSWRSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9hdHRyaWJ1dGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvYmFzZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvYWJzdHJhY3RJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvcmFkaW9JbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvY2hlY2tib3hJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdGV4dElucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0YXJlYUlucHV0RWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC90ZXh0bm9kZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvc2ltcGxlRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9mb3JtRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC92aWRlb0VsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvb3B0aW9uRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9zZWxlY3RFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2ZpbGVJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvZWxlbWVudE1hcHBlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2VsZW1lbnRSZWdpc3RyYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2FudmFzL2NhbnZhc1Jvb3QuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2h0bWwvaHRtbC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2FudmFzL2NhbnZhc1N0eWxlcy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudEZhY3RvcnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC90ZW1wbGF0ZUNvbXBvbmVudEZhY3RvcnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L25hdmlnYXRpb24vdHJhaWxQcm9jZXNzb3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbXBvbmVudC9jb21wb25lbnRCdWlsZGVyLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb21wb25lbnQvaW5saW5lQ29tcG9uZW50RmFjdG9yeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvYXBwbGljYXRpb24uanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3V0aWwvaWQvaWRTcGFjZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9pZC91c2VySWQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3V0aWwvaWQvaWQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NvbmZpZy9jb25maWd1cmVkRnVuY3Rpb24uanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2RhdGFCaW5kL2lucHV0RWxlbWVudERhdGFCaW5kaW5nLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9kYXRhQmluZC9wcm94eU9iamVjdEZhY3RvcnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2V2ZW50L2V2ZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudEZpbHRlcmVkTWV0aG9kLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudE1hbmFnZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZUFjY2Vzc29yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9zdHlsZXMvc3R5bGVDbGFzc0FjY2Vzc29yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQWJzdHJhY3RWYWxpZGF0b3JcIik7XG5cbmV4cG9ydCBjbGFzcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzQ3VycmVudGx5VmFsaWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBlbmFibGVkID0gdHJ1ZSkge1xuICAgICAgICB0aGlzLnZhbGlkTGlzdGVuZXJMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IGN1cnJlbnRseVZhbGlkO1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgIH1cblxuICAgIGVuYWJsZSgpIHtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICB0aGlzLnZhbGlkKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRpc2FibGUoKSB7XG4gICAgICAgIGxldCB3YXNWYWxpZCA9IHRoaXMuY3VycmVudGx5VmFsaWQ7XG4gICAgICAgIC8vIEZha2UgdmFsaWRcbiAgICAgICAgdGhpcy52YWxpZCgpO1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHdhc1ZhbGlkO1xuICAgIH1cblxuICAgIGlzVmFsaWQoKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50bHlWYWxpZDtcbiAgICB9XG5cblx0dmFsaWQoKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHRydWU7XG4gICAgICAgIGlmKCF0aGlzLnZhbGlkTGlzdGVuZXJMaXN0KSB7XG4gICAgICAgICAgICBMT0cud2FybihcIk5vIHZhbGlkYXRpb24gbGlzdGVuZXJzXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudmFsaWRMaXN0ZW5lckxpc3QuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuXHR9XG5cblx0aW52YWxpZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gZmFsc2U7XG4gICAgICAgIGlmKCF0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QpIHtcbiAgICAgICAgICAgIExPRy53YXJuKFwiTm8gaW52YWxpZGF0aW9uIGxpc3RlbmVyc1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuXHR9XG5cblx0dmFsaWRTaWxlbnQoKSB7XG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB0cnVlO1xuXHR9XG5cblx0aW52YWxpZFNpbGVudCgpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IGZhbHNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge01ldGhvZH0gdmFsaWRMaXN0ZW5lciBcblx0ICovXG5cdHdpdGhWYWxpZExpc3RlbmVyKHZhbGlkTGlzdGVuZXIpIHtcblx0XHR0aGlzLnZhbGlkTGlzdGVuZXJMaXN0LmFkZCh2YWxpZExpc3RlbmVyKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIHtNZXRob2R9IGludmFsaWRMaXN0ZW5lciBcblx0ICovXG5cdHdpdGhJbnZhbGlkTGlzdGVuZXIoaW52YWxpZExpc3RlbmVyKSB7XG5cdFx0dGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0LmFkZChpbnZhbGlkTGlzdGVuZXIpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cbn1cbiIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcbmltcG9ydCB7IE1ldGhvZCwgUHJvcGVydHlBY2Nlc3NvciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgRXF1YWxzUHJvcGVydHlWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XG5cblx0LyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxuXHQgKiBAcGFyYW0ge01ldGhvZH0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxuXHQgKi9cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBtb2RlbCA9IG51bGwsIGF0dHJpYnV0ZU5hbWUgPSBudWxsKSB7XG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XG5cblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XG5cblx0XHQvKiogQHR5cGUge29iamVjdH0gKi9cbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICBcbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMuYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZU5hbWU7XG5cdH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIHRoaXMuYXR0cmlidXRlTmFtZSkpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgdGhpcy5hdHRyaWJ1dGVOYW1lKSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fVxuXHR9XG5cbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5pbXBvcnQgeyBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIEVxdWFsc1N0cmluZ1ZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gbWFuZGF0b3J5IFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGlzY3VycmVudGx5VmFsaWQgXG5cdCAqIEBwYXJhbSB7TWV0aG9kfSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXG5cdCAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIGNvbnRyb2xWYWx1ZSA9IG51bGwpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5jb250cm9sVmFsdWUgPSBjb250cm9sVmFsdWU7XG5cdH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xuXHQgICAgXHR0aGlzLnZhbGlkKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH1cblx0fVxuXG5cdHZhbGlkYXRlU2lsZW50KHZhbHVlKXtcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IGNvbnRyb2xWYWx1ZSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fVxuXHR9XG5cbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBSZWdleFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIHJlZ2V4ID0gXCIoLiopXCIpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcbiAgICAgICAgdGhpcy5yZWdleCA9IHJlZ2V4O1xuICAgIH1cblxuXHR2YWxpZGF0ZSh2YWx1ZSl7XG5cdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS5tYXRjaCh0aGlzLnJlZ2V4KSl7XG5cdCAgICBcdHRoaXMudmFsaWQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIXZhbHVlICYmICF0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0XHR0aGlzLnZhbGlkKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS5tYXRjaCh0aGlzLnJlZ2V4KSl7XG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIXZhbHVlICYmICF0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0XHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxufVxuIiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xuXG5cbmV4cG9ydCBjbGFzcyBOdW1iZXJWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XG5cbiAgICBzdGF0aWMgUEhPTkVfRk9STUFUID0gL15cXGQqJC87XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgTnVtYmVyVmFsaWRhdG9yLlBIT05FX0ZPUk1BVCk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBMaXN0LCBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSAnLi9hYnN0cmFjdFZhbGlkYXRvci5qcydcblxuZXhwb3J0IGNsYXNzIE9yVmFsaWRhdG9yU2V0IGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKGlzVmFsaWRGcm9tU3RhcnQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0ID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0VmFsaWRhdG9yfSB2YWxpZGF0b3JcbiAgICAgKi9cbiAgICB3aXRoVmFsaWRhdG9yKHZhbGlkYXRvcikge1xuICAgICAgICB2YWxpZGF0b3Iud2l0aFZhbGlkTGlzdGVuZXIobmV3IE1ldGhvZCh0aGlzLCB0aGlzLm9uZVZhbGlkKSk7XG4gICAgICAgIHZhbGlkYXRvci53aXRoSW52YWxpZExpc3RlbmVyKG5ldyBNZXRob2QodGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxuICAgICAqL1xuICAgIG9uZVZhbGlkKCkge1xuICAgICAgICBzdXBlci52YWxpZCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxuICAgICAqL1xuICAgIG9uZUludmFsaWQoKSB7XG4gICAgICAgIGxldCBmb3VuZFZhbGlkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmKHZhbHVlLmlzVmFsaWQoKSkge1xuICAgICAgICAgICAgICAgIGZvdW5kVmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgaWYoZm91bmRWYWxpZCkge1xuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImV4cG9ydCBjbGFzcyBTdHlsZVNlbGVjdG9yIHtcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY2xhc3NOYW1lIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNsYXNzTmFtZSkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xuICAgICAgICB0aGlzLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcblxuICAgICAgICAvKiogQHR5cGUge01hcDxTdHJpbmcsIFN0cmluZz59ICovXG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgd2l0aEF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcy5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtTdHJpbmd9XG4gICAgICovXG4gICAgdG9TdHJpbmcoKSB7XG4gICAgICAgIGxldCBhdHRyU3RyaW5nID0gXCJcIjtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgIGF0dHJTdHJpbmcgKz0gYFxcdCR7a2V5fTogJHt2YWx1ZX07XFxuYDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLmNsYXNzTmFtZX0ge1xcbiR7YXR0clN0cmluZ319YDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBTdHlsZVNlbGVjdG9yIH0gZnJvbSBcIi4vc3R5bGVTZWxlY3RvclwiO1xuXG5leHBvcnQgY2xhc3MgU3R5bGVNZWRpYSB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbWVkaWEgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobWVkaWEpIHtcblxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5tZWRpYSA9IG1lZGlhO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7QXJyYXk8U3R5bGVTZWxlY3Rvcj59ICovXG4gICAgICAgIHRoaXMuc3R5bGVTZWxlY3RvckFycmF5ID0gW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHlsZVNlbGVjdG9yfSBzdHlsZVNlbGVjdG9yXG4gICAgICogQHJldHVybnMge1N0eWxlTWVkaWF9XG4gICAgICovXG4gICAgd2l0aFNlbGVjdG9yKHN0eWxlU2VsZWN0b3IpIHtcbiAgICAgICAgdGhpcy5zdHlsZVNlbGVjdG9yQXJyYXkuc2V0KHN0eWxlU2VsZWN0b3IpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7U3RyaW5nfVxuICAgICAqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICBsZXQgbWVkaWFTdHJpbmcgPSBcIlwiO1xuICAgICAgICB0aGlzLnN0eWxlU2VsZWN0b3JBcnJheS5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgbWVkaWFTdHJpbmcgKz0gYCR7dmFsdWUudG9TdHJpbmcoKX1cXG5gO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubWVkaWF9IHtcXG4ke21lZGlhU3RyaW5nfVxcbn1cXG5gO1xuICAgIH1cblxufSIsImV4cG9ydCBjbGFzcyBTdHlsZXNoZWV0IHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdHlsZXNTb3VyY2UgXG4gICAgICovXG4gICAgY29uc3RydWN0b3Ioc3R5bGVzU291cmNlKXtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5zdHlsZXNTb3VyY2UgPSBzdHlsZXNTb3VyY2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRTdHlsZXNTb3VyY2UoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzU291cmNlO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgU3R5bGVNZWRpYSB9IGZyb20gXCIuL3N0eWxlTWVkaWFcIjtcbmltcG9ydCB7IFN0eWxlU2VsZWN0b3IgfSBmcm9tIFwiLi9zdHlsZVNlbGVjdG9yXCI7XG5pbXBvcnQgeyBTdHlsZXNoZWV0IH0gZnJvbSBcIi4vc3R5bGVzaGVldFwiO1xuXG5leHBvcnQgY2xhc3MgU3R5bGVzaGVldEJ1aWxkZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1N0eWxlc2hlZXRCdWlsZGVyfVxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgU3R5bGVzaGVldEJ1aWxkZXIoKTtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvKiogQHR5cGUge1N0eWxlU2VsZWN0b3JbXX0gKi9cbiAgICAgICAgdGhpcy5zdHlsZVNlbGVjdG9yQXJyYXkgPSBbXTtcblxuICAgICAgICAvKiogQHR5cGUge1N0eWxlTWVkaWFbXX0gKi9cbiAgICAgICAgdGhpcy5tZWRpYUFycmF5ID0gW107XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHlsZVNlbGVjdG9yfFN0eWxlTWVkaWF9ICovXG4gICAgICAgIHRoaXMubGFzdEFkZGVkID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge1N0eWxlU2VsZWN0b3J8U3R5bGVNZWRpYX0gKi9cbiAgICAgICAgdGhpcy5jb250ZXh0ID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge1N0eWxlU2VsZWN0b3J8U3R5bGVNZWRpYX0gKi9cbiAgICAgICAgdGhpcy5wYXJlbnRDb250ZXh0ID0gbnVsbDtcblxuICAgIH1cblxuICAgIG9wZW4oKSB7XG4gICAgICAgIGlmICghdGhpcy5sYXN0QWRkZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNvbnRleHQgdG8gb3BlblwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5sYXN0QWRkZWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbnRleHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmVudENvbnRleHQgPSB0aGlzLmNvbnRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmxhc3RBZGRlZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gY29udGV4dCB0byBjbG9zZVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLnBhcmVudENvbnRleHQ7XG4gICAgICAgIHRoaXMucGFyZW50Q29udGV4dCA9IG51bGw7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHlsZVNlbGVjdG9yTmFtZSBcbiAgICAgKiBAcmV0dXJucyB7U3R5bGVzaGVldEJ1aWxkZXJ9XG4gICAgICovXG4gICAgc2VsZWN0b3Ioc3R5bGVTZWxlY3Rvck5hbWUpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IG5ldyBTdHlsZVNlbGVjdG9yKHN0eWxlU2VsZWN0b3JOYW1lKTtcbiAgICAgICAgaWYgKHRoaXMuY29udGV4dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5zdHlsZVNlbGVjdG9yQXJyYXkucHVzaChlbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIGlmKHRoaXMuY29udGV4dCBpbnN0YW5jZW9mIFN0eWxlTWVkaWEpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHlsZVNlbGVjdG9yQXJyYXkucHVzaChlbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgT3BlbiBjb250ZXh0IG11c3QgYmUgYSBtZWRpYSBjb250ZXh0IHdoZW4gYWRkaW5nICR7c3R5bGVTZWxlY3Rvck5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXN0QWRkZWQgPSBlbGVtZW50O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtZWRpYShtZWRpYVNlbGVjdG9yKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRleHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGFkZCBtZWRpYSAke21lZGlhU2VsZWN0b3J9IGluc2lkZSBvcGVuIGNvbnRleHRgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBlbGVtZW50ID0gbmV3IFN0eWxlTWVkaWEobWVkaWFTZWxlY3Rvcik7XG4gICAgICAgIHRoaXMubWVkaWFBcnJheS5wdXNoKGVsZW1lbnQpO1xuICAgICAgICB0aGlzLmxhc3RBZGRlZCA9IGVsZW1lbnQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ3xOdW1iZXJ9IHZhbHVlIFxuICAgICAqIEByZXR1cm5zIHtTdHlsZXNoZWV0QnVpbGRlcn1cbiAgICAgKi9cbiAgICBzdHlsZShwcm9wZXJ0eSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKCEodGhpcy5jb250ZXh0IGluc3RhbmNlb2YgU3R5bGVTZWxlY3RvcikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gb3BlbiBzZWxlY3RvciBjb250ZXh0IHdoZW4gYWRkaW5nIHN0eWxlICR7cHJvcGVydHl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb250ZXh0LndpdGhBdHRyaWJ1dGUocHJvcGVydHksIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1N0eWxlc2hlZXR9XG4gICAgICovXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIGxldCBzdHlsZXNTdHJpbmcgPSBcIlwiO1xuICAgICAgICB0aGlzLnN0eWxlU2VsZWN0b3JBcnJheS5mb3JFYWNoKChzdHlsZVNlbGVjdG9yKSA9PiB7XG4gICAgICAgICAgICBzdHlsZXNTdHJpbmcgKz0gc3R5bGVTZWxlY3Rvci50b1N0cmluZygpICsgXCJcXG5cIjtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubWVkaWFBcnJheS5mb3JFYWNoKChzdHlsZU1lZGlhKSA9PiB7XG4gICAgICAgICAgICBzdHlsZXNTdHJpbmcgKz0gc3R5bGVNZWRpYS50b1N0cmluZygpICsgXCJcXG5cIjtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXcgU3R5bGVzaGVldChzdHlsZXNTdHJpbmcpO1xuICAgIH1cblxufSIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRle1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRlbXBsYXRlU291cmNlIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHRlbXBsYXRlU291cmNlKXtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVNvdXJjZSA9IHRlbXBsYXRlU291cmNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0VGVtcGxhdGVTb3VyY2UoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVTb3VyY2U7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBDb250YWluZXJIdHRwQ2xpZW50LCBDb250YWluZXJIdHRwUmVzcG9uc2UsIENvbnRhaW5lclVwbG9hZERhdGEgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIENsaWVudCB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBhdXRob3JpemF0aW9uXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXRcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxDb250YWluZXJIdHRwUmVzcG9uc2U+fFByb21pc2U8Q29udGFpbmVyRG93bmxvYWQ+fVxuICAgICAqL1xuICAgIHN0YXRpYyBnZXQodXJsLCBhdXRob3JpemF0aW9uID0gbnVsbCwgdGltZW91dCA9IDEwMDAsIGRvd25sb2FkID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9ICB7XG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICB9XG4gICAgICAgIGlmIChkb3dubG9hZCkge1xuICAgICAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZG93bmxvYWQodXJsLnRvU3RyaW5nKCksIHBhcmFtcywgdGltZW91dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckh0dHBDbGllbnQuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgdGltZW91dCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHVybCBcbiAgICAgKiBAcGFyYW0ge09iamVjdHxDb250YWluZXJVcGxvYWREYXRhfSBkYXRhXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGF1dGhvcml6YXRpb25cbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gcHJvZ3JlY0NhbGxiYWNrTWV0aG9kXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXRcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxDb250YWluZXJIdHRwUmVzcG9uc2U+fVxuICAgICAqL1xuICAgIHN0YXRpYyBwb3N0KHVybCwgZGF0YSwgYXV0aG9yaXphdGlvbiA9IG51bGwsIHByb2dyZWNDYWxsYmFja01ldGhvZCA9IG51bGwsIHRpbWVvdXQgPSAxMDAwKXtcbiAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBDb250YWluZXJVcGxvYWREYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gQ29udGFpbmVySHR0cENsaWVudC51cGxvYWQoXCJQT1NUXCIsIHVybCwgZGF0YSwgYXV0aG9yaXphdGlvbiwgcHJvZ3JlY0NhbGxiYWNrTWV0aG9kLCB0aW1lb3V0KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoZWFkZXJzID0gQ2xpZW50LmdldEhlYWRlcihhdXRob3JpemF0aW9uKTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gIHtcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICBtb2RlOiBcImNvcnNcIiwgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogXCJmb2xsb3dcIiwgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIHRpbWVvdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgXG4gICAgICogQHBhcmFtIHtPYmplY3R8Q29udGFpbmVyVXBsb2FkRGF0YX0gZGF0YVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBhdXRob3JpemF0aW9uXG4gICAgICogQHBhcmFtIHtNZXRob2R9IHByb2dyZWNDYWxsYmFja01ldGhvZFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0XG4gICAgICogQHJldHVybnMge1Byb21pc2U8Q29udGFpbmVySHR0cFJlc3BvbnNlPn1cbiAgICAgKi9cbiAgICBzdGF0aWMgcHV0KHVybCwgZGF0YSwgYXV0aG9yaXphdGlvbiA9IG51bGwsIHByb2dyZWNDYWxsYmFja01ldGhvZCA9IG51bGwsIHRpbWVvdXQgPSAxMDAwKXtcbiAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBDb250YWluZXJVcGxvYWREYXRhKSB7XG4gICAgICAgICAgICByZXR1cm4gQ29udGFpbmVySHR0cENsaWVudC51cGxvYWQoXCJQVVRcIiwgdXJsLCBkYXRhLCBhdXRob3JpemF0aW9uLCBwcm9ncmVjQ2FsbGJhY2tNZXRob2QsIHRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xuICAgICAgICBjb25zdCBwYXJhbXMgPSAge1xuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXG4gICAgICAgICAgICBtZXRob2Q6ICdQVVQnLCBcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcbiAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gQ29udGFpbmVySHR0cENsaWVudC5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCB0aW1lb3V0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fENvbnRhaW5lclVwbG9hZERhdGF9IGRhdGFcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gYXV0aG9yaXphdGlvblxuICAgICAqIEBwYXJhbSB7TWV0aG9kfSBwcm9ncmVjQ2FsbGJhY2tNZXRob2RcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdGltZW91dFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPENvbnRhaW5lckh0dHBSZXNwb25zZT59XG4gICAgICovXG4gICAgc3RhdGljIHBhdGNoKHVybCwgZGF0YSwgYXV0aG9yaXphdGlvbiA9IG51bGwsIHByb2dyZWNDYWxsYmFja01ldGhvZCA9IG51bGwsIHRpbWVvdXQgPSAxMDAwKSB7XG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xuICAgICAgICBjb25zdCBwYXJhbXMgPSAge1xuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoZGF0YSksIC8vIG11c3QgbWF0Y2ggJ0NvbnRlbnQtVHlwZScgaGVhZGVyXG4gICAgICAgICAgICBtZXRob2Q6ICdQQVRDSCcsIFxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JywgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIHRpbWVvdXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAgICAgKiBAcGFyYW0ge09iamVjdHxDb250YWluZXJVcGxvYWREYXRhfSBkYXRhXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGF1dGhvcml6YXRpb25cbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gcHJvZ3JlY0NhbGxiYWNrTWV0aG9kXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHRpbWVvdXRcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxDb250YWluZXJIdHRwUmVzcG9uc2U+fVxuICAgICAqL1xuICAgIHN0YXRpYyBkZWxldGUodXJsLCBkYXRhLCBhdXRob3JpemF0aW9uID0gbnVsbCwgcHJvZ3JlY0NhbGxiYWNrTWV0aG9kID0gbnVsbCwgdGltZW91dCA9IDEwMDApIHtcbiAgICAgICAgY29uc3QgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJhbXMgPSAge1xuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cbiAgICAgICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gQ29udGFpbmVySHR0cENsaWVudC5mZXRjaCh1cmwudG9TdHJpbmcoKSwgcGFyYW1zLCB0aW1lb3V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9ICB7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxuICAgICAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JywgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBDb250YWluZXJIdHRwQ2xpZW50LmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIHRpbWVvdXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldEhlYWRlcihhdXRob3JpemF0aW9uID0gbnVsbCkge1xuICAgICAgICBpZiAoYXV0aG9yaXphdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBcInVzZXItYWdlbnRcIjogXCJNb3ppbGxhLzQuMCBNRE4gRXhhbXBsZVwiLFxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgICAgIFwiQXV0aG9yaXphdGlvblwiOiBhdXRob3JpemF0aW9uXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFwidXNlci1hZ2VudFwiOiBcIk1vemlsbGEvNC4wIE1ETiBFeGFtcGxlXCIsXG4gICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICB9O1xuICAgIH1cbn0iLCJpbXBvcnQge0xpc3QsIE1hcCwgU3RyaW5nVXRpbHN9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgVXJse1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBob3N0IFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwb3J0IFxuICAgICAqIEBwYXJhbSB7TGlzdH0gcGF0aFZhbHVlTGlzdCBcbiAgICAgKiBAcGFyYW0ge01hcH0gcGFyYW1ldGVyVmFsdWVNYXAgXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGFuY2hvciBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihwcm90b2NvbCwgaG9zdCwgcG9ydCwgcGF0aFZhbHVlTGlzdCwgcGFyYW1ldGVyVmFsdWVNYXAsIGFuY2hvcil7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIHRoaXMucHJvdG9jb2xTdHJpbmcgPSBwcm90b2NvbDtcblxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5ob3N0U3RyaW5nID0gaG9zdDtcblxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5wb3J0U3RyaW5nID0gcG9ydDtcblxuICAgICAgICAvKiogQHR5cGUge0xpc3R9ICovXG4gICAgICAgIHRoaXMucGF0aFZhbHVlTGlzdCA9IHBhdGhWYWx1ZUxpc3Q7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMucGFyYW1ldGVyVmFsdWVNYXAgPSBwYXJhbWV0ZXJWYWx1ZU1hcDtcblxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5hbmNob3JTdHJpbmcgPSBhbmNob3I7XG4gICAgICAgIFxuICAgICAgICBpZiAoIXRoaXMucGF0aFZhbHVlTGlzdCkge1xuICAgICAgICAgICAgdGhpcy5wYXRoVmFsdWVMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMucGFyYW1ldGVyVmFsdWVNYXApIHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVyVmFsdWVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQgcHJvdG9jb2woKXtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvdG9jb2xTdHJpbmc7XG4gICAgfVxuXG4gICAgZ2V0IGhvc3QoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuaG9zdFN0cmluZztcbiAgICB9XG5cbiAgICBnZXQgcG9ydCgpe1xuICAgICAgICByZXR1cm4gdGhpcy5wb3J0U3RyaW5nO1xuICAgIH1cblxuICAgIGdldCBwYXRoc0xpc3QoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aFZhbHVlTGlzdDtcbiAgICB9XG5cbiAgICBnZXQgYW5jaG9yKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmFuY2hvclN0cmluZztcbiAgICB9XG5cbiAgICBnZXQgcGFyYW1ldGVyTWFwKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJhbWV0ZXJWYWx1ZU1hcDtcbiAgICB9XG5cbiAgICBnZXRQYXRoUGFydChpbmRleCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhWYWx1ZUxpc3QuZ2V0KGluZGV4KTtcbiAgICB9XG5cbiAgICByZXBsYWNlUGF0aFZhbHVlKGZyb20sIHRvKXtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMucGF0aFZhbHVlTGlzdC5zaXplKCkpIHtcbiAgICAgICAgICAgIGlmIChTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKGZyb20sIHRoaXMucGF0aFZhbHVlTGlzdC5nZXQoaSkpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXRoVmFsdWVMaXN0LnNldChpLCB0byk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpICsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBwYXRoKCl7XG4gICAgICAgIGxldCBwYXRoID0gXCIvXCI7XG4gICAgICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgICAgIHRoaXMucGF0aFZhbHVlTGlzdC5mb3JFYWNoKCh2YWx1ZSA9PiB7XG4gICAgICAgICAgICBpZiAoIWZpcnN0KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGggKyBcIi9cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhdGggPSBwYXRoICsgdmFsdWU7XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9KSwgdGhpcyk7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIGdldFBhcmFtZXRlcihrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyTWFwLmdldChrZXkpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHZhciB2YWx1ZSA9IFwiXCI7XG4gICAgICAgIGlmKHRoaXMucHJvdG9jb2wgIT09IG51bGwpe1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIHRoaXMucHJvdG9jb2wgKyBcIi8vXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5ob3N0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyB0aGlzLmhvc3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5wb3J0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIjpcIiArIHRoaXMucG9ydDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGF0aFZhbHVlTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHBhdGhQYXJ0LHBhcmVudCl7XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCIvXCIgKyBwYXRoUGFydDtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LHRoaXMpO1xuXG4gICAgICAgIHZhciBmaXJzdFBhcmFtZXRlciA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJNYXAuZm9yRWFjaChmdW5jdGlvbihwYXJhbWV0ZXJLZXkscGFyYW1ldGVyVmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIGlmKGZpcnN0UGFyYW1ldGVyKXtcbiAgICAgICAgICAgICAgICBmaXJzdFBhcmFtZXRlcj1mYWxzZTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCI/XCI7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgXCImXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHZhbHVlICsgZW5jb2RlVVJJKHBhcmFtZXRlcktleSkgKyBcIj1cIiArIGVuY29kZVVSSShwYXJhbWV0ZXJWYWx1ZSk7XG4gICAgICAgIH0sdGhpcyk7XG5cbiAgICAgICAgaWYodGhpcy5hbmNob3IgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIiNcIiArIHRoaXMuYW5jaG9yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IExpc3QsIE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4vdXJsLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBVcmxVdGlscyB7XG5cbiAgICAvKipcbiAgICAgKiBQYXJzZSBzdHJpbmcgdG8gdXJsXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybFN0cmluZyBcbiAgICAgKiBAcmV0dXJucyB7VXJsfVxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZSh1cmxTdHJpbmcpIHtcbiAgICAgICAgXG4gICAgICAgIGxldCByZW1haW5pbmcgPSB7IFwic3RyaW5nXCIgOiB1cmxTdHJpbmcgfTtcblxuICAgICAgICBpZiAodXJsU3RyaW5nID09PSBudWxsKSB7IHJldHVybiBudWxsOyB9XG5cbiAgICAgICAgY29uc3QgcHJvdG9jb2wgPSAgICAgIFVybFV0aWxzLmRldGVybWluZVByb3RvY29sKHJlbWFpbmluZyk7XG4gICAgICAgIGNvbnN0IGhvc3RBbmRQb3J0ID0gICBVcmxVdGlscy5kZXRlcm1pbmVIb3N0QW5kUG9ydChyZW1haW5pbmcpO1xuICAgICAgICBjb25zdCBob3N0ID0gICAgICAgICAgVXJsVXRpbHMuZXh0cmFjdEhvc3QoaG9zdEFuZFBvcnQpO1xuICAgICAgICBjb25zdCBwb3J0ID0gICAgICAgICAgVXJsVXRpbHMuZXh0cmFjdFBvcnQoaG9zdEFuZFBvcnQpO1xuICAgICAgICBjb25zdCBwYXRoc0xpc3QgPSAgICAgVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aChyZW1haW5pbmcpO1xuICAgICAgICBjb25zdCBwYXJhbWV0ZXJzTWFwID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGFyYW1ldGVycyhyZW1haW5pbmcpO1xuICAgICAgICBjb25zdCBib29rbWFyayA9ICAgICAgVXJsVXRpbHMuZGV0ZXJtaW5lQm9va21hcmsocmVtYWluaW5nKTtcblxuICAgICAgICByZXR1cm4gbmV3IFVybChwcm90b2NvbCwgaG9zdCwgcG9ydCwgcGF0aHNMaXN0LCBwYXJhbWV0ZXJzTWFwLCBib29rbWFyayk7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZVByb3RvY29sKHJlbWFpbmluZyl7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJlbWFpbmluZ1tcInN0cmluZ1wiXTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwcm90b2NvbCA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh2YWx1ZS5pbmRleE9mKFwiLy9cIikgPT09IC0xKXtcbiAgICAgICAgICAgIC8vIE5vICcvLycgdG8gaW5kaWNhdGUgcHJvdG9jb2wgXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJ0cyA9IHZhbHVlLnNwbGl0KFwiLy9cIik7XG4gICAgICAgIGlmKHBhcnRzWzBdLmluZGV4T2YoXCIvXCIpICE9PSAtMSl7XG4gICAgICAgICAgICAvLyBzbGFzaCBzaG91bGQgbm90IGJlIGluIHByb3RvY29sXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb3RvY29sID0gcGFydHNbMF07XG4gICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT0gMSl7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gdmFsdWUucmVwbGFjZShwYXJ0c1swXSArIFwiLy9cIiwgXCJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvdG9jb2w7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZUhvc3RBbmRQb3J0KHJlbWFpbmluZyl7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJlbWFpbmluZ1tcInN0cmluZ1wiXTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBob3N0QW5kUG9ydCA9IHZhbHVlO1xuICAgICAgICBsZXQgcmVtYWluaW5nU3RyaW5nID0gbnVsbDtcblxuICAgICAgICBpZiAoaG9zdEFuZFBvcnQuaW5kZXhPZihcIi9cIikgIT09IC0xKSB7XG4gICAgICAgICAgICAvLyBIb3N0IGNvbWVzIGJlZm9yZSB0aGUgZmlyc3QgJy8nXG4gICAgICAgICAgICBob3N0QW5kUG9ydCA9IGhvc3RBbmRQb3J0LnNwbGl0KFwiL1wiKVswXTtcbiAgICAgICAgICAgIHJlbWFpbmluZ1N0cmluZyA9IHZhbHVlLnJlcGxhY2UoaG9zdEFuZFBvcnQgKyBcIi9cIiwgXCJcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSByZW1haW5pbmdTdHJpbmc7XG4gICAgICAgIHJldHVybiBob3N0QW5kUG9ydDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZXh0cmFjdEhvc3QoaG9zdEFuZFBvcnQpe1xuICAgICAgICBpZiAoIWhvc3RBbmRQb3J0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZihob3N0QW5kUG9ydC5pbmRleE9mKFwiOlwiKSA9PT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIGhvc3RBbmRQb3J0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBob3N0QW5kUG9ydC5zcGxpdChcIjpcIilbMF07XG4gICAgfVxuXG4gICAgc3RhdGljIGV4dHJhY3RQb3J0KGhvc3RBbmRQb3J0KXtcbiAgICAgICAgaWYgKCFob3N0QW5kUG9ydCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYoaG9zdEFuZFBvcnQuaW5kZXhPZihcIjpcIikgPT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBob3N0QW5kUG9ydC5zcGxpdChcIjpcIilbMV07XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZVBhdGgocmVtYWluaW5nKXtcbiAgICAgICAgbGV0IHZhbHVlID0gcmVtYWluaW5nW1wic3RyaW5nXCJdO1xuXG4gICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTGlzdCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHBhdGggPSB2YWx1ZTtcblxuICAgICAgICBpZiAocGF0aC5pbmRleE9mKFwiP1wiKSAhPT0gLTEpe1xuICAgICAgICAgICAgbGV0IHBhcnRzID0gcGF0aC5zcGxpdChcIj9cIik7XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IHBhdGguc3Vic3RyaW5nKHBhdGguaW5kZXhPZihcIj9cIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGF0aCA9IHBhcnRzWzBdO1xuXG4gICAgICAgIH0gZWxzZSBpZiAocGF0aC5pbmRleE9mKFwiI1wiKSAhPT0gLTEpe1xuICAgICAgICAgICAgbGV0IHBhcnRzID0gcGF0aC5zcGxpdChcIiNcIik7XG4gICAgICAgICAgICBpZiAocGFydHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IHBhdGguc3Vic3RyaW5nKHBhdGguaW5kZXhPZihcIiNcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGF0aCA9IHBhcnRzWzBdO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aChcIi9cIikpIHtcbiAgICAgICAgICAgIHBhdGggPSB2YWx1ZS5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByYXdQYXRoUGFydExpc3QgPSBuZXcgTGlzdChwYXRoLnNwbGl0KFwiL1wiKSk7XG5cbiAgICAgICAgY29uc3QgcGF0aFZhbHVlTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHJhd1BhdGhQYXJ0TGlzdC5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgcGF0aFZhbHVlTGlzdC5hZGQoZGVjb2RlVVJJKHZhbHVlKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHBhdGhWYWx1ZUxpc3Q7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZVBhcmFtZXRlcnMocmVtYWluaW5nKXtcbiAgICAgICAgY29uc3QgdmFsdWUgPSByZW1haW5pbmdbXCJzdHJpbmdcIl07XG5cbiAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYXAoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBwYXJhbWV0ZXJzID0gdmFsdWU7XG5cbiAgICAgICAgaWYocGFyYW1ldGVycy5pbmRleE9mKFwiP1wiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWFwKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyYW1ldGVycyA9IHBhcmFtZXRlcnMuc3Vic3RyaW5nKHBhcmFtZXRlcnMuaW5kZXhPZihcIj9cIikrMSk7XG4gICAgICAgIGlmKHBhcmFtZXRlcnMuaW5kZXhPZihcIiNcIikgIT09IC0xKSB7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBwYXJhbWV0ZXJzLnN1YnN0cmluZyhwYXJhbWV0ZXJzLmluZGV4T2YoXCIjXCIpKTtcbiAgICAgICAgICAgIHBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzLnN1YnN0cmluZygwLHBhcmFtZXRlcnMuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtYWluaW5nW1wic3RyaW5nXCJdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmFtZXRlclBhcnRMaXN0ID0gbmV3IExpc3QocGFyYW1ldGVycy5zcGxpdChcIiZcIikpO1xuICAgICAgICBjb25zdCBwYXJhbWV0ZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHBhcmFtZXRlclBhcnRMaXN0LmZvckVhY2goKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICBsZXQga2V5VmFsdWUgPSB2YWx1ZS5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICBpZihrZXlWYWx1ZS5sZW5ndGggPj0gMil7XG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyTWFwLnNldChkZWNvZGVVUkkoa2V5VmFsdWVbMF0pLGRlY29kZVVSSShrZXlWYWx1ZVsxXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBwYXJhbWV0ZXJNYXA7XG4gICAgfVxuXG4gICAgc3RhdGljIGRldGVybWluZUJvb2ttYXJrKHJlbWFpbmluZyl7XG4gICAgICAgIGxldCB2YWx1ZSA9IHJlbWFpbmluZ1tcInN0cmluZ1wiXTtcblxuICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICByZW1haW5pbmdbXCJzdHJpbmdcIl0gPSBudWxsO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYm9va21hcmsgPSB2YWx1ZTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIiNcIikgIT09IC0xKSB7XG4gICAgICAgICAgICBib29rbWFyayA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiI1wiKSsxKTtcbiAgICAgICAgICAgIHJlbWFpbmluZ1tcInN0cmluZ1wiXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJvb2ttYXJrO1xuICAgIH1cblxuXG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBMb2dnZXIsIE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tIFwiLi90ZW1wbGF0ZS5qc1wiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgVXJsVXRpbHMgfSBmcm9tIFwiLi4vdXRpbC91cmxVdGlscy5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiVGVtcGxhdGVSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlUXVldWVTaXplID0gMDtcblxuICAgICAgICAvKiogQHR5cGUge01ldGhvZH0gKi9cbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZVByZWZpeCBcbiAgICAgKi9cbiAgICBzZXRMYW5ndWFnZVByZWZpeChsYW5ndWFnZVByZWZpeCkge1xuICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ID0gbGFuZ3VhZ2VQcmVmaXg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtUZW1wbGF0ZX0gdGVtcGxhdGUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBzZXQobmFtZSx0ZW1wbGF0ZSx1cmwpe1xuICAgICAgICBpZih1cmwgIT09IHVuZGVmaW5lZCAmJiB1cmwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAuc2V0KG5hbWUsIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50ZW1wbGF0ZU1hcC5zZXQobmFtZSwgdGVtcGxhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGdldChuYW1lKXtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVtcGxhdGVNYXAuZ2V0KG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGNvbnRhaW5zKG5hbWUpe1xuICAgICAgICBpZiAodGhpcy50ZW1wbGF0ZU1hcC5nZXQobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gY2FsbGJhY2sgXG4gICAgICovXG4gICAgZG9uZShjYWxsYmFjayl7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGVSZWdpc3RyeX0gcmVnaXN0cnkgXG4gICAgICovXG4gICAgZG9DYWxsYmFjayhyZWdpc3RyeSl7XG4gICAgICAgIGlmKHRtby5jYWxsYmFjayAhPT0gbnVsbCAmJiByZWdpc3RyeS5jYWxsYmFjayAhPT0gdW5kZWZpbmVkICAmJiByZWdpc3RyeS50ZW1wbGF0ZVF1ZXVlU2l6ZSA9PT0gcmVnaXN0cnkudGVtcGxhdGVNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcbiAgICAgICAgICAgIHJlZ2lzdHJ5LmNhbGxiYWNrID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBDYWxsYmFjay5jYWxsKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGFzeW5jIGxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIGlmKHRoaXMubGFuZ3VhZ2VQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVybC5wYXRoc0xpc3Quc2V0TGFzdChcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ICsgXCIuXCIgK1xuICAgICAgICAgICAgICAgIHVybC5wYXRoc0xpc3QuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGVtcGxhdGVRdWV1ZVNpemUgKys7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LmdldCh1cmwpO1xuICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgVGVtcGxhdGUodGV4dCksdXJsKTtcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgIH1cblxuICAgIGFzeW5jIGdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UobmFtZVVybE1hcCkge1xuICAgICAgICBcbiAgICAgICAgaWYoIW5hbWVVcmxNYXAgfHwgbmFtZVVybE1hcC5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvYWRQcm9taXNlcyA9IFtdO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzO1xuICAgICAgICBuYW1lVXJsTWFwLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChwYXJlbnQuY29udGFpbnMoa2V5KSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsb2FkUHJvbWlzZXMucHVzaChwYXJlbnQucHJpdmF0ZUxvYWQoa2V5LCBVcmxVdGlscy5wYXJzZSh2YWx1ZSkpKTtcbiAgICAgICAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKGxvYWRQcm9taXNlcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBhc3luYyBwcml2YXRlTG9hZChuYW1lLCB1cmwpIHtcbiAgICAgICAgaWYgKHRoaXMubGFuZ3VhZ2VQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVybC5wYXRoc0xpc3Quc2V0TGFzdChcbiAgICAgICAgICAgICAgICB0aGlzLmxhbmd1YWdlUHJlZml4ICsgXCIuXCIgK1xuICAgICAgICAgICAgICAgIHVybC5wYXRoc0xpc3QuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIExPRy5pbmZvKFwiTG9hZGluZyB0ZW1wbGF0ZSBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybC50b1N0cmluZygpKTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBDbGllbnQuZ2V0KHVybCk7XG4gICAgICAgIGlmICghcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSBuZXcgVGVtcGxhdGUodGV4dCk7XG4gICAgICAgIHRoaXMuc2V0KG5hbWUsIHRlbXBsYXRlLCB1cmwpO1xuICAgICAgICByZXR1cm4gdGVtcGxhdGU7XG4gICAgfVxufSIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFR5cGVDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlRlbXBsYXRlUG9zdENvbmZpZ1wiKTtcblxuLyoqXG4gKiBUbyBiZSBhZGRlZCB0byBtaW5kaSBhcyBhIHNpbmdsZXRvbi4gV2lsbCBzY2FuIHRocm91Z2ggYWxsIGNvbmZpZ3VyZWQgY2xhc3NlcyB0aGF0IGhhdmUgYSBURU1QTEFURV9VUkxcbiAqIHN0YXRpYyBnZXR0ZXIgYW5kIHdpbGwgYXN5bmNyb25vdXNseSBsb2FkIHRoZW0uIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gYWxsIHRlbXBsYXRlcyBhcmUgbG9hZGVkXG4gKi9cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZXNMb2FkZXIge1xuXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1RlbXBsYXRlUmVnaXN0cnl9IHRlbXBsYXRlUmVnaXN0cnkgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodGVtcGxhdGVSZWdpc3RyeSkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX0gKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gdGVtcGxhdGVSZWdpc3RyeTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcDxTdHJpbmcsVHlwZUNvbmZpZz59IGNvbmZpZ0VudHJpZXNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBsb2FkKGNvbmZpZ0VudHJpZXMpIHtcbiAgICAgICAgbGV0IHRlbXBsYXRlTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICBjb25maWdFbnRyaWVzLmZvckVhY2goKGNvbmZpZ0VudHJ5LCBrZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5URU1QTEFURV9VUkwpIHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZU1hcC5zZXQoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UubmFtZSwgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuVEVNUExBVEVfVVJMKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7IFxuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UodGVtcGxhdGVNYXApO1xuICAgIH1cblxufSIsImltcG9ydCB7IENvbnRhaW5lckVsZW1lbnQgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBNYXBwZWRDb250YWluZXJFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7Q29udGFpbmVyRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG5cbiAgICAgICAgaWYgKCFlbGVtZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb250YWluZXJFbGVtZW50IG11c3QgYmUgcHJvdmlkZWRcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvKiogQHR5cGUge0NvbnRhaW5lckVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgQ29udGFpbmVyRWxlbWVudCwgQ29udGFpbmVyRWxlbWVudFV0aWxzIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTWFwcGVkQ29udGFpbmVyRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L21hcHBlZENvbnRhaW5lckVsZW1lbnRcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkVsZW1lbnRVdGlsc1wiKTtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnRVdGlscyB7XG5cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBcbiAgICAgKiBAcGFyYW0ge01hcHBlZENvbnRhaW5lckVsZW1lbnR9IHBhcmVudCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlQ29udGFpbmVyRWxlbWVudCh2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFhtbEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBFbGVtZW50VXRpbHMuY3JlYXRlRnJvbVhtbEVsZW1lbnQodmFsdWUsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgcmV0dXJuIENvbnRhaW5lckVsZW1lbnRVdGlscy5jcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoQ29udGFpbmVyRWxlbWVudFV0aWxzLmlzVUlFbGVtZW50KHZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDb250YWluZXJFbGVtZW50KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBMT0cuZXJyb3IoXCJVbnJlY29nbml6ZWQgdmFsdWUgZm9yIEVsZW1lbnRcIik7XG4gICAgICAgIExPRy5lcnJvcih2YWx1ZSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBicm93c2VyIEVsZW1lbnQgZnJvbSB0aGUgWG1sRWxlbWVudFxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB4bWxFbGVtZW50XG4gICAgICogQHBhcmFtIHtNYXBwZWRDb250YWluZXJFbGVtZW50fSBwYXJlbnRFbGVtZW50XG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZUZyb21YbWxFbGVtZW50KHhtbEVsZW1lbnQsIHBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBudWxsO1xuICAgICAgICBpZiAoeG1sRWxlbWVudC5uYW1lc3BhY2UpIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50VXRpbHMuY3JlYXRlRWxlbWVudE5TKHhtbEVsZW1lbnQubmFtZXNwYWNlVXJpLCB4bWxFbGVtZW50LmZ1bGxOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50VXRpbHMuY3JlYXRlRWxlbWVudCh4bWxFbGVtZW50Lm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJlbnRFbGVtZW50ICYmIHBhcmVudEVsZW1lbnQuY29udGFpbmVyRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyZW50RWxlbWVudC5jb250YWluZXJFbGVtZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHhtbEVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKChhdHRyaWJ1dGVLZXksIGF0dHJpYnV0ZSkgPT4ge1xuICAgICAgICAgICAgQ29udGFpbmVyRWxlbWVudFV0aWxzLnNldEF0dHJpYnV0ZVZhbHVlKGVsZW1lbnQsIGF0dHJpYnV0ZUtleSwgYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTWFwLCBMb2dnZXIsIFN0cmluZ1V0aWxzLCBNZXRob2QgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuLi9jbGllbnQvY2xpZW50LmpzXCI7XG5pbXBvcnQgeyBDb250YWluZXJEb3dubG9hZCwgQ29udGFpbmVySHR0cFJlc3BvbnNlLCBDb250YWluZXJVcGxvYWREYXRhIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuXG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJIdHRwQ2FsbEJ1aWxkZXJcIik7XG5cbi8qKlxuICogQHRlbXBsYXRlIFRcbiAqL1xuZXhwb3J0IGNsYXNzIEh0dHBDYWxsQnVpbGRlciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHVybCkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3RyaW5nfSAqL1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcblxuICAgICAgICAvKiogQHR5cGUge1N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5hdXRob3JpemF0aW9uID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy5zdWNjZXNzTWFwcGluZ01hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgdGhpcy5mYWlsTWFwcGluZ01hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge2Z1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLmVycm9yTWFwcGluZ0Z1bmN0aW9uID0gKGVycm9yKSA9PiB7IHJldHVybiBlcnJvcjsgfTtcblxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICAgICAgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlID0gNDAwMDtcblxuICAgICAgICAvKiogQHR5cGUge251bWJlcn0gKi9cbiAgICAgICAgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSA9IDQwMDA7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNZXRob2R9ICovXG4gICAgICAgIHRoaXMucHJvZ3Jlc3NDYWxsYmFja01ldGhvZCA9IG51bGw7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtib29sZWFufSAqL1xuICAgICAgICB0aGlzLmRvd25sb2FkUmVzcG9uc2UgPSBmYWxzZTtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXG4gICAgICogQHJldHVybnMge0h0dHBDYWxsQnVpbGRlcn1cbiAgICAgKi9cbiAgICBzdGF0aWMgbmV3SW5zdGFuY2UodXJsKSB7XG4gICAgICAgIHJldHVybiBuZXcgSHR0cENhbGxCdWlsZGVyKHVybCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGNvZGUgXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cbiAgICAgKiBAcmV0dXJuIHtIdHRwQ2FsbEJ1aWxkZXJ9XG4gICAgICovXG4gICAgc3VjY2Vzc01hcHBpbmcoY29kZSwgbWFwcGVyRnVuY3Rpb24gPSAoKSA9PiB7IHJldHVybiBudWxsOyB9KSB7XG4gICAgICAgIHRoaXMuc3VjY2Vzc01hcHBpbmdNYXAuc2V0KGNvZGUsIG1hcHBlckZ1bmN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge0h0dHBDYWxsQnVpbGRlcjxDb250YWluZXJEb3dubG9hZD59XG4gICAgICovXG4gICAgYXNEb3dubG9hZCgpIHtcbiAgICAgICAgdGhpcy5kb3dubG9hZFJlc3BvbnNlID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGNvZGUgXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cbiAgICAgKiBAcmV0dXJuIHtIdHRwQ2FsbEJ1aWxkZXJ9XG4gICAgICovXG4gICAgZmFpbE1hcHBpbmcoY29kZSwgbWFwcGVyRnVuY3Rpb24gPSAoKSA9PiB7IHJldHVybiBudWxsOyB9KSB7XG4gICAgICAgIHRoaXMuZmFpbE1hcHBpbmdNYXAuc2V0KGNvZGUsIG1hcHBlckZ1bmN0aW9uKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gbWFwcGVyRnVuY3Rpb24gbWFwcGVyIGZ1bmN0aW9uIHRvIHBhc3MgdGhlIHJlc3VsdCBvYmplY3QgdG9cbiAgICAgKiBAcmV0dXJuIHtIdHRwQ2FsbEJ1aWxkZXJ9XG4gICAgICovXG4gICAgZXJyb3JNYXBwaW5nKG1hcHBlckZ1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuZXJyb3JNYXBwaW5nRnVuY3Rpb24gPSBtYXBwZXJGdW5jdGlvbjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGF1dGhvcml6YXRpb24gXG4gICAgICogQHJldHVybiB7SHR0cENhbGxCdWlsZGVyfVxuICAgICAqL1xuICAgIGF1dGhvcml6YXRpb25IZWFkZXIoYXV0aG9yaXphdGlvbikge1xuICAgICAgICBpZiAoIVN0cmluZ1V0aWxzLmlzQmxhbmsoYXV0aG9yaXphdGlvbikpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0aG9yaXphdGlvbiA9IFwiQmVhcmVyIFwiICsgYXV0aG9yaXphdGlvbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gcHJvZ3Jlc3NDYWxsYmFja01ldGhvZCBcbiAgICAgKiBAcmV0dXJucyB7SHR0cENhbGxCdWlsZGVyfVxuICAgICAqL1xuICAgIHByb2dyZXNzQ2FsbGJhY2socHJvZ3Jlc3NDYWxsYmFja01ldGhvZCkge1xuICAgICAgICB0aGlzLnByb2dyZXNzQ2FsbGJhY2tNZXRob2QgPSBwcm9ncmVzc0NhbGxiYWNrTWV0aG9kO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY29ubmVjdGlvblRpbWVvdXRWYWx1ZSBcbiAgICAgKiBAcmV0dXJucyB7SHR0cENhbGxCdWlsZGVyfVxuICAgICAqL1xuICAgIGNvbm5lY3Rpb25UaW1lb3V0KGNvbm5lY3Rpb25UaW1lb3V0VmFsdWUpIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlID0gY29ubmVjdGlvblRpbWVvdXRWYWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHJlc3BvbnNlVGltZW91dFZhbHVlIFxuICAgICAqIEByZXR1cm5zIHtIdHRwQ2FsbEJ1aWxkZXJ9XG4gICAgICovXG4gICAgcmVzcG9uc2VUaW1lb3V0KHJlc3BvbnNlVGltZW91dFZhbHVlKSB7XG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUgPSByZXNwb25zZVRpbWVvdXRWYWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge1Byb21pc2U8VD59XG4gICAgICovXG4gICAgYXN5bmMgZ2V0KCkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IENsaWVudC5nZXQodGhpcy51cmwsIHRoaXMuYXV0aG9yaXphdGlvbiwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLmRvd25sb2FkUmVzcG9uc2UpO1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdHxDb250YWluZXJVcGxvYWREYXRhfSBwYXlsb2FkXG4gICAgICogQHJldHVybnMge1Byb21pc2U8VD59XG4gICAgICovXG4gICAgYXN5bmMgcG9zdChwYXlsb2FkKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LnBvc3QodGhpcy51cmwsIHBheWxvYWQsIHRoaXMuYXV0aG9yaXphdGlvbiwgdGhpcy5wcm9ncmVzc0NhbGxiYWNrTWV0aG9kLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdHxDb250YWluZXJVcGxvYWREYXRhfSBwYXlsb2FkXG4gICAgICogQHJldHVybnMge1Byb21pc2U8VD59XG4gICAgICovXG4gICAgYXN5bmMgcHV0KHBheWxvYWQpIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBDbGllbnQucHV0KHRoaXMudXJsLCBwYXlsb2FkLCB0aGlzLmF1dGhvcml6YXRpb24sIHRoaXMucHJvZ3Jlc3NDYWxsYmFja01ldGhvZCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXNUeXBlTWFwcGVkUHJvbWlzZShyZXNwb25zZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R8Q29udGFpbmVyVXBsb2FkRGF0YX0gcGF5bG9hZFxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFQ+fVxuICAgICAqL1xuICAgIGFzeW5jIHBhdGNoKHBheWxvYWQpIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBDbGllbnQucGF0Y2godGhpcy51cmwsIHBheWxvYWQsIHRoaXMuYXV0aG9yaXphdGlvbiwgdGhpcy5wcm9ncmVzc0NhbGxiYWNrTWV0aG9kLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5hc1R5cGVNYXBwZWRQcm9taXNlKHJlc3BvbnNlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge09iamVjdHxDb250YWluZXJVcGxvYWREYXRhfSBwYXlsb2FkXG4gICAgICogQHJldHVybnMge1Byb21pc2U8VD59XG4gICAgICovXG4gICAgYXN5bmMgZGVsZXRlKHBheWxvYWQgPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LmRlbGV0ZSh0aGlzLnVybCwgcGF5bG9hZCwgdGhpcy5hdXRob3JpemF0aW9uLCB0aGlzLnByb2dyZXNzQ2FsbGJhY2tNZXRob2QsIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmFzVHlwZU1hcHBlZFByb21pc2UocmVzcG9uc2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7UHJvbWlzZTxDb250YWluZXJIdHRwUmVzcG9uc2V9IGZldGNoUHJvbWlzZSBcbiAgICAgKi9cbiAgICBhc3luYyBhc1R5cGVNYXBwZWRQcm9taXNlKGZldGNoUHJvbWlzZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZmV0Y2hSZXNwb25zZSA9IGF3YWl0IGZldGNoUHJvbWlzZTtcbiAgICAgICAgICAgIGlmIChmZXRjaFJlc3BvbnNlIGluc3RhbmNlb2YgQ29udGFpbmVyRG93bmxvYWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmV0Y2hSZXNwb25zZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmhhbmRsZUZldGNoUmVzcG9uc2UoZmV0Y2hSZXNwb25zZSk7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIEFQSSBkaWQgbm90IGV4ZWN1dGVcbiAgICAgICAgICAgIHRocm93IHRoaXMuZXJyb3JNYXBwaW5nRnVuY3Rpb24oZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtDb250YWluZXJIdHRwUmVzcG9uc2V9IGZldGNoUmVzcG9uc2UgXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gcmVzb2x2ZSBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZWplY3QgXG4gICAgICovXG4gICAgYXN5bmMgaGFuZGxlRmV0Y2hSZXNwb25zZShmZXRjaFJlc3BvbnNlKSB7XG4gICAgICAgIGNvbnN0IHN1Y2Nlc3NSZXNwb25zZU1hcHBlciA9IHRoaXMuc3VjY2Vzc01hcHBpbmdNYXAuZ2V0KGZldGNoUmVzcG9uc2Uuc3RhdHVzKTtcbiAgICAgICAgY29uc3QgZmFpbFJlc3BvbnNlTWFwcGVyID0gdGhpcy5mYWlsTWFwcGluZ01hcC5nZXQoZmV0Y2hSZXNwb25zZS5zdGF0dXMpO1xuXG4gICAgICAgIC8vIEVtcHR5IHJlc3BvbnNlXG4gICAgICAgIGlmICgyMDQgPT09IGZldGNoUmVzcG9uc2Uuc3RhdHVzIHx8IGZldGNoUmVzcG9uc2UuaGVhZGVycy5nZXQoXCJDb250ZW50LUxlbmd0aFwiKSA9PT0gXCIwXCIpIHtcbiAgICAgICAgICAgIGlmIChzdWNjZXNzUmVzcG9uc2VNYXBwZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKG51bGwpOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmYWlsUmVzcG9uc2VNYXBwZXIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBmYWlsUmVzcG9uc2VNYXBwZXIobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNaXNzaW5nIG1hcHBlciBmb3IgcmV0dXJuIHN0YXR1czogXCIgKyBmZXRjaFJlc3BvbnNlLnN0YXR1cyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3N1bWluZyBqc29uIHJlc3BvbnNlICAgICAgXG4gICAgICAgIHRyeSB7ICBcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlSnNvbiA9IGF3YWl0IGZldGNoUmVzcG9uc2UuanNvbigpO1xuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NSZXNwb25zZU1hcHBlcikgeyBcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2Vzc1Jlc3BvbnNlTWFwcGVyKHJlc3BvbnNlSnNvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmFpbFJlc3BvbnNlTWFwcGVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZmFpbFJlc3BvbnNlTWFwcGVyKHJlc3BvbnNlSnNvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmVycm9yTWFwcGluZ0Z1bmN0aW9uKHJlc3BvbnNlSnNvbik7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIFJlc3BvbnNlIGRpZCBub3QgcHJvdmlkZSBqc29uXG4gICAgICAgICAgICB0aHJvdyB0aGlzLmVycm9yTWFwcGluZ0Z1bmN0aW9uKGVycm9yKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IExpc3QsIE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tICcuL2Fic3RyYWN0VmFsaWRhdG9yLmpzJztcblxuZXhwb3J0IGNsYXNzIEFuZFZhbGlkYXRvclNldCBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKGlzVmFsaWRGcm9tU3RhcnQgPSBmYWxzZSkge1xuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0ID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0VmFsaWRhdG9yfSB2YWxpZGF0b3JcbiAgICAgKi9cbiAgICB3aXRoVmFsaWRhdG9yKHZhbGlkYXRvcikge1xuICAgICAgICB2YWxpZGF0b3Iud2l0aFZhbGlkTGlzdGVuZXIobmV3IE1ldGhvZCh0aGlzLCB0aGlzLm9uZVZhbGlkKSk7XG4gICAgICAgIHZhbGlkYXRvci53aXRoSW52YWxpZExpc3RlbmVyKG5ldyBNZXRob2QodGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxuICAgICAqL1xuICAgIG9uZVZhbGlkKCkge1xuICAgICAgICBsZXQgZm91bmRJbnZhbGlkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIGlmKCF2YWx1ZS5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZEludmFsaWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgaWYoIWZvdW5kSW52YWxpZCkge1xuICAgICAgICAgICAgc3VwZXIudmFsaWQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxuICAgICAqL1xuICAgIG9uZUludmFsaWQoKSB7XG4gICAgICAgIHN1cGVyLmludmFsaWQoKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRW1haWxWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XG5cbiAgICBzdGF0aWMgRU1BSUxfRk9STUFUID0gL15cXHcrKFtcXC4tXT9cXHcrKSpAXFx3KyhbXFwuLV0/XFx3KykqKFxcLlxcd3syLDN9KSskLztcblxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIobWFuZGF0b3J5LCBpc2N1cnJlbnRseVZhbGlkLCBFbWFpbFZhbGlkYXRvci5FTUFJTF9GT1JNQVQpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xuaW1wb3J0IHsgTWV0aG9kIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBFcXVhbHNGdW5jdGlvblJlc3VsdFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuXHQvKipcblx0ICogXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gbWFuZGF0b3J5IFxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGlzY3VycmVudGx5VmFsaWQgXG5cdCAqIEBwYXJhbSB7TWV0aG9kfSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXG5cdCAqL1xuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIGNvbXBhcmVkVmFsdWVGdW5jdGlvbiA9IG51bGwpIHtcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcblxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcblxuXHRcdC8qKiBAdHlwZSB7TWV0aG9kfSAqL1xuXHRcdHRoaXMuY29tcGFyZWRWYWx1ZUZ1bmN0aW9uID0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uO1xuXHR9XG5cblx0dmFsaWRhdGUodmFsdWUpe1xuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gdGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24uY2FsbCgpKXtcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmludmFsaWQoKTtcblx0XHR9XG5cdH1cblxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xuXHRcdFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSB0aGlzLmNvbXBhcmVkVmFsdWVGdW5jdGlvbi5jYWxsKCkpe1xuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xuXHRcdH1cblx0fVxuXG59IiwiaW1wb3J0IHsgTGlzdCwgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi91cmwuanNcIjtcbmltcG9ydCB7IFVybFV0aWxzIH0gZnJvbSBcIi4vdXJsVXRpbHMuanNcIjtcblxuZXhwb3J0IGNsYXNzIFVybEJ1aWxkZXIge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucHJvdG9jb2wgPSBudWxsO1xuICAgICAgICB0aGlzLmhvc3QgPSBudWxsO1xuICAgICAgICB0aGlzLnBvcnQgPSBudWxsO1xuICAgICAgICB0aGlzLnBhdGhzTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyc01hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5hbmNob3IgPSBudWxsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHN0YXRpYyBidWlsZGVyKCkge1xuICAgICAgICByZXR1cm4gbmV3IFVybEJ1aWxkZXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgICB3aXRoVXJsKHVybCkge1xuICAgICAgICB0aGlzLndpdGhBbGxPZlVybChVcmxVdGlscy5wYXJzZSh1cmwpKVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgICB3aXRoUm9vdE9mVXJsKHVybCkge1xuICAgICAgICB0aGlzLnByb3RvY29sID0gdXJsLnByb3RvY29sO1xuICAgICAgICB0aGlzLnBvcnQgPSB1cmwucG9ydDtcbiAgICAgICAgdGhpcy5ob3N0ID0gdXJsLmhvc3Q7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMge1VybEJ1aWxkZXJ9XG4gICAgICovXG4gICAgIHdpdGhQYXRoT2ZVcmwodXJsKSB7XG4gICAgICAgIHRoaXMud2l0aFJvb3RPZlVybCh1cmwpO1xuICAgICAgICB0aGlzLnBhdGhzTGlzdCA9IHVybC5wYXRoc0xpc3Q7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMge1VybEJ1aWxkZXJ9XG4gICAgICovXG4gICAgd2l0aEFsbE9mVXJsKHVybCkge1xuICAgICAgICB0aGlzLndpdGhQYXRoT2ZVcmwodXJsKTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzTWFwID0gdXJsLnBhcmFtZXRlck1hcDtcbiAgICAgICAgdGhpcy5ib29rbWFyayA9IHVybC5ib29rbWFyaztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHByb3RvY29sIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhQcm90b2NvbChwcm90b2NvbCkge1xuICAgICAgICB0aGlzLnByb3RvY29sID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aCh7IFwic3RyaW5nXCIgOiBwcm90b2NvbCB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGhvc3QgXG4gICAgICogQHJldHVybnMge1VybEJ1aWxkZXJ9XG4gICAgICovXG4gICAgd2l0aEhvc3QoaG9zdCkge1xuICAgICAgICB0aGlzLmhvc3QgPSBVcmxVdGlscy5kZXRlcm1pbmVQYXRoKHsgXCJzdHJpbmdcIiA6IGhvc3QgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhQYXRoKHBhdGgpIHtcbiAgICAgICAgdGhpcy5wYXRoc0xpc3QgPSBVcmxVdGlscy5kZXRlcm1pbmVQYXRoKHsgXCJzdHJpbmdcIiA6IHBhdGggfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbWV0ZXJzIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhQYXJhbWV0ZXJzKHBhcmFtZXRlcnMpIHtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzTWFwID0gVXJsVXRpbHMuZGV0ZXJtaW5lUGF0aCh7IFwic3RyaW5nXCIgOiBwYXJhbWV0ZXJzIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYW5jaG9yIFxuICAgICAqIEByZXR1cm5zIHtVcmxCdWlsZGVyfVxuICAgICAqL1xuICAgIHdpdGhBbmNob3IoYW5jaG9yKSB7XG4gICAgICAgIHRoaXMuYW5jaG9yID0gVXJsVXRpbHMuZGV0ZXJtaW5lQm9va21hcmsoeyBcInN0cmluZ1wiIDogYW5jaG9yIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBidWlsZCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVcmwodGhpcy5wcm90b2NvbCwgdGhpcy5ob3N0LCB0aGlzLnBvcnQsIHRoaXMucGF0aHNMaXN0LCB0aGlzLnBhcmFtZXRlcnNNYXAsIHRoaXMuYW5jaG9yKTtcbiAgICB9XG59IiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xuXG5jb25zdCBQQVNTV09SRF9GT1JNQVQgPSAvXig/PS4qW0EtWmEtel0pKD89Lio/WzAtOV0pKD89Lio/WyM/IUAkJV4mKi1dKS57OCx9JC87XG5cbmV4cG9ydCBjbGFzcyBQYXNzd29yZFZhbGlkYXRvciBleHRlbmRzIFJlZ2V4VmFsaWRhdG9yIHtcblxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UpIHtcbiAgICAgICAgc3VwZXIobWFuZGF0b3J5LCBpc2N1cnJlbnRseVZhbGlkLCBQQVNTV09SRF9GT1JNQVQpO1xuICAgIH1cblxufSIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcblxuZXhwb3J0IGNsYXNzIFBob25lVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xuXG4gICAgc3RhdGljIFBIT05FX0ZPUk1BVCA9IC9eXFwrWzAtOV17Mn1cXHM/KFswLTldXFxzPykqJC87XG5cbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgUGhvbmVWYWxpZGF0b3IuUEhPTkVfRk9STUFUKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBSZXF1aXJlZFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcblxuXHRjb25zdHJ1Y3RvcihjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBlbmFibGVkID0gdHJ1ZSkge1xuXHRcdHN1cGVyKGN1cnJlbnRseVZhbGlkLCBlbmFibGVkKTtcblx0fVxuXG5cdHZhbGlkYXRlKHZhbHVlKXtcblx0XHRpZih2YWx1ZSA9PT0gXCJcIil7XG5cdCAgICBcdHRoaXMuaW52YWxpZCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnZhbGlkKCk7XG5cdFx0fVxuXHR9XG5cblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xuXHRcdGlmKHZhbHVlID09PSBcIlwiKXtcblx0ICAgIFx0dGhpcy5pbnZhbGlkU2lsZW50KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudmFsaWRTaWxlbnQoKTtcblx0XHR9XG5cdH1cblxufVxuIiwiZXhwb3J0IGNsYXNzIE1vZHVsZVJ1bm5lciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgICBydW5Nb2R1bGUodXJsKSB7XG4gICAgIH1cblxufSIsImltcG9ydCB7IENvbnRhaW5lclVybCB9IGZyb20gXCJjb250YWluZXJicmlkZ2VfdjFcIjtcbmltcG9ydCB7IFVybFV0aWxzIH0gZnJvbSBcIi4uL3V0aWwvdXJsVXRpbHMuanNcIjtcblxuZXhwb3J0IGNsYXNzIEhpc3Rvcnkge1xuXG4gICAgc3RhdGljIHJlcGxhY2VVcmwodXJsLCB0aXRsZSwgc3RhdGVPYmplY3QpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLnJlcGxhY2VVcmwodXJsLnRvU3RyaW5nKCksIHRpdGxlLCBzdGF0ZU9iamVjdCk7XG4gICAgfVxuXG4gICAgc3RhdGljIHB1c2hVcmwodXJsLCB0aXRsZSwgc3RhdGVPYmplY3QpIHtcbiAgICAgICAgQ29udGFpbmVyVXJsLnB1c2hVcmwodXJsLnRvU3RyaW5nKCksIHRpdGxlLCBzdGF0ZU9iamVjdCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGN1cnJlbnRVcmwoKSB7XG4gICAgICAgIHJldHVybiBVcmxVdGlscy5wYXJzZShDb250YWluZXJVcmwuY3VycmVudFVybCgpKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBIaXN0b3J5IH0gZnJvbSBcIi4vaGlzdG9yeS5qc1wiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4uL3V0aWwvdXJsLmpzXCI7XG5pbXBvcnQgeyBDb250YWluZXJVcmwgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBVcmxCdWlsZGVyIH0gZnJvbSBcIi4uL3V0aWwvdXJsQnVpbGRlci5qc1wiO1xuXG5sZXQgbmF2aWdhdG9pb24gPSBudWxsO1xuXG5leHBvcnQgY2xhc3MgTmF2aWdhdGlvbiB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtOYXZpZ2F0aW9ufVxuICAgICAqL1xuICAgIHN0YXRpYyBpbnN0YW5jZSgpIHtcbiAgICAgICAgaWYgKCFuYXZpZ2F0b2lvbikge1xuICAgICAgICAgICAgbmF2aWdhdG9pb24gPSBuZXcgTmF2aWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYXZpZ2F0b2lvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOYXZpZ2F0ZSBicm93c2VyIHRvIG5ldyB1cmxcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGdvKHVybCkge1xuICAgICAgICBDb250YWluZXJVcmwuZ28odXJsLnRvU3RyaW5nKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5hdmlnYXRlIGJyb3dzZXIgYmFja1xuICAgICAqL1xuICAgIGJhY2soKSB7XG4gICAgICAgIENvbnRhaW5lclVybC5iYWNrKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9hZCBwYXRoIHdpdGhvdXQgcmVuYXZpZ2F0aW5nIGJyb3dzZXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICAgICAqIEByZXR1cm5zIHtVcmx9XG4gICAgICovXG4gICAgbG9hZFBhdGgocGF0aCkge1xuICAgICAgICBjb25zdCB1cmwgPSBIaXN0b3J5LmN1cnJlbnRVcmwoKTtcbiAgICAgICAgY29uc3QgbmV3VXJsID0gVXJsQnVpbGRlci5idWlsZGVyKCkud2l0aFJvb3RPZlVybCh1cmwpLndpdGhQYXRoKHBhdGgpLmJ1aWxkKCk7XG4gICAgICAgIEhpc3RvcnkucHVzaFVybChuZXdVcmwpO1xuICAgICAgICByZXR1cm4gbmV3VXJsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExvYWQgYW5jaG9yIHdpdGhvdXQgcmVuYXZpZ2F0aW5nIGJyb3dzZXJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYW5jaG9yXG4gICAgICogQHJldHVybnMge1VybH1cbiAgICAgKi9cbiAgICBsb2FkQW5jaG9yKGFuY2hvcikge1xuICAgICAgICBjb25zdCB1cmwgPSBIaXN0b3J5LmN1cnJlbnRVcmwoKTtcbiAgICAgICAgY29uc3QgbmV3VXJsID0gVXJsQnVpbGRlci5idWlsZGVyKCkud2l0aFJvb3RPZlVybCh1cmwpLndpdGhBbmNob3IoYW5jaG9yKS5idWlsZCgpO1xuICAgICAgICBIaXN0b3J5LnB1c2hVcmwobmV3VXJsKTtcbiAgICAgICAgcmV0dXJuIG5ld1VybDtcbiAgICB9XG5cbn0iLCJleHBvcnQgY2xhc3MgVHJhaWxOb2RlIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cbiAgICAgICAgdGhpcy5yb290ID0gZmFsc2U7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMudHJhaWwgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7cHJvcGVydHl9ICovXG4gICAgICAgIHRoaXMucHJvcGVydHkgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7ZnVuY3Rpb259ICovXG4gICAgICAgIHRoaXMud2F5cG9pbnQgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7ZnVuY3Rpb259ICovXG4gICAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7QXJyYXk8VHJhaWxOb2RlPn0gKi9cbiAgICAgICAgdGhpcy5uZXh0ID0gbnVsbDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBNb2R1bGVSdW5uZXIgfSBmcm9tIFwiLi9tb2R1bGVSdW5uZXIuanNcIjtcbmltcG9ydCB7IE5hdmlnYXRpb24gfSBmcm9tIFwiLi9uYXZpZ2F0aW9uL25hdmlnYXRpb24uanNcIjtcbmltcG9ydCB7IFRyYWlsTm9kZSB9IGZyb20gXCIuL25hdmlnYXRpb24vdHJhaWxOb2RlLmpzXCI7XG5cbmxldCBhY3RpdmVNb2R1bGVSdW5uZXIgPSBudWxsO1xuXG5leHBvcnQgY2xhc3MgQWN0aXZlTW9kdWxlUnVubmVyIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TW9kdWxlUnVubmVyfSAqL1xuICAgICAgICB0aGlzLm1vZHVsZVJ1bm5lciA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge0FjdGl2ZU1vZHVsZVJ1bm5lcn1cbiAgICAgKi9cbiAgICBzdGF0aWMgaW5zdGFuY2UoKSB7XG4gICAgICAgIGlmICghYWN0aXZlTW9kdWxlUnVubmVyKSB7XG4gICAgICAgICAgICBhY3RpdmVNb2R1bGVSdW5uZXIgPSBuZXcgQWN0aXZlTW9kdWxlUnVubmVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGl2ZU1vZHVsZVJ1bm5lcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01vZHVsZVJ1bm5lcn0gbmV3TW9kdWxlUnVubmVyIFxuICAgICAqL1xuICAgIHNldChuZXdNb2R1bGVSdW5uZXIpIHtcbiAgICAgICAgdGhpcy5tb2R1bGVSdW5uZXIgPSBuZXdNb2R1bGVSdW5uZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTG9hZCBhbmNob3Igd2l0aG91dCByZW5hdmlnYXRpbmcgYnJvd3NlclxuICAgICAqIEBwYXJhbSB7VHJhaWxOb2RlfSB0cmFpbE5vZGUgXG4gICAgICovXG4gICAgIGFzeW5jIGxvYWQodHJhaWxOb2RlKSB7XG4gICAgICAgIGNvbnN0IHVybCA9IE5hdmlnYXRpb24uaW5zdGFuY2UoKS5sb2FkQW5jaG9yKHRyYWlsTm9kZS50cmFpbCk7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm1vZHVsZVJ1bm5lci5ydW5Nb2R1bGUodXJsKTtcbiAgICB9XG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBMb2dnZXIsIE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuaW1wb3J0IHsgVXJsVXRpbHMgfSBmcm9tIFwiLi4vdXRpbC91cmxVdGlscy5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzaGVldCB9IGZyb20gXCIuL3N0eWxlc2hlZXQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlN0eWxlc1JlZ2lzdHJ5XCIpO1xuXG5leHBvcnQgY2xhc3MgU3R5bGVzUmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzTWFwID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xuICAgICAgICB0aGlzLnN0eWxlc1VybE1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge2ludGVnZXJ9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzUXVldWVTaXplID0gMDtcblxuICAgICAgICAvKiogQHR5cGUge01ldGhvZH0gKi9cbiAgICAgICAgdGhpcy5jYWxsYmFjayA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtTdHlsZXN9IHN0eWxlcyBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIHNldChuYW1lLCBzdHlsZXMsIHVybCl7XG4gICAgICAgIGlmKHVybCAhPT0gdW5kZWZpbmVkICYmIHVybCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5zdHlsZXNVcmxNYXAuc2V0KG5hbWUsIHVybCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdHlsZXNNYXAuc2V0KG5hbWUsIHN0eWxlcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICovXG4gICAgZ2V0KG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNNYXAuZ2V0KG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqL1xuICAgIGNvbnRhaW5zKG5hbWUpe1xuICAgICAgICBpZiAodGhpcy5zdHlsZXNNYXAuZ2V0KG5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNZXRob2R9IGNhbGxiYWNrIFxuICAgICAqL1xuICAgIGRvbmUoY2FsbGJhY2spe1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0eWxlc1JlZ2lzdHJ5fSByZWdpc3RyeSBcbiAgICAgKi9cbiAgICBkb0NhbGxiYWNrKHJlZ2lzdHJ5KXtcbiAgICAgICAgaWYocmVnaXN0cnkuY2FsbGJhY2sgIT09IG51bGwgJiYgcmVnaXN0cnkuY2FsbGJhY2sgIT09IHVuZGVmaW5lZCAgJiYgcmVnaXN0cnkuc3R5bGVzUXVldWVTaXplID09PSByZWdpc3RyeS5zdHlsZXNNYXAuZW50cmllcy5sZW5ndGgpe1xuICAgICAgICAgICAgdmFyIHRlbXBDYWxsYmFjayA9IHJlZ2lzdHJ5LmNhbGxiYWNrO1xuICAgICAgICAgICAgcmVnaXN0cnkuY2FsbGJhY2sgPSBudWxsO1xuICAgICAgICAgICAgdGVtcENhbGxiYWNrLmNhbGwoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgIGFzeW5jIGxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIHRoaXMuc3R5bGVzUXVldWVTaXplICsrO1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IENsaWVudC5nZXQodXJsKTtcbiAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcbiAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgc3R5bGVzIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICB0aGlzLnNldChuYW1lLCBuZXcgU3R5bGVzaGVldCh0ZXh0KSwgdXJsKTtcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge01hcDxzdHJpbmcsIHN0cmluZz59IG5hbWVVcmxNYXAgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgZ2V0U3R5bGVzTG9hZGVkUHJvbWlzZShuYW1lVXJsTWFwKSB7XG4gICAgICAgIFxuICAgICAgICBpZighbmFtZVVybE1hcCB8fCBuYW1lVXJsTWFwLnNpemUgPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGxvYWRQcm9taXNlcyA9IFtdO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzO1xuICAgICAgICBuYW1lVXJsTWFwLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgIGlmIChwYXJlbnQuY29udGFpbnMoa2V5KSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxvYWRQcm9taXNlcy5wdXNoKHBhcmVudC5wcml2YXRlTG9hZChrZXksIFVybFV0aWxzLnBhcnNlKHZhbHVlKSkpO1xuICAgICAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwobG9hZFByb21pc2VzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIGFzeW5jIHByaXZhdGVMb2FkKG5hbWUsIHVybCkge1xuICAgICAgICBMT0cuaW5mbyhcIkxvYWRpbmcgc3R5bGVzIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsLnRvU3RyaW5nKCkpO1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgQ2xpZW50LmdldCh1cmwpO1xuICAgICAgICBpZighcmVzcG9uc2Uub2spe1xuICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCBzdHlsZXMgZm9yIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGNvbnN0IHN0eWxlcyA9IG5ldyBTdHlsZXNoZWV0KHRleHQpO1xuICAgICAgICB0aGlzLnNldChuYW1lLCBzdHlsZXMsIHVybCk7XG4gICAgICAgIHJldHVybiBzdHlsZXM7XG4gICAgfVxufSIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi9zdHlsZXNSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgVHlwZUNvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiU3R5bGVzTG9hZGVyXCIpO1xuXG4vKipcbiAqIFRvIGJlIGFkZGVkIHRvIG1pbmRpIGFzIGEgc2luZ2xldG9uLiBXaWxsIHNjYW4gdGhyb3VnaCBhbGwgY29uZmlndXJlZCBjbGFzc2VzIHRoYXQgaGF2ZSBhIFNUWUxFU19VUkxcbiAqIHN0YXRpYyBnZXR0ZXIgYW5kIHdpbGwgYXN5bmNyb25vdXNseSBsb2FkIHRoZW0uIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gYWxsIHN0eWxlcyBhcmUgbG9hZGVkXG4gKi9cbmV4cG9ydCBjbGFzcyBTdHlsZXNMb2FkZXIge1xuXG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0eWxlc1JlZ2lzdHJ5fSBzdHlsZXNSZWdpc3RyeSBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihzdHlsZXNSZWdpc3RyeSkge1xuICAgICAgICB0aGlzLnN0eWxlc1JlZ2lzdHJ5ID0gc3R5bGVzUmVnaXN0cnk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtNYXA8U3RyaW5nLCBUeXBlQ29uZmlnPn0gY29uZmlnRW50cmllc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGxvYWQoY29uZmlnRW50cmllcykge1xuICAgICAgICBjb25zdCBzdHlsZXNNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIGNvbmZpZ0VudHJpZXMuZm9yRWFjaCgoY29uZmlnRW50cnksIGtleSkgPT4ge1xuICAgICAgICAgICAgaWYoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuU1RZTEVTX1VSTCkge1xuICAgICAgICAgICAgICAgIHN0eWxlc01hcC5zZXQoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UubmFtZSwgY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuU1RZTEVTX1VSTCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7IFxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNSZWdpc3RyeS5nZXRTdHlsZXNMb2FkZWRQcm9taXNlKHN0eWxlc01hcCk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb25maWcsIEluamVjdGlvblBvaW50LCBUeXBlQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgVGVtcGxhdGVzTG9hZGVyIH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzTG9hZGVyIH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNMb2FkZXIuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbXBvbmVudENvbmZpZ1Byb2Nlc3NvclwiKVxuXG4vKipcbiAqIE1pbmRpIGNvbmZpZyBwcm9jZXNzb3Igd2hpY2ggbG9hZHMgYWxsIHRlbXBsYXRlcyBhbmQgc3R5bGVzIGZvciBhbGwgY29uZmlndXJlZCBjb21wb25lbnRzXG4gKiBhbmQgdGhlbiBjYWxscyBhbnkgZXhpc3RpbmcgY29tcG9uZW50TG9hZGVkIGZ1bmN0aW9uIG9uIGVhY2ggY29tcG9uZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRDb25maWdQcm9jZXNzb3Ige1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtUZW1wbGF0ZVJlZ2lzdHJ5fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoVGVtcGxhdGVSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtTdHlsZXNSZWdpc3RyeX1cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKi9cbiAgICBwb3N0Q29uZmlnKCl7XG4gICAgICAgIHRoaXMudGVtcGxhdGVzTG9hZGVyID0gbmV3IFRlbXBsYXRlc0xvYWRlcih0aGlzLnRlbXBsYXRlUmVnaXN0cnkpO1xuICAgICAgICB0aGlzLnN0eWxlc0xvYWRlciA9IG5ldyBTdHlsZXNMb2FkZXIodGhpcy5zdHlsZXNSZWdpc3RyeSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtDb25maWd9IGNvbmZpZ1xuICAgICAqIEBwYXJhbSB7TWFwPHN0cmluZywgVHlwZUNvbmZpZz59IHVuY29uZmlndXJlZENvbmZpZ0VudHJpZXNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBwcm9jZXNzQ29uZmlnKGNvbmZpZywgdW5jb25maWd1cmVkQ29uZmlnRW50cmllcykge1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgICAgIFsgXG4gICAgICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZXNMb2FkZXIubG9hZCh1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSwgXG4gICAgICAgICAgICAgICAgdGhpcy5zdHlsZXNMb2FkZXIubG9hZCh1bmNvbmZpZ3VyZWRDb25maWdFbnRyaWVzKSBcbiAgICAgICAgICAgIF1cbiAgICAgICAgKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiTG9hZGVySW50ZXJjZXB0b3JcIik7XG5cbmV4cG9ydCBjbGFzcyBMb2FkZXJJbnRlcmNlcHRvciB7XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBwcm9jZXNzKCkge1xuICAgICAgICBMT0cuaW5mbyhcIlVuaW1wbGVtZW50ZWQgTG9hZGVyIEludGVyY2VwdG9yIGJyZWFrcyBieSBkZWZhdWx0XCIpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTG9nZ2VyLCBTdHJpbmdVdGlscyB9IGZyb20gXCJjb3JldXRpbF92MVwiXG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcbmltcG9ydCB7IExvYWRlckludGVyY2VwdG9yIH0gZnJvbSBcIi4vbG9hZGVySW50ZXJjZXB0b3IuanNcIlxuaW1wb3J0IHsgVHJhaWxOb2RlIH0gZnJvbSBcIi4uL25hdmlnYXRpb24vdHJhaWxOb2RlLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJNb2R1bGVMb2FkZXJcIik7XG5cbmV4cG9ydCBjbGFzcyBNb2R1bGVMb2FkZXIge1xuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG1vZHVsZVBhdGggXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRyYWlsTWFwIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8TG9hZGVySW50ZXJjZXB0b3I+fSBsb2FkZXJJbnRlcmNlcHRvcnNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGVQYXRoLCB0cmFpbE1hcCwgbG9hZGVySW50ZXJjZXB0b3JzID0gW10pIHtcbiAgICBcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLm1vZHVsZVBhdGggPSBtb2R1bGVQYXRoO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7VHJhaWxOb2RlfVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy50cmFpbE1hcCA9IHRyYWlsTWFwO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7QXJyYXk8TG9hZGVySW50ZXJjZXB0b3I+fVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5sb2FkZXJJbnRlcmNlcHRvcnMgPSBsb2FkZXJJbnRlcmNlcHRvcnM7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYXRjaGVzIGlmIHRoZSBjb25maWd1cmVkIG1hdGNoVXJsIHN0YXJ0cyB3aXRoIHRoZSBwcm92aWRlZCB1cmwgb3JcbiAgICAgKiBpZiB0aGUgY29uZmlndXJlZCBtYXRjaFVybCBpcyBudWxsXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBtYXRjaGVzKHVybCl7XG4gICAgICAgIGlmICghdGhpcy50cmFpbE1hcCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihcIlVybCBpcyBudWxsXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdXJsLmFuY2hvcikge1xuICAgICAgICAgICAgaWYgKHRoaXMudHJhaWxNYXAucm9vdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTdHJpbmdVdGlscy5zdGFydHNXaXRoKHVybC5hbmNob3IgKyBcIi9cIiwgdGhpcy50cmFpbE1hcC50cmFpbCArIFwiL1wiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxNYWluPn1cbiAgICAgKi9cbiAgICBhc3luYyBsb2FkKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gYXdhaXQgdGhpcy5pbXBvcnRNb2R1bGUoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW50ZXJjZXB0b3JzUGFzcygpO1xuICAgICAgICAgICAgcmV0dXJuIG1vZHVsZTtcbiAgICAgICAgfSBjYXRjaChyZWFzb24pIHtcbiAgICAgICAgICAgIExPRy53YXJuKFwiRmlsdGVyIHJlamVjdGVkIFwiICsgcmVhc29uKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAgICovXG4gICAgaW50ZXJjZXB0b3JzUGFzcygpIHtcbiAgICAgICAgY29uc3QgaW50ZXJjZXB0b3JzID0gdGhpcy5sb2FkZXJJbnRlcmNlcHRvcnM7XG4gICAgICAgIGlmIChpbnRlcmNlcHRvcnMgJiYgaW50ZXJjZXB0b3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGxldCBpbnRlcmNlcHRvclByb21pc2VDaGFpbiA9IGludGVyY2VwdG9yc1swXS5wcm9jZXNzKCk7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGludGVyY2VwdG9ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGludGVyY2VwdG9yUHJvbWlzZUNoYWluID0gaW50ZXJjZXB0b3JQcm9taXNlQ2hhaW4udGhlbihpbnRlcmNlcHRvcnNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGludGVyY2VwdG9yUHJvbWlzZUNoYWluO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICBhc3luYyBpbXBvcnRNb2R1bGUoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBtb2R1bGUgPSBhd2FpdCBpbXBvcnQodGhpcy5tb2R1bGVQYXRoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbW9kdWxlLmRlZmF1bHQoKTtcbiAgICAgICAgfSBjYXRjaChyZWFzb24pICB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBUcmFpbE5vZGUgfSBmcm9tIFwiLi9uYXZpZ2F0aW9uL3RyYWlsTm9kZVwiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4vdXRpbC91cmxcIjtcblxuZXhwb3J0IGNsYXNzIE1vZHVsZSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICAvKiogQHR5cGUge1VybH0gKi9cbiAgICAgICAgdGhpcy51cmwgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7VHJhaWxOb2RlfSAqL1xuICAgICAgICB0aGlzLnRyYWlsTWFwID0gbnVsbDtcbiAgICB9XG5cbiAgICBhc3luYyBsb2FkKCkge1xuICAgICAgICB0aHJvdyBcIk1vZHVsZSBjbGFzcyBtdXN0IGltcGxlbWVudCBsb2FkKClcIjtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBBcnJheVV0aWxzLCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIlxuaW1wb3J0IHsgTWluZGlDb25maWcsIE1pbmRpSW5qZWN0b3IgfSBmcm9tIFwibWluZGlfdjFcIjtcbmltcG9ydCB7IE1vZHVsZUxvYWRlciB9IGZyb20gXCIuL21vZHVsZUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgTG9hZGVySW50ZXJjZXB0b3IgfSBmcm9tIFwiLi9sb2FkZXJJbnRlcmNlcHRvci5qc1wiXG5pbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vbW9kdWxlLmpzXCI7XG5cbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJEaU1vZHVsZUxvYWRlclwiKTtcblxuZXhwb3J0IGNsYXNzIERpTW9kdWxlTG9hZGVyIGV4dGVuZHMgTW9kdWxlTG9hZGVyIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtb2R1bGVQYXRoIFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0cmFpbE1hcCBcbiAgICAgKiBAcGFyYW0ge01pbmRpQ29uZmlnfSBjb25maWdcbiAgICAgKiBAcGFyYW0ge0FycmF5PExvYWRlckludGVyY2VwdG9yPn0gbG9hZGVySW50ZXJjZXB0b3JzXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobW9kdWxlUGF0aCwgdHJhaWxNYXAsIGNvbmZpZywgbG9hZGVySW50ZXJjZXB0b3JzID0gW10pIHtcbiAgICAgICAgc3VwZXIobW9kdWxlUGF0aCwgdHJhaWxNYXAsIGxvYWRlckludGVyY2VwdG9ycyk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNaW5kaUNvbmZpZ30gKi9cbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1Byb21pc2U8TW9kdWxlPn1cbiAgICAgKi9cbiAgICBhc3luYyBsb2FkKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlID0gYXdhaXQgdGhpcy5pbXBvcnRNb2R1bGUoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW50ZXJjZXB0b3JzUGFzcygpO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IE1pbmRpSW5qZWN0b3IuaW5qZWN0KG1vZHVsZSwgdGhpcy5jb25maWcpO1xuICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgTE9HLndhcm4oXCJNb2R1bGUgbG9hZGVyIGZhaWxlZCBcIiArIHJlYXNvbik7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TW9kdWxlTG9hZGVyfSBtb2R1bGVMb2FkZXJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBhc3luYyBpbXBvcnRNb2R1bGUoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBtb2R1bGUgPSBhd2FpdCBzdXBlci5pbXBvcnRNb2R1bGUoKTtcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLmFkZEFsbFR5cGVDb25maWcobW9kdWxlLnR5cGVDb25maWdBcnJheSk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNvbmZpZy5maW5hbGl6ZSgpO1xuICAgICAgICAgICAgY29uc3Qgd29ya2luZ0NvbmZpZyA9IHRoaXMuY29uZmlnO1xuICAgICAgICAgICAgYXdhaXQgQXJyYXlVdGlscy5wcm9taXNlQ2hhaW4odGhpcy5sb2FkZXJJbnRlcmNlcHRvcnMsIChsb2FkZXJJbnRlcmNlcHRvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBNaW5kaUluamVjdG9yLmluamVjdChsb2FkZXJJbnRlcmNlcHRvciwgd29ya2luZ0NvbmZpZyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBtb2R1bGU7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxufSIsImltcG9ydCB7IE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG4vKipcbiAqIFN0YXRlTWFuYWdlclxuICogXG4gKiBAdGVtcGxhdGUgVFxuICovXG5leHBvcnQgY2xhc3MgU3RhdGVNYW5hZ2VyIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvKiogQHR5cGUge01hcDxTdHJpbmcsIFQ+fSAqL1xuICAgICAgICB0aGlzLm9iamVjdE1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge01hcDxTdHJpbmcsIEFycmF5PE1ldGhvZD59ICovXG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWV0aG9kfSBsaXN0ZW5lciBcbiAgICAgKi9cbiAgICByZWFjdChsaXN0ZW5lcikge1xuICAgICAgICBjb25zdCBhbnlLZXkgPSBcIl9fQU5ZX19cIjtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5oYXMoYW55S2V5KSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc2V0KGFueUtleSwgbmV3IEFycmF5KCkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChhbnlLZXkpLnB1c2gobGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgXG4gICAgICogQHBhcmFtIHtNZXRob2R9IGxpc3RlbmVyIFxuICAgICAqL1xuICAgIHJlYWN0VG8oa2V5LCBsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMubGlzdGVuZXJzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zZXQoa2V5LCBuZXcgQXJyYXkoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuZ2V0KGtleSkucHVzaChsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgZ2V0IG9iamVjdEFycmF5KCkge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLm9iamVjdE1hcC52YWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIHRoZSBzdGF0ZVxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgXG4gICAgICogQHBhcmFtIHtUfSBvYmplY3QgXG4gICAgICovXG4gICAgYXN5bmMgdXBkYXRlKG9iamVjdCwga2V5ID0gXCJfX0RFRkFVTFRfX1wiKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0W2ldID0gdGhpcy5jcmVhdGVQcm94eShvYmplY3RbaV0sIGtleSwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb2JqZWN0ID0gdGhpcy5jcmVhdGVQcm94eShvYmplY3QsIGtleSwgdGhpcyk7XG4gICAgICAgIHRoaXMub2JqZWN0TWFwLnNldChrZXksIG9iamVjdCk7XG4gICAgICAgIHRoaXMuc2lnbmFsU3RhdGVDaGFuZ2Uob2JqZWN0LCBrZXkpO1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cblxuICAgIGFzeW5jIGRlbGV0ZShrZXkgPSBcIl9fREVGQVVMVF9fXCIpIHtcbiAgICAgICAgdGhpcy5vYmplY3RNYXAuZGVsZXRlKGtleSk7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShrZXkpO1xuICAgICAgICB0aGlzLnNpZ25hbFN0YXRlQ2hhbmdlKG51bGwsIGtleSk7XG4gICAgfVxuXG4gICAgYXN5bmMgY2xlYXIoKSB7XG4gICAgICAgIGZvciAobGV0IGtleSBvZiB0aGlzLm9iamVjdE1hcC5rZXlzKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2lnbmFsU3RhdGVDaGFuZ2UobnVsbCwga2V5KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNpZ25hbFN0YXRlQ2hhbmdlKG51bGwsIFwiX19BTllfX1wiKTtcbiAgICAgICAgdGhpcy5vYmplY3RNYXAuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBzaWduYWxTdGF0ZUNoYW5nZShvYmplY3QsIGtleSkge1xuICAgICAgICBpZiAodGhpcy5saXN0ZW5lcnMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLmdldChrZXkpKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuY2FsbChbb2JqZWN0LCBrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGFueUtleSA9IFwiX19BTllfX1wiO1xuICAgICAgICBpZiAoa2V5ICE9IGFueUtleSAmJiB0aGlzLmxpc3RlbmVycy5oYXMoYW55S2V5KSkge1xuICAgICAgICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuZ2V0KGFueUtleSkpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5jYWxsKFtvYmplY3QsIGtleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY3JlYXRlUHJveHkob2JqZWN0LCBrZXksIHN0YXRlTWFuYWdlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb3h5KG9iamVjdCwge1xuICAgICAgICAgICAgc2V0OiAodGFyZ2V0LCBwcm9wLCB2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRbcHJvcF0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gKHRhcmdldFtwcm9wXSA9IHZhbHVlKTtcbiAgICAgICAgICAgICAgICBzdGF0ZU1hbmFnZXIuc2lnbmFsU3RhdGVDaGFuZ2UodGFyZ2V0LCBrZXkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzID09PSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBVbmlxdWVJZFJlZ2lzdHJ5IHtcblxuICAgIGlkQXR0cmlidXRlV2l0aFN1ZmZpeCAoaWQpIHtcbiAgICAgICAgaWYoaWROYW1lcy5jb250YWlucyhpZCkpIHtcbiAgICAgICAgICAgIHZhciBudW1iZXIgPSBpZE5hbWVzLmdldChpZCk7XG4gICAgICAgICAgICBpZE5hbWVzLnNldChpZCxudW1iZXIrMSk7XG4gICAgICAgICAgICByZXR1cm4gaWQgKyBcIi1cIiArIG51bWJlcjtcbiAgICAgICAgfVxuICAgICAgICBpZE5hbWVzLnNldChpZCwxKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxufVxuXG52YXIgaWROYW1lcyA9IG5ldyBNYXAoKTsiLCJleHBvcnQgY2xhc3MgQXR0cmlidXRlIHtcblxuICAgIGNvbnN0cnVjdG9yKGF0dHJpYnV0ZSkge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZSA9IGF0dHJpYnV0ZTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS52YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlLm5hbWU7XG4gICAgfVxuXG4gICAgZ2V0IG5hbWVzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlLm5hbWU7XG4gICAgfVxufSIsImltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBNYXAsIExvZ2dlciwgTGlzdCwgTWV0aG9kIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb250YWluZXJFbGVtZW50LCBDb250YWluZXJFbGVtZW50VXRpbHMsIENvbnRhaW5lclRleHQgfSBmcm9tIFwiY29udGFpbmVyYnJpZGdlX3YxXCI7XG5pbXBvcnQgeyBBdHRyaWJ1dGUgfSBmcm9tIFwiLi9hdHRyaWJ1dGUuanNcIjtcbmltcG9ydCB7IEVsZW1lbnRVdGlscyB9IGZyb20gXCIuLi91dGlsL2VsZW1lbnRVdGlscy5qc1wiO1xuaW1wb3J0IHsgTWFwcGVkQ29udGFpbmVyRWxlbWVudCB9IGZyb20gXCIuL21hcHBlZENvbnRhaW5lckVsZW1lbnQuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkJhc2VFbGVtZW50XCIpO1xuXG4vKipcbiAqIEEgYmFzZSBjbGFzcyBmb3IgZW5jbG9zaW5nIGFuIEhUTUxFbGVtZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBCYXNlRWxlbWVudCBleHRlbmRzIE1hcHBlZENvbnRhaW5lckVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudHxzdHJpbmd8YW55fSB2YWx1ZSBWYWx1ZSB0byBiZSBjb252ZXJ0ZWQgdG8gQ29udGFpbmVyIFVJIEVsZW1lbnQgKEhUTUxFbGVtZW50IGluIHRoZSBjYXNlIG9mIFdlYiBCcm93c2VyKVxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCB0aGUgcGFyZW50IEJhc2VFbGVtZW50XG4gICAgICovXG4gICAgY29uc3RydWN0b3IodmFsdWUsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihFbGVtZW50VXRpbHMuY3JlYXRlQ29udGFpbmVyRWxlbWVudCh2YWx1ZSwgcGFyZW50KSk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbnVsbDtcbiAgICAgICAgdGhpcy5ldmVudHNBdHRhY2hlZCA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgbG9hZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRhaW5lckVsZW1lbnQuYXR0cmlidXRlcyA9PT0gbnVsbCB8fCB0aGlzLmNvbnRhaW5lckVsZW1lbnQuYXR0cmlidXRlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmF0dHJpYnV0ZU1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5hdHRyaWJ1dGVNYXAgPT09IG51bGwgfHwgdGhpcy5hdHRyaWJ1dGVNYXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY29udGFpbmVyRWxlbWVudC5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAuc2V0KHRoaXMuY29udGFpbmVyRWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5hbWUsbmV3IEF0dHJpYnV0ZSh0aGlzLmNvbnRhaW5lckVsZW1lbnQuYXR0cmlidXRlc1tpXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSBcbiAgICAgKiBAcGFyYW0ge01ldGhvZH0gbGlzdGVuZXIgXG4gICAgICogQHBhcmFtIHtib29sZWFufSBjYXB0dXJlIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGxpc3RlblRvKGV2ZW50VHlwZSwgbGlzdGVuZXIsIGNhcHR1cmUpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBsaXN0ZW5lciwgY2FwdHVyZSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGdldCBmdWxsTmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWxlbWVudC50YWdOYW1lO1xuICAgIH1cblxuICAgIGdldCB0b3AoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lckVsZW1lbnQuYm91bmRpbmdDbGllbnRSZWN0LnRvcDtcbiAgICB9XG5cbiAgICBnZXQgYm90dG9tKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXJFbGVtZW50LmJvdW5kaW5nQ2xpZW50UmVjdC5ib3R0b207XG4gICAgfVxuXG4gICAgZ2V0IGxlZnQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lckVsZW1lbnQuYm91bmRpbmdDbGllbnRSZWN0LmxlZnQ7XG4gICAgfVxuXG4gICAgZ2V0IHJpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXJFbGVtZW50LmJvdW5kaW5nQ2xpZW50UmVjdC5yaWdodDtcbiAgICB9XG5cbiAgICBnZXQgd2lkdGgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lckVsZW1lbnQub2Zmc2V0V2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0IGhlaWdodCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWxlbWVudC5vZmZzZXRIZWlnaHQ7XG4gICAgfVxuXG4gICAgZ2V0IGF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHRoaXMubG9hZEF0dHJpYnV0ZXMoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlTWFwO1xuICAgIH1cblxuICAgIHNldEF0dHJpYnV0ZVZhbHVlKGtleSwgdmFsdWUpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudFV0aWxzLnNldEF0dHJpYnV0ZVZhbHVlKHRoaXMuY29udGFpbmVyRWxlbWVudCwga2V5LHZhbHVlKTtcbiAgICB9XG5cbiAgICBnZXRBdHRyaWJ1dGVWYWx1ZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckVsZW1lbnRVdGlscy5nZXRBdHRyaWJ1dGVWYWx1ZSh0aGlzLmNvbnRhaW5lckVsZW1lbnQsIGtleSk7XG4gICAgfVxuXG4gICAgY29udGFpbnNBdHRyaWJ1dGUoa2V5KSB7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lckVsZW1lbnQgPSB0aGlzLmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgICAgIHJldHVybiBjb250YWluZXJFbGVtZW50Lmhhc0F0dHJpYnV0ZShrZXkpO1xuICAgIH1cblxuICAgIHJlbW92ZUF0dHJpYnV0ZShrZXkpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgIH1cblxuICAgIHNldFN0eWxlKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LnN0eWxlW2tleV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXRTdHlsZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWxlbWVudC5zdHlsZVtrZXldO1xuICAgIH1cblxuICAgIHJlbW92ZVN0eWxlKGtleSkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuc3R5bGVba2V5XSA9IG51bGw7XG4gICAgfVxuXG4gICAgc2V0KGlucHV0KSB7XG4gICAgICAgIGlmKCF0aGlzLmNvbnRhaW5lckVsZW1lbnQucGFyZW50Tm9kZSl7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVGhlIGVsZW1lbnQgaGFzIG5vIHBhcmVudCwgY2FuIG5vdCBzd2FwIGl0IGZvciB2YWx1ZVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvKiogQHR5cGUge0NvbnRhaW5lckVsZW1lbnR9ICovXG4gICAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSB0aGlzLmNvbnRhaW5lckVsZW1lbnQucGFyZW50Tm9kZTtcblxuICAgICAgICBpZihpbnB1dC5jb250YWluZXJFbGVtZW50KSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dC5jb250YWluZXJFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgcGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQucm9vdEVsZW1lbnQuY29udGFpbmVyRWxlbWVudCwgdGhpcy5jb250YWluZXJFbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudCA9IGlucHV0LnJvb3RFbGVtZW50LmNvbnRhaW5lckVsZW1lbnQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKENvbnRhaW5lckVsZW1lbnRVdGlscy5jcmVhdGVUZXh0Tm9kZShpbnB1dCksIHRoaXMuY29udGFpbmVyRWxlbWVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoaW5wdXQgaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dCwgdGhpcy5jb250YWluZXJFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LCB0aGlzLmNvbnRhaW5lckVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIExPRy53YXJuKFwiTm8gdmFsaWQgaW5wdXQgdG8gc2V0IHRoZSBlbGVtZW50XCIpO1xuICAgICAgICBMT0cud2FybihpbnB1dCk7XG4gICAgfVxuXG4gICAgaXNNb3VudGVkKCkge1xuICAgICAgICBpZih0aGlzLmNvbnRhaW5lckVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29udGFpbmVyRWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICAvKiogQHR5cGUge0NvbnRhaW5lckVsZW1lbnR9ICovXG4gICAgICAgICAgICBjb25zdCBwYXJlbnROb2RlID0gdGhpcy5jb250YWluZXJFbGVtZW50LnBhcmVudE5vZGU7XG4gICAgICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuY29udGFpbmVyRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuY29udGFpbmVyRWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5jb250YWluZXJFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0Q2hpbGQoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKGlucHV0KTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQuY29udGFpbmVyRWxlbWVudCAhPT0gdW5kZWZpbmVkICYmIGlucHV0LmNvbnRhaW5lckVsZW1lbnQgIT09IG51bGwpe1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmFwcGVuZENoaWxkKGlucHV0LmNvbnRhaW5lckVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmFwcGVuZENoaWxkKGlucHV0LnJvb3RFbGVtZW50LmNvbnRhaW5lckVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmFwcGVuZENoaWxkKENvbnRhaW5lckVsZW1lbnRVdGlscy5jcmVhdGVUZXh0Tm9kZShpbnB1dCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyRWxlbWVudCA9IG5ldyBDb250YWluZXJFbGVtZW50KGlucHV0KTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5hcHBlbmRDaGlsZChjb250YWluZXJFbGVtZW50KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBMT0cud2FybihcIk5vIHZhbGlkIGlucHV0IHRvIGFkZCB0aGUgZWxlbWVudFwiKTtcbiAgICAgICAgTE9HLndhcm4oaW5wdXQpO1xuICAgIH1cblxuICAgIHByZXBlbmRDaGlsZChpbnB1dCkge1xuICAgICAgICBpZih0aGlzLmNvbnRhaW5lckVsZW1lbnQuZmlyc3RDaGlsZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LmNvbnRhaW5lckVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5jb250YWluZXJFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuaW5zZXJ0QmVmb3JlKGlucHV0LmNvbnRhaW5lckVsZW1lbnQsIHRoaXMuY29udGFpbmVyRWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQgJiYgaW5wdXQucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQucm9vdEVsZW1lbnQuY29udGFpbmVyRWxlbWVudCwgdGhpcy5jb250YWluZXJFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50Lmluc2VydEJlZm9yZShDb250YWluZXJFbGVtZW50VXRpbHMuY3JlYXRlVGV4dE5vZGUoaW5wdXQpLCB0aGlzLmNvbnRhaW5lckVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgQ29udGFpbmVyVGV4dCkge1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dCwgdGhpcy5jb250YWluZXJFbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5pbnNlcnRCZWZvcmUoaW5wdXQsIHRoaXMuY29udGFpbmVyRWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBMT0cud2FybihcIk5vIHZhbGlkIGlucHV0IHRvIHByZXBlbmQgdGhlIGVsZW1lbnRcIik7XG4gICAgICAgIExPRy53YXJuKGlucHV0KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnRcIjtcblxuLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb21wb25lbnRJbmRleCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSByb290RWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge01hcH0gZWxlbWVudE1hcCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb21wb25lbnRJbmRleCwgcm9vdEVsZW1lbnQsIGVsZW1lbnRNYXApIHtcbiAgICAgICAgdGhpcy5jb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGV4O1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAgPSBlbGVtZW50TWFwO1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKCkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50LnJlbW92ZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgZ2V0KGlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc2V0IChpZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuc2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBpZCBcbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgY2xlYXJDaGlsZHJlbihpZCl7XG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLmNsZWFyKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgc2V0Q2hpbGQgKGlkLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5zZXRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgYWRkQ2hpbGQgKGlkLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5hZGRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XG4gICAgICovXG4gICAgcHJlcGVuZENoaWxkIChpZCwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkucHJlcGVuZENoaWxkKHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQWJzdHJhY3RJbnB1dEVsZW1lbnRcIik7XG5cbi8qKlxuICogU2hhcmVkIHByb3BlcnRpZXMgb2YgaW5wdXQgZWxlbWVudHNcbiAqL1xuZXhwb3J0IGNsYXNzIEFic3RyYWN0SW5wdXRFbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIodmFsdWUsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWxlbWVudC5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmFsdWUgb2YgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldCBuYW1lKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5uYW1lID0gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmFsdWUgZ2l2ZW4gYW55IHByb2Nlc3NpbmcgcnVsZXNcbiAgICAgKi9cbiAgICBnZXQgdmFsdWUoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFja2luZ1ZhbHVlO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSl7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuZGlzcGF0Y2hFdmVudCgnY2hhbmdlJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgc291cmNlIHZhbHVlXG4gICAgICovXG4gICAgZ2V0IGJhY2tpbmdWYWx1ZSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXJFbGVtZW50LnZhbHVlO1xuICAgIH1cblxuICAgIGZvY3VzKCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuZm9jdXMoKTtcbiAgICB9XG5cbiAgICBzZWxlY3RBbGwoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5zZWxlY3QoKTtcbiAgICB9XG5cbiAgICBlbmFibGUoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIGRpc2FibGUoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5kaXNhYmxlZCA9IHRydWU7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgUmFkaW9JbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHNldCBjaGVja2VkKHZhbHVlKXtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmNoZWNrZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpc0NoZWNrZWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWxlbWVudC5jaGVja2VkO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDaGVja2VkKCk7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5jaGVja2VkID0gKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBcInRydWVcIik7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2hlY2tib3hJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHNldCBjaGVja2VkKHZhbHVlKXtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmNoZWNrZWQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBpc0NoZWNrZWQoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWxlbWVudC5jaGVja2VkO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDaGVja2VkKCk7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5jaGVja2VkID0gKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSBcInRydWVcIik7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0SW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dGFyZWFJbnB1dEVsZW1lbnQgZXh0ZW5kcyBBYnN0cmFjdElucHV0RWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIGdldCBpbm5lckhUTUwoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWxlbWVudC5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgc2V0IGlubmVySFRNTCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChpbnB1dCkge1xuICAgICAgICBzdXBlci5hZGRDaGlsZChpbnB1dCk7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBwcmVwZW5kQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgc3VwZXIucHJlcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuaW5uZXJIVE1MO1xuICAgIH1cblxufSIsImltcG9ydCB7IFhtbENkYXRhIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQ29udGFpbmVyRWxlbWVudCwgQ29udGFpbmVyRWxlbWVudFV0aWxzIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dG5vZGVFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbENkYXRhfSB2YWx1ZSBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodmFsdWUsIHBhcmVudCkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7Q29udGFpbmVyRWxlbWVudH0gKi9cbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICBpZih2YWx1ZSBpbnN0YW5jZW9mIFhtbENkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQgPSB0aGlzLmNyZWF0ZUZyb21YbWxDZGF0YSh2YWx1ZSwgcGFyZW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZih0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpe1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudFV0aWxzLmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7WG1sQ2RhdGF9IGNkYXRhRWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRFbGVtZW50IFxuICAgICAqL1xuICAgIGNyZWF0ZUZyb21YbWxDZGF0YShjZGF0YUVsZW1lbnQsIHBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnRVdGlscy5jcmVhdGVUZXh0Tm9kZShjZGF0YUVsZW1lbnQudmFsdWUpO1xuICAgICAgICBpZihwYXJlbnRFbGVtZW50ICE9PSBudWxsICYmIHBhcmVudEVsZW1lbnQuY29udGFpbmVyRWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyZW50RWxlbWVudC5jb250YWluZXJFbGVtZW50LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBTaW1wbGVFbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBnZXQgaW5uZXJIVE1MKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lckVsZW1lbnQuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIHNldCBpbm5lckhUTUwodmFsdWUpe1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5mb2N1cygpO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRm9ybUVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lckVsZW1lbnQubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQgbmFtZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQubmFtZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIHN1Ym1pdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWxlbWVudC5zdWJtaXQoKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFZpZGVvRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHZhbHVlIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyRWxlbWVudDtcbiAgICB9XG5cbiAgICBwbGF5TXV0ZWQoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5wbGF5TXV0ZWQoKTtcbiAgICB9XG5cbiAgICBwbGF5KCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQucGxheSgpO1xuICAgIH1cblxuICAgIG11dGUoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5tdXRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdW5tdXRlKCkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQubXV0ZWQgPSBmYWxzZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIE9wdGlvbkVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudCB7XG5cdC8qKlxuXHQgKiBDb25zdHJ1Y3RvclxuXHQgKlxuXHQgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG5cdCAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcblx0ICovXG5cdGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuXHRcdHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgICAgIHRoaXMub3B0aW9uTGFiZWwgPSBudWxsO1xuXHR9XG5cbiAgICBnZXQgdmFsdWUoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlVmFsdWUoXCJ2YWx1ZVwiKTtcbiAgICB9XG5cbiAgICBzZXQgdmFsdWUodmFsKXtcbiAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGVWYWx1ZShcInZhbHVlXCIsIHZhbCk7XG4gICAgfVxuXG4gICAgZ2V0IGxhYmVsKCl7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbkxhYmVsO1xuICAgIH1cblxuICAgIHNldCBsYWJlbCh2YWx1ZSl7XG4gICAgICAgIHRoaXMub3B0aW9uTGFiZWwgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5zZXRDaGlsZCh2YWx1ZSk7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgT3B0aW9uRWxlbWVudCB9IGZyb20gXCIuL29wdGlvbkVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFNlbGVjdEVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudCB7XG5cdC8qKlxuXHQgKiBDb25zdHJ1Y3RvclxuXHQgKlxuXHQgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG5cdCAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcblx0ICovXG5cdGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuXHRcdHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtBcnJheTxPcHRpb25FbGVtZW50Pn0gKi9cbiAgICAgICAgdGhpcy5vcHRpb25zQXJyYXkgPSBbXTtcblx0fVxuXG4gICAgLyoqXG4gICAgICogR2V0IG9wdGlvbnMgYXMgYXJyYXkgb2YgT3B0aW9uRWxlbWVudFxuICAgICAqIEByZXR1cm4ge0FycmF5PE9wdGlvbkVsZW1lbnQ+fVxuICAgICAqL1xuICAgIGdldCBvcHRpb25zKCl7XG4gICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnNBcnJheTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgb3B0aW9ucyBmcm9tIGFycmF5IG9mIE9wdGlvbkVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge0FycmF5PE9wdGlvbkVsZW1lbnQ+fSBvcHRpb25zQXJyYXlcbiAgICAgKi9cbiAgICBzZXQgb3B0aW9ucyhvcHRpb25zQXJyYXkpe1xuICAgICAgICB0aGlzLm9wdGlvbnNBcnJheSA9IG9wdGlvbnNBcnJheTtcbiAgICAgICAgdGhpcy5yZW5kZXJPcHRpb25zKCk7XG4gICAgfVxuXG4gICAgcmVuZGVyT3B0aW9ucygpe1xuICAgICAgICB3aGlsZSAodGhpcy5jb250YWluZXJFbGVtZW50LmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLmNvbnRhaW5lckVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCBvcHRpb24gb2YgdGhpcy5vcHRpb25zQXJyYXkpe1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmFwcGVuZENoaWxkKG9wdGlvbi5jb250YWluZXJFbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgdGhlIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lckVsZW1lbnQubmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHZhbHVlIG9mIGlucHV0cyBuYW1lXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQgbmFtZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmNvbnRhaW5lckVsZW1lbnQubmFtZSA9IHZhbHVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHZhbHVlIGdpdmVuIGFueSBwcm9jZXNzaW5nIHJ1bGVzXG4gICAgICovXG4gICAgZ2V0IHZhbHVlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmJhY2tpbmdWYWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzb3VyY2UgdmFsdWVcbiAgICAgKi9cbiAgICBnZXQgYmFja2luZ1ZhbHVlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lckVsZW1lbnQudmFsdWU7XG4gICAgfVxuXG4gICAgZm9jdXMoKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyRWxlbWVudC5mb2N1cygpO1xuICAgIH1cblxuICAgIHNlbGVjdEFsbCgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LnNlbGVjdCgpO1xuICAgIH1cblxuICAgIGVuYWJsZSgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZGlzYWJsZSgpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXJFbGVtZW50LmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZyb20gXCIuL2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBGaWxlSW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBhc3luYyBmb2N1cygpIHtcbiAgICAgICAgTE9HLldBUk4oXCJGaWxlIGlucHV0IGVsZW1lbnRzIGNhbm5vdCBiZSBmb2N1c2VkIGRpcmVjdGx5IGR1ZSB0byBicm93c2VyIHNlY3VyaXR5IHJlc3RyaWN0aW9ucy5cIik7XG4gICAgICAgIHRoaXMuZWxlbWVudC5mb2N1cygpO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQgeyBYbWxDZGF0YSxYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgUmFkaW9JbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9yYWRpb0lucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQ2hlY2tib3hJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi9jaGVja2JveElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgVGV4dElucHV0RWxlbWVudCB9IGZyb20gXCIuL3RleHRJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFRleHRhcmVhSW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vdGV4dGFyZWFJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFRleHRub2RlRWxlbWVudCB9IGZyb20gXCIuL3RleHRub2RlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgU2ltcGxlRWxlbWVudCB9IGZyb20gXCIuL3NpbXBsZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEZvcm1FbGVtZW50IH0gZnJvbSBcIi4vZm9ybUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFZpZGVvRWxlbWVudCB9IGZyb20gXCIuL3ZpZGVvRWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgT3B0aW9uRWxlbWVudCB9IGZyb20gXCIuL29wdGlvbkVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFNlbGVjdEVsZW1lbnQgfSBmcm9tIFwiLi9zZWxlY3RFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBGaWxlSW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vZmlsZUlucHV0RWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgRWxlbWVudE1hcHBlciB7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7YW55fSBpbnB1dCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgc3RhdGljIG1hcChpbnB1dCwgcGFyZW50KSB7XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1JhZGlvKGlucHV0KSl7ICAgICByZXR1cm4gbmV3IFJhZGlvSW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb0NoZWNrYm94KGlucHV0KSl7ICByZXR1cm4gbmV3IENoZWNrYm94SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1N1Ym1pdChpbnB1dCkpeyAgICByZXR1cm4gbmV3IFRleHRJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvRm9ybShpbnB1dCkpeyAgICAgIHJldHVybiBuZXcgRm9ybUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVGV4dGFyZWEoaW5wdXQpKXsgIHJldHVybiBuZXcgVGV4dGFyZWFJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvRmlsZShpbnB1dCkpeyAgICAgIHJldHVybiBuZXcgRmlsZUlucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0KGlucHV0KSl7ICAgICAgcmV0dXJuIG5ldyBUZXh0SW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1ZpZGVvKGlucHV0KSl7ICAgICByZXR1cm4gbmV3IFZpZGVvRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0bm9kZShpbnB1dCkpeyAgcmV0dXJuIG5ldyBUZXh0bm9kZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvT3B0aW9uKGlucHV0KSl7ICAgIHJldHVybiBuZXcgT3B0aW9uRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9TZWxlY3QoaW5wdXQpKXsgICAgcmV0dXJuIG5ldyBTZWxlY3RFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb1NpbXBsZShpbnB1dCkpeyAgICByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgY29uc29sZS5sb2coXCJNYXBwaW5nIHRvIHNpbXBsZSBieSBkZWZhdWx0IFwiICsgaW5wdXQpO1xuICAgICAgICByZXR1cm4gbmV3IFNpbXBsZUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1JhZGlvKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJyYWRpb1wiKSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInJhZGlvXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9DaGVja2JveChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwiY2hlY2tib3hcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJjaGVja2JveFwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvU3VibWl0KGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiYgaW5wdXQudHlwZSA9PT0gXCJzdWJtaXRcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJzdWJtaXRcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb0Zvcm0oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTEZvcm1FbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImZvcm1cIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb0ZpbGUoaW5wdXQpe1xuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJmaWxlXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgfVxuICAgICAgICBpZihpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiKSB7XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcImZpbGVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dChpbnB1dCl7XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInRleHRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwiaGlkZGVuXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcIm51bWJlclwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJlbWFpbFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJkYXRlXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIpIHtcbiAgICAgICAgICAgIGlmKCFpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRleHRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJoaWRkZW5cIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJudW1iZXJcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcImVtYWlsXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiZGF0ZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dG5vZGUoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgTm9kZSAmJiBpbnB1dC5ub2RlVHlwZSA9PT0gXCJURVhUX05PREVcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbENkYXRhKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvT3B0aW9uKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxPcHRpb25FbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcIm9wdGlvblwiKTtcbiAgICB9XG4gICAgXG4gICAgc3RhdGljIG1hcHNUb1NlbGVjdChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MU2VsZWN0RWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJzZWxlY3RcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1ZpZGVvKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxWaWRlb0VsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwidmlkZW9cIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1RleHRhcmVhKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxUZXh0QXJlYUVsZW1lbnQpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwidGV4dGFyZWFcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1NpbXBsZShpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEVsZW1lbnRNYXBwZXIgfSBmcm9tIFwiLi4vZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBVbmlxdWVJZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vdW5pcXVlSWRSZWdpc3RyeS5qc1wiO1xuXG4vKipcbiAqIENvbGxlY3RzIGluZm9ybWF0aW9uIHdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgYW5kIGZpbmRzIHRoZSByb290IGVsZW1lbnQsIGNyZWF0ZXMgbWFwIG9mIGVsZW1lbnRzIFxuICovXG5leHBvcnQgY2xhc3MgRWxlbWVudFJlZ2lzdHJhdG9yIHtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VW5pcXVlSWRSZWdpc3RyeX0gdW5pcXVlSWRSZWdpc3RyeSBcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gY29tcG9uZW50SW5kZXggXG4gICAgICovXG4gICAgY29uc3RydWN0b3IodW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50SW5kZXgpIHtcblxuICAgICAgICAvKiogQHR5cGUge051bWJlcn0gKi9cbiAgICAgICAgdGhpcy5jb21wb25lbnRJbmRleCA9IGNvbXBvbmVudEluZGV4O1xuXG4gICAgICAgIC8qKiBAdHlwZSB7VW5pcXVlSWRSZWdpc3RyeX0gKi9cbiAgICAgICAgdGhpcy51bmlxdWVJZFJlZ2lzdHJ5ID0gdW5pcXVlSWRSZWdpc3RyeTtcblxuICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZ2V0RWxlbWVudE1hcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudE1hcDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMaXN0ZW5zIHRvIGVsZW1lbnRzIGJlaW5nIGNyZWF0ZWQsIGFuZCB0YWtlcyBpbm4gdGhlIGNyZWF0ZWQgWG1sRWxlbWVudCBhbmQgaXRzIHBhcmVudCBYbWxFbGVtZW50XG4gICAgICogXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB4bWxFbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudFdyYXBwZXIgXG4gICAgICovXG4gICAgZWxlbWVudENyZWF0ZWQoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcikge1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gRWxlbWVudE1hcHBlci5tYXAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcik7XG5cbiAgICAgICAgdGhpcy5hZGRUb0VsZW1lbnRJZE1hcChlbGVtZW50KTtcblxuICAgICAgICBpZih0aGlzLnJvb3RFbGVtZW50ID09PSBudWxsICYmIGVsZW1lbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgYWRkVG9FbGVtZW50SWRNYXAoZWxlbWVudCkge1xuICAgICAgICBpZihlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlRWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaWQgPSBudWxsO1xuICAgICAgICBpZihlbGVtZW50LmNvbnRhaW5zQXR0cmlidXRlKFwiaWRcIikpIHtcbiAgICAgICAgICAgIGlkID0gZWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIpO1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIsdGhpcy51bmlxdWVJZFJlZ2lzdHJ5LmlkQXR0cmlidXRlV2l0aFN1ZmZpeChpZCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoaWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudE1hcC5zZXQoaWQsZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG59IiwiaW1wb3J0IHsgQ29udGFpbmVyRWxlbWVudCwgQ29udGFpbmVyRWxlbWVudFV0aWxzLCBDb250YWluZXJFdmVudCwgQ29udGFpbmVyV2luZG93IH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgTWV0aG9kIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi4vY29tcG9uZW50L2NvbXBvbmVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgQ2FudmFzUm9vdCB7XG5cbiAgICBzdGF0aWMgc2hvdWxkU3dhbGxvd05leHRGb2N1c0VzY2FwZSA9IGZhbHNlO1xuXG4gICAgLyoqIEB0eXBlIHtDb250YWluZXJFbGVtZW50fSAqL1xuICAgIHN0YXRpYyBtb3VzZURvd25FbGVtZW50ID0gbnVsbDtcblxuICAgIHN0YXRpYyBmb2N1c0VzY2FwZUV2ZW50UmVxdWVzdGVkID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtDb21wb25lbnR9IGNvbXBvbmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVwbGFjZUNvbXBvbmVudChpZCwgY29tcG9uZW50KSB7XG4gICAgICAgIGNvbnN0IGJvZHlFbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudFV0aWxzLmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50LmNvbnRhaW5lckVsZW1lbnQsIGJvZHlFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtDb21wb25lbnR9IGNvbXBvbmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgc2V0Q29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcbiAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBDb250YWluZXJFbGVtZW50VXRpbHMuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICBib2R5RWxlbWVudC5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50LmNvbnRhaW5lckVsZW1lbnQsIGJvZHlFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtDb21wb25lbnR9IGNvbXBvbmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgYWRkQ2hpbGRDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xuICAgICAgICBjb25zdCBib2R5RWxlbWVudCA9IENvbnRhaW5lckVsZW1lbnRVdGlscy5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5jb250YWluZXJFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICogQHBhcmFtIHtDb21wb25lbnR9IGNvbXBvbmVudCBcbiAgICAgKi9cbiAgICBzdGF0aWMgYWRkQ2hpbGRFbGVtZW50KGlkLCBlbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGJvZHlFbGVtZW50ID0gQ29udGFpbmVyRWxlbWVudFV0aWxzLmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudC5jb250YWluZXJFbGVtZW50KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgXG4gICAgICovXG4gICAgc3RhdGljIHJlbW92ZUVsZW1lbnQoaWQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudFV0aWxzLnJlbW92ZUVsZW1lbnQoaWQpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XG4gICAgICovXG4gICAgc3RhdGljIGFkZEhlYWRlckVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBDb250YWluZXJFbGVtZW50VXRpbHMuYXBwZW5kUm9vdE1ldGFDaGlsZChlbGVtZW50LmNvbnRhaW5lckVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XG4gICAgICovXG4gICAgc3RhdGljIGFkZEJvZHlFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudFV0aWxzLmFwcGVuZFJvb3RVaUNoaWxkKGVsZW1lbnQuY29udGFpbmVyRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgcHJlcGVuZEhlYWRlckVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBDb250YWluZXJFbGVtZW50VXRpbHMucHJlcGVuZEVsZW1lbnQoXCJoZWFkXCIsIGVsZW1lbnQuY29udGFpbmVyRWxlbWVudCk7XG4gICAgfVxuXG4gICAgLyoqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcbiAgICAgKi9cbiAgICBzdGF0aWMgcHJlcGVuZEJvZHlFbGVtZW50KGVsZW1lbnQpIHtcbiAgICAgICAgQ29udGFpbmVyRWxlbWVudFV0aWxzLnByZXBlbmRFbGVtZW50KFwiYm9keVwiLCBlbGVtZW50LmNvbnRhaW5lckVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKiBcbiAgICAgKiBSZW1lbWJlciB0byBzd2FsbG93Rm9jdXNFc2NhcGUgZm9yIGluaXRpYWwgdHJpZ2dlcmluZyBldmVudHNcbiAgICAgKiB3aGljaCBhcmUgZXh0ZXJuYWwgdG8gZm9jdXNSb290XG4gICAgICogXG4gICAgICogQWxzbyByZW1lbWJlciB0byBrZWVwIHRoZSBkZXN0cm95IGZ1bmN0aW9uIGFuZCBjYWxsIGl0XG4gICAgICogd2hlbiB0aGUgbGlzdGVuZXIgaXMgbm8gbG9uZ2VyIG5lZWRlZFxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWV0aG9kfSBsaXN0ZW5lclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGZvY3VzUm9vdFxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gZGVzdHJveSBmdW5jdGlvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGNvbnRhaW5lciB3aW5kb3dcbiAgICAgKi9cbiAgICBzdGF0aWMgbGlzdGVuVG9Gb2N1c0VzY2FwZShsaXN0ZW5lciwgZm9jdXNSb290KSB7XG4gICAgICAgIFxuICAgICAgICBjb25zdCBkZXN0cm95RnVuY3Rpb25zID0gW107XG5cbiAgICAgICAgLyogSGFjazogQmVjYXVzZSB3ZSBkb24ndCBoYXZlIGEgd2F5IG9mIGtub3dpbmcgaW4gdGhlIGNsaWNrIGV2ZW50IHdoaWNoIGVsZW1lbnQgd2FzIGluIGZvY3VzIHdoZW4gbW91c2Vkb3duIG9jY3VyZWQgKi9cbiAgICAgICAgaWYgKCFDYW52YXNSb290LmZvY3VzRXNjYXBlRXZlbnRSZXF1ZXN0ZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZU1vdXNlRG93bkVsZW1lbnQgPSBuZXcgTWV0aG9kKG51bGwsICgvKiogQHR5cGUge0NvbnRhaW5lckV2ZW50fSAqLyBldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIENhbnZhc1Jvb3QubW91c2VEb3duRWxlbWVudCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGVzdHJveUZ1bmN0aW9ucy5wdXNoKFxuICAgICAgICAgICAgICAgIENvbnRhaW5lcldpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHVwZGF0ZU1vdXNlRG93bkVsZW1lbnQpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgQ2FudmFzUm9vdC5mb2N1c0VzY2FwZUV2ZW50UmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNhbGxJZk5vdENvbnRhaW5zID0gbmV3IE1ldGhvZChudWxsLCAoLyoqIEB0eXBlIHtDb250YWluZXJFdmVudH0gKi8gZXZlbnQpID0+IHtcbiAgICAgICAgICAgIENhbnZhc1Jvb3QubW91c2VEb3duRWxlbWVudCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgIGlmIChDb250YWluZXJFbGVtZW50VXRpbHMuY29udGFpbnMoZm9jdXNSb290LmNvbnRhaW5lckVsZW1lbnQsIENhbnZhc1Jvb3QubW91c2VEb3duRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBJZiB0aGUgZWxlbWVudCBpcyBub3QgY29ubmVjdGVkLCB0aGVuIHRoZSBlbGVtZW50IGlzIG5vdCB2aXNpYmxlXG4gICAgICAgICAgICAvLyBhbmQgd2Ugc2hvdWxkIG5vdCB0cmlnZ2VyIGZvY3VzIGVzY2FwZSBldmVudHNcbiAgICAgICAgICAgIGlmICghQ29udGFpbmVyRWxlbWVudFV0aWxzLmlzQ29ubmVjdGVkKENhbnZhc1Jvb3QubW91c2VEb3duRWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoQ2FudmFzUm9vdC5zaG91bGRTd2FsbG93TmV4dEZvY3VzRXNjYXBlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGlzdGVuZXIuY2FsbChldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICBkZXN0cm95RnVuY3Rpb25zLnB1c2goXG4gICAgICAgICAgICBDb250YWluZXJXaW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxJZk5vdENvbnRhaW5zKVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgICAgICBkZXN0cm95RnVuY3Rpb25zLmZvckVhY2goZGVzdHJveSA9PiBkZXN0cm95KCkpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdoZW4gYW4gZWxlbWVudCBpcyBjb25naWd1cmVkIHRvIGJlIGhpZGRlbiBieSBGb2N1c0VzY2FwZSxcbiAgICAgKiBhbmQgd2FzIHNob3duIGJ5IGFuIGV2ZW50IHRyaWdnZXJlZCBmcm9tIGFuIGV4dGVybmFsIGVsZW1lbnQsXG4gICAgICogdGhlbiBGb2N1c0VzY2FwZSBnZXRzIHRyaWdnZXJlZCByaWdodCBhZnRlciB0aGUgZWxlbWVudCBpc1xuICAgICAqIHNob3duLiBUaGVyZWZvcmUgdGhpcyBmdW5jdGlvbiBhbGxvd3MgdGhpcyBldmVudCB0byBiZSBcbiAgICAgKiBzd2FsbG93ZWQgdG8gYXZvaWQgdGhpcyBiZWhhdmlvclxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmb3JNaWxsaXNlY29uZHMgXG4gICAgICovXG4gICAgc3RhdGljIHN3YWxsb3dGb2N1c0VzY2FwZShmb3JNaWxsaXNlY29uZHMpIHtcbiAgICAgICAgQ2FudmFzUm9vdC5zaG91bGRTd2FsbG93TmV4dEZvY3VzRXNjYXBlID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBDYW52YXNSb290LnNob3VsZFN3YWxsb3dOZXh0Rm9jdXNFc2NhcGUgPSBmYWxzZTtcbiAgICAgICAgfSwgZm9yTWlsbGlzZWNvbmRzKTtcbiAgICB9XG59IiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7RWxlbWVudE1hcHBlcn0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgSFRNTHtcblxuICAgIHN0YXRpYyBjdXN0b20oZWxlbWVudE5hbWUpe1xuICAgICAgICBjb25zdCB4bWxFbGVtZW50ID0gbmV3IFhtbEVsZW1lbnQoZWxlbWVudE5hbWUpO1xuICAgICAgICByZXR1cm4gRWxlbWVudE1hcHBlci5tYXAoeG1sRWxlbWVudCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFwcGx5U3R5bGVzKGVsZW1lbnQsIGNsYXNzVmFsdWUsIHN0eWxlVmFsdWUpe1xuICAgICAgICBpZihjbGFzc1ZhbHVlKXtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJjbGFzc1wiLCBjbGFzc1ZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBpZihzdHlsZVZhbHVlKXtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJzdHlsZVwiLCBzdHlsZVZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBhKHZhbHVlLCBocmVmLCBjbGFzc1ZhbHVlLCBzdHlsZVZhbHVlKXtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IEhUTUwuY3VzdG9tKFwiYVwiKTtcbiAgICAgICAgZWxlbWVudC5hZGRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJocmVmXCIsaHJlZik7XG4gICAgICAgIEhUTUwuYXBwbHlTdHlsZXMoZWxlbWVudCwgY2xhc3NWYWx1ZSwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cblxuICAgIHN0YXRpYyBpKHZhbHVlLCBjbGFzc1ZhbHVlLCBzdHlsZVZhbHVlKXtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IEhUTUwuY3VzdG9tKFwiaVwiKTtcbiAgICAgICAgZWxlbWVudC5hZGRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIEhUTUwuYXBwbHlTdHlsZXMoZWxlbWVudCwgY2xhc3NWYWx1ZSwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IE1hcCwgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDYW52YXNSb290IH0gZnJvbSBcIi4vY2FudmFzUm9vdC5qc1wiO1xuaW1wb3J0IHsgSFRNTCB9IGZyb20gXCIuLi9odG1sL2h0bWwuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IFRleHRub2RlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L3RleHRub2RlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ2FudmFzU3R5bGVzXCIpO1xuXG5jb25zdCBzdHlsZXMgPSBuZXcgTWFwKCk7XG5jb25zdCBzdHlsZU93bmVycyA9IG5ldyBNYXAoKTtcbmNvbnN0IGVuYWJsZWRTdHlsZXMgPSBuZXcgTGlzdCgpO1xuXG5leHBvcnQgY2xhc3MgQ2FudmFzU3R5bGVzIHtcblxuICAgIHN0YXRpYyBzZXRTdHlsZShuYW1lLCBzb3VyY2UpIHtcbiAgICAgICAgaWYoc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBzdHlsZXMuZ2V0KG5hbWUpLnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xuICAgICAgICAgICAgbGV0IHN0eWxlRWxlbWVudCA9IEhUTUwuY3VzdG9tKFwic3R5bGVcIik7XG4gICAgICAgICAgICBzdHlsZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiLG5hbWUpO1xuICAgICAgICAgICAgc3R5bGVFbGVtZW50LnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XG4gICAgICAgICAgICBzdHlsZXMuc2V0KG5hbWUsIHN0eWxlRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlU3R5bGUobmFtZSkge1xuICAgICAgICBpZihlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLnJlbW92ZShuYW1lKTtcbiAgICAgICAgICAgIENhbnZhc1Jvb3QucmVtb3ZlRWxlbWVudChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZihzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHN0eWxlcy5yZW1vdmUobmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZGlzYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XG4gICAgICAgIENhbnZhc1N0eWxlcy5yZW1vdmVTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xuICAgICAgICBpZihDYW52YXNTdHlsZXMuaGFzU3R5bGVPd25lcihuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFzdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihcIlN0eWxlIGRvZXMgbm90IGV4aXN0OiBcIiArIG5hbWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMucmVtb3ZlKG5hbWUpO1xuICAgICAgICAgICAgQ2FudmFzUm9vdC5yZW1vdmVFbGVtZW50KG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGVuYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XG4gICAgICAgIENhbnZhc1N0eWxlcy5hZGRTdHlsZU93bmVyKG5hbWUsIG93bmVySWQpO1xuICAgICAgICBpZighc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJTdHlsZSBkb2VzIG5vdCBleGlzdDogXCIgKyBuYW1lKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZighZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5hZGQobmFtZSk7XG4gICAgICAgICAgICBDYW52YXNSb290LmFkZEhlYWRlckVsZW1lbnQoc3R5bGVzLmdldChuYW1lKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYWRkU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgc3R5bGVPd25lcnMuc2V0KG5hbWUsIG5ldyBMaXN0KCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5nZXQobmFtZSkuY29udGFpbnMob3duZXJJZCkpIHtcbiAgICAgICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5hZGQob3duZXJJZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XG4gICAgICAgIGlmKCFzdHlsZU93bmVycy5jb250YWlucyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN0eWxlT3duZXJzLmdldChuYW1lKS5yZW1vdmUob3duZXJJZCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGhhc1N0eWxlT3duZXIobmFtZSkge1xuICAgICAgICBpZighc3R5bGVPd25lcnMuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3R5bGVPd25lcnMuZ2V0KG5hbWUpLnNpemUoKSA+IDA7XG4gICAgfVxufSIsImV4cG9ydCBjbGFzcyBDb21wb25lbnRGYWN0b3J5IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbXBvbmVudE5hbWUgXG4gICAgICogQHJldHVybnMge0NvbXBvbmVudH1cbiAgICAgKi9cbiAgICBjcmVhdGUoY29tcG9uZW50TmFtZSkge1xuICAgICAgICB0aHJvdyBcIk5vdCBpbXBsZW1lbnRlZFwiO1xuICAgIH1cblxufSIsImltcG9ydCB7IEluamVjdGlvblBvaW50IH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBEb21UcmVlIH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnQuanNcIjtcbmltcG9ydCB7IFVuaXF1ZUlkUmVnaXN0cnkgfSBmcm9tIFwiLi91bmlxdWVJZFJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBFbGVtZW50UmVnaXN0cmF0b3IgfSBmcm9tIFwiLi9lbGVtZW50UmVnaXN0cmF0b3IuanNcIjtcbmltcG9ydCB7IFRlbXBsYXRlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xuaW1wb3J0IHsgU3R5bGVzUmVnaXN0cnkgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBDYW52YXNTdHlsZXMgfSBmcm9tIFwiLi4vY2FudmFzL2NhbnZhc1N0eWxlcy5qc1wiO1xuaW1wb3J0IHsgQ29tcG9uZW50RmFjdG9yeSB9IGZyb20gXCIuL2NvbXBvbmVudEZhY3RvcnkuanNcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlRlbXBsYXRlQ29tcG9uZW50RmFjdG9yeVwiKTtcblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlQ29tcG9uZW50RmFjdG9yeSBleHRlbmRzIENvbXBvbmVudEZhY3Rvcnl7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3R5bGVzUmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtUZW1wbGF0ZVJlZ2lzdHJ5fSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShUZW1wbGF0ZVJlZ2lzdHJ5KTtcblxuICAgICAgICAvKiogQHR5cGUge1VuaXF1ZUlkUmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IEluamVjdGlvblBvaW50Lmluc3RhbmNlKFVuaXF1ZUlkUmVnaXN0cnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNsYXNzVHlwZSByZXByZXNlbnRzIHRoZSB0ZW1wbGF0ZSBhbmQgdGhlIHN0eWxlcyBuYW1lIGlmIHRoZSBzdHlsZSBmb3IgdGhhdCBuYW1lIGlzIGF2YWlsYWJsZVxuICAgICAqL1xuICAgIGNyZWF0ZShjbGFzc1R5cGUpe1xuICAgICAgICBpZiAoIWNsYXNzVHlwZS5URU1QTEFURV9VUkwgfHwgIWNsYXNzVHlwZS5TVFlMRVNfVVJMKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUZW1wbGF0ZSBjb21wb25lbnQgY2xhc3MgbXVzdCBpbXBsZW1lbnQgc3RhdGljIG1lbWJlcnMgVEVNUExBVEVfVVJMIGFuZCBTVFlMRVNfVVJMXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5LmdldChjbGFzc1R5cGUubmFtZSk7XG4gICAgICAgIGlmKCF0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgTE9HLmVycm9yKHRoaXMudGVtcGxhdGVSZWdpc3RyeSk7XG4gICAgICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyB0ZW1wbGF0ZSB3YXMgZm91bmQgd2l0aCBuYW1lIFwiICsgY2xhc3NUeXBlLm5hbWUpO1xuXG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZWxlbWVudFJlZ2lzdHJhdG9yID0gbmV3IEVsZW1lbnRSZWdpc3RyYXRvcih0aGlzLnVuaXF1ZUlkUmVnaXN0cnksIHRlbXBsYXRlQ29tcG9uZW50Q291bnRlcisrKTtcbiAgICAgICAgbmV3IERvbVRyZWUodGVtcGxhdGUuZ2V0VGVtcGxhdGVTb3VyY2UoKSwgZWxlbWVudFJlZ2lzdHJhdG9yKS5sb2FkKCk7XG5cbiAgICAgICAgdGhpcy5tb3VudFN0eWxlcyhjbGFzc1R5cGUubmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnQoZWxlbWVudFJlZ2lzdHJhdG9yLmNvbXBvbmVudEluZGV4LCBlbGVtZW50UmVnaXN0cmF0b3Iucm9vdEVsZW1lbnQsIGVsZW1lbnRSZWdpc3RyYXRvci5nZXRFbGVtZW50TWFwKCkpO1xuICAgIH1cblxuICAgIG1vdW50U3R5bGVzKG5hbWUpIHtcbiAgICAgICAgaWYgKHRoaXMuc3R5bGVzUmVnaXN0cnkuY29udGFpbnMobmFtZSkpIHtcbiAgICAgICAgICAgIENhbnZhc1N0eWxlcy5zZXRTdHlsZShuYW1lLCB0aGlzLnN0eWxlc1JlZ2lzdHJ5LmdldChuYW1lKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxubGV0IHRlbXBsYXRlQ29tcG9uZW50Q291bnRlciA9IDA7IiwiaW1wb3J0IHsgQXJyYXlVdGlscywgU3RyaW5nVXRpbHMgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcbmltcG9ydCB7IFRyYWlsTm9kZSB9IGZyb20gXCIuL3RyYWlsTm9kZS5qc1wiO1xuaW1wb3J0IHsgSGlzdG9yeSB9IGZyb20gXCIuL2hpc3RvcnkuanNcIjtcbmltcG9ydCB7IFVybEJ1aWxkZXIgfSBmcm9tIFwiLi4vdXRpbC91cmxCdWlsZGVyLmpzXCI7XG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRyYWlsUHJvY2Vzc29yIHtcblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSBhbGwgbWF0Y2hpbmcgZnVuY3Rpb25zIGJhc2VkIG9uIHRoZSBhbmNob3IgaW4gdGhlIHVybFxuICAgICAqIGFuZCBjYWxscyB0aG9zZSBmdW5jdGlvbnMgc2VxdWVudGlhbGx5LiBBbHNvIGVuc3VyZXMgdGhhdCB0aGUgbGlzdFxuICAgICAqIG9mIHRyYWlsIHN0b3BzIGFyZSBhZGRlZCB0byB0aGUgaGlzdG9yeVxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHBhcmFtIHthbnl9IGNhbGxpbmdPYmplY3QgXG4gICAgICogQHBhcmFtIHtUcmFpbE5vZGV9IG5vZGUgXG4gICAgICovXG4gICAgc3RhdGljIHByb2NlZWRBbG9uZ0FuY2hvcih1cmwsIGNhbGxpbmdPYmplY3QsIG5vZGUpIHtcbiAgICAgICAgY29uc3QgdHJhaWxTdG9wcyA9IFRyYWlsUHJvY2Vzc29yLnRyaWdnZXJGdW5jdGlvbnNBbG9uZ0FuY2hvcih1cmwsIGNhbGxpbmdPYmplY3QsIG5vZGUpO1xuICAgICAgICBpZiAoIXRyYWlsU3RvcHMgfHwgMCA9PT0gdHJhaWxTdG9wcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVybEJ1aWxkZXIgPSBVcmxCdWlsZGVyLmJ1aWxkZXIoKS53aXRoQWxsT2ZVcmwoSGlzdG9yeS5jdXJyZW50VXJsKCkpO1xuICAgICAgICBjb25zdCBzdGVwVXJsID0gdXJsQnVpbGRlci53aXRoQW5jaG9yKG51bGwpLmJ1aWxkKCk7XG4gICAgICAgIEhpc3RvcnkucmVwbGFjZVVybChzdGVwVXJsLCBzdGVwVXJsLnRvU3RyaW5nKCksIG51bGwpO1xuICAgICAgICBcbiAgICAgICAgdHJhaWxTdG9wcy5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RlcFVybCA9IHVybEJ1aWxkZXIud2l0aEFuY2hvcih2YWx1ZSkuYnVpbGQoKTtcbiAgICAgICAgICAgIEhpc3RvcnkucHVzaFVybChzdGVwVXJsLCBzdGVwVXJsLnRvU3RyaW5nKCksIHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIG1hdGNoaW5nIGZ1bmN0aW9ucyBiYXNlZCBvbiB0aGUgdHJhaWwgaW4gdGhlIHVybFxuICAgICAqIGFuZCBjYWxscyB0aG9zZSBmdW5jdGlvbnMgc2VxdWVudGlhbGx5LlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmxcbiAgICAgKiBAcGFyYW0ge2FueX0gb2JqZWN0IFxuICAgICAqIEBwYXJhbSB7VHJhaWxOb2RlfSBub2RlIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8U3RyaW5nPn0gdHJhaWxTdG9wc1xuICAgICAqIEByZXR1cm5zIHtBcnJheTxTdHJpbmc+fVxuICAgICAqL1xuICAgIHN0YXRpYyB0cmlnZ2VyRnVuY3Rpb25zQWxvbmdBbmNob3IodXJsLCBjdXJyZW50T2JqZWN0LCBub2RlLCB0cmFpbFN0b3BzID0gbmV3IEFycmF5KCkpIHtcblxuICAgICAgICBjb25zdCBwYXJlbnRzUGF0aCA9IHRyYWlsU3RvcHMgPyB0cmFpbFN0b3BzLmpvaW4oXCJcIikgOiBcIlwiO1xuXG4gICAgICAgIGlmIChub2RlLnByb3BlcnR5KSB7XG4gICAgICAgICAgICBjdXJyZW50T2JqZWN0ID0gY3VycmVudE9iamVjdFtub2RlLnByb3BlcnR5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChTdHJpbmdVdGlscy5zdGFydHNXaXRoKHVybC5hbmNob3IsIFRyYWlsUHJvY2Vzc29yLnRvU3RhcnRzV2l0aChub2RlLnRyYWlsKSkpIHtcbiAgICAgICAgICAgIHRyYWlsU3RvcHMgPSBBcnJheVV0aWxzLmFkZCh0cmFpbFN0b3BzLCBub2RlLnRyYWlsKTtcbiAgICAgICAgICAgIGlmIChub2RlLndheXBvaW50KSB7XG4gICAgICAgICAgICAgICAgbm9kZS53YXlwb2ludC5jYWxsKGN1cnJlbnRPYmplY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICBpZiAoU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyh1cmwuYW5jaG9yLCBwYXJlbnRzUGF0aCArIG5vZGUudHJhaWwpKSB7XG4gICAgICAgICAgICB0cmFpbFN0b3BzID0gQXJyYXlVdGlscy5hZGQodHJhaWxTdG9wcywgbm9kZS50cmFpbCk7XG4gICAgICAgICAgICBpZiAobm9kZS5kZXN0aW5hdGlvbikge1xuICAgICAgICAgICAgICAgIG5vZGUuZGVzdGluYXRpb24uY2FsbChjdXJyZW50T2JqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLm5leHQpIHtcbiAgICAgICAgICAgIG5vZGUubmV4dC5mb3JFYWNoKChjaGlsZE5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICB0cmFpbFN0b3BzID0gVHJhaWxQcm9jZXNzb3IudHJpZ2dlckZ1bmN0aW9uc0Fsb25nQW5jaG9yKHVybCwgY3VycmVudE9iamVjdCwgY2hpbGROb2RlLCB0cmFpbFN0b3BzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRyYWlsU3RvcHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZHMgdGhlIHRyYWlsIGRlc3RpbmF0aW9uIGZ1bmN0aW9uIG1hdGNoaW5nIHRoZSBwcm92aWRlZCBmdW5jdGlvbiwgdHJpZ2dlcnMgdGhlIGZ1bmN0aW9uIGFuZCByZWNvcmRzXG4gICAgICogdGhlIHRyYWlsIGFzIGEgbmV3IHVybCB3aXRoIHRoZSBhbmNob3IuXG4gICAgICogXG4gICAgICogU2hvdWxkIGJlIGNhbGxlZCBmcm9tIHRoZSBjb250ZXh0IG9mIHRoZSBkaXJlY3QgcGFyZW50IGNvbnRyb2xsZXIuIE9ubHkgdGhlIGRlc3RpbmF0aW9uIGZ1bmN0aW9uIHdpbGxcbiAgICAgKiBiZSBjYWxsZWQsIGFuZCB0aGUgZW50aXJlIHRyYWlsIHdpbGwgYmUgcmVjb3JkZWQgaW4gdGhlIGhpc3RvcnkuXG4gICAgICogXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gdGhlRnVuY3Rpb24gXG4gICAgICogQHBhcmFtIHthbnl9IGNhbGxpbmdPYmplY3QgXG4gICAgICogQHBhcmFtIHtUcmFpbE5vZGV9IG5vZGUgVGhlIHJvb3Qgbm9kZSBmcm9tIHRoZSB0cmFpbCBtYXBcbiAgICAgKi9cbiAgICBzdGF0aWMgcHJvY2VlZFRvRGVzdGluYXRpb25GdW5jdGlvbih0aGVGdW5jdGlvbiwgY2FsbGluZ09iamVjdCwgbm9kZSkge1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRVcmwgPSBIaXN0b3J5LmN1cnJlbnRVcmwoKTtcblxuICAgICAgICBjb25zdCBtYXRjaGluZ05vZGVUcmFpbCA9IFRyYWlsUHJvY2Vzc29yLmdldE5vZGVUcmFpbEJ5RnVuY3Rpb24obm9kZSwgdGhlRnVuY3Rpb24pO1xuXG4gICAgICAgIGlmICgwID09PSBtYXRjaGluZ05vZGVUcmFpbC5sZW5ndGgpIHsgXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBleGVjdXRlZEZ1bmN0aW9uUmVzcG9uc2UgPSB0aGVGdW5jdGlvbi5jYWxsKGNhbGxpbmdPYmplY3QpO1xuICAgICAgICBjb25zdCBuZXdUcmFpbCA9IFRyYWlsUHJvY2Vzc29yLmNvbmNhdGluYXRlU2VxdWVuY2VBc0FuY2hvcihtYXRjaGluZ05vZGVUcmFpbCk7XG5cbiAgICAgICAgaWYgKCFTdHJpbmdVdGlscy5ub25OdWxsRXF1YWxzKGN1cnJlbnRVcmwuYW5jaG9yLCBuZXdUcmFpbCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHVybEJ1aWxkZXIgPSBVcmxCdWlsZGVyLmJ1aWxkZXIoKS53aXRoQWxsT2ZVcmwoY3VycmVudFVybCk7XG4gICAgICAgICAgICBjb25zdCBzdGVwVXJsID0gdXJsQnVpbGRlci53aXRoQW5jaG9yKG5ld1RyYWlsKS5idWlsZCgpO1xuICAgICAgICAgICAgSGlzdG9yeS5wdXNoVXJsKHN0ZXBVcmwsIHN0ZXBVcmwudG9TdHJpbmcoKSwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhlY3V0ZWRGdW5jdGlvblJlc3BvbnNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmRzIHRoZSB0cmFpbCBkZXN0aW5hdGlvbiBmdW5jdGlvbiBtYXRjaGluZyB0aGUgcHJvdmlkZWQgZnVuY3Rpb24sIHRyaWdnZXJzIHRoZSBmdW5jdGlvbiBhbmQgcmVjb3Jkc1xuICAgICAqIHRoZSB0cmFpbCBieSByZXBsYWNpbmcgdGhlIGN1cnJlbnQgdXJsIHdpdGggdGhlIG5ldyB1cmwgaW5jbHVkaW5nIHRoZSBhbmNob3IuXG4gICAgICogXG4gICAgICogU2hvdWxkIGJlIGNhbGxlZCBmcm9tIHRoZSBjb250ZXh0IG9mIHRoZSBkaXJlY3QgcGFyZW50IGNvbnRyb2xsZXIuIE9ubHkgdGhlIGRlc3RpbmF0aW9uIGZ1bmN0aW9uIHdpbGxcbiAgICAgKiBiZSBjYWxsZWQsIGFuZCB0aGUgZW50aXJlIHRyYWlsIHdpbGwgYmUgcmVjb3JkZWQgaW4gdGhlIGhpc3RvcnkuXG4gICAgICogXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gdGhlRnVuY3Rpb24gXG4gICAgICogQHBhcmFtIHthbnl9IGNhbGxpbmdPYmplY3QgXG4gICAgICogQHBhcmFtIHtUcmFpbE5vZGV9IG5vZGUgXG4gICAgICovXG4gICAgc3RhdGljIGp1bXBUb0Rlc3RpbmF0aW9uRnVuY3Rpb24odGhlRnVuY3Rpb24sIGNhbGxpbmdPYmplY3QsIG5vZGUpIHtcblxuICAgICAgICBjb25zdCBjdXJyZW50VXJsID0gSGlzdG9yeS5jdXJyZW50VXJsKCk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hpbmdOb2RlVHJhaWwgPSBUcmFpbFByb2Nlc3Nvci5nZXROb2RlVHJhaWxCeUZ1bmN0aW9uKG5vZGUsIHRoZUZ1bmN0aW9uKTtcblxuICAgICAgICBpZiAoMCA9PT0gbWF0Y2hpbmdOb2RlVHJhaWwubGVuZ3RoKSB7IFxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZXhlY3V0ZWRGdW5jdGlvblJlc3BvbnNlID0gdGhlRnVuY3Rpb24uY2FsbChjYWxsaW5nT2JqZWN0KTtcbiAgICAgICAgY29uc3QgbmV3VHJhaWwgPSBUcmFpbFByb2Nlc3Nvci5jb25jYXRpbmF0ZVNlcXVlbmNlQXNBbmNob3IobWF0Y2hpbmdOb2RlVHJhaWwpO1xuXG4gICAgICAgIGlmICghU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyhjdXJyZW50VXJsLmFuY2hvciwgbmV3VHJhaWwpKSB7XG4gICAgICAgICAgICBjb25zdCB1cmxCdWlsZGVyID0gVXJsQnVpbGRlci5idWlsZGVyKCkud2l0aEFsbE9mVXJsKGN1cnJlbnRVcmwpO1xuICAgICAgICAgICAgY29uc3Qgc3RlcFVybCA9IHVybEJ1aWxkZXIud2l0aEFuY2hvcihuZXdUcmFpbCkuYnVpbGQoKTtcbiAgICAgICAgICAgIEhpc3RvcnkucmVwbGFjZVVybChzdGVwVXJsLCBzdGVwVXJsLnRvU3RyaW5nKCksIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4ZWN1dGVkRnVuY3Rpb25SZXNwb25zZTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8VHJhaWxOb2RlPn0gbm9kZVNlcXVlbmNlXG4gICAgICogQHJldHVybnMge3N0cmluZ30gYW5jaG9yXG4gICAgICovXG4gICAgc3RhdGljIGNvbmNhdGluYXRlU2VxdWVuY2VBc0FuY2hvcihub2RlU2VxdWVuY2UpIHtcblxuICAgICAgICBjb25zdCB0cmFpbEFycmF5ID0gbm9kZVNlcXVlbmNlLm1hcCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUudHJhaWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0cmFpbEFycmF5LmpvaW4oXCJcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtUcmFpbE5vZGV9IG5vZGUgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRoZUZ1bmN0aW9uIFxuICAgICAqIEBwYXJhbSB7QXJyYXk8VHJhaWxOb2RlPn0gbm9kZVRyYWlsXG4gICAgICogQHJldHVybnMge0FycmF5PFRyYWlsTm9kZT59XG4gICAgICovXG4gICAgc3RhdGljIGdldE5vZGVUcmFpbEJ5RnVuY3Rpb24obm9kZSwgdGhlRnVuY3Rpb24sIG5vZGVUcmFpbCA9IG5ldyBBcnJheSgpLCByb290ID0gdHJ1ZSkge1xuXG4gICAgICAgIC8vIENoZWNrIGlmIG5vZGUgaXMgYSBtYXRjaCwgdGhlbiBhZGQgaXRcbiAgICAgICAgaWYgKHRoZUZ1bmN0aW9uID09PSBub2RlLmRlc3RpbmF0aW9uKSB7XG4gICAgICAgICAgICBub2RlVHJhaWwgPSBBcnJheVV0aWxzLmFkZChub2RlVHJhaWwsIG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2tpbmcgY2hpbGQgbm9kZXMgaWYgbm90IGZvdW5kIHlldFxuICAgICAgICBpZiAodGhlRnVuY3Rpb24gIT09IG5vZGUuZGVzdGluYXRpb24gJiYgbm9kZVRyYWlsLmxlbmd0aCA9PT0gMCAmJiBub2RlLm5leHQpIHtcbiAgICAgICAgICAgIG5vZGUubmV4dC5mb3JFYWNoKChjaGlsZE5vZGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZVRyYWlsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBub2RlVHJhaWwgPSBUcmFpbFByb2Nlc3Nvci5nZXROb2RlVHJhaWxCeUZ1bmN0aW9uKGNoaWxkTm9kZSwgdGhlRnVuY3Rpb24sIG5vZGVUcmFpbCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWxyZWFkeSBmb3VuZCBub2RlLCBhZGRpbmcgdGhpcyBhbmNlc3RvciBvZiB0aGUgbm9kZVxuICAgICAgICBpZiAobm9kZVRyYWlsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG5vZGVUcmFpbCA9IEFycmF5VXRpbHMuYWRkKG5vZGVUcmFpbCwgbm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocm9vdCAmJiBub2RlVHJhaWwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8gSWYgcm9vdCBpcyB0cnVlLCB0aGVuIHRoZSBsaXN0IGlzIGNvbXBsZXRlIHNvIHdlIHJldmVyc2UgaXRcbiAgICAgICAgICAgIHJldHVybiBub2RlVHJhaWwucmV2ZXJzZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlVHJhaWw7XG4gICAgfVxuXG4gICAgc3RhdGljIHRvU3RhcnRzV2l0aCh0cmFpbCkge1xuXG4gICAgICAgIGlmIChudWxsID09IHRyYWlsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCIvXCI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyh0cmFpbCwgXCIvXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gXCIvXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJhaWwgKyBcIi9cIjtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnRcIjtcbmltcG9ydCB7IFVuaXF1ZUlkUmVnaXN0cnkgfSBmcm9tIFwiLi91bmlxdWVJZFJlZ2lzdHJ5XCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XG5pbXBvcnQgeyBIVE1MIH0gZnJvbSBcIi4uL2h0bWwvaHRtbFwiO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50QnVpbGRlciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1VuaXF1ZUlkUmVnaXN0cnl9IGlkUmVnaXN0cnlcbiAgICAgKiBAcmV0dXJucyB7Q29tcG9uZW50QnVpbGRlcn1cbiAgICAgKi9cbiAgICBzdGF0aWMgY3JlYXRlKGlkUmVnaXN0cnkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnRCdWlsZGVyKGlkUmVnaXN0cnkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7VW5pcXVlSWRSZWdpc3RyeX0gaWRSZWdpc3RyeVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGlkUmVnaXN0cnkpIHtcblxuICAgICAgICAvKiogQHR5cGUge1VuaXF1ZUlkUmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMuaWRSZWdpc3RyeSA9IGlkUmVnaXN0cnk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXA8U3RyaW5nLCBCYXNlRWxlbWVudD59ICovXG4gICAgICAgIHRoaXMuZWxlbWVudE1hcCA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xuICAgICAgICB0aGlzLmxhc3RBZGRlZEVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7QmFzZUVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuY29udGV4dEVsZW1lbnQgPSBudWxsO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7QmFzZUVsZW1lbnRbXX0gKi9cbiAgICAgICAgdGhpcy50cmFpbCA9IFtdO1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtVbmlxdWVJZFJlZ2lzdHJ5fSBpZFJlZ2lzdHJ5XG4gICAgICogQHBhcmFtIHtNYXA8U3RyaW5nLCBCYXNlRWxlbWVudD59IGVsZW1lbnRNYXBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGFnIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nW119IGF0dHJpYnV0ZUFycmF5IFxuICAgICAqIEByZXR1cm5zIHtCYXNlRWxlbWVudH1cbiAgICAgKi9cbiAgICBzdGF0aWMgdGFnKGlkUmVnaXN0cnksIGVsZW1lbnRNYXAsIHRhZywgLi4uYXR0cmlidXRlQXJyYXkpIHtcblxuICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xuICAgICAgICBjb25zdCBlbGVtZW50ID0gSFRNTC5jdXN0b20odGFnKTtcblxuICAgICAgICBhdHRyaWJ1dGVBcnJheS5mb3JFYWNoKGF0dHIgPT4ge1xuICAgICAgICAgICAgbGV0IGtleSA9IGF0dHI7XG4gICAgICAgICAgICBsZXQgdmFsID0gXCJcIjtcbiAgICAgICAgICAgIGlmIChhdHRyLmluZGV4T2YoXCI9XCIpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGxldCBpbmRleE9mQ29sb24gPSBhdHRyLmluZGV4T2YoXCI9XCIpO1xuICAgICAgICAgICAgICAgIGtleSA9IGF0dHIuc3Vic3RyaW5nKDAsIGluZGV4T2ZDb2xvbik7XG4gICAgICAgICAgICAgICAgdmFsID0gYXR0ci5zdWJzdHJpbmcoaW5kZXhPZkNvbG9uICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKFwiaWRcIiA9PT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRNYXAuc2V0KHZhbCwgZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IGlkUmVnaXN0cnkuaWRBdHRyaWJ1dGVXaXRoU3VmZml4KGF0dHIuc3Vic3RyaW5nKGluZGV4T2ZDb2xvbiArIDEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKGtleSwgdmFsKTtcblxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRhZyBcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmdbXX0gYXR0cmlidXRlQXJyYXkgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgcm9vdCh0YWcsIC4uLmF0dHJpYnV0ZUFycmF5KSB7XG4gICAgICAgIGlmICh0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb21wb25lbnRCdWlsZGVyOiBSb290IGVsZW1lbnQgaXMgYWxyZWFkeSBkZWZpbmVkLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gQ29tcG9uZW50QnVpbGRlci50YWcodGhpcy5pZFJlZ2lzdHJ5LCB0aGlzLmVsZW1lbnRNYXAsIHRhZywgLi4uYXR0cmlidXRlQXJyYXkpO1xuICAgICAgICB0aGlzLmxhc3RBZGRlZEVsZW1lbnQgPSB0aGlzLnJvb3RFbGVtZW50O1xuICAgICAgICB0aGlzLmNvbnRleHRFbGVtZW50ID0gdGhpcy5yb290RWxlbWVudDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHRhZ05hbWUgXG4gICAgICogQHBhcmFtICB7U3RyaW5nW119IGF0dHJpYnV0ZUFycmF5XG4gICAgICogQHJldHVybnMge0NvbXBvbmVudEJ1aWxkZXJ9XG4gICAgICovXG4gICAgbm9kZSh0YWdOYW1lLCAuLi5hdHRyaWJ1dGVBcnJheSkge1xuICAgICAgICBpZiAoIXRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbXBvbmVudEJ1aWxkZXI6IFJvb3QgZWxlbWVudCBpcyBub3QgZGVmaW5lZC4gQ2FsbCByb290KCkgYmVmb3JlIGFkZGluZyBjaGlsZCBlbGVtZW50cy5cIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudHJhaWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb21wb25lbnRCdWlsZGVyOiBObyBvcGVuIGVsZW1lbnQgY29udGV4dCB0byBhZGQgY2hpbGQgZWxlbWVudHMsIGNhbGwgb3BlbigpIGJlZm9yZSBhZGRpbmcuXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBDb21wb25lbnRCdWlsZGVyLnRhZyh0aGlzLmlkUmVnaXN0cnksIHRoaXMuZWxlbWVudE1hcCwgdGFnTmFtZSwgLi4uYXR0cmlidXRlQXJyYXkpO1xuICAgICAgICB0aGlzLmNvbnRleHRFbGVtZW50LmFkZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB0aGlzLmxhc3RBZGRlZEVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBcbiAgICAgKiBAcmV0dXJucyB7Q29tcG9uZW50QnVpbGRlcn1cbiAgICAgKi9cbiAgICB0ZXh0KHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb21wb25lbnRCdWlsZGVyOiBSb290IGVsZW1lbnQgaXMgbm90IGRlZmluZWQuIENhbGwgcm9vdCgpIGJlZm9yZSBhZGRpbmcgY2hpbGQgZWxlbWVudHMuXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnRyYWlsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29tcG9uZW50QnVpbGRlcjogTm8gb3BlbiBlbGVtZW50IGNvbnRleHQgdG8gYWRkIGNoaWxkIGVsZW1lbnRzLCBjYWxsIG9wZW4oKSBiZWZvcmUgYWRkaW5nLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnRleHRFbGVtZW50LmFkZENoaWxkKHRleHQpO1xuICAgICAgICB0aGlzLmxhc3RBZGRlZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBvcGVuKCkge1xuICAgICAgICBpZiAoIXRoaXMucm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbXBvbmVudEJ1aWxkZXI6IFJvb3QgZWxlbWVudCBpcyBub3QgZGVmaW5lZC4gQ2FsbCByb290KCkgYmVmb3JlIGFkZGluZyBjaGlsZCBlbGVtZW50cy5cIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubGFzdEFkZGVkRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29tcG9uZW50QnVpbGRlcjogVW5hYmxlIHRvIG9wZW4gbGFzdCBlbGVtZW50LlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRyYWlsLnB1c2godGhpcy5jb250ZXh0RWxlbWVudCk7XG4gICAgICAgIHRoaXMuY29udGV4dEVsZW1lbnQgPSB0aGlzLmxhc3RBZGRlZEVsZW1lbnQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsb3NlKCkge1xuICAgICAgICBpZiAodGhpcy50cmFpbC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbXBvbmVudEJ1aWxkZXI6IE5vIG9wZW4gZWxlbWVudCBjb250ZXh0IHRvIGNsb3NlLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnRleHRFbGVtZW50ID0gdGhpcy50cmFpbC5wb3AoKTtcbiAgICAgICAgdGhpcy5sYXN0QWRkZWRFbGVtZW50ID0gdGhpcy5jb250ZXh0RWxlbWVudDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYnVpbGQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29tcG9uZW50KGNvbXBvbmVudEJ1aWxkZXJDb3VudGVyKyssIHRoaXMucm9vdEVsZW1lbnQsIHRoaXMuZWxlbWVudE1hcCk7XG4gICAgfVxufVxuXG5sZXQgY29tcG9uZW50QnVpbGRlckNvdW50ZXIgPSAwOyIsImltcG9ydCB7IEluamVjdGlvblBvaW50IH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzUmVnaXN0cnlcIjtcbmltcG9ydCB7IENvbXBvbmVudEZhY3RvcnkgfSBmcm9tIFwiLi9jb21wb25lbnRGYWN0b3J5XCI7XG5pbXBvcnQgeyBVbmlxdWVJZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vdW5pcXVlSWRSZWdpc3RyeVwiO1xuaW1wb3J0IHsgQ2FudmFzU3R5bGVzIH0gZnJvbSBcIi4uL2NhbnZhcy9jYW52YXNTdHlsZXNcIjtcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gXCIuLi9jb21wb25lbnQvY29tcG9uZW50XCI7XG5pbXBvcnQgeyBTdHlsZXNoZWV0QnVpbGRlciB9IGZyb20gXCIuLi9zdHlsZXMvc3R5bGVzaGVldEJ1aWxkZXJcIjtcbmltcG9ydCB7IENvbXBvbmVudEJ1aWxkZXIgfSBmcm9tIFwiLi4vY29tcG9uZW50L2NvbXBvbmVudEJ1aWxkZXJcIjtcblxuZXhwb3J0IGNsYXNzIElubGluZUNvbXBvbmVudEZhY3RvcnkgZXh0ZW5kcyBDb21wb25lbnRGYWN0b3J5IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7U3R5bGVzUmVnaXN0cnl9ICovXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtVbmlxdWVJZFJlZ2lzdHJ5fSAqL1xuICAgICAgICB0aGlzLnVuaXF1ZUlkUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShVbmlxdWVJZFJlZ2lzdHJ5KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjbGFzc1R5cGUgcmVwcmVzZW50cyB0aGUgaW5saW5lIGNvbXBvbmVudCBjbGFzc1xuICAgICAqL1xuICAgIGNyZWF0ZShjbGFzc1R5cGUpe1xuICAgICAgICBpZiAoIWNsYXNzVHlwZS5idWlsZENvbXBvbmVudCB8fCAhY2xhc3NUeXBlLmJ1aWxkU3R5bGVzaGVldCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5saW5lIGNvbXBvbmVudCBjbGFzcyBtdXN0IGltcGxlbWVudCBzdGF0aWMgbWV0aG9kcyBidWlsZENvbXBvbmVudCgpIGFuZCBidWlsZFN0eWxlc2hlZXQoKVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKiBAdHlwZSB7Q29tcG9uZW50fSAqL1xuICAgICAgICBjb25zdCBjb21wb25lbnQgPSBjbGFzc1R5cGUuYnVpbGRDb21wb25lbnQoQ29tcG9uZW50QnVpbGRlci5jcmVhdGUodGhpcy51bmlxdWVJZFJlZ2lzdHJ5KSk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXG4gICAgICAgIGNvbnN0IHN0eWxlc2hlZXQgPSBjbGFzc1R5cGUuYnVpbGRTdHlsZXNoZWV0KFN0eWxlc2hlZXRCdWlsZGVyLmNyZWF0ZSgpKTtcblxuICAgICAgICBDYW52YXNTdHlsZXMuc2V0U3R5bGUoY2xhc3NUeXBlLm5hbWUsIHN0eWxlc2hlZXQpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbXBvbmVudDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBNaW5kaUluamVjdG9yLFxuICAgIE1pbmRpQ29uZmlnLFxuICAgIEluc3RhbmNlUG9zdENvbmZpZ1RyaWdnZXIsXG4gICAgQ29uZmlnQWNjZXNzb3IsXG4gICAgU2luZ2xldG9uQ29uZmlnLFxuICAgIFByb3RvdHlwZUNvbmZpZywgXG4gICAgQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCI7XG5pbXBvcnQgeyBBcnJheVV0aWxzLCBMb2dnZXIsIE1ldGhvZCwgU3RyaW5nVXRpbHMgfSBmcm9tICBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBDb250YWluZXJFdmVudCwgQ29udGFpbmVyVXJsIH0gZnJvbSBcImNvbnRhaW5lcmJyaWRnZV92MVwiO1xuaW1wb3J0IHsgQ29tcG9uZW50Q29uZmlnUHJvY2Vzc29yIH0gZnJvbSBcIi4vY29tcG9uZW50L2NvbXBvbmVudENvbmZpZ1Byb2Nlc3Nvci5qc1wiO1xuaW1wb3J0IHsgVGVtcGxhdGVSZWdpc3RyeSB9IGZyb20gXCIuL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzL3N0eWxlc1JlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBIaXN0b3J5IH0gZnJvbSBcIi4vbmF2aWdhdGlvbi9oaXN0b3J5LmpzXCI7XG5pbXBvcnQgeyBEaU1vZHVsZUxvYWRlciB9IGZyb20gXCIuL2xvYWRlci9kaU1vZHVsZUxvYWRlci5qc1wiO1xuaW1wb3J0IHsgVXJsIH0gZnJvbSBcIi4vdXRpbC91cmwuanNcIjtcbmltcG9ydCB7IE1vZHVsZVJ1bm5lciB9IGZyb20gXCIuL21vZHVsZVJ1bm5lci5qc1wiO1xuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4vbW9kdWxlLmpzXCI7XG5pbXBvcnQgeyBBY3RpdmVNb2R1bGVSdW5uZXIgfSBmcm9tIFwiLi9hY3RpdmVNb2R1bGVSdW5uZXIuanNcIjtcbmltcG9ydCB7IFN0YXRlTWFuYWdlciB9IGZyb20gXCIuL3N0YXRlL3N0YXRlTWFuYWdlci5qc1wiO1xuaW1wb3J0IHsgVW5pcXVlSWRSZWdpc3RyeSB9IGZyb20gXCIuL2NvbXBvbmVudC91bmlxdWVJZFJlZ2lzdHJ5LmpzXCI7XG5pbXBvcnQgeyBUZW1wbGF0ZUNvbXBvbmVudEZhY3RvcnkgfSBmcm9tIFwiLi9jb21wb25lbnQvdGVtcGxhdGVDb21wb25lbnRGYWN0b3J5LmpzXCI7XG5pbXBvcnQgeyBNb2R1bGVMb2FkZXIgfSBmcm9tIFwiLi9sb2FkZXIvbW9kdWxlTG9hZGVyLmpzXCI7XG5pbXBvcnQgeyBUcmFpbFByb2Nlc3NvciB9IGZyb20gXCIuL25hdmlnYXRpb24vdHJhaWxQcm9jZXNzb3IuanNcIjtcbmltcG9ydCB7IElubGluZUNvbXBvbmVudEZhY3RvcnkgfSBmcm9tIFwiLi9jb21wb25lbnQvaW5saW5lQ29tcG9uZW50RmFjdG9yeS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQXBwbGljYXRpb25cIik7XG5cbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbiBleHRlbmRzIE1vZHVsZVJ1bm5lciB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0FycmF5PE1vZHVsZUxvYWRlcj59IG1vZHVsZUxvYWRlckFycmF5IFxuICAgICAqIEBwYXJhbSB7Q29uZmlnfSBjb25maWcgXG4gICAgICogQHBhcmFtIHtBcnJheX0gd29ya2VyQXJyYXkgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobW9kdWxlTG9hZGVyQXJyYXksIGNvbmZpZyA9IG5ldyBNaW5kaUNvbmZpZygpLCB3b3JrZXJBcnJheSA9IG5ldyBBcnJheSgpKSB7XG5cbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICAvKiogQHR5cGUge0FycmF5PE1vZHVsZUxvYWRlcj59ICovXG4gICAgICAgIHRoaXMubW9kdWxlTG9hZGVyQXJyYXkgPSBtb2R1bGVMb2FkZXJBcnJheTtcblxuICAgICAgICAvKiogQHR5cGUge01pbmRpQ29uZmlnfSAqL1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcblxuICAgICAgICAvKiogQHR5cGUge0FycmF5fSAqL1xuICAgICAgICB0aGlzLndvcmtlckFycmF5ID0gd29ya2VyQXJyYXk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtBcnJheX0gKi9cbiAgICAgICAgdGhpcy5ydW5uaW5nV29ya2VycyA9IG5ldyBBcnJheSgpO1xuXG4gICAgICAgIC8qKiBAdHlwZSB7TW9kdWxlfSAqL1xuICAgICAgICB0aGlzLmFjdGl2ZU1vZHVsZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5kZWZhdWx0Q29uZmlnID0gW1xuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoVGVtcGxhdGVSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChTdHlsZXNSZWdpc3RyeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChVbmlxdWVJZFJlZ2lzdHJ5KSxcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKFRlbXBsYXRlQ29tcG9uZW50RmFjdG9yeSksXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChJbmxpbmVDb21wb25lbnRGYWN0b3J5KSxcbiAgICAgICAgICAgIFByb3RvdHlwZUNvbmZpZy51bm5hbWVkKFN0YXRlTWFuYWdlcilcbiAgICAgICAgXTtcblxuICAgICAgICB0aGlzLmRlZmF1bHRDb25maWdQcm9jZXNzb3JzID0gWyBDb21wb25lbnRDb25maWdQcm9jZXNzb3IgXTtcblxuICAgICAgICB0aGlzLmRlZmF1bHRJbnN0YW5jZVByb2Nlc3NvcnMgPSBbIEluc3RhbmNlUG9zdENvbmZpZ1RyaWdnZXIgXTtcblxuICAgIH1cblxuICAgIGFzeW5jIHJ1bigpIHtcbiAgICAgICAgTE9HLmluZm8oXCJSdW5uaW5nIEFwcGxpY2F0aW9uXCIpO1xuICAgICAgICB0aGlzLmNvbmZpZ1xuICAgICAgICAgICAgLmFkZEFsbFR5cGVDb25maWcodGhpcy5kZWZhdWx0Q29uZmlnKVxuICAgICAgICAgICAgLmFkZEFsbENvbmZpZ1Byb2Nlc3Nvcih0aGlzLmRlZmF1bHRDb25maWdQcm9jZXNzb3JzKVxuICAgICAgICAgICAgLmFkZEFsbEluc3RhbmNlUHJvY2Vzc29yKHRoaXMuZGVmYXVsdEluc3RhbmNlUHJvY2Vzc29ycyk7XG4gICAgICAgIEFjdGl2ZU1vZHVsZVJ1bm5lci5pbnN0YW5jZSgpLnNldCh0aGlzKTtcbiAgICAgICAgQ29udGFpbmVyVXJsLmFkZFVzZXJOYXZpZ2F0ZUxpc3RlbmVyKG5ldyBNZXRob2QodGhpcywgdGhpcy51cGRhdGUpKTtcbiAgICAgICAgY29uc3QgbW9kdWxlID0gYXdhaXQgdGhpcy5ydW5Nb2R1bGUoSGlzdG9yeS5jdXJyZW50VXJsKCkpO1xuICAgICAgICB0aGlzLnN0YXJ0V29ya2VycygpO1xuICAgICAgICByZXR1cm4gbW9kdWxlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7Q29udGFpbmVyRXZlbnR9IGV2ZW50XG4gICAgICovXG4gICAgdXBkYXRlKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHVybCA9IEhpc3RvcnkuY3VycmVudFVybCgpO1xuXG4gICAgICAgIGlmICh0aGlzLmFjdGl2ZU1vZHVsZSAmJiBTdHJpbmdVdGlscy5zdGFydHNXaXRoKHVybC5hbmNob3IsIHRoaXMuYWN0aXZlTW9kdWxlLnRyYWlsTWFwLnRyYWlsKSkge1xuICAgICAgICAgICAgVHJhaWxQcm9jZXNzb3IudHJpZ2dlckZ1bmN0aW9uc0Fsb25nQW5jaG9yKHVybCwgdGhpcy5hY3RpdmVNb2R1bGUsIHRoaXMuYWN0aXZlTW9kdWxlLnRyYWlsTWFwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJ1bk1vZHVsZSh1cmwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgYXN5bmMgcnVuTW9kdWxlKHVybCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbW9kdWxlTG9hZGVyID0gdGhpcy5nZXRNYXRjaGluZ01vZHVsZUxvYWRlcih1cmwpO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVNb2R1bGUgPSBhd2FpdCBtb2R1bGVMb2FkZXIubG9hZCgpO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVNb2R1bGUudXJsID0gdXJsO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmVNb2R1bGUudHJhaWxNYXAgPSBtb2R1bGVMb2FkZXIudHJhaWxNYXA7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZU1vZHVsZS5sb2FkKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmVNb2R1bGU7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICAgIExPRy5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXJ0V29ya2VycygpIHtcbiAgICAgICAgaWYgKHRoaXMucnVubmluZ1dvcmtlcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuY29uZmlnO1xuICAgICAgICBjb25zdCBydW5uaW5nV29ya2VycyA9IHRoaXMucnVubmluZ1dvcmtlcnM7XG4gICAgICAgIHRoaXMud29ya2VyQXJyYXkuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IHZhbHVlKCk7XG4gICAgICAgICAgICBNaW5kaUluamVjdG9yLmluamVjdChpbnN0YW5jZSwgY29uZmlnKTtcbiAgICAgICAgICAgIEFycmF5VXRpbHMuYWRkKHJ1bm5pbmdXb3JrZXJzLCBpbnN0YW5jZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmxcbiAgICAgKiBAcmV0dXJucyB7RGlNb2R1bGVMb2FkZXJ9XG4gICAgICovXG4gICAgZ2V0TWF0Y2hpbmdNb2R1bGVMb2FkZXIodXJsKSB7XG4gICAgICAgIGxldCBmb3VuZE1vZHVsZUxvYWRlciA9IG51bGw7XG4gICAgICAgIHRoaXMubW9kdWxlTG9hZGVyQXJyYXkuZm9yRWFjaCgodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmICghZm91bmRNb2R1bGVMb2FkZXIgJiYgdmFsdWUubWF0Y2hlcyh1cmwpKSB7XG4gICAgICAgICAgICAgICAgZm91bmRNb2R1bGVMb2FkZXIgPSB2YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmb3VuZE1vZHVsZUxvYWRlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byBkZXBlbmRlbmN5IGluamVjdGlvbiBjb25maWdcbiAgICAgKi9cbiAgICB3aW5kb3dEaUNvbmZpZygpIHtcbiAgICAgICAgd2luZG93LmRpQ29uZmlnID0gKCkgPT4ge1xuICAgICAgICAgICAgTE9HLmluZm8odGhpcy5jb25maWcuY29uZmlnRW50cmllcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbmFibGUgZ2xvYmFsIGFjY2VzcyB0byB0ZW1wbGF0ZSByZWdpc3RyeVxuICAgICAqL1xuICAgIHdpbmRvd1RlbXBsYXRlUmVnaXN0cnkoKSB7XG4gICAgICAgIHdpbmRvdy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHlwZUNvbmZpZyA9IENvbmZpZ0FjY2Vzc29yLnR5cGVDb25maWdCeU5hbWUoVGVtcGxhdGVSZWdpc3RyeS5uYW1lLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgICAgICBMT0cuaW5mbyh0eXBlQ29uZmlnLmluc3RhbmNlSG9sZGVyKCkuaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW5hYmxlIGdsb2JhbCBhY2Nlc3MgdG8gc3R5bGUgcmVnaXN0cnlcbiAgICAgKi9cbiAgICB3aW5kb3dTdHlsZVJlZ2lzdHJ5KCkge1xuICAgICAgICB3aW5kb3cuc3R5bGVSZWdpc3RyeSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHR5cGVDb25maWcgPSBDb25maWdBY2Nlc3Nvci50eXBlQ29uZmlnQnlOYW1lKFN0eWxlc1JlZ2lzdHJ5Lm5hbWUsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgICAgIExPRy5pbmZvKHR5cGVDb25maWcuaW5zdGFuY2VIb2xkZXIoKS5pbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBNYWNVdGlscywgUmFkaXhVdGlscywgU3RyaW5nVXRpbHMgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuZXhwb3J0IGNsYXNzIElkU3BhY2Uge1xuXG4gICAgc3RhdGljIElEX1NQQUNFX1NUUklOR19XSURUSCA9IDE3O1xuXG4gICAgc3RhdGljIEhXX1NUUklOR19QQVJUX1dJRFRIID0gOTtcbiAgICBzdGF0aWMgRVBPQ0hfU0VDT05EU19TVFJJTkdfUEFSVF9XSURUSCA9IDY7XG4gICAgc3RhdGljIENPVU5UX1NUUklOR19QQVJUX1dJRFRIID0gMjtcblxuICAgIGNvbnN0cnVjdG9yKG1hYyA9IG51bGwsIGVwb2NoU2Vjb25kcyA9IG51bGwsIGNvdW50ZXIgPSBudWxsKSB7XG4gICAgICAgIHRoaXMubWFjID0gbWFjO1xuICAgICAgICB0aGlzLmVwb2NoU2Vjb25kcyA9IGVwb2NoU2Vjb25kcztcbiAgICAgICAgdGhpcy5jb3VudGVyID0gY291bnRlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gaWRTcGFjZVN0cmluZyBcbiAgICAgKiBAcmV0dXJucyB7SWRTcGFjZX1cbiAgICAgKi9cbiAgICBzdGF0aWMgcGFyc2UoaWRTcGFjZVN0cmluZykge1xuICAgICAgICBpZiAoaWRTcGFjZVN0cmluZyA9PSBudWxsIHx8IGlkU3BhY2VTdHJpbmcubGVuZ3RoIDwgSWRTcGFjZS5JRF9TUEFDRV9TVFJJTkdfV0lEVEggfHwgIVJhZGl4VXRpbHMuaXNWYWxpZFJhZGl4U3RyaW5nKGlkU3BhY2VTdHJpbmcpKSB7XG4gICAgICAgICAgICB0aHJvdyBFcnJvcihcIklEIFNwYWNlIG11c3QgYmUgYXQgbGVhc3QgXCIgKyBJZFNwYWNlLklEX1NQQUNFX1NUUklOR19XSURUSCArIFwiIGNoYXJhY3RlcnMgbG9uZyBhbmQgY29udGFpbiB2YWxpZCBjaGFyYWN0ZXJzLlwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYWNTdHJpbmcgPSBpZFNwYWNlU3RyaW5nLnN1YnN0cmluZygwLCBJZFNwYWNlLkhXX1NUUklOR19QQVJUX1dJRFRIKTtcbiAgICAgICAgY29uc3QgZXBvY2hTZWNvbmRzU3RyaW5nID0gaWRTcGFjZVN0cmluZy5zdWJzdHJpbmcoXG4gICAgICAgICAgICBJZFNwYWNlLkhXX1NUUklOR19QQVJUX1dJRFRILCBcbiAgICAgICAgICAgIElkU3BhY2UuSFdfU1RSSU5HX1BBUlRfV0lEVEggKyBJZFNwYWNlLkVQT0NIX1NFQ09ORFNfU1RSSU5HX1BBUlRfV0lEVEgpO1xuXG4gICAgICAgIGNvbnN0IGNvdW50ZXJTdHJpbmcgPSBpZFNwYWNlU3RyaW5nLnN1YnN0cmluZyhcbiAgICAgICAgICAgIElkU3BhY2UuSFdfU1RSSU5HX1BBUlRfV0lEVEggKyBJZFNwYWNlLkVQT0NIX1NFQ09ORFNfU1RSSU5HX1BBUlRfV0lEVEgsXG4gICAgICAgICAgICBJZFNwYWNlLkhXX1NUUklOR19QQVJUX1dJRFRIICsgSWRTcGFjZS5FUE9DSF9TRUNPTkRTX1NUUklOR19QQVJUX1dJRFRIICsgSWRTcGFjZS5DT1VOVF9TVFJJTkdfUEFSVF9XSURUSCk7XG5cbiAgICAgICAgY29uc3QgbWFjID0gUmFkaXhVdGlscy5mcm9tUmFkaXhTdHJpbmcobWFjU3RyaW5nKTtcbiAgICAgICAgY29uc3QgZXBvY2hTZWNvbmRzID0gUmFkaXhVdGlscy5mcm9tUmFkaXhTdHJpbmcoZXBvY2hTZWNvbmRzU3RyaW5nKTtcbiAgICAgICAgY29uc3QgY291bnRlciA9IFJhZGl4VXRpbHMuZnJvbVJhZGl4U3RyaW5nKGNvdW50ZXJTdHJpbmcpO1xuXG4gICAgICAgIHJldHVybiBuZXcgSWRTcGFjZShtYWMsIGVwb2NoU2Vjb25kcywgY291bnRlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgY29uc3QgbWFjU3RyaW5nID0gU3RyaW5nVXRpbHMubGVmdFBhZChSYWRpeFV0aWxzLnRvUmFkaXhTdHJpbmcodGhpcy5tYWMpLCBJZFNwYWNlLkhXX1NUUklOR19QQVJUX1dJRFRILCAnMCcpO1xuICAgICAgICBjb25zdCBlcG9jaFNlY29uZHNTdHJpbmcgPSBTdHJpbmdVdGlscy5sZWZ0UGFkKFJhZGl4VXRpbHMudG9SYWRpeFN0cmluZyh0aGlzLmVwb2NoU2Vjb25kcyksIElkU3BhY2UuRVBPQ0hfU0VDT05EU19TVFJJTkdfUEFSVF9XSURUSCwgJzAnKTtcbiAgICAgICAgY29uc3QgY291bnRlclN0cmluZyA9IFN0cmluZ1V0aWxzLmxlZnRQYWQoUmFkaXhVdGlscy50b1JhZGl4U3RyaW5nKHRoaXMuY291bnRlciksIElkU3BhY2UuQ09VTlRfU1RSSU5HX1BBUlRfV0lEVEgsICcwJyk7XG4gICAgICAgIHJldHVybiBtYWNTdHJpbmcgKyBlcG9jaFNlY29uZHNTdHJpbmcgKyBjb3VudGVyU3RyaW5nO1xuICAgIH1cblxuICAgIHJlcG9ydCgpIHtcbiAgICAgICAgY29uc3QgcmVwb3J0ID0gbmV3IE1hcCgpO1xuICAgICAgICByZXBvcnQuc2V0KFwiSWRTcGFjZSBbTUFDXVwiLCBNYWNVdGlscy50b01hY0FkZHJlc3ModGhpcy5tYWMpKTtcbiAgICAgICAgcmVwb3J0LnNldChcIklkU3BhY2UgW0Vwb2NoXVwiLCB0aGlzLmVwb2NoU2Vjb25kcyAqIDEwMDApO1xuICAgICAgICByZXBvcnQuc2V0KFwiSWRTcGFjZSBbRGF0ZV1cIiwgbmV3IERhdGUodGhpcy5lcG9jaFNlY29uZHMgKiAxMDAwKS50b0lTT1N0cmluZygpKTtcbiAgICAgICAgcmVwb3J0LnNldChcIklkU3BhY2UgW0NvdW50ZXJdXCIsIHRoaXMuY291bnRlcik7XG4gICAgICAgIHJldHVybiByZXBvcnQ7XG4gICAgfVxufSIsImltcG9ydCB7IFJhZGl4VXRpbHMsIFN0cmluZ1V0aWxzIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbmV4cG9ydCBjbGFzcyBVc2VySWQge1xuXG4gICAgc3RhdGljIFVTRVJfSURfU1RSSU5HX1dJRFRIID0gOTtcblxuICAgIHN0YXRpYyBFUE9DSF9DRU5USVNfU1RSSU5HX1BBUlRfV0lEVEggPSA3O1xuICAgIHN0YXRpYyBDT1VOVF9TVFJJTkdfUEFSVF9XSURUSCA9IDI7XG5cbiAgICBjb25zdHJ1Y3RvcihlcG9jaENlbnRpcyA9IG51bGwsIGNvdW50ZXIgPSBudWxsKSB7XG4gICAgICAgIHRoaXMuZXBvY2hDZW50aXMgPSBlcG9jaENlbnRpcztcbiAgICAgICAgdGhpcy5jb3VudGVyID0gY291bnRlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkU3RyaW5nIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHN0YXRpYyBwYXJzZSh1c2VySWRTdHJpbmcpIHtcbiAgICAgICAgaWYgKHVzZXJJZFN0cmluZyA9PSBudWxsIHx8IHVzZXJJZFN0cmluZy5sZW5ndGggIT09IFVzZXJJZC5VU0VSX0lEX1NUUklOR19XSURUSCB8fCAhUmFkaXhVdGlscy5pc1ZhbGlkUmFkaXhTdHJpbmcodXNlcklkU3RyaW5nKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVXNlciBJRCBtdXN0IGJlIGF0IGxlYXN0IFwiICsgVXNlcklkLlVTRVJfSURfU1RSSU5HX1dJRFRIICsgXCIgY2hhcmFjdGVycyBsb25nIGFuZCBjb250YWluIHZhbGlkIGNoYXJhY3RlcnMuXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVwb2NoQ2VudGlzID0gUmFkaXhVdGlscy5mcm9tUmFkaXhTdHJpbmcodXNlcklkU3RyaW5nLnN1YnN0cmluZygwLCBVc2VySWQuRVBPQ0hfQ0VOVElTX1NUUklOR19QQVJUX1dJRFRIKSk7XG4gICAgICAgIGNvbnN0IGNvdW50ZXIgPSBSYWRpeFV0aWxzLmZyb21SYWRpeFN0cmluZyh1c2VySWRTdHJpbmcuc3Vic3RyaW5nKFVzZXJJZC5FUE9DSF9DRU5USVNfU1RSSU5HX1BBUlRfV0lEVEgsIFVzZXJJZC5VU0VSX0lEX1NUUklOR19XSURUSCkpO1xuICAgICAgICByZXR1cm4gbmV3IFVzZXJJZChlcG9jaENlbnRpcywgY291bnRlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHJldHVybnMge1N0cmluZ31cbiAgICAgKi9cbiAgICB0b1N0cmluZygpIHtcbiAgICAgICAgY29uc3QgZXBvY2hNaWxsaXNTdHJpbmcgPSBTdHJpbmdVdGlscy5sZWZ0UGFkKFJhZGl4VXRpbHMudG9SYWRpeFN0cmluZyh0aGlzLmVwb2NoQ2VudGlzKSwgVXNlcklkLkVQT0NIX0NFTlRJU19TVFJJTkdfUEFSVF9XSURUSCwgJzAnKTtcbiAgICAgICAgY29uc3QgY291bnRlclN0cmluZyA9IFN0cmluZ1V0aWxzLmxlZnRQYWQoUmFkaXhVdGlscy50b1JhZGl4U3RyaW5nKHRoaXMuY291bnRlciksIFVzZXJJZC5DT1VOVF9TVFJJTkdfUEFSVF9XSURUSCwgJzAnKTtcbiAgICAgICAgcmV0dXJuIGVwb2NoTWlsbGlzU3RyaW5nICsgY291bnRlclN0cmluZztcbiAgICB9XG5cbiAgICByZXBvcnQoKSB7XG4gICAgICAgIGNvbnN0IHJlcG9ydCA9IG5ldyBNYXAoKTtcbiAgICAgICAgcmVwb3J0LnNldChcIlVzZXJJZCBbRXBvY2hdXCIsIHRoaXMuZXBvY2hDZW50aXMgKiAxMCk7XG4gICAgICAgIHJlcG9ydC5zZXQoXCJVc2VySWQgW0RhdGVdXCIsIG5ldyBEYXRlKHRoaXMuZXBvY2hDZW50aXMgKiAxMCkudG9JU09TdHJpbmcoKSk7XG4gICAgICAgIHJlcG9ydC5zZXQoXCJVc2VySWQgW0NvdW50ZXJdXCIsIHRoaXMuY291bnRlcik7XG4gICAgICAgIHJldHVybiByZXBvcnQ7XG4gICAgfVxufSIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgSWRTcGFjZSB9IGZyb20gXCIuL2lkU3BhY2VcIjtcbmltcG9ydCB7IFVzZXJJZCB9IGZyb20gXCIuL3VzZXJJZFwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSWRcIik7XG5cbmV4cG9ydCBjbGFzcyBJZCB7XG5cbiAgICBjb25zdHJ1Y3RvcihpZFNwYWNlID0gbnVsbCwgdXNlcklkID0gbnVsbCkge1xuICAgICAgICB0aGlzLmlkU3BhY2UgPSBpZFNwYWNlXG4gICAgICAgIHRoaXMudXNlcklkID0gdXNlcklkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBpZFN0cmluZyBcbiAgICAgKiBAcmV0dXJucyB7SWR9XG4gICAgICovXG4gICAgc3RhdGljIHBhcnNlKGlkU3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGlkU3BhY2VTdHJpbmcgPSBpZFN0cmluZy5zdWJzdHJpbmcoMCwgSWRTcGFjZS5JRF9TUEFDRV9TVFJJTkdfV0lEVEgpO1xuICAgICAgICBjb25zdCB1c2VySWRTdHJpbmcgPSBpZFN0cmluZy5zdWJzdHJpbmcoSWRTcGFjZS5JRF9TUEFDRV9TVFJJTkdfV0lEVEgpO1xuXG4gICAgICAgIGNvbnN0IGlkU3BhY2UgPSBJZFNwYWNlLnBhcnNlKGlkU3BhY2VTdHJpbmcpO1xuICAgICAgICBjb25zdCB1c2VySWQgPSBVc2VySWQucGFyc2UodXNlcklkU3RyaW5nKTtcblxuICAgICAgICByZXR1cm4gbmV3IElkKGlkU3BhY2UsIHVzZXJJZCk7XG4gICAgfVxuXG4gICAgcmVwb3J0KCkge1xuICAgICAgICBjb25zdCByZXBvcnQgPSBuZXcgTWFwKCk7XG4gICAgICAgIGNvbnN0IGlkU3BhY2VSZXBvcnQgPSB0aGlzLmlkU3BhY2UucmVwb3J0KCk7XG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGlkU3BhY2VSZXBvcnQuZW50cmllcygpKSB7XG4gICAgICAgICAgICByZXBvcnQuc2V0KGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHVzZXJJZFJlcG9ydCA9IHRoaXMudXNlcklkLnJlcG9ydCgpO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB1c2VySWRSZXBvcnQuZW50cmllcygpKSB7XG4gICAgICAgICAgICByZXBvcnQuc2V0KGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXBvcnQ7XG4gICAgfVxuXG4gICAgcmVwb3J0U3RyaW5nKCkge1xuICAgICAgICBjb25zdCByZXBvcnQgPSB0aGlzLnJlcG9ydCgpO1xuICAgICAgICBsZXQgcmVwb3J0U3RyaW5nID0gXCJcIlxuICAgICAgICBsZXQgZmlyc3QgPSB0cnVlO1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiByZXBvcnQuZW50cmllcygpKSB7XG4gICAgICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgICAgICByZXBvcnRTdHJpbmcgKz0ga2V5ICsgXCI6IFwiICsgdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcG9ydFN0cmluZyArPSBcIlxcblwiICsga2V5ICsgXCI6IFwiICsgdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXBvcnRTdHJpbmc7XG4gICAgfVxuXG4gICAgcHJpbnQgKCl7XG4gICAgICAgIExPRy5pbmZvKHRoaXMucmVwb3J0U3RyaW5nKCkpO1xuICAgIH1cblxuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICByZXR1cm4gaWRTcGFjZS50b1N0cmluZygpICsgdXNlcklkLnRvU3RyaW5nKCk7XG4gICAgfVxuXG4gICAgdXNlcklkKCkge1xuICAgICAgICByZXR1cm4gdXNlcklkLnRvU3RyaW5nKCk7XG4gICAgfVxuXG59IiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5cbi8qKiBAdHlwZSB7TWFwfSAqL1xubGV0IGNvbmZpZ3VyZWRGdW5jdGlvbk1hcCA9IG5ldyBNYXAoKTtcblxuZXhwb3J0IGNsYXNzIENvbmZpZ3VyZWRGdW5jdGlvbiB7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSB0aGVGdW5jdGlvblxuICAgICAqL1xuICAgIHN0YXRpYyBjb25maWd1cmUobmFtZSwgdGhlRnVuY3Rpb24pIHtcbiAgICAgICAgY29uZmlndXJlZEZ1bmN0aW9uTWFwLnNldChuYW1lLCB0aGVGdW5jdGlvbik7XG4gICAgfVxuXG4gICAgc3RhdGljIGV4ZWN1dGUobmFtZSwgcGFyYW1ldGVyKSB7XG4gICAgICAgIHJldHVybiBjb25maWd1cmVkRnVuY3Rpb25NYXAuZ2V0KG5hbWUpLmNhbGwobnVsbCwgcGFyYW1ldGVyKTtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBQcm9wZXJ0eUFjY2Vzc29yLCBMaXN0LCBMb2dnZXIsIE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudFwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSW5wdXRFbGVtZW50RGF0YUJpbmRpbmdcIik7XG5cbmV4cG9ydCBjbGFzcyBJbnB1dEVsZW1lbnREYXRhQmluZGluZyB7XG5cbiAgICBjb25zdHJ1Y3Rvcihtb2RlbCwgdmFsaWRhdG9yKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy52YWxpZGF0b3IgPSB2YWxpZGF0b3I7XG4gICAgICAgIHRoaXMucHVsbGVycyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMucHVzaGVycyA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGxpbmsobW9kZWwsIHZhbGlkYXRvcikge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0RWxlbWVudERhdGFCaW5kaW5nKG1vZGVsLCB2YWxpZGF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZpZWxkIFxuICAgICAqL1xuICAgIGFuZChmaWVsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50byhmaWVsZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdElucHV0RWxlbWVudH0gZmllbGQgXG4gICAgICovXG4gICAgdG8oZmllbGQpIHtcbiAgICAgICAgY29uc3QgcHVsbGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgbGV0IG1vZGVsVmFsdWUgPSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUpO1xuICAgICAgICAgICAgaWYgKG1vZGVsVmFsdWUgIT09IGZpZWxkLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgUHJvcGVydHlBY2Nlc3Nvci5zZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lLCBmaWVsZC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlKGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZmllbGQubGlzdGVuVG8oXCJjaGFuZ2VcIiwgbmV3IE1ldGhvZCh0aGlzLCBwdWxsZXIpKTtcbiAgICAgICAgZmllbGQubGlzdGVuVG8oXCJrZXl1cFwiLCBuZXcgTWV0aG9kKHRoaXMsIHB1bGxlcikpO1xuICAgICAgICBwdWxsZXIuY2FsbCgpO1xuXG4gICAgICAgIGNvbnN0IHB1c2hlciA9ICgpID0+IHtcbiAgICAgICAgICAgIHZhciBtb2RlbFZhbHVlID0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lKTtcbiAgICAgICAgICAgIGlmIChtb2RlbFZhbHVlICE9PSBmaWVsZC52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGZpZWxkLnZhbHVlID0gbW9kZWxWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLnZhbGlkYXRvciAmJiB0aGlzLnZhbGlkYXRvci52YWxpZGF0ZVNpbGVudCAmJiBmaWVsZC52YWx1ZSl7XG4gICAgICAgICAgICAgICAgdGhpcy52YWxpZGF0b3IudmFsaWRhdGVTaWxlbnQoZmllbGQudmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBjaGFuZ2VkRnVuY3Rpb25OYW1lID0gXCJfX2NoYW5nZWRfXCIgKyBmaWVsZC5uYW1lLnJlcGxhY2UoXCIuXCIsXCJfXCIpO1xuICAgICAgICBpZiAoIXRoaXMubW9kZWxbY2hhbmdlZEZ1bmN0aW9uTmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMubW9kZWxbY2hhbmdlZEZ1bmN0aW9uTmFtZV0gPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnB1bGxlcnMuYWRkKHB1bGxlcik7XG4gICAgICAgIHRoaXMucHVzaGVycy5hZGQocHVzaGVyKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBwdWxsKCkge1xuICAgICAgICB0aGlzLnB1bGxlcnMuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbChwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIHB1c2goKSB7XG4gICAgICAgIHRoaXMucHVzaGVycy5mb3JFYWNoKCh2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZS5jYWxsKHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFByb3h5T2JqZWN0RmFjdG9yeSB7XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgcHJveHkgZm9yIGFuIG9iamVjdCB3aGljaCBhbGxvd3MgZGF0YWJpbmRpbmcgZnJvbSB0aGUgb2JqZWN0IHRvIHRoZSBmb3JtIGVsZW1lbnRcbiAgICAgKiBcbiAgICAgKiBAdGVtcGxhdGUgVFxuICAgICAqIEBwYXJhbSB7VH0gb2JqZWN0IFxuICAgICAqIEByZXR1cm5zIHtUfVxuICAgICAqL1xuICAgIHN0YXRpYyBjcmVhdGVQcm94eU9iamVjdChvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eShvYmplY3QsIHtcbiAgICAgICAgICAgIHNldDogKHRhcmdldCwgcHJvcCwgdmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgc3VjY2VzcyA9ICh0YXJnZXRbcHJvcF0gPSB2YWx1ZSk7XG5cbiAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uTmFtZSA9IFwiX19jaGFuZ2VkX1wiICsgcHJvcDtcbiAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uID0gdGFyZ2V0W2NoYW5nZWRGdW5jdGlvbk5hbWVdO1xuICAgICAgICAgICAgICAgIGlmKGNoYW5nZWRGdW5jdGlvbiAmJiB0eXBlb2YgY2hhbmdlZEZ1bmN0aW9uID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJvdW5kQ2hhbmdlZEZ1bmN0aW9uID0gY2hhbmdlZEZ1bmN0aW9uLmJpbmQodGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgYm91bmRDaGFuZ2VkRnVuY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2Nlc3MgPT09IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59IiwiaW1wb3J0IHsgQ29uZmlndXJlZEZ1bmN0aW9uIH0gZnJvbSBcIi4uL2NvbmZpZy9jb25maWd1cmVkRnVuY3Rpb24uanNcIjtcbmltcG9ydCB7IFNpbXBsZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9zaW1wbGVFbGVtZW50LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudCB7XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihldmVudCkge1xuXG4gICAgICAgIC8qKiBAdHlwZSB7RXZlbnR9ICovXG4gICAgICAgIHRoaXMuZXZlbnQgPSBldmVudDtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQudHlwZS50b0xvd2VyQ2FzZSgpID09IFwiZHJhZ3N0YXJ0XCIpe1xuICAgICAgICAgICAgdGhpcy5ldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSgndGV4dC9wbGFpbicsIG51bGwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RvcFByb3BhZ2F0aW9uKCkge1xuICAgICAgICB0aGlzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHByZXZlbnREZWZhdWx0KCkge1xuICAgICAgICB0aGlzLmV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgZ2V0IGZpbGVzKCkge1xuICAgICAgICBpZiAodGhpcy5ldmVudC50YXJnZXQgJiYgdGhpcy5ldmVudC50YXJnZXQuZmlsZXMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmV2ZW50LnRhcmdldC5maWxlcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5ldmVudC5kYXRhVHJhbnNmZXIpIHtcbiAgICAgICAgICAgIC8qKiBAdHlwZSB7RGF0YVRyYW5zZmVyfSAqL1xuICAgICAgICAgICAgY29uc3QgZGF0YVRyYW5zZmVyID0gdGhpcy5ldmVudC5kYXRhVHJhbnNmZXI7XG4gICAgICAgICAgICBpZiAoZGF0YVRyYW5zZmVyLmZpbGVzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFUcmFuc2Zlci5maWxlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGV2ZW50IGFuZCB0aGUgZWRnZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGNvbnRhaW5pbmcgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0IG9mZnNldFgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Lm9mZnNldFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGV2ZW50IGFuZCB0aGUgZWRnZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNvbnRhaW5pbmcgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0IG9mZnNldFkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQub2Zmc2V0WTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbW91c2UgeCBjb29yZGluYXRlIG9mIHRoZSBldmVudCByZWxhdGl2ZSB0byB0aGUgY2xpZW50IHdpbmRvdyB2aWV3XG4gICAgICovXG4gICAgZ2V0IGNsaWVudFgoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmNsaWVudFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1vdXNlIHkgY29vcmRpbmF0ZSBvZiB0aGUgZXZlbnQgcmVsYXRpdmUgdG8gdGhlIGNsaWVudCB3aW5kb3cgdmlld1xuICAgICAqL1xuICAgIGdldCBjbGllbnRZKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5jbGllbnRZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtTaW1wbGVFbGVtZW50fVxuICAgICAqL1xuICAgIGdldCB0YXJnZXQoKSB7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50ICYmIHRoaXMuZXZlbnQudGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gQ29uZmlndXJlZEZ1bmN0aW9uLmV4ZWN1dGUoXCJtYXBFbGVtZW50XCIsIHRoaXMuZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEByZXR1cm5zIHtTaW1wbGVFbGVtZW50fVxuICAgICAqL1xuICAgIGdldCByZWxhdGVkVGFyZ2V0KCkge1xuICAgICAgICBpZiAodGhpcy5ldmVudCAmJiB0aGlzLmV2ZW50LnJlbGF0ZWRUYXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBDb25maWd1cmVkRnVuY3Rpb24uZXhlY3V0ZShcIm1hcEVsZW1lbnRcIiwgdGhpcy5ldmVudC5yZWxhdGVkVGFyZ2V0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgICBnZXRSZWxhdGVkVGFyZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICAgICAgaWYgKHRoaXMuZXZlbnQucmVsYXRlZFRhcmdldCkge1xuICAgICAgICAgICAgcmV0dXJuIENvbmZpZ3VyZWRGdW5jdGlvbi5leGVjdXRlKFwibWFwRWxlbWVudFwiLCB0aGlzLmV2ZW50LnJlbGF0ZWRUYXJnZXQpLmdldEF0dHJpYnV0ZVZhbHVlKGF0dHJpYnV0ZU5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGdldCB0YXJnZXRWYWx1ZSgpIHtcbiAgICAgICAgaWYodGhpcy50YXJnZXQpIHsgXG4gICAgICAgICAgICByZXR1cm4gdGhpcy50YXJnZXQudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0IGtleUNvZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmtleUNvZGU7XG4gICAgfVxuXG4gICAgaXNLZXlDb2RlKGNvZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQua2V5Q29kZSA9PT0gY29kZTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IE1ldGhvZCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG4vKipcbiAqIE9iamVjdCBGdW5jdGlvbiB3aGljaCBpcyBjYWxsZWQgaWYgdGhlIGZpbHRlciBmdW5jdGlvbiByZXR1cm5zIHRydWVcbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50RmlsdGVyZWRNZXRob2QgZXh0ZW5kcyBNZXRob2Qge1xuXG4gICAgLyoqXG4gICAgICogQ29udHJ1Y3RvclxuICAgICAqIEBwYXJhbSB7TWV0aG9kfSBtZXRob2QgXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gdGhlRmlsdGVyIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG1ldGhvZCwgZmlsdGVyKXtcbiAgICAgICAgdGhpcy5tZXRob2QgPSBtZXRob2Q7XG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgIH1cblxuICAgIGNhbGwocGFyYW1zKXtcbiAgICAgICAgaWYodGhpcy5maWx0ZXIgJiYgdGhpcy5maWx0ZXIuY2FsbCh0aGlzLHBhcmFtcykpIHtcbiAgICAgICAgICAgIHRoaXMubWV0aG9kLmNhbGwocGFyYW1zKTtcbiAgICAgICAgfVxuICAgIH1cblxufSIsImltcG9ydCB7IE1ldGhvZCwgTWFwLCBMaXN0LCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcblxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkV2ZW50TWFuYWdlclwiKTtcblxuLyoqXG4gKiBFdmVudE1hbmFnZXJcbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50TWFuYWdlciB7XG5cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvKiogQHR5cGUgTWFwPExpc3Q8TWV0aG9kPj4gKi9cbiAgICAgICAgdGhpcy5saXN0ZW5lck1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIFxuICAgICAqIEBwYXJhbSB7TWV0aG9kfSBsaXN0ZW5lciBcbiAgICAgKiBAcmV0dXJucyB7RXZlbnRNYW5hZ2VyfVxuICAgICAqL1xuICAgIGxpc3RlblRvKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVyTWFwLmNvbnRhaW5zKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJNYXAuc2V0KGV2ZW50VHlwZSwgbmV3IExpc3QoKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lck1hcC5nZXQoZXZlbnRUeXBlKS5hZGQobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnRUeXBlIFxuICAgICAqIEBwYXJhbSB7QXJyYXl8YW55fSBwYXJhbWV0ZXIgXG4gICAgICovXG4gICAgYXN5bmMgdHJpZ2dlcihldmVudFR5cGUsIHBhcmFtZXRlcikge1xuICAgICAgICBpZiAoIWV2ZW50VHlwZSkge1xuICAgICAgICAgICAgTE9HLmVycm9yKFwiRXZlbnQgdHlwZSBpcyB1bmRlZmluZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmxpc3RlbmVyTWFwLmNvbnRhaW5zKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzdWx0QXJyYXkgPSBbXTtcbiAgICAgICAgdGhpcy5saXN0ZW5lck1hcC5nZXQoZXZlbnRUeXBlKS5mb3JFYWNoKChsaXN0ZW5lciwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICByZXN1bHRBcnJheS5wdXNoKGxpc3RlbmVyLmNhbGwocGFyYW1ldGVyKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChyZXN1bHRBcnJheS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRBcnJheVswXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocmVzdWx0QXJyYXkpO1xuICAgIH1cblxufSIsImltcG9ydCB7IExpc3QsIE1hcCwgTWFwVXRpbHMsIFN0cmluZ1V0aWxzIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XG5cbmV4cG9ydCBjbGFzcyBTdHlsZUFjY2Vzc29yIHtcbiAgICBcbiAgICAvKipcbiAgICAgKiBAdHlwZSB7QmFzZUVsZW1lbnR9XG4gICAgICogQHJldHVybiB7U3R5bGVBY2Nlc3Nvcn1cbiAgICAgKi9cbiAgICBzdGF0aWMgZnJvbShiYXNlRWxlbWVudCkge1xuICAgICAgICByZXR1cm4gbmV3IFN0eWxlQWNjZXNzb3IoYmFzZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGJhc2VFbGVtZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGJhc2VFbGVtZW50KSB7XG4gICAgICAgIC8qKiBAdHlwZSB7QmFzZUVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQgPSBiYXNlRWxlbWVudDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcInN0eWxlXCIsIFwiXCIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVOYW1lIFxuICAgICAqL1xuICAgIHJlbW92ZShzdHlsZU5hbWUpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlTWFwID0gdGhpcy5zdHlsZXNBc01hcCh0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIikpO1xuICAgICAgICBpZiAoY3VycmVudFN0eWxlTWFwLmNvbnRhaW5zKHN0eWxlTmFtZSkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRTdHlsZU1hcC5yZW1vdmUoc3R5bGVOYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJhc2VFbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIiwgTWFwVXRpbHMudG9TdHJpbmcoY3VycmVudFN0eWxlTWFwLCBcIjpcIiwgXCI7XCIpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0eWxlTmFtZSBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVWYWx1ZSBcbiAgICAgKi9cbiAgICBzZXQoc3R5bGVOYW1lLCBzdHlsZVZhbHVlKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRTdHlsZU1hcCA9IHRoaXMuc3R5bGVzQXNNYXAodGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcInN0eWxlXCIpKTtcbiAgICAgICAgY3VycmVudFN0eWxlTWFwLnNldChzdHlsZU5hbWUsIHN0eWxlVmFsdWUpO1xuICAgICAgICB0aGlzLmJhc2VFbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIiwgTWFwVXRpbHMudG9TdHJpbmcoY3VycmVudFN0eWxlTWFwLCBcIjpcIiwgXCI7XCIpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHN0eWxlTmFtZSBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVWYWx1ZSBcbiAgICAgKi9cbiAgICBpcyhzdHlsZU5hbWUsIHN0eWxlVmFsdWUpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlTWFwID0gdGhpcy5zdHlsZXNBc01hcCh0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIikpO1xuICAgICAgICByZXR1cm4gU3RyaW5nVXRpbHMubm9uTnVsbEVxdWFscyhjdXJyZW50U3R5bGVNYXAuZ2V0KHN0eWxlTmFtZSksIHN0eWxlVmFsdWUpO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc3R5bGVOYW1lIFxuICAgICAqL1xuICAgIGV4aXN0cyhzdHlsZU5hbWUpIHtcbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlTWFwID0gdGhpcy5zdHlsZXNBc01hcCh0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIikpO1xuICAgICAgICByZXR1cm4gY3VycmVudFN0eWxlTWFwLmNvbnRhaW5zKHN0eWxlTmFtZSk7XG4gICAgfVxuXG4gICAgc3R5bGVzQXNNYXAoc3R5bGVzKSB7XG4gICAgICAgIGlmICghc3R5bGVzIHx8IHN0eWxlcy5pbmRleE9mKFwiOlwiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWFwKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50U3R5bGVNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgY29uc3QgY3VycmVudFN0eWxlUGFpckxpc3QgPSBuZXcgTGlzdChTdHJpbmdVdGlscy50b0FycmF5KHN0eWxlcywgXCI7XCIpKTtcbiAgICAgICAgY3VycmVudFN0eWxlUGFpckxpc3QuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSB8fCB2YWx1ZS5pbmRleE9mKFwiOlwiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlZEtleSA9IHZhbHVlLnNwbGl0KFwiOlwiKVswXS50cmltKCk7XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlZFZhbHVlID0gdmFsdWUuc3BsaXQoXCI6XCIpWzFdLnRyaW0oKTtcbiAgICAgICAgICAgIGN1cnJlbnRTdHlsZU1hcC5zZXQocmVzb2x2ZWRLZXksIHJlc29sdmVkVmFsdWUpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgICByZXR1cm4gY3VycmVudFN0eWxlTWFwO1xuICAgIH1cblxufSIsImltcG9ydCB7IEFycmF5VXRpbHMsIExpc3QsIFN0cmluZ1V0aWxzIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XG5cbmV4cG9ydCBjbGFzcyBTdHlsZVNlbGVjdG9yQWNjZXNzb3Ige1xuICAgIFxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtCYXNlRWxlbWVudH1cbiAgICAgKiBAcmV0dXJuIHtTdHlsZVNlbGVjdG9yQWNjZXNzb3J9XG4gICAgICovXG4gICAgc3RhdGljIGZyb20oYmFzZUVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTdHlsZVNlbGVjdG9yQWNjZXNzb3IoYmFzZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGJhc2VFbGVtZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGJhc2VFbGVtZW50KSB7XG4gICAgICAgIC8qKiBAdHlwZSB7QmFzZUVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQgPSBiYXNlRWxlbWVudDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIFwiXCIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgXG4gICAgICovXG4gICAgdG9nZ2xlKGNzc0NsYXNzKSB7XG4gICAgICAgIGxldCBjdXJyZW50Q2xhc3MgPSB0aGlzLmJhc2VFbGVtZW50LmdldEF0dHJpYnV0ZVZhbHVlKFwiY2xhc3NcIik7XG4gICAgICAgIGxldCBjdXJyZW50Q2xhc3NBcnJheSA9IFN0cmluZ1V0aWxzLnRvQXJyYXkoY3VycmVudENsYXNzLCBcIiBcIik7XG4gICAgICAgIGxldCBjdXJyZW50Q2xhc3NMaXN0ID0gbmV3IExpc3QoY3VycmVudENsYXNzQXJyYXkpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGN1cnJlbnRDbGFzc0xpc3QuY29udGFpbnMoY3NzQ2xhc3MpKSB7XG4gICAgICAgICAgICBjdXJyZW50Q2xhc3NMaXN0LnJlbW92ZShjc3NDbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50Q2xhc3NMaXN0LmFkZChjc3NDbGFzcyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHRoaXMuYmFzZUVsZW1lbnQuc2V0QXR0cmlidXRlVmFsdWUoXCJjbGFzc1wiLCBBcnJheVV0aWxzLnRvU3RyaW5nKGN1cnJlbnRDbGFzc0xpc3QuZ2V0QXJyYXkoKSwgXCIgXCIpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIFxuICAgICAqL1xuICAgIGVuYWJsZShjc3NDbGFzcykge1xuICAgICAgICBsZXQgY3VycmVudENsYXNzID0gdGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzQXJyYXkgPSBTdHJpbmdVdGlscy50b0FycmF5KGN1cnJlbnRDbGFzcywgXCIgXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzTGlzdCA9IG5ldyBMaXN0KGN1cnJlbnRDbGFzc0FycmF5KTtcbiAgICAgICAgXG4gICAgICAgIGlmICghY3VycmVudENsYXNzTGlzdC5jb250YWlucyhjc3NDbGFzcykpIHtcbiAgICAgICAgICAgIGN1cnJlbnRDbGFzc0xpc3QuYWRkKGNzc0NsYXNzKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIEFycmF5VXRpbHMudG9TdHJpbmcoY3VycmVudENsYXNzTGlzdC5nZXRBcnJheSgpLCBcIiBcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgXG4gICAgICovXG4gICAgZGlzYWJsZShjc3NDbGFzcykge1xuICAgICAgICBsZXQgY3VycmVudENsYXNzID0gdGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzQXJyYXkgPSBTdHJpbmdVdGlscy50b0FycmF5KGN1cnJlbnRDbGFzcywgXCIgXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzTGlzdCA9IG5ldyBMaXN0KGN1cnJlbnRDbGFzc0FycmF5KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChjdXJyZW50Q2xhc3NMaXN0LmNvbnRhaW5zKGNzc0NsYXNzKSkge1xuICAgICAgICAgICAgY3VycmVudENsYXNzTGlzdC5yZW1vdmUoY3NzQ2xhc3MpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5iYXNlRWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsIEFycmF5VXRpbHMudG9TdHJpbmcoY3VycmVudENsYXNzTGlzdC5nZXRBcnJheSgpLCBcIiBcIikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3NSZW1vdmFsUHJlZml4IFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBjc3NDbGFzc1xuICAgICAqL1xuICAgIHJlcGxhY2UoY3NzQ2xhc3NSZW1vdmFsUHJlZml4LCBjc3NDbGFzcykge1xuICAgICAgICBsZXQgY3VycmVudENsYXNzID0gdGhpcy5iYXNlRWxlbWVudC5nZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzQXJyYXkgPSBTdHJpbmdVdGlscy50b0FycmF5KGN1cnJlbnRDbGFzcywgXCIgXCIpO1xuICAgICAgICBsZXQgY3VycmVudENsYXNzTGlzdCA9IG5ldyBMaXN0KGN1cnJlbnRDbGFzc0FycmF5KTtcbiAgICAgICAgbGV0IHRvUmVtb3ZlQXJyYXkgPSBbXTtcblxuICAgICAgICBpZiAoIVN0cmluZ1V0aWxzLmlzQmxhbmsoY3NzQ2xhc3NSZW1vdmFsUHJlZml4KSkge1xuICAgICAgICAgICAgY3VycmVudENsYXNzTGlzdC5mb3JFYWNoKCh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5zdGFydHNXaXRoKGNzc0NsYXNzUmVtb3ZhbFByZWZpeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9SZW1vdmVBcnJheS5wdXNoKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvUmVtb3ZlQXJyYXkuZm9yRWFjaCgodG9SZW1vdmVWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgY3VycmVudENsYXNzTGlzdC5yZW1vdmUodG9SZW1vdmVWYWx1ZSlcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY3VycmVudENsYXNzTGlzdC5hZGQoY3NzQ2xhc3MpO1xuICAgICAgICB0aGlzLmJhc2VFbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiY2xhc3NcIiwgQXJyYXlVdGlscy50b1N0cmluZyhjdXJyZW50Q2xhc3NMaXN0LmdldEFycmF5KCksIFwiIFwiKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIFxuXG59Il0sIm5hbWVzIjpbIkxPRyIsIkxvZ2dlciIsIkxpc3QiLCJQcm9wZXJ0eUFjY2Vzc29yIiwiTWV0aG9kIiwiQ29udGFpbmVySHR0cENsaWVudCIsIkNvbnRhaW5lclVwbG9hZERhdGEiLCJNYXAiLCJTdHJpbmdVdGlscyIsIlhtbEVsZW1lbnQiLCJDb250YWluZXJFbGVtZW50VXRpbHMiLCJDb250YWluZXJFbGVtZW50IiwiQ29udGFpbmVyRG93bmxvYWQiLCJDb250YWluZXJVcmwiLCJJbmplY3Rpb25Qb2ludCIsIk1pbmRpSW5qZWN0b3IiLCJBcnJheVV0aWxzIiwiQ29udGFpbmVyVGV4dCIsIlhtbENkYXRhIiwiQ29udGFpbmVyV2luZG93IiwiRG9tVHJlZSIsIk1pbmRpQ29uZmlnIiwiU2luZ2xldG9uQ29uZmlnIiwiUHJvdG90eXBlQ29uZmlnIiwiSW5zdGFuY2VQb3N0Q29uZmlnVHJpZ2dlciIsIkNvbmZpZ0FjY2Vzc29yIiwiUmFkaXhVdGlscyIsIk1hY1V0aWxzIiwiTWFwVXRpbHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLE1BQU1BLEtBQUcsR0FBRyxJQUFJQyxrQkFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDNUM7QUFDTyxNQUFNLGlCQUFpQixDQUFDO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLENBQUMsY0FBYyxHQUFHLEtBQUssRUFBRSxPQUFPLEdBQUcsSUFBSSxFQUFFO0FBQ3hELFFBQVEsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUlDLGdCQUFJLEVBQUUsQ0FBQztBQUM1QyxRQUFRLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJQSxnQkFBSSxFQUFFLENBQUM7QUFDOUMsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztBQUM3QyxRQUFRLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBQy9CLEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxHQUFHO0FBQ2IsUUFBUSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUM1QixRQUFRLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFO0FBQzVCLFlBQVksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3pCLFNBQVMsTUFBTTtBQUNmLFlBQVksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzNCLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sR0FBRztBQUNkLFFBQVEsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztBQUMzQztBQUNBLFFBQVEsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3JCLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDN0IsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLFFBQVEsQ0FBQztBQUN2QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sR0FBRztBQUNkLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDM0IsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTO0FBQ1QsUUFBUSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7QUFDbkMsS0FBSztBQUNMO0FBQ0EsQ0FBQyxLQUFLLEdBQUc7QUFDVCxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQzNCLFlBQVksT0FBTztBQUNuQixTQUFTO0FBQ1QsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztBQUNuQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7QUFDcEMsWUFBWUYsS0FBRyxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ2hELFlBQVksT0FBTztBQUNuQixTQUFTO0FBQ1QsUUFBUSxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sS0FBSztBQUMxRCxZQUFZLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN6QixZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNqQixFQUFFO0FBQ0Y7QUFDQSxDQUFDLE9BQU8sR0FBRztBQUNYLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7QUFDM0IsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0FBQ3BDLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtBQUN0QyxZQUFZQSxLQUFHLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFDbEQsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxLQUFLO0FBQzVELFlBQVksS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3pCLFlBQVksT0FBTyxJQUFJLENBQUM7QUFDeEIsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2pCLEVBQUU7QUFDRjtBQUNBLENBQUMsV0FBVyxHQUFHO0FBQ2YsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztBQUNuQyxFQUFFO0FBQ0Y7QUFDQSxDQUFDLGFBQWEsR0FBRztBQUNqQixRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0FBQ3BDLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLEVBQUU7QUFDbEMsRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzVDLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDZCxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsbUJBQW1CLENBQUMsZUFBZSxFQUFFO0FBQ3RDLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNoRCxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQ2QsRUFBRTtBQUNGO0FBQ0E7O0FDN0ZPLE1BQU0sdUJBQXVCLFNBQVMsaUJBQWlCLENBQUM7QUFDL0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxFQUFFLGdCQUFnQixHQUFHLEtBQUssRUFBRSxLQUFLLEdBQUcsSUFBSSxFQUFFLGFBQWEsR0FBRyxJQUFJLEVBQUU7QUFDakcsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMxQjtBQUNBO0FBQ0EsRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUM3QjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUMzQjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztBQUMzQyxFQUFFO0FBQ0Y7QUFDQSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDaEIsRUFBRSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDaEMsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbEIsR0FBRyxNQUFNLEdBQUcsS0FBSyxLQUFLRyw0QkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDaEYsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDbkIsR0FBRyxNQUFNO0FBQ1QsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbEIsR0FBRztBQUNILEVBQUU7QUFDRjtBQUNBLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztBQUN0QixFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNoQyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUN4QixHQUFHLE1BQU0sR0FBRyxLQUFLLEtBQUtBLDRCQUFnQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNoRixNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN6QixHQUFHLE1BQU07QUFDVCxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUN4QixHQUFHO0FBQ0gsRUFBRTtBQUNGO0FBQ0E7O0FDekNPLE1BQU0scUJBQXFCLFNBQVMsaUJBQWlCLENBQUM7QUFDN0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxFQUFFLGdCQUFnQixHQUFHLEtBQUssRUFBRSxZQUFZLEdBQUcsSUFBSSxFQUFFO0FBQ2xGLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDMUI7QUFDQTtBQUNBLEVBQUUsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDN0I7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7QUFDekMsRUFBRTtBQUNGO0FBQ0EsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO0FBQ2hCLEVBQUUsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2hDLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2xCLEdBQUcsTUFBTSxHQUFHLEtBQUssS0FBSyxZQUFZLENBQUM7QUFDbkMsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDbkIsR0FBRyxNQUFNO0FBQ1QsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbEIsR0FBRztBQUNILEVBQUU7QUFDRjtBQUNBLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztBQUN0QixFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNoQyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUN4QixHQUFHLE1BQU0sR0FBRyxLQUFLLEtBQUssWUFBWSxDQUFDO0FBQ25DLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3pCLEdBQUcsTUFBTTtBQUNULEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQ3hCLEdBQUc7QUFDSCxFQUFFO0FBQ0Y7QUFDQTs7QUN2Q08sTUFBTSxjQUFjLFNBQVMsaUJBQWlCLENBQUM7QUFDdEQ7QUFDQSxJQUFJLFdBQVcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxFQUFFLGdCQUFnQixHQUFHLEtBQUssRUFBRSxLQUFLLEdBQUcsTUFBTSxFQUFFO0FBQzdFLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDMUIsRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUM3QixRQUFRLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQzNCLEtBQUs7QUFDTDtBQUNBLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztBQUNoQixFQUFFLElBQUksS0FBSyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNwRSxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNuQixHQUFHLE1BQU07QUFDVCxHQUFHLEdBQUcsQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2pDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2pCLElBQUksTUFBTTtBQUNWLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ25CLElBQUk7QUFDSixHQUFHO0FBQ0gsRUFBRTtBQUNGO0FBQ0EsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO0FBQ3RCLEVBQUUsSUFBSSxLQUFLLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BFLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3pCLEdBQUcsTUFBTTtBQUNULEdBQUcsR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDakMsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkIsSUFBSSxNQUFNO0FBQ1YsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7QUFDekIsSUFBSTtBQUNKLEdBQUc7QUFDSCxFQUFFO0FBQ0Y7QUFDQTs7QUMvQk8sTUFBTSxlQUFlLFNBQVMsY0FBYyxDQUFDO0FBQ3BEO0FBQ0EsSUFBSSxPQUFPLFlBQVksR0FBRyxPQUFPLENBQUM7QUFDbEM7QUFDQSxJQUFJLFdBQVcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxFQUFFLGdCQUFnQixHQUFHLEtBQUssRUFBRTtBQUM3RCxRQUFRLEtBQUssQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3pFLEtBQUs7QUFDTDtBQUNBOztBQ1JPLE1BQU0sY0FBYyxTQUFTLGlCQUFpQixDQUFDO0FBQ3REO0FBQ0EsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxFQUFFO0FBQzFDLFFBQVEsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDaEMsUUFBUSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUlELGdCQUFJLEVBQUUsQ0FBQztBQUN4QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUU7QUFDN0IsUUFBUSxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSUUsa0JBQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDckUsUUFBUSxTQUFTLENBQUMsbUJBQW1CLENBQUMsSUFBSUEsa0JBQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDekUsUUFBUSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMxQyxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksUUFBUSxHQUFHO0FBQ2YsUUFBUSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDdEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxVQUFVLEdBQUc7QUFDakIsUUFBUSxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDL0IsUUFBUSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUs7QUFDckQsWUFBWSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRTtBQUNoQyxnQkFBZ0IsVUFBVSxHQUFHLElBQUksQ0FBQztBQUNsQyxnQkFBZ0IsT0FBTyxLQUFLLENBQUM7QUFDN0IsYUFBYTtBQUNiLFlBQVksT0FBTyxJQUFJLENBQUM7QUFDeEIsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2pCLFFBQVEsR0FBRyxVQUFVLEVBQUU7QUFDdkIsWUFBWSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDMUIsU0FBUyxNQUFNO0FBQ2YsWUFBWSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDNUIsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBOztBQzlDTyxNQUFNLGFBQWEsQ0FBQztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLFNBQVMsRUFBRTtBQUMzQjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUNuQztBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDcEMsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksYUFBYSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDOUIsUUFBUSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDeEMsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksUUFBUSxHQUFHO0FBQ2YsUUFBUSxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDNUIsUUFBUSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEtBQUs7QUFDaEQsWUFBWSxVQUFVLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEQsU0FBUyxDQUFDLENBQUM7QUFDWCxRQUFRLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRCxLQUFLO0FBQ0w7QUFDQTs7QUNsQ08sTUFBTSxVQUFVLENBQUM7QUFDeEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLEtBQUssRUFBRTtBQUN2QjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUMzQjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDO0FBQ3JDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFlBQVksQ0FBQyxhQUFhLEVBQUU7QUFDaEMsUUFBUSxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ25ELFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFFBQVEsR0FBRztBQUNmLFFBQVEsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQzdCLFFBQVEsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBSztBQUNuRCxZQUFZLFdBQVcsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ25ELFNBQVMsQ0FBQyxDQUFDO0FBQ1gsUUFBUSxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEQsS0FBSztBQUNMO0FBQ0E7O0FDdkNPLE1BQU0sVUFBVSxDQUFDO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxZQUFZLENBQUM7QUFDN0I7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7QUFDekMsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxlQUFlLEVBQUU7QUFDckIsUUFBUSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDakMsS0FBSztBQUNMO0FBQ0E7O0FDZk8sTUFBTSxpQkFBaUIsQ0FBQztBQUMvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLE1BQU0sR0FBRztBQUNwQixRQUFRLE9BQU8sSUFBSSxpQkFBaUIsRUFBRSxDQUFDO0FBQ3ZDLEtBQUs7QUFDTDtBQUNBLElBQUksV0FBVyxHQUFHO0FBQ2xCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUM7QUFDckM7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDN0I7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFDOUI7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDNUI7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7QUFDbEM7QUFDQSxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksR0FBRztBQUNYLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDN0IsWUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDbEQsU0FBUztBQUNULFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQzVCLFlBQVksSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtBQUN2QyxnQkFBZ0IsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ2xELGFBQWE7QUFDYixZQUFZLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMxQyxTQUFTO0FBQ1QsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssR0FBRztBQUNaLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtBQUNuQyxZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUNuRCxTQUFTO0FBQ1QsUUFBUSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDMUMsUUFBUSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztBQUNsQyxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsRUFBRTtBQUNoQyxRQUFRLE1BQU0sT0FBTyxHQUFHLElBQUksYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDN0QsUUFBUSxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssSUFBSSxFQUFFO0FBQ25DLFlBQVksSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNsRCxTQUFTLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxZQUFZLFVBQVUsRUFBRTtBQUN0RCxZQUFZLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzFELFNBQVMsTUFBTTtBQUNmLFlBQVksTUFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLGlEQUFpRCxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JHLFNBQVM7QUFDVCxRQUFRLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDO0FBQ2pDLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0EsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFO0FBQ3pCLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtBQUNuQyxZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0FBQ3JGLFNBQVM7QUFDVCxRQUFRLE1BQU0sT0FBTyxHQUFHLElBQUksVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3RELFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdEMsUUFBUSxJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztBQUNqQyxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUU7QUFDM0IsUUFBUSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sWUFBWSxhQUFhLENBQUMsRUFBRTtBQUN0RCxZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMsQ0FBQywyQ0FBMkMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEYsU0FBUztBQUNULFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3BELFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLEtBQUssR0FBRztBQUNaLFFBQVEsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBQzlCLFFBQVEsSUFBSSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDLGFBQWEsS0FBSztBQUMzRCxZQUFZLFlBQVksSUFBSSxhQUFhLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQzVELFNBQVMsQ0FBQyxDQUFDO0FBQ1gsUUFBUSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsS0FBSztBQUNoRCxZQUFZLFlBQVksSUFBSSxVQUFVLENBQUMsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ3pELFNBQVMsQ0FBQyxDQUFDO0FBQ1gsUUFBUSxPQUFPLElBQUksVUFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzVDLEtBQUs7QUFDTDtBQUNBOztBQ2hIQTtBQUNBO0FBQ08sTUFBTSxRQUFRO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxjQUFjLENBQUM7QUFDL0I7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7QUFDN0MsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxpQkFBaUIsRUFBRTtBQUN2QixRQUFRLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztBQUNuQyxLQUFLO0FBQ0w7QUFDQTs7QUNsQk8sTUFBTSxNQUFNLENBQUM7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLGFBQWEsR0FBRyxJQUFJLEVBQUUsT0FBTyxHQUFHLElBQUksRUFBRSxRQUFRLEdBQUcsS0FBSyxFQUFFO0FBQzVFLFFBQVEsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN4RCxRQUFRLE1BQU0sTUFBTSxJQUFJO0FBQ3hCLFlBQVksT0FBTyxFQUFFLE9BQU87QUFDNUIsWUFBWSxNQUFNLEVBQUUsS0FBSztBQUN6QixZQUFZLElBQUksRUFBRSxNQUFNO0FBQ3hCLFlBQVksUUFBUSxFQUFFLFFBQVE7QUFDOUIsVUFBUztBQUNULFFBQVEsSUFBSSxRQUFRLEVBQUU7QUFDdEIsWUFBWSxPQUFPQyxzQ0FBbUIsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNqRixTQUFTO0FBQ1QsUUFBUSxPQUFPQSxzQ0FBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMxRSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsYUFBYSxHQUFHLElBQUksRUFBRSxxQkFBcUIsR0FBRyxJQUFJLEVBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztBQUM5RixRQUFRLElBQUksSUFBSSxZQUFZQyxzQ0FBbUIsRUFBRTtBQUNqRCxZQUFZLE9BQU9ELHNDQUFtQixDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUscUJBQXFCLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDaEgsU0FBUztBQUNULFFBQVEsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN4RCxRQUFRLE1BQU0sTUFBTSxJQUFJO0FBQ3hCLFlBQVksSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQ3RDLFlBQVksT0FBTyxFQUFFLE9BQU87QUFDNUIsWUFBWSxNQUFNLEVBQUUsTUFBTTtBQUMxQixZQUFZLElBQUksRUFBRSxNQUFNO0FBQ3hCLFlBQVksUUFBUSxFQUFFLFFBQVE7QUFDOUIsVUFBUztBQUNULFFBQVEsT0FBT0Esc0NBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDMUUsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLGFBQWEsR0FBRyxJQUFJLEVBQUUscUJBQXFCLEdBQUcsSUFBSSxFQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDN0YsUUFBUSxJQUFJLElBQUksWUFBWUMsc0NBQW1CLEVBQUU7QUFDakQsWUFBWSxPQUFPRCxzQ0FBbUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLHFCQUFxQixFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQy9HLFNBQVM7QUFDVCxRQUFRLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDeEQsUUFBUSxNQUFNLE1BQU0sSUFBSTtBQUN4QixZQUFZLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztBQUN0QyxZQUFZLE1BQU0sRUFBRSxLQUFLO0FBQ3pCLFlBQVksSUFBSSxFQUFFLE1BQU07QUFDeEIsWUFBWSxRQUFRLEVBQUUsUUFBUTtBQUM5QixZQUFZLE9BQU8sRUFBRSxPQUFPO0FBQzVCLFVBQVM7QUFDVCxRQUFRLE9BQU9BLHNDQUFtQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzFFLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxhQUFhLEdBQUcsSUFBSSxFQUFFLHFCQUFxQixHQUFHLElBQUksRUFBRSxPQUFPLEdBQUcsSUFBSSxFQUFFO0FBQ2hHLFFBQVEsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN4RCxRQUFRLE1BQU0sTUFBTSxJQUFJO0FBQ3hCLFlBQVksSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQ3RDLFlBQVksTUFBTSxFQUFFLE9BQU87QUFDM0IsWUFBWSxJQUFJLEVBQUUsTUFBTTtBQUN4QixZQUFZLFFBQVEsRUFBRSxRQUFRO0FBQzlCLFlBQVksT0FBTyxFQUFFLE9BQU87QUFDNUIsVUFBUztBQUNULFFBQVEsT0FBT0Esc0NBQW1CLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDMUUsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLGFBQWEsR0FBRyxJQUFJLEVBQUUscUJBQXFCLEdBQUcsSUFBSSxFQUFFLE9BQU8sR0FBRyxJQUFJLEVBQUU7QUFDakcsUUFBUSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3hELFFBQVEsSUFBSSxJQUFJLEVBQUU7QUFDbEIsWUFBWSxNQUFNLE1BQU0sSUFBSTtBQUM1QixnQkFBZ0IsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQzFDLGdCQUFnQixNQUFNLEVBQUUsUUFBUTtBQUNoQyxnQkFBZ0IsSUFBSSxFQUFFLE1BQU07QUFDNUIsZ0JBQWdCLFFBQVEsRUFBRSxRQUFRO0FBQ2xDLGdCQUFnQixPQUFPLEVBQUUsT0FBTztBQUNoQyxjQUFhO0FBQ2IsWUFBWSxPQUFPQSxzQ0FBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM5RSxTQUFTLE1BQU07QUFDZixZQUFZLE1BQU0sTUFBTSxJQUFJO0FBQzVCLGdCQUFnQixNQUFNLEVBQUUsUUFBUTtBQUNoQyxnQkFBZ0IsSUFBSSxFQUFFLE1BQU07QUFDNUIsZ0JBQWdCLFFBQVEsRUFBRSxRQUFRO0FBQ2xDLGdCQUFnQixPQUFPLEVBQUUsT0FBTztBQUNoQyxjQUFhO0FBQ2IsWUFBWSxPQUFPQSxzQ0FBbUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM5RSxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFNBQVMsQ0FBQyxhQUFhLEdBQUcsSUFBSSxFQUFFO0FBQzNDLFFBQVEsSUFBSSxhQUFhLEVBQUU7QUFDM0IsWUFBWSxPQUFPO0FBQ25CLGdCQUFnQixZQUFZLEVBQUUseUJBQXlCO0FBQ3ZELGdCQUFnQixjQUFjLEVBQUUsa0JBQWtCO0FBQ2xELGdCQUFnQixlQUFlLEVBQUUsYUFBYTtBQUM5QyxhQUFhO0FBQ2IsU0FBUztBQUNULFFBQVEsT0FBTztBQUNmLFlBQVksWUFBWSxFQUFFLHlCQUF5QjtBQUNuRCxZQUFZLGNBQWMsRUFBRSxrQkFBa0I7QUFDOUMsU0FBUyxDQUFDO0FBQ1YsS0FBSztBQUNMOztBQ3pJTyxNQUFNLEdBQUc7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxDQUFDO0FBQy9FO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDO0FBQ3ZDO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQy9CO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQy9CO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO0FBQzNDO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztBQUNuRDtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQztBQUNuQztBQUNBLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDakMsWUFBWSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUlILGdCQUFJLEVBQUUsQ0FBQztBQUM1QyxTQUFTO0FBQ1QsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQ3JDLFlBQVksSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUlLLGVBQUcsRUFBRSxDQUFDO0FBQy9DLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksUUFBUSxFQUFFO0FBQ2xCLFFBQVEsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO0FBQ25DLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDZCxRQUFRLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUMvQixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksSUFBSSxFQUFFO0FBQ2QsUUFBUSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDL0IsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLFNBQVMsRUFBRTtBQUNuQixRQUFRLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztBQUNsQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksTUFBTSxFQUFFO0FBQ2hCLFFBQVEsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ2pDLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxZQUFZLEdBQUc7QUFDdkIsUUFBUSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztBQUN0QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUM7QUFDdEIsUUFBUSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdDLEtBQUs7QUFDTDtBQUNBLElBQUksZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztBQUM5QixRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsQixRQUFRLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEVBQUU7QUFDOUMsWUFBWSxJQUFJQyx1QkFBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUM1RSxnQkFBZ0IsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzlDLGdCQUFnQixPQUFPLElBQUksQ0FBQztBQUM1QixhQUFhO0FBQ2IsWUFBWSxDQUFDLEdBQUcsQ0FBQztBQUNqQixTQUFTO0FBQ1QsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksSUFBSSxFQUFFO0FBQ2QsUUFBUSxJQUFJLElBQUksR0FBRyxHQUFHLENBQUM7QUFDdkIsUUFBUSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDekIsUUFBUSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxLQUFLLElBQUk7QUFDN0MsWUFBWSxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ3hCLGdCQUFnQixJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUNsQyxhQUFhO0FBQ2IsWUFBWSxJQUFJLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNoQyxZQUFZLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDMUIsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQ2xCLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0EsSUFBSSxZQUFZLENBQUMsR0FBRyxFQUFFO0FBQ3RCLFFBQVEsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMxQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLFFBQVEsRUFBRTtBQUNkLFFBQVEsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQztBQUNsQyxZQUFZLEtBQUssR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDakQsU0FBUztBQUNULFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQztBQUM5QixZQUFZLEtBQUssR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUN0QyxTQUFTO0FBQ1QsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDO0FBQzlCLFlBQVksS0FBSyxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztBQUM1QyxTQUFTO0FBQ1Q7QUFDQSxRQUFRLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFNBQVMsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUM1RCxZQUFZLEtBQUssR0FBRyxLQUFLLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQztBQUMzQyxZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoQjtBQUNBLFFBQVEsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQ2xDO0FBQ0EsUUFBUSxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxTQUFTLFlBQVksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDO0FBQzlFLFlBQVksR0FBRyxjQUFjLENBQUM7QUFDOUIsZ0JBQWdCLGNBQWMsQ0FBQyxLQUFLLENBQUM7QUFDckMsZ0JBQWdCLEtBQUssR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLGFBQWEsS0FBSTtBQUNqQixnQkFBZ0IsS0FBSyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDcEMsYUFBYTtBQUNiLFlBQVksS0FBSyxHQUFHLEtBQUssR0FBRyxTQUFTLENBQUMsWUFBWSxDQUFDLEdBQUcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN0RixTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEI7QUFDQSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLEVBQUU7QUFDakMsWUFBWSxLQUFLLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzlDLFNBQVM7QUFDVCxRQUFRLE9BQU8sS0FBSyxDQUFDO0FBQ3JCLEtBQUs7QUFDTDtBQUNBOztBQ2xJTyxNQUFNLFFBQVEsQ0FBQztBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sS0FBSyxDQUFDLFNBQVMsRUFBRTtBQUM1QjtBQUNBLFFBQVEsSUFBSSxTQUFTLEdBQUcsRUFBRSxRQUFRLEdBQUcsU0FBUyxFQUFFLENBQUM7QUFDakQ7QUFDQSxRQUFRLElBQUksU0FBUyxLQUFLLElBQUksRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUU7QUFDaEQ7QUFDQSxRQUFRLE1BQU0sUUFBUSxRQUFRLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNwRSxRQUFRLE1BQU0sV0FBVyxLQUFLLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN2RSxRQUFRLE1BQU0sSUFBSSxZQUFZLFFBQVEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDaEUsUUFBUSxNQUFNLElBQUksWUFBWSxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ2hFLFFBQVEsTUFBTSxTQUFTLE9BQU8sUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoRSxRQUFRLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN0RSxRQUFRLE1BQU0sUUFBUSxRQUFRLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNwRTtBQUNBLFFBQVEsT0FBTyxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ2pGLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7QUFDdkMsUUFBUSxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDeEM7QUFDQSxRQUFRLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDcEIsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTO0FBQ1Q7QUFDQSxRQUFRLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztBQUM3QjtBQUNBLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDO0FBQ0EsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTO0FBQ1Q7QUFDQSxRQUFRLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEMsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDeEM7QUFDQSxZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVM7QUFDVDtBQUNBLFFBQVEsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixRQUFRLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7QUFDOUIsWUFBWSxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3ZDLFNBQVMsTUFBTTtBQUNmLFlBQVksU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNyRSxTQUFTO0FBQ1Q7QUFDQSxRQUFRLE9BQU8sUUFBUSxDQUFDO0FBQ3hCLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxvQkFBb0IsQ0FBQyxTQUFTLENBQUM7QUFDMUMsUUFBUSxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDeEM7QUFDQSxRQUFRLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDcEIsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTO0FBQ1Q7QUFDQSxRQUFRLElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQztBQUNoQyxRQUFRLElBQUksZUFBZSxHQUFHLElBQUksQ0FBQztBQUNuQztBQUNBLFFBQVEsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQzdDO0FBQ0EsWUFBWSxXQUFXLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNwRCxZQUFZLGVBQWUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDbkUsU0FBUztBQUNUO0FBQ0EsUUFBUSxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsZUFBZSxDQUFDO0FBQzlDLFFBQVEsT0FBTyxXQUFXLENBQUM7QUFDM0IsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFdBQVcsQ0FBQyxXQUFXLENBQUM7QUFDbkMsUUFBUSxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQzFCLFlBQVksT0FBTyxJQUFJLENBQUM7QUFDeEIsU0FBUztBQUNULFFBQVEsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzNDLFlBQVksT0FBTyxXQUFXLENBQUM7QUFDL0IsU0FBUztBQUNULFFBQVEsT0FBTyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pDLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxXQUFXLENBQUMsV0FBVyxDQUFDO0FBQ25DLFFBQVEsSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUMxQixZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVM7QUFDVCxRQUFRLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMzQyxZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVM7QUFDVCxRQUFRLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sYUFBYSxDQUFDLFNBQVMsQ0FBQztBQUNuQyxRQUFRLElBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN4QztBQUNBLFFBQVEsSUFBSSxDQUFDLEtBQUssRUFBRTtBQUNwQixZQUFZLE9BQU8sSUFBSU4sZ0JBQUksRUFBRSxDQUFDO0FBQzlCLFNBQVM7QUFDVDtBQUNBLFFBQVEsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQ3pCO0FBQ0EsUUFBUSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDckMsWUFBWSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hDLFlBQVksSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNsQyxnQkFBZ0IsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLGFBQWE7QUFDYixZQUFZLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUI7QUFDQSxTQUFTLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzVDLFlBQVksSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN4QyxZQUFZLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDbEMsZ0JBQWdCLFNBQVMsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4RSxhQUFhO0FBQ2IsWUFBWSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCO0FBQ0EsU0FBUyxNQUFNO0FBQ2YsWUFBWSxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3ZDLFNBQVM7QUFDVDtBQUNBLFFBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ2xDLFlBQVksSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdEMsU0FBUztBQUNUO0FBQ0EsUUFBUSxNQUFNLGVBQWUsR0FBRyxJQUFJQSxnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMxRDtBQUNBLFFBQVEsTUFBTSxhQUFhLEdBQUcsSUFBSUEsZ0JBQUksRUFBRSxDQUFDO0FBQ3pDLFFBQVEsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBSztBQUMzQyxZQUFZLGFBQWEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDaEQsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDakI7QUFDQSxRQUFRLE9BQU8sYUFBYSxDQUFDO0FBQzdCLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxtQkFBbUIsQ0FBQyxTQUFTLENBQUM7QUFDekMsUUFBUSxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDMUM7QUFDQSxRQUFRLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDcEIsWUFBWSxPQUFPLElBQUlLLGVBQUcsRUFBRSxDQUFDO0FBQzdCLFNBQVM7QUFDVDtBQUNBLFFBQVEsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQy9CO0FBQ0EsUUFBUSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDM0MsWUFBWSxPQUFPLElBQUlBLGVBQUcsRUFBRSxDQUFDO0FBQzdCLFNBQVM7QUFDVCxRQUFRLFVBQVUsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckUsUUFBUSxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDM0MsWUFBWSxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDaEYsWUFBWSxVQUFVLEdBQUcsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3pFLFNBQVMsTUFBTTtBQUNmLFlBQVksU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN2QyxTQUFTO0FBQ1Q7QUFDQSxRQUFRLE1BQU0saUJBQWlCLEdBQUcsSUFBSUwsZ0JBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDbEUsUUFBUSxNQUFNLFlBQVksR0FBRyxJQUFJSyxlQUFHLEVBQUUsQ0FBQztBQUN2QyxRQUFRLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBSztBQUM3QyxZQUFZLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDNUMsWUFBWSxHQUFHLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO0FBQ3BDLGdCQUFnQixZQUFZLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoRixhQUFhO0FBQ2IsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDakI7QUFDQSxRQUFRLE9BQU8sWUFBWSxDQUFDO0FBQzVCLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7QUFDdkMsUUFBUSxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDeEM7QUFDQSxRQUFRLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDcEIsWUFBWSxTQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3ZDLFlBQVksT0FBTyxJQUFJLENBQUM7QUFDeEIsU0FBUztBQUNUO0FBQ0EsUUFBUSxJQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDN0IsUUFBUSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDdEMsWUFBWSxRQUFRLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdELFlBQVksU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN2QyxTQUFTO0FBQ1QsUUFBUSxPQUFPLFFBQVEsQ0FBQztBQUN4QixLQUFLO0FBQ0w7QUFDQTtBQUNBOztBQzdMQTtBQU9BO0FBQ0EsTUFBTVAsS0FBRyxHQUFHLElBQUlDLGtCQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUMzQztBQUNPLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUI7QUFDQSxJQUFJLFdBQVcsRUFBRTtBQUNqQjtBQUNBLFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ3JDO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUN4QztBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0FBQ25DO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQzdCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQ25DLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxpQkFBaUIsQ0FBQyxjQUFjLEVBQUU7QUFDdEMsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztBQUM3QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztBQUMxQixRQUFRLEdBQUcsR0FBRyxLQUFLLFNBQVMsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO0FBQzlDLFlBQVksSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQy9DLFNBQVM7QUFDVCxRQUFRLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztBQUM3QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQztBQUNiLFFBQVEsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMxQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQztBQUNsQixRQUFRLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDeEMsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTO0FBQ1QsUUFBUSxPQUFPLEtBQUssQ0FBQztBQUNyQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUNsQixRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQ2pDLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQztBQUN4QixRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxDQUFDLFFBQVEsS0FBSyxTQUFTLEtBQUssUUFBUSxDQUFDLGlCQUFpQixLQUFLLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbkksWUFBWSxJQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO0FBQ2pELFlBQVksUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckMsWUFBWSxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDaEMsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDMUIsUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLEtBQUssSUFBSSxFQUFFO0FBQ3pDLFlBQVksR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPO0FBQ2pDLGdCQUFnQixJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUc7QUFDekMsZ0JBQWdCLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFO0FBQ3ZDLGFBQWEsQ0FBQztBQUNkLFNBQVM7QUFDVCxRQUFRLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDO0FBQ2xDLFFBQVEsTUFBTSxRQUFRLEdBQUcsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9DLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7QUFDeEIsWUFBWSxNQUFNLDhCQUE4QixHQUFHLElBQUksR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO0FBQ3ZFLFNBQVM7QUFDVCxRQUFRLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzNDLFFBQVEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDOUMsUUFBUSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlCLEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSx5QkFBeUIsQ0FBQyxVQUFVLEVBQUU7QUFDaEQ7QUFDQSxRQUFRLEdBQUcsQ0FBQyxVQUFVLElBQUksVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7QUFDbEQsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTO0FBQ1QsUUFBUSxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7QUFDOUIsUUFBUSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDNUIsUUFBUSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsS0FBSztBQUMzQyxZQUFZLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNyQyxnQkFBZ0IsT0FBTztBQUN2QixhQUFhO0FBQ2IsWUFBWSxJQUFJO0FBQ2hCLGdCQUFnQixZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xGLGFBQWEsQ0FBQyxNQUFNLE1BQU0sRUFBRTtBQUM1QixnQkFBZ0IsTUFBTSxNQUFNLENBQUM7QUFDN0IsYUFBYTtBQUNiLFNBQVMsQ0FBQyxDQUFDO0FBQ1gsUUFBUSxPQUFPLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMvQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxNQUFNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO0FBQ2pDLFFBQVEsSUFBSSxJQUFJLENBQUMsY0FBYyxLQUFLLElBQUksRUFBRTtBQUMxQyxZQUFZLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTztBQUNqQyxnQkFBZ0IsSUFBSSxDQUFDLGNBQWMsR0FBRyxHQUFHO0FBQ3pDLGdCQUFnQixHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRTtBQUN2QyxhQUFhLENBQUM7QUFDZCxTQUFTO0FBQ1QsUUFBUUQsS0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZFLFFBQVEsTUFBTSxRQUFRLEdBQUcsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9DLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7QUFDekIsWUFBWSxNQUFNLDhCQUE4QixHQUFHLElBQUksR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO0FBQ3ZFLFNBQVM7QUFDVCxRQUFRLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzNDLFFBQVEsTUFBTSxRQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsUUFBUSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDdEMsUUFBUSxPQUFPLFFBQVEsQ0FBQztBQUN4QixLQUFLO0FBQ0w7O0FDdEpZLElBQUlDLGtCQUFNLENBQUMsb0JBQW9CLEVBQUU7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU0sZUFBZSxDQUFDO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLGdCQUFnQixFQUFFO0FBQ2xDO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztBQUNqRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3hCLFFBQVEsSUFBSSxXQUFXLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNwQyxRQUFRLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxLQUFLO0FBQ3BELFlBQVksSUFBSSxXQUFXLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRTtBQUN6RCxnQkFBZ0IsV0FBVyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzFHLGFBQWE7QUFDYixTQUFTLENBQUMsQ0FBQztBQUNYLFFBQVEsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMseUJBQXlCLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDNUUsS0FBSztBQUNMO0FBQ0E7O0FDcENPLE1BQU0sc0JBQXNCLENBQUM7QUFDcEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRTtBQUN6QjtBQUNBLFFBQVEsSUFBSSxDQUFDLE9BQU8sRUFBRTtBQUN0QixZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQztBQUNqRSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE9BQU8sQ0FBQztBQUN4QyxLQUFLO0FBQ0w7QUFDQTs7QUNiQSxNQUFNRCxLQUFHLEdBQUcsSUFBSUMsa0JBQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN2QztBQUNPLE1BQU0sWUFBWSxDQUFDO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sc0JBQXNCLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtBQUNqRCxRQUFRLElBQUksS0FBSyxZQUFZUSx1QkFBVSxFQUFFO0FBQ3pDLFlBQVksT0FBTyxZQUFZLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3BFLFNBQVM7QUFDVCxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO0FBQ3ZDLFlBQVksT0FBT0Msd0NBQXFCLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlELFNBQVM7QUFDVCxRQUFRLElBQUlBLHdDQUFxQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN0RCxZQUFZLE9BQU8sSUFBSUMsbUNBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDL0MsU0FBUztBQUNULFFBQVFYLEtBQUcsQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUNwRCxRQUFRQSxLQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pCLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sb0JBQW9CLENBQUMsVUFBVSxFQUFFLGFBQWEsRUFBRTtBQUMzRCxRQUFRLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztBQUMzQixRQUFRLElBQUksVUFBVSxDQUFDLFNBQVMsRUFBRTtBQUNsQyxZQUFZLE9BQU8sR0FBR1Usd0NBQXFCLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzFHLFNBQVMsTUFBTTtBQUNmLFlBQVksT0FBTyxHQUFHQSx3Q0FBcUIsQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNFLFNBQVM7QUFDVCxRQUFRLElBQUksYUFBYSxJQUFJLGFBQWEsQ0FBQyxnQkFBZ0IsS0FBSyxJQUFJLEVBQUU7QUFDdEUsWUFBWSxhQUFhLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2hFLFNBQVM7QUFDVCxRQUFRLFVBQVUsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxFQUFFLFNBQVMsS0FBSztBQUNuRSxZQUFZQSx3Q0FBcUIsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM1RixZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVMsQ0FBQyxDQUFDO0FBQ1gsUUFBUSxPQUFPLE9BQU8sQ0FBQztBQUN2QixLQUFLO0FBQ0w7QUFDQTs7QUNsRFksSUFBSVQsa0JBQU0sQ0FBQyxpQkFBaUIsRUFBRTtBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU0sZUFBZSxDQUFDO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxHQUFHLEVBQUU7QUFDckI7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdkI7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7QUFDbEM7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUlNLGVBQUcsRUFBRSxDQUFDO0FBQzNDO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSUEsZUFBRyxFQUFFLENBQUM7QUFDeEM7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsS0FBSyxLQUFLLEVBQUUsT0FBTyxLQUFLLENBQUMsRUFBRSxDQUFDO0FBQ2pFO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLENBQUM7QUFDM0M7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztBQUN6QztBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxDQUFDO0FBQzNDO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUM7QUFDdEM7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLFdBQVcsQ0FBQyxHQUFHLEVBQUU7QUFDNUIsUUFBUSxPQUFPLElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxjQUFjLEdBQUcsTUFBTSxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsRUFBRTtBQUNsRSxRQUFRLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQ3pELFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFVBQVUsR0FBRztBQUNqQixRQUFRLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDckMsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsY0FBYyxHQUFHLE1BQU0sRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFLEVBQUU7QUFDL0QsUUFBUSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDdEQsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxZQUFZLENBQUMsY0FBYyxFQUFFO0FBQ2pDLFFBQVEsSUFBSSxDQUFDLG9CQUFvQixHQUFHLGNBQWMsQ0FBQztBQUNuRCxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLG1CQUFtQixDQUFDLGFBQWEsRUFBRTtBQUN2QyxRQUFRLElBQUksQ0FBQ0MsdUJBQVcsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUU7QUFDakQsWUFBWSxJQUFJLENBQUMsYUFBYSxHQUFHLFNBQVMsR0FBRyxhQUFhLENBQUM7QUFDM0QsU0FBUztBQUNULFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksZ0JBQWdCLENBQUMsc0JBQXNCLEVBQUU7QUFDN0MsUUFBUSxJQUFJLENBQUMsc0JBQXNCLEdBQUcsc0JBQXNCLENBQUM7QUFDN0QsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxpQkFBaUIsQ0FBQyxzQkFBc0IsRUFBRTtBQUM5QyxRQUFRLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxzQkFBc0IsQ0FBQztBQUM3RCxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLGVBQWUsQ0FBQyxvQkFBb0IsRUFBRTtBQUMxQyxRQUFRLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxvQkFBb0IsQ0FBQztBQUN6RCxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxHQUFHLEdBQUc7QUFDaEIsUUFBUSxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdEgsUUFBUSxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNsRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ3hCLFFBQVEsTUFBTSxRQUFRLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQzVJLFFBQVEsT0FBTyxJQUFJLENBQUMsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbEQsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sR0FBRyxDQUFDLE9BQU8sRUFBRTtBQUN2QixRQUFRLE1BQU0sUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUMzSSxRQUFRLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2xELEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxNQUFNLEtBQUssQ0FBQyxPQUFPLEVBQUU7QUFDekIsUUFBUSxNQUFNLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDN0ksUUFBUSxPQUFPLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNsRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksRUFBRTtBQUNqQyxRQUFRLE1BQU0sUUFBUSxHQUFHLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUM5SSxRQUFRLE9BQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2xELEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxNQUFNLG1CQUFtQixDQUFDLFlBQVksRUFBRTtBQUM1QyxRQUFRLElBQUk7QUFDWixZQUFZLE1BQU0sYUFBYSxHQUFHLE1BQU0sWUFBWSxDQUFDO0FBQ3JELFlBQVksSUFBSSxhQUFhLFlBQVlJLG9DQUFpQixFQUFFO0FBQzVELGdCQUFnQixPQUFPLGFBQWEsQ0FBQztBQUNyQyxhQUFhO0FBQ2IsWUFBWSxPQUFPLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ2pFLFNBQVMsQ0FBQyxNQUFNLEtBQUssRUFBRTtBQUN2QjtBQUNBLFlBQVksTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkQsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxtQkFBbUIsQ0FBQyxhQUFhLEVBQUU7QUFDN0MsUUFBUSxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZGLFFBQVEsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakY7QUFDQTtBQUNBLFFBQVEsSUFBSSxHQUFHLEtBQUssYUFBYSxDQUFDLE1BQU0sSUFBSSxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUNqRyxZQUFZLElBQUkscUJBQXFCLEVBQUU7QUFDdkMsZ0JBQWdCLE9BQU8scUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkQsYUFBYTtBQUNiLFlBQVksSUFBSSxrQkFBa0IsRUFBRTtBQUNwQyxnQkFBZ0IsTUFBTSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQyxhQUFhO0FBQ2IsWUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLG9DQUFvQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN6RixTQUFTO0FBQ1Q7QUFDQTtBQUNBLFFBQVEsSUFBSTtBQUNaLFlBQVksTUFBTSxZQUFZLEdBQUcsTUFBTSxhQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDNUQsWUFBWSxJQUFJLHFCQUFxQixFQUFFO0FBQ3ZDLGdCQUFnQixPQUFPLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzNELGFBQWE7QUFDYixZQUFZLElBQUksa0JBQWtCLEVBQUU7QUFDcEMsZ0JBQWdCLE1BQU0sa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdkQsYUFBYTtBQUNiLFlBQVksTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDMUQsU0FBUyxDQUFDLE1BQU0sS0FBSyxFQUFFO0FBQ3ZCO0FBQ0EsWUFBWSxNQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuRCxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0E7O0FDMU9PLE1BQU0sZUFBZSxTQUFTLGlCQUFpQixDQUFDO0FBQ3ZEO0FBQ0EsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxFQUFFO0FBQzFDLFFBQVEsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDaEMsUUFBUSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUlWLGdCQUFJLEVBQUUsQ0FBQztBQUN4QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUU7QUFDN0IsUUFBUSxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSUUsa0JBQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDckUsUUFBUSxTQUFTLENBQUMsbUJBQW1CLENBQUMsSUFBSUEsa0JBQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDekUsUUFBUSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUMxQyxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksUUFBUSxHQUFHO0FBQ2YsUUFBUSxJQUFJLFlBQVksR0FBRyxLQUFLLENBQUM7QUFDakMsUUFBUSxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUs7QUFDckQsWUFBWSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFO0FBQ2pDLGdCQUFnQixZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLGdCQUFnQixPQUFPLEtBQUssQ0FBQztBQUM3QixhQUFhO0FBQ2IsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDakIsUUFBUSxHQUFHLENBQUMsWUFBWSxFQUFFO0FBQzFCLFlBQVksS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzFCLFNBQVMsTUFBTTtBQUNmLFlBQVksS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzVCLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFVBQVUsR0FBRztBQUNqQixRQUFRLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN4QixLQUFLO0FBQ0w7O0FDM0NPLE1BQU0sY0FBYyxTQUFTLGNBQWMsQ0FBQztBQUNuRDtBQUNBLElBQUksT0FBTyxZQUFZLEdBQUcsK0NBQStDLENBQUM7QUFDMUU7QUFDQSxJQUFJLFdBQVcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxFQUFFLGdCQUFnQixHQUFHLEtBQUssRUFBRTtBQUM3RCxRQUFRLEtBQUssQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3hFLEtBQUs7QUFDTDtBQUNBOztBQ1BPLE1BQU0sNkJBQTZCLFNBQVMsaUJBQWlCLENBQUM7QUFDckU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxFQUFFLGdCQUFnQixHQUFHLEtBQUssRUFBRSxxQkFBcUIsR0FBRyxJQUFJLEVBQUU7QUFDM0YsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMxQjtBQUNBO0FBQ0EsRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUM3QjtBQUNBO0FBQ0EsRUFBRSxJQUFJLENBQUMscUJBQXFCLEdBQUcscUJBQXFCLENBQUM7QUFDckQsRUFBRTtBQUNGO0FBQ0EsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO0FBQ2hCLEVBQUUsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ2hDLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2xCLEdBQUcsTUFBTSxHQUFHLEtBQUssS0FBSyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDeEQsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDbkIsR0FBRyxNQUFNO0FBQ1QsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDbEIsR0FBRztBQUNILEVBQUU7QUFDRjtBQUNBLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztBQUN0QixFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNoQyxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUN4QixHQUFHLE1BQU0sR0FBRyxLQUFLLEtBQUssSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3hELE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3pCLEdBQUcsTUFBTTtBQUNULEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQ3hCLEdBQUc7QUFDSCxFQUFFO0FBQ0Y7QUFDQTs7QUNyQ08sTUFBTSxVQUFVLENBQUM7QUFDeEI7QUFDQSxJQUFJLFdBQVcsR0FBRztBQUNsQixRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQzdCLFFBQVEsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDekIsUUFBUSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUN6QixRQUFRLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSUYsZ0JBQUksRUFBRSxDQUFDO0FBQ3BDLFFBQVEsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJSyxlQUFHLEVBQUUsQ0FBQztBQUN2QyxRQUFRLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQzNCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLE9BQU8sR0FBRztBQUNyQixRQUFRLE9BQU8sSUFBSSxVQUFVLEVBQUUsQ0FBQztBQUNoQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyxPQUFPLENBQUMsR0FBRyxFQUFFO0FBQ2xCLFFBQVEsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFDO0FBQzlDLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUssYUFBYSxDQUFDLEdBQUcsRUFBRTtBQUN4QixRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQztBQUNyQyxRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztBQUM3QixRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztBQUM3QixRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLLGFBQWEsQ0FBQyxHQUFHLEVBQUU7QUFDeEIsUUFBUSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLFFBQVEsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDO0FBQ3ZDLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRTtBQUN0QixRQUFRLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDaEMsUUFBUSxJQUFJLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUM7QUFDOUMsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDckMsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxZQUFZLENBQUMsUUFBUSxFQUFFO0FBQzNCLFFBQVEsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsUUFBUSxHQUFHLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDeEUsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ25CLFFBQVEsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7QUFDaEUsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ25CLFFBQVEsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsUUFBUSxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7QUFDckUsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxjQUFjLENBQUMsVUFBVSxFQUFFO0FBQy9CLFFBQVEsSUFBSSxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsUUFBUSxHQUFHLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFDL0UsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFO0FBQ3ZCLFFBQVEsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsaUJBQWlCLENBQUMsRUFBRSxRQUFRLEdBQUcsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUN4RSxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBLElBQUksS0FBSyxHQUFHO0FBQ1osUUFBUSxPQUFPLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0csS0FBSztBQUNMOztBQ3ZIQSxNQUFNLGVBQWUsR0FBRyxzREFBc0QsQ0FBQztBQUMvRTtBQUNPLE1BQU0saUJBQWlCLFNBQVMsY0FBYyxDQUFDO0FBQ3REO0FBQ0EsSUFBSSxXQUFXLENBQUMsU0FBUyxHQUFHLEtBQUssRUFBRSxnQkFBZ0IsR0FBRyxLQUFLLEVBQUU7QUFDN0QsUUFBUSxLQUFLLENBQUMsU0FBUyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQzVELEtBQUs7QUFDTDtBQUNBOztBQ1JPLE1BQU0sY0FBYyxTQUFTLGNBQWMsQ0FBQztBQUNuRDtBQUNBLElBQUksT0FBTyxZQUFZLEdBQUcsNEJBQTRCLENBQUM7QUFDdkQ7QUFDQSxJQUFJLFdBQVcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxFQUFFLGdCQUFnQixHQUFHLEtBQUssRUFBRTtBQUM3RCxRQUFRLEtBQUssQ0FBQyxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3hFLEtBQUs7QUFDTDtBQUNBOztBQ1JPLE1BQU0saUJBQWlCLFNBQVMsaUJBQWlCLENBQUM7QUFDekQ7QUFDQSxDQUFDLFdBQVcsQ0FBQyxjQUFjLEdBQUcsS0FBSyxFQUFFLE9BQU8sR0FBRyxJQUFJLEVBQUU7QUFDckQsRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2pDLEVBQUU7QUFDRjtBQUNBLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztBQUNoQixFQUFFLEdBQUcsS0FBSyxLQUFLLEVBQUUsQ0FBQztBQUNsQixNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNyQixHQUFHLE1BQU07QUFDVCxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNoQixHQUFHO0FBQ0gsRUFBRTtBQUNGO0FBQ0EsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO0FBQ3RCLEVBQUUsR0FBRyxLQUFLLEtBQUssRUFBRSxDQUFDO0FBQ2xCLE1BQU0sSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQzNCLEdBQUcsTUFBTTtBQUNULEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3RCLEdBQUc7QUFDSCxFQUFFO0FBQ0Y7QUFDQTs7QUN4Qk8sTUFBTSxZQUFZLENBQUM7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyxTQUFTLENBQUMsR0FBRyxFQUFFO0FBQ3BCLE1BQU07QUFDTjtBQUNBOztBQ1BPLE1BQU0sT0FBTyxDQUFDO0FBQ3JCO0FBQ0EsSUFBSSxPQUFPLFVBQVUsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtBQUMvQyxRQUFRTSwrQkFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3BFLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7QUFDNUMsUUFBUUEsK0JBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNqRSxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sVUFBVSxHQUFHO0FBQ3hCLFFBQVEsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDQSwrQkFBWSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7QUFDekQsS0FBSztBQUNMO0FBQ0E7O0FDWkEsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCO0FBQ08sTUFBTSxVQUFVLENBQUM7QUFDeEI7QUFDQSxJQUFJLFdBQVcsR0FBRztBQUNsQjtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLFFBQVEsR0FBRztBQUN0QixRQUFRLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDMUIsWUFBWSxXQUFXLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQztBQUMzQyxTQUFTO0FBQ1QsUUFBUSxPQUFPLFdBQVcsQ0FBQztBQUMzQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRTtBQUNaLFFBQVFBLCtCQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQ3hDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxHQUFHO0FBQ1gsUUFBUUEsK0JBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM1QixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ25CLFFBQVEsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3pDLFFBQVEsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDdEYsUUFBUSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2hDLFFBQVEsT0FBTyxNQUFNLENBQUM7QUFDdEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRTtBQUN2QixRQUFRLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUN6QyxRQUFRLE1BQU0sTUFBTSxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzFGLFFBQVEsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNoQyxRQUFRLE9BQU8sTUFBTSxDQUFDO0FBQ3RCLEtBQUs7QUFDTDtBQUNBOztBQy9ETyxNQUFNLFNBQVMsQ0FBQztBQUN2QjtBQUNBLElBQUksV0FBVyxHQUFHO0FBQ2xCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQzFCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQzFCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQzdCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQzdCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ2hDO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLEtBQUs7QUFDTDtBQUNBOztBQ25CQSxJQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQztBQUM5QjtBQUNPLE1BQU0sa0JBQWtCLENBQUM7QUFDaEM7QUFDQSxJQUFJLFdBQVcsR0FBRztBQUNsQjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUNqQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxRQUFRLEdBQUc7QUFDdEIsUUFBUSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7QUFDakMsWUFBWSxrQkFBa0IsR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUM7QUFDMUQsU0FBUztBQUNULFFBQVEsT0FBTyxrQkFBa0IsQ0FBQztBQUNsQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksR0FBRyxDQUFDLGVBQWUsRUFBRTtBQUN6QixRQUFRLElBQUksQ0FBQyxZQUFZLEdBQUcsZUFBZSxDQUFDO0FBQzVDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyxNQUFNLElBQUksQ0FBQyxTQUFTLEVBQUU7QUFDM0IsUUFBUSxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN0RSxRQUFRLE9BQU8sTUFBTSxJQUFJLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0RCxLQUFLO0FBQ0w7O0FDekNBO0FBT0E7QUFDQSxNQUFNYixLQUFHLEdBQUcsSUFBSUMsa0JBQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3pDO0FBQ08sTUFBTSxjQUFjLENBQUM7QUFDNUI7QUFDQSxJQUFJLFdBQVcsRUFBRTtBQUNqQjtBQUNBLFFBQVEsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ25DO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUN0QztBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsQ0FBQztBQUNqQztBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztBQUM3QixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQztBQUMxQixRQUFRLEdBQUcsR0FBRyxLQUFLLFNBQVMsSUFBSSxHQUFHLEtBQUssSUFBSSxFQUFFO0FBQzlDLFlBQVksSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzdDLFNBQVM7QUFDVCxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN6QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQztBQUNiLFFBQVEsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN4QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQztBQUNsQixRQUFRLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDdEMsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTO0FBQ1QsUUFBUSxPQUFPLEtBQUssQ0FBQztBQUNyQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUNsQixRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQ2pDLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQztBQUN4QixRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxDQUFDLFFBQVEsS0FBSyxTQUFTLEtBQUssUUFBUSxDQUFDLGVBQWUsS0FBSyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDNUksWUFBWSxJQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDO0FBQ2pELFlBQVksUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckMsWUFBWSxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDaEMsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDM0IsUUFBUSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUM7QUFDaEMsUUFBUSxNQUFNLFFBQVEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDL0MsUUFBUSxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztBQUN4QixZQUFZLE1BQU0sNEJBQTRCLEdBQUcsSUFBSSxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFDckUsU0FBUztBQUNULFFBQVEsTUFBTSxJQUFJLEdBQUcsTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDM0MsUUFBUSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNsRCxRQUFRLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxNQUFNLHNCQUFzQixDQUFDLFVBQVUsRUFBRTtBQUM3QztBQUNBLFFBQVEsR0FBRyxDQUFDLFVBQVUsSUFBSSxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRTtBQUNoRCxZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVM7QUFDVCxRQUFRLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztBQUM5QixRQUFRLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQztBQUM1QixRQUFRLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFLO0FBQzNDLFlBQVksSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3JDLGdCQUFnQixPQUFPLElBQUksQ0FBQztBQUM1QixhQUFhO0FBQ2IsWUFBWSxJQUFJO0FBQ2hCLGdCQUFnQixZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xGLGFBQWEsQ0FBQyxNQUFNLE1BQU0sRUFBRTtBQUM1QixnQkFBZ0IsTUFBTSxNQUFNLENBQUM7QUFDN0IsYUFBYTtBQUNiLFNBQVMsQ0FBQyxDQUFDO0FBQ1gsUUFBUSxPQUFPLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMvQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxNQUFNLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO0FBQ2pDLFFBQVFELEtBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztBQUNyRTtBQUNBLFFBQVEsTUFBTSxRQUFRLEdBQUcsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQy9DLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7QUFDeEIsWUFBWSxNQUFNLDRCQUE0QixHQUFHLElBQUksR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO0FBQ3JFLFNBQVM7QUFDVCxRQUFRLE1BQU0sSUFBSSxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzNDLFFBQVEsTUFBTSxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUMsUUFBUSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDcEMsUUFBUSxPQUFPLE1BQU0sQ0FBQztBQUN0QixLQUFLO0FBQ0w7O0FDdElZLElBQUlDLGtCQUFNLENBQUMsY0FBYyxFQUFFO0FBQ3ZDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxNQUFNLFlBQVksQ0FBQztBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxjQUFjLEVBQUU7QUFDaEMsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQztBQUM3QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3hCLFFBQVEsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNwQyxRQUFRLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxLQUFLO0FBQ3BELFlBQVksR0FBRyxXQUFXLENBQUMsY0FBYyxDQUFDLFVBQVUsRUFBRTtBQUN0RCxnQkFBZ0IsU0FBUyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3RHLGFBQWE7QUFDYixZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNqQixRQUFRLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNyRSxLQUFLO0FBQ0w7QUFDQTs7QUM5QlksSUFBSUEsa0JBQU0sQ0FBQywwQkFBMEIsRUFBQztBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTSx3QkFBd0IsQ0FBQztBQUN0QztBQUNBLElBQUksV0FBVyxHQUFHO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLEdBQUdhLHVCQUFjLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDMUU7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUdBLHVCQUFjLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3RFO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxVQUFVLEVBQUU7QUFDaEIsUUFBUSxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksZUFBZSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzFFLFFBQVEsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDbEUsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLHlCQUF5QixFQUFFO0FBQ3JEO0FBQ0EsUUFBUSxPQUFPLE9BQU8sQ0FBQyxHQUFHO0FBQzFCLFlBQVk7QUFDWixnQkFBZ0IsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUM7QUFDcEUsZ0JBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLHlCQUF5QixDQUFDO0FBQ2pFLGFBQWE7QUFDYixTQUFTLENBQUM7QUFDVixLQUFLO0FBQ0w7QUFDQTs7QUNuREEsTUFBTWQsS0FBRyxHQUFHLElBQUlDLGtCQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUM1QztBQUNPLE1BQU0saUJBQWlCLENBQUM7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sR0FBRztBQUNkLFFBQVFELEtBQUcsQ0FBQyxJQUFJLENBQUMsb0RBQW9ELENBQUMsQ0FBQztBQUN2RSxRQUFRLE9BQU8sS0FBSyxDQUFDO0FBQ3JCLEtBQUs7QUFDTDtBQUNBOztBQ1RBLE1BQU1BLEtBQUcsR0FBRyxJQUFJQyxrQkFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZDO0FBQ08sTUFBTSxZQUFZLENBQUM7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixHQUFHLEVBQUUsRUFBRTtBQUMvRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQ2pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7QUFDckQ7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQztBQUNoQixRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO0FBQzVCLFlBQVksT0FBTyxJQUFJLENBQUM7QUFDeEIsU0FBUztBQUNULFFBQVEsSUFBSSxDQUFDLEdBQUcsRUFBRTtBQUNsQixZQUFZRCxLQUFHLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3JDLFlBQVksT0FBTyxLQUFLLENBQUM7QUFDekIsU0FBUztBQUNULFFBQVEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFDekIsWUFBWSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQ3BDLGdCQUFnQixPQUFPLElBQUksQ0FBQztBQUM1QixhQUFhO0FBQ2IsWUFBWSxPQUFPLEtBQUssQ0FBQztBQUN6QixTQUFTO0FBQ1QsUUFBUSxPQUFPUSx1QkFBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNuRixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxJQUFJLEdBQUc7QUFDakIsUUFBUSxJQUFJO0FBQ1osWUFBWSxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNyRCxZQUFZLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDMUMsWUFBWSxPQUFPLE1BQU0sQ0FBQztBQUMxQixTQUFTLENBQUMsTUFBTSxNQUFNLEVBQUU7QUFDeEIsWUFBWVIsS0FBRyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxNQUFNLENBQUMsQ0FBQztBQUNsRCxZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksZ0JBQWdCLEdBQUc7QUFDdkIsUUFBUSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUM7QUFDckQsUUFBUSxJQUFJLFlBQVksSUFBSSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNyRCxZQUFZLElBQUksdUJBQXVCLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3BFLFlBQVksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDMUQsZ0JBQWdCLHVCQUF1QixHQUFHLHVCQUF1QixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN4RixhQUFhO0FBQ2IsWUFBWSxPQUFPLHVCQUF1QixDQUFDO0FBQzNDLFNBQVM7QUFDVCxRQUFRLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2pDLEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxZQUFZLEdBQUc7QUFDekIsUUFBUSxJQUFJO0FBQ1osWUFBWSxNQUFNLE1BQU0sR0FBRyxNQUFNLHNIQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN6RCxZQUFZLE9BQU8sSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDeEMsU0FBUyxDQUFDLE1BQU0sTUFBTSxHQUFHO0FBQ3pCLFlBQVksTUFBTSxNQUFNLENBQUM7QUFDekIsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBOztBQy9GTyxNQUFNLE1BQU0sQ0FBQztBQUNwQjtBQUNBLElBQUksV0FBVyxHQUFHO0FBQ2xCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ3hCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQzdCLEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxJQUFJLEdBQUc7QUFDakIsUUFBUSxNQUFNLG9DQUFvQyxDQUFDO0FBQ25ELEtBQUs7QUFDTDtBQUNBOztBQ1pBLE1BQU1BLEtBQUcsR0FBRyxJQUFJQyxrQkFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDekM7QUFDTyxNQUFNLGNBQWMsU0FBUyxZQUFZLENBQUM7QUFDakQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLFVBQVUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixHQUFHLEVBQUUsRUFBRTtBQUN2RSxRQUFRLEtBQUssQ0FBQyxVQUFVLEVBQUUsUUFBUSxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDeEQ7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDN0IsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sSUFBSSxHQUFHO0FBQ2pCLFFBQVEsSUFBSTtBQUNaLFlBQVksTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDckQsWUFBWSxNQUFNLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQzFDLFlBQVksT0FBTyxNQUFNYyxzQkFBYSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25FLFNBQVMsQ0FBQyxNQUFNLE1BQU0sRUFBRTtBQUN4QixZQUFZZixLQUFHLENBQUMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZELFlBQVksTUFBTSxNQUFNLENBQUM7QUFDekIsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxZQUFZLEdBQUc7QUFDekIsUUFBUSxJQUFJO0FBQ1osWUFBWSxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUN0RCxZQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ2pFLFlBQVksTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3pDLFlBQVksTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUM5QyxZQUFZLE1BQU1nQixzQkFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxpQkFBaUIsS0FBSztBQUMxRixnQkFBZ0IsT0FBT0Qsc0JBQWEsQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDOUUsYUFBYSxDQUFDLENBQUM7QUFDZixZQUFZLE9BQU8sTUFBTSxDQUFDO0FBQzFCLFNBQVMsQ0FBQyxNQUFNLEtBQUssRUFBRTtBQUN2QixZQUFZLE1BQU0sS0FBSyxDQUFDO0FBQ3hCLFNBQVM7QUFDVCxLQUFLO0FBQ0w7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxNQUFNLFlBQVksQ0FBQztBQUMxQjtBQUNBLElBQUksV0FBVyxHQUFHO0FBQ2xCO0FBQ0EsUUFBUSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDbkM7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ25DLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFO0FBQ3BCLFFBQVEsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDO0FBQ2pDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3pDLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksS0FBSyxFQUFFLENBQUMsQ0FBQztBQUNwRCxTQUFTO0FBQ1QsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbEQsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUU7QUFDM0IsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDdEMsWUFBWSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBQ2pELFNBQVM7QUFDVCxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMvQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksV0FBVyxHQUFHO0FBQ3RCLFFBQVEsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUNuRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sTUFBTSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsYUFBYSxFQUFFO0FBQzlDLFFBQVEsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ25DLFlBQVksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDcEQsZ0JBQWdCLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbkUsYUFBYTtBQUNiLFNBQVM7QUFDVCxRQUFRLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDckQsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDeEMsUUFBUSxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLFFBQVEsT0FBTyxNQUFNLENBQUM7QUFDdEIsS0FBSztBQUNMO0FBQ0EsSUFBSSxNQUFNLE1BQU0sQ0FBQyxHQUFHLEdBQUcsYUFBYSxFQUFFO0FBQ3RDLFFBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbkMsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuQyxRQUFRLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDMUMsS0FBSztBQUNMO0FBQ0EsSUFBSSxNQUFNLEtBQUssR0FBRztBQUNsQixRQUFRLEtBQUssSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtBQUMvQyxZQUFZLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDOUMsU0FBUztBQUNULFFBQVEsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNoRCxRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDL0IsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQy9CLEtBQUs7QUFDTDtBQUNBLElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtBQUNuQyxRQUFRLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDckMsWUFBWSxLQUFLLElBQUksUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQzFELGdCQUFnQixRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDN0MsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBLFFBQVEsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDO0FBQ2pDLFFBQVEsSUFBSSxHQUFHLElBQUksTUFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3pELFlBQVksS0FBSyxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUM3RCxnQkFBZ0IsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzdDLGFBQWE7QUFDYixTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0EsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxZQUFZLEVBQUU7QUFDM0MsUUFBUSxPQUFPLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUNqQyxZQUFZLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxLQUFLO0FBQzFDLGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEVBQUU7QUFDNUMsb0JBQW9CLE9BQU8sSUFBSSxDQUFDO0FBQ2hDLGlCQUFpQjtBQUNqQixnQkFBZ0IsTUFBTSxPQUFPLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQ3ZELGdCQUFnQixZQUFZLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzVELGdCQUFnQixPQUFPLE9BQU8sS0FBSyxLQUFLLENBQUM7QUFDekMsYUFBYTtBQUNiLFNBQVMsQ0FBQyxDQUFDO0FBQ1gsS0FBSztBQUNMO0FBQ0E7O0FDeEdPLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUI7QUFDQSxJQUFJLHFCQUFxQixDQUFDLENBQUMsRUFBRSxFQUFFO0FBQy9CLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ2pDLFlBQVksSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN6QyxZQUFZLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyxZQUFZLE9BQU8sRUFBRSxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUM7QUFDckMsU0FBUztBQUNULFFBQVEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsUUFBUSxPQUFPLEVBQUUsQ0FBQztBQUNsQixLQUFLO0FBQ0w7QUFDQSxDQUFDO0FBQ0Q7QUFDQSxJQUFJLE9BQU8sR0FBRyxJQUFJUixlQUFHLEVBQUU7O0FDaEJoQixNQUFNLFNBQVMsQ0FBQztBQUN2QjtBQUNBLElBQUksV0FBVyxDQUFDLFNBQVMsRUFBRTtBQUMzQixRQUFRLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0FBQ25DLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxLQUFLLEdBQUc7QUFDaEIsUUFBUSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBQ3BDLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxJQUFJLEdBQUc7QUFDZixRQUFRLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDbkMsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLFNBQVMsR0FBRztBQUNwQixRQUFRLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDbkMsS0FBSztBQUNMOztBQ1ZBLE1BQU1QLEtBQUcsR0FBRyxJQUFJQyxrQkFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTSxXQUFXLFNBQVMsc0JBQXNCLENBQUM7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFO0FBQy9CLFFBQVEsS0FBSyxDQUFDLFlBQVksQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNsRSxRQUFRLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ2pDLFFBQVEsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJQyxnQkFBSSxFQUFFLENBQUM7QUFDekMsS0FBSztBQUNMO0FBQ0EsSUFBSSxjQUFjLEdBQUc7QUFDckIsUUFBUSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFO0FBQ3pHLFlBQVksSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJSyxlQUFHLEVBQUUsQ0FBQztBQUMxQyxZQUFZLE9BQU87QUFDbkIsU0FBUztBQUNULFFBQVEsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFNBQVMsRUFBRTtBQUMzRSxZQUFZLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSUEsZUFBRyxFQUFFLENBQUM7QUFDMUMsWUFBWSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDOUUsZ0JBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25JLGFBQWE7QUFDYixTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRTtBQUMzQyxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzdFLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLFFBQVEsR0FBRztBQUNuQixRQUFRLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztBQUM3QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksR0FBRyxHQUFHO0FBQ2QsUUFBUSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUM7QUFDNUQsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLE1BQU0sR0FBRztBQUNqQixRQUFRLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztBQUMvRCxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksSUFBSSxHQUFHO0FBQ2YsUUFBUSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUM7QUFDN0QsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEtBQUssR0FBRztBQUNoQixRQUFRLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQztBQUM5RCxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksS0FBSyxHQUFHO0FBQ2hCLFFBQVEsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDO0FBQ2pELEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxNQUFNLEdBQUc7QUFDakIsUUFBUSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUM7QUFDbEQsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLFVBQVUsR0FBRztBQUNyQixRQUFRLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUM5QixRQUFRLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztBQUNqQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUU7QUFDbEMsUUFBUUcsd0NBQXFCLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNsRixLQUFLO0FBQ0w7QUFDQSxJQUFJLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtBQUMzQixRQUFRLE9BQU9BLHdDQUFxQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNuRixLQUFLO0FBQ0w7QUFDQSxJQUFJLGlCQUFpQixDQUFDLEdBQUcsRUFBRTtBQUMzQixRQUFRLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO0FBQ3ZELFFBQVEsT0FBTyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEQsS0FBSztBQUNMO0FBQ0EsSUFBSSxlQUFlLENBQUMsR0FBRyxFQUFFO0FBQ3pCLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuRCxLQUFLO0FBQ0w7QUFDQSxJQUFJLFFBQVEsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3pCLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDakQsS0FBSztBQUNMO0FBQ0EsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFO0FBQ2xCLFFBQVEsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hELEtBQUs7QUFDTDtBQUNBLElBQUksV0FBVyxDQUFDLEdBQUcsRUFBRTtBQUNyQixRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2hELEtBQUs7QUFDTDtBQUNBLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtBQUNmLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7QUFDN0MsWUFBWSxPQUFPLENBQUMsS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7QUFDbEYsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVDtBQUNBLFFBQVEsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQztBQUM1RDtBQUNBLFFBQVEsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLEVBQUU7QUFDbkMsWUFBWSxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzVELFlBQVksT0FBTztBQUNuQixTQUFTO0FBQ1QsUUFBUSxHQUFHLEtBQUssSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFO0FBQ3ZDLFlBQVksVUFBVSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQy9GLFlBQVksSUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLENBQUM7QUFDdkUsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLEdBQUcsT0FBTyxLQUFLLElBQUksUUFBUSxFQUFFO0FBQ3JDLFlBQVksVUFBVSxDQUFDLFlBQVksQ0FBQ0Esd0NBQXFCLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3hHLFlBQVksT0FBTztBQUNuQixTQUFTO0FBQ1QsUUFBUSxHQUFHLEtBQUssWUFBWSxJQUFJLEVBQUU7QUFDbEMsWUFBWSxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUNsRSxZQUFZLE9BQU87QUFDbkIsU0FBUztBQUNULFFBQVEsR0FBRyxLQUFLLFlBQVksT0FBTyxFQUFFO0FBQ3JDLFlBQVksVUFBVSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDbEUsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRVixLQUFHLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7QUFDdEQsUUFBUUEsS0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QixLQUFLO0FBQ0w7QUFDQSxJQUFJLFNBQVMsR0FBRztBQUNoQixRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRTtBQUM3QyxZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVM7QUFDVCxRQUFRLE9BQU8sS0FBSyxDQUFDO0FBQ3JCLEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxHQUFHO0FBQ2IsUUFBUSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEVBQUU7QUFDOUM7QUFDQSxZQUFZLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUM7QUFDaEUsWUFBWSxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzFELFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssR0FBRztBQUNaLFFBQVEsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFO0FBQ2pELFlBQVksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDaEYsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRTtBQUNwQixRQUFRLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNyQixRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0IsS0FBSztBQUNMO0FBQ0EsSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFO0FBQ3BCLFFBQVEsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsS0FBSyxJQUFJLENBQUM7QUFDcEYsWUFBWSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3RFLFlBQVksT0FBTztBQUNuQixTQUFTO0FBQ1QsUUFBUSxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFO0FBQ3hDLFlBQVksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDbEYsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxFQUFFO0FBQ3RDLFlBQVksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQ1Usd0NBQXFCLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDM0YsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLElBQUksS0FBSyxZQUFZLElBQUksRUFBRTtBQUNuQyxZQUFZLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckQsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLElBQUksS0FBSyxZQUFZLE9BQU8sRUFBRTtBQUN0QyxZQUFZLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSUMsbUNBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakUsWUFBWSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDaEUsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRWCxLQUFHLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7QUFDdEQsUUFBUUEsS0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QixLQUFLO0FBQ0w7QUFDQSxJQUFJLFlBQVksQ0FBQyxLQUFLLEVBQUU7QUFDeEIsUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLEtBQUssSUFBSSxFQUFFO0FBQ3RELFlBQVksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxTQUFTO0FBQ1QsUUFBUSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRTtBQUNyRixZQUFZLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN6RyxZQUFZLE9BQU87QUFDbkIsU0FBUztBQUNULFFBQVEsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRTtBQUN4QyxZQUFZLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDckgsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLElBQUksT0FBTyxLQUFLLElBQUksUUFBUSxFQUFFO0FBQ3RDLFlBQVksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQ1Usd0NBQXFCLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5SCxZQUFZLE9BQU87QUFDbkIsU0FBUztBQUNULFFBQVEsSUFBSSxLQUFLLFlBQVlPLGdDQUFhLEVBQUU7QUFDNUMsWUFBWSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDeEYsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLElBQUksS0FBSyxZQUFZLE9BQU8sRUFBRTtBQUN0QyxZQUFZLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN4RixZQUFZLE9BQU87QUFDbkIsU0FBUztBQUNULFFBQVFqQixLQUFHLENBQUMsSUFBSSxDQUFDLHVDQUF1QyxDQUFDLENBQUM7QUFDMUQsUUFBUUEsS0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QixLQUFLO0FBQ0w7O0FDOU5BO0FBQ0E7QUFDTyxNQUFNLFNBQVMsQ0FBQztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFO0FBQ3pELFFBQVEsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7QUFDN0MsUUFBUSxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztBQUNyQyxRQUFRLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0FBQ3ZDLEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxHQUFHO0FBQ2IsUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2xDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUU7QUFDWixRQUFRLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDdkMsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFO0FBQ3BCLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNDLFFBQVEsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN2QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxhQUFhLENBQUMsRUFBRSxDQUFDO0FBQ3JCLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDeEMsUUFBUSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksUUFBUSxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBRTtBQUN6QixRQUFRLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoRCxRQUFRLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDdkMsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxRQUFRLENBQUMsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFO0FBQ3pCLFFBQVEsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hELFFBQVEsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN2QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFlBQVksQ0FBQyxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUU7QUFDN0IsUUFBUSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDcEQsUUFBUSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZDLEtBQUs7QUFDTDtBQUNBOztBQ2xGWSxJQUFJQyxrQkFBTSxDQUFDLHNCQUFzQixFQUFFO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTSxvQkFBb0IsU0FBUyxXQUFXO0FBQ3JEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtBQUMvQixRQUFRLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDN0IsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxJQUFJLEdBQUc7QUFDZixRQUFRLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQztBQUMxQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDcEIsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUMzQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQ2YsUUFBUSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDakMsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDcEIsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUM1QyxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdEQsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxJQUFJLFlBQVksRUFBRTtBQUN0QixRQUFRLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQztBQUMzQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssR0FBRztBQUNaLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3RDLEtBQUs7QUFDTDtBQUNBLElBQUksU0FBUyxHQUFHO0FBQ2hCLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3ZDLEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxHQUFHO0FBQ2IsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUMvQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sR0FBRztBQUNkLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDOUMsS0FBSztBQUNMOztBQ3pFQTtBQUtBO0FBQ08sTUFBTSxpQkFBaUIsU0FBUyxvQkFBb0I7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQ2pDLFFBQVEsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMvQixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQztBQUN0QixRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQzlDLEtBQUs7QUFDTDtBQUNBLElBQUksU0FBUyxFQUFFO0FBQ2YsUUFBUSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUM7QUFDN0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEtBQUssR0FBRztBQUNoQixRQUFRLE9BQU8sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO0FBQ3JCLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxNQUFNLENBQUMsQ0FBQztBQUM3RSxLQUFLO0FBQ0w7O0FDakNBO0FBS0E7QUFDTyxNQUFNLG9CQUFvQixTQUFTLG9CQUFvQjtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDakMsUUFBUSxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQ3RCLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDOUMsS0FBSztBQUNMO0FBQ0EsSUFBSSxTQUFTLEVBQUU7QUFDZixRQUFRLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQztBQUM3QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksS0FBSyxHQUFHO0FBQ2hCLFFBQVEsT0FBTyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDaEMsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7QUFDckIsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLE1BQU0sQ0FBQyxDQUFDO0FBQzdFLEtBQUs7QUFDTDs7QUNqQ0E7QUFLQTtBQUNPLE1BQU0sZ0JBQWdCLFNBQVMsb0JBQW9CO0FBQzFEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUNqQyxRQUFRLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDL0IsS0FBSztBQUNMO0FBQ0E7O0FDbEJBO0FBS0E7QUFDTyxNQUFNLG9CQUFvQixTQUFTLG9CQUFvQjtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDakMsUUFBUSxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxTQUFTLEVBQUU7QUFDbkIsUUFBUSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUM7QUFDL0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFDeEIsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztBQUNoRCxLQUFLO0FBQ0w7QUFDQSxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUU7QUFDcEIsUUFBUSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlCLFFBQVEsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQ3BDLEtBQUs7QUFDTDtBQUNBLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRTtBQUN4QixRQUFRLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbEMsUUFBUSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDcEMsS0FBSztBQUNMO0FBQ0E7O0FDaENPLE1BQU0sZUFBZSxDQUFDO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRTtBQUMvQjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0FBQ3JDO0FBQ0EsUUFBUSxHQUFHLEtBQUssWUFBWWlCLHFCQUFRLEVBQUU7QUFDdEMsWUFBWSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMzRSxTQUFTO0FBQ1QsUUFBUSxHQUFHLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQztBQUNyQyxZQUFZLElBQUksQ0FBQyxnQkFBZ0IsR0FBR1Isd0NBQXFCLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hGLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFO0FBQ3BELFFBQVEsTUFBTSxPQUFPLEdBQUdBLHdDQUFxQixDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDakYsUUFBUSxHQUFHLGFBQWEsS0FBSyxJQUFJLElBQUksYUFBYSxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRTtBQUM5RSxZQUFZLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDaEUsU0FBUztBQUNULFFBQVEsT0FBTyxPQUFPLENBQUM7QUFDdkIsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7QUFDckIsUUFBUSxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUM3QixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksS0FBSyxHQUFHO0FBQ2hCLFFBQVEsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQzVCLEtBQUs7QUFDTDtBQUNBOztBQzlDQTtBQUlBO0FBQ08sTUFBTSxhQUFhLFNBQVMsV0FBVztBQUM5QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDakMsUUFBUSxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxTQUFTLEVBQUU7QUFDbkIsUUFBUSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUM7QUFDL0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFDeEIsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztBQUNoRCxLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssR0FBRztBQUNaLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3RDLEtBQUs7QUFDTDtBQUNBOztBQzdCQTtBQUlBO0FBQ08sTUFBTSxXQUFXLFNBQVMsV0FBVztBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDakMsUUFBUSxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksSUFBSSxHQUFHO0FBQ2YsUUFBUSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7QUFDMUMsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ3BCLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7QUFDM0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxNQUFNLEdBQUc7QUFDYixRQUFRLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzlDLEtBQUs7QUFDTDtBQUNBOztBQ3JDTyxNQUFNLFlBQVksU0FBUyxXQUFXLENBQUM7QUFDOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQ2pDLFFBQVEsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMvQixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksYUFBYSxHQUFHO0FBQ3hCLFFBQVEsT0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUM7QUFDckMsS0FBSztBQUNMO0FBQ0EsSUFBSSxTQUFTLEdBQUc7QUFDaEIsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUM7QUFDMUMsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEdBQUc7QUFDWCxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNyQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksR0FBRztBQUNYLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDM0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxNQUFNLEdBQUc7QUFDYixRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQzVDLEtBQUs7QUFDTDtBQUNBOztBQ2xDQTtBQUlBO0FBQ08sTUFBTSxhQUFhLFNBQVMsV0FBVyxDQUFDO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDOUIsRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3pCLFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDaEMsRUFBRTtBQUNGO0FBQ0EsSUFBSSxJQUFJLEtBQUssRUFBRTtBQUNmLFFBQVEsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUM7QUFDbEIsUUFBUSxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzdDLEtBQUs7QUFDTDtBQUNBLElBQUksSUFBSSxLQUFLLEVBQUU7QUFDZixRQUFRLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztBQUNoQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQztBQUNwQixRQUFRLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0FBQ2pDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixLQUFLO0FBQ0w7O0FDakNBO0FBS0E7QUFDTyxNQUFNLGFBQWEsU0FBUyxXQUFXLENBQUM7QUFDL0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUM5QixFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDekI7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7QUFDL0IsRUFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksT0FBTyxFQUFFO0FBQ2pCLFFBQVEsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ2pDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUM7QUFDN0IsUUFBUSxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztBQUN6QyxRQUFRLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUM3QixLQUFLO0FBQ0w7QUFDQSxJQUFJLGFBQWEsRUFBRTtBQUNuQixRQUFRLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRTtBQUNqRCxZQUFZLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ2hGLFNBQVM7QUFDVCxRQUFRLEtBQUssTUFBTSxNQUFNLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztBQUMvQyxZQUFZLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdkUsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksSUFBSSxHQUFHO0FBQ2YsUUFBUSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7QUFDMUMsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ3BCLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7QUFDM0MsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxJQUFJLEtBQUssRUFBRTtBQUNmLFFBQVEsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ2pDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxZQUFZLEVBQUU7QUFDdEIsUUFBUSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7QUFDM0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxLQUFLLEdBQUc7QUFDWixRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN0QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLFNBQVMsR0FBRztBQUNoQixRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN2QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLE1BQU0sR0FBRztBQUNiLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDL0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLEdBQUc7QUFDZCxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQzlDLEtBQUs7QUFDTDs7QUN6Rk8sTUFBTSxnQkFBZ0IsU0FBUyxvQkFBb0I7QUFDMUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQ2pDLFFBQVEsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUMvQixLQUFLO0FBQ0w7QUFDQSxJQUFJLE1BQU0sS0FBSyxHQUFHO0FBQ2xCLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxzRkFBc0YsQ0FBQyxDQUFDO0FBQ3pHLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUM3QixLQUFLO0FBQ0w7QUFDQTs7QUNyQkE7QUFlQTtBQUNPLE1BQU0sYUFBYSxDQUFDO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFO0FBQzlCLFFBQVEsSUFBSSxhQUFhLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sT0FBTyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFO0FBQ2pHLFFBQVEsSUFBSSxhQUFhLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsT0FBTyxJQUFJLG9CQUFvQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFO0FBQ3BHLFFBQVEsSUFBSSxhQUFhLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssT0FBTyxJQUFJLGdCQUFnQixDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFO0FBQ2hHLFFBQVEsSUFBSSxhQUFhLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sT0FBTyxJQUFJLFdBQVcsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRTtBQUMzRixRQUFRLElBQUksYUFBYSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLE9BQU8sSUFBSSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRTtBQUNwRyxRQUFRLElBQUksYUFBYSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRTtBQUNoRyxRQUFRLElBQUksYUFBYSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRTtBQUNoRyxRQUFRLElBQUksYUFBYSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLE9BQU8sSUFBSSxZQUFZLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUU7QUFDNUYsUUFBUSxJQUFJLGFBQWEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxPQUFPLElBQUksZUFBZSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFO0FBQy9GLFFBQVEsSUFBSSxhQUFhLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssT0FBTyxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsRUFBRTtBQUM3RixRQUFRLElBQUksYUFBYSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLE9BQU8sSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEVBQUU7QUFDN0YsUUFBUSxJQUFJLGFBQWEsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxPQUFPLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFO0FBQzdGLFFBQVEsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQkFBK0IsR0FBRyxLQUFLLENBQUMsQ0FBQztBQUM3RCxRQUFRLE9BQU8sSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2hELEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxXQUFXLENBQUMsS0FBSyxDQUFDO0FBQzdCLFFBQVEsT0FBTyxDQUFDLEtBQUssWUFBWSxnQkFBZ0IsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU87QUFDM0UsYUFBYSxLQUFLLFlBQVlELHVCQUFVLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxPQUFPLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssS0FBSyxPQUFPLENBQUMsQ0FBQztBQUNsSixLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sY0FBYyxDQUFDLEtBQUssQ0FBQztBQUNoQyxRQUFRLE9BQU8sQ0FBQyxLQUFLLFlBQVksZ0JBQWdCLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxVQUFVO0FBQzlFLGFBQWEsS0FBSyxZQUFZQSx1QkFBVSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssT0FBTyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEtBQUssVUFBVSxDQUFDLENBQUM7QUFDckosS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFlBQVksQ0FBQyxLQUFLLENBQUM7QUFDOUIsUUFBUSxPQUFPLENBQUMsS0FBSyxZQUFZLGdCQUFnQixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUTtBQUM1RSxhQUFhLEtBQUssWUFBWUEsdUJBQVUsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDO0FBQ25KLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxVQUFVLENBQUMsS0FBSyxDQUFDO0FBQzVCLFFBQVEsT0FBTyxDQUFDLEtBQUssWUFBWSxlQUFlO0FBQ2hELGFBQWEsS0FBSyxZQUFZQSx1QkFBVSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUM7QUFDbkUsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFVBQVUsQ0FBQyxLQUFLLENBQUM7QUFDNUIsUUFBUSxJQUFJLEtBQUssWUFBWSxnQkFBZ0IsRUFBRTtBQUMvQyxZQUFZLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFO0FBQ3ZELFNBQVM7QUFDVCxRQUFRLEdBQUcsS0FBSyxZQUFZQSx1QkFBVSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFO0FBQ2xFLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssS0FBSyxNQUFNLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFO0FBQzVFLFNBQVM7QUFDVCxRQUFRLE9BQU8sS0FBSyxDQUFDO0FBQ3JCLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxVQUFVLENBQUMsS0FBSyxDQUFDO0FBQzVCLFFBQVEsSUFBSSxLQUFLLFlBQVksZ0JBQWdCLEVBQUU7QUFDL0MsWUFBWSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUN2RCxZQUFZLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFO0FBQ3pELFlBQVksSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUU7QUFDekQsWUFBWSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssVUFBVSxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUMzRCxZQUFZLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxFQUFFO0FBQ3hELFlBQVksSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUU7QUFDdkQsWUFBWSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUN2RCxTQUFTO0FBQ1QsUUFBUSxHQUFHLEtBQUssWUFBWUEsdUJBQVUsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRTtBQUNsRSxZQUFZLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUM1RCxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUM1RSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUM5RSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEtBQUssUUFBUSxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUM5RSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEtBQUssVUFBVSxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUNoRixZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEtBQUssT0FBTyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUM3RSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUM1RSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUMsRUFBRTtBQUM1RSxTQUFTO0FBQ1QsUUFBUSxPQUFPLEtBQUssQ0FBQztBQUNyQixLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sY0FBYyxDQUFDLEtBQUssQ0FBQztBQUNoQyxRQUFRLE9BQU8sQ0FBQyxLQUFLLFlBQVksSUFBSSxJQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssV0FBVztBQUN2RSxhQUFhLEtBQUssWUFBWVMscUJBQVEsQ0FBQyxDQUFDO0FBQ3hDLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxZQUFZLENBQUMsS0FBSyxDQUFDO0FBQzlCLFFBQVEsT0FBTyxDQUFDLEtBQUssWUFBWSxpQkFBaUI7QUFDbEQsYUFBYSxLQUFLLFlBQVlULHVCQUFVLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQztBQUNyRSxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sWUFBWSxDQUFDLEtBQUssQ0FBQztBQUM5QixRQUFRLE9BQU8sQ0FBQyxLQUFLLFlBQVksaUJBQWlCO0FBQ2xELGFBQWEsS0FBSyxZQUFZQSx1QkFBVSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7QUFDckUsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFdBQVcsQ0FBQyxLQUFLLENBQUM7QUFDN0IsUUFBUSxPQUFPLENBQUMsS0FBSyxZQUFZLGdCQUFnQjtBQUNqRCxhQUFhLEtBQUssWUFBWUEsdUJBQVUsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUFDO0FBQ3BFLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxjQUFjLENBQUMsS0FBSyxDQUFDO0FBQ2hDLFFBQVEsT0FBTyxDQUFDLEtBQUssWUFBWSxtQkFBbUI7QUFDcEQsYUFBYSxLQUFLLFlBQVlBLHVCQUFVLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQztBQUN2RSxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sWUFBWSxDQUFDLEtBQUssQ0FBQztBQUM5QixRQUFRLE9BQU8sQ0FBQyxLQUFLLFlBQVksV0FBVztBQUM1QyxhQUFhLEtBQUssWUFBWUEsdUJBQVUsQ0FBQyxDQUFDO0FBQzFDLEtBQUs7QUFDTDs7QUNySEE7QUFDQTtBQUNBO0FBQ08sTUFBTSxrQkFBa0IsQ0FBQztBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsRUFBRSxjQUFjLEVBQUU7QUFDbEQ7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7QUFDN0M7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDO0FBQ2pEO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ2hDO0FBQ0EsUUFBUSxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUlGLGVBQUcsRUFBRSxDQUFDO0FBQ3BDLEtBQUs7QUFDTDtBQUNBLElBQUksYUFBYSxHQUFHO0FBQ3BCLFFBQVEsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQy9CLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksY0FBYyxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUU7QUFDOUMsUUFBUSxNQUFNLE9BQU8sR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNyRTtBQUNBLFFBQVEsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3hDO0FBQ0EsUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7QUFDMUQsWUFBWSxJQUFJLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUN2QyxTQUFTO0FBQ1Q7QUFDQSxRQUFRLE9BQU8sT0FBTyxDQUFDO0FBQ3ZCLEtBQUs7QUFDTDtBQUNBLElBQUksaUJBQWlCLENBQUMsT0FBTyxFQUFFO0FBQy9CLFFBQVEsR0FBRyxPQUFPLEtBQUssSUFBSSxJQUFJLE9BQU8sS0FBSyxTQUFTLElBQUksRUFBRSxPQUFPLFlBQVksV0FBVyxDQUFDLEVBQUU7QUFDM0YsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQztBQUN0QixRQUFRLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzVDLFlBQVksRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxZQUFZLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDNUYsU0FBUztBQUNUO0FBQ0EsUUFBUSxHQUFHLEVBQUUsS0FBSyxJQUFJLEVBQUU7QUFDeEIsWUFBWSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDNUMsU0FBUztBQUNULEtBQUs7QUFDTDs7QUM3RE8sTUFBTSxVQUFVLENBQUM7QUFDeEI7QUFDQSxJQUFJLE9BQU8sNEJBQTRCLEdBQUcsS0FBSyxDQUFDO0FBQ2hEO0FBQ0E7QUFDQSxJQUFJLE9BQU8sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0FBQ25DO0FBQ0EsSUFBSSxPQUFPLHlCQUF5QixHQUFHLEtBQUssQ0FBQztBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sZ0JBQWdCLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRTtBQUMzQyxRQUFRLE1BQU0sV0FBVyxHQUFHRyx3Q0FBcUIsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckUsUUFBUSxXQUFXLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ2pHLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sWUFBWSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUU7QUFDdkMsUUFBUSxNQUFNLFdBQVcsR0FBR0Esd0NBQXFCLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JFLFFBQVEsV0FBVyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDbkMsUUFBUSxXQUFXLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDckYsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsU0FBUyxFQUFFO0FBQzVDLFFBQVEsTUFBTSxXQUFXLEdBQUdBLHdDQUFxQixDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNyRSxRQUFRLFdBQVcsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3hFLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sZUFBZSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUU7QUFDeEMsUUFBUSxNQUFNLFdBQVcsR0FBR0Esd0NBQXFCLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JFLFFBQVEsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMxRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxhQUFhLENBQUMsRUFBRSxFQUFFO0FBQzdCLFFBQVFBLHdDQUFxQixDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNoRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sZ0JBQWdCLENBQUMsT0FBTyxFQUFFO0FBQ3JDLFFBQVFBLHdDQUFxQixDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzVFLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxjQUFjLENBQUMsT0FBTyxFQUFFO0FBQ25DLFFBQVFBLHdDQUFxQixDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzFFLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUU7QUFDekMsUUFBUUEsd0NBQXFCLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMvRSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sa0JBQWtCLENBQUMsT0FBTyxFQUFFO0FBQ3ZDLFFBQVFBLHdDQUFxQixDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDL0UsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFO0FBQ3BEO0FBQ0EsUUFBUSxNQUFNLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztBQUNwQztBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsVUFBVSxDQUFDLHlCQUF5QixFQUFFO0FBQ25ELFlBQVksTUFBTSxzQkFBc0IsR0FBRyxJQUFJTixrQkFBTSxDQUFDLElBQUksRUFBRSwrQkFBK0IsS0FBSyxLQUFLO0FBQ3JHLGdCQUFnQixVQUFVLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUMzRCxhQUFhLENBQUMsQ0FBQztBQUNmLFlBQVksZ0JBQWdCLENBQUMsSUFBSTtBQUNqQyxnQkFBZ0JlLGtDQUFlLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLHNCQUFzQixDQUFDO0FBQ3JGLGFBQWEsQ0FBQztBQUNkLFlBQVksVUFBVSxDQUFDLHlCQUF5QixHQUFHLElBQUksQ0FBQztBQUN4RCxTQUFTO0FBQ1Q7QUFDQSxRQUFRLE1BQU0saUJBQWlCLEdBQUcsSUFBSWYsa0JBQU0sQ0FBQyxJQUFJLEVBQUUsK0JBQStCLEtBQUssS0FBSztBQUM1RixZQUFZLFVBQVUsQ0FBQyxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ3ZELFlBQVksSUFBSU0sd0NBQXFCLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtBQUN6RyxnQkFBZ0IsT0FBTztBQUN2QixhQUFhO0FBQ2I7QUFDQTtBQUNBLFlBQVksSUFBSSxDQUFDQSx3Q0FBcUIsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7QUFDakYsZ0JBQWdCLE9BQU87QUFDdkIsYUFBYTtBQUNiLFlBQVksSUFBSSxVQUFVLENBQUMsNEJBQTRCLEVBQUU7QUFDekQsZ0JBQWdCLE9BQU87QUFDdkIsYUFBYTtBQUNiLFlBQVksUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxTQUFTLENBQUMsQ0FBQztBQUNYLFFBQVEsZ0JBQWdCLENBQUMsSUFBSTtBQUM3QixZQUFZUyxrQ0FBZSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQztBQUN4RSxTQUFTLENBQUM7QUFDVjtBQUNBLFFBQVEsT0FBTyxNQUFNO0FBQ3JCLFlBQVksZ0JBQWdCLENBQUMsT0FBTyxDQUFDLE9BQU8sSUFBSSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQzNELFNBQVMsQ0FBQztBQUNWLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxrQkFBa0IsQ0FBQyxlQUFlLEVBQUU7QUFDL0MsUUFBUSxVQUFVLENBQUMsNEJBQTRCLEdBQUcsSUFBSSxDQUFDO0FBQ3ZELFFBQVEsVUFBVSxDQUFDLE1BQU07QUFDekIsWUFBWSxVQUFVLENBQUMsNEJBQTRCLEdBQUcsS0FBSyxDQUFDO0FBQzVELFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUM1QixLQUFLO0FBQ0w7O0FDNUpBO0FBSUE7QUFDTyxNQUFNLElBQUk7QUFDakI7QUFDQSxJQUFJLE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBQztBQUM5QixRQUFRLE1BQU0sVUFBVSxHQUFHLElBQUlWLHVCQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDdkQsUUFBUSxPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDN0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFdBQVcsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQztBQUN2RCxRQUFRLEdBQUcsVUFBVSxDQUFDO0FBQ3RCLFlBQVksT0FBTyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztBQUMzRCxTQUFTO0FBQ1QsUUFBUSxHQUFHLFVBQVUsQ0FBQztBQUN0QixZQUFZLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDM0QsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDO0FBQ2pELFFBQVEsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6QyxRQUFRLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsUUFBUSxPQUFPLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQy9DLFFBQVEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQzFELFFBQVEsT0FBTyxPQUFPLENBQUM7QUFDdkIsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQztBQUMzQyxRQUFRLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekMsUUFBUSxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2hDLFFBQVEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQzFELFFBQVEsT0FBTyxPQUFPLENBQUM7QUFDdkIsS0FBSztBQUNMOztBQzdCQSxNQUFNVCxLQUFHLEdBQUcsSUFBSUMsa0JBQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN2QztBQUNBLE1BQU0sTUFBTSxHQUFHLElBQUlNLGVBQUcsRUFBRSxDQUFDO0FBQ3pCLE1BQU0sV0FBVyxHQUFHLElBQUlBLGVBQUcsRUFBRSxDQUFDO0FBQzlCLE1BQU0sYUFBYSxHQUFHLElBQUlMLGdCQUFJLEVBQUUsQ0FBQztBQUNqQztBQUNPLE1BQU0sWUFBWSxDQUFDO0FBQzFCO0FBQ0EsSUFBSSxPQUFPLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQ2xDLFFBQVEsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ2xDLFlBQVksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxlQUFlLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNyRixTQUFTLE1BQU07QUFDZjtBQUNBLFlBQVksSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNwRCxZQUFZLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEQsWUFBWSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksZUFBZSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDakYsWUFBWSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsQ0FBQztBQUMzQyxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUU7QUFDN0IsUUFBUSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDekMsWUFBWSxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZDLFlBQVksVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQyxTQUFTO0FBQ1QsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDbEMsWUFBWSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2hDLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLEdBQUcsQ0FBQyxFQUFFO0FBQzNDLFFBQVEsWUFBWSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNyRCxRQUFRLEdBQUcsWUFBWSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3QyxZQUFZLE9BQU87QUFDbkIsU0FBUztBQUNULFFBQVEsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDbkMsWUFBWUYsS0FBRyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsR0FBRyxJQUFJLENBQUMsQ0FBQztBQUN2RCxZQUFZLE9BQU87QUFDbkIsU0FBUztBQUNULFFBQVEsR0FBRyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3pDLFlBQVksYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2QyxZQUFZLFVBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDM0MsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxXQUFXLENBQUMsSUFBSSxFQUFFLE9BQU8sR0FBRyxDQUFDLEVBQUU7QUFDMUMsUUFBUSxZQUFZLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNsRCxRQUFRLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ25DLFlBQVlBLEtBQUcsQ0FBQyxLQUFLLENBQUMsd0JBQXdCLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDdkQsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzFDLFlBQVksYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQyxZQUFZLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDMUQsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxhQUFhLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtBQUN4QyxRQUFRLEdBQUcsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3hDLFlBQVksV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSUUsZ0JBQUksRUFBRSxDQUFDLENBQUM7QUFDOUMsU0FBUztBQUNULFFBQVEsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ3JELFlBQVksV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0MsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQzNDLFFBQVEsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDeEMsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVCxRQUFRLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlDLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxhQUFhLENBQUMsSUFBSSxFQUFFO0FBQy9CLFFBQVEsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDeEMsWUFBWSxPQUFPLEtBQUssQ0FBQztBQUN6QixTQUFTO0FBQ1QsUUFBUSxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2hELEtBQUs7QUFDTDs7QUNyRk8sTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QjtBQUNBLElBQUksV0FBVyxHQUFHO0FBQ2xCO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRTtBQUMxQixRQUFRLE1BQU0saUJBQWlCLENBQUM7QUFDaEMsS0FBSztBQUNMO0FBQ0E7O0FDSkEsTUFBTUYsS0FBRyxHQUFHLElBQUlDLGtCQUFNLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUNuRDtBQUNPLE1BQU0sd0JBQXdCLFNBQVMsZ0JBQWdCO0FBQzlEO0FBQ0EsSUFBSSxXQUFXLEdBQUc7QUFDbEI7QUFDQSxRQUFRLEtBQUssRUFBRSxDQUFDO0FBQ2hCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUdhLHVCQUFjLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3RFO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsR0FBR0EsdUJBQWMsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMxRTtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLEdBQUdBLHVCQUFjLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDMUUsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFDckIsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUU7QUFDOUQsWUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLG9GQUFvRixDQUFDLENBQUM7QUFDbEgsU0FBUztBQUNULFFBQVEsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkUsUUFBUSxHQUFHLENBQUMsUUFBUSxFQUFFO0FBQ3RCLFlBQVlkLEtBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDN0MsWUFBWSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDNUIsWUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRjtBQUNBLFNBQVM7QUFDVCxRQUFRLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQyxDQUFDO0FBQzdHLFFBQVEsSUFBSW9CLG9CQUFPLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM3RTtBQUNBLFFBQVEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekM7QUFDQSxRQUFRLE9BQU8sSUFBSSxTQUFTLENBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLGtCQUFrQixDQUFDLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO0FBQ3BJLEtBQUs7QUFDTDtBQUNBLElBQUksV0FBVyxDQUFDLElBQUksRUFBRTtBQUN0QixRQUFRLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEQsWUFBWSxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQSxDQUFDO0FBQ0Q7QUFDQSxJQUFJLHdCQUF3QixHQUFHLENBQUM7O0FDdER6QixNQUFNLGNBQWMsQ0FBQztBQUM1QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRTtBQUN4RCxRQUFRLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2hHLFFBQVEsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUssVUFBVSxDQUFDLE1BQU0sRUFBRTtBQUNwRCxZQUFZLE9BQU87QUFDbkIsU0FBUztBQUNUO0FBQ0EsUUFBUSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBQ25GLFFBQVEsTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUM1RCxRQUFRLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM5RDtBQUNBLFFBQVEsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBSztBQUN0QyxZQUFZLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDakUsWUFBWSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDaEUsU0FBUyxDQUFDLENBQUM7QUFDWCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTywyQkFBMkIsQ0FBQyxHQUFHLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxVQUFVLEdBQUcsSUFBSSxLQUFLLEVBQUUsRUFBRTtBQUMzRjtBQUNBLFFBQVEsTUFBTSxXQUFXLEdBQUcsVUFBVSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ2xFO0FBQ0EsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDM0IsWUFBWSxhQUFhLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN6RCxTQUFTO0FBQ1Q7QUFDQSxRQUFRLElBQUlaLHVCQUFXLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUN6RixZQUFZLFVBQVUsR0FBR1Esc0JBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNoRSxZQUFZLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUMvQixnQkFBZ0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDbEQsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0EsUUFBUSxJQUFJUix1QkFBVyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDN0UsWUFBWSxVQUFVLEdBQUdRLHNCQUFVLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEUsWUFBWSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDbEMsZ0JBQWdCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3JELGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQSxRQUFRLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtBQUN2QixZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxLQUFLO0FBQzdDLGdCQUFnQixVQUFVLEdBQUcsY0FBYyxDQUFDLDJCQUEyQixDQUFDLEdBQUcsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ25ILGFBQWEsQ0FBQyxDQUFDO0FBQ2YsU0FBUztBQUNUO0FBQ0EsUUFBUSxPQUFPLFVBQVUsQ0FBQztBQUMxQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLDRCQUE0QixDQUFDLFdBQVcsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFO0FBQzFFO0FBQ0EsUUFBUSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDaEQ7QUFDQSxRQUFRLE1BQU0saUJBQWlCLEdBQUcsY0FBYyxDQUFDLHNCQUFzQixDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsQ0FBQztBQUMzRjtBQUNBLFFBQVEsSUFBSSxDQUFDLEtBQUssaUJBQWlCLENBQUMsTUFBTSxFQUFFO0FBQzVDLFlBQVksT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDckMsU0FBUztBQUNUO0FBQ0EsUUFBUSxNQUFNLHdCQUF3QixHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDekUsUUFBUSxNQUFNLFFBQVEsR0FBRyxjQUFjLENBQUMsMkJBQTJCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN2RjtBQUNBLFFBQVEsSUFBSSxDQUFDUix1QkFBVyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxFQUFFO0FBQ3JFLFlBQVksTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM3RSxZQUFZLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDcEUsWUFBWSxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDL0QsU0FBUztBQUNUO0FBQ0EsUUFBUSxPQUFPLHdCQUF3QixDQUFDO0FBQ3hDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8seUJBQXlCLENBQUMsV0FBVyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUU7QUFDdkU7QUFDQSxRQUFRLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNoRDtBQUNBLFFBQVEsTUFBTSxpQkFBaUIsR0FBRyxjQUFjLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQzNGO0FBQ0EsUUFBUSxJQUFJLENBQUMsS0FBSyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUU7QUFDNUMsWUFBWSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNyQyxTQUFTO0FBQ1Q7QUFDQSxRQUFRLE1BQU0sd0JBQXdCLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN6RSxRQUFRLE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3ZGO0FBQ0EsUUFBUSxJQUFJLENBQUNBLHVCQUFXLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUU7QUFDckUsWUFBWSxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzdFLFlBQVksTUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNwRSxZQUFZLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsRSxTQUFTO0FBQ1Q7QUFDQSxRQUFRLE9BQU8sd0JBQXdCLENBQUM7QUFDeEMsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLDJCQUEyQixDQUFDLFlBQVksRUFBRTtBQUNyRDtBQUNBLFFBQVEsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksS0FBSztBQUN0RCxZQUFZLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztBQUM5QixTQUFTLENBQUMsQ0FBQztBQUNYO0FBQ0EsUUFBUSxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDbkMsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sc0JBQXNCLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxTQUFTLEdBQUcsSUFBSSxLQUFLLEVBQUUsRUFBRSxJQUFJLEdBQUcsSUFBSSxFQUFFO0FBQzNGO0FBQ0E7QUFDQSxRQUFRLElBQUksV0FBVyxLQUFLLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDOUMsWUFBWSxTQUFTLEdBQUdRLHNCQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4RCxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFFBQVEsSUFBSSxXQUFXLEtBQUssSUFBSSxDQUFDLFdBQVcsSUFBSSxTQUFTLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFO0FBQ3JGLFlBQVksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEtBQUs7QUFDN0MsZ0JBQWdCLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDNUMsb0JBQW9CLFNBQVMsR0FBRyxjQUFjLENBQUMsc0JBQXNCLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDaEgsaUJBQWlCO0FBQ2pCLGFBQWEsQ0FBQyxDQUFDO0FBQ2YsU0FBUztBQUNUO0FBQ0E7QUFDQSxRQUFRLElBQUksU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDbEMsWUFBWSxTQUFTLEdBQUdBLHNCQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4RCxTQUFTO0FBQ1Q7QUFDQSxRQUFRLElBQUksSUFBSSxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzFDO0FBQ0EsWUFBWSxPQUFPLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN2QyxTQUFTO0FBQ1QsUUFBUSxPQUFPLFNBQVMsQ0FBQztBQUN6QixLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sWUFBWSxDQUFDLEtBQUssRUFBRTtBQUMvQjtBQUNBLFFBQVEsSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFO0FBQzNCLFlBQVksT0FBTyxHQUFHLENBQUM7QUFDdkIsU0FBUztBQUNUO0FBQ0EsUUFBUSxJQUFJUix1QkFBVyxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDbkQsWUFBWSxPQUFPLEdBQUcsQ0FBQztBQUN2QixTQUFTO0FBQ1Q7QUFDQSxRQUFRLE9BQU8sS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUMzQixLQUFLO0FBQ0w7QUFDQTs7QUN2TU8sTUFBTSxnQkFBZ0IsQ0FBQztBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sTUFBTSxDQUFDLFVBQVUsRUFBRTtBQUM5QixRQUFRLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNoRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxVQUFVLEVBQUU7QUFDNUI7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7QUFDckM7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ3BDO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ2hDO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDckM7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDbkM7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDeEI7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLEdBQUcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxHQUFHLGNBQWMsRUFBRTtBQUMvRDtBQUNBO0FBQ0EsUUFBUSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pDO0FBQ0EsUUFBUSxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSTtBQUN2QyxZQUFZLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQztBQUMzQixZQUFZLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUN6QixZQUFZLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUMxQyxnQkFBZ0IsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNyRCxnQkFBZ0IsR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQ3RELGdCQUFnQixHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdkQsZ0JBQWdCLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRTtBQUNsQyxvQkFBb0IsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDakQsb0JBQW9CLEdBQUcsR0FBRyxVQUFVLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3RixpQkFBaUI7QUFDakIsYUFBYTtBQUNiLFlBQVksT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNoRDtBQUNBLFNBQVMsQ0FBQyxDQUFDO0FBQ1gsUUFBUSxPQUFPLE9BQU8sQ0FBQztBQUN2QixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxjQUFjLEVBQUU7QUFDakMsUUFBUSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDOUIsWUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLG9EQUFvRCxDQUFDLENBQUM7QUFDbEYsU0FBUztBQUNULFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsRUFBRSxHQUFHLGNBQWMsQ0FBQyxDQUFDO0FBQzFHLFFBQVEsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDakQsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDL0MsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxjQUFjLEVBQUU7QUFDckMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUMvQixZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMsMEZBQTBGLENBQUMsQ0FBQztBQUN4SCxTQUFTO0FBQ1QsUUFBUSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUNyQyxZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMsNkZBQTZGLENBQUMsQ0FBQztBQUMzSCxTQUFTO0FBQ1QsUUFBUSxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxHQUFHLGNBQWMsQ0FBQyxDQUFDO0FBQzNHLFFBQVEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDOUMsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDO0FBQ3hDLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtBQUNmLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDL0IsWUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLDBGQUEwRixDQUFDLENBQUM7QUFDeEgsU0FBUztBQUNULFFBQVEsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDckMsWUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLDZGQUE2RixDQUFDLENBQUM7QUFDM0gsU0FBUztBQUNULFFBQVEsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDM0MsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDO0FBQ3JDLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEdBQUc7QUFDWCxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQy9CLFlBQVksTUFBTSxJQUFJLEtBQUssQ0FBQywwRkFBMEYsQ0FBQyxDQUFDO0FBQ3hILFNBQVM7QUFDVCxRQUFRLElBQUksSUFBSSxDQUFDLGdCQUFnQixLQUFLLElBQUksRUFBRTtBQUM1QyxZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztBQUM5RSxTQUFTO0FBQ1QsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDN0MsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztBQUNwRCxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBLElBQUksS0FBSyxHQUFHO0FBQ1osUUFBUSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUNyQyxZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMscURBQXFELENBQUMsQ0FBQztBQUNuRixTQUFTO0FBQ1QsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDL0MsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztBQUNwRCxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBLElBQUksS0FBSyxHQUFHO0FBQ1osUUFBUSxPQUFPLElBQUksU0FBUyxDQUFDLHVCQUF1QixFQUFFLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDM0YsS0FBSztBQUNMLENBQUM7QUFDRDtBQUNBLElBQUksdUJBQXVCLEdBQUcsQ0FBQzs7QUM3SXhCLE1BQU0sc0JBQXNCLFNBQVMsZ0JBQWdCLENBQUM7QUFDN0Q7QUFDQSxJQUFJLFdBQVcsR0FBRztBQUNsQixRQUFRLEtBQUssRUFBRSxDQUFDO0FBQ2hCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxjQUFjLEdBQUdNLHVCQUFjLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3RFO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsR0FBR0EsdUJBQWMsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUMxRSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUNyQixRQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRTtBQUNyRSxZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMsNkZBQTZGLENBQUMsQ0FBQztBQUMzSCxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFFBQVEsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztBQUNuRztBQUNBO0FBQ0EsUUFBUSxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDakY7QUFDQSxRQUFRLFlBQVksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztBQUMxRDtBQUNBLFFBQVEsT0FBTyxTQUFTLENBQUM7QUFDekIsS0FBSztBQUNMO0FBQ0E7O0FDaEJBLE1BQU1kLEtBQUcsR0FBRyxJQUFJQyxrQkFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3RDO0FBQ08sTUFBTSxXQUFXLFNBQVMsWUFBWSxDQUFDO0FBQzlDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxHQUFHLElBQUlvQixvQkFBVyxFQUFFLEVBQUUsV0FBVyxHQUFHLElBQUksS0FBSyxFQUFFLEVBQUU7QUFDMUY7QUFDQSxRQUFRLEtBQUssRUFBRSxDQUFDO0FBQ2hCO0FBQ0E7QUFDQSxRQUFRLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQztBQUNuRDtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUM3QjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztBQUN2QztBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7QUFDMUM7QUFDQTtBQUNBLFFBQVEsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDakM7QUFDQSxRQUFRLElBQUksQ0FBQyxhQUFhLEdBQUc7QUFDN0IsWUFBWUMsd0JBQWUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7QUFDckQsWUFBWUEsd0JBQWUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDO0FBQ25ELFlBQVlBLHdCQUFlLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDO0FBQ3JELFlBQVlBLHdCQUFlLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDO0FBQzdELFlBQVlBLHdCQUFlLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDO0FBQzNELFlBQVlDLHdCQUFlLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQztBQUNqRCxTQUFTLENBQUM7QUFDVjtBQUNBLFFBQVEsSUFBSSxDQUFDLHVCQUF1QixHQUFHLEVBQUUsd0JBQXdCLEVBQUUsQ0FBQztBQUNwRTtBQUNBLFFBQVEsSUFBSSxDQUFDLHlCQUF5QixHQUFHLEVBQUVDLGtDQUF5QixFQUFFLENBQUM7QUFDdkU7QUFDQSxLQUFLO0FBQ0w7QUFDQSxJQUFJLE1BQU0sR0FBRyxHQUFHO0FBQ2hCLFFBQVF4QixLQUFHLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDeEMsUUFBUSxJQUFJLENBQUMsTUFBTTtBQUNuQixhQUFhLGdCQUFnQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDakQsYUFBYSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUM7QUFDaEUsYUFBYSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUNyRSxRQUFRLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNoRCxRQUFRYSwrQkFBWSxDQUFDLHVCQUF1QixDQUFDLElBQUlULGtCQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQzVFLFFBQVEsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0FBQ2xFLFFBQVEsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQzVCLFFBQVEsT0FBTyxNQUFNLENBQUM7QUFDdEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDbEIsUUFBUSxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDekM7QUFDQSxRQUFRLElBQUksSUFBSSxDQUFDLFlBQVksSUFBSUksdUJBQVcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN2RyxZQUFZLGNBQWMsQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzNHLFlBQVksT0FBTztBQUNuQixTQUFTO0FBQ1QsUUFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sU0FBUyxDQUFDLEdBQUcsRUFBRTtBQUN6QixRQUFRLElBQUk7QUFDWixZQUFZLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuRSxZQUFZLElBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDMUQsWUFBWSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDeEMsWUFBWSxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDO0FBQy9ELFlBQVksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNyQyxZQUFZLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztBQUNyQyxTQUFTLENBQUMsTUFBTSxLQUFLLEVBQUU7QUFDdkIsWUFBWVIsS0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixZQUFZLE9BQU8sSUFBSSxDQUFDO0FBQ3hCLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQSxJQUFJLFlBQVksR0FBRztBQUNuQixRQUFRLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzVDLFlBQVksT0FBTztBQUNuQixTQUFTO0FBQ1QsUUFBUSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ25DLFFBQVEsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztBQUNuRCxRQUFRLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxLQUFLO0FBQzVDLFlBQVksTUFBTSxRQUFRLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUN6QyxZQUFZZSxzQkFBYSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDbkQsWUFBWUMsc0JBQVUsQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3JELFNBQVMsQ0FBQyxDQUFDO0FBQ1gsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLHVCQUF1QixDQUFDLEdBQUcsRUFBRTtBQUNqQyxRQUFRLElBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0FBQ3JDLFFBQVEsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBSztBQUNsRCxZQUFZLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQzFELGdCQUFnQixpQkFBaUIsR0FBRyxLQUFLLENBQUM7QUFDMUMsYUFBYTtBQUNiLFNBQVMsQ0FBQyxDQUFDO0FBQ1gsUUFBUSxPQUFPLGlCQUFpQixDQUFDO0FBQ2pDLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksY0FBYyxHQUFHO0FBQ3JCLFFBQVEsTUFBTSxDQUFDLFFBQVEsR0FBRyxNQUFNO0FBQ2hDLFlBQVloQixLQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDaEQsVUFBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksc0JBQXNCLEdBQUc7QUFDN0IsUUFBUSxNQUFNLENBQUMsZ0JBQWdCLEdBQUcsTUFBTTtBQUN4QyxZQUFZLE1BQU0sVUFBVSxHQUFHeUIsdUJBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25HLFlBQVl6QixLQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMzRCxVQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxtQkFBbUIsR0FBRztBQUMxQixRQUFRLE1BQU0sQ0FBQyxhQUFhLEdBQUcsTUFBTTtBQUNyQyxZQUFZLE1BQU0sVUFBVSxHQUFHeUIsdUJBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqRyxZQUFZekIsS0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0QsVUFBUztBQUNULEtBQUs7QUFDTDtBQUNBOztBQ3pLTyxNQUFNLE9BQU8sQ0FBQztBQUNyQjtBQUNBLElBQUksT0FBTyxxQkFBcUIsR0FBRyxFQUFFLENBQUM7QUFDdEM7QUFDQSxJQUFJLE9BQU8sb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO0FBQ3BDLElBQUksT0FBTywrQkFBK0IsR0FBRyxDQUFDLENBQUM7QUFDL0MsSUFBSSxPQUFPLHVCQUF1QixHQUFHLENBQUMsQ0FBQztBQUN2QztBQUNBLElBQUksV0FBVyxDQUFDLEdBQUcsR0FBRyxJQUFJLEVBQUUsWUFBWSxHQUFHLElBQUksRUFBRSxPQUFPLEdBQUcsSUFBSSxFQUFFO0FBQ2pFLFFBQVEsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDdkIsUUFBUSxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztBQUN6QyxRQUFRLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBQy9CLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sS0FBSyxDQUFDLGFBQWEsRUFBRTtBQUNoQyxRQUFRLElBQUksYUFBYSxJQUFJLElBQUksSUFBSSxhQUFhLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsSUFBSSxDQUFDMEIsc0JBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsRUFBRTtBQUM1SSxZQUFZLE1BQU0sS0FBSyxDQUFDLDRCQUE0QixHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxnREFBZ0QsQ0FBQyxDQUFDO0FBQ3pJLFNBQVM7QUFDVCxRQUFRLE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQ25GLFFBQVEsTUFBTSxrQkFBa0IsR0FBRyxhQUFhLENBQUMsU0FBUztBQUMxRCxZQUFZLE9BQU8sQ0FBQyxvQkFBb0I7QUFDeEMsWUFBWSxPQUFPLENBQUMsb0JBQW9CLEdBQUcsT0FBTyxDQUFDLCtCQUErQixDQUFDLENBQUM7QUFDcEY7QUFDQSxRQUFRLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxTQUFTO0FBQ3JELFlBQVksT0FBTyxDQUFDLG9CQUFvQixHQUFHLE9BQU8sQ0FBQywrQkFBK0I7QUFDbEYsWUFBWSxPQUFPLENBQUMsb0JBQW9CLEdBQUcsT0FBTyxDQUFDLCtCQUErQixHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQ3RIO0FBQ0EsUUFBUSxNQUFNLEdBQUcsR0FBR0Esc0JBQVUsQ0FBQyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDMUQsUUFBUSxNQUFNLFlBQVksR0FBR0Esc0JBQVUsQ0FBQyxlQUFlLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUM1RSxRQUFRLE1BQU0sT0FBTyxHQUFHQSxzQkFBVSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNsRTtBQUNBLFFBQVEsT0FBTyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZELEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxRQUFRLEdBQUc7QUFDZixRQUFRLE1BQU0sU0FBUyxHQUFHbEIsdUJBQVcsQ0FBQyxPQUFPLENBQUNrQixzQkFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3JILFFBQVEsTUFBTSxrQkFBa0IsR0FBR2xCLHVCQUFXLENBQUMsT0FBTyxDQUFDa0Isc0JBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLE9BQU8sQ0FBQywrQkFBK0IsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNsSixRQUFRLE1BQU0sYUFBYSxHQUFHbEIsdUJBQVcsQ0FBQyxPQUFPLENBQUNrQixzQkFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxDQUFDLHVCQUF1QixFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2hJLFFBQVEsT0FBTyxTQUFTLEdBQUcsa0JBQWtCLEdBQUcsYUFBYSxDQUFDO0FBQzlELEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxHQUFHO0FBQ2IsUUFBUSxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2pDLFFBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUVDLG9CQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3JFLFFBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQ2hFLFFBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7QUFDdkYsUUFBUSxNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN0RCxRQUFRLE9BQU8sTUFBTSxDQUFDO0FBQ3RCLEtBQUs7QUFDTDs7QUMxRE8sTUFBTSxNQUFNLENBQUM7QUFDcEI7QUFDQSxJQUFJLE9BQU8sb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO0FBQ3BDO0FBQ0EsSUFBSSxPQUFPLDhCQUE4QixHQUFHLENBQUMsQ0FBQztBQUM5QyxJQUFJLE9BQU8sdUJBQXVCLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZDO0FBQ0EsSUFBSSxXQUFXLENBQUMsV0FBVyxHQUFHLElBQUksRUFBRSxPQUFPLEdBQUcsSUFBSSxFQUFFO0FBQ3BELFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7QUFDdkMsUUFBUSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUMvQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxPQUFPLEtBQUssQ0FBQyxZQUFZLEVBQUU7QUFDL0IsUUFBUSxJQUFJLFlBQVksSUFBSSxJQUFJLElBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsb0JBQW9CLElBQUksQ0FBQ0Qsc0JBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsRUFBRTtBQUN6SSxZQUFZLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixHQUFHLGdEQUFnRCxDQUFDLENBQUM7QUFDMUksU0FBUztBQUNULFFBQVEsTUFBTSxXQUFXLEdBQUdBLHNCQUFVLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLENBQUM7QUFDekgsUUFBUSxNQUFNLE9BQU8sR0FBR0Esc0JBQVUsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsOEJBQThCLEVBQUUsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQztBQUMvSSxRQUFRLE9BQU8sSUFBSSxNQUFNLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2hELEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxRQUFRLEdBQUc7QUFDZixRQUFRLE1BQU0saUJBQWlCLEdBQUdsQix1QkFBVyxDQUFDLE9BQU8sQ0FBQ2tCLHNCQUFVLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLENBQUMsOEJBQThCLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDOUksUUFBUSxNQUFNLGFBQWEsR0FBR2xCLHVCQUFXLENBQUMsT0FBTyxDQUFDa0Isc0JBQVUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMvSCxRQUFRLE9BQU8saUJBQWlCLEdBQUcsYUFBYSxDQUFDO0FBQ2pELEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxHQUFHO0FBQ2IsUUFBUSxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2pDLFFBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQzVELFFBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ25GLFFBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDckQsUUFBUSxPQUFPLE1BQU0sQ0FBQztBQUN0QixLQUFLO0FBQ0w7O0FDekNBLE1BQU0xQixLQUFHLEdBQUcsSUFBSUMsa0JBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QjtBQUNPLE1BQU0sRUFBRSxDQUFDO0FBQ2hCO0FBQ0EsSUFBSSxXQUFXLENBQUMsT0FBTyxHQUFHLElBQUksRUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFO0FBQy9DLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFPO0FBQzlCLFFBQVEsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDN0IsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxLQUFLLENBQUMsUUFBUSxFQUFFO0FBQzNCLFFBQVEsTUFBTSxhQUFhLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7QUFDbkYsUUFBUSxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQy9FO0FBQ0EsUUFBUSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3JELFFBQVEsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNsRDtBQUNBLFFBQVEsT0FBTyxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdkMsS0FBSztBQUNMO0FBQ0EsSUFBSSxNQUFNLEdBQUc7QUFDYixRQUFRLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDakMsUUFBUSxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3BELFFBQVEsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRTtBQUM1RCxZQUFZLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ25DLFNBQVM7QUFDVCxRQUFRLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDbEQsUUFBUSxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRSxFQUFFO0FBQzNELFlBQVksTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbkMsU0FBUztBQUNULFFBQVEsT0FBTyxNQUFNLENBQUM7QUFDdEIsS0FBSztBQUNMO0FBQ0EsSUFBSSxZQUFZLEdBQUc7QUFDbkIsUUFBUSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDckMsUUFBUSxJQUFJLFlBQVksR0FBRyxHQUFFO0FBQzdCLFFBQVEsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLFFBQVEsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRTtBQUNyRCxZQUFZLElBQUksS0FBSyxFQUFFO0FBQ3ZCLGdCQUFnQixZQUFZLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7QUFDbkQsYUFBYSxNQUFNO0FBQ25CLGdCQUFnQixZQUFZLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQzFELGFBQWE7QUFDYixZQUFZLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDMUIsU0FBUztBQUNULFFBQVEsT0FBTyxZQUFZLENBQUM7QUFDNUIsS0FBSztBQUNMO0FBQ0EsSUFBSSxLQUFLLENBQUMsRUFBRTtBQUNaLFFBQVFELEtBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7QUFDdEMsS0FBSztBQUNMO0FBQ0EsSUFBSSxRQUFRLEdBQUc7QUFDZixRQUFRLE9BQU8sT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUN0RCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE1BQU0sR0FBRztBQUNiLFFBQVEsT0FBTyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDakMsS0FBSztBQUNMO0FBQ0E7O0FDbEVBO0FBQ0EsSUFBSSxxQkFBcUIsR0FBRyxJQUFJTyxlQUFHLEVBQUUsQ0FBQztBQUN0QztBQUNPLE1BQU0sa0JBQWtCLENBQUM7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sU0FBUyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7QUFDeEMsUUFBUSxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3JELEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxPQUFPLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtBQUNwQyxRQUFRLE9BQU8scUJBQXFCLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDckUsS0FBSztBQUNMO0FBQ0E7O0FDZlksSUFBSU4sa0JBQU0sQ0FBQyx5QkFBeUIsRUFBRTtBQUNsRDtBQUNPLE1BQU0sdUJBQXVCLENBQUM7QUFDckM7QUFDQSxJQUFJLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO0FBQ2xDLFFBQVEsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDM0IsUUFBUSxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUNuQyxRQUFRLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSUMsZ0JBQUksRUFBRSxDQUFDO0FBQ2xDLFFBQVEsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJQSxnQkFBSSxFQUFFLENBQUM7QUFDbEMsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFO0FBQ2xDLFFBQVEsT0FBTyxJQUFJLHVCQUF1QixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM3RCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtBQUNmLFFBQVEsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFO0FBQ2QsUUFBUSxNQUFNLE1BQU0sR0FBRyxNQUFNO0FBQzdCLFlBQVksSUFBSSxVQUFVLEdBQUdDLDRCQUFnQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvRSxZQUFZLElBQUksVUFBVSxLQUFLLEtBQUssQ0FBQyxLQUFLLEVBQUU7QUFDNUMsZ0JBQWdCQSw0QkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMvRSxhQUFhO0FBQ2IsWUFBWSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDMUQsZ0JBQWdCLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyRCxhQUFhO0FBQ2IsU0FBUyxDQUFDO0FBQ1YsUUFBUSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxJQUFJQyxrQkFBTSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQzNELFFBQVEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSUEsa0JBQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUMxRCxRQUFRLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN0QjtBQUNBLFFBQVEsTUFBTSxNQUFNLEdBQUcsTUFBTTtBQUM3QixZQUFZLElBQUksVUFBVSxHQUFHRCw0QkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0UsWUFBWSxJQUFJLFVBQVUsS0FBSyxLQUFLLENBQUMsS0FBSyxFQUFFO0FBQzVDLGdCQUFnQixLQUFLLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQztBQUN6QyxhQUFhO0FBQ2IsWUFBWSxJQUFJLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQztBQUMvRSxnQkFBZ0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNELGFBQWE7QUFDYixTQUFTLENBQUM7QUFDVjtBQUNBLFFBQVEsSUFBSSxtQkFBbUIsR0FBRyxZQUFZLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdFLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsRUFBRTtBQUM5QyxZQUFZLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsR0FBRyxNQUFNO0FBQ3BELGdCQUFnQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDNUIsY0FBYTtBQUNiLFNBQVM7QUFDVDtBQUNBLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakMsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQztBQUNBLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEdBQUc7QUFDWCxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sS0FBSztBQUNoRCxZQUFZLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0IsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDakIsS0FBSztBQUNMO0FBQ0EsSUFBSSxJQUFJLEdBQUc7QUFDWCxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sS0FBSztBQUNoRCxZQUFZLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0IsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDakIsS0FBSztBQUNMOztBQ2hGTyxNQUFNLGtCQUFrQixDQUFDO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8saUJBQWlCLENBQUMsTUFBTSxFQUFFO0FBQ3JDLFFBQVEsT0FBTyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDakMsWUFBWSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssS0FBSztBQUMxQyxnQkFBZ0IsSUFBSSxPQUFPLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQ3JEO0FBQ0EsZ0JBQWdCLElBQUksbUJBQW1CLEdBQUcsWUFBWSxHQUFHLElBQUksQ0FBQztBQUM5RCxnQkFBZ0IsSUFBSSxlQUFlLEdBQUcsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDbEUsZ0JBQWdCLEdBQUcsZUFBZSxJQUFJLE9BQU8sZUFBZSxLQUFLLFVBQVUsRUFBRTtBQUM3RSxvQkFBb0IsSUFBSSxvQkFBb0IsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzVFLG9CQUFvQixvQkFBb0IsRUFBRSxDQUFDO0FBQzNDLGlCQUFpQjtBQUNqQixnQkFBZ0IsT0FBTyxPQUFPLEtBQUssS0FBSyxDQUFDO0FBQ3pDLGFBQWE7QUFDYixTQUFTLENBQUMsQ0FBQztBQUNYLEtBQUs7QUFDTDs7QUNyQk8sTUFBTSxLQUFLLENBQUM7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLEtBQUssRUFBRTtBQUN2QjtBQUNBO0FBQ0EsUUFBUSxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUMzQixRQUFRLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksV0FBVyxDQUFDO0FBQ3pELFlBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNoRSxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0EsSUFBSSxlQUFlLEdBQUc7QUFDdEIsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3JDLEtBQUs7QUFDTDtBQUNBLElBQUksY0FBYyxHQUFHO0FBQ3JCLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNwQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksS0FBSyxHQUFHO0FBQ2hCLFFBQVEsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDMUQsWUFBWSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUMzQyxTQUFTO0FBQ1QsUUFBUSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFO0FBQ3JDO0FBQ0EsWUFBWSxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztBQUN6RCxZQUFZLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRTtBQUNwQyxnQkFBZ0IsT0FBTyxZQUFZLENBQUMsS0FBSyxDQUFDO0FBQzFDLGFBQWE7QUFDYixTQUFTO0FBQ1QsUUFBUSxPQUFPLEVBQUUsQ0FBQztBQUNsQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksT0FBTyxHQUFHO0FBQ2xCLFFBQVEsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQUNsQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksT0FBTyxFQUFFO0FBQ2pCLFFBQVEsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQUNsQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksT0FBTyxHQUFHO0FBQ2xCLFFBQVEsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQUNsQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksT0FBTyxHQUFHO0FBQ2xCLFFBQVEsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQUNsQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksSUFBSSxNQUFNLEdBQUc7QUFDakIsUUFBUSxJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDN0MsWUFBWSxPQUFPLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvRSxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLElBQUksYUFBYSxHQUFHO0FBQ3hCLFFBQVEsSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFO0FBQ3BELFlBQVksT0FBTyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDdEYsU0FBUztBQUNULFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLLHlCQUF5QixDQUFDLGFBQWEsRUFBRTtBQUM5QyxRQUFRLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUU7QUFDdEMsWUFBWSxPQUFPLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN2SCxTQUFTO0FBQ1QsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksV0FBVyxHQUFHO0FBQ3RCLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ3hCLFlBQVksT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNyQyxTQUFTO0FBQ1QsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksT0FBTyxHQUFHO0FBQ2xCLFFBQVEsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQUNsQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUU7QUFDcEIsUUFBUSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQztBQUMzQyxLQUFLO0FBQ0w7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ08sTUFBTSxtQkFBbUIsU0FBU0Msa0JBQU0sQ0FBQztBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDO0FBQy9CLFFBQVEsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7QUFDN0IsUUFBUSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztBQUM3QixLQUFLO0FBQ0w7QUFDQSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDaEIsUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3pELFlBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDckMsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBOztBQ3JCQSxNQUFNSixLQUFHLEdBQUcsSUFBSUMsa0JBQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU0sWUFBWSxDQUFDO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFdBQVcsR0FBRztBQUNsQjtBQUNBLFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJTSxlQUFHLEVBQUUsQ0FBQztBQUNyQyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLFFBQVEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFO0FBQ2xDLFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ25ELFlBQVksSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLElBQUlMLGdCQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ3hELFNBQVM7QUFDVCxRQUFRLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN0RCxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sT0FBTyxDQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUU7QUFDeEMsUUFBUSxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQ3hCLFlBQVlGLEtBQUcsQ0FBQyxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUNqRCxZQUFZLE9BQU87QUFDbkIsU0FBUztBQUNULFFBQVEsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ25ELFlBQVksT0FBTztBQUNuQixTQUFTO0FBQ1QsUUFBUSxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDN0IsUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxLQUFLO0FBQ3RFLFlBQVksV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7QUFDdkQsWUFBWSxPQUFPLElBQUksQ0FBQztBQUN4QixTQUFTLENBQUMsQ0FBQztBQUNYLFFBQVEsSUFBSSxXQUFXLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUN0QyxZQUFZLE9BQU8sV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLFNBQVM7QUFDVCxRQUFRLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN4QyxLQUFLO0FBQ0w7QUFDQTs7QUNyRE8sTUFBTSxhQUFhLENBQUM7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQzdCLFFBQVEsT0FBTyxJQUFJLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUM5QyxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRTtBQUM3QjtBQUNBLFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7QUFDdkMsS0FBSztBQUNMO0FBQ0EsSUFBSSxLQUFLLEdBQUc7QUFDWixRQUFRLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ3hELFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7QUFDdEIsUUFBUSxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUM5RixRQUFRLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNqRCxZQUFZLGVBQWUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDOUMsU0FBUztBQUNULFFBQVEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUU0QixvQkFBUSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDbEcsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxHQUFHLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRTtBQUMvQixRQUFRLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzlGLFFBQVEsZUFBZSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDbkQsUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRUEsb0JBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2xHLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUU7QUFDOUIsUUFBUSxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUM5RixRQUFRLE9BQU9wQix1QkFBVyxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JGLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFO0FBQ3RCLFFBQVEsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDOUYsUUFBUSxPQUFPLGVBQWUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkQsS0FBSztBQUNMO0FBQ0EsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFO0FBQ3hCLFFBQVEsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQ25ELFlBQVksT0FBTyxJQUFJRCxlQUFHLEVBQUUsQ0FBQztBQUM3QixTQUFTO0FBQ1Q7QUFDQSxRQUFRLE1BQU0sZUFBZSxHQUFHLElBQUlBLGVBQUcsRUFBRSxDQUFDO0FBQzFDO0FBQ0EsUUFBUSxNQUFNLG9CQUFvQixHQUFHLElBQUlMLGdCQUFJLENBQUNNLHVCQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2hGLFFBQVEsb0JBQW9CLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sS0FBSztBQUN4RCxZQUFZLElBQUksQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNyRCxnQkFBZ0IsT0FBTztBQUN2QixhQUFhO0FBQ2IsWUFBWSxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzNELFlBQVksTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUM3RCxZQUFZLGVBQWUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQzVELFlBQVksT0FBTyxJQUFJLENBQUM7QUFDeEIsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2pCLFFBQVEsT0FBTyxlQUFlLENBQUM7QUFDL0IsS0FBSztBQUNMO0FBQ0E7O0FDeEZPLE1BQU0scUJBQXFCLENBQUM7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQzdCLFFBQVEsT0FBTyxJQUFJLHFCQUFxQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3RELEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxXQUFXLENBQUMsV0FBVyxFQUFFO0FBQzdCO0FBQ0EsUUFBUSxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztBQUN2QyxLQUFLO0FBQ0w7QUFDQSxJQUFJLEtBQUssR0FBRztBQUNaLFFBQVEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDeEQsUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRTtBQUNyQixRQUFRLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdkUsUUFBUSxJQUFJLGlCQUFpQixHQUFHQSx1QkFBVyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDdkUsUUFBUSxJQUFJLGdCQUFnQixHQUFHLElBQUlOLGdCQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUMzRDtBQUNBLFFBQVEsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDakQsWUFBWSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDOUMsU0FBUyxNQUFNO0FBQ2YsWUFBWSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0MsU0FBUztBQUNUO0FBQ0EsUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRWMsc0JBQVUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMzRyxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFO0FBQ3JCLFFBQVEsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2RSxRQUFRLElBQUksaUJBQWlCLEdBQUdSLHVCQUFXLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUN2RSxRQUFRLElBQUksZ0JBQWdCLEdBQUcsSUFBSU4sZ0JBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNEO0FBQ0EsUUFBUSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ2xELFlBQVksZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzNDLFNBQVM7QUFDVDtBQUNBLFFBQVEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUVjLHNCQUFVLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDM0csUUFBUSxPQUFPLElBQUksQ0FBQztBQUNwQixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBRTtBQUN0QixRQUFRLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdkUsUUFBUSxJQUFJLGlCQUFpQixHQUFHUix1QkFBVyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDdkUsUUFBUSxJQUFJLGdCQUFnQixHQUFHLElBQUlOLGdCQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUMzRDtBQUNBLFFBQVEsSUFBSSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDakQsWUFBWSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDOUMsU0FBUztBQUNUO0FBQ0EsUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRWMsc0JBQVUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMzRyxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxRQUFRLEVBQUU7QUFDN0MsUUFBUSxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZFLFFBQVEsSUFBSSxpQkFBaUIsR0FBR1IsdUJBQVcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZFLFFBQVEsSUFBSSxnQkFBZ0IsR0FBRyxJQUFJTixnQkFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDM0QsUUFBUSxJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFDL0I7QUFDQSxRQUFRLElBQUksQ0FBQ00sdUJBQVcsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsRUFBRTtBQUN6RCxZQUFZLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBSztBQUNoRCxnQkFBZ0IsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLEVBQUU7QUFDN0Qsb0JBQW9CLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUMsaUJBQWlCO0FBQ2pCLGdCQUFnQixPQUFPLElBQUksQ0FBQztBQUM1QixhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDckIsU0FBUztBQUNUO0FBQ0EsUUFBUSxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsYUFBYSxLQUFLO0FBQ2pELFlBQVksZ0JBQWdCLENBQUMsTUFBTSxDQUFDLGFBQWEsRUFBQztBQUNsRCxTQUFTLENBQUMsQ0FBQztBQUNYO0FBQ0EsUUFBUSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdkMsUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRVEsc0JBQVUsQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMzRyxRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=

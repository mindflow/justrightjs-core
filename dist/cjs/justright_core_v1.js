'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var coreutil_v1 = require('coreutil_v1');
var xmlparser_v1 = require('xmlparser_v1');
var mindi_v1 = require('mindi_v1');

const LOG = new coreutil_v1.Logger("ContainerBridge");

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
        let element = document.getElementById(id);
        element.parentNode.removeChild(element);
    }

    static addHeaderElement(element) {
        let header = document.getElementsByTagName("head")[0];
        header.append(element);
    }

    static addBodyElement(element) {
        let body = document.getElementsByTagName("body")[0];
        body.append(element);
    }

    static prependHeaderElement(element) {
        let header = document.getElementsByTagName("head")[0];
        header.prepend(element);
    }

    static prependBodyElement(element) {
        let body = document.getElementsByTagName("body")[0];
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

const LOG$1 = new coreutil_v1.Logger("BaseElement");

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
        LOG$1.error("Unrecognized value for Element");
        LOG$1.error(value);
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
            LOG$1.warn("Event '" + eventType + "' allready attached for " + this.element.name);
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

const LOG$2 = new coreutil_v1.Logger("AbstractInputElement");

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

const LOG$3 = new coreutil_v1.Logger("CanvasStyles");

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
            LOG$3.error("Style does not exist: " + name);
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
            LOG$3.error("Style does not exist: " + name);
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

/* jshint esversion: 6 */

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

    getPath(index){
        return this.pathList.get(index);
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

const LOG$4 = new coreutil_v1.Logger("StylesRegistry");

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
        LOG$4.info("Loading styles " + name + " at " + url.toString());

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

const LOG$5 = new coreutil_v1.Logger("TemplateRegistry");

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
        LOG$5.info("Loading template " + name + " at " + url.toString());
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

const LOG$6 = new coreutil_v1.Logger("TemplatePostConfig");

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
        let templateMap = new coreutil_v1.Map();
        config.configEntries.forEach((key, configEntry, parent) => {
            if(configEntry.classReference.TEMPLATE_URL && configEntry.classReference.COMPONENT_NAME) {
                templateMap.set(configEntry.classReference.COMPONENT_NAME, configEntry.classReference.TEMPLATE_URL);
            }
            return true;
        }, this); 
        return this.templateRegistry.getTemplatesLoadedPromise(templateMap);
    }

}

const LOG$7 = new coreutil_v1.Logger("StylesLoader");

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
        let stylesMap = new coreutil_v1.Map();
        config.configEntries.forEach((key, configEntry, parent) => {
            if(configEntry.classReference.STYLES_URL && configEntry.classReference.COMPONENT_NAME) {
                stylesMap.set(configEntry.classReference.COMPONENT_NAME, configEntry.classReference.STYLES_URL);
            }
            return true;
        }, this); 
        return this.stylesRegistry.getStylesLoadedPromise(stylesMap);
    }

}

const LOG$8 = new coreutil_v1.Logger("ComponentConfigProcessor");

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
    processConfig(config) {
        return Promise.all(
            [ 
                this.templatesLoader.load(config), 
                this.stylesLoader.load(config) 
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

const LOG$a = new coreutil_v1.Logger("ComponentFactory");

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
            LOG$a.error(this.templateRegistry);
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

const LOG$b = new coreutil_v1.Logger("InputElementDataBinding");

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

class State {

    constructor() {

        this.stateListenerMap = new coreutil_v1.Map();
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

const LOG$c = new coreutil_v1.Logger("JustrightConfig");

class JustrightConfig {

    static getInstance() {
        return justrightConfig;
    }

    constructor() {
        this.typeConfigList = new coreutil_v1.List([
            mindi_v1.SingletonConfig.unnamed(TemplateRegistry),
            mindi_v1.SingletonConfig.unnamed(StylesRegistry),
            mindi_v1.SingletonConfig.unnamed(UniqueIdRegistry),
            mindi_v1.SingletonConfig.unnamed(ComponentFactory),
            mindi_v1.SingletonConfig.unnamed(State),
            mindi_v1.PrototypeConfig.unnamed(EventRegistry)]);
        }

    getTypeConfigList() {
        return this.typeConfigList;
    }

}

const justrightConfig = new JustrightConfig();

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

    /**
     * @returns {number}
     */
    getCode() {
        return this.code;
    }

    /**
     * @returns {ObjectFunction}
     */
    getObjectFunction() {
        return this.objectFunction
    }

    /**
     * @returns {class}
     */
    getMapperFunction() {
        return this.mapperFunction;
    }

}

const LOG$d = new coreutil_v1.Logger("HttpCallBuilder");

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
        LOG$d.error(error);
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
            if(responseHandler.getMapperFunction()) {
                response.json().then(
                    (object) => {
                        var mapperFunction = responseHandler.getMapperFunction();
                        if(mapperFunction) {
                            responseHandler.getObjectFunction().call(mapperFunction(object));
                        } else {
                            responseHandler.getObjectFunction().call(object);
                        }
                    },
                    (failReason) => {

                    }
                );
            } else {
                responseHandler.getObjectFunction().call();
            }
        }
    }
}

const LOG$e = new coreutil_v1.Logger("AbstractValidator");

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
            LOG$e.warn("No validation listeners");
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
            LOG$e.warn("No invalidation listeners");
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
exports.ContainerBridge = ContainerBridge;
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
exports.JustrightConfig = JustrightConfig;
exports.OrValidatorSet = OrValidatorSet;
exports.PasswordValidator = PasswordValidator;
exports.PhoneValidator = PhoneValidator;
exports.ProxyObjectFactory = ProxyObjectFactory;
exports.RadioInputElement = RadioInputElement;
exports.RegexValidator = RegexValidator;
exports.RequiredValidator = RequiredValidator;
exports.SessionStorage = SessionStorage;
exports.SimpleElement = SimpleElement;
exports.State = State;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVzdHJpZ2h0X2NvcmVfdjEuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qdXN0cmlnaHQvYnJpZGdlL2NvbnRhaW5lckJyaWRnZS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZWxlbWVudC9hdHRyaWJ1dGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvYmFzZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2NhbnZhcy9jYW52YXNSb290LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2Fic3RyYWN0SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3JhZGlvSW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2NoZWNrYm94SW5wdXRFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3RleHRJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdGV4dGFyZWFJbnB1dEVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdGV4dG5vZGVFbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L3NpbXBsZUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvZm9ybUVsZW1lbnQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2VsZW1lbnQvdmlkZW9FbGVtZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9lbGVtZW50L2VsZW1lbnRNYXBwZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2h0bWwvaHRtbC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2FudmFzL2NhbnZhc1N0eWxlcy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY2xpZW50L2NsaWVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC91cmwuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXMuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdGVtcGxhdGUvdGVtcGxhdGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3R5bGVzL3N0eWxlc0xvYWRlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L2NvbXBvbmVudENvbmZpZ1Byb2Nlc3Nvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvY29tcG9uZW50L3VuaXF1ZUlkUmVnaXN0cnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2V2ZW50L2V2ZW50LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9ldmVudC9ldmVudFJlZ2lzdHJ5LmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb21wb25lbnQvZWxlbWVudFJlZ2lzdHJhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9jb21wb25lbnQvY29tcG9uZW50RmFjdG9yeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZGF0YUJpbmQvaW5wdXRFbGVtZW50RGF0YUJpbmRpbmcuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2RhdGFCaW5kL3Byb3h5T2JqZWN0RmFjdG9yeS5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvZXZlbnQvZXZlbnRGaWx0ZXJlZE9iamVjdEZ1bmN0aW9uLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC9uYXZpZ2F0aW9uL2hpc3RvcnkuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L25hdmlnYXRpb24vc3RhdGUuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L2p1c3RyaWdodENvbmZpZy5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvc3RvcmFnZS9hcHBsaWNhdGlvblN0b3JhZ2UuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3N0b3JhZ2Uvc2Vzc2lvblN0b3JhZ2UuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3V0aWwvaHR0cFJlc3BvbnNlSGFuZGxlci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdXRpbC9odHRwQ2FsbEJ1aWxkZXIuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9hYnN0cmFjdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2FuZFZhbGlkYXRvclNldC5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlZ2V4VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZW1haWxWYWxpZGF0b3IuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9lcXVhbHNGdW5jdGlvblJlc3VsdFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL2VxdWFsc1Byb3BlcnR5VmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3IvZXF1YWxzU3RyaW5nVmFsaWRhdG9yLmpzIiwiLi4vLi4vc3JjL2p1c3RyaWdodC92YWxpZGF0b3Ivb3JWYWxpZGF0b3JTZXQuanMiLCIuLi8uLi9zcmMvanVzdHJpZ2h0L3ZhbGlkYXRvci9wYXNzd29yZFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3Bob25lbFZhbGlkYXRvci5qcyIsIi4uLy4uL3NyYy9qdXN0cmlnaHQvdmFsaWRhdG9yL3JlcXVpcmVkVmFsaWRhdG9yLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbnRhaW5lckJyaWRnZVwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb250YWluZXJCcmlkZ2Uge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBnZXRFbGVtZW50QnlJZChpZCkge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWxldSBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNyZWF0ZVRleHROb2RlKHZhbHVlKSB7XHJcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNyZWF0ZUVsZW1lbnQobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lU3BhY2UgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGNyZWF0ZUVsZW1lbnROUyhuYW1lU3BhY2UsIG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVTcGFjZSwgbmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZmV0Y2godXJsLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0ID0gMTAwMCwgcmVzcG9uc2VUaW1lb3V0ID0gNDAwMCkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UudGltZW91dChjb25uZWN0aW9uVGltZW91dCwgd2luZG93LmZldGNoKHVybCwgcGFyYW1zKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcmFnZSBicmlkZ2VcclxuXHJcbiAgICBzdGF0aWMgc2V0U2Vzc2lvbkF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgd2luZG93LnNlc3Npb25TdG9yYWdlLnNldEl0ZW0oa2V5LHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcmVtb3ZlU2Vzc2lvbkF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBoYXNTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cuc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShrZXkpICE9PSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBzZXRMb2NhbEF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKGtleSx2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZUxvY2FsQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBoYXNMb2NhbEF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSkgIT09IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldExvY2FsQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcmVtb3ZlRWxlbWVudChpZCkge1xyXG4gICAgICAgIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYWRkSGVhZGVyRWxlbWVudChlbGVtZW50KSB7XHJcbiAgICAgICAgbGV0IGhlYWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXTtcclxuICAgICAgICBoZWFkZXIuYXBwZW5kKGVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBhZGRCb2R5RWxlbWVudChlbGVtZW50KSB7XHJcbiAgICAgICAgbGV0IGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImJvZHlcIilbMF07XHJcbiAgICAgICAgYm9keS5hcHBlbmQoZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHByZXBlbmRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcclxuICAgICAgICBsZXQgaGVhZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJoZWFkXCIpWzBdO1xyXG4gICAgICAgIGhlYWRlci5wcmVwZW5kKGVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBwcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIGxldCBib2R5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJib2R5XCIpWzBdO1xyXG4gICAgICAgIGJvZHkucHJlcGVuZChlbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgdGltZW91dChtaWxsaXNlY29uZHMsIHByb21pc2UpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwidGltZW91dFwiKSlcclxuICAgICAgICAgIH0sIG1pbGxpc2Vjb25kcylcclxuICAgICAgICAgIHByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbn0iLCJleHBvcnQgY2xhc3MgQXR0cmlidXRlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhdHRyaWJ1dGUpIHtcclxuICAgICAgICB0aGlzLmF0dHJpYnV0ZSA9IGF0dHJpYnV0ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgdmFsdWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlLnZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBuYW1lKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZS5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIGdldCBuYW1lc3BhY2UoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlLm5hbWU7XHJcbiAgICB9XHJcbn0iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQgeyBNYXAsIExvZ2dlciwgTGlzdCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQXR0cmlidXRlIH0gZnJvbSBcIi4vYXR0cmlidXRlLmpzXCI7XG5pbXBvcnQgeyBDb250YWluZXJCcmlkZ2UgfSBmcm9tIFwiLi4vYnJpZGdlL2NvbnRhaW5lckJyaWRnZS5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQmFzZUVsZW1lbnRcIik7XG5cbi8qKlxuICogQSBiYXNlIGNsYXNzIGZvciBlbmNsb3NpbmcgYW4gSFRNTEVsZW1lbnRcbiAqL1xuZXhwb3J0IGNsYXNzIEJhc2VFbGVtZW50IHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR8c3RyaW5nfEhUTUxFbGVtZW50fSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgXG4gICAgICAgIC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlTWFwID0gbnVsbDtcbiAgICAgICAgdGhpcy5ldmVudHNBdHRhY2hlZCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIFxuICAgICAgICBpZih2YWx1ZSBpbnN0YW5jZW9mIFhtbEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuY3JlYXRlRnJvbVhtbEVsZW1lbnQodmFsdWUsIHBhcmVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IENvbnRhaW5lckJyaWRnZS5jcmVhdGVFbGVtZW50KHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZih2YWx1ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KXtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIExPRy5lcnJvcihcIlVucmVjb2duaXplZCB2YWx1ZSBmb3IgRWxlbWVudFwiKTtcbiAgICAgICAgTE9HLmVycm9yKHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2FkQXR0cmlidXRlcygpIHtcbiAgICAgICAgaWYodGhpcy5lbGVtZW50LmF0dHJpYnV0ZXMgPT09IG51bGwgfHwgdGhpcy5lbGVtZW50LmF0dHJpYnV0ZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5hdHRyaWJ1dGVNYXAgPT09IG51bGwgfHwgdGhpcy5hdHRyaWJ1dGVNYXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hdHRyaWJ1dGVNYXAuc2V0KHRoaXMuZWxlbWVudC5hdHRyaWJ1dGVzW2ldLm5hbWUsbmV3IEF0dHJpYnV0ZSh0aGlzLmVsZW1lbnQuYXR0cmlidXRlc1tpXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIGJyb3dzZXIgRWxlbWVudCBmcm9tIHRoZSBYbWxFbGVtZW50XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHhtbEVsZW1lbnRcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRFbGVtZW50XG4gICAgICogQHJldHVybiB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgY3JlYXRlRnJvbVhtbEVsZW1lbnQoeG1sRWxlbWVudCwgcGFyZW50RWxlbWVudCkge1xuICAgICAgICBsZXQgZWxlbWVudCA9IG51bGw7XG4gICAgICAgIGlmKHhtbEVsZW1lbnQubmFtZXNwYWNlKXtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuY3JlYXRlRWxlbWVudE5TKHhtbEVsZW1lbnQubmFtZXNwYWNlVXJpLHhtbEVsZW1lbnQuZnVsbE5hbWUpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuY3JlYXRlRWxlbWVudCh4bWxFbGVtZW50Lm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHBhcmVudEVsZW1lbnQgJiYgcGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgeG1sRWxlbWVudC5hdHRyaWJ1dGVzLmZvckVhY2goZnVuY3Rpb24oYXR0cmlidXRlS2V5LGF0dHJpYnV0ZSl7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyaWJ1dGVLZXksYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIGEgZnVuY3Rpb24gdG8gYW4gZXZlbnQgaW4gdGhlIGVuY2xvc2VkIGVsZW1lbnQgaWYgbm9uZSBhbGxyZWFkeSBleGlzdHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudFR5cGVcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBmdW5jdGlvblBhcmFtXG4gICAgICovXG4gICAgYXR0YWNoRXZlbnQoZXZlbnRUeXBlLCBmdW5jdGlvblBhcmFtKSB7XG4gICAgICAgIGlmKCF0aGlzLmV2ZW50c0F0dGFjaGVkLmNvbnRhaW5zKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIGlmKGV2ZW50VHlwZS5zdGFydHNXaXRoKFwib25cIikpIHtcbiAgICAgICAgICAgICAgICBldmVudFR5cGUgPSBldmVudFR5cGUuc3Vic3RyKDIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBmdW5jdGlvblBhcmFtKTtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzQXR0YWNoZWQuYWRkKGV2ZW50VHlwZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBMT0cud2FybihcIkV2ZW50ICdcIiArIGV2ZW50VHlwZSArIFwiJyBhbGxyZWFkeSBhdHRhY2hlZCBmb3IgXCIgKyB0aGlzLmVsZW1lbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGVuY2xvc2VkIGVsZW1lbnRcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0hUTUxFbGVtZW50fVxuICAgICAqL1xuICAgIGdldCBtYXBwZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xuICAgIH1cblxuICAgIGdldCBmdWxsTmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC50YWdOYW1lO1xuICAgIH1cblxuICAgIGdldCB0b3AoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wO1xuICAgIH1cblxuICAgIGdldCBib3R0b20oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuYm90dG9tO1xuICAgIH1cblxuICAgIGdldCBsZWZ0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmxlZnQ7XG4gICAgfVxuXG4gICAgZ2V0IHJpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnJpZ2h0O1xuICAgIH1cblxuICAgIGdldCB3aWR0aCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5vZmZzZXRXaWR0aDtcbiAgICB9XG5cbiAgICBnZXQgaGVpZ2h0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50Lm9mZnNldEhlaWdodDtcbiAgICB9XG5cbiAgICBnZXQgYXR0cmlidXRlcygpIHtcbiAgICAgICAgdGhpcy5sb2FkQXR0cmlidXRlcygpO1xuICAgICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVNYXA7XG4gICAgfVxuXG4gICAgc2V0QXR0cmlidXRlVmFsdWUoa2V5LHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LHZhbHVlKTtcbiAgICB9XG5cbiAgICBnZXRBdHRyaWJ1dGVWYWx1ZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICB9XG5cbiAgICBjb250YWluc0F0dHJpYnV0ZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5oYXNBdHRyaWJ1dGUoa2V5KTtcbiAgICB9XG5cbiAgICByZW1vdmVBdHRyaWJ1dGUoa2V5KSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICB9XG5cbiAgICBzZXRTdHlsZShrZXksdmFsdWUpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlW2tleV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXRTdHlsZShrZXkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5zdHlsZVtrZXldO1xuICAgIH1cblxuICAgIHJlbW92ZVN0eWxlKGtleSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGVba2V5XSA9IG51bGw7XG4gICAgfVxuXG4gICAgc2V0KGlucHV0KSB7XG4gICAgICAgIGlmKHRoaXMuZWxlbWVudC5wYXJlbnROb2RlID09PSBudWxsKXtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJUaGUgZWxlbWVudCBoYXMgbm8gcGFyZW50LCBjYW4gbm90IHN3YXAgaXQgZm9yIHZhbHVlXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0Lm1hcHBlZEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChpbnB1dC5tYXBwZWRFbGVtZW50LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0ICYmIGlucHV0LnJvb3RFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoaW5wdXQucm9vdEVsZW1lbnQubWFwcGVkRWxlbWVudCwgdGhpcy5lbGVtZW50KTtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChDb250YWluZXJCcmlkZ2UuY3JlYXRlVGV4dE5vZGUoaW5wdXQpLCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGlucHV0LCB0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNNb3VudGVkKCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJlbW92ZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuZWxlbWVudC5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucmVtb3ZlQ2hpbGQodGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0Q2hpbGQoaW5wdXQpIHtcbiAgICAgICAgdGhpcy5jbGVhcigpO1xuICAgICAgICB0aGlzLmFkZENoaWxkKGlucHV0KTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQubWFwcGVkRWxlbWVudCAhPT0gdW5kZWZpbmVkICYmIGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IG51bGwpe1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0Lm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXQgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKENvbnRhaW5lckJyaWRnZS5jcmVhdGVUZXh0Tm9kZShpbnB1dCkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByZXBlbmRDaGlsZChpbnB1dCkge1xuICAgICAgICBpZih0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0Lm1hcHBlZEVsZW1lbnQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5zZXJ0QmVmb3JlKGlucHV0Lm1hcHBlZEVsZW1lbnQsdGhpcy5lbGVtZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dCAmJiBpbnB1dC5yb290RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LHRoaXMuZWxlbWVudC5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGlucHV0ID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5pbnNlcnRCZWZvcmUoQ29udGFpbmVyQnJpZGdlLmNyZWF0ZVRleHROb2RlKGlucHV0KSx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lmluc2VydEJlZm9yZShpbnB1dCx0aGlzLmVsZW1lbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb250YWluZXJCcmlkZ2UgfSBmcm9tIFwiLi4vYnJpZGdlL2NvbnRhaW5lckJyaWRnZVwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2FudmFzUm9vdCB7XHJcblxyXG4gICAgc3RhdGljIHJlcGxhY2VDb21wb25lbnQoaWQsIGNvbXBvbmVudCkge1xyXG4gICAgICAgIHZhciBib2R5RWxlbWVudCA9IENvbnRhaW5lckJyaWRnZS5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICAgICAgYm9keUVsZW1lbnQucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQoY29tcG9uZW50LnJvb3RFbGVtZW50Lm1hcHBlZEVsZW1lbnQsIGJvZHlFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgc2V0Q29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICB2YXIgYm9keUVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmlubmVySFRNTCA9ICcnO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50LCBib2R5RWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGFkZENoaWxkQ29tcG9uZW50KGlkLCBjb21wb25lbnQpIHtcclxuICAgICAgICB2YXIgYm9keUVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgICAgIGJvZHlFbGVtZW50LmFwcGVuZENoaWxkKGNvbXBvbmVudC5yb290RWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYWRkQ2hpbGRFbGVtZW50KGlkLCBlbGVtZW50KSB7XHJcbiAgICAgICAgdmFyIGJvZHlFbGVtZW50ID0gQ29udGFpbmVyQnJpZGdlLmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgICAgICBib2R5RWxlbWVudC5hcHBlbmRDaGlsZChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVFbGVtZW50KGlkKSB7XHJcbiAgICAgICAgQ29udGFpbmVyQnJpZGdlLnJlbW92ZUVsZW1lbnQoaWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgc3RhdGljIGFkZEhlYWRlckVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5hZGRIZWFkZXJFbGVtZW50KGVsZW1lbnQubWFwcGVkRWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFxyXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudFxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgYWRkQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5hZGRCb2R5RWxlbWVudChlbGVtZW50Lm1hcHBlZEVsZW1lbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKiBcclxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IGVsZW1lbnRcclxuICAgICAqL1xyXG4gICAgc3RhdGljIHByZXBlbmRIZWFkZXJFbGVtZW50KGVsZW1lbnQpIHtcclxuICAgICAgICBDb250YWluZXJCcmlkZ2UucHJlcGVuZEhlYWRlckVsZW1lbnQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKiogXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBlbGVtZW50XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBwcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudCkge1xyXG4gICAgICAgIENvbnRhaW5lckJyaWRnZS5wcmVwZW5kQm9keUVsZW1lbnQoZWxlbWVudC5tYXBwZWRFbGVtZW50KTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQWJzdHJhY3RJbnB1dEVsZW1lbnRcIik7XG5cbi8qKlxuICogU2hhcmVkIHByb3BlcnRpZXMgb2YgaW5wdXQgZWxlbWVudHNcbiAqL1xuZXhwb3J0IGNsYXNzIEFic3RyYWN0SW5wdXRFbGVtZW50IGV4dGVuZHMgQmFzZUVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSB2YWx1ZVxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIodmFsdWUsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5uYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgdmFsdWUgb2YgaW5wdXRzIG5hbWVcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldCBuYW1lKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdmFsdWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgdmFsdWUgZ2l2ZW4gYW55IHByb2Nlc3NpbmcgcnVsZXNcbiAgICAgKi9cbiAgICBnZXQgdmFsdWUoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFja2luZ1ZhbHVlO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgSW5wdXRFdmVudCgnY2hhbmdlJykpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHNvdXJjZSB2YWx1ZVxuICAgICAqL1xuICAgIGdldCBiYWNraW5nVmFsdWUoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZTtcbiAgICB9XG5cbiAgICBmb2N1cygpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LmZvY3VzKCk7XG4gICAgfVxuXG4gICAgc2VsZWN0QWxsKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2VsZWN0KCk7XG4gICAgfVxuXG4gICAgZW5hYmxlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBkaXNhYmxlKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0SW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFJhZGlvSW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBzZXQgY2hlY2tlZCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaXNDaGVja2VkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuY2hlY2tlZDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzQ2hlY2tlZCgpO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9ICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gXCJ0cnVlXCIpO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEFic3RyYWN0SW5wdXRFbGVtZW50IH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIENoZWNrYm94SW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBzZXQgY2hlY2tlZCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5jaGVja2VkID0gdmFsdWU7XG4gICAgfVxuXG4gICAgaXNDaGVja2VkKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuY2hlY2tlZDtcbiAgICB9XG5cbiAgICBnZXQgdmFsdWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmlzQ2hlY2tlZCgpO1xuICAgIH1cblxuICAgIHNldCB2YWx1ZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLmVsZW1lbnQuY2hlY2tlZCA9ICh2YWx1ZSA9PT0gdHJ1ZSB8fCB2YWx1ZSA9PT0gXCJ0cnVlXCIpO1xuICAgIH1cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHtYbWxFbGVtZW50fSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XG5pbXBvcnQge0Fic3RyYWN0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9hYnN0cmFjdElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi9iYXNlRWxlbWVudC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dElucHV0RWxlbWVudCBleHRlbmRzIEFic3RyYWN0SW5wdXRFbGVtZW50e1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gZWxlbWVudCBcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgcGFyZW50KSB7XG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7WG1sRWxlbWVudH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xuaW1wb3J0IHtBYnN0cmFjdElucHV0RWxlbWVudH0gZnJvbSBcIi4vYWJzdHJhY3RJbnB1dEVsZW1lbnQuanNcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHRhcmVhSW5wdXRFbGVtZW50IGV4dGVuZHMgQWJzdHJhY3RJbnB1dEVsZW1lbnR7XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RvclxuICAgICAqXG4gICAgICogQHBhcmFtIHtYbWxFbGVtZW50fSBlbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBwYXJlbnQpIHtcbiAgICAgICAgc3VwZXIoZWxlbWVudCwgcGFyZW50KTtcbiAgICB9XG5cbiAgICBnZXQgaW5uZXJIVE1MKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MO1xuICAgIH1cblxuICAgIHNldCBpbm5lckhUTUwodmFsdWUpe1xuICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gdmFsdWU7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGQoaW5wdXQpIHtcbiAgICAgICAgc3VwZXIuYWRkQ2hpbGQoaW5wdXQpO1xuICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgcHJlcGVuZENoaWxkKGlucHV0KSB7XG4gICAgICAgIHN1cGVyLnByZXBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmlubmVySFRNTDtcbiAgICB9XG5cbn0iLCJpbXBvcnQgeyBYbWxDZGF0YSB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcbmltcG9ydCB7IENvbnRhaW5lckJyaWRnZSB9IGZyb20gXCIuLi9icmlkZ2UvY29udGFpbmVyQnJpZGdlLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0bm9kZUVsZW1lbnQge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7WG1sQ2RhdGF9IHZhbHVlIFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudCBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcGFyZW50KSB7XG4gICAgICAgIGlmKHZhbHVlIGluc3RhbmNlb2YgWG1sQ2RhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IHRoaXMuY3JlYXRlRnJvbVhtbENkYXRhKHZhbHVlLCBwYXJlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIil7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBDb250YWluZXJCcmlkZ2UuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtYbWxDZGF0YX0gY2RhdGFFbGVtZW50IFxuICAgICAqIEBwYXJhbSB7QmFzZUVsZW1lbnR9IHBhcmVudEVsZW1lbnQgXG4gICAgICovXG4gICAgY3JlYXRlRnJvbVhtbENkYXRhKGNkYXRhRWxlbWVudCwgcGFyZW50RWxlbWVudCkge1xuICAgICAgICBsZXQgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNkYXRhRWxlbWVudC52YWx1ZSk7XG4gICAgICAgIGlmKHBhcmVudEVsZW1lbnQgIT09IG51bGwgJiYgcGFyZW50RWxlbWVudC5tYXBwZWRFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICBwYXJlbnRFbGVtZW50Lm1hcHBlZEVsZW1lbnQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgc2V0IHZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCB2YWx1ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbiAgICBnZXQgbWFwcGVkRWxlbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cblxuaW1wb3J0IHsgWG1sRWxlbWVudCB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIFNpbXBsZUVsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudHtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xuICAgICAgICBzdXBlcihlbGVtZW50LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIGdldCBpbm5lckhUTUwoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5pbm5lckhUTUw7XG4gICAgfVxuXG4gICAgc2V0IGlubmVySFRNTCh2YWx1ZSl7XG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSB2YWx1ZTtcbiAgICB9XG5cbn1cbiIsIi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmltcG9ydCB7IFhtbEVsZW1lbnQgfSBmcm9tIFwieG1scGFyc2VyX3YxXCI7XHJcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBGb3JtRWxlbWVudCBleHRlbmRzIEJhc2VFbGVtZW50e1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uc3RydWN0b3JcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IGVsZW1lbnQgXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xyXG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHZXQgdGhlIHZhbHVlIG9mIHRoZSBpbnB1dHMgbmFtZVxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0IG5hbWUoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5uYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0IHRoZSB2YWx1ZSBvZiBpbnB1dHMgbmFtZVxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICBzZXQgbmFtZSh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG4gICAgc3VibWl0KCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuc3VibWl0KCk7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4vYmFzZUVsZW1lbnQuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBWaWRlb0VsZW1lbnQgZXh0ZW5kcyBCYXNlRWxlbWVudCB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25zdHJ1Y3RvclxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7WG1sRWxlbWVudH0gdmFsdWUgXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnQgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKGVsZW1lbnQsIHBhcmVudCkge1xyXG4gICAgICAgIHN1cGVyKGVsZW1lbnQsIHBhcmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0IG1hcHBlZEVsZW1lbnQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBwbGF5KCkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudC5wbGF5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgbXV0ZSgpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQubXV0ZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHVubXV0ZSgpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQubXV0ZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbENkYXRhLFhtbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7UmFkaW9JbnB1dEVsZW1lbnR9IGZyb20gXCIuL3JhZGlvSW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge0NoZWNrYm94SW5wdXRFbGVtZW50fSBmcm9tIFwiLi9jaGVja2JveElucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUZXh0SW5wdXRFbGVtZW50fSBmcm9tIFwiLi90ZXh0SW5wdXRFbGVtZW50LmpzXCI7XG5pbXBvcnQge1RleHRhcmVhSW5wdXRFbGVtZW50fSBmcm9tIFwiLi90ZXh0YXJlYUlucHV0RWxlbWVudC5qc1wiO1xuaW1wb3J0IHtUZXh0bm9kZUVsZW1lbnR9IGZyb20gXCIuL3RleHRub2RlRWxlbWVudC5qc1wiO1xuaW1wb3J0IHtTaW1wbGVFbGVtZW50fSBmcm9tIFwiLi9zaW1wbGVFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuL2Jhc2VFbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBGb3JtRWxlbWVudCB9IGZyb20gXCIuL2Zvcm1FbGVtZW50LmpzXCI7XG5pbXBvcnQgeyBWaWRlb0VsZW1lbnQgfSBmcm9tIFwiLi92aWRlb0VsZW1lbnQuanNcIjtcblxuZXhwb3J0IGNsYXNzIEVsZW1lbnRNYXBwZXIge1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0b3JcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge2FueX0gaW5wdXQgXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gcGFyZW50IFxuICAgICAqL1xuICAgIHN0YXRpYyBtYXAoaW5wdXQsIHBhcmVudCkge1xuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9SYWRpbyhpbnB1dCkpeyByZXR1cm4gbmV3IFJhZGlvSW5wdXRFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGlmIChFbGVtZW50TWFwcGVyLm1hcHNUb0NoZWNrYm94KGlucHV0KSl7IHJldHVybiBuZXcgQ2hlY2tib3hJbnB1dEVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvU3VibWl0KGlucHV0KSl7IHJldHVybiBuZXcgVGV4dElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9Gb3JtKGlucHV0KSl7IHJldHVybiBuZXcgRm9ybUVsZW1lbnQoaW5wdXQsIHBhcmVudCk7IH1cbiAgICAgICAgaWYgKEVsZW1lbnRNYXBwZXIubWFwc1RvVGV4dGFyZWEoaW5wdXQpKXsgcmV0dXJuIG5ldyBUZXh0YXJlYUlucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0KGlucHV0KSl7IHJldHVybiBuZXcgVGV4dElucHV0RWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9WaWRlbyhpbnB1dCkpeyByZXR1cm4gbmV3IFZpZGVvRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9UZXh0bm9kZShpbnB1dCkpeyByZXR1cm4gbmV3IFRleHRub2RlRWxlbWVudChpbnB1dCwgcGFyZW50KTsgfVxuICAgICAgICBpZiAoRWxlbWVudE1hcHBlci5tYXBzVG9TaW1wbGUoaW5wdXQpKXsgcmV0dXJuIG5ldyBTaW1wbGVFbGVtZW50KGlucHV0LCBwYXJlbnQpOyB9XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTWFwcGluZyB0byBzaW1wbGUgYnkgZGVmYXVsdCBcIiArIGlucHV0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaW1wbGVFbGVtZW50KGlucHV0LCBwYXJlbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9SYWRpbyhpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwicmFkaW9cIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJpbnB1dFwiICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgJiYgaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJyYWRpb1wiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvQ2hlY2tib3goaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCAmJiBpbnB1dC50eXBlID09PSBcImNoZWNrYm94XCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIiAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiY2hlY2tib3hcIik7XG4gICAgfVxuXG4gICAgc3RhdGljIG1hcHNUb1N1Ym1pdChpbnB1dCl7XG4gICAgICAgIHJldHVybiAoaW5wdXQgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50ICYmIGlucHV0LnR5cGUgPT09IFwic3VibWl0XCIpIHx8XG4gICAgICAgICAgICAoaW5wdXQgaW5zdGFuY2VvZiBYbWxFbGVtZW50ICYmIGlucHV0Lm5hbWUgPT09IFwiaW5wdXRcIiAmJiBpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpICYmIGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwic3VibWl0XCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9Gb3JtKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxGb3JtRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJmb3JtXCIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBtYXBzVG9UZXh0KGlucHV0KXtcbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IFwidGV4dFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJlbWFpbFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gXCJkYXRlXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmIChpbnB1dC50eXBlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIGlmKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCAmJiBpbnB1dC5uYW1lID09PSBcImlucHV0XCIpIHtcbiAgICAgICAgICAgIGlmKCFpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRleHRcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICAgICAgaWYoaW5wdXQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKS52YWx1ZSA9PT0gXCJwYXNzd29yZFwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcImVtYWlsXCIpIHsgcmV0dXJuIHRydWU7IH1cbiAgICAgICAgICAgIGlmKGlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikudmFsdWUgPT09IFwiZGF0ZVwiKSB7IHJldHVybiB0cnVlOyB9XG4gICAgICAgICAgICBpZihpbnB1dC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLnZhbHVlID09PSBcInRpbWVcIikgeyByZXR1cm4gdHJ1ZTsgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dG5vZGUoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgTm9kZSAmJiBpbnB1dC5ub2RlVHlwZSA9PT0gXCJURVhUX05PREVcIikgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbENkYXRhKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVmlkZW8oaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJ2aWRlb1wiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvVGV4dGFyZWEoaW5wdXQpe1xuICAgICAgICByZXR1cm4gKGlucHV0IGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkgfHxcbiAgICAgICAgICAgIChpbnB1dCBpbnN0YW5jZW9mIFhtbEVsZW1lbnQgJiYgaW5wdXQubmFtZSA9PT0gXCJ0ZXh0YXJlYVwiKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbWFwc1RvU2ltcGxlKGlucHV0KXtcbiAgICAgICAgcmV0dXJuIChpbnB1dCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB8fFxuICAgICAgICAgICAgKGlucHV0IGluc3RhbmNlb2YgWG1sRWxlbWVudCk7XG4gICAgfVxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge1htbEVsZW1lbnR9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcbmltcG9ydCB7RWxlbWVudE1hcHBlcn0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlci5qc1wiO1xuXG5leHBvcnQgY2xhc3MgSFRNTHtcblxuICAgIHN0YXRpYyBjdXN0b20oZWxlbWVudE5hbWUpe1xuICAgICAgICB2YXIgeG1sRWxlbWVudCA9IG5ldyBYbWxFbGVtZW50KGVsZW1lbnROYW1lKTtcbiAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHhtbEVsZW1lbnQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBhcHBseVN0eWxlcyhlbGVtZW50LGNsYXNzVmFsdWUsc3R5bGVWYWx1ZSl7XG4gICAgICAgIGlmKGNsYXNzVmFsdWUgIT09IG51bGwpe1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImNsYXNzXCIsY2xhc3NWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3R5bGVWYWx1ZSAhPT0gbnVsbCl7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwic3R5bGVcIixzdHlsZVZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBhKG5hbWUsaHJlZixjbGFzc1ZhbHVlLHN0eWxlVmFsdWUpe1xuICAgICAgICB2YXIgZWxlbWVudCA9IEhUTUwuY3VzdG9tKFwiYVwiKTtcbiAgICAgICAgZWxlbWVudC5hZGRDaGlsZChuYW1lKTtcbiAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImhyZWZcIixocmVmKTtcbiAgICAgICAgSFRNTC5hcHBseVN0eWxlcyhlbGVtZW50LGNsYXNzVmFsdWUsc3R5bGVWYWx1ZSk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IE1hcCwgTGlzdCwgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IENhbnZhc1Jvb3QgfSBmcm9tIFwiLi9jYW52YXNSb290XCI7XHJcbmltcG9ydCB7IEhUTUwgfSBmcm9tIFwiLi4vaHRtbC9odG1sXCI7XHJcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnRcIjtcclxuaW1wb3J0IHsgVGV4dG5vZGVFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvdGV4dG5vZGVFbGVtZW50XCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiQ2FudmFzU3R5bGVzXCIpO1xyXG5cclxuY29uc3Qgc3R5bGVzID0gbmV3IE1hcCgpO1xyXG5jb25zdCBzdHlsZU93bmVycyA9IG5ldyBNYXAoKTtcclxuY29uc3QgZW5hYmxlZFN0eWxlcyA9IG5ldyBMaXN0KCk7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2FudmFzU3R5bGVzIHtcclxuXHJcbiAgICBzdGF0aWMgc2V0U3R5bGUobmFtZSwgc291cmNlKSB7XHJcbiAgICAgICAgaWYoc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHN0eWxlcy5nZXQobmFtZSkuc2V0Q2hpbGQobmV3IFRleHRub2RlRWxlbWVudChzb3VyY2UuZ2V0U3R5bGVzU291cmNlKCkpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xyXG4gICAgICAgICAgICBsZXQgc3R5bGVFbGVtZW50ID0gSFRNTC5jdXN0b20oXCJzdHlsZVwiKTtcclxuICAgICAgICAgICAgc3R5bGVFbGVtZW50LnNldEF0dHJpYnV0ZVZhbHVlKFwiaWRcIixuYW1lKTtcclxuICAgICAgICAgICAgc3R5bGVFbGVtZW50LnNldENoaWxkKG5ldyBUZXh0bm9kZUVsZW1lbnQoc291cmNlLmdldFN0eWxlc1NvdXJjZSgpKSk7XHJcbiAgICAgICAgICAgIHN0eWxlcy5zZXQobmFtZSwgc3R5bGVFbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZVN0eWxlKG5hbWUpIHtcclxuICAgICAgICBpZihlbmFibGVkU3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIGVuYWJsZWRTdHlsZXMucmVtb3ZlKG5hbWUpO1xyXG4gICAgICAgICAgICBDYW52YXNSb290LnJlbW92ZUVsZW1lbnQobmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBzdHlsZXMucmVtb3ZlKG5hbWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZGlzYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XHJcbiAgICAgICAgQ2FudmFzU3R5bGVzLnJlbW92ZVN0eWxlT3duZXIobmFtZSwgb3duZXJJZCk7XHJcbiAgICAgICAgaWYoQ2FudmFzU3R5bGVzLmhhc1N0eWxlT3duZXIobmFtZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZighc3R5bGVzLmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIExPRy5lcnJvcihcIlN0eWxlIGRvZXMgbm90IGV4aXN0OiBcIiArIG5hbWUpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGVuYWJsZWRTdHlsZXMuY29udGFpbnMobmFtZSkpIHtcclxuICAgICAgICAgICAgZW5hYmxlZFN0eWxlcy5yZW1vdmUobmFtZSk7XHJcbiAgICAgICAgICAgIENhbnZhc1Jvb3QucmVtb3ZlRWxlbWVudChuYW1lKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGVuYWJsZVN0eWxlKG5hbWUsIG93bmVySWQgPSAwKSB7XHJcbiAgICAgICAgQ2FudmFzU3R5bGVzLmFkZFN0eWxlT3duZXIobmFtZSwgb3duZXJJZCk7XHJcbiAgICAgICAgaWYoIXN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBMT0cuZXJyb3IoXCJTdHlsZSBkb2VzIG5vdCBleGlzdDogXCIgKyBuYW1lKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZighZW5hYmxlZFN0eWxlcy5jb250YWlucyhuYW1lKSkge1xyXG4gICAgICAgICAgICBlbmFibGVkU3R5bGVzLmFkZChuYW1lKTtcclxuICAgICAgICAgICAgQ2FudmFzUm9vdC5hZGRIZWFkZXJFbGVtZW50KHN0eWxlcy5nZXQobmFtZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgYWRkU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XHJcbiAgICAgICAgaWYoIXN0eWxlT3duZXJzLmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHN0eWxlT3duZXJzLnNldChuYW1lLCBuZXcgTGlzdCgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoIXN0eWxlT3duZXJzLmdldChuYW1lKS5jb250YWlucyhvd25lcklkKSkge1xyXG4gICAgICAgICAgICBzdHlsZU93bmVycy5nZXQobmFtZSkuYWRkKG93bmVySWQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgcmVtb3ZlU3R5bGVPd25lcihuYW1lLCBvd25lcklkKSB7XHJcbiAgICAgICAgaWYoIXN0eWxlT3duZXJzLmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgc3R5bGVPd25lcnMuZ2V0KG5hbWUpLnJlbW92ZShvd25lcklkKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaGFzU3R5bGVPd25lcihuYW1lKSB7XHJcbiAgICAgICAgaWYoIXN0eWxlT3duZXJzLmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHN0eWxlT3duZXJzLmdldChuYW1lKS5zaXplKCkgPiAwO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQ29udGFpbmVyQnJpZGdlIH0gZnJvbSBcIi4uL2JyaWRnZS9jb250YWluZXJCcmlkZ2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBDbGllbnQge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgZ2V0KHVybCwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwKXtcclxuICAgICAgICB2YXIgcGFyYW1zID0gIHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgbW9kZTogJ2NvcnMnLCAvLyBuby1jb3JzLCBjb3JzLCAqc2FtZS1vcmlnaW5cclxuICAgICAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5mZXRjaCh1cmwudG9TdHJpbmcoKSxwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGRhdGFcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFJlc3BvbnNlPn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIHBvc3QodXJsLCBkYXRhLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDAsIGF1dGhvcml6YXRpb24gPSBudWxsKXtcclxuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XHJcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxyXG4gICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICBtb2RlOiBcImNvcnNcIiwgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXHJcbiAgICAgICAgICAgIHJlZGlyZWN0OiBcImZvbGxvd1wiLCAvLyBtYW51YWwsICpmb2xsb3csIGVycm9yXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcHV0KHVybCwgZGF0YSwgY29ubmVjdGlvblRpbWVvdXQgPSA0MDAwLCByZXNwb25zZVRpbWVvdXQgPSA0MDAwLCBhdXRob3JpemF0aW9uID0gbnVsbCl7XHJcbiAgICAgICAgbGV0IGhlYWRlcnMgPSBDbGllbnQuZ2V0SGVhZGVyKGF1dGhvcml6YXRpb24pO1xyXG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xyXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSwgLy8gbXVzdCBtYXRjaCAnQ29udGVudC1UeXBlJyBoZWFkZXJcclxuICAgICAgICAgICAgbWV0aG9kOiAnUFVUJywgXHJcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJywgLy8gbm8tY29ycywgY29ycywgKnNhbWUtb3JpZ2luXHJcbiAgICAgICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JywgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxyXG4gICAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuZmV0Y2godXJsLnRvU3RyaW5nKCksIHBhcmFtcywgY29ubmVjdGlvblRpbWVvdXQsIHJlc3BvbnNlVGltZW91dCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZGF0YVxyXG4gICAgICogQHJldHVybnMge1Byb21pc2U8UmVzcG9uc2U+fVxyXG4gICAgICovXHJcbiAgICBzdGF0aWMgcGF0Y2godXJsLCBkYXRhLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDAsIGF1dGhvcml6YXRpb24gPSBudWxsKXtcclxuICAgICAgICBsZXQgaGVhZGVycyA9IENsaWVudC5nZXRIZWFkZXIoYXV0aG9yaXphdGlvbik7XHJcbiAgICAgICAgdmFyIHBhcmFtcyA9ICB7XHJcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KGRhdGEpLCAvLyBtdXN0IG1hdGNoICdDb250ZW50LVR5cGUnIGhlYWRlclxyXG4gICAgICAgICAgICBtZXRob2Q6ICdQQVRDSCcsIFxyXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxyXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsIC8vIG1hbnVhbCwgKmZvbGxvdywgZXJyb3JcclxuICAgICAgICAgICAgaGVhZGVyczogaGVhZGVyc1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXJsXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxSZXNwb25zZT59XHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBkZWxldGUodXJsLCBjb25uZWN0aW9uVGltZW91dCA9IDQwMDAsIHJlc3BvbnNlVGltZW91dCA9IDQwMDApe1xyXG4gICAgICAgIHZhciBwYXJhbXMgPSAge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxyXG4gICAgICAgICAgICBtb2RlOiAnY29ycycsIC8vIG5vLWNvcnMsIGNvcnMsICpzYW1lLW9yaWdpblxyXG4gICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycgLy8gbWFudWFsLCAqZm9sbG93LCBlcnJvclxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLmZldGNoKHVybC50b1N0cmluZygpLCBwYXJhbXMsIGNvbm5lY3Rpb25UaW1lb3V0LCByZXNwb25zZVRpbWVvdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRIZWFkZXIoYXV0aG9yaXphdGlvbiA9IG51bGwpIHtcclxuICAgICAgICBsZXQgaGVhZGVycyA9IHtcclxuICAgICAgICAgICAgXCJ1c2VyLWFnZW50XCI6IFwiTW96aWxsYS80LjAgTUROIEV4YW1wbGVcIixcclxuICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChhdXRob3JpemF0aW9uKSB7XHJcbiAgICAgICAgICAgIGhlYWRlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICBcInVzZXItYWdlbnRcIjogXCJNb3ppbGxhLzQuMCBNRE4gRXhhbXBsZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXHJcbiAgICAgICAgICAgICAgICBcIkF1dGhvcml6YXRpb25cIjogYXV0aG9yaXphdGlvblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IEJhc2VFbGVtZW50IH0gZnJvbSBcIi4uL2VsZW1lbnQvYmFzZUVsZW1lbnRcIjtcclxuXHJcbi8qIGpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wb25lbnQge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gY29tcG9uZW50SW5kZXggXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSByb290RWxlbWVudCBcclxuICAgICAqIEBwYXJhbSB7TWFwfSBlbGVtZW50TWFwIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3Rvcihjb21wb25lbnRJbmRleCwgcm9vdEVsZW1lbnQsIGVsZW1lbnRNYXApIHtcclxuICAgICAgICB0aGlzLmNvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kZXg7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwID0gZWxlbWVudE1hcDtcclxuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlKCkge1xyXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQucmVtb3ZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyB7QmFzZUVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGdldChpZCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXQgKGlkLCB2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudE1hcC5nZXQoaWQpLnNldCh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJDaGlsZHJlbihpZCl7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuY2xlYXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRDaGlsZCAoaWQsIHZhbHVlKSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50TWFwLmdldChpZCkuc2V0Q2hpbGQodmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZENoaWxkIChpZCwgdmFsdWUpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5hZGRDaGlsZCh2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJlcGVuZENoaWxkIChpZCwgdmFsdWUpIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAuZ2V0KGlkKS5wcmVwZW5kQ2hpbGQodmFsdWUpO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7TGlzdCxNYXB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuXG5leHBvcnQgY2xhc3MgVXJse1xuXG4gICAgY29uc3RydWN0b3IodmFsdWUpe1xuICAgICAgICB0aGlzLnByb3RvY29sID0gbnVsbDtcbiAgICAgICAgdGhpcy5ob3N0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5wb3J0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmJvb2ttYXJrID0gbnVsbDtcbiAgICAgICAgaWYodmFsdWUgPT09IG51bGwpe1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB0aGlzLmRldGVybWluZVByb3RvY29sKHZhbHVlKTtcbiAgICAgICAgaWYocmVtYWluaW5nID09PSBudWxsKXtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZih0aGlzLnByb3RvY29sICE9PSBudWxsKXtcbiAgICAgICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lSG9zdChyZW1haW5pbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5ob3N0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHJlbWFpbmluZyA9IHRoaXMuZGV0ZXJtaW5lUG9ydChyZW1haW5pbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVtYWluaW5nID0gdGhpcy5kZXRlcm1pbmVQYXRoKHJlbWFpbmluZyk7XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCl7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmVtYWluaW5nID0gdGhpcy5kZXRlcm1pbmVQYXJhbWV0ZXJzKHJlbWFpbmluZyk7XG4gICAgICAgIGlmKHJlbWFpbmluZyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kZXRlcm1pbmVCb29rbWFyayhyZW1haW5pbmcpO1xuICAgIH1cblxuICAgIGdldFByb3RvY29sKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3RvY29sO1xuICAgIH1cblxuICAgIGdldEhvc3QoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuaG9zdDtcbiAgICB9XG5cbiAgICBnZXRQb3J0KCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBvcnQ7XG4gICAgfVxuXG4gICAgZ2V0UGF0aExpc3QoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aExpc3Q7XG4gICAgfVxuXG4gICAgZ2V0UGF0aChpbmRleCl7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGhMaXN0LmdldChpbmRleCk7XG4gICAgfVxuXG4gICAgY2xlYXJQYXRoTGlzdCgpe1xuICAgICAgICB0aGlzLnBhdGhMaXN0ID0gbmV3IExpc3QoKTtcbiAgICB9XG5cbiAgICBnZXRQYXJhbWV0ZXJNYXAoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyYW1ldGVyTWFwO1xuICAgIH1cblxuICAgIGNsZWFyUGFyYW1ldGVyTUFwKCl7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyTWFwID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGdldFBhcmFtZXRlcihrZXkpe1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJhbWV0ZXJNYXAuZ2V0KGtleSk7XG4gICAgfVxuXG4gICAgc2V0UGFyYW1ldGVyKGtleSx2YWx1ZSl7XG4gICAgICAgIHRoaXMucGFyYW1ldGVyTWFwLnNldChrZXksdmFsdWUpO1xuICAgIH1cblxuICAgIHNldEJvb2ttYXJrKGJvb2ttYXJrKXtcbiAgICAgICAgdGhpcy5ib29rbWFyayA9IGJvb2ttYXJrO1xuICAgIH1cblxuICAgIHNldFBhdGgodmFsdWUpIHtcbiAgICAgICAgdGhpcy5kZXRlcm1pbmVQYXRoKHZhbHVlKTtcbiAgICB9XG5cbiAgICBzZXRRdWVyeVN0cmluZyh2YWx1ZSkge1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IHRoaXMuZGV0ZXJtaW5lUGFyYW1ldGVycyh2YWx1ZSk7XG4gICAgfVxuXG4gICAgZ2V0Qm9va21hcmsoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuYm9va21hcms7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUHJvdG9jb2wodmFsdWUpe1xuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiLy9cIikgPT09IC0xKXtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIi8vXCIpO1xuICAgICAgICBpZihwYXJ0c1swXS5pbmRleE9mKFwiL1wiKSAhPT0gLTEpe1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJvdG9jb2wgPSBwYXJ0c1swXTtcbiAgICAgICAgaWYocGFydHMubGVuZ3RoPT0xKXtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKHBhcnRzWzBdICsgXCIvL1wiLFwiXCIpO1xuICAgIH1cblxuICAgIGRldGVybWluZUhvc3QodmFsdWUpe1xuICAgICAgICB2YXIgcGFydHMgPSB2YWx1ZS5zcGxpdChcIi9cIik7XG4gICAgICAgIHZhciBob3N0UGFydCA9IHBhcnRzWzBdO1xuICAgICAgICBpZihob3N0UGFydC5pbmRleE9mKFwiOlwiKSAhPT0gLTEpe1xuICAgICAgICAgICAgaG9zdFBhcnQgPSBob3N0UGFydC5zcGxpdChcIjpcIilbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ob3N0ID0gaG9zdFBhcnQ7XG4gICAgICAgIGlmKHBhcnRzLmxlbmd0aCA+IDEpe1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoaG9zdFBhcnQsXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUG9ydCh2YWx1ZSl7XG4gICAgICAgIGlmKCF2YWx1ZS5zdGFydHNXaXRoKFwiOlwiKSl7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBvcnRQYXJ0ID0gdmFsdWUuc3BsaXQoXCIvXCIpWzBdLnN1YnN0cmluZygxKTtcbiAgICAgICAgdGhpcy5wb3J0ID0gcG9ydFBhcnQ7XG4gICAgICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKFwiOlwiICsgcG9ydFBhcnQsXCJcIik7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lUGF0aCh2YWx1ZSl7XG4gICAgICAgIHZhciByZW1haW5pbmcgPSB2YWx1ZTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIj9cIikgIT09IC0xKXtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHZhbHVlLnNwbGl0KFwiP1wiKTtcbiAgICAgICAgICAgIGlmKHBhcnRzLmxlbmd0aCA+IDEpe1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZyA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiP1wiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnRzWzBdO1xuICAgICAgICB9IGVsc2UgaWYodmFsdWUuaW5kZXhPZihcIiNcIikgIT09IC0xKXtcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHZhbHVlLnNwbGl0KFwiI1wiKTtcbiAgICAgICAgICAgIGlmKHBhcnRzLmxlbmd0aCA+IDEpe1xuICAgICAgICAgICAgICAgIHJlbWFpbmluZyA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiI1wiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IHBhcnRzWzBdO1xuICAgICAgICB9XG4gICAgICAgIGlmKHZhbHVlLnN0YXJ0c1dpdGgoXCIvXCIpKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyaW5nKDEpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXRoUGFydHMgPSBuZXcgTGlzdCh2YWx1ZS5zcGxpdChcIi9cIikpO1xuICAgICAgICB0aGlzLnBhdGhMaXN0ID0gbmV3IExpc3QoKTtcbiAgICAgICAgcGF0aFBhcnRzLmZvckVhY2goZnVuY3Rpb24odmFsdWUscGFyZW50KXtcbiAgICAgICAgICAgIHBhcmVudC5wYXRoTGlzdC5hZGQoZGVjb2RlVVJJKHZhbHVlKSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgcmV0dXJuIHJlbWFpbmluZztcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVQYXJhbWV0ZXJzKHZhbHVlKXtcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IHZhbHVlO1xuICAgICAgICBpZih2YWx1ZS5pbmRleE9mKFwiP1wiKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiP1wiKSsxKTtcbiAgICAgICAgaWYodmFsdWUuaW5kZXhPZihcIiNcIikgIT09IC0xKSB7XG4gICAgICAgICAgICByZW1haW5pbmcgPSB2YWx1ZS5zdWJzdHJpbmcodmFsdWUuaW5kZXhPZihcIiNcIikpO1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHJpbmcoMCx2YWx1ZS5pbmRleE9mKFwiI1wiKSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnRMaXN0ID0gbmV3IExpc3QodmFsdWUuc3BsaXQoXCImXCIpKTtcbiAgICAgICAgdmFyIHBhcmFtZXRlck1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgcGFydExpc3QuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgdmFyIGtleVZhbHVlID0gdmFsdWUuc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgaWYoa2V5VmFsdWUubGVuZ3RoID49IDIpe1xuICAgICAgICAgICAgICAgIHBhcmFtZXRlck1hcC5zZXQoZGVjb2RlVVJJKGtleVZhbHVlWzBdKSxkZWNvZGVVUkkoa2V5VmFsdWVbMV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LHRoaXMpO1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcCA9IHBhcmFtZXRlck1hcDtcbiAgICAgICAgcmV0dXJuIHJlbWFpbmluZztcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVCb29rbWFyayh2YWx1ZSl7XG4gICAgICAgIGlmKHZhbHVlLmluZGV4T2YoXCIjXCIpICE9PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5ib29rbWFyayA9IHZhbHVlLnN1YnN0cmluZyh2YWx1ZS5pbmRleE9mKFwiI1wiKSsxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRvU3RyaW5nKCl7XG4gICAgICAgIHZhciB2YWx1ZSA9IFwiXCI7XG4gICAgICAgIGlmKHRoaXMucHJvdG9jb2wgIT09IG51bGwpe1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIHRoaXMucHJvdG9jb2wgKyBcIi8vXCI7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5ob3N0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyB0aGlzLmhvc3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYodGhpcy5wb3J0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIjpcIiArIHRoaXMucG9ydDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGF0aExpc3QuZm9yRWFjaChmdW5jdGlvbihwYXRoUGFydCxwYXJlbnQpe1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIFwiL1wiICsgcGF0aFBhcnQ7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSx0aGlzKTtcblxuICAgICAgICB2YXIgZmlyc3RQYXJhbWV0ZXIgPSB0cnVlO1xuICAgICAgICB0aGlzLnBhcmFtZXRlck1hcC5mb3JFYWNoKGZ1bmN0aW9uKHBhcmFtZXRlcktleSxwYXJhbWV0ZXJWYWx1ZSxwYXJlbnQpe1xuICAgICAgICAgICAgaWYoZmlyc3RQYXJhbWV0ZXIpe1xuICAgICAgICAgICAgICAgIGZpcnN0UGFyYW1ldGVyPWZhbHNlO1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIj9cIjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBcIiZcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUgKyBlbmNvZGVVUkkocGFyYW1ldGVyS2V5KSArIFwiPVwiICsgZW5jb2RlVVJJKHBhcmFtZXRlclZhbHVlKTtcbiAgICAgICAgfSx0aGlzKTtcbiAgICAgICAgaWYodGhpcy5ib29rbWFyayAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSArIFwiI1wiICsgdGhpcy5ib29rbWFyaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG59XG4iLCJleHBvcnQgY2xhc3MgU3R5bGVze1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3R5bGVzU291cmNlIFxyXG4gICAgICovXHJcbiAgICBjb25zdHJ1Y3RvcihzdHlsZXNTb3VyY2Upe1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLnN0eWxlc1NvdXJjZSA9IHN0eWxlc1NvdXJjZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIGdldFN0eWxlc1NvdXJjZSgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc1NvdXJjZTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuaW1wb3J0IHtNYXAsIExvZ2dlciwgT2JqZWN0RnVuY3Rpb259IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDbGllbnQgfSBmcm9tIFwiLi4vY2xpZW50L2NsaWVudC5qc1wiO1xyXG5pbXBvcnQgeyBVcmwgfSBmcm9tIFwiLi4vdXRpbC91cmwuanNcIjtcclxuaW1wb3J0IHsgU3R5bGVzIH0gZnJvbSBcIi4vc3R5bGVzLmpzXCI7XHJcblxyXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiU3R5bGVzUmVnaXN0cnlcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgU3R5bGVzUmVnaXN0cnkge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCl7XHJcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXHJcbiAgICAgICAgdGhpcy5zdHlsZXNNYXAgPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzVXJsTWFwID0gbmV3IE1hcCgpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge2ludGVnZXJ9ICovXHJcbiAgICAgICAgdGhpcy5zdHlsZXNRdWV1ZVNpemUgPSAwO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xyXG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqIEBwYXJhbSB7U3R5bGVzfSBzdHlsZXMgXHJcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxyXG4gICAgICovXHJcbiAgICBzZXQobmFtZSxzdHlsZXMsdXJsKXtcclxuICAgICAgICBpZih1cmwgIT09IHVuZGVmaW5lZCAmJiB1cmwgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5zdHlsZXNVcmxNYXAuc2V0KG5hbWUsIHVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3R5bGVzTWFwLnNldChuYW1lLCBzdHlsZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqL1xyXG4gICAgZ2V0KG5hbWUpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0eWxlc01hcC5nZXQobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxyXG4gICAgICovXHJcbiAgICBjb250YWlucyhuYW1lKXtcclxuICAgICAgICByZXR1cm4gdGhpcy5zdHlsZXNNYXAuY29udGFpbnMobmFtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGNhbGxiYWNrIFxyXG4gICAgICovXHJcbiAgICBkb25lKGNhbGxiYWNrKXtcclxuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XHJcbiAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1N0eWxlc1JlZ2lzdHJ5fSByZWdpc3RyeSBcclxuICAgICAqL1xyXG4gICAgZG9DYWxsYmFjayhyZWdpc3RyeSl7XHJcbiAgICAgICAgaWYodG1vLmNhbGxiYWNrICE9PSBudWxsICYmIHJlZ2lzdHJ5LmNhbGxiYWNrICE9PSB1bmRlZmluZWQgICYmIHJlZ2lzdHJ5LnN0eWxlc1F1ZXVlU2l6ZSA9PT0gcmVnaXN0cnkuc3R5bGVzTWFwLnNpemUoKSl7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQ2FsbGJhY2sgPSByZWdpc3RyeS5jYWxsYmFjaztcclxuICAgICAgICAgICAgcmVnaXN0cnkuY2FsbGJhY2sgPSBudWxsO1xyXG4gICAgICAgICAgICB0ZW1wQ2FsbGJhY2suY2FsbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXHJcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxyXG4gICAgICovXHJcbiAgICAgbG9hZChuYW1lLCB1cmwpIHtcclxuICAgICAgICB0aGlzLnN0eWxlc1F1ZXVlU2l6ZSArKztcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2Uub2spe1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgc3R5bGVzIGZvciBcIiArIG5hbWUgKyBcIiBhdCBcIiArIHVybDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXQobmFtZSxuZXcgU3R5bGVzKHRleHQpLHVybCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb0NhbGxiYWNrKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7TWFwfSBuYW1lVXJsTWFwIFxyXG4gICAgICovXHJcbiAgICBnZXRTdHlsZXNMb2FkZWRQcm9taXNlKG5hbWVVcmxNYXApIHtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBsb2FkZWQgPSAwO1xyXG4gICAgICAgICAgICBpZighbmFtZVVybE1hcCB8fCBuYW1lVXJsTWFwLnNpemUoKSA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbmFtZVVybE1hcC5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuY29udGFpbnMoa2V5KSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVkICsrO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcml2YXRlTG9hZChrZXksIG5ldyBVcmwodmFsdWUpKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobG9hZGVkID09IG5hbWVVcmxNYXAuc2l6ZSgpKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaCgocmVhc29uKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZWFzb24pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmVhayBsb29wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9LHRoaXMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcclxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGVMb2FkKG5hbWUsIHVybCkge1xyXG4gICAgICAgIExPRy5pbmZvKFwiTG9hZGluZyBzdHlsZXMgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmwudG9TdHJpbmcoKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBDbGllbnQuZ2V0KHVybCkudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5vayl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCBzdHlsZXMgZm9yIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UudGV4dCgpLnRoZW4oKHRleHQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChuYW1lLG5ldyBTdHlsZXModGV4dCksdXJsKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn0iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZXtcblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZW1wbGF0ZVNvdXJjZSBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih0ZW1wbGF0ZVNvdXJjZSl7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtzdHJpbmd9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVTb3VyY2UgPSB0ZW1wbGF0ZVNvdXJjZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldFRlbXBsYXRlU291cmNlKCl7XG4gICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlU291cmNlO1xuICAgIH1cblxufVxuIiwiLyoganNoaW50IGVzdmVyc2lvbjogNiAqL1xuXG5pbXBvcnQge01hcCwgTG9nZ2VyLCBPYmplY3RGdW5jdGlvbn0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XG5pbXBvcnQge1RlbXBsYXRlfSBmcm9tIFwiLi90ZW1wbGF0ZS5qc1wiO1xuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcbmltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiVGVtcGxhdGVSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIFRlbXBsYXRlUmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKXtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIHRoaXMudGVtcGxhdGVVcmxNYXAgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqIEB0eXBlIHtpbnRlZ2VyfSAqL1xuICAgICAgICB0aGlzLnRlbXBsYXRlUXVldWVTaXplID0gMDtcblxuICAgICAgICAvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gbnVsbDtcblxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCA9IG51bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlUHJlZml4IFxuICAgICAqL1xuICAgIHNldExhbmd1YWdlUHJlZml4KGxhbmd1YWdlUHJlZml4KSB7XG4gICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggPSBsYW5ndWFnZVByZWZpeDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBcbiAgICAgKiBAcGFyYW0ge1RlbXBsYXRlfSB0ZW1wbGF0ZSBcbiAgICAgKiBAcGFyYW0ge1VybH0gdXJsIFxuICAgICAqL1xuICAgIHNldChuYW1lLHRlbXBsYXRlLHVybCl7XG4gICAgICAgIGlmKHVybCAhPT0gdW5kZWZpbmVkICYmIHVybCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZVVybE1hcC5zZXQobmFtZSwgdXJsKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRlbXBsYXRlTWFwLnNldChuYW1lLCB0ZW1wbGF0ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICovXG4gICAgZ2V0KG5hbWUpe1xuICAgICAgICByZXR1cm4gdGhpcy50ZW1wbGF0ZU1hcC5nZXQobmFtZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICovXG4gICAgY29udGFpbnMobmFtZSl7XG4gICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlTWFwLmNvbnRhaW5zKG5hbWUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGNhbGxiYWNrIFxuICAgICAqL1xuICAgIGRvbmUoY2FsbGJhY2spe1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge1RlbXBsYXRlUmVnaXN0cnl9IHJlZ2lzdHJ5IFxuICAgICAqL1xuICAgIGRvQ2FsbGJhY2socmVnaXN0cnkpe1xuICAgICAgICBpZih0bW8uY2FsbGJhY2sgIT09IG51bGwgJiYgcmVnaXN0cnkuY2FsbGJhY2sgIT09IHVuZGVmaW5lZCAgJiYgcmVnaXN0cnkudGVtcGxhdGVRdWV1ZVNpemUgPT09IHJlZ2lzdHJ5LnRlbXBsYXRlTWFwLnNpemUoKSl7XG4gICAgICAgICAgICB2YXIgdGVtcENhbGxiYWNrID0gcmVnaXN0cnkuY2FsbGJhY2s7XG4gICAgICAgICAgICByZWdpc3RyeS5jYWxsYmFjayA9IG51bGw7XG4gICAgICAgICAgICB0ZW1wQ2FsbGJhY2suY2FsbCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgXG4gICAgICogQHBhcmFtIHtVcmx9IHVybCBcbiAgICAgKi9cbiAgICBsb2FkKG5hbWUsIHVybCkge1xuICAgICAgICBpZih0aGlzLmxhbmd1YWdlUHJlZml4ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB1cmwuZ2V0UGF0aExpc3QoKS5zZXRMYXN0KFxuICAgICAgICAgICAgICAgIHRoaXMubGFuZ3VhZ2VQcmVmaXggKyBcIi5cIiArXG4gICAgICAgICAgICAgICAgdXJsLmdldFBhdGhMaXN0KCkuZ2V0TGFzdCgpXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGVtcGxhdGVRdWV1ZVNpemUgKys7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgQ2xpZW50LmdldCh1cmwpLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLm9rKXtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJVbmFibGUgdG8gbG9hZCB0ZW1wbGF0ZSBmb3IgXCIgKyBuYW1lICsgXCIgYXQgXCIgKyB1cmw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnRleHQoKS50aGVuKCh0ZXh0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsbmV3IFRlbXBsYXRlKHRleHQpLHVybCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9DYWxsYmFjayh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBuYW1lVXJsTWFwIFxuICAgICAqL1xuICAgIGdldFRlbXBsYXRlc0xvYWRlZFByb21pc2UobmFtZVVybE1hcCkge1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSxyZWplY3QpID0+IHtcbiAgICAgICAgICAgIHZhciBsb2FkZWQgPSAwO1xuICAgICAgICAgICAgaWYoIW5hbWVVcmxNYXAgfHwgbmFtZVVybE1hcC5zaXplKCkgPT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuYW1lVXJsTWFwLmZvckVhY2goKGtleSwgdmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHRoaXMuY29udGFpbnMoa2V5KSl7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcbiAgICAgICAgICAgICAgICAgICAgaWYobG9hZGVkID09IG5hbWVVcmxNYXAuc2l6ZSgpKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wcml2YXRlTG9hZChrZXksIG5ldyBVcmwodmFsdWUpKVxuXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZCArKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGxvYWRlZCA9PSBuYW1lVXJsTWFwLnNpemUoKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJyZWFrIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChyZWFzb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQnJlYWsgbG9vcFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sdGhpcyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFxuICAgICAqIEBwYXJhbSB7VXJsfSB1cmwgXG4gICAgICovXG4gICAgcHJpdmF0ZUxvYWQobmFtZSwgdXJsKSB7XG4gICAgICAgIGlmKHRoaXMubGFuZ3VhZ2VQcmVmaXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIHVybC5nZXRQYXRoTGlzdCgpLnNldExhc3QoXG4gICAgICAgICAgICAgICAgdGhpcy5sYW5ndWFnZVByZWZpeCArIFwiLlwiICtcbiAgICAgICAgICAgICAgICB1cmwuZ2V0UGF0aExpc3QoKS5nZXRMYXN0KClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgTE9HLmluZm8oXCJMb2FkaW5nIHRlbXBsYXRlIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsLnRvU3RyaW5nKCkpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sc2UpID0+IHtcbiAgICAgICAgICAgIENsaWVudC5nZXQodXJsKS50aGVuKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5vayl7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwiVW5hYmxlIHRvIGxvYWQgdGVtcGxhdGUgZm9yIFwiICsgbmFtZSArIFwiIGF0IFwiICsgdXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNwb25zZS50ZXh0KCkudGhlbigodGV4dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldChuYW1lLG5ldyBUZW1wbGF0ZSh0ZXh0KSx1cmwpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufSIsImltcG9ydCB7IExvZ2dlciwgTWFwIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IENvbmZpZyB9IGZyb20gXCJtaW5kaV92MVwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4vdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIlRlbXBsYXRlUG9zdENvbmZpZ1wiKTtcclxuXHJcbi8qKlxyXG4gKiBUbyBiZSBhZGRlZCB0byBtaW5kaSBhcyBhIHNpbmdsZXRvbi4gV2lsbCBzY2FuIHRocm91Z2ggYWxsIGNvbmZpZ3VyZWQgY2xhc3NlcyB0aGF0IGhhdmUgYSBURU1QTEFURV9VUkwgYW5kIENPTVBPTkVOVF9OQU1FXHJcbiAqIHN0YXRpYyBnZXR0ZXIgYW5kIHdpbGwgYXN5bmNyb25vdXNseSBsb2FkIHRoZW0uIFJldHVybnMgYSBwcm9taXNlIHdoaWNoIHJlc29sdmVzIHdoZW4gYWxsIHRlbXBsYXRlcyBhcmUgbG9hZGVkXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgVGVtcGxhdGVzTG9hZGVyIHtcclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7VGVtcGxhdGVSZWdpc3RyeX0gdGVtcGxhdGVSZWdpc3RyeSBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IodGVtcGxhdGVSZWdpc3RyeSkge1xyXG4gICAgICAgIHRoaXMudGVtcGxhdGVSZWdpc3RyeSA9IHRlbXBsYXRlUmVnaXN0cnk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7Q29uZmlnfSBjb25maWdcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBsb2FkKGNvbmZpZykge1xyXG4gICAgICAgIGxldCB0ZW1wbGF0ZU1hcCA9IG5ldyBNYXAoKTtcclxuICAgICAgICBjb25maWcuY29uZmlnRW50cmllcy5mb3JFYWNoKChrZXksIGNvbmZpZ0VudHJ5LCBwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuVEVNUExBVEVfVVJMICYmIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZU1hcC5zZXQoY29uZmlnRW50cnkuY2xhc3NSZWZlcmVuY2UuQ09NUE9ORU5UX05BTUUsIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLlRFTVBMQVRFX1VSTCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSwgdGhpcyk7IFxyXG4gICAgICAgIHJldHVybiB0aGlzLnRlbXBsYXRlUmVnaXN0cnkuZ2V0VGVtcGxhdGVzTG9hZGVkUHJvbWlzZSh0ZW1wbGF0ZU1hcCk7XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgTG9nZ2VyLCBNYXAgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSBcIm1pbmRpX3YxXCI7XHJcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4vc3R5bGVzUmVnaXN0cnkuanNcIjtcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJTdHlsZXNMb2FkZXJcIik7XHJcblxyXG4vKipcclxuICogVG8gYmUgYWRkZWQgdG8gbWluZGkgYXMgYSBzaW5nbGV0b24uIFdpbGwgc2NhbiB0aHJvdWdoIGFsbCBjb25maWd1cmVkIGNsYXNzZXMgdGhhdCBoYXZlIGEgU1RZTEVTX1VSTCBhbmQgQ09NUE9ORU5UX05BTUVcclxuICogc3RhdGljIGdldHRlciBhbmQgd2lsbCBhc3luY3Jvbm91c2x5IGxvYWQgdGhlbS4gUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgd2hlbiBhbGwgc3R5bGVzIGFyZSBsb2FkZWRcclxuICovXHJcbmV4cG9ydCBjbGFzcyBTdHlsZXNMb2FkZXIge1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtTdHlsZXNSZWdpc3RyeX0gc3R5bGVzUmVnaXN0cnkgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHN0eWxlc1JlZ2lzdHJ5KSB7XHJcbiAgICAgICAgdGhpcy5zdHlsZXNSZWdpc3RyeSA9IHN0eWxlc1JlZ2lzdHJ5O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge0NvbmZpZ30gY29uZmlnXHJcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX1cclxuICAgICAqL1xyXG4gICAgbG9hZChjb25maWcpIHtcclxuICAgICAgICBsZXQgc3R5bGVzTWFwID0gbmV3IE1hcCgpO1xyXG4gICAgICAgIGNvbmZpZy5jb25maWdFbnRyaWVzLmZvckVhY2goKGtleSwgY29uZmlnRW50cnksIHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZihjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5TVFlMRVNfVVJMICYmIGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FKSB7XHJcbiAgICAgICAgICAgICAgICBzdHlsZXNNYXAuc2V0KGNvbmZpZ0VudHJ5LmNsYXNzUmVmZXJlbmNlLkNPTVBPTkVOVF9OQU1FLCBjb25maWdFbnRyeS5jbGFzc1JlZmVyZW5jZS5TVFlMRVNfVVJMKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTsgXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3R5bGVzUmVnaXN0cnkuZ2V0U3R5bGVzTG9hZGVkUHJvbWlzZShzdHlsZXNNYXApO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBDb25maWcsIEluamVjdGlvblBvaW50IH0gZnJvbSBcIm1pbmRpX3YxXCI7XHJcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgVGVtcGxhdGVzTG9hZGVyIH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlc0xvYWRlci5qc1wiO1xyXG5pbXBvcnQgeyBTdHlsZXNMb2FkZXIgfSBmcm9tIFwiLi4vc3R5bGVzL3N0eWxlc0xvYWRlci5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbXBvbmVudENvbmZpZ1Byb2Nlc3NvclwiKVxyXG5cclxuLyoqXHJcbiAqIE1pbmRpIGNvbmZpZyBwcm9jZXNzb3Igd2hpY2ggbG9hZHMgYWxsIHRlbXBsYXRlcyBhbmQgc3R5bGVzIGZvciBhbGwgY29uZmlndXJlZCBjb21wb25lbnRzXHJcbiAqIGFuZCB0aGVuIGNhbGxzIGFueSBleGlzdGluZyBjb21wb25lbnRMb2FkZWQgZnVuY3Rpb24gb24gZWFjaCBjb21wb25lbnRcclxuICovXHJcbmV4cG9ydCBjbGFzcyBDb21wb25lbnRDb25maWdQcm9jZXNzb3Ige1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBAdHlwZSB7VGVtcGxhdGVSZWdpc3RyeX1cclxuICAgICAgICAgKi9cclxuICAgICAgICB0aGlzLnRlbXBsYXRlUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShUZW1wbGF0ZVJlZ2lzdHJ5KTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogQHR5cGUge1N0eWxlc1JlZ2lzdHJ5fVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuc3R5bGVzUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShTdHlsZXNSZWdpc3RyeSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKi9cclxuICAgIHBvc3RDb25maWcoKXtcclxuICAgICAgICB0aGlzLnRlbXBsYXRlc0xvYWRlciA9IG5ldyBUZW1wbGF0ZXNMb2FkZXIodGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5KTtcclxuICAgICAgICB0aGlzLnN0eWxlc0xvYWRlciA9IG5ldyBTdHlsZXNMb2FkZXIodGhpcy5zdHlsZXNSZWdpc3RyeSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7Q29uZmlnfSBjb25maWdcclxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfVxyXG4gICAgICovXHJcbiAgICBwcm9jZXNzQ29uZmlnKGNvbmZpZykge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChcclxuICAgICAgICAgICAgWyBcclxuICAgICAgICAgICAgICAgIHRoaXMudGVtcGxhdGVzTG9hZGVyLmxvYWQoY29uZmlnKSwgXHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0eWxlc0xvYWRlci5sb2FkKGNvbmZpZykgXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IE1hcCB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFVuaXF1ZUlkUmVnaXN0cnkge1xyXG5cclxuICAgIGlkQXR0cmlidXRlV2l0aFN1ZmZpeCAoaWQpIHtcclxuICAgICAgICBpZihpZE5hbWVzLmNvbnRhaW5zKGlkKSkge1xyXG4gICAgICAgICAgICB2YXIgbnVtYmVyID0gaWROYW1lcy5nZXQoaWQpO1xyXG4gICAgICAgICAgICBpZE5hbWVzLnNldChpZCxudW1iZXIrMSk7XHJcbiAgICAgICAgICAgIHJldHVybiBpZCArIFwiLVwiICsgbnVtYmVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZE5hbWVzLnNldChpZCwxKTtcclxuICAgICAgICByZXR1cm4gaWQ7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG52YXIgaWROYW1lcyA9IG5ldyBNYXAoKTsiLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IEVsZW1lbnRNYXBwZXIgfSBmcm9tIFwiLi4vZWxlbWVudC9lbGVtZW50TWFwcGVyLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBFdmVudHtcblxuICAgIGNvbnN0cnVjdG9yKGV2ZW50KXtcbiAgICAgICAgdGhpcy5ldmVudCA9IGV2ZW50O1xuICAgICAgICBpZih0aGlzLmV2ZW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSBcImRyYWdzdGFydFwiKXtcbiAgICAgICAgICAgIHRoaXMuZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoJ3RleHQvcGxhaW4nLCBudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0b3BQcm9wYWdhdGlvbigpe1xuICAgICAgICB0aGlzLmV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cblxuICAgIHByZXZlbnREZWZhdWx0KCl7XG4gICAgICAgIHRoaXMuZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgZXZlbnQgYW5kIHRoZSBlZGdlIHggY29vcmRpbmF0ZSBvZiB0aGUgY29udGFpbmluZyBvYmplY3RcbiAgICAgKi9cbiAgICBnZXRPZmZzZXRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Lm9mZnNldFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIGV2ZW50IGFuZCB0aGUgZWRnZSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNvbnRhaW5pbmcgb2JqZWN0XG4gICAgICovXG4gICAgZ2V0T2Zmc2V0WSgpe1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5vZmZzZXRZO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBtb3VzZSB4IGNvb3JkaW5hdGUgb2YgdGhlIGV2ZW50IHJlbGF0aXZlIHRvIHRoZSBjbGllbnQgd2luZG93IHZpZXdcbiAgICAgKi9cbiAgICBnZXRDbGllbnRYKCl7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmNsaWVudFg7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIG1vdXNlIHkgY29vcmRpbmF0ZSBvZiB0aGUgZXZlbnQgcmVsYXRpdmUgdG8gdGhlIGNsaWVudCB3aW5kb3cgdmlld1xuICAgICAqL1xuICAgIGdldENsaWVudFkoKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnQuY2xpZW50WTtcbiAgICB9XG5cbiAgICBnZXRUYXJnZXQoKXtcbiAgICAgICAgcmV0dXJuIEVsZW1lbnRNYXBwZXIubWFwKHRoaXMuZXZlbnQudGFyZ2V0KTtcbiAgICB9XG5cbiAgICBnZXRLZXlDb2RlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudC5rZXlDb2RlO1xuICAgIH1cblxuICAgIGlzS2V5Q29kZShjb2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50LmtleUNvZGUgPT09IGNvZGU7XG4gICAgfVxuXG59XG4iLCIvKiBqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXG5cbmltcG9ydCB7IE1hcCwgT2JqZWN0RnVuY3Rpb24sIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgRXZlbnQgfSBmcm9tIFwiLi9ldmVudC5qc1wiO1xuaW1wb3J0IHsgQmFzZUVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9iYXNlRWxlbWVudC5qc1wiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiRXZlbnRSZWdpc3RyeVwiKTtcblxuZXhwb3J0IGNsYXNzIEV2ZW50UmVnaXN0cnkge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmJlZm9yZUxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5hZnRlckxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb25uZWN0cyBlbGVtZW50cyB3aXRoIHRoZSBldmVudCByZWdpc3RyeSBzbyB0aGF0IGV2ZW50cyB0cmlnZ2VyZWQgb24gdGhlIGVsZW1lbnQgZ2V0cyBkaXN0cmlidXRlZCB0byBhbGwgbGlzdGVuZXJzXG4gICAgICogXG4gICAgICogQHBhcmFtIHtCYXNlRWxlbWVudH0gZWxlbWVudCB0aGUgZWxlbWVudCB3aGljaCBpcyB0aGUgc291cmNlIG9mIHRoZSBldmVudCBhbmQgd2hpY2ggY2FuIGJlIGF0dGFjaGVkIHRvXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50VHlwZSB0aGUgZXZlbnQgdHlwZSBhcyBpdCBpcyBkZWZpbmVkIGJ5IHRoZSBjb250YWluaW5nIHRyaWdnZXIgKGV4YW1wbGUgXCJvbmNsaWNrXCIpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSB0aGUgZXZlbnQgbmFtZSBhcyBpdCB3aWxsIGJlIHJlZmVycmVkIHRvIGluIHRoZSBFdmVudFJlZ2lzdHJ5IChleGFtcGxlIFwiLy9ldmVudDpjbGlja2VkXCIpXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNvbXBvbmVudEluZGV4IHVuaXF1ZSBpZCBvZiB0aGUgY29tcG9uZW50IHdoaWNoIG93bnMgdGhlIGVsZW1lbnRcbiAgICAgKi9cbiAgICBhdHRhY2goZWxlbWVudCwgZXZlbnRUeXBlLCBldmVudE5hbWUsIGNvbXBvbmVudEluZGV4KSB7XG4gICAgICAgIGNvbnN0IHVuaXF1ZUV2ZW50TmFtZSA9IGV2ZW50TmFtZSArIFwiX1wiICsgY29tcG9uZW50SW5kZXg7XG4gICAgICAgIGNvbnN0IHRoZUV2ZW50UmVnaXN0cnkgPSB0aGlzO1xuICAgICAgICBlbGVtZW50LmF0dGFjaEV2ZW50KGV2ZW50VHlwZSwgZnVuY3Rpb24oZXZlbnQpIHsgdGhlRXZlbnRSZWdpc3RyeS50cmlnZ2VyKHVuaXF1ZUV2ZW50TmFtZSwgZXZlbnROYW1lLCBldmVudCk7IH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgdGhlIGV2ZW50IG5hbWUgYXMgaXQgd2lsbCBiZSByZWZlcnJlZCB0byBpbiB0aGUgRXZlbnRSZWdpc3RyeSAoZXhhbXBsZSBcIi8vZXZlbnQ6Y2xpY2tlZFwiKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGxpc3RlbmVyIHRoZSBvYmplY3Qgd2hpY2ggb3ducyB0aGUgaGFuZGxlciBmdW5jdGlvblxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1bmlxdWVJbmRleCBhIHVuaXF1ZSBpbmRleCBmb3IgdGhlIGV2ZW50XG4gICAgICovXG4gICAgbGlzdGVuKGV2ZW50TmFtZSwgbGlzdGVuZXIsIHVuaXF1ZUluZGV4KSB7XG4gICAgICAgIGNvbnN0IHVuaXF1ZUV2ZW50TmFtZSA9IGV2ZW50TmFtZSArIFwiX1wiICsgdW5pcXVlSW5kZXg7XG4gICAgICAgIHRoaXMuaW5pdE1hcCh0aGlzLmxpc3RlbmVycywgdW5pcXVlRXZlbnROYW1lKTtcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXG4gICAgICAgIGNvbnN0IGxpc3RlbmVyTWFwID0gdGhpcy5saXN0ZW5lcnMuZ2V0KHVuaXF1ZUV2ZW50TmFtZSk7XG4gICAgICAgIGxpc3RlbmVyTWFwLnNldChsaXN0ZW5lci5nZXRPYmplY3QoKS5jb25zdHJ1Y3Rvci5uYW1lLCBsaXN0ZW5lcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSB0aGUgZXZlbnQgbmFtZSBhcyBpdCB3aWxsIGJlIHJlZmVycmVkIHRvIGluIHRoZSBFdmVudFJlZ2lzdHJ5IChleGFtcGxlIFwiLy9ldmVudDpjbGlja2VkXCIpXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gbGlzdGVuZXIgdGhlIG9iamVjdCB3aGljaCBvd25zIHRoZSBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICovXG4gICAgbGlzdGVuQmVmb3JlKGV2ZW50TmFtZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgdGhpcy5pbml0TWFwKHRoaXMuYmVmb3JlTGlzdGVuZXJzLCBldmVudE5hbWUpO1xuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgY29uc3QgbGlzdGVuZXJNYXAgPSB0aGlzLmJlZm9yZUxpc3RlbmVycy5nZXQoZXZlbnROYW1lKTtcbiAgICAgICAgbGlzdGVuZXJNYXAuc2V0KGxpc3RlbmVyLmdldE9iamVjdCgpLmNvbnN0cnVjdG9yLm5hbWUsIGxpc3RlbmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIHRoZSBldmVudCBuYW1lIGFzIGl0IHdpbGwgYmUgcmVmZXJyZWQgdG8gaW4gdGhlIEV2ZW50UmVnaXN0cnkgKGV4YW1wbGUgXCIvL2V2ZW50OmNsaWNrZWRcIilcbiAgICAgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBsaXN0ZW5lciB0aGUgb2JqZWN0IHdoaWNoIG93bnMgdGhlIGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBsaXN0ZW5BZnRlcihldmVudE5hbWUsIGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuaW5pdE1hcCh0aGlzLmFmdGVyTGlzdGVuZXJzLCBldmVudE5hbWUpO1xuICAgICAgICAvKiogQHR5cGUge01hcH0gKi9cbiAgICAgICAgY29uc3QgbGlzdGVuZXJNYXAgPSB0aGlzLmFmdGVyTGlzdGVuZXJzLmdldChldmVudE5hbWUpO1xuICAgICAgICBsaXN0ZW5lck1hcC5zZXQobGlzdGVuZXIuZ2V0T2JqZWN0KCkuY29uc3RydWN0b3IubmFtZSwgbGlzdGVuZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7TWFwfSBtYXAgXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBcbiAgICAgKi9cbiAgICBpbml0TWFwKG1hcCwga2V5KSB7XG4gICAgICAgIGlmICghbWFwLmV4aXN0cyhrZXkpKSB7XG4gICAgICAgICAgICBtYXAuc2V0KGtleSxuZXcgTWFwKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJpZ2dlcihzdWZmaXhlZEV2ZW50TmFtZSwgZXZlbnROYW1lLCBldmVudCkge1xuICAgICAgICB0aGlzLmhhbmRsZUJlZm9yZShldmVudE5hbWUsIGV2ZW50KTtcbiAgICAgICAgaWYgKHRoaXMubGlzdGVuZXJzLmV4aXN0cyhzdWZmaXhlZEV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLmdldChzdWZmaXhlZEV2ZW50TmFtZSkuZm9yRWFjaCgoa2V5LCB2YWx1ZSwgcGFyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdmFsdWUuY2FsbChuZXcgRXZlbnQoZXZlbnQpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaGFuZGxlQWZ0ZXIoZXZlbnROYW1lLCBldmVudCk7XG4gICAgfVxuXG4gICAgaGFuZGxlQmVmb3JlKGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVHbG9iYWwodGhpcy5iZWZvcmVMaXN0ZW5lcnMsIGV2ZW50TmFtZSwgZXZlbnQpO1xuICAgIH1cblxuICAgIGhhbmRsZUFmdGVyKGV2ZW50TmFtZSwgZXZlbnQpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVHbG9iYWwodGhpcy5hZnRlckxpc3RlbmVycywgZXZlbnROYW1lLCBldmVudCk7XG4gICAgfVxuXG4gICAgaGFuZGxlR2xvYmFsKGxpc3RlbmVycywgZXZlbnROYW1lLCBldmVudCkge1xuICAgICAgICBpZihsaXN0ZW5lcnMuZXhpc3RzKGV2ZW50TmFtZSkpIHtcbiAgICAgICAgICAgIGxpc3RlbmVycy5nZXQoZXZlbnROYW1lKS5mb3JFYWNoKChrZXksIHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICB2YWx1ZS5jYWxsKG5ldyBFdmVudChldmVudCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBNYXAsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBYbWxFbGVtZW50IH0gZnJvbSBcInhtbHBhcnNlcl92MVwiO1xyXG5pbXBvcnQgeyBFbGVtZW50TWFwcGVyIH0gZnJvbSBcIi4uL2VsZW1lbnQvZWxlbWVudE1hcHBlclwiO1xyXG5pbXBvcnQgeyBCYXNlRWxlbWVudCB9IGZyb20gXCIuLi9lbGVtZW50L2Jhc2VFbGVtZW50XCI7XHJcbmltcG9ydCB7IEV2ZW50UmVnaXN0cnkgfSBmcm9tIFwiLi4vZXZlbnQvZXZlbnRSZWdpc3RyeVwiO1xyXG5cclxuLyoqXHJcbiAqIENvbGxlY3RzIGluZm9ybWF0aW9uIHdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgYW5kIGZpbmRzIHRoZSByb290IGVsZW1lbnQsIGNyZWF0ZXMgbWFwIG9mIGVsZW1lbnRzIFxyXG4gKiBhbmQgcmVnaXN0ZXJzIGV2ZW50cyBpbiB0aGUgZXZlbnRSZWdpc3RyeVxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEVsZW1lbnRSZWdpc3RyYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoZXZlbnRSZWdpc3RyeSwgdW5pcXVlSWRSZWdpc3RyeSwgY29tcG9uZW50SW5kZXgpIHtcclxuICAgICAgICB0aGlzLmNvbXBvbmVudEluZGV4ID0gY29tcG9uZW50SW5kZXg7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7TWFwfSAqL1xyXG4gICAgICAgIHRoaXMudW5pcXVlSWRSZWdpc3RyeSA9IHVuaXF1ZUlkUmVnaXN0cnk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7RXZlbnRSZWdpc3RyeX0gKi9cclxuICAgICAgICB0aGlzLmV2ZW50UmVnaXN0cnkgPSBldmVudFJlZ2lzdHJ5O1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge0Jhc2VFbGVtZW50fSAqL1xyXG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLmVsZW1lbnRNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RWxlbWVudE1hcCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50TWFwO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTGlzdGVucyB0byBlbGVtZW50cyBiZWluZyBjcmVhdGVkLCBhbmQgdGFrZXMgaW5uIHRoZSBjcmVhdGVkIFhtbEVsZW1lbnQgYW5kIGl0cyBwYXJlbnQgWG1sRWxlbWVudFxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge1htbEVsZW1lbnR9IHhtbEVsZW1lbnQgXHJcbiAgICAgKiBAcGFyYW0ge0Jhc2VFbGVtZW50fSBwYXJlbnRXcmFwcGVyIFxyXG4gICAgICovXHJcbiAgICBlbGVtZW50Q3JlYXRlZCAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcikge1xyXG4gICAgICAgIHZhciBlbGVtZW50ID0gRWxlbWVudE1hcHBlci5tYXAoeG1sRWxlbWVudCwgcGFyZW50V3JhcHBlcik7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkVG9FbGVtZW50SWRNYXAoZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy5yZWdpc3RlckVsZW1lbnRFdmVudHMoZWxlbWVudCk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMucm9vdEVsZW1lbnQgPT09IG51bGwgJiYgZWxlbWVudCAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gZWxlbWVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHJlZ2lzdGVyRWxlbWVudEV2ZW50cyhlbGVtZW50KXtcclxuICAgICAgICBpZihlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlRWxlbWVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgZXZlbnRSZWdpc3RyeSA9IHRoaXMuZXZlbnRSZWdpc3RyeTtcclxuICAgICAgICB2YXIgY29tcG9uZW50SW5kZXggPSB0aGlzLmNvbXBvbmVudEluZGV4O1xyXG4gICAgICAgIGVsZW1lbnQuYXR0cmlidXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChhdHRyaWJ1dGVLZXksYXR0cmlidXRlLHBhcmVudCl7XHJcbiAgICAgICAgICAgIGlmKGF0dHJpYnV0ZSAhPT0gbnVsbCAmJiBhdHRyaWJ1dGUgIT09IHVuZGVmaW5lZCAmJiBhdHRyaWJ1dGUudmFsdWUuc3RhcnRzV2l0aChcIi8vZXZlbnQ6XCIpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZXZlbnROYW1lID0gYXR0cmlidXRlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50VHlwZSA9IGF0dHJpYnV0ZS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgZXZlbnRSZWdpc3RyeS5hdHRhY2goZWxlbWVudCxldmVudFR5cGUsZXZlbnROYW1lLGNvbXBvbmVudEluZGV4KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTsgICAgICAgICBcclxuICAgICAgICB9LHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFRvRWxlbWVudElkTWFwKGVsZW1lbnQpIHtcclxuICAgICAgICBpZihlbGVtZW50ID09PSBudWxsIHx8IGVsZW1lbnQgPT09IHVuZGVmaW5lZCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBCYXNlRWxlbWVudCkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaWQgPSBudWxsO1xyXG4gICAgICAgIGlmKGVsZW1lbnQuY29udGFpbnNBdHRyaWJ1dGUoXCJpZFwiKSkge1xyXG4gICAgICAgICAgICBpZCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlVmFsdWUoXCJpZFwiKTtcclxuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVWYWx1ZShcImlkXCIsdGhpcy51bmlxdWVJZFJlZ2lzdHJ5LmlkQXR0cmlidXRlV2l0aFN1ZmZpeChpZCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoaWQgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50TWFwLnNldChpZCxlbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tIFwiLi9jb21wb25lbnRcIjtcclxuaW1wb3J0IHsgVW5pcXVlSWRSZWdpc3RyeSB9IGZyb20gXCIuL3VuaXF1ZUlkUmVnaXN0cnlcIjtcclxuaW1wb3J0IHsgRWxlbWVudFJlZ2lzdHJhdG9yIH0gZnJvbSBcIi4vZWxlbWVudFJlZ2lzdHJhdG9yXCI7XHJcbmltcG9ydCB7IEV2ZW50UmVnaXN0cnkgfSBmcm9tIFwiLi4vZXZlbnQvZXZlbnRSZWdpc3RyeVwiO1xyXG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4uL3RlbXBsYXRlL3RlbXBsYXRlUmVnaXN0cnlcIjtcclxuaW1wb3J0IHsgRG9tVHJlZSB9IGZyb20gXCJ4bWxwYXJzZXJfdjFcIjtcclxuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcbmltcG9ydCB7IFN0eWxlc1JlZ2lzdHJ5IH0gZnJvbSBcIi4uL3N0eWxlcy9zdHlsZXNSZWdpc3RyeVwiO1xyXG5pbXBvcnQgeyBDYW52YXNTdHlsZXMgfSBmcm9tIFwiLi4vY2FudmFzL2NhbnZhc1N0eWxlc1wiO1xyXG5pbXBvcnQgeyBJbmplY3Rpb25Qb2ludCB9IGZyb20gXCJtaW5kaV92MVwiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkNvbXBvbmVudEZhY3RvcnlcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RmFjdG9yeSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7RXZlbnRSZWdpc3RyeX0gKi9cclxuICAgICAgICB0aGlzLmV2ZW50UmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShFdmVudFJlZ2lzdHJ5KTtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHlsZXNSZWdpc3RyeX0gKi9cclxuICAgICAgICB0aGlzLnN0eWxlc1JlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoU3R5bGVzUmVnaXN0cnkpO1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge1RlbXBsYXRlUmVnaXN0cnl9ICovXHJcbiAgICAgICAgdGhpcy50ZW1wbGF0ZVJlZ2lzdHJ5ID0gSW5qZWN0aW9uUG9pbnQuaW5zdGFuY2UoVGVtcGxhdGVSZWdpc3RyeSk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7VW5pcXVlSWRSZWdpc3RyeX0gKi9cclxuICAgICAgICB0aGlzLnVuaXF1ZUlkUmVnaXN0cnkgPSBJbmplY3Rpb25Qb2ludC5pbnN0YW5jZShVbmlxdWVJZFJlZ2lzdHJ5KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgcmVwcmVzZW50cyB0aGUgdGVtcGxhdGUgYW5kIHRoZSBzdHlsZXMgbmFtZSBpZiB0aGUgc3R5bGUgZm9yIHRoYXQgbmFtZSBpcyBhdmFpbGFibGVcclxuICAgICAqL1xyXG4gICAgY3JlYXRlKG5hbWUpe1xyXG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9IHRoaXMudGVtcGxhdGVSZWdpc3RyeS5nZXQobmFtZSk7XHJcbiAgICAgICAgaWYoIXRlbXBsYXRlKSB7XHJcbiAgICAgICAgICAgIExPRy5lcnJvcih0aGlzLnRlbXBsYXRlUmVnaXN0cnkpO1xyXG4gICAgICAgICAgICB0aHJvdyBcIk5vIHRlbXBsYXRlIHdhcyBmb3VuZCB3aXRoIG5hbWUgXCIgKyBuYW1lO1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGVsZW1lbnRSZWdpc3RyYXRvciA9IG5ldyBFbGVtZW50UmVnaXN0cmF0b3IodGhpcy5ldmVudFJlZ2lzdHJ5LCB0aGlzLnVuaXF1ZUlkUmVnaXN0cnksIGNvbXBvbmVudENvdW50ZXIrKyk7XHJcbiAgICAgICAgbmV3IERvbVRyZWUodGVtcGxhdGUuZ2V0VGVtcGxhdGVTb3VyY2UoKSxlbGVtZW50UmVnaXN0cmF0b3IpLmxvYWQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5tb3VudFN0eWxlcyhuYW1lKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBDb21wb25lbnQoZWxlbWVudFJlZ2lzdHJhdG9yLmNvbXBvbmVudEluZGV4LCBlbGVtZW50UmVnaXN0cmF0b3Iucm9vdEVsZW1lbnQsIGVsZW1lbnRSZWdpc3RyYXRvci5nZXRFbGVtZW50TWFwKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIG1vdW50U3R5bGVzKG5hbWUpIHtcclxuICAgICAgICBpZih0aGlzLnN0eWxlc1JlZ2lzdHJ5LmNvbnRhaW5zKG5hbWUpKSB7XHJcbiAgICAgICAgICAgIENhbnZhc1N0eWxlcy5zZXRTdHlsZShuYW1lLCB0aGlzLnN0eWxlc1JlZ2lzdHJ5LmdldChuYW1lKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufVxyXG5cclxudmFyIGNvbXBvbmVudENvdW50ZXIgPSAwOyIsImltcG9ydCB7IFByb3BlcnR5QWNjZXNzb3IsIExpc3QsIExvZ2dlciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xuaW1wb3J0IHsgQWJzdHJhY3RJbnB1dEVsZW1lbnQgfSBmcm9tIFwiLi4vZWxlbWVudC9hYnN0cmFjdElucHV0RWxlbWVudFwiO1xuXG5jb25zdCBMT0cgPSBuZXcgTG9nZ2VyKFwiSW5wdXRFbGVtZW50RGF0YUJpbmRpbmdcIik7XG5cbmV4cG9ydCBjbGFzcyBJbnB1dEVsZW1lbnREYXRhQmluZGluZyB7XG5cbiAgICBjb25zdHJ1Y3Rvcihtb2RlbCwgdmFsaWRhdG9yKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy52YWxpZGF0b3IgPSB2YWxpZGF0b3I7XG4gICAgICAgIHRoaXMucHVsbGVycyA9IG5ldyBMaXN0KCk7XG4gICAgICAgIHRoaXMucHVzaGVycyA9IG5ldyBMaXN0KCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGxpbmsobW9kZWwsIHZhbGlkYXRvcikge1xuICAgICAgICByZXR1cm4gbmV3IElucHV0RWxlbWVudERhdGFCaW5kaW5nKG1vZGVsLCB2YWxpZGF0b3IpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFxuICAgICAqIEBwYXJhbSB7QWJzdHJhY3RJbnB1dEVsZW1lbnR9IGZpZWxkIFxuICAgICAqL1xuICAgIGFuZChmaWVsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy50byhmaWVsZCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdElucHV0RWxlbWVudH0gZmllbGQgXG4gICAgICovXG4gICAgdG8oZmllbGQpIHtcbiAgICAgICAgY29uc3QgcHVsbGVyID0gKCkgPT4ge1xuICAgICAgICAgICAgbGV0IG1vZGVsVmFsdWUgPSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIGZpZWxkLm5hbWUpO1xuICAgICAgICAgICAgaWYgKG1vZGVsVmFsdWUgIT09IGZpZWxkLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgUHJvcGVydHlBY2Nlc3Nvci5zZXRWYWx1ZSh0aGlzLm1vZGVsLCBmaWVsZC5uYW1lLCBmaWVsZC52YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlKGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZmllbGQuYXR0YWNoRXZlbnQoXCJvbmNoYW5nZVwiLCBwdWxsZXIpO1xuICAgICAgICBmaWVsZC5hdHRhY2hFdmVudChcIm9ua2V5dXBcIiwgcHVsbGVyKTtcbiAgICAgICAgcHVsbGVyLmNhbGwoKTtcblxuICAgICAgICBjb25zdCBwdXNoZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICB2YXIgbW9kZWxWYWx1ZSA9IFByb3BlcnR5QWNjZXNzb3IuZ2V0VmFsdWUodGhpcy5tb2RlbCwgZmllbGQubmFtZSk7XG4gICAgICAgICAgICBpZiAobW9kZWxWYWx1ZSAhPT0gZmllbGQudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBmaWVsZC52YWx1ZSA9IG1vZGVsVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy52YWxpZGF0b3IgJiYgdGhpcy52YWxpZGF0b3IudmFsaWRhdGVTaWxlbnQgJiYgZmllbGQudmFsdWUpe1xuICAgICAgICAgICAgICAgIHRoaXMudmFsaWRhdG9yLnZhbGlkYXRlU2lsZW50KGZpZWxkLnZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uTmFtZSA9IFwiX19jaGFuZ2VkX1wiICsgZmllbGQubmFtZS5yZXBsYWNlKFwiLlwiLFwiX1wiKTtcbiAgICAgICAgaWYgKCF0aGlzLm1vZGVsW2NoYW5nZWRGdW5jdGlvbk5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLm1vZGVsW2NoYW5nZWRGdW5jdGlvbk5hbWVdID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMucHVzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wdWxsZXJzLmFkZChwdWxsZXIpO1xuICAgICAgICB0aGlzLnB1c2hlcnMuYWRkKHB1c2hlcik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcHVsbCgpIHtcbiAgICAgICAgdGhpcy5wdWxsZXJzLmZvckVhY2goKHZhbHVlLCBwYXJlbnQpID0+IHtcbiAgICAgICAgICAgIHZhbHVlLmNhbGwocGFyZW50KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICBwdXNoKCkge1xuICAgICAgICB0aGlzLnB1c2hlcnMuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xuICAgICAgICAgICAgdmFsdWUuY2FsbChwYXJlbnQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cbn1cbiIsImV4cG9ydCBjbGFzcyBQcm94eU9iamVjdEZhY3Rvcnkge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhIHByb3h5IGZvciBhbiBvYmplY3Qgd2hpY2ggYWxsb3dzIGRhdGFiaW5kaW5nIGZyb20gdGhlIG9iamVjdCB0byB0aGUgZm9ybSBlbGVtZW50XHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgXHJcbiAgICAgKi9cclxuICAgIHN0YXRpYyBjcmVhdGVQcm94eU9iamVjdChvYmplY3QpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb3h5KG9iamVjdCwge1xyXG4gICAgICAgICAgICBzZXQ6ICh0YXJnZXQsIHByb3AsIHZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3VjY2VzcyA9ICh0YXJnZXRbcHJvcF0gPSB2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNoYW5nZWRGdW5jdGlvbk5hbWUgPSBcIl9fY2hhbmdlZF9cIiArIHByb3A7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2hhbmdlZEZ1bmN0aW9uID0gdGFyZ2V0W2NoYW5nZWRGdW5jdGlvbk5hbWVdO1xyXG4gICAgICAgICAgICAgICAgaWYoY2hhbmdlZEZ1bmN0aW9uICYmIHR5cGVvZiBjaGFuZ2VkRnVuY3Rpb24gPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBib3VuZENoYW5nZWRGdW5jdGlvbiA9IGNoYW5nZWRGdW5jdGlvbi5iaW5kKHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYm91bmRDaGFuZ2VkRnVuY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZXNzID09PSB2YWx1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRXZlbnRGaWx0ZXJlZE9iamVjdEZ1bmN0aW9uIGV4dGVuZHMgT2JqZWN0RnVuY3Rpb24ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29udHJ1Y3RvclxyXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gb2JqZWN0RnVuY3Rpb24gXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSB0aGVGaWx0ZXIgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKG9iamVjdEZ1bmN0aW9uLCBmaWx0ZXIpe1xyXG4gICAgICAgIHRoaXMub2JqZWN0RnVuY3Rpb24gPSBvYmplY3RGdW5jdGlvbjtcclxuICAgICAgICB0aGlzLmZpbHRlciA9IGZpbHRlcjtcclxuICAgIH1cclxuXHJcbiAgICBjYWxsKHBhcmFtcyl7XHJcbiAgICAgICAgaWYodGhpcy5maWx0ZXIgJiYgdGhpcy5maWx0ZXIuY2FsbCh0aGlzLHBhcmFtcykpIHtcclxuICAgICAgICAgICAgdGhpcy5vYmplY3RGdW5jdGlvbi5jYWxsKHBhcmFtcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IFVybCB9IGZyb20gXCIuLi91dGlsL3VybFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEhpc3Rvcnkge1xyXG5cclxuICAgIHN0YXRpYyBwdXNoVXJsKHVybCx0aXRsZSxzdGF0ZU9iamVjdCkge1xyXG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZShzdGF0ZU9iamVjdCwgdGl0bGUsIHVybC50b1N0cmluZygpKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgZ2V0VXJsKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgVXJsKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgbG9hZFVybCh1cmwpIHtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB1cmwudG9TdHJpbmcoKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7SGlzdG9yeX0gZnJvbSBcIi4uL25hdmlnYXRpb24vaGlzdG9yeS5qc1wiO1xyXG5pbXBvcnQge01hcH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgU3RhdGUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICB0aGlzLnN0YXRlTGlzdGVuZXJNYXAgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVjb3JkU3RhdGUobmV3UGF0aCkge1xyXG4gICAgICAgIHZhciB1cmwgPSBIaXN0b3J5LmdldFVybCgpO1xyXG4gICAgICAgIC8vIFB1c2ggY3VycmVudCB1cmwgdG8gYnJvd3NlciBoaXN0b3J5XHJcbiAgICAgICAgaWYoISh1cmwuZ2V0UGF0aCgwKSA9PT0gbmV3UGF0aCkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRVcmwodXJsKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIGEgbmV3IHN0YXRlXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB1cmwgXHJcbiAgICAgKi9cclxuICAgIHNldFVybCh1cmwpIHtcclxuICAgICAgICBIaXN0b3J5LnB1c2hVcmwodXJsLFwiXCIse30pO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgTG9nZ2VyLCBMaXN0IH0gZnJvbSBcImNvcmV1dGlsX3YxXCJcclxuaW1wb3J0IHsgU2luZ2xldG9uQ29uZmlnLCBQcm90b3R5cGVDb25maWcgfSBmcm9tIFwibWluZGlfdjFcIlxyXG5pbXBvcnQgeyBUZW1wbGF0ZVJlZ2lzdHJ5IH0gZnJvbSBcIi4vdGVtcGxhdGUvdGVtcGxhdGVSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBFdmVudFJlZ2lzdHJ5IH0gZnJvbSBcIi4vZXZlbnQvZXZlbnRSZWdpc3RyeS5qc1wiO1xyXG5pbXBvcnQgeyBVbmlxdWVJZFJlZ2lzdHJ5IH0gZnJvbSBcIi4vY29tcG9uZW50L3VuaXF1ZUlkUmVnaXN0cnkuanNcIjtcclxuaW1wb3J0IHsgQ29tcG9uZW50RmFjdG9yeSB9IGZyb20gXCIuL2NvbXBvbmVudC9jb21wb25lbnRGYWN0b3J5LmpzXCI7XHJcbmltcG9ydCB7IFN0YXRlIH0gZnJvbSBcIi4vbmF2aWdhdGlvbi9zdGF0ZS5qc1wiO1xyXG5pbXBvcnQgeyBTdHlsZXNSZWdpc3RyeSB9IGZyb20gXCIuL3N0eWxlcy9zdHlsZXNSZWdpc3RyeS5qc1wiO1xyXG5cclxuY29uc3QgTE9HID0gbmV3IExvZ2dlcihcIkp1c3RyaWdodENvbmZpZ1wiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBKdXN0cmlnaHRDb25maWcge1xyXG5cclxuICAgIHN0YXRpYyBnZXRJbnN0YW5jZSgpIHtcclxuICAgICAgICByZXR1cm4ganVzdHJpZ2h0Q29uZmlnO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMudHlwZUNvbmZpZ0xpc3QgPSBuZXcgTGlzdChbXHJcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKFRlbXBsYXRlUmVnaXN0cnkpLFxyXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChTdHlsZXNSZWdpc3RyeSksXHJcbiAgICAgICAgICAgIFNpbmdsZXRvbkNvbmZpZy51bm5hbWVkKFVuaXF1ZUlkUmVnaXN0cnkpLFxyXG4gICAgICAgICAgICBTaW5nbGV0b25Db25maWcudW5uYW1lZChDb21wb25lbnRGYWN0b3J5KSxcclxuICAgICAgICAgICAgU2luZ2xldG9uQ29uZmlnLnVubmFtZWQoU3RhdGUpLFxyXG4gICAgICAgICAgICBQcm90b3R5cGVDb25maWcudW5uYW1lZChFdmVudFJlZ2lzdHJ5KV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICBnZXRUeXBlQ29uZmlnTGlzdCgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy50eXBlQ29uZmlnTGlzdDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmNvbnN0IGp1c3RyaWdodENvbmZpZyA9IG5ldyBKdXN0cmlnaHRDb25maWcoKTsiLCJpbXBvcnQgeyBDb250YWluZXJCcmlkZ2UgfSBmcm9tIFwiLi4vYnJpZGdlL2NvbnRhaW5lckJyaWRnZS5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uU3RvcmFnZSB7XHJcbiAgICBcclxuICAgIHN0YXRpYyBzZXRMb2NhbEF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgQ29udGFpbmVyQnJpZGdlLnNldExvY2FsQXR0cmlidXRlKGtleSx2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGdldExvY2FsQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuZ2V0TG9jYWxBdHRyaWJ1dGUoa2V5KTtcclxuICAgIH1cclxuXHJcbiAgICBzdGF0aWMgaGFzTG9jYWxBdHRyaWJ1dGUoa2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIENvbnRhaW5lckJyaWRnZS5oYXNMb2NhbEF0dHJpYnV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVMb2NhbEF0dHJpYnV0ZShrZXkpIHtcclxuICAgICAgICByZXR1cm4gQ29udGFpbmVyQnJpZGdlLnJlbW92ZUxvY2FsQXR0cmlidXRlKGtleSk7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBDb250YWluZXJCcmlkZ2UgfSBmcm9tIFwiLi4vYnJpZGdlL2NvbnRhaW5lckJyaWRnZS5qc1wiXHJcblxyXG5leHBvcnQgY2xhc3MgU2Vzc2lvblN0b3JhZ2Uge1xyXG5cclxuICAgIHN0YXRpYyBzZXRTZXNzaW9uQXR0cmlidXRlKGtleSwgdmFsdWUpIHtcclxuICAgICAgICBDb250YWluZXJCcmlkZ2Uuc2V0U2Vzc2lvbkF0dHJpYnV0ZShrZXksdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBoYXNTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuaGFzU2Vzc2lvbkF0dHJpYnV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBnZXRTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UuZ2V0U2Vzc2lvbkF0dHJpYnV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyByZW1vdmVTZXNzaW9uQXR0cmlidXRlKGtleSkge1xyXG4gICAgICAgIHJldHVybiBDb250YWluZXJCcmlkZ2UucmVtb3ZlU2Vzc2lvbkF0dHJpYnV0ZShrZXkpO1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSHR0cFJlc3BvbnNlSGFuZGxlciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjb2RlIFxyXG4gICAgICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gb2JqZWN0RnVuY3Rpb24gXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtYXBwZXJGdW5jdGlvbiBcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY29kZSwgb2JqZWN0RnVuY3Rpb24sIG1hcHBlckZ1bmN0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5jb2RlID0gY29kZTtcclxuICAgICAgICB0aGlzLm9iamVjdEZ1bmN0aW9uID0gb2JqZWN0RnVuY3Rpb247XHJcbiAgICAgICAgdGhpcy5tYXBwZXJGdW5jdGlvbiA9IG1hcHBlckZ1bmN0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybnMge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgZ2V0Q29kZSgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb2RlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybnMge09iamVjdEZ1bmN0aW9ufVxyXG4gICAgICovXHJcbiAgICBnZXRPYmplY3RGdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RGdW5jdGlvblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHJldHVybnMge2NsYXNzfVxyXG4gICAgICovXHJcbiAgICBnZXRNYXBwZXJGdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5tYXBwZXJGdW5jdGlvbjtcclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBNYXAsIE9iamVjdEZ1bmN0aW9uLCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuaW1wb3J0IHsgSHR0cFJlc3BvbnNlSGFuZGxlciB9IGZyb20gXCIuL2h0dHBSZXNwb25zZUhhbmRsZXJcIjtcclxuaW1wb3J0IHsgQ2xpZW50IH0gZnJvbSBcIi4uL2NsaWVudC9jbGllbnQuanNcIjtcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJIdHRwQ2FsbEJ1aWxkZXJcIik7XHJcblxyXG5leHBvcnQgY2xhc3MgSHR0cENhbGxCdWlsZGVyIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHVybCBcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbWV0ZXIgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0cnVjdG9yKHVybCwgcGFyYW10ZXIpIHtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgdGhpcy51cmwgPSB1cmw7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7T2JqZWN0fSAqL1xyXG4gICAgICAgIHRoaXMucGFyYW10ZXIgPSBwYXJhbXRlcjtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtNYXB9ICovXHJcbiAgICAgICAgdGhpcy5odHRwQ2FsbGJhY2tNYXAgPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7T2JqZWN0RnVuY3Rpb259ICovXHJcbiAgICAgICAgdGhpcy5lcnJvckNhbGxiYWNrID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtudW1iZXJ9ICovXHJcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlID0gNDAwMDtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtudW1iZXJ9ICovXHJcbiAgICAgICAgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSA9IDQwMDA7XHJcblxyXG4gICAgICAgIC8qKiBAdHlwZSB7ZnVuY3Rpb259ICovXHJcbiAgICAgICAgdGhpcy5lcnJvck1hcHBlckZ1bmN0aW9uID0gbnVsbDtcclxuXHJcbiAgICAgICAgLyoqIEB0eXBlIHtTdHJpbmd9ICovXHJcbiAgICAgICAgdGhpcy5hdXRob3JpemF0aW9uID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtDbGllbnR9IGNsaWVudCBcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1ldGVyIFxyXG4gICAgICogQHJldHVybnMge0h0dHBDYWxsQnVpbGRlcn1cclxuICAgICAqL1xyXG4gICAgc3RhdGljIG5ld0luc3RhbmNlKGNsaWVudCwgdXJsLCBwYXJhbWV0ZXIpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEh0dHBDYWxsQnVpbGRlcihjbGllbnQsIHVybCwgcGFyYW1ldGVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGNvZGUgXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0IFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBtYXBwZXJGdW5jdGlvbiBtYXBwZXIgZnVuY3Rpb24gdG8gcGFzcyB0aGUgcmVzdWx0IG9iamVjdCB0b1xyXG4gICAgICovXHJcbiAgICByZXNwb25zZU1hcHBpbmcoY29kZSwgb2JqZWN0LCBjYWxsYmFjaywgbWFwcGVyRnVuY3Rpb24pIHtcclxuICAgICAgICB0aGlzLmh0dHBDYWxsYmFja01hcC5zZXQoY29kZSwgbmV3IEh0dHBSZXNwb25zZUhhbmRsZXIoY29kZSwgbmV3IE9iamVjdEZ1bmN0aW9uKG9iamVjdCwgY2FsbGJhY2spLCBtYXBwZXJGdW5jdGlvbikpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0IFxyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgXHJcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBlcnJvck1hcHBlckZ1bmN0aW9uIG1hcHBlciBmdW5jdGlvbiB0byBwYXNzIHRoZSByZXN1bHQgb2JqZWN0IHRvXHJcbiAgICAgKi9cclxuICAgIGVycm9yTWFwcGluZyhvYmplY3QsIGNhbGxiYWNrLCBlcnJvck1hcHBlckZ1bmN0aW9uID0gbnVsbCkge1xyXG4gICAgICAgIGlmKG9iamVjdCAmJiBjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAoZXJyb3JNYXBwZXJGdW5jdGlvbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lcnJvck1hcHBlckZ1bmN0aW9uID0gZXJyb3JNYXBwZXJGdW5jdGlvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmVycm9yQ2FsbGJhY2sgPSBuZXcgT2JqZWN0RnVuY3Rpb24ob2JqZWN0LCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gYXV0aG9yaXphdGlvbiBcclxuICAgICAqL1xyXG4gICAgYXV0aG9yaXphdGlvbkhlYWRlcihhdXRob3JpemF0aW9uKSB7XHJcbiAgICAgICAgdGhpcy5hdXRob3JpemF0aW9uID0gXCJCZWFyZXIgXCIgKyBhdXRob3JpemF0aW9uO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbm5lY3Rpb25UaW1lb3V0KGNvbm5lY3Rpb25UaW1lb3V0VmFsdWUpIHtcclxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUgPSBjb25uZWN0aW9uVGltZW91dFZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3BvbnNlVGltZW91dChyZXNwb25zZVRpbWVvdXRWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUgPSByZXNwb25zZVRpbWVvdXRWYWx1ZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQoKSB7XHJcbiAgICAgICAgQ2xpZW50LmdldCh0aGlzLnVybCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlKS50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXNwb25zZShyZXNwb25zZSk7XHJcbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0Vycm9yKGVycm9yKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwb3N0KCkge1xyXG4gICAgICAgIENsaWVudC5wb3N0KHRoaXMudXJsLCB0aGlzLnBhcmFtdGVyLCB0aGlzLmNvbm5lY3Rpb25UaW1lb3V0VmFsdWUsIHRoaXMucmVzcG9uc2VUaW1lb3V0VmFsdWUsIHRoaXMuYXV0aG9yaXphdGlvbikudGhlbigocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xyXG4gICAgICAgIH0sIChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NFcnJvcihlcnJvcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHV0KCkge1xyXG4gICAgICAgIENsaWVudC5wdXQodGhpcy51cmwsIHRoaXMucGFyYW10ZXIsIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSwgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSwgdGhpcy5hdXRob3JpemF0aW9uKS50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXNwb25zZShyZXNwb25zZSk7XHJcbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0Vycm9yKGVycm9yKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwYXRjaCgpIHtcclxuICAgICAgICBDbGllbnQucGF0Y2godGhpcy51cmwsIHRoaXMucGFyYW10ZXIsIHRoaXMuY29ubmVjdGlvblRpbWVvdXRWYWx1ZSwgdGhpcy5yZXNwb25zZVRpbWVvdXRWYWx1ZSwgdGhpcy5hdXRob3JpemF0aW9uKS50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXNwb25zZShyZXNwb25zZSk7XHJcbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0Vycm9yKGVycm9yKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBkZWxldGUoKSB7XHJcbiAgICAgICAgQ2xpZW50LmRlbGV0ZSh0aGlzLnVybCwgdGhpcy5jb25uZWN0aW9uVGltZW91dFZhbHVlLCB0aGlzLnJlc3BvbnNlVGltZW91dFZhbHVlKS50aGVuKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NSZXNwb25zZShyZXNwb25zZSk7XHJcbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzc0Vycm9yKGVycm9yKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzRXJyb3IoZXJyb3IpIHtcclxuICAgICAgICBMT0cuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIGlmKHRoaXMuZXJyb3JDYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZih0aGlzLmVycm9yTWFwcGVyRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgIGVycm9yID0gdGhpcy5lcnJvck1hcHBlckZ1bmN0aW9uLmNhbGwodGhpcywgZXJyb3IpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZXJyb3JDYWxsYmFjay5jYWxsKGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBcclxuICAgICAqIEBwYXJhbSB7UmVzcG9uc2V9IHJlc3BvbnNlIFxyXG4gICAgICovXHJcbiAgICBwcm9jZXNzUmVzcG9uc2UocmVzcG9uc2UpIHtcclxuICAgICAgICAvKiogQHR5cGUge0h0dHBSZXNwb25zZUhhbmRsZXJ9ICovXHJcbiAgICAgICAgdmFyIHJlc3BvbnNlSGFuZGxlciA9IHRoaXMuaHR0cENhbGxiYWNrTWFwLmdldChyZXNwb25zZS5zdGF0dXMpO1xyXG4gICAgICAgIGlmKHJlc3BvbnNlSGFuZGxlcikge1xyXG4gICAgICAgICAgICBpZihyZXNwb25zZUhhbmRsZXIuZ2V0TWFwcGVyRnVuY3Rpb24oKSkge1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuanNvbigpLnRoZW4oXHJcbiAgICAgICAgICAgICAgICAgICAgKG9iamVjdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWFwcGVyRnVuY3Rpb24gPSByZXNwb25zZUhhbmRsZXIuZ2V0TWFwcGVyRnVuY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYobWFwcGVyRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlSGFuZGxlci5nZXRPYmplY3RGdW5jdGlvbigpLmNhbGwobWFwcGVyRnVuY3Rpb24ob2JqZWN0KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZUhhbmRsZXIuZ2V0T2JqZWN0RnVuY3Rpb24oKS5jYWxsKG9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIChmYWlsUmVhc29uKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXNwb25zZUhhbmRsZXIuZ2V0T2JqZWN0RnVuY3Rpb24oKS5jYWxsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBMaXN0LCBMb2dnZXIgfSBmcm9tIFwiY29yZXV0aWxfdjFcIjtcclxuXHJcbmNvbnN0IExPRyA9IG5ldyBMb2dnZXIoXCJBYnN0cmFjdFZhbGlkYXRvclwiKTtcclxuXHJcbmV4cG9ydCBjbGFzcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzQ3VycmVudGx5VmFsaWRcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IoY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgZW5hYmxlZCA9IHRydWUpIHtcclxuICAgICAgICB0aGlzLnZhbGlkTGlzdGVuZXJMaXN0ID0gbmV3IExpc3QoKTtcclxuICAgICAgICB0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QgPSBuZXcgTGlzdCgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBjdXJyZW50bHlWYWxpZDtcclxuICAgICAgICB0aGlzLmVuYWJsZWQgPSBlbmFibGVkO1xyXG4gICAgfVxyXG5cclxuICAgIGVuYWJsZSgpIHtcclxuICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xyXG4gICAgICAgIGlmICh0aGlzLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbGlkKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5pbnZhbGlkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRpc2FibGUoKSB7XHJcbiAgICAgICAgbGV0IHdhc1ZhbGlkID0gdGhpcy5jdXJyZW50bHlWYWxpZDtcclxuICAgICAgICAvLyBGYWtlIHZhbGlkXHJcbiAgICAgICAgdGhpcy52YWxpZCgpO1xyXG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSB3YXNWYWxpZDtcclxuICAgIH1cclxuXHJcbiAgICBpc1ZhbGlkKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50bHlWYWxpZDtcclxuICAgIH1cclxuXHJcblx0dmFsaWQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmN1cnJlbnRseVZhbGlkID0gdHJ1ZTtcclxuICAgICAgICBpZighdGhpcy52YWxpZExpc3RlbmVyTGlzdCkge1xyXG4gICAgICAgICAgICBMT0cud2FybihcIk5vIHZhbGlkYXRpb24gbGlzdGVuZXJzXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudmFsaWRMaXN0ZW5lckxpc3QuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICB2YWx1ZS5jYWxsKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cdH1cclxuXHJcblx0aW52YWxpZCgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBmYWxzZTtcclxuICAgICAgICBpZighdGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0KSB7XHJcbiAgICAgICAgICAgIExPRy53YXJuKFwiTm8gaW52YWxpZGF0aW9uIGxpc3RlbmVyc1wiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmludmFsaWRMaXN0ZW5lckxpc3QuZm9yRWFjaCgodmFsdWUsIHBhcmVudCkgPT4ge1xyXG4gICAgICAgICAgICB2YWx1ZS5jYWxsKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sIHRoaXMpO1xyXG5cdH1cclxuXHJcblx0dmFsaWRTaWxlbnQoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50bHlWYWxpZCA9IHRydWU7XHJcblx0fVxyXG5cclxuXHRpbnZhbGlkU2lsZW50KCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudGx5VmFsaWQgPSBmYWxzZTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFxyXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IHZhbGlkTGlzdGVuZXIgXHJcblx0ICovXHJcblx0d2l0aFZhbGlkTGlzdGVuZXIodmFsaWRMaXN0ZW5lcikge1xyXG5cdFx0dGhpcy52YWxpZExpc3RlbmVyTGlzdC5hZGQodmFsaWRMaXN0ZW5lcik7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIFxyXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGludmFsaWRMaXN0ZW5lciBcclxuXHQgKi9cclxuXHR3aXRoSW52YWxpZExpc3RlbmVyKGludmFsaWRMaXN0ZW5lcikge1xyXG5cdFx0dGhpcy5pbnZhbGlkTGlzdGVuZXJMaXN0LmFkZChpbnZhbGlkTGlzdGVuZXIpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBMaXN0LCBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3RWYWxpZGF0b3IuanMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEFuZFZhbGlkYXRvclNldCBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihpc1ZhbGlkRnJvbVN0YXJ0ID0gZmFsc2UpIHtcclxuICAgICAgICBzdXBlcihpc1ZhbGlkRnJvbVN0YXJ0KTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QgPSBuZXcgTGlzdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtBYnN0cmFjdFZhbGlkYXRvcn0gdmFsaWRhdG9yXHJcbiAgICAgKi9cclxuICAgIHdpdGhWYWxpZGF0b3IodmFsaWRhdG9yKSB7XHJcbiAgICAgICAgdmFsaWRhdG9yLndpdGhWYWxpZExpc3RlbmVyKG5ldyBPYmplY3RGdW5jdGlvbih0aGlzLCB0aGlzLm9uZVZhbGlkKSk7XHJcbiAgICAgICAgdmFsaWRhdG9yLndpdGhJbnZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lSW52YWxpZCkpO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5hZGQodmFsaWRhdG9yKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgdmFsaWRcclxuICAgICAqL1xyXG4gICAgb25lVmFsaWQoKSB7XHJcbiAgICAgICAgbGV0IGZvdW5kSW52YWxpZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdC5mb3JFYWNoKCh2YWx1ZSxwYXJlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYoIXZhbHVlLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRJbnZhbGlkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICBpZighZm91bmRJbnZhbGlkKSB7XHJcbiAgICAgICAgICAgIHN1cGVyLnZhbGlkKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc3VwZXIuaW52YWxpZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE9uZSB2YWxpZGF0b3Igc2FpZCBpdCB3YXMgaW52YWxpZFxyXG4gICAgICovXHJcbiAgICBvbmVJbnZhbGlkKCkge1xyXG4gICAgICAgIHN1cGVyLmludmFsaWQoKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEFic3RyYWN0VmFsaWRhdG9yIH0gZnJvbSBcIi4vYWJzdHJhY3RWYWxpZGF0b3IuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZWdleFZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCByZWdleCA9IFwiKC4qKVwiKSB7XHJcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcclxuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xyXG4gICAgICAgIHRoaXMucmVnZXggPSByZWdleDtcclxuICAgIH1cclxuXHJcblx0dmFsaWRhdGUodmFsdWUpe1xyXG5cdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS5tYXRjaCh0aGlzLnJlZ2V4KSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYoIXZhbHVlICYmICF0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHRcdHRoaXMudmFsaWQoKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmludmFsaWQoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS5tYXRjaCh0aGlzLnJlZ2V4KSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYoIXZhbHVlICYmICF0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHRcdHRoaXMudmFsaWRTaWxlbnQoKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xyXG5cclxuY29uc3QgRU1BSUxfRk9STUFUID0gL15cXHcrKFtcXC4tXT9cXHcrKSpAXFx3KyhbXFwuLV0/XFx3KykqKFxcLlxcd3syLDN9KSskLztcclxuXHJcbmV4cG9ydCBjbGFzcyBFbWFpbFZhbGlkYXRvciBleHRlbmRzIFJlZ2V4VmFsaWRhdG9yIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlKSB7XHJcbiAgICAgICAgc3VwZXIobWFuZGF0b3J5LCBpc2N1cnJlbnRseVZhbGlkLCBFTUFJTF9GT1JNQVQpO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gXCIuL2Fic3RyYWN0VmFsaWRhdG9yLmpzXCI7XHJcbmltcG9ydCB7IE9iamVjdEZ1bmN0aW9uIH0gZnJvbSBcImNvcmV1dGlsX3YxXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRXF1YWxzRnVuY3Rpb25SZXN1bHRWYWxpZGF0b3IgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIFxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gbWFuZGF0b3J5IFxyXG5cdCAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNjdXJyZW50bHlWYWxpZCBcclxuXHQgKiBAcGFyYW0ge09iamVjdEZ1bmN0aW9ufSBjb21wYXJlZFZhbHVlRnVuY3Rpb24gXHJcblx0ICovXHJcbiAgICBjb25zdHJ1Y3RvcihtYW5kYXRvcnkgPSBmYWxzZSwgaXNjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBjb21wYXJlZFZhbHVlRnVuY3Rpb24gPSBudWxsKSB7XHJcblx0XHRzdXBlcihpc2N1cnJlbnRseVZhbGlkKTtcclxuXHJcblx0XHQvKiogQHR5cGUge2Jvb2xlYW59ICovXHJcblx0XHR0aGlzLm1hbmRhdG9yeSA9IG1hbmRhdG9yeTtcclxuXHJcblx0XHQvKiogQHR5cGUge09iamVjdEZ1bmN0aW9ufSAqL1xyXG5cdFx0dGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24gPSBjb21wYXJlZFZhbHVlRnVuY3Rpb247XHJcblx0fVxyXG5cclxuXHR2YWxpZGF0ZSh2YWx1ZSl7XHJcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSB0aGlzLmNvbXBhcmVkVmFsdWVGdW5jdGlvbi5jYWxsKCkpe1xyXG5cdCAgICBcdHRoaXMudmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gdGhpcy5jb21wYXJlZFZhbHVlRnVuY3Rpb24uY2FsbCgpKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xyXG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiwgUHJvcGVydHlBY2Nlc3NvciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEVxdWFsc1Byb3BlcnR5VmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG5cclxuXHQvKipcclxuXHQgKiBcclxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmRhdG9yeSBcclxuXHQgKiBAcGFyYW0ge2Jvb2xlYW59IGlzY3VycmVudGx5VmFsaWQgXHJcblx0ICogQHBhcmFtIHtPYmplY3RGdW5jdGlvbn0gY29tcGFyZWRWYWx1ZUZ1bmN0aW9uIFxyXG5cdCAqL1xyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSwgbW9kZWwgPSBudWxsLCBhdHRyaWJ1dGVOYW1lID0gbnVsbCkge1xyXG5cdFx0c3VwZXIoaXNjdXJyZW50bHlWYWxpZCk7XHJcblxyXG5cdFx0LyoqIEB0eXBlIHtib29sZWFufSAqL1xyXG5cdFx0dGhpcy5tYW5kYXRvcnkgPSBtYW5kYXRvcnk7XHJcblxyXG5cdFx0LyoqIEB0eXBlIHtvYmplY3R9ICovXHJcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xyXG4gICAgICAgIHRoaXMuYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZU5hbWU7XHJcblx0fVxyXG5cclxuXHR2YWxpZGF0ZSh2YWx1ZSl7XHJcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBQcm9wZXJ0eUFjY2Vzc29yLmdldFZhbHVlKHRoaXMubW9kZWwsIHRoaXMuYXR0cmlidXRlTmFtZSkpe1xyXG5cdCAgICBcdHRoaXMudmFsaWQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYgKCF2YWx1ZSAmJiB0aGlzLm1hbmRhdG9yeSkge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSBpZih2YWx1ZSA9PT0gUHJvcGVydHlBY2Nlc3Nvci5nZXRWYWx1ZSh0aGlzLm1vZGVsLCB0aGlzLmF0dHJpYnV0ZU5hbWUpKXtcclxuXHQgICAgXHR0aGlzLnZhbGlkU2lsZW50KCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLmludmFsaWRTaWxlbnQoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59IiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xyXG5pbXBvcnQgeyBPYmplY3RGdW5jdGlvbiwgUHJvcGVydHlBY2Nlc3NvciB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEVxdWFsc1N0cmluZ1ZhbGlkYXRvciBleHRlbmRzIEFic3RyYWN0VmFsaWRhdG9yIHtcclxuXHJcblx0LyoqXHJcblx0ICogXHJcblx0ICogQHBhcmFtIHtib29sZWFufSBtYW5kYXRvcnkgXHJcblx0ICogQHBhcmFtIHtib29sZWFufSBpc2N1cnJlbnRseVZhbGlkIFxyXG5cdCAqIEBwYXJhbSB7T2JqZWN0RnVuY3Rpb259IGNvbXBhcmVkVmFsdWVGdW5jdGlvbiBcclxuXHQgKi9cclxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UsIGNvbnRyb2xWYWx1ZSA9IG51bGwpIHtcclxuXHRcdHN1cGVyKGlzY3VycmVudGx5VmFsaWQpO1xyXG5cclxuXHRcdC8qKiBAdHlwZSB7Ym9vbGVhbn0gKi9cclxuXHRcdHRoaXMubWFuZGF0b3J5ID0gbWFuZGF0b3J5O1xyXG5cclxuICAgICAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cclxuICAgICAgICB0aGlzLmNvbnRyb2xWYWx1ZSA9IGNvbnRyb2xWYWx1ZTtcclxuXHR9XHJcblxyXG5cdHZhbGlkYXRlKHZhbHVlKXtcclxuXHRcdGlmICghdmFsdWUgJiYgdGhpcy5tYW5kYXRvcnkpIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XHJcblx0XHR9IGVsc2UgaWYodmFsdWUgPT09IGNvbnRyb2xWYWx1ZSl7XHJcblx0ICAgIFx0dGhpcy52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy5pbnZhbGlkKCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YWxpZGF0ZVNpbGVudCh2YWx1ZSl7XHJcblx0XHRpZiAoIXZhbHVlICYmIHRoaXMubWFuZGF0b3J5KSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIGlmKHZhbHVlID09PSBjb250cm9sVmFsdWUpe1xyXG5cdCAgICBcdHRoaXMudmFsaWRTaWxlbnQoKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn0iLCJpbXBvcnQgeyBMaXN0LCBPYmplY3RGdW5jdGlvbiB9IGZyb20gXCJjb3JldXRpbF92MVwiO1xyXG5pbXBvcnQgeyBBYnN0cmFjdFZhbGlkYXRvciB9IGZyb20gJy4vYWJzdHJhY3RWYWxpZGF0b3IuanMnXHJcblxyXG5leHBvcnQgY2xhc3MgT3JWYWxpZGF0b3JTZXQgZXh0ZW5kcyBBYnN0cmFjdFZhbGlkYXRvciB7XHJcbiAgICBcclxuICAgIGNvbnN0cnVjdG9yKGlzVmFsaWRGcm9tU3RhcnQgPSBmYWxzZSkge1xyXG4gICAgICAgIHN1cGVyKGlzVmFsaWRGcm9tU3RhcnQpO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdG9yTGlzdCA9IG5ldyBMaXN0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcGFyYW0ge0Fic3RyYWN0VmFsaWRhdG9yfSB2YWxpZGF0b3JcclxuICAgICAqL1xyXG4gICAgd2l0aFZhbGlkYXRvcih2YWxpZGF0b3IpIHtcclxuICAgICAgICB2YWxpZGF0b3Iud2l0aFZhbGlkTGlzdGVuZXIobmV3IE9iamVjdEZ1bmN0aW9uKHRoaXMsIHRoaXMub25lVmFsaWQpKTtcclxuICAgICAgICB2YWxpZGF0b3Iud2l0aEludmFsaWRMaXN0ZW5lcihuZXcgT2JqZWN0RnVuY3Rpb24odGhpcywgdGhpcy5vbmVJbnZhbGlkKSk7XHJcbiAgICAgICAgdGhpcy52YWxpZGF0b3JMaXN0LmFkZCh2YWxpZGF0b3IpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyB2YWxpZFxyXG4gICAgICovXHJcbiAgICBvbmVWYWxpZCgpIHtcclxuICAgICAgICBzdXBlci52YWxpZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT25lIHZhbGlkYXRvciBzYWlkIGl0IHdhcyBpbnZhbGlkXHJcbiAgICAgKi9cclxuICAgIG9uZUludmFsaWQoKSB7XHJcbiAgICAgICAgbGV0IGZvdW5kVmFsaWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnZhbGlkYXRvckxpc3QuZm9yRWFjaCgodmFsdWUscGFyZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKHZhbHVlLmlzVmFsaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgaWYoZm91bmRWYWxpZCkge1xyXG4gICAgICAgICAgICBzdXBlci52YWxpZCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN1cGVyLmludmFsaWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59IiwiaW1wb3J0IHsgUmVnZXhWYWxpZGF0b3IgfSBmcm9tIFwiLi9yZWdleFZhbGlkYXRvci5qc1wiO1xyXG5cclxuY29uc3QgUEFTU1dPUkRfRk9STUFUID0gL14oPz0uKltBLVphLXpdKSg/PS4qP1swLTldKSg/PS4qP1sjPyFAJCVeJiotXSkuezgsfSQvO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBhc3N3b3JkVmFsaWRhdG9yIGV4dGVuZHMgUmVnZXhWYWxpZGF0b3Ige1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1hbmRhdG9yeSA9IGZhbHNlLCBpc2N1cnJlbnRseVZhbGlkID0gZmFsc2UpIHtcclxuICAgICAgICBzdXBlcihtYW5kYXRvcnksIGlzY3VycmVudGx5VmFsaWQsIFBBU1NXT1JEX0ZPUk1BVCk7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IFJlZ2V4VmFsaWRhdG9yIH0gZnJvbSBcIi4vcmVnZXhWYWxpZGF0b3IuanNcIjtcclxuXHJcbmNvbnN0IFBIT05FX0ZPUk1BVCA9IC9eXFwrWzAtOV17Mn1cXHM/KFswLTldXFxzPykqJC87XHJcblxyXG5leHBvcnQgY2xhc3MgUGhvbmVWYWxpZGF0b3IgZXh0ZW5kcyBSZWdleFZhbGlkYXRvciB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobWFuZGF0b3J5ID0gZmFsc2UsIGlzY3VycmVudGx5VmFsaWQgPSBmYWxzZSkge1xyXG4gICAgICAgIHN1cGVyKG1hbmRhdG9yeSwgaXNjdXJyZW50bHlWYWxpZCwgUEhPTkVfRk9STUFUKTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgQWJzdHJhY3RWYWxpZGF0b3IgfSBmcm9tIFwiLi9hYnN0cmFjdFZhbGlkYXRvci5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlcXVpcmVkVmFsaWRhdG9yIGV4dGVuZHMgQWJzdHJhY3RWYWxpZGF0b3Ige1xyXG5cclxuXHRjb25zdHJ1Y3RvcihjdXJyZW50bHlWYWxpZCA9IGZhbHNlLCBlbmFibGVkID0gdHJ1ZSkge1xyXG5cdFx0c3VwZXIoY3VycmVudGx5VmFsaWQsIGVuYWJsZWQpO1xyXG5cdH1cclxuXHJcblx0dmFsaWRhdGUodmFsdWUpe1xyXG5cdFx0aWYodmFsdWUgPT09IFwiXCIpe1xyXG5cdCAgICBcdHRoaXMuaW52YWxpZCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy52YWxpZCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFsaWRhdGVTaWxlbnQodmFsdWUpe1xyXG5cdFx0aWYodmFsdWUgPT09IFwiXCIpe1xyXG5cdCAgICBcdHRoaXMuaW52YWxpZFNpbGVudCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dGhpcy52YWxpZFNpbGVudCgpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcbn1cclxuIl0sIm5hbWVzIjpbIkxvZ2dlciIsIkxPRyIsIkxpc3QiLCJYbWxFbGVtZW50IiwiTWFwIiwiWG1sQ2RhdGEiLCJJbmplY3Rpb25Qb2ludCIsIkRvbVRyZWUiLCJQcm9wZXJ0eUFjY2Vzc29yIiwiT2JqZWN0RnVuY3Rpb24iLCJTaW5nbGV0b25Db25maWciLCJQcm90b3R5cGVDb25maWciXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBRUEsTUFBTSxHQUFHLEdBQUcsSUFBSUEsa0JBQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDOztBQUUxQyxBQUFPLE1BQU0sZUFBZSxDQUFDOzs7Ozs7SUFNekIsT0FBTyxjQUFjLENBQUMsRUFBRSxFQUFFO1FBQ3RCLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUN0Qzs7Ozs7O0lBTUQsT0FBTyxjQUFjLENBQUMsS0FBSyxFQUFFO1FBQ3pCLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7S0FDeEM7Ozs7OztJQU1ELE9BQU8sYUFBYSxDQUFDLElBQUksRUFBRTtRQUN2QixPQUFPLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDO0tBQ3RDOzs7Ozs7O0lBT0QsT0FBTyxlQUFlLENBQUMsU0FBUyxFQUFFLElBQUksRUFB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RixNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSztZQUM1RixJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2xDLEVBQUUsQ0FBQyxLQUFLLEtBQUs7WUFDVixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVCLENBQUMsQ0FBQztLQUNOOztJQUVELElBQUksR0FBRztRQUNILE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSztZQUNoSSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2xDLEVBQUUsQ0FBQyxLQUFLLEtBQUs7WUFDVixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVCLENBQUMsQ0FBQztLQUNOOztJQUVELEdBQUcsR0FBRztRQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSztZQUMvSCxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2xDLEVBQUUsQ0FBQyxLQUFLLEtBQUs7WUFDVixJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVCLENBQUMsQ0FBQztLQUNOOztJQUVELEtBQUssR0FBRztRQUNKLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFD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

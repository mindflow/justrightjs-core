export class Attribute {

    constructor(attribute) {
        this.attribute = attribute;
    }

    get value() {
        return this.attribute.value;
    }

    getName() {
        return this.attribute.name;
    }

    getNamespace() {
        return this.attribute.name;
    }
}
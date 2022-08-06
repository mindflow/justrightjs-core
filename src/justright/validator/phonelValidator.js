import { RegexValidator } from "./regexValidator.js";

export class PhoneValidator extends RegexValidator {

    static get PHONE_FORMAT() { return /^\+[0-9]{2}\s?([0-9]\s?)*$/; }

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, PhoneValidator.PHONE_FORMAT);
    }

}

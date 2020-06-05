import { RegexValidator } from "./regexValidator.js";

const PHONE_FORMAT = /^\+[0-9]{2}[0-9]*$/;

export class PhoneValidator extends RegexValidator {

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, PHONE_FORMAT);
    }

}

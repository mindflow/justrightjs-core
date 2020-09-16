import { RegexValidator } from "./regexValidator.js";

const PHONE_FORMAT = /^\+[0-9]{2}\s?([0-9]\s?)*$/;

export class PhoneValidator extends RegexValidator {

    constructor(mandatory = false, iscurrentlyValid = false) {
        super(mandatory, iscurrentlyValid, PHONE_FORMAT);
    }

}

import { RegexValidator } from "./regexValidator.js";

const EMAIL_FORMAT = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

export class EmailValidator extends RegexValidator {

    constructor(iscurrentlyValid = false) {
        super(iscurrentlyValid, EMAIL_FORMAT);
    }

}

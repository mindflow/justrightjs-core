import { RegexValidator } from "./regexValidator.js";

const PASSWORD_FORMAT = /^(?=.*[A-Za-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

export class PasswordValidator extends RegexValidator {

    constructor(iscurrentlyValid = false) {
        super(iscurrentlyValid, PASSWORD_FORMAT);
    }

}

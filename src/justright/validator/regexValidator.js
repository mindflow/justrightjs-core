import { AbstractValidator } from "./abstractValidator.js";

export class RegexValidator extends AbstractValidator {

    constructor(iscurrentlyValid = false, regex = "(.*)") {
        super(iscurrentlyValid);
        this.regex = regex;
    }

	validate(value){
		if(value && typeof value === "string" && value.match(this.regex)){
	    	this.valid();
		} else {
			this.invalid();
		}
	}

}

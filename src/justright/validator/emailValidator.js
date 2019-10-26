import { AbstractValidator } from "./abstractValidator.js";

const EMAIL_FORMAT = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

export class EmailValidator extends AbstractValidator {

	validate(value){
		if(value && typeof value === "string" && value.match(EMAIL_FORMAT)){
	    	this.valid();
		} else {
			this.invalid();
		}
	}

}

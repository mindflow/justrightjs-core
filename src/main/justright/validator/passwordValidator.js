import { AbstractValidator } from "./abstractValidator.js";

export class PasswordValidator extends AbstractValidator {

	validate(value){
		if(value === ""){
	    	this.invalid();
		} else {
			this.valid();
		}
	}

}

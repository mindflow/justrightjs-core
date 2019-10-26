import { AbstractValidator } from "./abstractValidator.js";

export class RequiredValidator extends AbstractValidator {

	validate(value){
		if(value === ""){
	    	this.invalid();
		} else {
			this.valid();
		}
	}

}

import { AbstractValidator } from "./abstractValidator.js";

export class EqualsValidator extends AbstractValidator {

    constructor(mandatory = false, iscurrentlyValid = false, value = null) {
		super(iscurrentlyValid);
		this.value = value;
		this.mandatory = mandatory;
    }

    setValue(value) {
        this.value = value;
    }

	validate(value){
		if (!value && this.mandatory) {
			this.invalid();
		} else if(value === this.value){
	    	this.valid();
		} else {
			this.invalid();
		}
	}

}
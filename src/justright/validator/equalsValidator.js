import { AbstractValidator } from "./abstractValidator.js";

export class EqualsValidator extends AbstractValidator {

    constructor(iscurrentlyValid = false, value = null) {
		super(iscurrentlyValid);
        this.value = value;
    }

    setValue(value) {
        this.value = value;
    }

	validate(value){
		if(value && value === this.value){
	    	this.valid();
		} else {
			this.invalid();
		}
	}

}
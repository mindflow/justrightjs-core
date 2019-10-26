import { PropertyAccessor, List } from "coreutil_v1";
import { AbstractInputElement } from "../element/abstractInputElement";

export class InputElementDataBinding {

    constructor(model, validator) {
        this.model = model;
        this.validator = validator;
        this.pullers = new List();
        this.pushers = new List();
    }

    static link(model, validator) {
        return new InputElementDataBinding(model, validator);
    }

    /**
     * 
     * @param {AbstractInputElement} field 
     */
    and(field) {
        return this.to(field);
    }

    /**
     * 
     * @param {AbstractInputElement} field 
     */
    to(field) {
        var puller = () => {
            if (field.getValue) {
                PropertyAccessor.setValue(this.model, field.getName(), field.getValue());
            }
            if(this.validator && this.validator.validate){
                this.validator.validate(field.getValue());
            }
        };
        field.attachEvent("onchange", puller);
        field.attachEvent("onkeyup", puller);
        puller.call();

        var pusher = () => {
            var value = PropertyAccessor.getValue(this.model, field.getName());
            if (field.setChecked) {
                field.setChecked(value == field.getValue());
            } else if (field.setValue) {
                field.setValue(value);
            }
        };
        if(!this.model.__changed) {
            this.model.__changed = () => {
                this.push();
            }
        }

        this.pullers.add(puller);
        this.pushers.add(pusher);

        return this;
    }

    pull() {
        this.pullers.forEach((value, parent) => {
            value.call(parent);
            return true;
        }, this);
    }

    push() {
        this.pushers.forEach((value, parent) => {
            value.call(parent);
            return true;
        }, this);
    }
}

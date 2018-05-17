import { Directive, forwardRef, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[appKeepSame]',
  exportAs: 'appKeepSame',
  providers: [{
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => KeepSameDirective),
    multi: true
  }],
})
export class KeepSameDirective implements Validator {
  comp_name: string;
  reverse: boolean;

  @Input("appKeepSame")
  set keep_same(v: string){
    let s: string[] = v.split(';');
    this.comp_name = s[0];
    if(s.length>1)this.reverse=(s[1].trim()==='reverse');
    else this.reverse=false;
  }

  validate(control: AbstractControl): ValidationErrors|null {
    const target = control.root.get(this.comp_name);
    let is_same: boolean|undefined;
    if(target){
      is_same = (control.value === target.value);
    }else is_same=undefined;

    if(this.reverse){
      if(is_same===true){
        if(target.errors){
          delete target.errors["not_same"];
          if(Object.keys(target.errors).length==0)target.setErrors(null);
        }
      }else if(is_same===false){
        target.setErrors({"not_same": true});
      }else{
        //target is null
        //nothing to do
      }
      return null;
    }else{
      if(is_same===true){
        return null;
      }else if(is_same===false){
        return {"not_same": true};
      }else{
        return {"not_same": undefined};
      }
    }
  }
}

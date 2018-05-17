import { Directive, forwardRef, Input } from '@angular/core';

@Directive({
  selector: '[appValidateOn]',
  exportAs: 'appValidateOn',
})
export class ValidateOnDirective {
  @Input("appValidateOn") validate_on_param: string[];

  constructor() { }

}

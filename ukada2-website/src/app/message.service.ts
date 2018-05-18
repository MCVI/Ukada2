import { Injectable } from '@angular/core';

export enum message_type{
  error, warning, success, info
}

@Injectable()
export class MessageService {
  public message_visible: boolean;

  protected current_message_type: message_type;
  protected current_message: string;

  protected message_timer: number;

  constructor() {
    this.message_visible = false;
    this.current_message_type = message_type.error;
    this.current_message = "";
  }

  public info(content: string, duration?: number):void{
    if(duration===undefined)duration=3000;
    this.set_message(message_type.info, content, duration);
  }

  public success(content: string, duration?: number):void{
    if(duration===undefined)duration=3000;
    this.set_message(message_type.success, content, duration);
  }

  public warning(content: string, duration?: number):void{
    if(duration===undefined)duration=3000;
    this.set_message(message_type.warning, content, duration);
  }

  public error(content: string, duration?: number):void{
    if(duration===undefined)duration=5000;
    this.set_message(message_type.error, content, duration);
  }

  public set_message(t: message_type, content: string, duration: number): void{
    this.hide_current_message();
    this.current_message_type = t;
    this.current_message = content;
    this.message_visible = true;
    this.message_timer = setTimeout(() => {
      this.message_visible = false;
    },duration);
  }

  hide_current_message(): void{
    if(this.message_visible){
      clearTimeout(this.message_timer);
      this.message_visible = false;
    }
  }
}

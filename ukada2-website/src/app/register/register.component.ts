import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { SharedService, user_operation_error } from '../shared.service';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  constructor(
    private _shared: SharedService,
    private _message: MessageService,
    private _router: Router
  ) { }

  ngOnInit() {
  }

  private user_register(f: NgForm): void{
    this._shared.user_register(f.value["email"], f.value["password"]).subscribe(
      next => { },
      error => {
        switch(error){
          case user_operation_error.already_exist:
          this._message.error("注册失败：邮箱已经注册");
          break;
          case user_operation_error.network_error:
          this._message.error("注册失败：网络错误");
          break;
          default:
          this._message.error("注册失败：未知错误");
        }
      },
      () => {
        this._shared.user_login(f.value["email"], f.value["password"]).subscribe(
          next => { },
          error => {
            this._message.warning("注册成功：网络不稳定，请手动登录");
            this._router.navigate(["/"]);
          },
          () => {
            this._message.success("注册成功：已自动登录");
            this._router.navigate(["/"]);
          },
        );
      },
    );
  }
}

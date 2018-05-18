import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { SharedService, user_operation_error } from '../shared.service';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(
    private _shared: SharedService,
    private _message: MessageService,
    private _router: Router
  ) { }

  ngOnInit() {
  }

  public user_login(f: NgForm): void{
    this._shared.user_login(f.value["email"], f.value["password"]).subscribe(
      next => { },
      error => {
        switch(error){
          case user_operation_error.network_error:
            this._message.error("登录失败：网络错误");
            break;
          case user_operation_error.not_exist:
            this._message.error("登录失败：用户不存在");
            break;
          case user_operation_error.auth_fail:
            this._message.error("登录失败：密码错误");
            break;
          default:
            this._message.error("登录失败：未知错误");
        };
      },
      () => {
        this._message.success("登录成功");
        this._router.navigate(["/"]);
      },
    );
  }
}

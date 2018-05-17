import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { SharedService, ApplyInfo, user_operation_error } from '../shared.service';
import { MessageService } from '../message.service';

export enum apply_view{
  loading_apply_info, load_apply_info_failed, display_apply_info, edit_apply_info
};

@Component({
  selector: 'app-apply',
  templateUrl: './apply.component.html',
  styleUrls: ['./apply.component.css']
})
export class ApplyComponent implements OnInit {
  apply_view = apply_view;

  current_apply_view: apply_view;
  apply_info: ApplyInfo|null;

  constructor(
    private _shared: SharedService,
    private _message: MessageService,
    private _router: Router
  ) { }

  ngOnInit() {
    this.current_apply_view = apply_view.loading_apply_info;
    this._shared.user_apply_info.subscribe(
      next => {
        if(next instanceof ApplyInfo){
          let info = next;
          this.apply_info = info;
          this.current_apply_view = apply_view.display_apply_info;
        }else{
          let error = next;
          if(error===user_operation_error.not_exist){
            this.apply_info = null;
            this.current_apply_view = apply_view.edit_apply_info;
          }else{
            if(error===user_operation_error.not_logged_in
              ||error===user_operation_error.auth_fail){
                if(error===user_operation_error.not_logged_in){
                  this._message.info("提示：报名前请先注册并登录");
                }else{
                  this._message.warning("自动登录失败：报名前请先登录");
                }
                this._router.navigate(["/login"]);
            }else{
              if(error===user_operation_error.network_error){
                this._message.error("获取报名信息失败：网络错误");
              }else{
                this._message.error("获取报名信息失败：未知错误");
              }
              this.apply_info = undefined;
              this.current_apply_view = apply_view.load_apply_info_failed;
            }
          }
        }
      },
    );
  }

  private switch_to_edit($event) {
    this.current_apply_view = apply_view.edit_apply_info;
  }
}

import { Component, OnInit, Input } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { SharedService, ApplyInfo, user_operation_error } from '../shared.service';
import { MessageService } from '../message.service';
import { apply_view } from '../apply/apply.component';

@Component({
  selector: 'app-user-update-apply-info',
  templateUrl: './user-update-apply-info.component.html',
  styleUrls: ['./user-update-apply-info.component.css']
})
export class UserUpdateApplyInfoComponent implements OnInit {
  @Input("apply_info") apply_info: ApplyInfo;
  @Input("current_view") current_view: apply_view;

  constructor(
    private _shared: SharedService,
    private _message: MessageService,
    private _router: Router
  ) { }

  ngOnInit() { }

  private push_apply(f: NgForm): void{
    this._shared.http_update_user_apply_info(f.value).subscribe(
      next => { },

      error => {
        if(error===user_operation_error.network_error){
          this._message.error("报名信息提交失败：网络错误");
        }else{
          this._message.error("报名信息提交失败：未知错误");
        }
      },
      () => {
        this._message.success("报名信息提交成功：请等待管理员审核");
        this.current_view = apply_view.display_apply_info;
      },
    )
  }

}

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
  @Input("apply_info") apply_info: ApplyInfo|null;

  form_value: object;

  constructor(
    private _shared: SharedService,
    private _message: MessageService,
    private _router: Router
  ) { }

  ngOnInit() {
    const apply_info_keys = ["school", "team_name", "team_leader", "team_member1", "team_member2", "phone", "qq"];
    this.form_value = { };
    if(this.apply_info){
      for(let k of apply_info_keys){
        if((typeof this.apply_info[k]) === "string"){
          this.form_value[k] = this.apply_info[k];
        }else{
          this.form_value[k] = "";
        }
      }
    }else{
      for(let k of apply_info_keys){
        this.form_value[k] = "";
      }
    }
  }

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
      },
    )
  }

}

import { Component, OnInit } from '@angular/core';

import { SharedService, ApplyInfo, user_operation_error } from '../shared.service';
import { MessageService } from '../message.service';

export enum applied_list_view{
  loading, load_failed, public_view, admin_view
};

@Component({
  selector: 'app-applied-list',
  templateUrl: './applied-list.component.html',
  styleUrls: ['./applied-list.component.css']
})
export class AppliedListComponent implements OnInit {
  applied_list_view = applied_list_view;

  current_view: applied_list_view;
  current_page_num: number;
  total_page_num: number;
  apply_info: ApplyInfo[];

  constructor(
    private _shared: SharedService,
    private _message: MessageService,
  ) { }

  ngOnInit() {
    this.current_view = applied_list_view.loading;
    this.current_page_num = 1;
    this.total_page_num = 0;
    this.apply_info = [];

    this._shared.http_get_apply_info_list(this.current_page_num).subscribe(
      next => {
        if(next instanceof Object){
          let obj:{is_admin: boolean, total_page_num: number, list: ApplyInfo[]} = next;
          if(this.current_page_num > obj.total_page_num){
            this.current_page_num = obj.total_page_num;
          }
          this.total_page_num = obj.total_page_num;
          if(obj.is_admin){
            this.current_view = applied_list_view.admin_view;
          }else{
            this.current_view = applied_list_view.public_view;
          }
          this.apply_info = obj.list;
        }else{
          let error = next;
          if(error===user_operation_error.network_error){
            this._message.error("获取报名信息失败：网络错误");
          }else{
            this._message.error("获取报名信息失败：未知错误");
          }
          this.current_view = applied_list_view.load_failed;
        }
      },
    );
  }

}

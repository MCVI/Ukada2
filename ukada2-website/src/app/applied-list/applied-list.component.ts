import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

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
  current_subscription: Subscription;
  available_pages: number[];
  total_page_num: number;
  apply_info: ApplyInfo[];

  constructor(
    private _shared: SharedService,
    private _message: MessageService,
  ) { }

  ngOnInit() {
    this.current_view = applied_list_view.loading;
    this.available_pages = [1];
    this.apply_info = [];
    this.switch_to_page(1);
  }

  private switch_to_page(page_num: number) {
    this.current_page_num = page_num;

    if(this.current_subscription){
      this.current_subscription.unsubscribe();
    }
    this.current_subscription = this._shared.http_get_apply_info_list(this.current_page_num).subscribe(
      next => {
        if(next instanceof Object){
          let obj:{is_admin: boolean, total_page_num: number, list: ApplyInfo[]} = next;
          if(this.current_page_num > obj.total_page_num){
            this.current_page_num = obj.total_page_num;
          }
          this.total_page_num = Math.max(1,obj.total_page_num);
          this.available_pages = [];
          for(let i=1;i<=this.total_page_num;i++){
            this.available_pages.push(i);
          }
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

  private switch_to_previous_page() {
    this.switch_to_page(Math.max(this.current_page_num-1,1));
  }

  private switch_to_next_page() {
    this.switch_to_page(Math.min(this.current_page_num+1,this.total_page_num));
  }
}

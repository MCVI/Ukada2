import { Component, OnInit, Input } from '@angular/core';

import { SharedService, ApplyInfo, user_operation_error } from '../shared.service';
import { MessageService } from '../message.service';
import { apply_view } from '../apply/apply.component';

@Component({
  selector: 'app-user-apply-info',
  templateUrl: './user-apply-info.component.html',
  styleUrls: ['./user-apply-info.component.css']
})
export class UserApplyInfoComponent implements OnInit {
  @Input("apply_info") apply_info: ApplyInfo;
  @Input("current_view") current_view: apply_view;

  constructor(
    private _shared: SharedService,
    private _message: MessageService
  ) { }

  ngOnInit() { }

  update_apply_info() {
    this.current_view = apply_view.edit_apply_info;
  }
}

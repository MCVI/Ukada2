import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

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
  @Output("switch_to_edit") switch_to_edit = new EventEmitter();

  constructor(
    private _shared: SharedService,
    private _message: MessageService
  ) { }

  ngOnInit() { }

  update_apply_info() {
    this.switch_to_edit.emit();
  }
}

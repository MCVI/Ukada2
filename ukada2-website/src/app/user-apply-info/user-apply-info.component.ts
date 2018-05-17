import { Component, OnInit } from '@angular/core';

import { SharedService, user_operation_error } from '../shared.service';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-user-apply-info',
  templateUrl: './user-apply-info.component.html',
  styleUrls: ['./user-apply-info.component.css']
})
export class UserApplyInfoComponent implements OnInit {

  constructor(
    private _shared: SharedService,
    private _message: MessageService
  ) { }

  ngOnInit() { }

}

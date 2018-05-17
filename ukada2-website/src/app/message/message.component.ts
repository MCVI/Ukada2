import { Component, OnInit } from '@angular/core';

import { MessageService, message_type } from '../message.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {
  message_type = message_type;

  constructor(private _message: MessageService) { }

  ngOnInit() {
  }

}

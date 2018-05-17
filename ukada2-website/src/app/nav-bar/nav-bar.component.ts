import { Component, OnInit } from '@angular/core';

import { SharedService, User } from '../shared.service';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {
  user_logged_in: boolean = false;
  user_is_super: boolean = false;
  super_identity_enabled: boolean = false;

  constructor(private _service: SharedService) {
    this._service.user_info.subscribe(
      next => {
        if(next instanceof User){
          let user = next;
          this.user_logged_in = true;
          this.user_is_super = user.is_super;
          this.super_identity_enabled = (user.priv_level==="Super");
        }else{
          this.user_logged_in = false;
          this.user_is_super = false;
          this.super_identity_enabled = false;
        }
      },
    );
  }

  ngOnInit() {
  }

  protected switch_identity(){
    if(!this.super_identity_enabled)this._service.switch_priv_level("Super");
    else this._service.switch_priv_level("Personal");
  }
}

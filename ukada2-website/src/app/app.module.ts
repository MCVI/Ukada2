import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { IntroductionComponent } from './introduction/introduction.component';
import { NavBarComponent } from './nav-bar/nav-bar.component';
import { CONST_ROUTING } from './app.routing';
import { ApplyComponent } from './apply/apply.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { AppliedListComponent } from './applied-list/applied-list.component';
import { SharedService } from './shared.service';
import { MessageComponent } from './message/message.component';
import { MessageService } from './message.service';
import { KeepSameDirective } from './keep-same.directive';
import { ValidateOnDirective } from './validate-on.directive';
import { UserApplyInfoComponent } from './user-apply-info/user-apply-info.component';
import { UserUpdateApplyInfoComponent } from './user-update-apply-info/user-update-apply-info.component';

@NgModule({
  declarations: [
    AppComponent,
    IntroductionComponent,
    NavBarComponent,
    ApplyComponent,
    RegisterComponent,
    LoginComponent,
    AppliedListComponent,
    MessageComponent,
    KeepSameDirective,
    ValidateOnDirective,
    UserApplyInfoComponent,
    UserUpdateApplyInfoComponent
  ],
  imports: [
    NgbModule.forRoot(),
    BrowserModule,
    HttpClientModule,
    FormsModule,
    CONST_ROUTING
  ],
  providers: [SharedService, MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }

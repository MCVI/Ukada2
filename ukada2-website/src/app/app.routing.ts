import { Routes, RouterModule } from '@angular/router';
import { IntroductionComponent } from './introduction/introduction.component';
import { ApplyComponent } from './apply/apply.component';
import { AppliedListComponent } from './applied-list/applied-list.component';
import { RegisterComponent} from './register/register.component';
import { LoginComponent } from './login/login.component';

const MAIN_ROUTES = [
  { path: '', redirectTo:'/introduction', pathMatch: 'full'},
  { path: 'introduction', component: IntroductionComponent },
  { path: 'apply', component: ApplyComponent },
  { path: 'applied-list', component: AppliedListComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent }
];
export const CONST_ROUTING = RouterModule.forRoot(MAIN_ROUTES);

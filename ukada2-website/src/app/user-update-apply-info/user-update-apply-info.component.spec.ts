import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserUpdateApplyInfoComponent } from './user-update-apply-info.component';

describe('UserUpdateApplyInfoComponent', () => {
  let component: UserUpdateApplyInfoComponent;
  let fixture: ComponentFixture<UserUpdateApplyInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserUpdateApplyInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserUpdateApplyInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

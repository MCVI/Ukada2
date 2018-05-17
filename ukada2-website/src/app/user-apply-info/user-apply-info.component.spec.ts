import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserApplyInfoComponent } from './user-apply-info.component';

describe('UserApplyInfoComponent', () => {
  let component: UserApplyInfoComponent;
  let fixture: ComponentFixture<UserApplyInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserApplyInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserApplyInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

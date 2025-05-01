/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { UserRolesComponent } from './Roles.component';

describe('UserRolesComponent', () => {
  let component: UserRolesComponent;
  let fixture: ComponentFixture<UserRolesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserRolesComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

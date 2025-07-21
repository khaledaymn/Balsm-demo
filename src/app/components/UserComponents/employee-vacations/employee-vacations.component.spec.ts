/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { EmployeeVacationsComponent } from './employee-vacations.component';

describe('EmployeeVacationsComponent', () => {
  let component: EmployeeVacationsComponent;
  let fixture: ComponentFixture<EmployeeVacationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmployeeVacationsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EmployeeVacationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

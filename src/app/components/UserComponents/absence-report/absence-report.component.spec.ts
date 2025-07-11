/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AbsenceReportComponent } from './absence-report.component';

describe('AbsenceReportComponent', () => {
  let component: AbsenceReportComponent;
  let fixture: ComponentFixture<AbsenceReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AbsenceReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AbsenceReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

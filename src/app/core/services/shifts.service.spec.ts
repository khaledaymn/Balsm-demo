/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ShiftsService } from './shifts.service';

describe('Service: Shifts', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShiftsService]
    });
  });

  it('should ...', inject([ShiftsService], (service: ShiftsService) => {
    expect(service).toBeTruthy();
  }));
});

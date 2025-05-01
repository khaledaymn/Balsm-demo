/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { BranchService } from './branches.service';

describe('Service: Branches', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BranchService]
    });
  });

  it('should ...', inject([BranchService], (service: BranchService) => {
    expect(service).toBeTruthy();
  }));
});

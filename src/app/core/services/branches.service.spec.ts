/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { BranchesService } from './branches.service';

describe('Service: Branches', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BranchesService]
    });
  });

  it('should ...', inject([BranchesService], (service: BranchesService) => {
    expect(service).toBeTruthy();
  }));
});

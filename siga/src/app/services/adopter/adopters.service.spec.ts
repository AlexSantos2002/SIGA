import { TestBed } from '@angular/core/testing';

import { AdoptersService } from './adopters.service';

describe('AdoptersService', () => {
  let service: AdoptersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdoptersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

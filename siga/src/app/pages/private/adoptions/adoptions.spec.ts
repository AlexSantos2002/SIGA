import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AdoptionService } from '../../../services/adoption/adoption.service';
import { AdoptersService } from '../../../services/adopter/adopters.service';
import { AnimalService } from '../../../services/animal/animal.service';
import { Adoptions } from './adoptions';

describe('Adoptions', () => {
  let component: Adoptions;
  let fixture: ComponentFixture<Adoptions>;
  const adoptionServiceMock = {
    getAll: () => Promise.resolve([]),
    register: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
  };
  const adoptersServiceMock = {
    getAll: () => Promise.resolve([]),
    register: () => Promise.resolve({ id: 'adopter-id' }),
  };
  const animalServiceMock = {
    getAnimalsFromCurrentOrganization: () => Promise.resolve([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adoptions],
      providers: [
        provideRouter([]),
        { provide: AdoptionService, useValue: adoptionServiceMock },
        { provide: AdoptersService, useValue: adoptersServiceMock },
        { provide: AnimalService, useValue: animalServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Adoptions);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

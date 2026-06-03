import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AnimalCareService } from '../../../services/animal-health/animal-care.service';
import { AnimalDewormingService } from '../../../services/animal-health/animal-deworming.service';
import { AnimalVaccineService } from '../../../services/animal-health/animal-vaccine.service';
import { AnimalVetAppointmentService } from '../../../services/animal-health/animal-vet-appointment.service';
import { AnimalService } from '../../../services/animal/animal.service';
import { Care } from './care';

describe('Care', () => {
  let component: Care;
  let fixture: ComponentFixture<Care>;

  const animalServiceMock = {
    getAnimalsFromCurrentOrganization: () => Promise.resolve([]),
  };
  const careServiceMock = {
    getAll: () => Promise.resolve([]),
  };
  const vaccineServiceMock = {
    create: () => Promise.resolve(),
    confirmTaken: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  };
  const dewormingServiceMock = {
    create: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  };
  const vetAppointmentServiceMock = {
    create: () => Promise.resolve(),
    confirmCompleted: () => Promise.resolve(),
    delete: () => Promise.resolve(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Care],
      providers: [
        provideRouter([]),
        { provide: AnimalService, useValue: animalServiceMock },
        { provide: AnimalCareService, useValue: careServiceMock },
        { provide: AnimalVaccineService, useValue: vaccineServiceMock },
        { provide: AnimalDewormingService, useValue: dewormingServiceMock },
        { provide: AnimalVetAppointmentService, useValue: vetAppointmentServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Care);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

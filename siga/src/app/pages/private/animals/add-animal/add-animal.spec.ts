import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AddAnimal } from './add-animal';

describe('AddAnimal', () => {
  let component: AddAnimal;
  let fixture: ComponentFixture<AddAnimal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAnimal],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAnimal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Adopters } from './adopters';

describe('Adopters', () => {
  let component: Adopters;
  let fixture: ComponentFixture<Adopters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adopters],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Adopters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

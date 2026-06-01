import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Animals } from './animals';

describe('Animals', () => {
  let component: Animals;
  let fixture: ComponentFixture<Animals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Animals],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Animals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

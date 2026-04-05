import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Animals } from './animals';

describe('Animals', () => {
  let component: Animals;
  let fixture: ComponentFixture<Animals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Animals],
    }).compileComponents();

    fixture = TestBed.createComponent(Animals);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

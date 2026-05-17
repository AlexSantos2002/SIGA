import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarPrivate } from './navbar-private';

describe('NavbarPrivate', () => {
  let component: NavbarPrivate;
  let fixture: ComponentFixture<NavbarPrivate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarPrivate],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarPrivate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

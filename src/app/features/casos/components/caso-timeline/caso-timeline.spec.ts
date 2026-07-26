import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasoTimeline } from './caso-timeline';

describe('CasoTimeline', () => {
  let component: CasoTimeline;
  let fixture: ComponentFixture<CasoTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasoTimeline],
    }).compileComponents();

    fixture = TestBed.createComponent(CasoTimeline);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

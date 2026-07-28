import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MotivoDialog } from './motivo-dialog';

describe('MotivoDialog', () => {
  let component: MotivoDialog;
  let fixture: ComponentFixture<MotivoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MotivoDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(MotivoDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

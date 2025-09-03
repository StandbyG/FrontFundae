import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjustesRazonablesReportComponent } from '../../dashboard/ajustes-razonables-report.component';

describe('AjustesRazonablesReportComponent', () => {
  let component: AjustesRazonablesReportComponent;
  let fixture: ComponentFixture<AjustesRazonablesReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjustesRazonablesReportComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AjustesRazonablesReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

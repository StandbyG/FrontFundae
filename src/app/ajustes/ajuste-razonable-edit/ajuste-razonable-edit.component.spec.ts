import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjusteRazonableEditComponent } from './ajuste-razonable-edit.component';

describe('AjusteRazonableEditComponent', () => {
  let component: AjusteRazonableEditComponent;
  let fixture: ComponentFixture<AjusteRazonableEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjusteRazonableEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjusteRazonableEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

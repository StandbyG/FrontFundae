import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearVerificacion } from './crear-verificacion';

describe('CrearVerificacion', () => {
  let component: CrearVerificacion;
  let fixture: ComponentFixture<CrearVerificacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearVerificacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearVerificacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

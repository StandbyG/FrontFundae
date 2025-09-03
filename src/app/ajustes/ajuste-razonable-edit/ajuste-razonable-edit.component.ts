import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AjusteRazonableService } from '../../services/ajuste-razonable.service';
import { AjusteRazonable } from '../../core/models/ajuste-razonable.model';
import { AjusteEstadoUpdate } from '../../core/models/AjusteEstadoUpdate';

@Component({
  selector: 'app-ajuste-razonable-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // 👈 2. Usa ReactiveFormsModule en lugar de FormsModule
  ],
  templateUrl: './ajuste-razonable-edit.component.html',
  styleUrls: ['./ajuste-razonable-edit.component.scss'],
})
export class AjusteRazonableEditComponent implements OnInit {
  ajusteForm: FormGroup; // Para manejar los campos editables
  ajusteCompleto: AjusteRazonable | null = null; // Para mostrar la información de solo lectura
  ajusteId: number;
  isLoading = true;
  mensajeExito = '';

  constructor(
    private fb: FormBuilder,
    private ajusteService: AjusteRazonableService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router
  ) {
    // Obtenemos el ID desde la URL de forma segura
    this.ajusteId = Number(this.route.snapshot.paramMap.get('id'));

    // 4. Creamos el formulario solo con los campos que se pueden editar
    this.ajusteForm = this.fb.group({
      estado: ['', Validators.required],
      fechaImplementacion: [''],
    });
  }

  ngOnInit(): void {
    if (!this.ajusteId) {
      console.error('ID de ajuste no encontrado en la URL');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.ajusteService.getAjusteById(this.ajusteId).subscribe((data) => {
      this.ajusteCompleto = data; // Guardamos los datos completos para la vista

      // Llenamos el formulario solo con los datos que se van a editar
      this.ajusteForm.patchValue({
        estado: data.estado,
        fechaImplementacion: data.fechaImplementacion,
      });

      this.isLoading = false;
    });
  }

  onSubmit(): void {
    if (this.ajusteForm.invalid) {
      return;
    }

    // 5. Creamos el objeto de actualización solo con los datos del formulario
    const datosUpdate: AjusteEstadoUpdate = this.ajusteForm.value;

    this.ajusteService
      .updateAjusteEstado(this.ajusteId, datosUpdate)
      .subscribe({
        next: () => {
          this.mensajeExito = 'Estado actualizado con éxito';
          setTimeout(() => {
            this.mensajeExito = '';
            this.router.navigate(['/dashboard']);
          }, 2000);
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          alert('No se pudo actualizar el ajuste.');
        },
      });
  }
  goBack() {
    this.location.back(); // 🔙 Retorna a la página anterior
  }
}

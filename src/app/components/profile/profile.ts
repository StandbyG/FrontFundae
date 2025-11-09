import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../core/services/auth.services';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = true;
  userId: number | null = null;
  successMessage = '';
  errorMessage = '';
  usuario: Usuario | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      idUsuario: [{ value: null, disabled: true }],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      nombreEmpresa: [''],
      ruc: [''],
      sector: [''],
      direccion: [''],
    });
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();

    if (userId) {
      this.userId = userId;
      this.isLoading = true;
      this.usuarioService.getUsuarioById(userId).subscribe({
        next: (usuario) => {
          this.usuario = usuario;
          this.profileForm.patchValue({
            idUsuario: usuario.idUsuario,
            nombre: usuario.nombre || '',
            correo: usuario.correo || '',
            nombreEmpresa: usuario.nombreEmpresa || '',
            ruc: usuario.ruc || '',
            sector: usuario.sector || '',
            direccion: usuario.direccion || '',
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar el perfil', err);
          this.errorMessage =
            'Error al cargar la información del perfil. Por favor, intenta nuevamente.';
          this.isLoading = false;
        },
      });
    } else {
      console.error('No se pudo obtener el ID del usuario desde el token.');
      this.errorMessage = 'No se pudo obtener la información del usuario.';
      this.isLoading = false;
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.userId) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.profileForm.getRawValue();

    // Solo campos editables
    const updatedUsuario: Partial<Usuario> = {
      nombre: (formValue.nombre || '').trim(),
      correo: (formValue.correo || '').trim(),
    };

    if (this.isEmpleador) {
      updatedUsuario.nombreEmpresa = formValue.nombreEmpresa?.trim() || null as any;
      updatedUsuario.ruc = formValue.ruc?.trim() || null as any;
      updatedUsuario.sector = formValue.sector?.trim() || null as any;
      updatedUsuario.direccion = formValue.direccion?.trim() || null as any;
    }

    // Limpia errores previos de 'emailInUse'
    this.correo?.setErrors(null);

    this.usuarioService
      .updateUsuario(this.userId, updatedUsuario as Usuario)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          this.successMessage = '¡Perfil actualizado con éxito!';
          this.usuario = { ...(this.usuario ?? {} as Usuario), ...response };

          // Sincroniza el formulario con lo devuelto por el backend
          this.profileForm.patchValue({
            nombre: this.usuario?.nombre || '',
            correo: this.usuario?.correo || '',
            nombreEmpresa: this.usuario?.nombreEmpresa || '',
            ruc: this.usuario?.ruc || '',
            sector: this.usuario?.sector || '',
            direccion: this.usuario?.direccion || '',
          });
          this.profileForm.markAsPristine();

          setTimeout(() => (this.successMessage = ''), 5000);
        },
        error: (err: HttpErrorResponse) => {
          this.handleApiError(err);

          // Si el correo está en uso, marca el control para mostrar el error en el HTML
          if (this.correo?.hasError('emailInUse')) {
            this.correo.markAsTouched();
          }
          setTimeout(() => (this.errorMessage = ''), 5000);
        },
      });
  }

  // --- Helpers ---

  private handleApiError(err: HttpErrorResponse) {
    // Backend estándar: { timestamp, status, error, message }
    const code = err?.error?.error as string | undefined;
    const msg = err?.error?.message as string | undefined;

    // 409 correo en uso
    if (err.status === 409 || code === 'EMAIL_IN_USE') {
      this.correo?.setErrors({ emailInUse: true });
      this.errorMessage = 'Ese correo ya está en uso.';
      return;
    }

    // 422 validación (si lo habilitas en backend)
    if (err.status === 422 || code === 'VALIDATION_ERROR') {
      this.errorMessage = msg || 'Revisa los campos del formulario.';
      return;
    }

    // Sesión expirada
    if (err.status === 401) {
      this.errorMessage = 'Tu sesión ha expirado. Inicia sesión nuevamente.';
      // this.authService.logout(); this.router.navigate(['/login']);
      return;
    }

    // Otros códigos comunes
    if (err.status === 0)   { this.errorMessage = 'No hay conexión con el servidor.'; return; }
    if (err.status === 403) { this.errorMessage = 'Acceso denegado.'; return; }
    if (err.status === 404) { this.errorMessage = 'Recurso no encontrado.'; return; }
    if (err.status === 500) { this.errorMessage = 'Error del servidor. Inténtalo de nuevo.'; return; }

    // Fallback
    this.errorMessage = msg || 'Ocurrió un error. Inténtalo nuevamente.';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Getters de controles del form
  get nombre()       { return this.profileForm.get('nombre'); }
  get correo()       { return this.profileForm.get('correo'); }
  get nombreEmpresa(){ return this.profileForm.get('nombreEmpresa'); }
  get ruc()          { return this.profileForm.get('ruc'); }
  get sector()       { return this.profileForm.get('sector'); }
  get direccion()    { return this.profileForm.get('direccion'); }

  // ¿Es empleador?
  get isEmpleador(): boolean {
    return (this.usuario?.tipoUsuario || '').toLowerCase() === 'empleador';
  }
}

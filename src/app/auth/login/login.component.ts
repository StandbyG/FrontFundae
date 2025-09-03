import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.services';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {
  // === PROPIEDADES DEL FORMULARIO ===
  correo = '';
  password = '';
  rememberMe = false;
  showPassword = false;

  // === ESTADOS DE LA UI ===
  isLoading = false;
  error = '';
  successMessage = '';

  // === GESTIÓN DE SUSCRIPCIONES ===
  private destroy$ = new Subject<void>();

  // === CONSTANTES DE VALIDACIÓN ===
  private readonly EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly MIN_PASSWORD_LENGTH = 6;

  constructor(private auth: AuthService, private router: Router) {
    this.loadRememberedCredentials();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === MÉTODO PRINCIPAL DE LOGIN ===
  login(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const loginData = {
      correo: this.correo.trim(),
      contraseña: this.password,
    };

    this.auth
      .login(loginData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (res) => {
          this.handleLoginSuccess(res);
        },
        error: (error) => {
          this.handleLoginError(error);
        },
      });
  }

  // === NAVEGACIÓN ===
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToForgotPassword(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/forgot-password']);
  }

  // === UTILIDADES DE UI ===
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // === VALIDACIÓN DEL FORMULARIO ===
  private validateForm(): boolean {
    this.clearMessages();

    if (!this.correo.trim() || !this.password) {
      this.error = 'Por favor ingresa todos los campos';
      return false;
    }

    // Validar formato de email
    if (!this.EMAIL_REGEX.test(this.correo.trim())) {
      this.error = 'Por favor ingresa un correo electrónico válido';
      return false;
    }

    // Validar longitud de contraseña
    if (this.password.length < this.MIN_PASSWORD_LENGTH) {
      this.error = `La contraseña debe tener al menos ${this.MIN_PASSWORD_LENGTH} caracteres`;
      return false;
    }

    return true;
  }

  // === MANEJO DE RESPUESTAS ===
  private handleLoginSuccess(response: any): void {
    // Guardar token
    this.auth.saveToken(response.token);

    // Gestionar credenciales recordadas
    if (this.rememberMe) {
      this.saveCredentials();
    } else {
      this.clearSavedCredentials();
    }

    // Mostrar mensaje de éxito
    this.successMessage = 'Inicio de sesión exitoso. Redirigiendo...';

    // Redirigir con un pequeño delay para mostrar el mensaje
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1000);
  }

  private handleLoginError(error: any): void {
    console.error('Error en login:', error);

    // Mapear errores específicos del backend
    switch (error.status) {
      case 401:
        this.error =
          'Credenciales incorrectas. Verifica tu email y contraseña.';
        break;
      case 429:
        this.error =
          'Demasiados intentos. Espera unos minutos antes de intentar nuevamente.';
        break;
      case 0:
        this.error = 'No se pudo conectar al servidor. Verifica tu conexión.';
        break;
      case 500:
        this.error = 'Error interno del servidor. Intenta más tarde.';
        break;
      default:
        if (error.error?.message) {
          this.error = error.error.message;
        } else if (error.message?.includes('network')) {
          this.error = 'Error de conexión. Revisa tu conexión a internet.';
        } else {
          this.error = 'Credenciales inválidas';
        }
    }
  }

  private loadRememberedCredentials(): void {
    if (typeof localStorage !== 'undefined') {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        this.correo = savedEmail;
        this.rememberMe = true;
      }
    }
  }

  private saveCredentials(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('rememberedEmail', this.correo.trim());
    }
  }

  private clearSavedCredentials(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rememberedEmail');
    }
  }

  private clearMessages(): void {
    this.error = '';
    this.successMessage = '';
  }

  get isFormValid(): boolean {
    return (
      this.correo.trim().length > 0 &&
      this.password.length >= this.MIN_PASSWORD_LENGTH &&
      this.EMAIL_REGEX.test(this.correo.trim())
    );
  }

  get canSubmit(): boolean {
    return this.isFormValid && !this.isLoading;
  }

  getCurrentState() {
    return {
      correo: this.correo,
      hasPassword: !!this.password,
      isLoading: this.isLoading,
      error: this.error,
      isValid: this.isFormValid,
    };
  }
}

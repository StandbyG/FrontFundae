import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize, timer } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../core/services/auth.services';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(-20px)', opacity: 0 }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
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
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly MIN_PASSWORD_LENGTH = 6;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  // === CONTROL DE INTENTOS ===
  private loginAttempts = 0;
  private lockoutUntil: number | null = null;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRememberedCredentials();
    this.checkLockout();
    this.setupAutoLogout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === MÉTODO PRINCIPAL DE LOGIN ===
  login(): void {
    // Verificar lockout
    if (this.isLockedOut()) {
      const remainingTime = this.getRemainingLockoutTime();
      this.error = `Demasiados intentos fallidos. Intenta nuevamente en ${remainingTime}.`;
      return;
    }

    // Validar formulario
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const loginData = {
      correo: this.correo.trim().toLowerCase(),
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
    this.router.navigate(['/reset-password-request']);
  }

  // === UTILIDADES DE UI ===
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // === VALIDACIÓN DEL FORMULARIO ===
  private validateForm(): boolean {
    this.clearMessages();

    // Validar campos vacíos
    if (!this.correo.trim() || !this.password) {
      this.error = 'Por favor completa todos los campos';
      this.focusFirstError();
      return false;
    }

    // Validar formato de email
    if (!this.EMAIL_REGEX.test(this.correo.trim())) {
      this.error = 'Por favor ingresa un correo electrónico válido';
      this.focusFirstError();
      return false;
    }

    // Validar longitud de contraseña
    if (this.password.length < this.MIN_PASSWORD_LENGTH) {
      this.error = `La contraseña debe tener al menos ${this.MIN_PASSWORD_LENGTH} caracteres`;
      return false;
    }

    // Validar caracteres especiales en password (opcional, más seguridad)
    if (this.password.length > 0 && /[<>]/.test(this.password)) {
      this.error = 'La contraseña contiene caracteres no permitidos';
      return false;
    }

    return true;
  }

  // === MANEJO DE RESPUESTAS ===
  private handleLoginSuccess(response: any): void {
    // Resetear intentos fallidos
    this.resetLoginAttempts();

    // Guardar token
    this.auth.saveToken(response.token);

    // Gestionar credenciales recordadas
    if (this.rememberMe) {
      this.saveCredentials();
    } else {
      this.clearSavedCredentials();
    }

    // Mostrar mensaje de éxito
    this.successMessage = '¡Inicio de sesión exitoso! Redirigiendo...';

    // Log para analytics (opcional)
    this.logLoginEvent('success');

    // Redirigir con delay para mostrar mensaje
    timer(1500).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.router.navigate(['/dashboard']);
    });
  }

  private handleLoginError(error: any): void {
    console.error('Error en login:', error);

    // Incrementar intentos fallidos
    this.incrementLoginAttempts();

    // Log para analytics (opcional)
    this.logLoginEvent('error', error.status);

    // Mapear errores específicos del backend
    switch (error.status) {
      case 401:
        this.error = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
        break;
      case 403:
        this.error = 'Tu cuenta está desactivada. Contacta al administrador.';
        break;
      case 429:
        this.error = 'Demasiados intentos. Espera unos minutos antes de intentar nuevamente.';
        this.setLockout();
        break;
      case 0:
        this.error = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
        break;
      case 500:
      case 502:
      case 503:
        this.error = 'Error del servidor. Por favor intenta más tarde.';
        break;
      default:
        if (error.error?.message) {
          this.error = error.error.message;
        } else if (error.message?.toLowerCase().includes('network')) {
          this.error = 'Error de red. Revisa tu conexión a internet.';
        } else {
          this.error = 'Error al iniciar sesión. Intenta nuevamente.';
        }
    }

    // Verificar si debe hacer lockout local
    if (this.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      this.setLockout();
      this.error = `Demasiados intentos fallidos. Intenta nuevamente en ${this.getRemainingLockoutTime()}.`;
    }
  }

  // === CONTROL DE INTENTOS Y LOCKOUT ===
  private incrementLoginAttempts(): void {
    this.loginAttempts++;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('loginAttempts', this.loginAttempts.toString());
    }
  }

  private resetLoginAttempts(): void {
    this.loginAttempts = 0;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('lockoutUntil');
    }
  }

  private setLockout(): void {
    this.lockoutUntil = Date.now() + this.LOCKOUT_DURATION;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lockoutUntil', this.lockoutUntil.toString());
    }
  }

  private checkLockout(): void {
    if (typeof localStorage !== 'undefined') {
      const attempts = localStorage.getItem('loginAttempts');
      const lockout = localStorage.getItem('lockoutUntil');

      if (attempts) {
        this.loginAttempts = parseInt(attempts, 10);
      }

      if (lockout) {
        this.lockoutUntil = parseInt(lockout, 10);
        
        // Verificar si el lockout expiró
        if (Date.now() > this.lockoutUntil) {
          this.resetLoginAttempts();
        }
      }
    }
  }

  private isLockedOut(): boolean {
    if (!this.lockoutUntil) return false;
    return Date.now() < this.lockoutUntil;
  }

  private getRemainingLockoutTime(): string {
    if (!this.lockoutUntil) return '0 minutos';
    
    const remaining = this.lockoutUntil - Date.now();
    const minutes = Math.ceil(remaining / 60000);
    
    if (minutes < 1) return 'menos de 1 minuto';
    return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }

  // === CREDENCIALES RECORDADAS ===
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
      localStorage.setItem('rememberedEmail', this.correo.trim().toLowerCase());
    }
  }

  private clearSavedCredentials(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rememberedEmail');
    }
  }

  // === AUTO LOGOUT (SEGURIDAD) ===
  private setupAutoLogout(): void {
    // Si hay un token pero está expirado, limpiar
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && this.isTokenExpired(token)) {
        this.auth.logout();
      }
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      return Date.now() > exp;
    } catch {
      return true;
    }
  }

  // === UTILIDADES ===
  private clearMessages(): void {
    this.error = '';
    this.successMessage = '';
  }

  private focusFirstError(): void {
    setTimeout(() => {
      const firstError = document.querySelector('.input-wrapper.error input');
      if (firstError instanceof HTMLElement) {
        firstError.focus();
      }
    }, 100);
  }

  private logLoginEvent(type: 'success' | 'error', statusCode?: number): void {
    // Aquí puedes integrar con servicios de analytics
    // Ej: Google Analytics, Mixpanel, etc.
    console.log(`Login ${type}`, { statusCode, timestamp: new Date().toISOString() });
  }

  // === GETTERS PARA TEMPLATE ===
  get isFormValid(): boolean {
    return (
      this.correo.trim().length > 0 &&
      this.password.length >= this.MIN_PASSWORD_LENGTH &&
      this.EMAIL_REGEX.test(this.correo.trim())
    );
  }

  get canSubmit(): boolean {
    return this.isFormValid && !this.isLoading && !this.isLockedOut();
  }

  get remainingAttempts(): number {
    return Math.max(0, this.MAX_LOGIN_ATTEMPTS - this.loginAttempts);
  }

  // === DEBUG (SOLO DESARROLLO) ===
  getCurrentState() {
    return {
      correo: this.correo,
      hasPassword: !!this.password,
      isLoading: this.isLoading,
      error: this.error,
      isValid: this.isFormValid,
      attempts: this.loginAttempts,
      isLockedOut: this.isLockedOut(),
    };
  }
}
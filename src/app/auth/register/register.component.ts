import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, timer } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../core/services/auth.services';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
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
export class RegisterComponent implements OnDestroy {
  // === ESTADOS ===
  exito = false;
  error = '';
  isLoading = false;
  showPassword = false;
  acceptTerms = false;
  esAdministrador = false;
  currentStep: number | null = null;

  // === USUARIO ===
  usuario: Usuario = {
    nombre: '',
    correo: '',
    password: '',
    tipoUsuario: 'empleador',
    nombreEmpresa: '',
    ruc: '',
    sector: '',
    direccion: '',
    estadoCumplimiento: ''
  };

  // === GESTIÓN DE SUSCRIPCIONES ===
  private destroy$ = new Subject<void>();

  // === CONSTANTES ===
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly ADMIN_DOMAIN = '@fundades.com.pe';
  private readonly RUC_REGEX = /^[0-9]{11}$/;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === REGISTRO ===
  registrar(): void {
    // Validaciones
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.error = '';

    // Verificar tipo de usuario
    this.verificarTipoUsuario();

    // Limpiar campos no necesarios según tipo de usuario
    const usuarioData = this.prepareUserData();

    this.auth.register(usuarioData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.handleRegisterSuccess();
        },
        error: (err) => {
          this.handleRegisterError(err);
        }
      });
  }

  // === VERIFICACIÓN DE TIPO DE USUARIO ===
  verificarTipoUsuario(): void {
    const correo = this.usuario.correo.toLowerCase().trim();
    
    if (correo.includes(this.ADMIN_DOMAIN)) {
      this.usuario.tipoUsuario = 'administrador';
      this.esAdministrador = true;
    } else {
      // Mantener el tipo seleccionado por el usuario
      this.esAdministrador = false;
    }
  }

  // === PREPARAR DATOS DEL USUARIO ===
  private prepareUserData(): Usuario {
    const data: Usuario = {
      nombre: this.usuario.nombre.trim(),
      correo: this.usuario.correo.toLowerCase().trim(),
      password: this.usuario.password,
      tipoUsuario: this.usuario.tipoUsuario,
      nombreEmpresa: '',
      ruc: '',
      sector: '',
      direccion: '',
      estadoCumplimiento: ''
    };

    // Solo incluir datos de empresa si es empleador
    if (this.usuario.tipoUsuario === 'empleador') {
      data.nombreEmpresa = this.usuario.nombreEmpresa?.trim() || '';
      data.ruc = this.usuario.ruc?.trim() || '';
      data.sector = this.usuario.sector?.trim() || '';
      data.direccion = this.usuario.direccion?.trim() || '';
      data.estadoCumplimiento = this.usuario.estadoCumplimiento?.trim() || 'pendiente';
    }

    return data;
  }

  // === VALIDACIÓN DEL FORMULARIO ===
  private validateForm(): boolean {
    this.error = '';

    // Validar nombre
    if (!this.usuario.nombre.trim() || this.usuario.nombre.trim().length < 3) {
      this.error = 'El nombre debe tener al menos 3 caracteres';
      this.focusField('nombre');
      return false;
    }

    // Validar correo
    if (!this.usuario.correo.trim()) {
      this.error = 'El correo electrónico es obligatorio';
      this.focusField('correo');
      return false;
    }

    if (!this.EMAIL_REGEX.test(this.usuario.correo.trim())) {
      this.error = 'Por favor ingresa un correo electrónico válido';
      this.focusField('correo');
      return false;
    }

    // Validar contraseña
    if (!this.usuario.password || this.usuario.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      this.focusField('password');
      return false;
    }

    // Validar fortaleza de contraseña
    if (!this.isPasswordStrong()) {
      this.error = 'La contraseña debe incluir letras y números para mayor seguridad';
      return false;
    }

    // Validar tipo de usuario (solo si no es admin automático)
    if (!this.esAdministrador && !this.usuario.tipoUsuario) {
      this.error = 'Por favor selecciona un tipo de cuenta';
      return false;
    }

    // Validar RUC si es empleador y se proporcionó
    if (this.usuario.tipoUsuario === 'empleador' && this.usuario.ruc) {
      if (!this.RUC_REGEX.test(this.usuario.ruc.trim())) {
        this.error = 'El RUC debe tener exactamente 11 dígitos';
        this.focusField('ruc');
        return false;
      }
    }

    // Validar términos y condiciones
    if (!this.acceptTerms) {
      this.error = 'Debes aceptar los términos y condiciones para continuar';
      return false;
    }

    return true;
  }

  // === MANEJO DE RESPUESTAS ===
  private handleRegisterSuccess(): void {
    this.isLoading = false;
    this.exito = true;
    this.error = '';

    // Log para analytics (opcional)
    console.log('Registro exitoso:', {
      tipo: this.usuario.tipoUsuario,
      timestamp: new Date().toISOString()
    });

    // Redireccionar después de 2 segundos
    timer(2000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true', email: this.usuario.correo }
        });
      });
  }

  private handleRegisterError(err: any): void {
    this.isLoading = false;
    this.exito = false;

    console.error('Error al registrar:', err);

    // Mapear errores específicos
    if (err.status === 409) {
      this.error = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
    } else if (err.status === 400) {
      this.error = err.error?.message || 'Datos inválidos. Verifica la información ingresada.';
    } else if (err.status === 0) {
      this.error = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
    } else if (err.status === 500) {
      this.error = 'Error del servidor. Por favor intenta más tarde.';
    } else {
      this.error = err.error?.message || 'Error al registrar el usuario. Intenta nuevamente.';
    }
  }

  // === UTILIDADES ===
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  private focusField(fieldId: string): void {
    setTimeout(() => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.focus();
      }
    }, 100);
  }

  // === PASSWORD STRENGTH ===
  getPasswordStrength(): string {
    const password = this.usuario.password;
    
    if (!password) return '';

    let strength = 0;

    // Longitud
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;

    // Complejidad
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }

  getPasswordStrengthPercent(): number {
    const strength = this.getPasswordStrength();
    
    if (strength === 'weak') return 33;
    if (strength === 'medium') return 66;
    if (strength === 'strong') return 100;
    return 0;
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    
    if (strength === 'weak') return 'Débil';
    if (strength === 'medium') return 'Media';
    if (strength === 'strong') return 'Fuerte';
    return '';
  }

  private isPasswordStrong(): boolean {
    const password = this.usuario.password ?? '';
    
    // Al menos una letra y un número
    return /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  }

  // === GETTERS ===
  get isFormValid(): boolean {
    return (
      this.usuario.nombre.trim().length >= 3 &&
      this.EMAIL_REGEX.test(this.usuario.correo.trim()) &&
      (this.usuario.password?.length ?? 0) >= 6 &&
      this.acceptTerms &&
      (this.esAdministrador || !!this.usuario.tipoUsuario)
    );
  }

  get canSubmit(): boolean {
    return this.isFormValid && !this.isLoading;
  }

  // === DEBUG (SOLO DESARROLLO) ===
  getCurrentState() {
    return {
      nombre: this.usuario.nombre,
      correo: this.usuario.correo,
      tipoUsuario: this.usuario.tipoUsuario,
      esAdministrador: this.esAdministrador,
      isLoading: this.isLoading,
      isValid: this.isFormValid,
      passwordStrength: this.getPasswordStrength(),
    };
  }
}
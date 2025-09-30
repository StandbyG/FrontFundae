import { Component } from '@angular/core';
import { AuthService } from '../core/services/auth.services';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password-request',
  imports: [FormsModule,CommonModule],
  standalone: true,
  templateUrl: './reset-password-request.html',
  styleUrl: './reset-password-request.scss'
})
export class ResetPasswordRequestComponent {
  email: string = ''; // Correo del usuario
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    this.authService.requestPasswordReset(this.email).subscribe({
      next: (response) => {
        this.successMessage = 'Correo de restablecimiento enviado correctamente.';
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = 'No se pudo enviar el correo de restablecimiento.';
        this.successMessage = '';
      }
    });
  }
}

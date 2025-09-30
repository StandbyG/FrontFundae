import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../core/services/auth.services';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule,CommonModule],
  standalone: true,
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordComponent implements OnInit {
  token: string = ''; // Token del enlace
  newPassword: string = ''; // Nueva contraseña
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    // Recuperar el token de la URL
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  onSubmit(): void {
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        this.successMessage = 'Contraseña restablecida correctamente.';
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = 'El token de restablecimiento no es válido o ha expirado.';
        this.successMessage = '';
      }
    });
  }
}
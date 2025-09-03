import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.services';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl:'./register.component.scss'
})
export class RegisterComponent {
  exito=false;
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

  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  registrar() {
    // Verifica el tipo de usuario antes de enviar el registro
    this.verificarTipoUsuario();

    this.auth.register(this.usuario).subscribe({
      next: () => {
        this.exito = true;
        this.error = '';
        // opcional: redireccionar después de 2 segundos
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: () => {
        this.exito = false;
        this.error = 'Error al registrar el usuario.';
      }
    });
  }
  verificarTipoUsuario() {
    const correo = this.usuario.correo.toLowerCase();
    if (correo.includes('@fundae.com.pe')) {
      this.usuario.tipoUsuario = 'administrador';
    } else {
      this.usuario.tipoUsuario = 'empleador';
    }
  }
}

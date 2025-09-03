import { Component, OnInit } from '@angular/core';
import { VerificacionService } from '../services/verificacion.service';  // Asegúrate de que el servicio esté importado correctamente
import { AuthService } from '../core/services/auth.services';  // Servicio para obtener el usuario logueado
import { Router } from '@angular/router';
import { Verificacion } from '../core/models/verificacion.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-verificacion-create',
  standalone: true,
  templateUrl: './crear-verificacion.html',
  styleUrls: ['./crear-verificacion.scss'],
  imports: [FormsModule, CommonModule],
})
export class CrearVerificacionComponent implements OnInit {
  verificacion: Verificacion = {
    fechaVerificacion: '',
    observaciones: '',
    resultado: '',
    usuarioId: 0,  // Se asignará automáticamente con el ID del usuario autenticado
  };  // Modelo para la verificación

  errorMessage: string = '';  // Para mostrar mensajes de error si algo sale mal

  constructor(
    private verificacionService: VerificacionService,
    private authService: AuthService,  // Servicio para obtener el usuario autenticado
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();  // Obtén el userId del usuario autenticado

    if (userId) {
      this.verificacion.usuarioId = userId;  // Asocia el usuarioId automáticamente desde el token
    } else {
      console.error('No se pudo obtener el ID del usuario autenticado');
      this.errorMessage = 'No se pudo obtener el ID del usuario autenticado';
    }
  }

  // Método para crear la verificación
  createVerificacion() {
    // Verifica que el usuarioId sea válido antes de enviar la solicitud
    if (!this.verificacion.usuarioId) {
      this.errorMessage = 'No se ha asociado un usuario válido para la verificación';
      return;
    }

    this.verificacionService.createVerificacion(this.verificacion).subscribe(
      (response) => {
        alert('Verificación creada correctamente');
        this.router.navigate(['/dashboard']);  // Redirige al dashboard o la página que necesites
      },
      (error) => {
        // Manejo de errores para mostrar el mensaje adecuado
        console.error('Error al crear la verificación:', error);
        this.errorMessage = 'Hubo un error al crear la verificación.';
      }
    );
  }
    goToDashboard() {
    this.router.navigate(['/dashboard']); // Redirige al Dashboard
  }
}

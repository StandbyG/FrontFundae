import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../core/services/auth.services';
import { Usuario } from '../../core/models/usuario.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  imports: [CommonModule, FormsModule,ReactiveFormsModule],
  styleUrls: ['./profile.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = true;
  userId: number | null = null;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private authService: AuthService // Servicio para obtener el ID del usuario actual
  ) {
    // Inicializar el formulario
    this.profileForm = this.fb.group({
      idUsuario: [{ value: null, disabled: true }],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      // Agrega aquí otros campos que quieras editar
    });
  }

    ngOnInit(): void {
    // ¡Ahora usas tu método real para obtener el ID!
    const userId = this.authService.getUserId(); // ✅
      
    if (userId) {
      this.isLoading = true;
      this.usuarioService.getUsuarioById(userId).subscribe(usuario => {
        this.profileForm.patchValue(usuario);
        this.isLoading = false;
      });
    } else {
      console.error("No se pudo obtener el ID del usuario desde el token.");
      this.isLoading = false;
      // Opcional: redirigir al login si no hay ID
      // this.authService.logout(); 
    }
  }
  onSubmit(): void {
    if (this.profileForm.invalid || !this.userId) {
    return;
  }

    this.isLoading = true;
    const updatedUsuario = this.profileForm.getRawValue(); // getRawValue() incluye campos deshabilitados como el ID

    this.usuarioService.updateUsuario(this.userId, updatedUsuario).subscribe({
      next: (response) => {
        this.successMessage = '¡Perfil actualizado con éxito!';
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000); // Ocultar mensaje después de 3 segundos
      },
      error: (err) => {
        console.error('Error al actualizar el perfil', err);
        this.isLoading = false;
      }
    });
  }
}
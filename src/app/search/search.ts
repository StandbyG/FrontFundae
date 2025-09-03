import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Usuario } from '../core/models/usuario.model';
import { AuthService } from '../core/services/auth.services';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './search.html',
  styleUrls: ['./search.scss'],
})
export class SearchComponent {
  userId: number | null = null;
  user: Usuario | null = null;
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router,private authService: AuthService) {}

  ngOnInit(): void {
    // Verificar si el usuario es administrador

  }

  searchUserById(): void {
    if (this.userId != null) {
      this.http.get<Usuario>(`http://localhost:8080/api/usuarios/${this.userId}`).subscribe(
        (data) => {
          this.user = data;
        },
        (error) => {
          this.errorMessage = 'Usuario no encontrado';
        }
      );
    } else {
      this.errorMessage = 'Por favor, ingrese un ID válido';
    }
  }
}

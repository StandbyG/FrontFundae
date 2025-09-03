import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../core/models/usuario.model'; // Asegúrate de tener un modelo de Usuario
import { AuthService } from '../core/services/auth.services';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = `${environment.apiUrl}/api/usuarios`; // La URL de tu backend

  constructor(private http: HttpClient,private authService: AuthService) { }
    private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      // Opcional: manejar el caso en que no hay token.
      // Podrías redirigir al login o simplemente devolver cabeceras vacías
      // y dejar que el backend maneje el error 401/403.
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

    // Obtiene un usuario por su ID
  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders() // ✅ Cabeceras añadidas
    });
  }

  // Actualiza un usuario
  updateUsuario(id: number, usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, usuario, {
      headers: this.getAuthHeaders() // ✅ Cabeceras añadidas
    });
  }

  // Si tienes otros métodos que llaman a endpoints protegidos, también debes añadirles las cabeceras.
  // Por ejemplo:
  
  getAllUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl, {
        headers: this.getAuthHeaders() // ✅ Cabeceras añadidas
    });
  }
  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
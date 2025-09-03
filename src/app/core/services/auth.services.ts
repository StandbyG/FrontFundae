import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Usuario } from '../models/usuario.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient, private router: Router) {}

  login(data: { correo: string; contraseña: string }): Observable<{ token: string; role: string }> {
    return this.http.post<{ token: string; role: string }>(`${this.apiUrl}/login`, data);
  }

  register(data: Usuario): Observable<Usuario> {
  const payload = {
    ...data,
    contraseña: data.password  // 🔁 El backend espera "contraseña"
  };
  return this.http.post<Usuario>(`${this.apiUrl}/register`, payload);
}


  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
  return localStorage.getItem('token');  // Recupera el token desde localStorage
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return token != null && !this.jwtHelper.isTokenExpired(token);
  }

  logout() {
    // Eliminar el token de autenticación del almacenamiento local o sessionStorage
    localStorage.removeItem('authToken');  // O cualquier otro método que uses para almacenar el token
    sessionStorage.removeItem('authToken'); // Si usas sessionStorage

    // Redirigir al usuario al login
    this.router.navigate(['/login']);
  }

  getRole(): string | null {
      const token = this.getToken();
  if (!token) return null;

  try {
    const decoded = this.jwtHelper.decodeToken(token);  // Decodificamos el token JWT
    console.log(decoded);  // Verifica el objeto decodificado en la consola
    return decoded?.role || null;  // Asegúrate de que el campo 'role' esté en el token
  } catch (error) {
    console.error('Error al decodificar el token:', error);  // Captura errores si el token no es válido
    return null;
  }
  }

  getUserId(): number | null {
  const token = this.getToken();  // Obtén el token de localStorage
  if (!token) return null;  // Si no hay token, retorna null
  const decoded = this.jwtHelper.decodeToken(token);  // Decodifica el token
  console.log('Contenido del token decodificado:', decoded);  // Para verificar el contenido del token
  return decoded?.userId || null;  // Asegúrate de que `userId` está presente en el token
  }
  decodeToken(token: string) {
  const helper = new JwtHelperService();
  return helper.decodeToken(token);  // Retorna el payload decodificado
}
}

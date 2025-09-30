import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notificacion {
  id: number;
  tipo: string;
  referenciaId: number;
  titulo: string;
  mensaje: string;
  leido: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  private apiUrl = environment.apiUrl;  // URL de la API backend

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token provided');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Obtener notificaciones del empleador
  obtenerNotificaciones(empleadorId: number, leido: boolean = false, page: number = 0, size: number = 10): Observable<any> {
    const url = `${this.apiUrl}/api/notificaciones`;
    const params = new HttpParams()
      .set('empleadorId', empleadorId.toString())  // Asegúrate de que se pase como string
      .set('leido', leido.toString())  // Leído, convertido a string
      .set('page', page.toString())
      .set('size', size.toString());

    const headers = this.getAuthHeaders();  // Incluir el token en las cabeceras
    return this.http.get<any>(url, { headers, params });
  }

  // Marcar notificación como leída
  marcarNotificacionLeida(id: number, empleadorId: number): Observable<void> {
    const url = `${this.apiUrl}/api/notificaciones/${id}/leer`;
    const headers = this.getAuthHeaders();  // Incluir el token en las cabeceras
    return this.http.patch<void>(url, null, { headers, params: { empleadorId: empleadorId.toString() } });
  }
}
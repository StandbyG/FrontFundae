import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // Para leer la URL del backend
import { AuthService } from '../core/services/auth.services';

export interface Feedback {
  id: number;
  ajusteId: number;
  autorAdminId: number;
  calificacion: number;
  comentario: string;
  visibleEmpleador: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  providedIn: 'root',
})
export class FeedbackService {

  private apiUrl = environment.apiUrl;  // URL de la API backend

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Método para obtener los headers con el token JWT
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      // Si no hay token, se podría redirigir al login o manejar el error de alguna forma
      throw new Error('No token provided');
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Crear retroalimentación
  crearFeedback(feedbackData: { ajusteId: number, calificacion: number, comentario: string, visibleEmpleador: boolean }): Observable<Feedback> {
  const adminId = this.authService.getUserId();  // Obtener el adminId desde el token JWT
  const url = `${this.apiUrl}/api/feedback`;
  const headers = this.getAuthHeaders();  // Incluir el token en las cabeceras

  // Pasar adminId como parámetro en la URL
  const params = { adminId: adminId?.toString() || '' };

  return this.http.post<Feedback>(url, feedbackData, { headers, params });
}

  obtenerFeedbacks(page: number = 0, size: number = 10, soloVisibles: boolean = true): Observable<any> {
    const empleadorId = this.authService.getUserId();
    if (!empleadorId) {
      throw new Error('Empleador ID no encontrado en el token');
    }

    const url = `${this.apiUrl}/api/feedback/mios`;
    const params = new HttpParams()
      .set('empleadorId', empleadorId.toString())
      .set('page', page.toString())
      .set('size', size.toString())
      .set('soloVisibles', soloVisibles.toString());

    const headers = this.getAuthHeaders();
    console.log('Fetching feedbacks with params:', { empleadorId, page, size, soloVisibles });
    return this.http.get<any>(url, { headers, params });
  }

  // Obtener detalle de un feedback
  obtenerFeedbackDetalle(id: number): Observable<Feedback> {
    const empleadorId = this.authService.getUserId();  // Obtener el empleadorId desde el token JWT
    if (!empleadorId) {
      throw new Error('Empleador ID no encontrado en el token');
    }

    const url = `${this.apiUrl}/api/feedback/${id}`;
    const headers = this.getAuthHeaders();  // Incluir el token en las cabeceras
    return this.http.get<Feedback>(url, { headers, params: { empleadorId: empleadorId.toString() } });
  }

  // Marcar notificación como leída
  marcarNotificacionLeida(id: number): Observable<void> {
    const empleadorId = this.authService.getUserId();  // Obtener el empleadorId desde el token JWT
    if (!empleadorId) {
      throw new Error('Empleador ID no encontrado en el token');
    }

    const url = `${this.apiUrl}/api/notificaciones/${id}/leer`;
    
    const headers = this.getAuthHeaders();  // Incluir el token en las cabeceras
    return this.http.patch<void>(url, null, { headers, params: { empleadorId: empleadorId.toString() } });
  }

  // Obtener notificaciones del empleador
  obtenerNotificaciones(leido: boolean = false, page: number = 0, size: number = 10): Observable<any> {
    const empleadorId = this.authService.getUserId();  // Obtener el empleadorId desde el token JWT
    if (!empleadorId) {
      throw new Error('Empleador ID no encontrado en el token');
    }

    const url = `${this.apiUrl}/api/notificaciones`;
    
    const params = new HttpParams()
      .set('empleadorId', empleadorId.toString())
      .set('leido', leido.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    const headers = this.getAuthHeaders();  // Incluir el token en las cabeceras
    console.log('Fetching notifications with params:', { empleadorId, leido, page, size });
    return this.http.get<any>(url, { headers, params });
  }
}
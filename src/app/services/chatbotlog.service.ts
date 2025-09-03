import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../core/services/auth.services';
import { ChatbotLog } from '../core/models/chatbot-log.model';
import { ChatbotLogCreate } from '../core/models/chatbot-log-create';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ChatbotLogService {
  private apiUrl = `${environment.apiUrl}/api/chatbot-logs`;

  constructor(private http: HttpClient, private authService: AuthService) {}
  
  // Función centralizada para obtener las cabeceras
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // MÉTODO CORREGIDO
  guardarConversacion(pregunta: string, respuesta: string): Observable<ChatbotLog> {
    const usuarioId = this.authService.getUserId();
    if (!usuarioId) {
      throw new Error('Usuario no autenticado, no se puede guardar el log.');
    }

    // Usa la nueva interfaz para el payload
    const payload: ChatbotLogCreate = {
      pregunta,
      respuesta,
      usuarioId
    };

    return this.http.post<ChatbotLog>(this.apiUrl, payload, { headers: this.getAuthHeaders() });
  }
  
  getAllLogs(): Observable<ChatbotLog[]> {
    return this.http.get<ChatbotLog[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  getLogsByUsuarioId(usuarioId: number): Observable<ChatbotLog[]> {
    return this.http.get<ChatbotLog[]>(`${this.apiUrl}/usuario/${usuarioId}`, { headers: this.getAuthHeaders() });
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../core/services/auth.services';
import { AjusteRazonable } from '../core/models/ajuste-razonable.model';
import { AjusteRazonableCreate } from '../core/models/ajuste-razonable-create.model';
import { AjusteEstadoUpdate } from '../core/models/AjusteEstadoUpdate';
import { environment } from '../../environments/environment';
import { AjusteRazonableOngCreate } from '../core/models/ajuste-razonable-ong-create.model';

@Injectable({
  providedIn: 'root',
})
export class AjusteRazonableService {
  private apiUrl = `${environment.apiUrl}/api/ajustes`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getAllAjustes(): Observable<any[]> {
    return this.http
      .get<any[]>(this.apiUrl, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap({
          next: (data) => {
            console.log(
              '🔵 Servicio getAllAjustes - Total ajustes recibidos del backend:',
              data?.length || 0
            );
            if (data && data.length > 0) {
              console.log('🔵 Primeros 3 ajustes:', data.slice(0, 3));
              console.log(
                '🔵 Estados de los ajustes:',
                data.map((a) => a.estado)
              );
            }
          },
          error: (error) => {
            console.error('🔴 Error en getAllAjustes:', error);
          },
        })
      );
  }

  getAjusteById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  createAjustesBulk(ajustes: AjusteRazonableCreate[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-bulk`, ajustes, {
      headers: this.getAuthHeaders(),
    });
  }

  // Función para obtener los ajustes razonables
  getAjustes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  // Función para obtener el token en las cabeceras
  private getAuthHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // Obtener ajustes por usuarioId y estado
  getAjustesByUsuarioIdAndEstado(
    usuarioId: number,
    estado: string
  ): Observable<AjusteRazonable[]> {
    return this.http.get<AjusteRazonable[]>(
      `${this.apiUrl}/usuario/${usuarioId}/estado/${estado}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  updateAjuste(id: number, ajuste: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, ajuste, {
      headers: this.getAuthHeaders(),
    });
  }

  getAjustesByUsuarioId(usuarioId: number): Observable<AjusteRazonable[]> {
    return this.http.get<AjusteRazonable[]>(
      `${this.apiUrl}/usuario/${usuarioId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  deleteAjuste(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }
  getAjustesByEstado(estado: string): Observable<AjusteRazonable[]> {
    return this.http.get<AjusteRazonable[]>(`${this.apiUrl}/estado/${estado}`, {
      headers: this.getAuthHeaders(),
    });
  }
  createAjuste(ajuste: AjusteRazonableCreate): Observable<any> {
    // 👈 Usa la nueva interfaz
    return this.http.post<any>(this.apiUrl + '/create', ajuste, {
      headers: this.getAuthHeaders(),
    });
  }
  updateAjusteEstado(
    id: number,
    datos: AjusteEstadoUpdate
  ): Observable<AjusteRazonable> {
    // Ahora llama al endpoint PATCH
    return this.http.patch<AjusteRazonable>(`${this.apiUrl}/${id}`, datos, {
      headers: this.getAuthHeaders(),
    });
  }
  createAjusteOng(payload: AjusteRazonableOngCreate) {
    return this.http.post<any>(this.apiUrl + '/ong', payload, {
      headers: this.getAuthHeaders(),
    });
  }
}

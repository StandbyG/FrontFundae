import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReporteCumplimientoDTO {
  totalPendientes?: number;
  totalImplementados?: number;
  totalRechazados?: number;
  porcentajePendientes?: number;
  porcentajeImplementados?: number;
  porcentajeRechazados?: number;
}

export interface ReporteVencidosDTO {
  fechaCorte: string
  totalVencidos: number;
  totalPendientes: number;
  totalImplementados: number;
  totalRechazados: number;
}

export interface ReporteTiemposDTO {

  promedioDiasEvaluacion?: number;
  promedioDiasImplementacion?: number;
  medianaDiasEvaluacion?: number;
  medianaDiasImplementacion?: number;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  // Cambia esta base si en tu env es diferente:
  private baseUrl = `${this.apiUrl}/api/reportes`;

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }

  private makeParams(q: Record<string, any>): HttpParams {
    let p = new HttpParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        p = p.set(k, String(v));
      }
    });
    return p;
  }

  cumplimiento(opts: { usuarioId?: number; empresa?: string; desde?: string; hasta?: string } = {}): Observable<ReporteCumplimientoDTO> {
    return this.http.get<ReporteCumplimientoDTO>(
      `${this.baseUrl}/cumplimiento`,
      { headers: this.authHeaders(), params: this.makeParams(opts) }
    );
  }

  vencidos(opts: { usuarioId?: number; empresa?: string; fechaCorte?: string } = {}): Observable<ReporteVencidosDTO> {
    return this.http.get<ReporteVencidosDTO>(
      `${this.baseUrl}/vencidos`,
      { headers: this.authHeaders(), params: this.makeParams(opts) }
    );
  }

  tiempos(opts: { usuarioId?: number; empresa?: string; desde?: string; hasta?: string } = {}): Observable<ReporteTiemposDTO> {
    return this.http.get<ReporteTiemposDTO>(
      `${this.baseUrl}/tiempos`,
      { headers: this.authHeaders(), params: this.makeParams(opts) }
    );
  }
}

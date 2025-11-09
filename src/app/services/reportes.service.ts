import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

// Lo que la UI usa (mantengo tus nombres)
export interface ReporteCumplimientoDTO {
  totalPendientes?: number;
  totalImplementados?: number;
  totalRechazados?: number;
  porcentajePendientes?: number;
  porcentajeImplementados?: number;
  porcentajeRechazados?: number;
  total?: number; // opcional, por si quieres mostrarlo luego
}

export interface ReporteVencidosDTO {
  fechaCorte: string;
  totalVencidos: number;
  totalPendientes: number;
  totalImplementados: number;
  totalRechazados: number;
}

export interface ReporteTiemposDTO {
  promedioDiasImplementacion?: number;
  p50Dias?: number;
  p90Dias?: number;
}

type BackendCumplimiento = {
  total: number;
  pendientes: number;
  implementado: number;
  rechazados: number;
  porcentajeImplementado: number;
};

type BackendTiempos = {
  promedioDiasImplementacion: number | null;
  p50Dias: number | null;
  p90Dias: number | null;
};

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private baseUrl = `${this.apiUrl}/api/reportes`;

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private makeParams(q: Record<string, any>): HttpParams {
    let p = new HttpParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    });
    return p;
  }

  private round2(n: number) {
    return Math.round(n * 100) / 100;
  }

  cumplimiento(opts: { usuarioId?: number; empresa?: string; desde?: string; hasta?: string } = {}): Observable<ReporteCumplimientoDTO> {
    return this.http
      .get<BackendCumplimiento>(`${this.baseUrl}/cumplimiento`, {
        headers: this.authHeaders(),
        params: this.makeParams(opts),
      })
      .pipe(
        map((b) => {
          const total = b.total || 0;
          const p = b.pendientes || 0;
          const i = b.implementado || 0;
          const r = b.rechazados || 0;
          const pctImpl = typeof b.porcentajeImplementado === 'number' ? b.porcentajeImplementado : (total ? (i * 100) / total : 0);

          const pctPend = total ? (p * 100) / total : 0;
          const pctRech = total ? (r * 100) / total : 0;

          return {
            total,
            totalPendientes: p,
            totalImplementados: i,
            totalRechazados: r,
            porcentajeImplementados: this.round2(pctImpl),
            porcentajePendientes: this.round2(pctPend),
            porcentajeRechazados: this.round2(pctRech),
          };
        })
      );
  }

  vencidos(opts: { usuarioId?: number; empresa?: string; fechaCorte?: string } = {}): Observable<ReporteVencidosDTO> {
    return this.http.get<ReporteVencidosDTO>(`${this.baseUrl}/vencidos`, {
      headers: this.authHeaders(),
      params: this.makeParams(opts),
    });
  }

  tiempos(opts: { usuarioId?: number; empresa?: string; desde?: string; hasta?: string } = {}): Observable<ReporteTiemposDTO> {
    return this.http
      .get<BackendTiempos>(`${this.baseUrl}/tiempos`, {
        headers: this.authHeaders(),
        params: this.makeParams(opts),
      })
      .pipe(
        map((b) => ({
          promedioDiasImplementacion: b?.promedioDiasImplementacion ?? undefined,
          p50Dias: b?.p50Dias ?? undefined,
          p90Dias: b?.p90Dias ?? undefined,
        }))
      );
  }
}

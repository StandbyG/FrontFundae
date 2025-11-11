import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReportesService,
  ReporteVencidosDTO,
} from '../services/reportes.service';
import { UserSelectComponent } from '../user-select/user-select.component';
import { Usuario } from '../core/models/usuario.model';

@Component({
  standalone: true,
  selector: 'app-reporte-vencidos',
  imports: [CommonModule, FormsModule, UserSelectComponent],
  template: `
    <div class="card">
      <div class="header">
        <h2>Vencidos</h2>
        <div class="actions">
          <button type="button" (click)="exportCSV()">Exportar CSV</button>
        </div>
      </div>

      <form class="filters sticky" (ngSubmit)="load()">
        <app-user-select
          [(value)]="usuarioId"
          (userChange)="onUserChange($event)"
          label="Usuario"
        ></app-user-select>

        <label>Empresa
          <input type="text" [(ngModel)]="empresa" name="empresa" placeholder="FUNDAE" />
        </label>

        <label>Fecha corte
          <input type="date" [(ngModel)]="fechaCorte" name="fechaCorte" />
        </label>

        <button type="submit">Consultar</button>
      </form>

      <div *ngIf="loading()" class="skeleton">
        <div class="skeleton-row"></div>
      </div>
      <div *ngIf="error()" class="banner error" aria-live="polite">{{ error() }}</div>

      <ng-container *ngIf="!loading() && data()">
        <div class="chips" *ngIf="(empresa || usuarioId || fechaCorte)">
          <span *ngIf="usuarioId" class="chip">Usuario: {{usuarioId}}</span>
          <span *ngIf="empresa" class="chip">Empresa: {{empresa}}</span>
          <span *ngIf="fechaCorte" class="chip">Fecha corte: {{fechaCorte}}</span>
          <span class="chip light">Actualizado: {{ lastUpdated | date:'short' }}</span>
        </div>

        <div class="kpis">
          <div class="kpi" [class.danger]="isRisky()" [class.neutral]="!isRisky()">
            <div class="kpi-label">Vencidos a {{data()?.fechaCorte}}</div>
            <div class="kpi-value">{{ data()?.totalVencidos }}</div>
          </div>
        </div>

        <table class="table">
          <tr><th>Vencidos</th><td class="danger-text">{{ data()?.totalVencidos }}</td></tr>
          <tr><th>Pendientes</th><td>{{ data()?.totalPendientes }}</td></tr>
          <tr><th>Implementados</th><td>{{ data()?.totalImplementados }}</td></tr>
          <tr><th>Rechazados</th><td>{{ data()?.totalRechazados }}</td></tr>
          <tr>
            <th>Total</th>
            <td>
              {{
                (data()?.totalVencidos||0) +
                (data()?.totalPendientes||0) +
                (data()?.totalImplementados||0) +
                (data()?.totalRechazados||0)
              }}
            </td>
          </tr>
        </table>

        <p class="insight">
          Tip: si “Vencidos” &gt; 0 prioriza estas solicitudes; revisa recordatorios y plazos internos.
        </p>
      </ng-container>

      <div *ngIf="!loading() && !data()" class="empty">
        No hay datos para los filtros seleccionados.
      </div>
    </div>
  `,
  styles: [`
    .card{padding:16px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
    .actions button{padding:8px 12px;border-radius:8px;border:1px solid #ddd;background:#f7f7f7;cursor:pointer}
    .filters.sticky{position:sticky;top:0;background:#fff;z-index:1;padding-bottom:8px;margin-bottom:12px;border-bottom:1px solid #eee;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:end}
    .filters label{display:flex;flex-direction:column;gap:6px;font-size:14px}
    .banner.error{background:#fee;border:1px solid #f88;color:#a00;padding:8px;border-radius:8px;margin:8px 0}
    .skeleton .skeleton-row{height:16px;background:linear-gradient(90deg,#eee,#f6f6f6,#eee);margin:8px 0;border-radius:6px}
    .chips{display:flex;gap:8px;margin:8px 0;flex-wrap:wrap}
    .chip{padding:4px 8px;border-radius:999px;background:#f2f2f2;border:1px solid #e6e6e6;font-size:12px}
    .chip.light{background:#fafafa}
    .kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0}
    .kpi{padding:12px;border-radius:12px;border:1px solid #eee;background:#fafafa}
    .kpi.neutral{border-color:#eee}
    .kpi.danger{border-color:#ffb3b3;background:#fff0f0}
    .kpi-label{font-size:12px;color:#666}
    .kpi-value{font-size:22px;font-weight:700;margin-top:4px}
    .table{width:100%;border-collapse:collapse;margin-top:12px}
    .table th,.table td{padding:8px;border-bottom:1px solid #eee;text-align:left}
    .danger-text{color:#b91c1c;font-weight:600}
    .empty{color:#777;text-align:center;padding:16px}
    .insight{color:#4d4d4d;font-size:13px;margin-top:8px}
  `],
})
export class ReporteVencidosComponent {
  private api = inject(ReportesService);

  usuarioId?: number;
  empresa = '';
  fechaCorte = new Date().toISOString().slice(0, 10);

  data = signal<ReporteVencidosDTO | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  lastUpdated: Date | null = null;

  ngOnInit() { this.load(); }

  onUserChange(user: Usuario | null) {
    this.empresa = user?.nombreEmpresa ?? '';
  }

  load() {
    this.loading.set(true);
    this.error.set(null);

    if (!this.empresa || !this.fechaCorte) {
      this.error.set('No se pudo generar el reporte, se requiere empresa o fecha de corte.');
      this.loading.set(false);
      return;
    }

    this.api.vencidos({
      usuarioId: this.usuarioId,
      empresa: this.empresa?.trim() || undefined,
      fechaCorte: this.fechaCorte || undefined,
    })
    .subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); this.lastUpdated = new Date(); },
      error: () => { this.error.set('No se pudo cargar el reporte'); this.loading.set(false); },
    });
  }

  isRisky() {
    return (this.data()?.totalVencidos || 0) > 0;
  }

  exportCSV() {
    const d = this.data();
    if (!d) return;
    const total = (d.totalVencidos||0)+(d.totalPendientes||0)+(d.totalImplementados||0)+(d.totalRechazados||0);
    const rows = [
      ['FechaCorte','Vencidos','Pendientes','Implementados','Rechazados','Total'],
      [d.fechaCorte, d.totalVencidos, d.totalPendientes, d.totalImplementados, d.totalRechazados, total]
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'reporte_vencidos.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
